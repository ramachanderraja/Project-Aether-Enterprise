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
 *    (3 tools)     (3 tools)     (2 tools)       (4 tools)
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

IMPORTANT CONTEXT — Quantum and SMART are platform filters, NOT product categories:
- "Quantum ARR", "SMART ARR", "Quantum/SMART" → these are platform filters that apply to the OVERVIEW tab (or any tab). They filter which customers are included.
- Product categories are things like S2C, P2P, Supply Chain, Spend, Supplier, Qi, TPRM, Click, Cost Drivers, etc.
- If the user asks "What is the Quantum ARR?" or "year-end forecast for Quantum", route to "overview" (NOT "products").

Tab keys and when to choose each:

1. "overview" — KPI cards (Current ARR, NRR, GRR, Forecast), ARR trend chart, ARR by region/vertical/category. Choose this for:
   - General ARR questions, "what's our current ARR?"
   - Quantum ARR, SMART ARR (these are platform filters, not products)
   - Year-end forecast, forecasted ARR
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

3. "customers" — Customer list with SOWs, renewal risk, renewal calendar. Choose this for:
   - Customer lookups, "search for customer X"
   - Renewal risk and upcoming renewals
   - "Which customers are at risk?"
   - "Top customers by ARR"

4. "products" — Product category performance (S2C, P2P, Supply Chain, etc.), customer product matrix, cross-sell analysis. Choose this for:
   - Product/category breakdowns (S2C, P2P, Supply Chain, Spend, Supplier, Qi, TPRM, Click, Cost Drivers)
   - "Top product categories by ARR"
   - Sub-category analysis
   - "Which customers use multiple products?"
   - Cross-sell rate
   - Customer-category matrix

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
  const priorMonthIndex = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const priorMonthName = monthNames[priorMonthIndex];
  const priorMonthYear = now.getMonth() === 0 ? year - 1 : year;
  return `

## Current Date Context
- Today: ${now.toISOString().split('T')[0]}
- Current year: ${year}
- Current quarter: Q${quarter}
- Calendar month: ${monthNames[now.getMonth()]}
- **Latest ARR data month: ${priorMonthName} ${priorMonthYear}** (ARR snapshot data is always one month behind — the current calendar month has not ended so there is no snapshot for it yet)
- Previous year: ${year - 1}

## Smart Date Inference for ARR (CRITICAL — apply BEFORE calling any tool)
- **"current ARR" / "current" / "now" / "latest"** -> ALWAYS pass month: ["${priorMonthName}"], year: ["${priorMonthYear}"]. The latest actual ARR data is for ${priorMonthName} ${priorMonthYear}, NOT ${monthNames[now.getMonth()]} ${year}.
- "this year" / "current year" / no year mentioned -> ALWAYS pass year: ["${year}"]
- "last year" / "previous year" -> pass year: ["${year - 1}"]
- "this quarter" -> pass month filters for the current quarter months
- "this month" -> pass month: ["${priorMonthName}"] (the latest month with actual data)
- If the user does NOT specify any year at all, DEFAULT to year: ["${year}"] — always assume current year.
- **ALWAYS PASS MONTH**: You MUST always include a month filter. If no month is mentioned, DEFAULT to month: ["${priorMonthName}"] (the latest month with actual data). If you only pass year without month, the system defaults to December which may be in the future with no data.
- NEVER pass empty filters ({}) to any tool. At minimum, always include year and month.
- For movement/waterfall tools: the lookback period counts backwards FROM the month you specify. Default to month: ["${priorMonthName}"].`;
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
7. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter.
8. **CRITICAL — ALWAYS PASS MONTH**: When calling ANY movement tool, you MUST pass the month filter (e.g. month: ["Feb"] for current month, or month: ["Jan"] for prior month). If you only pass year without month, the system defaults to December which may be in the future with no data. The lookback period counts backwards FROM the month you specify.`,

  customers: `You are the Customer Analyst. You answer questions about customers, renewals, and risk.

Your screen shows:
- Top 10 Customers by ARR: Horizontal bar chart
- 2026 Renewal Risk Distribution chart: Donut (Win/PO, In Process, Mgmt Approval, High Risk, Lost)
- 2026 Renewal Calendar: 12-month grid with SOW count and ARR per month
- Customer Table: Expandable rows showing SOW details (SOW ID, name, ARR, fees type, contract end, renewal risk)
- Filters: "Show 2026 Renewals Only" toggle, "Renewal Risk Only" toggle, customer name search

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
- \`get_customers_list\`: Returns full customer list sorted by ARR (descending). Includes region, vertical, SOW count, earliest renewal date, renewal risk, and expandable SOW details. Supports search by name, filter 2026 renewals only (renewals2026: true), and filter by renewal risk level ("High Risk", "Lost", "Mgmt Approval", "In Process", "Win/PO"). For "top 10 customers" questions, just use this tool — results are already sorted by ARR.
- \`get_renewal_risk\`: Returns 2026 Renewal Risk Distribution (donut: Win/PO, In Process, Mgmt Approval, High Risk, Lost) and Renewal Calendar (month-by-month SOW count and ARR).

Rules:
1. ALWAYS call tools before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. NEVER output raw numbers.
3. Use markdown tables for customer lists.
4. Highlight at-risk renewals and flag concerning patterns.
5. When asked about renewals without specifying a year, default to 2026.
6. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter.
7. **RENEWAL RISK LEVELS**: The risk levels on this screen are: Win/PO, In Process, Mgmt Approval, High Risk, Lost. Use these exact values when filtering.`,

  products: `You are the Product Performance Analyst. You answer questions about product categories, cross-sell analysis, and customer product adoption.

Your screen has two views:

### "By Category" View:
- 4 KPI Cards: Total Categories, Top Category (name + ARR), Total Sub-Categories, Most Adopted (category with most customers)
- Category ARR Comparison bar chart
- Category Performance Table: Expandable rows (Category -> Sub-Categories) with ARR, customer count, avg ARR/customer

### "By Customer" View:
- Cross-Sell Analysis bar chart: Customers using 1, 2, 3+ sub-categories, with cross-sell rate %
- Category Performance Matrix scatter chart: X=Customers, Y=Avg ARR/Customer per category
- Customer Category Matrix table: Customer name, region, vertical, dynamic category columns (ARR per category), total ARR. Expandable SOW-level rows.

## Available Filters (pass these to ALL tools)
When the user mentions a region, vertical, year, month, etc., ALWAYS pass the corresponding filter:
- **year**: e.g. ["2026"] — filter to year(s)
- **month**: e.g. ["Jan","Feb"] — filter to month(s)
- **region**: e.g. ["North America"] — regions: North America, Europe, LATAM, Middle East, APAC
- **vertical**: e.g. ["BFSI","Life Sciences"] — industry verticals
- **segment**: e.g. ["Enterprise","SMB"]
- **platform**: e.g. ["Quantum"] — platform filter
- **quantumSmart**: "Quantum", "SMART", or "All"
- **feesType**: "Fees", "Travel", or "All" — defaults to Fees

## Tool Guide
- \`get_products\`: Returns sub-category-level detail: sub-category name, parent category, ARR, customer count, avg ARR/customer. Good for drilling into a specific category's sub-categories.
- \`get_category_summary\`: Returns category-level rollup with the 4 KPI card values (Total Categories, Top Category, Total Sub-Categories, Most Adopted) plus per-category metrics. Use this for overview questions and the "By Category" view.
- \`get_customer_category_matrix\`: Returns Customer × Category ARR matrix with SOW-level drill-down. Use for "which customers buy which products?", "show customer X's product mix", or the "By Customer" table.
- \`get_cross_sell_analysis\`: Returns cross-sell distribution (1/2/3+ sub-categories), cross-sell rate %, and category performance scatter data. Use for cross-sell questions and the "By Customer" charts.

Rules:
1. ALWAYS call tools before answering — never fabricate numbers.
2. **CURRENCY FORMATTING (MANDATORY)**: ALWAYS format ALL dollar amounts as millions with exactly 2 decimal places and a dollar sign: **$X.XXM**. NEVER output raw numbers.
3. Use markdown tables for product breakdowns.
4. Highlight top-performing and underperforming categories.
5. Provide insights on product mix, concentration risk, and cross-sell opportunities.
6. **SMART DEFAULTS**: Never call tools with completely empty filters. At minimum, always infer and pass the year filter.
7. For category-level questions, prefer \`get_category_summary\` over \`get_products\`. Use \`get_products\` when the user asks about specific sub-categories.`,
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

    // Cap output tokens to keep the router fast — it only needs a small JSON
    const routeResponse = await llm.invoke(routeMessages, { max_tokens: 80 } as any);
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
