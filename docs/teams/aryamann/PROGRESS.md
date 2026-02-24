# Aryamann - Progress Log

> Claude Code: Always update this file after completing tasks for Aryamann.
> Read `docs/teams/COMMON.md` for team workflow rules.

---

<!-- Add entries below in reverse chronological order (newest first) -->

## 2026-02-24 - ARR Revenue Agent Supervisor Architecture

**Task:** Refactor ARR Revenue Agent from a single flat ReAct agent (15 tools) into a Supervisor pattern with 4 sub-agents matching the 4 frontend Revenue tabs, each with focused tools, proper parameter schemas, date context, and clarification behavior.

**New Files Created:**
- `backend/src/modules/agent/graphs/arr/supervisor.ts` — Supervisor with router, 4 sub-agents (Overview, Movement, Customers, Products), date context, clarification behavior
- `backend/src/modules/agent/graphs/arr/tools/overview.tools.ts` — 4 tools: `get_arr_overview_metrics`, `get_arr_trend`, `get_arr_by_dimension`, `get_revenue_overview`
- `backend/src/modules/agent/graphs/arr/tools/movement.tools.ts` — 3 tools: `get_movement_summary`, `get_movement_customers`, `get_movement_trend`
- `backend/src/modules/agent/graphs/arr/tools/customers.tools.ts` — 4 tools: `get_customers_list`, `get_renewal_risk`, `get_customer_health`, `get_cohort_analysis`
- `backend/src/modules/agent/graphs/arr/tools/products.tools.ts` — 1 tool: `get_products`

**Files Modified:**
- `backend/src/modules/agent/graphs/arr/index.ts` — Updated exports to new supervisor + tool files
- `backend/src/modules/agent/agent.service.ts` — Replaced `buildArrAgent`/`streamArrAgent` with `buildArrSupervisor`/`streamArrSupervisor`, wires 4 tool sets
- `backend/src/modules/agent/config/agent-configs.ts` — Set `hasSupervisor: true` for `arr_revenue`, simplified systemPrompt to tab-aware context

**Architecture:**
```
User Query → Router (LLM classification) → Route Decision
  ├─ Overview Agent (4 tools) — KPIs, ARR trend, dimension breakdowns
  ├─ Movement Agent (3 tools) — Waterfall bridge, customer movements, trends
  ├─ Customers Agent (4 tools) — Customer list, renewal risk, health, cohorts
  └─ Products Agent (1 tool) — Category performance
```

**Dropped 3 legacy/redundant tools:** `get_arr_movement`, `get_churn_analysis`, `get_revenue_data_summary`

**Status:** Completed (TypeScript compiles clean)
**Branch:** commonbranch

---

## 2026-02-24 - Sales Agent Context Awareness & Clarification Behavior

**Task:** Fix Sales Performance Agent not understanding context ("this year" → empty params) and not asking clarifying questions when revenue type (License/Implementation/All) is ambiguous.

**Changes:**
- `backend/src/modules/agent/graphs/sales/supervisor.ts`:
  - Added `getDateContext()` helper that dynamically generates current date/year/quarter/month context block
  - Added `## Current Date Context` and `## Smart Date Inference` sections injected into all 4 sub-agent prompts at runtime via `buildSalesSupervisor()`
  - Added **Rule 7 (CLARIFICATION REQUIRED)** to Overview and Forecast sub-agent prompts: agent must ask user whether they want License, Implementation, or All ACV before calling tools when revenueType is ambiguous
  - Added **Rule 8/9 (SMART DEFAULTS)** to all 4 sub-agent prompts: never pass empty filters, always infer current year as minimum
  - Date context is computed fresh each time `buildSalesSupervisor()` is called (not stale)

**Behavior change:**
- "What's our Closed ACV and Forecast ACV this year?" → Agent now asks "License, Implementation, or All?" THEN calls tools with `year: ["2026"]` + user's chosen revenueType
- "What's our Closed ACV for 2026 and Forecast license ACV for 2026?" → Still works as before (year + revenueType already explicit)

**Status:** Completed
**Branch:** commonbranch

---

## 2026-02-24 - Comprehensive Project Documentation (3 Deep-Dive Docs)

**Task:** Create three developer deep-dive documentation files analyzing the entire codebase — frontend, backend, and agentic AI system — with inline code snippets, best practices audit, and actionable upgrade recommendations.

**Changes:**
- `docs/Arya_FrontEnd.md` (857 lines) — Frontend architecture, state management (Zustand + React Query), API client interceptors, Sales Performance page deep-dive (data pipeline, filters, waterfall charts, sortable tables), ARR Revenue page deep-dive (NRR/GRR calculations, renewal risk), 19 best practices identified, 12 upgrade recommendations
- `docs/Arya_Backend.md` (1,022 lines) — NestJS bootstrap, module system, Prisma multi-tenant schema, JWT+MFA auth, all business modules (Sales, Revenue, Cost, Dashboard, Scenarios, Governance), data pipeline, AI/ML services, infrastructure layer, 23 best practices, 10 upgrades
- `docs/Arya_Agentic.md` (1,172 lines) — Full LangGraph agent architecture (Supervisor + 4 sub-agents), all 32 tools cataloged, NDJSON streaming pipeline, AG-UI event protocol, frontend chat UI analysis, 20 best practices, performance analysis showing 90s breakdown, 10 solutions with priority matrix to achieve <30s target

**Status:** Completed
**Branch:** commonbranch

---

## 2026-02-23 - Agent Chat UI Cleanup & Polish

**Task:** Fix multiple UX issues on the AI Agent chat page: duplicate agent name display, truncated routing reason text, mispositioned user avatar, and overall minimal polish.

**Changes:**
- `frontend/src/modules/ai-agent/pages/AIAgentPage.tsx` - Hide page-level header (AI Financial Analyst + subtitle) when agent is selected so agent name no longer appears twice
- `frontend/src/modules/ai-agent/components/ChatMessage.tsx` - Removed `truncate max-w-[200px]` from route reason so full sentence displays; aligned avatars to bottom of messages using `items-end`; moved name + timestamp below the bubble (instead of name above, timestamp below); softened border and badge colors
- `frontend/src/modules/ai-agent/components/AgentChat.tsx` - Removed redundant description line from chat header; added inline Online badge; redesigned input area with rounded-xl, lighter bg, send icon updated to paper-plane; smaller hint text

**Status:** Completed
**Branch:** Arya_Feb_23

---

## 2026-02-23 - Agent Supervisor Architecture (Sales + ARR Graph Folders)

**Task:** Rebuild agent architecture with two separate graph folders: Sales Performance Agent with Supervisor + 4 sub-agents, and ARR Agent (partial). Add `route` event type to streaming protocol and routing badge in frontend.

**Changes:**

Backend - New files:
- `backend/src/modules/agent/graphs/sales/supervisor.ts` - Sales Supervisor graph: Router node (LLM classification) + 4 sub-agent dispatch + streaming
- `backend/src/modules/agent/graphs/sales/tools/overview.tools.ts` - 8 tools using SalesComputeService (KPIs, funnel, key deals, closed deals, forecast by quarter, deals, deal by ID, at-risk)
- `backend/src/modules/agent/graphs/sales/tools/forecast.tools.ts` - 5 tools (regional performance, forecast trend, sub-category forecast, AI scenarios, Monte Carlo)
- `backend/src/modules/agent/graphs/sales/tools/pipeline.tools.ts` - 2 tools (pipeline movement waterfall, pipeline by sub-category)
- `backend/src/modules/agent/graphs/sales/tools/yoy.tools.ts` - 2 tools (sales rep performance, NEW monthly attainment heatmap)
- `backend/src/modules/agent/graphs/sales/index.ts` - Barrel exports
- `backend/src/modules/agent/graphs/arr/tools.ts` - 12 tools (6 basic RevenueService + 6 new RevenueComputeService: overview metrics, ARR trend, ARR by dimension, movement summary, renewal risk, products)
- `backend/src/modules/agent/graphs/arr/agent.ts` - Single ReAct agent (partial, no supervisor yet)
- `backend/src/modules/agent/graphs/arr/index.ts` - Barrel exports

Backend - Modified files:
- `backend/src/modules/agent/streaming/agui-events.ts` - Added `'route'` to AgUiEventType
- `backend/src/modules/agent/config/agent-configs.ts` - Added `hasSupervisor` field, updated prompts, renamed to "Sales Performance Agent"
- `backend/src/modules/agent/agent.service.ts` - Rewired to use Sales Supervisor graph + ARR Agent graph, injected SalesComputeService + RevenueComputeService
- `backend/src/modules/agent/agent.module.ts` - No module import changes needed (SalesModule/RevenueModule already export compute services)

Frontend - Modified files:
- `frontend/src/modules/ai-agent/streaming/agui-events.ts` - Added `'route'` to AgUiEventType
- `frontend/src/modules/ai-agent/hooks/useAgentStream.ts` - Added RouteInfo interface, handle `'route'` events, pass route to ChatMessage state
- `frontend/src/modules/ai-agent/components/ChatMessage.tsx` - Added routing badge UI (indigo pill showing "Routed to: <tab>" with reason)

**Architecture:**
- Sales Agent: Supervisor → Router (LLM classifies into overview/forecast/pipeline/yoy) → Sub-agent with focused tools
- ARR Agent: Single ReAct agent with 12 tools (6 basic + 6 compute-backed) — partial, ~75% coverage
- New `route` event flows: backend emits → NDJSON stream → frontend displays badge

**Tool Distribution:**
| Sub-Agent | Tab | Tools | Source |
|-----------|-----|-------|--------|
| Overview | Tab 1 | 8 | SalesComputeService + DealService |
| Forecast Deep Dive | Tab 2 | 5 | SalesComputeService + ForecastService |
| Pipeline Movement | Tab 3 | 2 | SalesComputeService |
| YoY Performance | Tab 4 | 2 | SalesComputeService |
| **Total Sales** | | **17** | |
| ARR Agent | All | 12 | RevenueService + RevenueComputeService |

**Status:** Complete (backend architecture + frontend routing badge)
**Branch:** Arya_Feb_23

---

## 2026-02-19 - Per-Module API Architecture + Backend Error Guard

**Task:** Replace monolithic `/data/all` endpoint with per-module APIs; add BackendStatusGuard so frontend shows error state when backend is down instead of displaying mock data.

**Changes:**

Backend:
- `backend/src/modules/sales/sales.service.ts` - Rewrote to inject `DataService`, added `getSalesData()` that reads from CSVs; replaced hardcoded pipeline/metrics/trends with real CSV-computed data
- `backend/src/modules/sales/sales.controller.ts` - Added `GET /sales/data` public endpoint
- `backend/src/modules/revenue/revenue.service.ts` - Rewrote to inject `DataService`, added `getRevenueData()` reading CSVs; replaced hardcoded overview/ARR/health/cohort/churn with real CSV-computed data
- `backend/src/modules/revenue/revenue.controller.ts` - Added `GET /revenue/data` public endpoint

Frontend stores:
- `frontend/src/shared/store/salesDataStore.ts` (new) - Zustand store calling `GET /sales/data`, caches in memory
- `frontend/src/shared/store/revenueDataStore.ts` (new) - Zustand store calling `GET /revenue/data`, caches in memory
- `frontend/src/shared/store/dataTypes.ts` (renamed from `realDataStore.ts`) - Now only exports shared types & parsing utilities, no store
- Deleted `frontend/src/shared/store/realDataStore.ts`

Frontend pages:
- `frontend/src/modules/sales/pages/SalesPage.tsx` -