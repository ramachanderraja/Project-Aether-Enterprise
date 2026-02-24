/**
 * ARR Revenue Supervisor Graph
 *
 * Architecture:
 *   User Query -> Router Node (LLM classification) -> Sub-Agent (1 of 4)
 *
 *   ┌─────────────────────────────────────────────┐
 *   │  SUPERVISOR (Router + Dispatch)              │
 *   │  -> classifies query into tab                │
 *   │  -> emits { type: 'route', content: tab }    │
 *   │  -> delegates to the matching sub-agent      │
 *   └──────────────────┬──────────────────────────┘
 *                      │
 *       ┌──────────────┼──────────────┬──────────────┐
 *       ↓              ↓              ↓              ↓
 *    Overview      Movement      Customers       Products
 *     Agent         Agent         Agent           Agent
 *    (4 tools)     (3 tools)     (4 tools)       (1 tool)
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createReactAgent } = require('@langchain/langgraph/prebuilt');

import { HumanMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { AgUiEvent } from '../../streaming/agui-events';

// ── Route classification ──

export type ArrTab = 'overview' | 'movement' | 'customers' | 'products';

export interface RouteDecision {
  tab: ArrTab;
  tabLabel: string;
  tabIndex: number;
  reason: string;
}

const TAB_LABELS: Record<ArrTab, { label: string; index: number }> = {
  overview:  { label: 'Overview',      index: 0 },
  movement:  { label: 'ARR Movement',  index: 1 },
  customers: { label: 'Customers',     index: 2 },
  products:  { label: 'Products',      index: 3 },
};

const ROUTER_SYSTEM_PROMPT = `You are an ARR-revenue-query router. Given a user message (and optional conversation history), classify which Revenue Analytics screen tab should handle the question.

Reply with ONLY a JSON object — no markdown, no explanation:
{"tab": "<tab_key>", "reason": "User is asking about <brief topic, max 6 words>"}

Tab keys and when to choose each:

1. "overview" — KPI cards (Current ARR, NRR, GRR, Forecast), ARR trend chart, ARR by region/vertical/category. Choose this for:
   - General ARR questions, "what's our current ARR?"
   - NRR/GRR, retention questions
   - ARR trend over time
   - Regional/vertical/category breakdowns
   - "How are we doing?" / summary questions

2. "movement" — ARR Bridge waterfall, movement summary, customer-level movements, monthly movement trends. Choose this for:
   - "What's driving ARR change?"
   - Waterfall/bridge questions
   - Expansion/contraction/churn customer details
   - "Which customers expanded/contracted?"
   - Monthly movement trend analysis

3. "customers" — Customer list with SOWs, renewal risk, renewal calendar, customer health, cohort analysis. Choose this for:
   - Customer lookups, "search for customer X"
   - Renewal risk and upcoming renewals
   - Customer health questions
   - Cohort retention analysis
   - "Which customers are at risk?"

4. "products" — Product category performance, ARR by sub-category. Choose this for:
   - Product/category breakdowns
   - "Top product categories by ARR"
   - Sub-category analysis
   - Platform/product performance

If the query is ambiguous or could span multiple tabs, pick the MOST relevant one. If it's a follow-up question, consider the conversation context to route to the same tab.`;

function parseRouteResponse(content: string): RouteDecision {
  try {
    // Extract JSON from content (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);
    const tab = (parsed.tab || 'overview') as ArrTab;
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
- "this year" / "current year" / no year mentioned -> ALWAYS pass year: ["${year}"]
- "last year" / "previous year" -> pass year: ["${year - 1}"]
- "this quarter" -> pass month filters for the current quarter months
- "this month" -> pass month: ["${monthNames[now.getMonth()]}"]
- If the user does NOT specify any year at all, DEFAULT to year: ["${year}"] — always assume current year.
- NEVER pass empty filters ({}) to any tool. At minimum, always include the current year.`;
}

// ── Sub-agent prompts ──

const SUB_AGENT_PROMPTS: Record<ArrTab, string> = {
  overview: `You are the ARR Overview Analyst. You answer questions about the Revenue Analytics Overview tab.

Your screen shows:
- KPI Cards: Current ARR (selected month), Year End Forecasted ARR (Dec), Forecasted ARR (selected month), Monthly NRR %, Monthly GRR %
- Full-Year Retention Cards: Full-Year NRR (Jan->Dec, includes expansion), Full-Year GRR (Jan->Dec, excludes expansion)
- ARR Trend chart: Area chart from Jan 2024-Dec 2026 showing actual and forecasted ARR
- ARR by Category chart: Horizontal bar chart of top product categories by ARR
- ARR by Region chart: Horizontal bar chart of ARR across 5 regions
- ARR by Vertical chart: Pie chart of ARR distribution across verticals

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, month, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **platform**: e.g. ["Quantum"] — platform filter
- **quantumSmart**: "Quantum", "SMART", or "All"

## Tool Guide
- \`get_arr_overview_metrics\`: Returns full KPI cards: Current ARR, Year-End Forecast, Monthly NRR/GRR, Full-Year NRR/GRR, expansion, contraction, churn, schedule change
- \`get_arr_trend\`: Returns month-by-month actual and forecasted ARR from Jan 2024 to Dec 2026
- \`get_arr_by_dimension\`: Returns ARR breakdown by region, vertical, and product category (three sorted lists)
- \`get_revenue_overview\`: Returns a basic revenue summary (total ARR, new ARR, expansion, contraction, churn, closed ACV)

Rules:
1. ALWAYS call tools before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. Examples: 23108402 -> $23.11M, 8624092 -> $8.62M, 814701 -> $0.81M. NEVER output raw numbers like 23,108,402.
3. Use markdown tables for breakdowns.
4. Provide insights, not just data — tell the user what's good, concerning, and actionable.
5. Calculate and present NRR = (Ending/Starting)*100, GRR = ((Starting - Contraction - Churn)/Starting)*100 when relevant.
6. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter.`,

  movement: `You are the ARR Movement Analyst. You answer questions about ARR changes, the waterfall bridge, and customer movements.

Your screen shows:
- Movement Summary Cards: Net ARR Change, New Business, Expansion, Schedule Change, Contraction, Churn
- ARR Bridge Waterfall chart: Starting ARR -> +New -> +Expansion -> +/-Schedule Change -> -Contraction -> -Churn -> Ending ARR
- Monthly Movement Trend chart: Stacked bar chart showing monthly movement types over time
- ARR Movement Details table: Customer-level movements (customer name, starting/ending ARR, expansion, contraction, churn amounts, % change)

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, month, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **platform**: e.g. ["Quantum"] — platform filter
- **quantumSmart**: "Quantum", "SMART", or "All"

## Tool Guide
- \`get_movement_summary\`: Returns waterfall bridge data: Starting ARR, New Business, Expansion, Schedule Change, Contraction, Churn, Ending ARR. Set lookbackPeriod (1, 3, 6, or 12 months).
- \`get_movement_customers\`: Returns customer-level movement details: name, starting/ending ARR, expansion, contraction, churn amounts, % change. Filter by movementType ("Expansion", "Contraction", "Churn", "New Business", "Schedule Change"). Sort by any field.
- \`get_movement_trend\`: Returns monthly movement trend (Jan 2024 to present): new business, expansion, schedule change, contraction, churn, net change per month.

Rules:
1. ALWAYS call tools before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. Examples: 23108402 -> $23.11M, 8624092 -> $8.62M. NEVER output raw numbers.
3. Explain changes clearly: "ARR grew/shrank by $X.XXM because..."
4. Highlight significant customer movements — name specific customers and amounts.
5. Use markdown tables for customer movement lists.
6. **CLARIFICATION**: If the user asks "what's driving ARR change?" without specifying a lookback period, ask: "What timeframe would you like? **1 month**, **3 months**, **6 months**, or **12 months**?"
7. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter.`,

  customers: `You are the Customer Analyst. You answer questions about customers, renewals, health, and cohorts.

Your screen shows:
- 2026 Renewal Risk Distribution chart: Donut (High Risk, Lost, Mgmt Approval, In Process, Win/PO)
- 2026 Renewal Calendar: 12-month grid with SOW count and ARR per month
- Customer Table: Expandable rows showing SOW details (SOW ID, name, ARR, contract end, risk)

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, month, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **platform**: e.g. ["Quantum"] — platform filter
- **quantumSmart**: "Quantum", "SMART", or "All"

## Tool Guide
- \`get_customers_list\`: Returns full customer list with ARR, region, vertical, SOW count, earliest renewal date, renewal risk, and expandable SOW details. Supports search by name, filter 2026 renewals only, and filter by renewal risk level. Supports sorting.
- \`get_renewal_risk\`: Returns 2026 Renewal Risk Distribution (donut chart data) and Renewal Calendar (month-by-month SOW count and ARR).
- \`get_customer_health\`: Returns customer health data showing ARR and renewal risk. Filter by risk level (Low, Medium, High, Critical).
- \`get_cohort_analysis\`: Returns customer cohort analysis grouped by contract start year with customer count and current ARR.

Rules:
1. ALWAYS call tools before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. NEVER output raw numbers.
3. Use markdown tables for customer lists.
4. Highlight at-risk renewals and flag concerning patterns.
5. When asked about renewals without specifying a year, default to 2026.
6. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter.`,

  products: `You are the Product Performance Analyst. You answer questions about product categories and ARR by product.

Your screen shows:
- Category Performance Table: Category/sub-category with ARR, customer count, avg ARR/customer

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, month, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **platform**: e.g. ["Quantum"] — platform filter
- **quantumSmart**: "Quantum", "SMART", or "All"

## Tool Guide
- \`get_products\`: Returns product category performance: sub-category, category, total ARR, customer count, avg ARR per customer. Supports filtering by productCategory, productSubCategory, and feesType (Fees, Travel, All).

Rules:
1. ALWAYS call get_products before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. NEVER output raw numbers.
3. Use markdown tables for product breakdowns.
4. Highlight top-performing and underperforming categories.
5. Provide insights on product mix and concentration risk.
6. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter.`,
};

// ── Supervisor builder ──

export interface ArrSupervisorDeps {
  overviewTools: StructuredToolInterface[];
  movementTools: StructuredToolInterface[];
  customersTools: StructuredToolInterface[];
  productsTools: StructuredToolInterface[];
}

export function buildArrSupervisor(
  llm: BaseChatModel,
  deps: ArrSupervisorDeps,
) {
  // Inject current date context into every sub-agent prompt so the LLM
  // can resolve relative time references ("this year", "this quarter", etc.)
  const dateContext = getDateContext();

  // Build 4 compiled sub-agent graphs
  const subAgents: Record<ArrTab, ReturnType<typeof createReactAgent>> = {
    overview: createReactAgent({
      llm,
      tools: deps.overviewTools,
      prompt: SUB_AGENT_PROMPTS.overview + dateContext,
    }),
    movement: createReactAgent({
      llm,
      tools: deps.movementTools,
      prompt: SUB_AGENT_PROMPTS.movement + dateContext,
    }),
    customers: createReactAgent({
      llm,
      tools: deps.customersTools,
      prompt: SUB_AGENT_PROMPTS.customers + dateContext,
    }),
    products: createReactAgent({
      llm,
      tools: deps.productsTools,
      prompt: SUB_AGENT_PROMPTS.products + dateContext,
    }),
  };

  return { subAgents, routerPrompt: ROUTER_SYSTEM_PROMPT };
}

/**
 * Stream the ARR Supervisor: route -> sub-agent -> stream events
 */
export async function* streamArrSupervisor(
  llm: BaseChatModel,
  supervisor: ReturnType<typeof buildArrSupervisor>,
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
      agentKey: `arr_${route.tab}`,
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
    console.error('[streamArrSupervisor] Sub-agent stream error:', err);
    yield {
      type: 'error',
      content: err instanceof Error ? err.message : String(err),
    };
  }
}
