# Project Aether: Prototype vs Main Project Comparison

## Executive Summary

The prototype (built in Google AI Studio) contains **5 additional modules** not yet implemented in the main production project. This document provides a detailed comparison of functionality between both implementations.

---

## Module Comparison Matrix

| Module | Prototype | Main Project | Status | Priority |
|--------|-----------|--------------|--------|----------|
| Dashboard | `DashboardView.tsx` (25KB) | `DashboardPage.tsx` | ✅ Both | - |
| AI Agent | `AIAgentView.tsx` (5KB) | `AIAgentPage.tsx` | ✅ Both | - |
| Sales | `SalesView.tsx` (20KB) | `SalesPage.tsx` | ✅ Both | - |
| Cost | `CostView.tsx` (27KB) | `CostPage.tsx` | ✅ Both | - |
| Revenue | `RevenueView.tsx` (29KB) | `RevenuePage.tsx` | ✅ Both | - |
| Scenarios | `ScenarioView.tsx` (12KB) | `ScenariosPage.tsx` | ✅ Both | - |
| Data Fabric | `DataFabricView.tsx` (6KB) | `DataFabricPage.tsx` | ✅ Both | - |
| Governance | `GovernanceView.tsx` (19KB) | `GovernancePage.tsx` | ✅ Both | - |
| Settings | - | `SettingsPage.tsx` | Main Only | - |
| Integrations | - | `IntegrationsPage.tsx` | Main Only | - |
| Auth/Login | - | `LoginPage.tsx` | Main Only | - |
| **Reports** | `ReportsView.tsx` (23KB) | ❌ Missing | **Migrate** | High |
| **Training** | `TrainingView.tsx` (33KB) | ❌ Missing | **Migrate** | Medium |
| **Marketing** | `MarketingView.tsx` (7KB) | ❌ Missing | **Migrate** | Medium |
| **GTM** | `GTMView.tsx` (4KB) | ❌ Missing | **Migrate** | Medium |
| **Intelligent Core** | `IntelligentCoreView.tsx` (14KB) | ❌ Missing | **Migrate** | High |

---

## Detailed Module Analysis

### 1. Reports Module (Missing from Main)

**File:** `ReportsView.tsx` (~364 lines)

**Purpose:** Profitability analysis with deep margin analytics

**Key Features:**
- **View Toggle**: Switch between "License Profitability" and "Implementation Profitability"
- **Multi-dimensional Filtering**: Region, Segment, Vertical
- **Visualizations**:
  - Margin by Region (horizontal bar chart)
  - Margin by Segment (vertical bar chart)
  - Account Distribution scatter plot (Revenue vs Margin)
  - Net Margin Trend (area chart with gradient)
- **Data Tables**:
  - Account Profitability Details (paginated)
  - Segment Profitability Breakdown with progress bars
- **Metrics**:
  - Total Revenue
  - Cloud/TSO Cost
  - Resource/Engineering Cost
  - Gross/Net Margin %

**Dependencies:**
- `recharts` (BarChart, ScatterChart, AreaChart)
- `lucide-react` icons
- Constants: `REGIONS`, `SEGMENTS`, `VERTICALS`

**Migration Effort:** Medium - self-contained with mock data generator

---

### 2. Training Center Module (Missing from Main)

**File:** `TrainingView.tsx` (~571 lines)

**Purpose:** Interactive documentation and system training center

**Key Features:**
- **Architecture Diagram**: Visual representation of Aether's 3-layer architecture
  - Executive Experience Layer (Command Center, Agent, Scenario Engine)
  - Agent Orchestration + Intelligent Core
  - Unified Data Fabric (ERP, CRM, HRIS, Market Data)
- **Documentation Sections** (10 total):
  1. System Architecture Overview
  2. Sales Performance guide
  3. Profitability Reports guide
  4. Marketing Metrics guide
  5. Go-To-Market (GTM) guide
  6. Revenue & Profitability guide
  7. Cost Intelligence guide
  8. Intelligent Core guide
  9. Scenario Planning guide
  10. Governance & Lineage guide
- **Interactive Navigation**: Sidebar with section highlighting
- **Core Capabilities Documentation**:
  - Digital Twin
  - Generative Reasoning
  - Auto-Correction
  - Explainable AI (SHAP)

**Dependencies:**
- `lucide-react` icons (extensive)
- No chart libraries needed

**Migration Effort:** Low - pure documentation/UI component

---

### 3. Marketing Metrics Module (Missing from Main)

**File:** `MarketingView.tsx` (~108 lines)

**Purpose:** Customer acquisition analytics and channel performance

**Key Features:**
- **Customer Acquisition by Channel**: Horizontal bar chart comparing Revenue Generated vs CAC
- **Lead Distribution**: Pie chart showing lead volume by channel
- **Channel Performance Table**:
  - Channel name
  - Lead count
  - Conversion Rate %
  - CAC (Customer Acquisition Cost)
  - Revenue Generated
  - Efficiency multiplier (Revenue/CAC ratio)

**Visualizations:**
- `BarChart` (horizontal layout)
- `PieChart` with labels

**Dependencies:**
- `recharts`
- `ACQUISITION_CHANNELS` constant (needs migration)

**Migration Effort:** Low - small, focused module

---

### 4. GTM (Go-To-Market) Module (Missing from Main)

**File:** `GTMView.tsx` (~65 lines)

**Purpose:** Unit economics and growth efficiency KPI dashboard

**Key Features:**
- **Metric Cards Grid** (8 KPIs):
  - CAC (Customer Acquisition Cost)
  - CAC Payback Period
  - LTV (Lifetime Value)
  - LTV:CAC Ratio
  - Traffic to Lead Ratio
  - Return on Ad Spend (ROAS)
  - Time to Value
  - Cost Per Lead (CPL)
- **Trend Indicators**: Up/Down arrows with % change vs last quarter
- **Explanation Panel**: Business context for metrics

**Dependencies:**
- `lucide-react` icons
- `MOCK_GTM_METRICS` constant (needs migration)

**Migration Effort:** Very Low - simple KPI card layout

---

### 5. Intelligent Core Module (Missing from Main)

**File:** `IntelligentCoreView.tsx` (~250 lines)

**Purpose:** ML/AI model monitoring, health, and governance

**Key Features:**
- **Compute Resources Panel**:
  - GPU Utilization (H100 Cluster)
  - Memory Allocation
  - API Token Consumption
- **System Latency Chart**: Real-time line chart
- **Active Model Registry** (4 models):
  - Revenue Forecasting
  - Anomaly Detection
  - Churn Prediction
  - Driver Analysis
  - Per-model metrics: Accuracy, Bias Score, Last Retrained
  - Drift Detection status
  - **Interactive Retraining**: Click to retrain with progress bar
- **Autonomous Decisions Log**:
  - Auto-scaling events
  - Forecast adjustments
  - Anomaly alerts
  - Data ingestion status

**Dependencies:**
- `recharts` (LineChart)
- `MODEL_METRICS` constant
- `useState`, `useEffect` for retraining simulation

**Migration Effort:** Medium - has interactive state management

---

## Constants/Data to Migrate

The prototype uses centralized constants in `constants.ts`. These need migration:

```typescript
// From prototype/constants.ts - Key exports needed:

export const VERTICALS: Vertical[] = ['CPG', 'AIM', 'TMT', 'E&U', 'LS', 'Others'];
export const LOBS: LOB[] = ['Software', 'Services'];
export const REGIONS: Region[] = ['North America', 'Europe', 'Middle East', 'Asia Pacific', 'Latin America'];
export const SEGMENTS: Segment[] = ['Enterprise', 'Mid-Market'];

export const ACQUISITION_CHANNELS: AcquisitionChannel[];
export const MOCK_GTM_METRICS: GTMMetric[];
export const MODEL_METRICS: ModelHealthMetric[];
```

---

## Types to Migrate

From `prototype/types.ts`:

```typescript
// Marketing/GTM Types
interface AcquisitionChannel {
    channel: string;
    leads: number;
    conversionRate: number;
    cac: number;
    revenueGenerated: number;
}

interface GTMMetric {
    metric: string;
    value: number | string;
    trend: number;
    unit: string;
}

// Intelligent Core Types
interface ModelHealthMetric {
  modelName: string;
  accuracy: number;
  biasScore: number;
  driftDetected: boolean;
  lastRetrained: string;
}
```

---

## Recommended Migration Order

1. **GTM Module** (Very Low effort, high value KPIs)
2. **Marketing Module** (Low effort, complements Sales)
3. **Reports Module** (Medium effort, critical for CFO use case)
4. **Intelligent Core** (Medium effort, important for AI governance)
5. **Training Center** (Low effort, but large - good for onboarding)

---

## Sidebar Navigation Updates Required

The main project's sidebar needs to add routes for:

```typescript
// In frontend routing:
{ path: '/reports', component: ReportsPage }
{ path: '/marketing', component: MarketingPage }
{ path: '/gtm', component: GTMPage }
{ path: '/intelligence', component: IntelligentCorePage }
{ path: '/training', component: TrainingPage }
```

---

## Backend API Considerations

Most prototype modules use **mock data**. For production:

| Module | Backend Endpoints Needed |
|--------|-------------------------|
| Reports | `/api/v1/reports/profitability`, `/api/v1/reports/margin-trend` |
| Marketing | `/api/v1/marketing/channels`, `/api/v1/marketing/acquisition` |
| GTM | `/api/v1/metrics/gtm` |
| Intelligent Core | `/api/v1/ai/models`, `/api/v1/ai/models/:id/retrain`, `/api/v1/ai/decisions` |
| Training | None (static content) |

---

## Summary

| Metric | Value |
|--------|-------|
| Missing Modules | 5 |
| Total Lines to Migrate | ~1,358 lines |
| Estimated Migration Time | 2-3 days |
| New Backend Endpoints | ~8 |
| New Types/Interfaces | ~5 |
