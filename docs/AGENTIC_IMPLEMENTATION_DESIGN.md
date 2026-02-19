# Agentic AI Implementation Design Document

**Version**: 1.0.0
**Date**: 2026-02-19
**Author**: Aryamann (architecture) + Codex (implementation)
**Status**: IMPLEMENTED — both backend and frontend are fully built. This doc is the design reference.

> **IMPLEMENTATION STATUS**: Full implementation exists:
> - **Backend** (15 files): `backend/src/modules/agent/` — module, service, controller, tools (sales + revenue), graphs (ReAct loop), streaming (AG-UI events, dedupe emitter, stream-graph-events), config, DTOs. Already registered in `AppModule`.
> - **Frontend** (12 files): `frontend/src/modules/ai-agent/` — AIAgentPage, AgentSelector, AgentChat, ChatMessage, ToolCallCard, ThinkingIndicator, MarkdownRenderer, useAgentStream hook, stream-parser, agui-events types, agent-api service.
> - **Agent keys in code**: `sales_pipeline` and `arr_revenue` (not `sales_agent`/`revenue_agent` as shown in design examples below — the code is the source of truth).
> - **Next step**: Test end-to-end with real OPENAI_API_KEY, verify streaming works, and iterate on system prompts based on response quality.

---

## 1. Overview

Build two LangGraph ReAct agents integrated into the existing NestJS backend and React frontend:

1. **Sales Pipeline Agent** — has tools wrapping `SalesService`, `DealService`, `ForecastService`
2. **ARR Revenue Agent** — has tools wrapping `RevenueService` (ARR snapshots, movements, customer health, cohorts, churn)

Both agents use **OpenAI (`o4-mini`)** via `@langchain/openai`, follow the **ReAct (Reason + Act) loop** pattern from `AgenticAI_Reference/runtime/graphs/tool-agent-graph.ts`, stream responses as **AG-UI NDJSON events**, and have **no Human-in-the-Loop (HITL)**.

The frontend `AIAgentPage` shows an agent selector. Selecting an agent opens a chat interface that streams AG-UI events (thoughts, tool calls, observations, answer tokens).

---

## 2. Tech Stack & Dependencies

### Backend (add to `backend/package.json`)
```json
{
  "@langchain/core": "^1.0.2",
  "@langchain/langgraph": "^1.0.1",
  "@langchain/openai": "^1.0.0",
  "zod": "^3.23.0"
}
```

### Frontend (already has what's needed)
- React, Zustand, Vite (existing)
- No new dependencies needed — uses native `fetch` + `ReadableStream` for NDJSON parsing

### Environment Variables (add to backend `.env`)
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=o4-mini
```

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Frontend: AIAgentPage                                  │
│  ┌─────────────┐  ┌──────────────────────────────────┐  │
│  │ Agent Picker │→ │ Chat UI (streams AG-UI events)  │  │
│  │ • Sales      │  │ • ThinkingIndicator (thought)   │  │
│  │ • Revenue    │  │ • ToolCallCard (action/obs)     │  │
│  └─────────────┘  │ • MarkdownMessage (answer)       │  │
│                    └──────────┬───────────────────────┘  │
└───────────────────────────────┼──────────────────────────┘
                                │ POST /api/v1/agent/chat/stream
                                │ Body: { message, agentKey }
                                │ Response: NDJSON stream
┌───────────────────────────────┼──────────────────────────┐
│  Backend: AgentModule (NestJS)│                           │
│                    ┌──────────▼───────────────────────┐   │
│                    │ AgentController                   │   │
│                    │  POST /chat/stream (NDJSON SSE)   │   │
│                    │  POST /chat (sync fallback)       │   │
│                    └──────────┬───────────────────────┘   │
│                               │                           │
│                    ┌──────────▼───────────────────────┐   │
│                    │ AgentService                      │   │
│                    │  • resolveAgent(agentKey)         │   │
│                    │  • chatStream() → AsyncGenerator  │   │
│                    │  • chat() → Promise               │   │
│                    └──────────┬───────────────────────┘   │
│                               │                           │
│              ┌────────────────┼────────────────┐          │
│              ▼                ▼                            │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ Sales Agent      │  │ Revenue Agent   │                │
│  │ Graph            │  │ Graph           │                │
│  │ (ReAct loop)     │  │ (ReAct loop)    │                │
│  │                  │  │                 │                │
│  │ Tools:           │  │ Tools:          │                │
│  │ • get_pipeline   │  │ • get_arr_overview│               │
│  │ • get_deals      │  │ • get_arr_movement│               │
│  │ • get_deal_by_id │  │ • get_customer_health│            │
│  │ • get_forecast   │  │ • get_cohort_analysis│            │
│  │ • get_metrics    │  │ • get_churn_analysis │            │
│  │ • get_trends     │  │ • get_revenue_data   │            │
│  │ • get_at_risk    │  │                      │            │
│  │ • get_sales_data │  │                      │            │
│  └────────┬─────────┘  └───────┬──────────────┘           │
│           │                    │                           │
│           ▼                    ▼                           │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ SalesService     │  │ RevenueService   │               │
│  │ DealService      │  │                  │               │
│  │ ForecastService  │  │                  │               │
│  └─────────────────┘  └─────────────────┘                │
│           │                    │                           │
│           └────────┬───────────┘                          │
│                    ▼                                      │
│           ┌─────────────────┐                             │
│           │ DataService      │                            │
│           │ (CSV data layer) │                            │
│           └─────────────────┘                             │
└───────────────────────────────────────────────────────────┘
```

---

## 4. Backend Implementation

### 4.1 File Structure

Create these files inside `backend/src/modules/agent/`:

```
backend/src/modules/agent/
├── agent.module.ts                    # NestJS module
├── agent.controller.ts                # HTTP endpoints (stream + sync)
├── agent.service.ts                   # Orchestrator: resolves agent, runs graph
├── dto/
│   └── chat.dto.ts                    # ChatDto, AgentKey enum
├── graphs/
│   ├── tool-agent-graph.ts            # ReAct loop graph builder (from reference)
│   ├── types.ts                       # ToolAgentState, AgentConfig interface
│   └── format-tool-error.ts           # Safe tool error formatting
├── tools/
│   ├── sales.tools.ts                 # Zod-schema'd tools wrapping SalesService
│   └── revenue.tools.ts              # Zod-schema'd tools wrapping RevenueService
├── streaming/
│   ├── agui-events.ts                 # AG-UI event type definitions
│   ├── dedupe-emitter.ts              # Deduplication helper for streaming
│   └── stream-graph-events.ts         # LangGraph streamEvents → AG-UI converter
└── config/
    └── agent-configs.ts               # System prompts + tool lists per agent
```

### 4.2 AG-UI Event Protocol (`streaming/agui-events.ts`)

Adapt from `AgenticAI_Reference/runtime/ag-ui/events.ts`. Simplified for our use case (no HITL, no handoff):

```typescript
export type AgUiEventType =
  | 'log'
  | 'answer'
  | 'thought'
  | 'action'
  | 'observation'
  | 'error'
  | 'done'
  | 'ping';

export interface AgUiEvent {
  type: AgUiEventType;
  content: string;
  data?: any;
  toolName?: string;
  toolId?: string;
  toolStatus?: string;
  metadata?: Record<string, unknown>;
}
```

### 4.3 Dedupe Emitter (`streaming/dedupe-emitter.ts`)

Copy the `AgUiDedupeEmitter` class from `AgenticAI_Reference/runtime/ag-ui/dedupe-emitter.ts`. Remove HITL-related fields (`emittedHandoffs`, `emittedApprovals`, handoff/approval sections in `emitFromState`). Keep:
- Think-tag parser (`classifyToken`, `flushTagBuffer`)
- Log deduplication
- Tool event deduplication
- Final answer fallback
- Error deduplication

### 4.4 Stream Graph Events (`streaming/stream-graph-events.ts`)

Copy the `handleStreamEvent` generator from `AgenticAI_Reference/runtime/ag-ui/stream-graph-events.ts`. Simplify:
- Keep `INTERNAL_NODES` empty (we have no internal classification nodes)
- Keep `STRUCTURED_OUTPUT_NODES` empty (no plan/critique nodes)
- Keep token streaming logic (OpenAI reasoning content extraction)
- Keep tool start/end event emission
- Keep state-level event emission via emitter

### 4.5 ReAct Graph (`graphs/tool-agent-graph.ts`)

Adapt from `AgenticAI_Reference/runtime/graphs/tool-agent-graph.ts`. This is the **core ReAct loop**. Simplify by removing HITL:

**Graph shape** (no HITL version from reference lines 374-389):
```
START → agent → (tools | finalize)
                  tools → agent (loop back)
                  finalize → END
```

**State** (from `ToolAgentState` in reference, remove HITL fields):
```typescript
const ToolAgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  userId: Annotation<string>(),
  input: Annotation<string>(),
  systemPrompt: Annotation<string>({
    reducer: (_, b) => b,
    default: () => '',
  }),
  iterations: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (_, b) => b,
    default: () => 10,
  }),
  toolCalls: Annotation<Array<{ tool: string; input: any; output: string }>>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  finalAnswer: Annotation<string | undefined>(),
  logs: Annotation<string[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
  error: Annotation<string | undefined>(),
});
```

**Nodes:**
1. `agentNode` — Calls OpenAI with system prompt + message history + bound tools. Returns AI message (may contain tool_calls).
2. `toolNode` — Executes tool calls from the AI message against the tools map. Returns ToolMessages.
3. `finalizeNode` — Extracts the last AI message without tool calls as `finalAnswer`.

**Routing:**
- After `agent`: if AI message has `tool_calls` → `tools`, else → `finalize`
- After `tools`: always → `agent` (ReAct loop)
- After `finalize`: → `END`

**Key**: `maxIterations` = 10 (prevents infinite loops). Each agent-tool cycle counts as 1 iteration.

### 4.6 Sales Tools (`tools/sales.tools.ts`)

Create using `@langchain/core/tools` `tool()` function with Zod schemas, exactly like the reference `agent.tools.ts` pattern. Inject `SalesService`, `DealService`, `ForecastService` via the module.

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { SalesService } from '../../sales/sales.service';
import { DealService } from '../../sales/services/deal.service';
import { ForecastService } from '../../sales/services/forecast.service';

export function createSalesTools(
  salesService: SalesService,
  dealService: DealService,
  forecastService: ForecastService,
) {
  return [
    // 1. get_sales_data
    tool(async () => {
      const data = salesService.getSalesData();
      return JSON.stringify({
        closedAcvCount: data.closedAcv.length,
        pipelineCount: data.pipelineSnapshots.length,
        teamSize: data.salesTeam.length,
        summary: 'Raw sales data loaded. Use other tools for specific analysis.',
      });
    }, {
      name: 'get_sales_data',
      description: 'Get a summary of all available sales data including closed ACV deals, pipeline snapshots, and sales team information. Use this for broad overviews.',
      schema: z.object({}),
    }),

    // 2. get_pipeline_overview
    tool(async (input) => {
      const result = await salesService.getPipelineOverview({ period: input.period });
      return JSON.stringify(result);
    }, {
      name: 'get_pipeline_overview',
      description: 'Get the sales pipeline overview with summary metrics (total pipeline value, weighted pipeline, deal count, average deal size, total closed) and breakdown by stage (Prospecting, Qualification, Proposal, Negotiation).',
      schema: z.object({
        period: z.string().optional().describe('Time period filter, e.g. "current_quarter", "last_quarter", "ytd"'),
      }),
    }),

    // 3. get_deals
    tool(async (input) => {
      const result = await dealService.getDeals(input as any);
      return JSON.stringify(result);
    }, {
      name: 'get_deals',
      description: 'Get a filtered list of deals. Can filter by stage, owner, region, risk level, amount range, and close date range. Returns deal details including value, stage, probability, and owner.',
      schema: z.object({
        stage: z.string().optional().describe('Filter by deal stage: Prospecting, Qualification, Proposal, Negotiation'),
        owner_id: z.string().optional().describe('Filter by deal owner ID'),
        region: z.string().optional().describe('Filter by region: North America, Europe, LATAM, Middle East, APAC'),
        risk_level: z.enum(['low', 'medium', 'high']).optional().describe('Filter by risk level'),
        amount_gte: z.number().optional().describe('Minimum deal amount filter'),
        amount_lte: z.number().optional().describe('Maximum deal amount filter'),
        close_date_gte: z.string().optional().describe('Filter deals closing on or after this date (YYYY-MM-DD)'),
        close_date_lte: z.string().optional().describe('Filter deals closing on or before this date (YYYY-MM-DD)'),
        page: z.number().optional().describe('Page number for pagination (default: 1)'),
        limit: z.number().optional().describe('Results per page (default: 20, max: 100)'),
      }),
    }),

    // 4. get_deal_by_id
    tool(async (input) => {
      const result = await dealService.getDealById(input.dealId);
      return JSON.stringify(result);
    }, {
      name: 'get_deal_by_id',
      description: 'Get detailed information about a specific deal by its ID. Returns all deal fields including history, contacts, and notes.',
      schema: z.object({
        dealId: z.string().describe('The unique deal identifier'),
      }),
    }),

    // 5. get_sales_forecast
    tool(async (input) => {
      const result = await forecastService.getForecast({ period: input.period });
      return JSON.stringify(result);
    }, {
      name: 'get_sales_forecast',
      description: 'Get AI-powered sales forecast with predicted close amounts, confidence intervals, and risk factors.',
      schema: z.object({
        period: z.string().optional().describe('Forecast period, e.g. "next_quarter", "next_month"'),
      }),
    }),

    // 6. get_sales_metrics
    tool(async (input) => {
      const result = await salesService.getSalesMetrics({ period: input.period });
      return JSON.stringify(result);
    }, {
      name: 'get_sales_metrics',
      description: 'Get key sales KPIs: quota attainment (current vs target), average deal size, pipeline count, and team size.',
      schema: z.object({
        period: z.string().optional().describe('Period for metrics calculation'),
      }),
    }),

    // 7. get_sales_trends
    tool(async (input) => {
      const result = await salesService.getSalesTrends({ period: input.period });
      return JSON.stringify(result);
    }, {
      name: 'get_sales_trends',
      description: 'Get historical sales trends showing pipeline value and deal count over time (monthly breakdown). Useful for identifying growth or decline patterns.',
      schema: z.object({
        period: z.string().optional().describe('Period filter for trends'),
      }),
    }),

    // 8. get_at_risk_deals
    tool(async () => {
      const result = await dealService.getAtRiskDeals();
      return JSON.stringify(result);
    }, {
      name: 'get_at_risk_deals',
      description: 'Get deals that are at risk of being lost. Returns deals with declining probability, stalled progress, or approaching deadlines.',
      schema: z.object({}),
    }),
  ];
}
```

### 4.7 Revenue Tools (`tools/revenue.tools.ts`)

Same pattern, wrapping `RevenueService`:

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RevenueService } from '../../revenue/revenue.service';

export function createRevenueTools(revenueService: RevenueService) {
  return [
    // 1. get_revenue_data
    tool(async () => {
      const data = revenueService.getRevenueData();
      return JSON.stringify({
        arrSnapshotCount: data.arrSnapshots.length,
        pipelineCount: data.pipelineSnapshots.length,
        closedAcvCount: data.closedAcv.length,
        summary: 'Raw revenue data loaded. Use specific tools for analysis.',
      });
    }, {
      name: 'get_revenue_data',
      description: 'Get a summary of all available revenue data including ARR snapshots, pipeline, and closed ACV. Use this for broad data availability checks.',
      schema: z.object({}),
    }),

    // 2. get_arr_overview
    tool(async (input) => {
      const result = await revenueService.getRevenueOverview(input.period);
      return JSON.stringify(result);
    }, {
      name: 'get_arr_overview',
      description: 'Get ARR (Annual Recurring Revenue) overview: total ARR, new ARR, expansion ARR, contraction ARR, churn ARR, total closed ACV, and customer count for the latest period.',
      schema: z.object({
        period: z.string().optional().describe('Period filter, e.g. "2024-Q4", "2024-12"'),
      }),
    }),

    // 3. get_arr_movement
    tool(async (input) => {
      const result = await revenueService.getArrMovement(input.period);
      return JSON.stringify(result);
    }, {
      name: 'get_arr_movement',
      description: 'Get month-by-month ARR movement (waterfall): starting ARR → new business + expansion + schedule change - contraction - churn → ending ARR. Shows net change per month. Essential for understanding ARR growth drivers.',
      schema: z.object({
        period: z.string().optional().describe('Period filter for movement data'),
      }),
    }),

    // 4. get_customer_health
    tool(async (input) => {
      const result = await revenueService.getCustomerHealth(input.riskLevel);
      return JSON.stringify(result);
    }, {
      name: 'get_customer_health',
      description: 'Get customer health scores and risk assessment. Shows total customers, ARR at risk, and per-customer details (name, SOW ID, ARR, risk level, contract end date). Can filter by risk level.',
      schema: z.object({
        riskLevel: z.string().optional().describe('Filter by risk level: "Low", "Medium", "High", "Critical"'),
      }),
    }),

    // 5. get_cohort_analysis
    tool(async () => {
      const result = await revenueService.getCohortAnalysis();
      return JSON.stringify(result);
    }, {
      name: 'get_cohort_analysis',
      description: 'Get customer cohort analysis grouped by contract start year. Shows number of customers and current ARR per cohort. Useful for understanding customer vintage and retention.',
      schema: z.object({}),
    }),

    // 6. get_churn_analysis
    tool(async () => {
      const result = await revenueService.getChurnAnalysis();
      return JSON.stringify(result);
    }, {
      name: 'get_churn_analysis',
      description: 'Get churn analysis: total churned rows, churned ARR amount, and number of unique customers who churned. Use this to understand revenue leakage.',
      schema: z.object({}),
    }),
  ];
}
```

### 4.8 Agent Configs (`config/agent-configs.ts`)

```typescript
export interface AgentConfig {
  key: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  maxIterations: number;
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  sales_agent: {
    key: 'sales_agent',
    name: 'Sales Pipeline Agent',
    description: 'Analyzes sales pipeline, deals, forecasts, team performance, and at-risk opportunities. Understands everything on your Sales Performance screen.',
    icon: 'TrendingUp',
    systemPrompt: `You are the Sales Pipeline AI Analyst for Aether, an enterprise FP&A platform.

You assist users who are looking at the **Sales Performance** screen. That screen has 4 tabs, and users will ask questions about exactly what they see. You MUST call your tools to get real data — never guess.

## What the User Sees on the Sales Screen

### Overview Tab
- **KPI Cards**: Closed ACV (YTD), Weighted Pipeline ACV, Forecast ACV (Closed + Pipeline), YoY Growth %, Conversion Rate (Won / All Closed), Sales Velocity (per day)
- **Forecast by Quarter chart**: Grouped bar chart with Actual (green), Forecast (blue), Previous Year (gray) for Q1-Q4
- **Sales Funnel chart**: Horizontal bar chart showing deal count and value by stage (Prospecting → Qualification → Proposal → Negotiation)
- **Key Deals in Pipeline table**: Deal Name, Account, Unweighted Fee, Stage, Close Date, Probability (%), Owner — top 10 active deals
- **Closed ACV Deals table**: Deal Name, Account, Logo Type (New Logo/Upsell/Cross-Sell/Extension), License ACV, Implementation ACV, SOW ID, Close Date — expandable rows showing sub-category breakdown

### Forecast Deep Dive Tab
- **Summary Cards**: Closed ACV, Weighted Pipeline ACV, Forecast ACV breakdown
- **Regional Performance table**: Region, Closed ACV, Forecast, Previous Year, Variance, YoY Growth %, Trend (Growing/Flat/Declining) — for North America, Europe, LATAM, Middle East, APAC
- **Forecast Trend chart**: Line chart showing cumulative monthly forecast vs previous year (Jan–Dec)
- **Forecast by Sub-Category table**: Sub-Category, Category, Weighted Forecast, % of Total, Deals

### Pipeline Movement Tab
- **Movement Summary Cards**: Pipeline Change, New Deals Added, Value Decreased, Closed Won, Deals Lost — each with count and value
- **Pipeline Waterfall chart**: Starting Pipeline → +New Deals → +Value Increased → -Value Decreased → -Closed Won → -Lost → Ending Pipeline
- **Key Deal Movement table**: Deal Name, Account, Previous Value, Current Value, Change, Category (New/Increased/Decreased/Won/Lost) — top 10 movers
- **Lost Deals table**: Deal Name, Account, Value, Stage Lost At, Owner
- **All Deal Movement table**: Full searchable table of all pipeline changes between month snapshots
- **Pipeline by Sub-Category**: Bar chart + table of weighted pipeline by product sub-category

### YoY Performance Tab
- **Sales Rep Performance table**: Salesperson, Region, Closed (YTD), Forecast, Pipeline, Prev Year, Coverage (1x/2x/3x), YTD vs PY %, Forecast vs PY % — managers highlighted with blue/MGR badge
- **Monthly Attainment Heatmap**: Reps × Months grid, color-coded (Green ≥100%, Yellow 75-99%, Red <75%)
- **Top Performers chart**: Horizontal bar chart of top 8 reps by forecast attainment %
- **Pipeline Coverage chart**: Bar chart of coverage multiplier per rep (Green ≥1.5x, Yellow ≥1x, Red <1x)

### Filters Available to User
Years, Quarters, Months, Regions (5), Verticals (11), Segments (Enterprise/SMB), Logo Types (New Logo/Upsell/Cross-Sell/Extension), Channels (Direct/Partner/Reseller/Organic/Referral), Product Category, Product Sub-Category, Sold By (Sales/GD/TSO), Revenue Type (License/Implementation/All)

### Key Business Concepts
- **Closed ACV**: License ACV only counts for New Logo, Upsell, Cross-Sell (NOT Extension/Renewal). Implementation ACV counts for ALL logo types.
- **Weighted Pipeline**: Deal Value × Probability %
- **Forecast ACV**: Closed ACV + Weighted Pipeline
- **Coverage**: Pipeline ÷ Prev Year Closed (1x = sufficient, >1.5x = strong)
- **Sales Velocity**: How fast deals move through the pipeline per day

## Tool Usage Rules
1. ALWAYS fetch data with tools before answering. Never fabricate numbers.
2. Pipeline questions → call \`get_pipeline_overview\`
3. Specific deal questions → call \`get_deals\` with filters or \`get_deal_by_id\`
4. Risk questions → call \`get_at_risk_deals\`
5. Forecast questions → call \`get_sales_forecast\`
6. KPI/metrics questions → call \`get_sales_metrics\`
7. Trend questions → call \`get_sales_trends\`
8. Broad data questions → call \`get_sales_data\`
9. Format currencies as $X,XXX,XXX or $X.XM for millions.
10. When presenting deal lists, use markdown tables.
11. Provide insights, not just data dumps — tell the user what's good, what's concerning, and what to do.
12. If asked about ARR, retention, or churn, politely say: "That's a revenue question — please switch to the ARR Revenue Agent for detailed ARR analysis."`,
    maxIterations: 10,
  },

  revenue_agent: {
    key: 'revenue_agent',
    name: 'ARR Revenue Agent',
    description: 'Analyzes ARR movements, customer health, cohort retention, churn patterns, and renewal risk. Understands everything on your Revenue Analytics screen.',
    icon: 'DollarSign',
    systemPrompt: `You are the ARR Revenue AI Analyst for Aether, an enterprise FP&A platform.

You assist users who are looking at the **Revenue Analytics** screen. That screen has 4 tabs, and users will ask questions about exactly what they see. You MUST call your tools to get real data — never guess.

## What the User Sees on the Revenue Screen

### Overview Tab
- **KPI Cards**: Current ARR (selected month), Year End Forecasted ARR (Dec), Forecasted ARR (selected month), Monthly NRR %, Monthly GRR %
- **Full-Year Retention Cards**: Full-Year NRR (Jan→Dec, includes expansion), Full-Year GRR (Jan→Dec, excludes expansion)
- **ARR Trend chart**: Area chart from Jan 2024–Dec 2026 showing Ending ARR (Actual), Ending ARR (Base), Renewals/Extensions, New/Upsell/Cross-Sell — forecast months shown as dashed lines
- **ARR by Category chart**: Horizontal bar chart of top 10 product categories by ARR — clickable for cross-filtering
- **ARR by Region chart**: Horizontal bar chart of ARR across North America, Europe, LATAM, Middle East, APAC — clickable for cross-filtering
- **ARR by Vertical chart**: Pie chart of ARR distribution across verticals (Life Sciences, CPG & Retail, BFSI, etc.) — clickable for cross-filtering

### ARR Movement Tab
- **Lookback Period selector**: 1/3/6/12 Month Back buttons
- **Movement Summary Cards**: Net ARR Change, New Business (green), Expansion (blue), Schedule Change (purple), Contraction (yellow), Churn (red) — clickable to filter detail table
- **ARR Bridge Waterfall chart**: Starting ARR → +New Business → +Expansion → ±Schedule Change → -Contraction → -Churn → Ending ARR — with connecting lines between bars
- **Monthly Movement Trend chart**: Stacked bar chart showing monthly breakdown of all movement types (Jan 2024 to current)
- **ARR Movement Details table**: Customer, Starting ARR, New Business, Expansion, Schedule Chg, Contraction, Churn, Ending ARR, Net Change, Type — sortable, searchable, color-coded rows, top 50
- **Top Expansions card**: Top 5 customers by expansion/new business with change amounts and %
- **Top Contractions & Churns card**: Top 5 customers by contraction/churn with change amounts and %

### Customers Tab
- **Filters**: "Show 2026 Renewals Only" toggle, "Renewal Risk Only" toggle, Customer name search
- **2026 Renewal Risk Distribution chart**: Donut chart showing High Risk, Lost, Mgmt Approval, In Process, Win/PO — clickable segments to filter table
- **2026 Renewal Calendar**: 12-month grid (Jan–Dec 2026) showing SOW count and Total ARR per month — color-coded (Red=high risk, Blue=normal), clickable months
- **Customer Table**: Customer, Total ARR, SOW count, Region, Vertical, Earliest Renewal, Risk — expandable rows showing SOW details (SOW Name, Ending ARR, Quantum/SMART, Contract Start/End, Renewal Risk)
- **Top 10 Customers by ARR chart**: Horizontal bar chart

### Products / ARR by Category Tab
- **View Toggle**: By Category | By Customer
- **Category Summary Cards**: Total Categories, Top Category (by ARR), Total Sub-Categories, Most Adopted (by customer count)
- **Category Performance Table** (expandable): Category/Sub-Category, Total ARR, # Customers, Avg ARR/Customer, # Sub-Categories — expandable to show sub-categories
- **Category ARR Comparison chart**: Vertical bar chart of all categories
- **Customer Category Matrix** (By Customer view): Customer/SOW, Region, Vertical, [Category columns], Total ARR — expandable rows showing SOW-level breakdown
- **Cross-Sell Analysis chart**: Bar chart showing customer count by # of sub-categories (1, 2, 3+) + cross-sell rate %
- **Category Performance Matrix** (scatter): Customer Count (x) vs Avg ARR/Customer (y) per category

### Filters Available to User
Years, Months, Regions (5), Verticals (11), Segments (Enterprise/SMB), Platforms (Quantum/SMART/Cost Drivers/Opus), Quantum/SMART toggle, Revenue Type (Fees/Travel/All — Products tab only)

### Key Business Concepts
- **ARR (Annual Recurring Revenue)**: Recurring revenue normalized to an annual rate
- **NRR (Net Revenue Retention)**: (Ending ARR / Starting ARR) × 100 — includes expansion, contraction, and churn. NRR > 100% means growth from existing customers.
- **GRR (Gross Revenue Retention)**: (Ending ARR - New - Expansion) / Starting ARR × 100 — excludes positive movements. GRR measures pure retention. Max = 100%.
- **ARR Bridge/Waterfall**: Starting ARR + New Business + Expansion ± Schedule Change - Contraction - Churn = Ending ARR
- **Churn ARR**: Revenue lost from customers who leave entirely
- **Contraction ARR**: Revenue reduction from customers who downgrade but stay
- **Expansion ARR**: Revenue increase from existing customers (upsell, cross-sell)
- **Renewal Risk levels**: High Risk, Lost, Mgmt Approval, In Process, Win/PO
- **Cross-Sell Rate**: % of customers using more than one product sub-category

## Tool Usage Rules
1. ALWAYS fetch data with tools before answering. Never fabricate numbers.
2. ARR overview / big picture → call \`get_arr_overview\`
3. Waterfall / bridge / movement questions → call \`get_arr_movement\`
4. Customer risk, renewals, health → call \`get_customer_health\` (optionally filter by riskLevel: "Low"/"Medium"/"High"/"Critical")
5. Cohort / vintage questions → call \`get_cohort_analysis\`
6. Churn questions → call \`get_churn_analysis\`
7. Broad data check → call \`get_revenue_data\`
8. Format ARR as $X.XM or $X,XXX,XXX. Always clarify whether a number is monthly or annualized.
9. When presenting customer lists, use markdown tables.
10. Calculate and present derived metrics: NRR = (Ending/Starting)×100, GRR = ((Starting - Contraction - Churn)/Starting)×100.
11. Provide insights, not just data — flag at-risk renewals, highlight expansion opportunities, explain what's driving NRR.
12. If asked about pipeline, deals, or sales forecasts, politely say: "That's a sales question — please switch to the Sales Pipeline Agent for pipeline and deal analysis."`,
    maxIterations: 10,
  },
};
```

### 4.9 Agent Service (`agent.service.ts`)

```typescript
@Injectable()
export class AgentService {
  private salesGraph: CompiledStateGraph;
  private revenueGraph: CompiledStateGraph;

  constructor(
    private configService: ConfigService,
    private salesService: SalesService,
    private dealService: DealService,
    private forecastService: ForecastService,
    private revenueService: RevenueService,
  ) {
    this.initializeGraphs();
  }

  private initializeGraphs() {
    const llm = new ChatOpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      model: this.configService.get('OPENAI_MODEL') || 'o4-mini',
      temperature: 0,
    });

    const salesTools = createSalesTools(
      this.salesService, this.dealService, this.forecastService
    );
    this.salesGraph = buildToolAgentGraph(llm, salesTools);

    const revenueTools = createRevenueTools(this.revenueService);
    this.revenueGraph = buildToolAgentGraph(llm, revenueTools);
  }

  resolveGraph(agentKey: string) {
    switch (agentKey) {
      case 'sales_agent': return this.salesGraph;
      case 'revenue_agent': return this.revenueGraph;
      default: throw new BadRequestException(`Unknown agent: ${agentKey}`);
    }
  }

  // Streaming: returns AsyncGenerator<string> of NDJSON lines
  async *chatStream(agentKey: string, message: string): AsyncGenerator<string> {
    const config = AGENT_CONFIGS[agentKey];
    const graph = this.resolveGraph(agentKey);

    // Use streamEvents for token-level streaming
    // Convert to AG-UI events using handleStreamEvent + dedupe emitter
    // Yield NDJSON lines: JSON.stringify(event) + '\n'
    // (Implementation follows the pattern from AgenticAI_Reference/runtime/stream-adapter.ts)
  }

  // Sync: returns final response
  async chat(agentKey: string, message: string): Promise<{...}> {
    const config = AGENT_CONFIGS[agentKey];
    const graph = this.resolveGraph(agentKey);
    return runToolAgentGraph(graph, {
      userId: 'system',
      input: message,
      systemPrompt: config.systemPrompt,
      maxIterations: config.maxIterations,
    });
  }

  listAgents() {
    return Object.values(AGENT_CONFIGS).map(c => ({
      key: c.key, name: c.name, description: c.description, icon: c.icon,
    }));
  }
}
```

### 4.10 Agent Controller (`agent.controller.ts`)

Adapt from `AgenticAI_Reference/runtime/agent.controller.ts`:

```typescript
@Controller('agent')
@UseGuards(JwtAuthGuard)
export class AgentController {

  @Get('configs')
  listAgents() {
    return this.agentService.listAgents();
  }

  @Post('chat')
  async chat(@Body() body: ChatDto) {
    return this.agentService.chat(body.agentKey, body.message);
  }

  @Post('chat/stream')
  async chatStream(
    @Body() body: ChatDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Set NDJSON headers (from reference agent.controller.ts lines 172-174)
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Abort on client disconnect (from reference lines 178-184)
    const abortController = new AbortController();
    req.on('close', () => {
      if (!res.writableEnded) abortController.abort();
    });

    // Keepalive ping every 15s (from reference lines 187-191)
    const keepalive = setInterval(() => {
      if (!res.writableEnded && !abortController.signal.aborted) {
        res.write(JSON.stringify({ type: 'ping', content: '' }) + '\n');
      }
    }, 15_000);

    try {
      for await (const chunk of this.agentService.chatStream(
        body.agentKey, body.message
      )) {
        if (abortController.signal.aborted || res.writableEnded) break;
        res.write(chunk);
      }
      if (!res.writableEnded) res.end();
    } catch (e) {
      // Error handling (from reference lines 205-219)
    } finally {
      clearInterval(keepalive);
    }
  }
}
```

### 4.11 Agent Module (`agent.module.ts`)

```typescript
@Module({
  imports: [
    ConfigModule,
    SalesModule,
    RevenueModule,
  ],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
```

**VERIFIED**: `SalesModule` already exports `SalesService`, `DealService`, `ForecastService`. `RevenueModule` already exports `RevenueService`. `DataModule` is `@Global()` so no import needed. No changes required to existing modules.

### 4.12 Register in AppModule

Add `AgentModule` to the `imports` array in `backend/src/app.module.ts`.

### 4.13 Environment Validation

Add to `backend/src/config/env.validation.ts`:
```typescript
OPENAI_API_KEY: Joi.string().optional(),
OPENAI_MODEL: Joi.string().optional().default('o4-mini'),
```

---

## 5. Frontend Implementation

### 5.1 File Structure

```
frontend/src/modules/ai-agent/
├── pages/
│   └── AIAgentPage.tsx                # Agent selection + chat
├── components/
│   ├── AgentSelector.tsx              # Cards to pick sales/revenue agent
│   ├── AgentChat.tsx                  # Chat container (messages + input)
│   ├── ChatMessage.tsx                # Renders a single message (user or agent)
│   ├── ToolCallCard.tsx               # Collapsible card showing tool name, input, output
│   ├── ThinkingIndicator.tsx          # Animated "thinking" / reasoning display
│   └── MarkdownRenderer.tsx           # Renders markdown answer text
├── hooks/
│   └── useAgentStream.ts             # NDJSON stream parser + state management
├── streaming/
│   ├── agui-events.ts                 # AG-UI event types (shared with backend)
│   └── stream-parser.ts              # fetch() + ReadableStream NDJSON parser
└── services/
    └── agent-api.ts                   # API client functions
```

### 5.2 AG-UI Event Types (`streaming/agui-events.ts`)

Mirror the backend types exactly:

```typescript
export type AgUiEventType =
  | 'log' | 'answer' | 'thought' | 'action'
  | 'observation' | 'error' | 'done' | 'ping';

export interface AgUiEvent {
  type: AgUiEventType;
  content: string;
  data?: any;
  toolName?: string;
  toolId?: string;
  toolStatus?: string;
  metadata?: Record<string, unknown>;
}
```

### 5.3 Stream Parser (`streaming/stream-parser.ts`)

```typescript
export async function* parseNdjsonStream(
  response: Response,
  signal?: AbortSignal,
): AsyncGenerator<AgUiEvent> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          yield JSON.parse(trimmed) as AgUiEvent;
        } catch {
          // Skip malformed lines
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      try {
        yield JSON.parse(buffer.trim()) as AgUiEvent;
      } catch {}
    }
  } finally {
    reader.releaseLock();
  }
}
```

### 5.4 useAgentStream Hook (`hooks/useAgentStream.ts`)

```typescript
interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thoughts: string[];
  toolCalls: Array<{
    toolId: string;
    toolName: string;
    status: 'calling' | 'executing' | 'completed' | 'failed';
    input?: any;
    output?: string;
  }>;
  isStreaming: boolean;
}

export function useAgentStream() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = async (agentKey: string, message: string) => {
    // 1. Add user message
    // 2. Add empty assistant message (isStreaming=true)
    // 3. POST to /api/v1/agent/chat/stream
    // 4. Parse NDJSON stream
    // 5. For each event:
    //    - 'thought': append to assistant.thoughts
    //    - 'action': add/update toolCall in assistant.toolCalls
    //    - 'observation': update toolCall output + status
    //    - 'answer': append to assistant.content
    //    - 'error': set error content
    //    - 'ping': ignore
    // 6. When stream ends, set isStreaming=false
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  return { messages, isStreaming, sendMessage, stopStreaming };
}
```

### 5.5 Agent Selector Component (`components/AgentSelector.tsx`)

Two cards side by side:
- **Sales Pipeline Agent** — icon: TrendingUp, description, click → enters chat with `agentKey='sales_agent'`
- **ARR Revenue Agent** — icon: DollarSign, description, click → enters chat with `agentKey='revenue_agent'`

Use the existing Tailwind/shadcn design system from the project.

### 5.6 Chat Components

**ChatMessage.tsx**: Renders based on role:
- User: right-aligned bubble
- Assistant: left-aligned with:
  - Collapsible `ThinkingIndicator` if `thoughts.length > 0`
  - `ToolCallCard` for each tool call (collapsible, shows name + status + input/output)
  - `MarkdownRenderer` for the answer content

**ToolCallCard.tsx**: Collapsible card showing:
- Tool name with status icon (spinner for calling, check for completed, x for failed)
- Expandable section with input params and output (JSON formatted)

**ThinkingIndicator.tsx**: Shows "Thinking..." with animated dots during streaming, then shows accumulated thought text in a muted, collapsible block.

**MarkdownRenderer.tsx**: Use a lightweight markdown renderer. Renders tables, lists, bold, code blocks from the agent's answer.

### 5.7 AIAgentPage Updates

Replace the existing `AIAgentPage.tsx` content:
- Initial view: `AgentSelector` (two cards)
- After selection: `AgentChat` (full chat with the selected agent)
- Back button to return to selector
- Agent name + icon in the chat header

### 5.8 API Service (`services/agent-api.ts`)

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export async function streamAgentChat(
  agentKey: string,
  message: string,
  signal?: AbortSignal,
): Promise<Response> {
  const token = getAuthToken(); // from auth store
  return fetch(`${API_BASE}/agent/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ agentKey, message }),
    signal,
  });
}

export async function fetchAgentConfigs(): Promise<AgentConfig[]> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/agent/configs`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}
```

---

## 6. Implementation Order (for Codex)

Execute in this exact sequence. Each step should be a working increment.

### Step 1: Backend — Core Infrastructure
Files to create:
1. `backend/src/modules/agent/streaming/agui-events.ts` — AG-UI event types
2. `backend/src/modules/agent/streaming/dedupe-emitter.ts` — adapted from reference
3. `backend/src/modules/agent/streaming/stream-graph-events.ts` — adapted from reference
4. `backend/src/modules/agent/graphs/format-tool-error.ts` — adapted from reference (SIMPLIFY: remove `isRetryableError` import and retry logic, just format the error as JSON string with `{tool, error}` fields)
5. `backend/src/modules/agent/graphs/types.ts` — ToolAgentState definition
6. `backend/src/modules/agent/graphs/tool-agent-graph.ts` — ReAct loop (NO HITL version)

### Step 2: Backend — Tools
1. `backend/src/modules/agent/tools/sales.tools.ts` — 8 tools wrapping Sales services
2. `backend/src/modules/agent/tools/revenue.tools.ts` — 6 tools wrapping Revenue services

### Step 3: Backend — Service + Controller + Module
1. `backend/src/modules/agent/config/agent-configs.ts` — system prompts and agent metadata
2. `backend/src/modules/agent/dto/chat.dto.ts` — ChatDto with validation
3. `backend/src/modules/agent/agent.service.ts` — orchestrator
4. `backend/src/modules/agent/agent.controller.ts` — HTTP endpoints
5. `backend/src/modules/agent/agent.module.ts` — NestJS module (imports: ConfigModule, SalesModule, RevenueModule)
6. Register `AgentModule` in `AppModule` imports array
7. Add `OPENAI_API_KEY` and `OPENAI_MODEL` to env validation
8. **NOTE**: SalesModule and RevenueModule already export all needed services. DataModule is @Global(). No changes needed to existing modules.

### Step 4: Frontend — Streaming Infrastructure
1. `frontend/src/modules/ai-agent/streaming/agui-events.ts` — shared types
2. `frontend/src/modules/ai-agent/streaming/stream-parser.ts` — NDJSON parser
3. `frontend/src/modules/ai-agent/services/agent-api.ts` — API client
4. `frontend/src/modules/ai-agent/hooks/useAgentStream.ts` — stream state hook

### Step 5: Frontend — Components
1. `frontend/src/modules/ai-agent/components/MarkdownRenderer.tsx`
2. `frontend/src/modules/ai-agent/components/ThinkingIndicator.tsx`
3. `frontend/src/modules/ai-agent/components/ToolCallCard.tsx`
4. `frontend/src/modules/ai-agent/components/ChatMessage.tsx`
5. `frontend/src/modules/ai-agent/components/AgentSelector.tsx`
6. `frontend/src/modules/ai-agent/components/AgentChat.tsx`

### Step 6: Frontend — Page Integration
1. Rewrite `frontend/src/modules/ai-agent/pages/AIAgentPage.tsx`
2. Verify routing in `Router.tsx` (should already point `/ai` to AIAgentPage)

---

## 7. Key Reference Files (Codex Must Read)

These files in `AgenticAI_Reference/runtime/` are the **primary templates**. Adapt them for our NestJS + no-HITL context:

| Reference File | Maps To | What to Adapt |
|---|---|---|
| `graphs/tool-agent-graph.ts` | `agent/graphs/tool-agent-graph.ts` | Remove HITL (approve/execute nodes). Keep agent→tools→agent ReAct loop + finalize. Use the NO-HITL graph build path (lines 374-389 of original). |
| `ag-ui/events.ts` | `agent/streaming/agui-events.ts` | Remove handoff/approval/guardrail events. Keep: log, answer, thought, action, observation, error, done, ping. |
| `ag-ui/dedupe-emitter.ts` | `agent/streaming/dedupe-emitter.ts` | Remove handoff/approval dedup. Keep: log dedup, tool event dedup, think-tag parser, final answer fallback. |
| `ag-ui/stream-graph-events.ts` | `agent/streaming/stream-graph-events.ts` | Remove INTERNAL_NODES and STRUCTURED_OUTPUT_NODES filtering (empty sets). Keep token streaming, tool start/end, state emission. |
| `agent.controller.ts` | `agent/agent.controller.ts` | Keep chat/stream and configs endpoints. Remove HITL/approval/nudge/simulation endpoints. |
| `agent.service.ts` | `agent/agent.service.ts` | Massive simplification. Only keep: graph initialization, chatStream, chat, listAgents. Remove all HITL/nudge/simulation/memory code. |
| `agent.tools.ts` | `agent/tools/*.ts` | Use same `tool()` + Zod schema pattern but with our SalesService/RevenueService instead of their domain services. |
| `tool-formatters.ts` | `agent/tools/*.ts` (inline) | Apply same principle: format tool output to be concise for LLM. Strip internal fields, limit array lengths. |
| `dto/chat.dto.ts` | `agent/dto/chat.dto.ts` | Same shape: message + agentKey. Remove agentType (we use agentKey only). |

---

## 8. Testing Guidance

### Sales Agent — Overview Tab Questions
1. "What's our Closed ACV year to date?"
2. "What's the weighted pipeline value and how many active deals?"
3. "What's our forecast ACV for this quarter?"
4. "How are we doing vs last year? What's the YoY growth?"
5. "What's our win rate / conversion rate?"
6. "Break down the sales funnel — how many deals at each stage and what's the value?"
7. "Show me the top 10 deals in the pipeline with their probability and stage"
8. "Which deals closed recently? Show me the closed ACV deals with their logo types"

### Sales Agent — Forecast Deep Dive Questions
9. "How is each region performing? Which region has the best YoY growth?"
10. "Is North America growing or declining compared to last year?"
11. "What's the forecast trend month over month vs previous year?"
12. "Which product sub-categories have the highest weighted forecast?"

### Sales Agent — Pipeline Movement Questions
13. "What happened to the pipeline this month vs last month?"
14. "How many new deals were added and what's their total value?"
15. "Which deals decreased in value? Show me the biggest drops"
16. "What deals did we lose this month and at what stage?"
17. "Show me the waterfall bridge from starting to ending pipeline"
18. "What's the pipeline breakdown by product sub-category?"

### Sales Agent — YoY Performance Questions
19. "Who are the top performing sales reps?"
20. "Which reps are underperforming — below 75% attainment?"
21. "Who has the best pipeline coverage?"
22. "Show me the quota attainment for each rep this year"
23. "Which managers have the strongest teams?"

### Revenue Agent — Overview Tab Questions
1. "What's our current ARR?"
2. "What's the forecasted year-end ARR and how much growth does that represent?"
3. "What's our monthly NRR and GRR?"
4. "What's our full-year net retention rate?"
5. "Which product categories contribute the most to ARR?"
6. "How is ARR distributed across regions?"
7. "Which verticals have the largest ARR?"
8. "Show me the ARR trend from 2024 to now"

### Revenue Agent — ARR Movement Questions
9. "Show me the ARR bridge — what's driving the change?"
10. "How much new business ARR did we add?"
11. "What's our expansion vs contraction breakdown?"
12. "How much ARR did we churn?"
13. "Which customers expanded the most?"
14. "Which customers contracted or churned?"
15. "Show me the monthly movement trend over the past year"

### Revenue Agent — Customer Questions
16. "Which customers are up for renewal in 2026?"
17. "Which renewals are high risk?"
18. "Who are our top 10 customers by ARR?"
19. "What's the renewal risk distribution?"
20. "Show me the SOW details for our highest-risk customers"

### Revenue Agent — Products / Category Questions
21. "Which product categories have the most ARR?"
22. "What's our cross-sell rate?"
23. "How many customers use more than one product?"
24. "Show me the cohort analysis — which customer vintage retains best?"

### Cross-Domain Redirect Tests
- Sales Agent: "What's our ARR?" → should say "That's a revenue/ARR question — please switch to the ARR Revenue Agent for detailed ARR analysis."
- Sales Agent: "What's our churn rate?" → redirect to Revenue Agent
- Revenue Agent: "Show me the pipeline deals" → should say "That's a sales/pipeline question — please switch to the Sales Pipeline Agent."
- Revenue Agent: "Who are the top performing reps?" → redirect to Sales Agent

---

## 9. Environment Setup for Codex

Before running Codex, ensure:
1. `OPENAI_API_KEY` is set in `backend/.env`
2. `OPENAI_MODEL=o4-mini` is set in `backend/.env`
3. Backend dependencies are installed: `cd backend && npm install @langchain/core @langchain/langgraph @langchain/openai zod`
4. Backend compiles: `cd backend && npm run build`
5. Frontend compiles: `cd frontend && npm run build`

---

## 10. What NOT to Build (Scope Boundaries)

- No HITL / approval flows
- No conversation persistence to database (in-memory for now)
- No multi-turn memory across page reloads
- No WebSocket (NDJSON over HTTP POST is sufficient)
- No guardrails / safety classification
- No agent handoff between sales and revenue
- No proactive nudges
- No observability / token tracking (can add later)
- No changes to existing AI module (`backend/src/modules/ai/`) — this is a new parallel module
