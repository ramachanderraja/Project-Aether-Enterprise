/**
 * Sales Performance Supervisor Graph
 *
 * Architecture:
 *   User Query → Router Node (LLM classification) → Sub-Agent (1 of 4)
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  SUPERVISOR (Router + Dispatch)              │
 *   │  → classifies query into tab                 │
 *   │  → emits { type: 'route', content: tab }     │
 *   │  → delegates to the matching sub-agent       │
 *   └──────────────────┬──────────────────────────┘
 *                      │
 *       ┌──────────────┼──────────────┬──────────────┐
 *       ↓              ↓              ↓              ↓
 *    Overview      Forecast       Pipeline        YoY
 *     Agent       Deep Dive       Movement     Performance
 *    (8 tools)     Agent          Agent          Agent
 *                 (5 tools)      (2 tools)      (2 tools)
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createReactAgent } = require('@langchain/langgraph/prebuilt');

import { HumanMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { AgUiEvent } from '../../streaming/agui-events';

// ── Route classification ──

export type SalesTab = 'overview' | 'forecast' | 'pipeline' | 'yoy';

export interface RouteDecision {
  tab: SalesTab;
  tabLabel: string;
  tabIndex: number;
  reason: string;
}

const TAB_LABELS: Record<SalesTab, { label: string; index: number }> = {
  overview:  { label: 'Overview',            index: 0 },
  forecast:  { label: 'Forecast Deep Dive',  index: 1 },
  pipeline:  { label: 'Pipeline Movement',   index: 2 },
  yoy:       { label: 'YoY Performance',     index: 3 },
};

const ROUTER_SYSTEM_PROMPT = `You are a sales-query router. Given a user message (and optional conversation history), classify which Sales Performance screen tab should handle the question.

Reply with ONLY a JSON object — no markdown, no explanation:
{"tab": "<tab_key>", "reason": "User is asking about <brief topic, max 6 words>"}

Tab keys and when to choose each:

1. "overview" — KPI cards (Closed ACV, Forecast ACV, YoY Growth, Conversion Rate), forecast by quarter chart, sales funnel, key deals in pipeline table, closed ACV deals table. Choose this for:
   - General sales performance questions
   - KPI / high-level metrics questions
   - Questions about closed deals or the deal pipeline funnel
   - "How are we doing?" / summary questions

2. "forecast" — Regional performance, forecast trend line, sub-category forecast table, AI scenario forecasts, Monte Carlo. Choose this for:
   - Regional comparisons ("How is APAC doing?")
   - Forecast trends over time
   - Product sub-category breakdowns
   - Scenario analysis / Monte Carlo simulation
   - "What will we close?" / prediction questions

3. "pipeline" — Pipeline waterfall (starting → new → increased → decreased → won → lost → ending), deal movements, lost deals, pipeline by sub-category. Choose this for:
   - Pipeline changes month-over-month
   - Waterfall / bridge questions
   - New deals added, lost deals
   - "What happened to the pipeline?" questions

4. "yoy" — Sales rep performance table, monthly attainment heatmap, top performers chart, pipeline coverage chart. Choose this for:
   - Individual rep performance
   - Team comparisons
   - Attainment / quota questions
   - Top/bottom performers
   - Heatmap / monthly breakdown by rep

If the query is ambiguous or could span multiple tabs, pick the MOST relevant one. If it's a follow-up question, consider the conversation context to route to the same tab.`;

function parseRouteResponse(content: string): RouteDecision {
  try {
    // Extract JSON from content (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);
    const tab = (parsed.tab || 'overview') as SalesTab;
    const reason = parsed.reason || '';

    if (!TAB_LABELS[tab]) {
      return { tab: 'overview', tabLabel: 'Overview', tabIndex: 0, reason: 'Defaulting to Overview' };
    }

    return {
      tab,
      tabLabel: TAB_LABELS[tab].label,
      tabIndex: TAB_LABELS[tab].index,
      reason,
    };
  } catch {
    return { tab: 'overview', tabLabel: 'Overview', tabIndex: 0, reason: 'Could not parse route, defaulting to Overview' };
  }
}

// ── Date context helper ──

function getDateContext(): string {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `

## Current Date Context
- Today: ${now.toISOString().split('T')[0]}
- Current year: ${year}
- Current quarter: Q${quarter}
- Current month: ${monthNames[now.getMonth()]}
- Previous year: ${year - 1}

## Smart Date Inference (CRITICAL — apply BEFORE calling any tool)
- "this year" / "current year" / no year mentioned → ALWAYS pass year: ["${year}"]
- "last year" / "previous year" → pass year: ["${year - 1}"]
- "this quarter" → pass quarter: ["Q${quarter}"]
- "this month" → pass month: ["${monthNames[now.getMonth()]}"]
- If the user does NOT specify any year at all, DEFAULT to year: ["${year}"] — always assume current year.
- NEVER pass empty filters ({}) to any tool. At minimum, always include the current year.`;
}

// ── Sub-agent prompts ──

const SUB_AGENT_PROMPTS: Record<SalesTab, string> = {
  overview: `You are the Sales Overview Analyst. You answer questions about the Sales Performance Overview tab.

Your screen shows:
- KPI Cards: Closed ACV (YTD), Weighted Pipeline ACV, Forecast ACV, YoY Growth %, Conversion Rate, Sales Velocity
- Forecast by Quarter chart (Q1-Q4: Actual, Forecast, Previous Year)
- Sales Funnel (deal count and value by stage)
- Key Deals in Pipeline table (top active deals)
- Closed ACV Deals table (with sub-category breakdown)

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, quarter, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **quarter**: e.g. ["Q1","Q2"] — filter to quarter(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **logoType**: e.g. ["New Logo","Upsell"] — deal types: New Logo, Upsell, Cross-Sell, Extension
- **revenueType**: "License", "Implementation", or "All"

## Tool Guide
- \`get_overview_kpis\`: Returns Closed ACV, Weighted Pipeline, Forecast ACV, YoY Growth, Conversion Rate, Avg Deal Size, Sales Cycle
- \`get_overview_funnel\`: Returns deal count and value by pipeline stage
- \`get_overview_key_deals\`: Returns top active deals with UNWEIGHTED values (unweightedValue, unweightedLicenseValue, unweightedImplementationValue). Deals with $0 value are auto-excluded. When user asks about license values/ACV, pass revenueType="License" so only deals with license value > $0 are returned. Display unweightedLicenseValue as "License ACV" (NOT the weighted licenseValue field). Supports sortField, sortDirection, limit.
- \`get_overview_closed_deals\`: Returns closed deals with License/Implementation ACV, logo type, sub-category breakdown
- \`get_forecast_by_quarter\`: Returns Q1-Q4 Actual vs Forecast vs Previous Year
- \`get_deals\`: Paginated deal list (stage, risk_level filters)
- \`get_deal_by_id\`: Single deal details
- \`get_at_risk_deals\`: Medium/high risk deals

Rules:
1. ALWAYS call tools before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. Examples: 23108402 → $23.11M, 8624092 → $8.62M, 814701 → $0.81M, 340600 → $0.34M, 50000 → $0.05M. NEVER output raw numbers like 23,108,402 or 8,624,092. This applies to EVERY dollar value in your response — KPIs, tables, bullet points, everywhere.
3. Use markdown tables for deal lists.
4. Provide insights, not just data — tell the user what's good, concerning, and actionable.
5. When the user asks about "license value", "license ACV", or license-specific data, pass revenueType="License" to the tool. For implementation questions, pass revenueType="Implementation".
6. For key deals, ALWAYS use the unweighted values (unweightedLicenseValue, unweightedImplementationValue, unweightedValue) in your response — these are the true deal values before probability adjustment. Never display the weighted licenseValue/implementationValue fields as "License ACV".
7. **CLARIFICATION REQUIRED**: When the user asks about "ACV" (Closed ACV, Forecast ACV, etc.) WITHOUT specifying whether they want License, Implementation, or All (combined), you MUST ask the user BEFORE calling any tool: "Would you like to see: **All ACV** (License + Implementation combined), **License ACV only**, or **Implementation ACV only**?" Do NOT call tools with an unresolved revenueType — ask first, then call tools with the correct filter once the user answers.
8. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter. If the user says "this year" or implies a current time period, resolve it to the actual year (see Current Date Context below).`,

  forecast: `You are the Forecast Deep Dive Analyst. You answer questions about the Sales Forecast tab.

Your screen shows:
- Regional Performance table (5 regions with Closed ACV, Forecast, Prev Year, YoY Growth)
- Forecast Trend line chart (cumulative monthly forecast vs previous year, Jan-Dec)
- Forecast by Sub-Category table (sub-category, category, weighted forecast, % of total)
- AI Scenario Analysis (pessimistic/most_likely/optimistic with weekly projections)
- Monte Carlo Simulation (probability distribution of outcomes)

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, quarter, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **quarter**: e.g. ["Q1","Q2"] — filter to quarter(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **logoType**: e.g. ["New Logo","Upsell"] — deal types: New Logo, Upsell, Cross-Sell, Extension
- **revenueType**: "License", "Implementation", or "All"

## Tool Guide
- \`get_regional_performance\`: Returns per-region Closed ACV, Forecast, Previous Year, Variance, YoY Growth %
- \`get_forecast_trend\`: Returns month-by-month cumulative forecast, previous year, monthly won, monthly pipeline
- \`get_forecast_by_subcategory\`: Returns product sub-category forecast breakdown with weighted forecast and % of total
- \`get_forecast\`: Returns scenario analysis (pessimistic/most_likely/optimistic) with weekly projections and risk factors
- \`run_monte_carlo\`: Runs Monte Carlo simulation returning mean, median, percentiles (p10, p25, p75, p90)

Rules:
1. ALWAYS call tools before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. Examples: 23108402 → $23.11M, 8624092 → $8.62M, 814701 → $0.81M, 340600 → $0.34M. NEVER output raw numbers like 23,108,402 or 8,624,092. This applies to EVERY dollar value in your response — KPIs, tables, bullet points, everywhere.
3. For regional comparisons, call get_regional_performance with filters.
4. For trend analysis, call get_forecast_trend with filters.
5. For product analysis, call get_forecast_by_subcategory with filters.
6. For scenario/simulation questions, call get_forecast or run_monte_carlo.
7. Highlight growth/decline trends and which regions or categories are driving performance.
8. **CLARIFICATION REQUIRED**: When the user asks about "ACV" or "Forecast" WITHOUT specifying License, Implementation, or All, you MUST ask the user BEFORE calling any tool: "Would you like to see: **All ACV** (License + Implementation combined), **License ACV only**, or **Implementation ACV only**?" Do NOT call tools with an unresolved revenueType — ask first.
9. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter. If the user says "this year" or implies a current time period, resolve it to the actual year (see Current Date Context below).`,

  pipeline: `You are the Pipeline Movement Analyst. You answer questions about pipeline changes.

Your screen shows:
- Movement Summary Cards (Pipeline Change, New Deals, Value Decreased, Closed Won, Deals Lost)
- Pipeline Waterfall chart (Starting → New → Increased → Decreased → Won → Lost → Ending)
- Key Deal Movement table (top 10 movers with previous/current value and category)
- Lost Deals table
- All Deal Movement table (full searchable list)
- Pipeline by Sub-Category chart and table

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, quarter, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **quarter**: e.g. ["Q1","Q2"] — filter to quarter(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **logoType**: e.g. ["New Logo","Upsell"]
- **revenueType**: "License", "Implementation", or "All"
- **targetMonth**: e.g. "2026-01" — specific month for movement comparison (defaults to latest)

## Tool Guide
- \`get_pipeline_movement\`: Returns EVERYTHING — starting/ending pipeline, new/increased/decreased/won/lost deals with counts, values, waterfall chart data, AND individual deal details (dealId, dealName, accountName, category, previousValue, currentValue, change)
- \`get_pipeline_by_subcategory\`: Returns pipeline value by product sub-category

Rules:
1. ALWAYS call get_pipeline_movement first — it returns ALL the data you need including deal-level details.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. Examples: 23108402 → $23.11M, 8624092 → $8.62M, 814701 → $0.81M, 340600 → $0.34M. NEVER output raw numbers like 23,108,402 or 8,624,092. This applies to EVERY dollar value in your response — KPIs, tables, bullet points, everywhere.
3. For sub-category breakdown, call get_pipeline_by_subcategory.
4. Explain changes clearly: "Pipeline grew/shrank by $X.XXM because..."
5. Highlight significant deal movements, new deals, and concerning losses.
6. Use the dealDetails array to name specific deals and customers.
7. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter. If the user says "this year", "this month", or implies a current time period, resolve it to the actual value (see Current Date Context below).`,

  yoy: `You are the YoY Performance Analyst. You answer questions about sales rep performance and attainment.

Your screen shows:
- Sales Rep Performance table (cascading hierarchy: managers with rollup totals, reps underneath)
  Columns: Salesperson, Region, Closed YTD, Forecast, Pipeline, Prev Year, Coverage, YTD vs PY %, Forecast vs PY %
- Monthly Attainment Heatmap (Reps × Months grid, color-coded: Green ≥100%, Yellow 75-99%, Red <75%)
- Top Performers chart (top 8 reps by forecast attainment %)
- Pipeline Coverage chart (coverage multiplier per rep: Green ≥1.5x, Yellow ≥1x, Red <1x)

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, quarter, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **quarter**: e.g. ["Q1","Q2"] — filter to quarter(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **logoType**: e.g. ["New Logo","Upsell"]
- **revenueType**: "License", "Implementation", or "All"

## Tool Guide
- \`get_sales_rep_performance\`: Returns hierarchical rep table (id, name, region, isManager, level, closedYTD, forecast, pipelineValue, previousYearClosed, pipelineCoverage, ytdAttainment, forecastAttainment, monthlyAttainment[12]). Supports nameFilter, regionFilter, sortField, sortDirection.
- \`get_monthly_attainment_heatmap\`: Returns Rep × Month grid with attainment %, color (green/yellow/red/gray), and avg attainment. Supports nameFilter, regionFilter.

Rules:
1. ALWAYS call tools before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. Examples: 23108402 → $23.11M, 8624092 → $8.62M, 814701 → $0.81M, 340600 → $0.34M. NEVER output raw numbers like 23,108,402 or 8,624,092. This applies to EVERY dollar value in your response — KPIs, tables, bullet points, everywhere.
3. For the rep table, call get_sales_rep_performance.
4. For the heatmap, call get_monthly_attainment_heatmap.
5. Highlight top/bottom performers and explain why (coverage, pipeline, close rate).
6. Present the hierarchy clearly: show manager rollups vs individual rep numbers.
7. When asked "who are the top performers?", sort by forecastAttainment desc.
8. When asked about coverage, highlight reps with coverage < 1x as at-risk.
9. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter. If the user says "this year" or implies a current time period, resolve it to the actual value (see Current Date Context below).`,
};

// ── Supervisor builder ──

export interface SalesSupervisorDeps {
  overviewTools: StructuredToolInterface[];
  forecastTools: StructuredToolInterface[];
  pipelineTools: StructuredToolInterface[];
  yoyTools: StructuredToolInterface[];
}

export function buildSalesSupervisor(
  llm: BaseChatModel,
  deps: SalesSupervisorDeps,
) {
  // Inject current date context into every sub-agent prompt so the LLM
  // can resolve relative time references ("this year", "this quarter", etc.)
  const dateContext = getDateContext();

  // Build 4 compiled sub-agent graphs
  const subAgents: Record<SalesTab, ReturnType<typeof createReactAgent>> = {
    overview: createReactAgent({
      llm,
      tools: deps.overviewTools,
      prompt: SUB_AGENT_PROMPTS.overview + dateContext,
    }),
    forecast: createReactAgent({
      llm,
      tools: deps.forecastTools,
      prompt: SUB_AGENT_PROMPTS.forecast + dateContext,
    }),
    pipeline: createReactAgent({
      llm,
      tools: deps.pipelineTools,
      prompt: SUB_AGENT_PROMPTS.pipeline + dateContext,
    }),
    yoy: createReactAgent({
      llm,
      tools: deps.yoyTools,
      prompt: SUB_AGENT_PROMPTS.yoy + dateContext,
    }),
  };

  return { subAgents, routerPrompt: ROUTER_SYSTEM_PROMPT };
}

/**
 * Stream the Sales Supervisor: route → sub-agent → stream events
 */
export async function* streamSalesSupervisor(
  llm: BaseChatModel,
  supervisor: ReturnType<typeof buildSalesSupervisor>,
  params: {
    userId: string;
    input: string;
    history?: BaseMessage[];
    maxIterations?: number;
  },
): AsyncGenerator<AgUiEvent> {
  const { subAgents, routerPrompt } = supervisor;
  const messages = params.history || [];

  // ── Step 1: Route the query ──
  let route: RouteDecision;
  try {
    const routeMessages: BaseMessage[] = [
      new SystemMessage(routerPrompt),
      ...messages,
      new HumanMessage(params.input),
    ];

    const routeResponse = await llm.invoke(routeMessages);
    const content = typeof routeResponse.content === 'string'
      ? routeResponse.content
      : JSON.stringify(routeResponse.content);

    route = parseRouteResponse(content);
  } catch (err) {
    // Default to overview on routing failure
    route = { tab: 'overview', tabLabel: 'Overview', tabIndex: 0, reason: 'Routing failed, defaulting to Overview' };
    yield {
      type: 'log',
      content: `Router error: ${err instanceof Error ? err.message : String(err)}. Defaulting to Overview.`,
    };
  }

  // ── Step 2: Emit route event ──
  yield {
    type: 'route',
    content: route.tab,
    metadata: {
      tab: route.tabLabel,
      tabIndex: route.tabIndex,
      reason: route.reason,
      agentKey: `sales_${route.tab}`,
    },
  };

  // ── Step 3: Delegate to sub-agent and stream events ──
  const subAgent = subAgents[route.tab];
  const subMessages: BaseMessage[] = [
    ...messages,
    new HumanMessage(params.input),
  ];

  const announcedTools = new Set<string>();

  try {
    for await (const event of subAgent.streamEvents(
      { messages: subMessages },
      {
        version: 'v2',
        recursionLimit: (params.maxIterations ?? 10) * 2 + 1,
      },
    )) {
      const { event: eventType, name, data } = event;

      // Token streaming
      if (eventType === 'on_chat_model_stream') {
        const chunk = data?.chunk;
        if (!chunk) continue;

        const content = typeof chunk.content === 'string' ? chunk.content : '';
        if (content) {
          yield { type: 'answer', content };
        }
      }

      // Tool start
      if (eventType === 'on_tool_start') {
        const toolId = event.run_id || `call_${name}_${Date.now()}`;
        if (!announcedTools.has(toolId)) {
          announcedTools.add(toolId);
          yield {
            type: 'action',
            toolId,
            toolName: name,
            toolStatus: 'calling',
            content: name,
            metadata: data?.input ? { input: data.input } : undefined,
          };
        }
      }

      // Tool end
      if (eventType === 'on_tool_end') {
        const toolId = event.run_id || `call_${name}_end`;
        const output =
          typeof data?.output === 'string'
            ? data.output
            : typeof data?.output?.content === 'string'
              ? data.output.content
              : JSON.stringify(data?.output ?? '');
        yield {
          type: 'observation',
          toolId,
          toolName: name,
          content: output,
        };
      }
    }
  } catch (err) {
    console.error('[streamSalesSupervisor] Sub-agent stream error:', err);
    yield {
      type: 'error',
      content: err instanceof Error ? err.message : String(err),
    };
  }
}
