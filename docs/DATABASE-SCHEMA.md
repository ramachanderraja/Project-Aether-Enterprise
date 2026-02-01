# Project Aether - Database Schema Design

## Enterprise Autonomous FP&A Platform

**Version:** 1.0
**Date:** January 31, 2026
**Database:** PostgreSQL 15+
**ORM:** Prisma

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Core Domain Tables](#2-core-domain-tables)
3. [Financial Domain Tables](#3-financial-domain-tables)
4. [Sales Domain Tables](#4-sales-domain-tables)
5. [AI Domain Tables](#5-ai-domain-tables)
6. [Governance Domain Tables](#6-governance-domain-tables)
7. [Integration Domain Tables](#7-integration-domain-tables)
8. [Indexes and Performance](#8-indexes-and-performance)
9. [Prisma Schema](#9-prisma-schema)
10. [Migration Strategy](#10-migration-strategy)

---

## 1. Schema Overview

### 1.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIP OVERVIEW                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CORE DOMAIN                                                                        │
│  ───────────                                                                        │
│  organizations ──┬── users                                                          │
│                  ├── organization_settings                                          │
│                  └── (all other tables via org_id)                                  │
│                                                                                      │
│  FINANCIAL DOMAIN                                                                   │
│  ────────────────                                                                   │
│  financial_metrics ◄─── anomalies                                                   │
│  budgets ◄─── budget_line_items                                                     │
│  vendors ◄─── vendor_spend                                                          │
│  departments ◄─── department_costs                                                  │
│                                                                                      │
│  SALES DOMAIN                                                                       │
│  ────────────                                                                       │
│  deals ◄─── deal_history (audit trail)                                              │
│  deals ───► users (owner)                                                           │
│  pipeline_snapshots (point-in-time)                                                 │
│                                                                                      │
│  AI DOMAIN                                                                          │
│  ─────────                                                                          │
│  ai_conversations ◄─── ai_messages                                                  │
│  ai_models ◄─── ai_model_metrics                                                    │
│  ai_actions (autonomous action log)                                                 │
│                                                                                      │
│  SCENARIOS DOMAIN                                                                   │
│  ────────────────                                                                   │
│  scenarios ◄─── scenario_results                                                    │
│                                                                                      │
│  GOVERNANCE DOMAIN                                                                  │
│  ─────────────────                                                                  │
│  audit_logs (immutable)                                                             │
│  compliance_controls ◄─── compliance_issues                                         │
│  data_lineage_nodes ◄─── data_lineage_edges                                         │
│                                                                                      │
│  INTEGRATION DOMAIN                                                                 │
│  ──────────────────                                                                 │
│  integrations ◄─── integration_syncs                                                │
│  integration_logs                                                                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Database Conventions

| Convention | Standard | Example |
|------------|----------|---------|
| Table names | snake_case, plural | `financial_metrics` |
| Column names | snake_case | `created_at` |
| Primary keys | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign keys | `{table}_id` | `organization_id` |
| Timestamps | `created_at`, `updated_at` | `TIMESTAMPTZ` |
| Soft deletes | `deleted_at` | `TIMESTAMPTZ NULL` |
| Enums | PostgreSQL ENUM | `CREATE TYPE role_type AS ENUM (...)` |

---

## 2. Core Domain Tables

### 2.1 Organizations

```sql
-- Multi-tenant organization table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500),
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'standard', -- 'starter', 'standard', 'enterprise'
    subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'cancelled'

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT org_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Settings JSONB structure:
-- {
--   "fiscalYearStart": "January",
--   "currency": "USD",
--   "timezone": "America/New_York",
--   "features": {
--     "aiAgent": true,
--     "scenarios": true,
--     "governance": true
--   },
--   "integrations": {
--     "sap": { "enabled": true },
--     "salesforce": { "enabled": true }
--   }
-- }

CREATE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;
```

### 2.2 Users

```sql
-- User role enum
CREATE TYPE user_role AS ENUM ('CFO', 'FINANCE_MANAGER', 'ANALYST', 'VIEWER', 'ADMIN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Identity
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),

    -- Authentication (for non-SSO)
    password_hash VARCHAR(255),
    mfa_secret VARCHAR(255),
    mfa_enabled BOOLEAN DEFAULT FALSE,

    -- Authorization
    role user_role NOT NULL DEFAULT 'VIEWER',
    permissions JSONB DEFAULT '[]',

    -- Scope (for row-level security)
    region VARCHAR(50),
    department VARCHAR(100),

    -- Preferences
    preferences JSONB DEFAULT '{}',

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending', 'locked'
    last_login_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,

    -- External identity
    external_id VARCHAR(255), -- From SSO provider
    identity_provider VARCHAR(100), -- 'okta', 'azure_ad', 'google'

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,

    -- Constraints
    UNIQUE (organization_id, email),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Preferences JSONB structure:
-- {
--   "theme": "dark",
--   "dashboardLayout": "default",
--   "notifications": {
--     "email": true,
--     "inApp": true,
--     "anomalyAlerts": true
--   },
--   "defaultFilters": {
--     "region": "North America",
--     "dateRange": "last_30_days"
--   }
-- }

CREATE INDEX idx_users_org_email ON users(organization_id, email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_external_id ON users(identity_provider, external_id) WHERE deleted_at IS NULL;
```

### 2.3 Sessions

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session data
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,

    -- Validity
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Device info JSONB structure:
-- {
--   "browser": "Chrome 120",
--   "os": "Windows 11",
--   "device": "Desktop",
--   "location": "New York, US"
-- }

CREATE INDEX idx_sessions_user ON user_sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE revoked_at IS NULL;
```

---

## 3. Financial Domain Tables

### 3.1 Financial Metrics

```sql
-- Metric type enum
CREATE TYPE metric_type AS ENUM (
    'REVENUE', 'ARR', 'MRR', 'EBITDA', 'GROSS_MARGIN',
    'OPERATING_EXPENSE', 'CASH_FLOW', 'NET_INCOME',
    'CAC', 'LTV', 'NRR', 'CHURN_RATE'
);

CREATE TABLE financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Dimensions
    metric_date DATE NOT NULL,
    metric_type metric_type NOT NULL,
    region VARCHAR(50),
    lob VARCHAR(50), -- Line of Business: 'Software', 'Services'
    product VARCHAR(100),

    -- Values
    actual_value DECIMAL(20, 2),
    forecast_value DECIMAL(20, 2),
    budget_value DECIMAL(20, 2),

    -- Forecast confidence
    confidence_lower DECIMAL(20, 2),
    confidence_upper DECIMAL(20, 2),
    forecast_model VARCHAR(100), -- Model that generated forecast

    -- Metadata
    currency VARCHAR(3) DEFAULT 'USD',
    source_system VARCHAR(100),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE (organization_id, metric_date, metric_type, region, lob, product)
) PARTITION BY RANGE (metric_date);

-- Create partitions by month
CREATE TABLE financial_metrics_2024_01 PARTITION OF financial_metrics
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE financial_metrics_2024_02 PARTITION OF financial_metrics
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- ... continue for each month

CREATE INDEX idx_financial_metrics_lookup
    ON financial_metrics(organization_id, metric_date, metric_type);
CREATE INDEX idx_financial_metrics_region
    ON financial_metrics(organization_id, region) WHERE region IS NOT NULL;
```

### 3.2 Budgets

```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Budget identification
    name VARCHAR(255) NOT NULL,
    fiscal_year INTEGER NOT NULL,
    version VARCHAR(50) DEFAULT 'v1', -- Support multiple budget versions
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'locked'

    -- Scope
    department_id UUID REFERENCES departments(id),
    region VARCHAR(50),

    -- Totals (computed from line items)
    total_amount DECIMAL(20, 2),

    -- Approval workflow
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    UNIQUE (organization_id, fiscal_year, version, department_id)
);

CREATE TABLE budget_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,

    -- Line item details
    category VARCHAR(100) NOT NULL, -- 'Payroll', 'Software', 'Travel', etc.
    subcategory VARCHAR(100),
    description TEXT,

    -- Amounts by period
    q1_amount DECIMAL(20, 2) DEFAULT 0,
    q2_amount DECIMAL(20, 2) DEFAULT 0,
    q3_amount DECIMAL(20, 2) DEFAULT 0,
    q4_amount DECIMAL(20, 2) DEFAULT 0,
    annual_amount DECIMAL(20, 2) GENERATED ALWAYS AS (q1_amount + q2_amount + q3_amount + q4_amount) STORED,

    -- Assumptions
    assumptions JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budget_line_items_budget ON budget_line_items(budget_id);
```

### 3.3 Vendors

```sql
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Vendor info
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Cloud Infrastructure', 'SaaS', 'Professional Services'
    description TEXT,

    -- Contract details
    contract_value DECIMAL(20, 2),
    contract_start_date DATE,
    contract_end_date DATE,
    payment_terms VARCHAR(100), -- 'Net 30', 'Annual prepaid'
    auto_renewal BOOLEAN DEFAULT FALSE,

    -- Risk assessment
    risk_level risk_level DEFAULT 'low',
    risk_notes TEXT,

    -- Contact
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending_review'

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (organization_id, name)
);

CREATE TABLE vendor_spend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Period
    period_date DATE NOT NULL, -- First of month

    -- Amounts
    amount DECIMAL(20, 2) NOT NULL,
    budget_amount DECIMAL(20, 2),

    -- Metrics
    yoy_change DECIMAL(5, 2), -- Year-over-year change percentage

    -- Breakdown (optional)
    breakdown JSONB, -- { "compute": 50000, "storage": 20000 }

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (vendor_id, period_date)
);

CREATE INDEX idx_vendor_spend_period ON vendor_spend(organization_id, period_date);
```

### 3.4 Departments

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Department info
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- Internal code like 'ENG-001'
    parent_id UUID REFERENCES departments(id), -- For hierarchy

    -- Leadership
    head_user_id UUID REFERENCES users(id),

    -- Budget
    annual_budget DECIMAL(20, 2),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (organization_id, name)
);

CREATE TABLE department_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Period
    period_date DATE NOT NULL,

    -- Cost categories
    payroll DECIMAL(20, 2) DEFAULT 0,
    software DECIMAL(20, 2) DEFAULT 0,
    travel DECIMAL(20, 2) DEFAULT 0,
    marketing DECIMAL(20, 2) DEFAULT 0,
    other DECIMAL(20, 2) DEFAULT 0,

    -- Headcount
    headcount INTEGER,

    -- Computed
    total_cost DECIMAL(20, 2) GENERATED ALWAYS AS (payroll + software + travel + marketing + other) STORED,
    cost_per_employee DECIMAL(20, 2) GENERATED ALWAYS AS (
        CASE WHEN headcount > 0 THEN (payroll + software + travel + marketing + other) / headcount ELSE 0 END
    ) STORED,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (department_id, period_date)
);

CREATE INDEX idx_dept_costs_period ON department_costs(organization_id, period_date);
```

### 3.5 Anomalies

```sql
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE anomaly_status AS ENUM ('open', 'investigating', 'resolved', 'dismissed');

CREATE TABLE anomalies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Detection
    metric_type metric_type NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detection_model VARCHAR(100), -- Model that detected it

    -- Details
    severity severity_level NOT NULL,
    description TEXT NOT NULL,
    primary_driver VARCHAR(200),
    impact_value DECIMAL(20, 2),
    impact_percentage DECIMAL(5, 2),

    -- Context
    affected_period_start DATE,
    affected_period_end DATE,
    affected_region VARCHAR(50),
    affected_department VARCHAR(100),

    -- AI Analysis
    ai_analysis TEXT, -- Gemini-generated RCA
    ai_analysis_at TIMESTAMPTZ,
    ai_confidence DECIMAL(5, 2),

    -- Action plan
    action_plan TEXT, -- Gemini-generated action plan
    action_plan_at TIMESTAMPTZ,

    -- Resolution
    status anomaly_status DEFAULT 'open',
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,

    -- Related
    related_anomaly_ids UUID[],

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomalies_status ON anomalies(organization_id, status) WHERE status != 'resolved';
CREATE INDEX idx_anomalies_severity ON anomalies(organization_id, severity) WHERE status = 'open';
CREATE INDEX idx_anomalies_detected ON anomalies(organization_id, detected_at DESC);
```

---

## 4. Sales Domain Tables

### 4.1 Deals

```sql
CREATE TYPE deal_stage AS ENUM (
    'Prospecting', 'Discovery', 'Proposal', 'Negotiation',
    'Legal Review', 'Closed Won', 'Closed Lost'
);

CREATE TYPE deal_region AS ENUM (
    'North America', 'Europe', 'Middle East', 'Asia Pacific', 'Latin America'
);

CREATE TYPE deal_segment AS ENUM ('Enterprise', 'Mid-Market', 'SMB');
CREATE TYPE deal_lob AS ENUM ('Software', 'Services');

CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- External reference
    external_deal_id VARCHAR(100), -- ID from CRM
    external_system VARCHAR(100), -- 'salesforce', 'hubspot'

    -- Deal info
    name VARCHAR(500),
    account_name VARCHAR(255),
    account_id UUID,

    -- Categorization
    region deal_region NOT NULL,
    segment deal_segment NOT NULL,
    lob deal_lob NOT NULL,
    vertical VARCHAR(50), -- 'CPG', 'TMT', 'LS', etc.
    revenue_type VARCHAR(50), -- 'License', 'Implementation', 'Subscription'

    -- Stage
    stage deal_stage NOT NULL,
    stage_entered_at TIMESTAMPTZ DEFAULT NOW(),

    -- Value
    value DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Probability
    probability DECIMAL(5, 2) NOT NULL, -- 0-100
    weighted_value DECIMAL(20, 2) GENERATED ALWAYS AS (value * probability / 100) STORED,

    -- Timeline
    days_in_pipeline INTEGER DEFAULT 0,
    expected_close_date DATE,
    actual_close_date DATE,

    -- Ownership
    owner_id UUID REFERENCES users(id),

    -- Channel
    channel VARCHAR(100), -- 'Outbound', 'Inbound', 'Partner', etc.
    campaign_source VARCHAR(200),

    -- Close info (for closed deals)
    close_reason VARCHAR(255), -- For lost deals
    competitor_lost_to VARCHAR(255),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ, -- Last sync from external system

    UNIQUE (organization_id, external_deal_id, external_system)
);

CREATE INDEX idx_deals_org_stage ON deals(organization_id, stage);
CREATE INDEX idx_deals_org_owner ON deals(organization_id, owner_id);
CREATE INDEX idx_deals_org_region ON deals(organization_id, region);
CREATE INDEX idx_deals_close_date ON deals(organization_id, expected_close_date) WHERE stage NOT IN ('Closed Won', 'Closed Lost');
```

### 4.2 Deal History

```sql
CREATE TABLE deal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,

    -- Change details
    field_changed VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,

    -- Actor
    changed_by UUID REFERENCES users(id),
    change_source VARCHAR(50), -- 'user', 'sync', 'system'

    -- Audit
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_history_deal ON deal_history(deal_id, changed_at DESC);
```

### 4.3 Pipeline Snapshots

```sql
-- Point-in-time snapshot of pipeline for historical comparison
CREATE TABLE pipeline_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Snapshot timing
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarter_end'

    -- Aggregated metrics
    total_pipeline_value DECIMAL(20, 2),
    weighted_pipeline_value DECIMAL(20, 2),
    deal_count INTEGER,

    -- By stage (JSONB for flexibility)
    stage_breakdown JSONB,
    -- {
    --   "Prospecting": { "value": 1200000, "count": 45 },
    --   "Discovery": { "value": 850000, "count": 28 },
    --   ...
    -- }

    -- By region
    region_breakdown JSONB,

    -- By segment
    segment_breakdown JSONB,

    -- Forecast
    forecast_this_quarter DECIMAL(20, 2),
    forecast_next_quarter DECIMAL(20, 2),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (organization_id, snapshot_date, snapshot_type)
);

CREATE INDEX idx_pipeline_snapshots ON pipeline_snapshots(organization_id, snapshot_date DESC);
```

---

## 5. AI Domain Tables

### 5.1 AI Conversations

```sql
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Conversation metadata
    title VARCHAR(500),
    summary TEXT, -- AI-generated summary

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived'

    -- Metrics
    message_count INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, created_at DESC);
```

### 5.2 AI Messages

```sql
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,

    -- Message content
    role message_role NOT NULL,
    content TEXT NOT NULL,

    -- For assistant messages
    model_version VARCHAR(50),
    tokens_used INTEGER,
    latency_ms INTEGER, -- Response time

    -- Citations
    citations JSONB, -- Array of citation objects
    -- [
    --   {
    --     "id": 1,
    --     "sourceType": "database",
    --     "sourceName": "financial_metrics",
    --     "timestamp": "2024-02-15T10:30:00Z"
    --   }
    -- ]

    -- Context used (for RAG)
    context_used JSONB,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions by month
CREATE TABLE ai_messages_2024_01 PARTITION OF ai_messages
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE INDEX idx_ai_messages_conv ON ai_messages(conversation_id, created_at);
```

### 5.3 AI Models

```sql
CREATE TYPE model_status AS ENUM ('active', 'inactive', 'training', 'deprecated');

CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id), -- NULL for system-wide models

    -- Model info
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'forecasting', 'anomaly_detection', 'classification'
    description TEXT,

    -- Status
    status model_status DEFAULT 'active',

    -- Performance metrics
    accuracy DECIMAL(5, 4), -- 0.0000 to 1.0000
    precision_score DECIMAL(5, 4),
    recall_score DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    mape DECIMAL(5, 4), -- For forecasting models

    -- Bias and fairness
    bias_score DECIMAL(5, 4),
    bias_by_segment JSONB,

    -- Drift
    drift_detected BOOLEAN DEFAULT FALSE,
    drift_detected_at TIMESTAMPTZ,
    drift_magnitude DECIMAL(5, 4),

    -- Training info
    last_trained_at TIMESTAMPTZ,
    training_duration_minutes INTEGER,
    training_dataset_size INTEGER,
    training_data_range JSONB, -- { "start": "2023-01-01", "end": "2024-01-01" }

    -- Deployment
    deployed_at TIMESTAMPTZ,
    endpoint_url VARCHAR(500),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (name, version)
);

CREATE TABLE ai_model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,

    -- Period
    recorded_at TIMESTAMPTZ DEFAULT NOW(),

    -- Performance metrics
    accuracy DECIMAL(5, 4),
    latency_p50_ms INTEGER,
    latency_p95_ms INTEGER,
    latency_p99_ms INTEGER,

    -- Usage
    requests_count INTEGER,
    error_count INTEGER,

    -- Resource utilization
    gpu_utilization DECIMAL(5, 2),
    memory_usage_mb INTEGER,

    -- Cost
    token_usage INTEGER,
    cost_usd DECIMAL(10, 4)
);

CREATE INDEX idx_ai_model_metrics_time ON ai_model_metrics(model_id, recorded_at DESC);
```

### 5.4 AI Actions (Autonomous Action Log)

```sql
CREATE TYPE action_type AS ENUM (
    'FORECAST_UPDATE', 'ANOMALY_DETECTION', 'BUDGET_SUGGESTION',
    'RCA_GENERATION', 'ACTION_PLAN_GENERATION', 'DATA_QUALITY_ALERT',
    'INSIGHT_GENERATION', 'SCENARIO_ANALYSIS'
);

CREATE TABLE ai_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Action details
    action_type action_type NOT NULL,
    action_category VARCHAR(100),
    description TEXT NOT NULL,

    -- AI reasoning
    reasoning TEXT,
    confidence_score DECIMAL(5, 2), -- 0-100

    -- Inputs and outputs
    inputs JSONB NOT NULL,
    outputs JSONB,

    -- Model info
    model_id UUID REFERENCES ai_models(id),
    model_version VARCHAR(50),

    -- Outcome
    status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'rejected'
    error_message TEXT,

    -- Human-in-the-loop
    requires_review BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    review_outcome VARCHAR(50), -- 'approved', 'rejected', 'modified'
    review_feedback TEXT,

    -- Override tracking
    was_overridden BOOLEAN DEFAULT FALSE,
    overridden_by UUID REFERENCES users(id),
    override_reason TEXT,

    -- Impact
    affected_entities JSONB, -- { "deals": ["id1", "id2"], "metrics": ["revenue"] }
    estimated_impact_value DECIMAL(20, 2),
    actual_impact_value DECIMAL(20, 2),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_actions_org_type ON ai_actions(organization_id, action_type);
CREATE INDEX idx_ai_actions_review ON ai_actions(organization_id) WHERE requires_review AND reviewed_at IS NULL;
```

---

## 6. Governance Domain Tables

### 6.1 Audit Logs

```sql
CREATE TYPE actor_type AS ENUM ('HUMAN', 'AI_AGENT', 'SYSTEM');

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Timestamp (immutable)
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Actor
    actor_type actor_type NOT NULL,
    actor_id UUID, -- user_id for HUMAN, ai_action_id for AI_AGENT
    actor_name VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255),

    -- Action
    action VARCHAR(200) NOT NULL, -- e.g., 'FORECAST_OVERRIDE', 'DEAL_UPDATE', 'LOGIN'
    action_category VARCHAR(100), -- 'FINANCIAL', 'SALES', 'AUTH', 'CONFIG'

    -- Resource
    resource_type VARCHAR(100), -- 'deal', 'forecast', 'user', etc.
    resource_id UUID,

    -- Change details
    details JSONB NOT NULL,
    -- {
    --   "description": "Manual forecast override",
    --   "before": { "forecast": 5000000 },
    --   "after": { "forecast": 5250000 },
    --   "reason": "Updated based on new contract"
    -- }

    -- Risk assessment
    risk_level risk_level DEFAULT 'low',

    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    request_id UUID, -- For correlation

    -- Review (for high-risk actions)
    requires_review BOOLEAN DEFAULT FALSE,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ

    -- Note: No updated_at - audit logs are immutable
) PARTITION BY RANGE (timestamp);

-- Create partitions by month
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Indexes
CREATE INDEX idx_audit_logs_org_time ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(organization_id, actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_logs_action ON audit_logs(organization_id, action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_review ON audit_logs(organization_id) WHERE requires_review AND NOT reviewed;
```

### 6.2 Compliance Controls

```sql
CREATE TYPE control_status AS ENUM ('pass', 'fail', 'warning', 'not_verified', 'not_applicable');
CREATE TYPE control_frequency AS ENUM ('real_time', 'daily', 'weekly', 'monthly', 'quarterly', 'annual');

CREATE TABLE compliance_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Control identification
    control_id VARCHAR(50) NOT NULL, -- e.g., 'SOX-AC-001'
    framework VARCHAR(50) NOT NULL, -- 'SOX', 'SOC2', 'GDPR'
    category VARCHAR(100) NOT NULL, -- 'Access Controls', 'Change Management'

    -- Control details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    objective TEXT,

    -- Testing
    frequency control_frequency NOT NULL,
    automated BOOLEAN DEFAULT FALSE,
    test_procedure TEXT,

    -- Current status
    status control_status DEFAULT 'not_verified',
    last_verified_at TIMESTAMPTZ,
    next_verification_at TIMESTAMPTZ,

    -- Owner
    owner_id UUID REFERENCES users(id),

    -- Evidence
    evidence_required TEXT[],

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (organization_id, control_id)
);

CREATE TABLE compliance_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_id UUID NOT NULL REFERENCES compliance_controls(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Issue details
    description TEXT NOT NULL,
    severity severity_level NOT NULL,

    -- Timeline
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    due_date DATE,

    -- Assignment
    assigned_to UUID REFERENCES users(id),

    -- Resolution
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'accepted_risk'
    remediation_plan TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_issues_status ON compliance_issues(organization_id, status) WHERE status != 'resolved';
```

### 6.3 Data Lineage

```sql
CREATE TYPE lineage_node_type AS ENUM ('source', 'process', 'storage', 'output');
CREATE TYPE lineage_node_status AS ENUM ('active', 'inactive', 'error', 'processing');

CREATE TABLE data_lineage_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Node identification
    node_key VARCHAR(100) NOT NULL, -- Unique within org, e.g., 'sap_gl'
    label VARCHAR(255) NOT NULL,
    type lineage_node_type NOT NULL,
    subtype VARCHAR(100), -- e.g., 'ERP', 'CRM', 'ETL', 'dbt'

    -- Status
    status lineage_node_status DEFAULT 'active',
    last_sync TIMESTAMPTZ,

    -- Metadata
    description TEXT,
    system_name VARCHAR(100),
    owner VARCHAR(255),
    refresh_frequency VARCHAR(100),
    data_classification VARCHAR(50), -- 'public', 'internal', 'confidential', 'restricted'

    -- Position (for visualization)
    position_x INTEGER,
    position_y INTEGER,

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (organization_id, node_key)
);

CREATE TABLE data_lineage_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Relationship
    source_node_id UUID NOT NULL REFERENCES data_lineage_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES data_lineage_nodes(id) ON DELETE CASCADE,

    -- Edge details
    transformation_type VARCHAR(100), -- 'extract', 'transform', 'load', 'aggregate'
    description TEXT,

    -- Metrics
    data_volume VARCHAR(50), -- e.g., '1M records/day'
    latency VARCHAR(50), -- e.g., '< 1 hour'

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (source_node_id, target_node_id)
);

CREATE INDEX idx_lineage_edges_source ON data_lineage_edges(source_node_id);
CREATE INDEX idx_lineage_edges_target ON data_lineage_edges(target_node_id);
```

---

## 7. Integration Domain Tables

### 7.1 Integrations

```sql
CREATE TYPE integration_type AS ENUM ('ERP', 'CRM', 'HRIS', 'DW', 'BI', 'OTHER');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error', 'pending_setup');

CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),

    -- Integration identity
    name VARCHAR(255) NOT NULL,
    type integration_type NOT NULL,
    provider VARCHAR(100) NOT NULL, -- 'sap', 'salesforce', 'workday'

    -- Connection (encrypted)
    connection_config JSONB NOT NULL, -- Encrypted connection details

    -- Sync configuration
    sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency VARCHAR(50), -- 'realtime', 'hourly', 'daily'
    sync_schedule VARCHAR(100), -- Cron expression

    -- Status
    status integration_status DEFAULT 'pending_setup',
    last_successful_sync TIMESTAMPTZ,
    last_sync_attempt TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,

    -- Metrics
    records_synced_total BIGINT DEFAULT 0,

    -- Owner
    owner_id UUID REFERENCES users(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (organization_id, provider)
);

CREATE TABLE integration_syncs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,

    -- Sync execution
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Status
    status VARCHAR(50) DEFAULT 'running', -- 'running', 'success', 'partial', 'failed'

    -- Metrics
    records_read INTEGER DEFAULT 0,
    records_written INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Duration
    duration_ms INTEGER,

    -- Error handling
    errors JSONB, -- Array of error objects

    -- Trigger
    trigger_type VARCHAR(50), -- 'scheduled', 'manual', 'webhook'
    triggered_by UUID REFERENCES users(id)
);

CREATE INDEX idx_integration_syncs_time ON integration_syncs(integration_id, started_at DESC);
```

---

## 8. Indexes and Performance

### 8.1 Index Strategy

```sql
-- Composite indexes for common query patterns

-- Dashboard queries
CREATE INDEX idx_financial_metrics_dashboard
    ON financial_metrics(organization_id, metric_type, metric_date DESC)
    WHERE metric_date >= NOW() - INTERVAL '12 months';

-- Sales pipeline queries
CREATE INDEX idx_deals_pipeline
    ON deals(organization_id, stage, owner_id)
    WHERE stage NOT IN ('Closed Won', 'Closed Lost');

-- Anomaly detection
CREATE INDEX idx_anomalies_active
    ON anomalies(organization_id, severity DESC, detected_at DESC)
    WHERE status IN ('open', 'investigating');

-- Audit log search
CREATE INDEX idx_audit_logs_search
    ON audit_logs USING gin(details jsonb_path_ops);
```

### 8.2 Materialized Views

```sql
-- KPI Summary View (refreshed every 5 minutes)
CREATE MATERIALIZED VIEW mv_kpi_summary AS
SELECT
    organization_id,
    DATE_TRUNC('month', metric_date) as period,
    metric_type,
    SUM(actual_value) as actual_total,
    SUM(forecast_value) as forecast_total,
    SUM(budget_value) as budget_total,
    AVG(actual_value) as actual_avg,
    COUNT(*) as data_points
FROM financial_metrics
WHERE metric_date >= NOW() - INTERVAL '24 months'
GROUP BY organization_id, DATE_TRUNC('month', metric_date), metric_type;

CREATE UNIQUE INDEX idx_mv_kpi_summary
    ON mv_kpi_summary(organization_id, period, metric_type);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_kpi_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_kpi_summary;
END;
$$ LANGUAGE plpgsql;

-- Pipeline Summary View
CREATE MATERIALIZED VIEW mv_pipeline_summary AS
SELECT
    organization_id,
    stage,
    region,
    segment,
    COUNT(*) as deal_count,
    SUM(value) as total_value,
    SUM(weighted_value) as weighted_value,
    AVG(days_in_pipeline) as avg_days_in_pipeline,
    AVG(probability) as avg_probability
FROM deals
WHERE stage NOT IN ('Closed Won', 'Closed Lost')
GROUP BY organization_id, stage, region, segment;

CREATE UNIQUE INDEX idx_mv_pipeline_summary
    ON mv_pipeline_summary(organization_id, stage, region, segment);
```

---

## 9. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema", "postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [pgvector(map: "vector"), uuid_ossp(map: "uuid-ossp")]
}

// ============== CORE DOMAIN ==============

model Organization {
  id                String   @id @default(uuid()) @db.Uuid
  name              String   @db.VarChar(255)
  slug              String   @unique @db.VarChar(100)
  logoUrl           String?  @map("logo_url") @db.VarChar(500)
  settings          Json     @default("{}")
  subscriptionTier  String   @default("standard") @map("subscription_tier") @db.VarChar(50)
  subscriptionStatus String  @default("active") @map("subscription_status") @db.VarChar(50)

  createdAt         DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt         DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  users             User[]
  financialMetrics  FinancialMetric[]
  deals             Deal[]
  anomalies         Anomaly[]
  scenarios         Scenario[]
  auditLogs         AuditLog[]
  aiConversations   AIConversation[]
  vendors           Vendor[]
  departments       Department[]
  integrations      Integration[]

  @@map("organizations")
}

model User {
  id                String    @id @default(uuid()) @db.Uuid
  organizationId    String    @map("organization_id") @db.Uuid
  email             String    @db.VarChar(255)
  name              String    @db.VarChar(255)
  avatarUrl         String?   @map("avatar_url") @db.VarChar(500)
  passwordHash      String?   @map("password_hash") @db.VarChar(255)
  mfaSecret         String?   @map("mfa_secret") @db.VarChar(255)
  mfaEnabled        Boolean   @default(false) @map("mfa_enabled")
  role              UserRole  @default(VIEWER)
  permissions       Json      @default("[]")
  region            String?   @db.VarChar(50)
  department        String?   @db.VarChar(100)
  preferences       Json      @default("{}")
  status            String    @default("active") @db.VarChar(50)
  lastLoginAt       DateTime? @map("last_login_at") @db.Timestamptz
  failedLoginAttempts Int     @default(0) @map("failed_login_attempts")
  lockedUntil       DateTime? @map("locked_until") @db.Timestamptz
  externalId        String?   @map("external_id") @db.VarChar(255)
  identityProvider  String?   @map("identity_provider") @db.VarChar(100)

  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt         DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  sessions          UserSession[]
  dealsOwned        Deal[] @relation("DealOwner")
  anomaliesAssigned Anomaly[] @relation("AnomalyAssignee")
  aiConversations   AIConversation[]
  scenarios         Scenario[] @relation("ScenarioCreator")

  @@unique([organizationId, email])
  @@index([organizationId, email])
  @@map("users")
}

enum UserRole {
  CFO
  FINANCE_MANAGER
  ANALYST
  VIEWER
  ADMIN
}

model UserSession {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  refreshTokenHash  String    @map("refresh_token_hash") @db.VarChar(255)
  deviceInfo        Json?     @map("device_info")
  ipAddress         String?   @map("ip_address") @db.VarChar(45)
  userAgent         String?   @map("user_agent")
  expiresAt         DateTime  @map("expires_at") @db.Timestamptz
  lastActivityAt    DateTime  @default(now()) @map("last_activity_at") @db.Timestamptz
  createdAt         DateTime  @default(now()) @map("created_at") @db.Timestamptz
  revokedAt         DateTime? @map("revoked_at") @db.Timestamptz

  // Relations
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_sessions")
}

// ============== FINANCIAL DOMAIN ==============

model FinancialMetric {
  id                String     @id @default(uuid()) @db.Uuid
  organizationId    String     @map("organization_id") @db.Uuid
  metricDate        DateTime   @map("metric_date") @db.Date
  metricType        MetricType @map("metric_type")
  region            String?    @db.VarChar(50)
  lob               String?    @db.VarChar(50)
  product           String?    @db.VarChar(100)
  actualValue       Decimal?   @map("actual_value") @db.Decimal(20, 2)
  forecastValue     Decimal?   @map("forecast_value") @db.Decimal(20, 2)
  budgetValue       Decimal?   @map("budget_value") @db.Decimal(20, 2)
  confidenceLower   Decimal?   @map("confidence_lower") @db.Decimal(20, 2)
  confidenceUpper   Decimal?   @map("confidence_upper") @db.Decimal(20, 2)
  forecastModel     String?    @map("forecast_model") @db.VarChar(100)
  currency          String     @default("USD") @db.VarChar(3)
  sourceSystem      String?    @map("source_system") @db.VarChar(100)

  createdAt         DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id])

  @@unique([organizationId, metricDate, metricType, region, lob, product])
  @@index([organizationId, metricDate, metricType])
  @@map("financial_metrics")
}

enum MetricType {
  REVENUE
  ARR
  MRR
  EBITDA
  GROSS_MARGIN
  OPERATING_EXPENSE
  CASH_FLOW
  NET_INCOME
  CAC
  LTV
  NRR
  CHURN_RATE
}

model Anomaly {
  id                String        @id @default(uuid()) @db.Uuid
  organizationId    String        @map("organization_id") @db.Uuid
  metricType        MetricType    @map("metric_type")
  detectedAt        DateTime      @default(now()) @map("detected_at") @db.Timestamptz
  detectionModel    String?       @map("detection_model") @db.VarChar(100)
  severity          SeverityLevel
  description       String
  primaryDriver     String?       @map("primary_driver") @db.VarChar(200)
  impactValue       Decimal?      @map("impact_value") @db.Decimal(20, 2)
  impactPercentage  Decimal?      @map("impact_percentage") @db.Decimal(5, 2)
  affectedPeriodStart DateTime?   @map("affected_period_start") @db.Date
  affectedPeriodEnd DateTime?     @map("affected_period_end") @db.Date
  affectedRegion    String?       @map("affected_region") @db.VarChar(50)
  affectedDepartment String?      @map("affected_department") @db.VarChar(100)
  aiAnalysis        String?       @map("ai_analysis")
  aiAnalysisAt      DateTime?     @map("ai_analysis_at") @db.Timestamptz
  aiConfidence      Decimal?      @map("ai_confidence") @db.Decimal(5, 2)
  actionPlan        String?       @map("action_plan")
  actionPlanAt      DateTime?     @map("action_plan_at") @db.Timestamptz
  status            AnomalyStatus @default(open)
  assignedToId      String?       @map("assigned_to") @db.Uuid
  assignedAt        DateTime?     @map("assigned_at") @db.Timestamptz
  resolvedAt        DateTime?     @map("resolved_at") @db.Timestamptz
  resolvedById      String?       @map("resolved_by") @db.Uuid
  resolutionNotes   String?       @map("resolution_notes")
  relatedAnomalyIds String[]      @map("related_anomaly_ids") @db.Uuid

  createdAt         DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime      @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id])
  assignedTo        User? @relation("AnomalyAssignee", fields: [assignedToId], references: [id])

  @@index([organizationId, status])
  @@index([organizationId, severity])
  @@map("anomalies")
}

enum SeverityLevel {
  low
  medium
  high
  critical
}

enum AnomalyStatus {
  open
  investigating
  resolved
  dismissed
}

// ============== SALES DOMAIN ==============

model Deal {
  id                String      @id @default(uuid()) @db.Uuid
  organizationId    String      @map("organization_id") @db.Uuid
  externalDealId    String?     @map("external_deal_id") @db.VarChar(100)
  externalSystem    String?     @map("external_system") @db.VarChar(100)
  name              String?     @db.VarChar(500)
  accountName       String?     @map("account_name") @db.VarChar(255)
  accountId         String?     @map("account_id") @db.Uuid
  region            DealRegion
  segment           DealSegment
  lob               DealLob
  vertical          String?     @db.VarChar(50)
  revenueType       String?     @map("revenue_type") @db.VarChar(50)
  stage             DealStage
  stageEnteredAt    DateTime    @default(now()) @map("stage_entered_at") @db.Timestamptz
  value             Decimal     @db.Decimal(20, 2)
  currency          String      @default("USD") @db.VarChar(3)
  probability       Decimal     @db.Decimal(5, 2)
  daysInPipeline    Int         @default(0) @map("days_in_pipeline")
  expectedCloseDate DateTime?   @map("expected_close_date") @db.Date
  actualCloseDate   DateTime?   @map("actual_close_date") @db.Date
  ownerId           String?     @map("owner_id") @db.Uuid
  channel           String?     @db.VarChar(100)
  campaignSource    String?     @map("campaign_source") @db.VarChar(200)
  closeReason       String?     @map("close_reason") @db.VarChar(255)
  competitorLostTo  String?     @map("competitor_lost_to") @db.VarChar(255)

  createdAt         DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt         DateTime    @updatedAt @map("updated_at") @db.Timestamptz
  syncedAt          DateTime?   @map("synced_at") @db.Timestamptz

  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id])
  owner             User? @relation("DealOwner", fields: [ownerId], references: [id])
  history           DealHistory[]

  @@unique([organizationId, externalDealId, externalSystem])
  @@index([organizationId, stage])
  @@index([organizationId, ownerId])
  @@index([organizationId, region])
  @@map("deals")
}

enum DealRegion {
  North_America @map("North America")
  Europe
  Middle_East @map("Middle East")
  Asia_Pacific @map("Asia Pacific")
  Latin_America @map("Latin America")
}

enum DealSegment {
  Enterprise
  Mid_Market @map("Mid-Market")
  SMB
}

enum DealLob {
  Software
  Services
}

enum DealStage {
  Prospecting
  Discovery
  Proposal
  Negotiation
  Legal_Review @map("Legal Review")
  Closed_Won @map("Closed Won")
  Closed_Lost @map("Closed Lost")
}

model DealHistory {
  id            String   @id @default(uuid()) @db.Uuid
  dealId        String   @map("deal_id") @db.Uuid
  fieldChanged  String   @map("field_changed") @db.VarChar(100)
  oldValue      String?  @map("old_value")
  newValue      String?  @map("new_value")
  changedById   String?  @map("changed_by") @db.Uuid
  changeSource  String?  @map("change_source") @db.VarChar(50)
  changedAt     DateTime @default(now()) @map("changed_at") @db.Timestamptz

  // Relations
  deal          Deal @relation(fields: [dealId], references: [id], onDelete: Cascade)

  @@index([dealId, changedAt])
  @@map("deal_history")
}

// ============== AI DOMAIN ==============

model AIConversation {
  id              String    @id @default(uuid()) @db.Uuid
  organizationId  String    @map("organization_id") @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  title           String?   @db.VarChar(500)
  summary         String?
  status          String    @default("active") @db.VarChar(50)
  messageCount    Int       @default(0) @map("message_count")
  totalTokensUsed Int       @default(0) @map("total_tokens_used")

  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  archivedAt      DateTime? @map("archived_at") @db.Timestamptz

  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  user            User @relation(fields: [userId], references: [id])
  messages        AIMessage[]

  @@index([userId, createdAt])
  @@map("ai_conversations")
}

model AIMessage {
  id              String      @id @default(uuid()) @db.Uuid
  conversationId  String      @map("conversation_id") @db.Uuid
  role            MessageRole
  content         String
  modelVersion    String?     @map("model_version") @db.VarChar(50)
  tokensUsed      Int?        @map("tokens_used")
  latencyMs       Int?        @map("latency_ms")
  citations       Json?
  contextUsed     Json?       @map("context_used")

  createdAt       DateTime    @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  conversation    AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
  @@map("ai_messages")
}

enum MessageRole {
  user
  assistant
  system
}

// ============== SCENARIO DOMAIN ==============

model Scenario {
  id              String    @id @default(uuid()) @db.Uuid
  organizationId  String    @map("organization_id") @db.Uuid
  createdById     String    @map("created_by") @db.Uuid
  name            String    @db.VarChar(255)
  description     String?
  tags            String[]
  parameters      Json      // { investment: 0, headcount: 0, price: 0 }
  results         Json?     // Monte Carlo results
  aiAnalysis      Json?     @map("ai_analysis") // { mitigation: [], growth: [] }
  status          String    @default("draft") @db.VarChar(50) // 'draft', 'running', 'completed'
  isTemplate      Boolean   @default(false) @map("is_template")
  sharedWith      String[]  @map("shared_with") @db.Uuid

  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  createdBy       User @relation("ScenarioCreator", fields: [createdById], references: [id])

  @@index([organizationId, createdById])
  @@map("scenarios")
}

// ============== GOVERNANCE DOMAIN ==============

model AuditLog {
  id              String     @id @default(uuid()) @db.Uuid
  organizationId  String     @map("organization_id") @db.Uuid
  timestamp       DateTime   @default(now()) @db.Timestamptz
  actorType       ActorType  @map("actor_type")
  actorId         String?    @map("actor_id") @db.Uuid
  actorName       String     @map("actor_name") @db.VarChar(255)
  actorEmail      String?    @map("actor_email") @db.VarChar(255)
  action          String     @db.VarChar(200)
  actionCategory  String?    @map("action_category") @db.VarChar(100)
  resourceType    String?    @map("resource_type") @db.VarChar(100)
  resourceId      String?    @map("resource_id") @db.Uuid
  details         Json
  riskLevel       RiskLevel  @default(low) @map("risk_level")
  ipAddress       String?    @map("ip_address") @db.VarChar(45)
  userAgent       String?    @map("user_agent")
  sessionId       String?    @map("session_id") @db.Uuid
  requestId       String?    @map("request_id") @db.Uuid
  requiresReview  Boolean    @default(false) @map("requires_review")
  reviewed        Boolean    @default(false)
  reviewedById    String?    @map("reviewed_by") @db.Uuid
  reviewedAt      DateTime?  @map("reviewed_at") @db.Timestamptz

  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId, timestamp])
  @@index([organizationId, actorId])
  @@index([organizationId, action])
  @@map("audit_logs")
}

enum ActorType {
  HUMAN
  AI_AGENT
  SYSTEM
}

enum RiskLevel {
  low
  medium
  high
  critical
}

// ============== INTEGRATION DOMAIN ==============

model Vendor {
  id                  String     @id @default(uuid()) @db.Uuid
  organizationId      String     @map("organization_id") @db.Uuid
  name                String     @db.VarChar(255)
  category            String     @db.VarChar(100)
  description         String?
  contractValue       Decimal?   @map("contract_value") @db.Decimal(20, 2)
  contractStartDate   DateTime?  @map("contract_start_date") @db.Date
  contractEndDate     DateTime?  @map("contract_end_date") @db.Date
  paymentTerms        String?    @map("payment_terms") @db.VarChar(100)
  autoRenewal         Boolean    @default(false) @map("auto_renewal")
  riskLevel           RiskLevel  @default(low) @map("risk_level")
  riskNotes           String?    @map("risk_notes")
  primaryContactName  String?    @map("primary_contact_name") @db.VarChar(255)
  primaryContactEmail String?    @map("primary_contact_email") @db.VarChar(255)
  status              String     @default("active") @db.VarChar(50)

  createdAt           DateTime   @default(now()) @map("created_at") @db.Timestamptz
  updatedAt           DateTime   @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  organization        Organization @relation(fields: [organizationId], references: [id])
  spends              VendorSpend[]

  @@unique([organizationId, name])
  @@map("vendors")
}

model VendorSpend {
  id              String   @id @default(uuid()) @db.Uuid
  vendorId        String   @map("vendor_id") @db.Uuid
  organizationId  String   @map("organization_id") @db.Uuid
  periodDate      DateTime @map("period_date") @db.Date
  amount          Decimal  @db.Decimal(20, 2)
  budgetAmount    Decimal? @map("budget_amount") @db.Decimal(20, 2)
  yoyChange       Decimal? @map("yoy_change") @db.Decimal(5, 2)
  breakdown       Json?

  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  vendor          Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  @@unique([vendorId, periodDate])
  @@index([organizationId, periodDate])
  @@map("vendor_spend")
}

model Department {
  id              String    @id @default(uuid()) @db.Uuid
  organizationId  String    @map("organization_id") @db.Uuid
  name            String    @db.VarChar(255)
  code            String?   @db.VarChar(50)
  parentId        String?   @map("parent_id") @db.Uuid
  headUserId      String?   @map("head_user_id") @db.Uuid
  annualBudget    Decimal?  @map("annual_budget") @db.Decimal(20, 2)

  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  organization    Organization @relation(fields: [organizationId], references: [id])
  parent          Department? @relation("DepartmentHierarchy", fields: [parentId], references: [id])
  children        Department[] @relation("DepartmentHierarchy")
  costs           DepartmentCost[]

  @@unique([organizationId, name])
  @@map("departments")
}

model DepartmentCost {
  id              String   @id @default(uuid()) @db.Uuid
  departmentId    String   @map("department_id") @db.Uuid
  organizationId  String   @map("organization_id") @db.Uuid
  periodDate      DateTime @map("period_date") @db.Date
  payroll         Decimal  @default(0) @db.Decimal(20, 2)
  software        Decimal  @default(0) @db.Decimal(20, 2)
  travel          Decimal  @default(0) @db.Decimal(20, 2)
  marketing       Decimal  @default(0) @db.Decimal(20, 2)
  other           Decimal  @default(0) @db.Decimal(20, 2)
  headcount       Int?

  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  department      Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)

  @@unique([departmentId, periodDate])
  @@index([organizationId, periodDate])
  @@map("department_costs")
}

model Integration {
  id                   String            @id @default(uuid()) @db.Uuid
  organizationId       String            @map("organization_id") @db.Uuid
  name                 String            @db.VarChar(255)
  type                 IntegrationType
  provider             String            @db.VarChar(100)
  connectionConfig     Json              @map("connection_config")
  syncEnabled          Boolean           @default(true) @map("sync_enabled")
  syncFrequency        String?           @map("sync_frequency") @db.VarChar(50)
  syncSchedule         String?           @map("sync_schedule") @db.VarChar(100)
  status               IntegrationStatus @default(pending_setup)
  lastSuccessfulSync   DateTime?         @map("last_successful_sync") @db.Timestamptz
  lastSyncAttempt      DateTime?         @map("last_sync_attempt") @db.Timestamptz
  consecutiveFailures  Int               @default(0) @map("consecutive_failures")
  recordsSyncedTotal   BigInt            @default(0) @map("records_synced_total")
  ownerId              String?           @map("owner_id") @db.Uuid

  createdAt            DateTime          @default(now()) @map("created_at") @db.Timestamptz
  updatedAt            DateTime          @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  organization         Organization @relation(fields: [organizationId], references: [id])
  syncs                IntegrationSync[]

  @@unique([organizationId, provider])
  @@map("integrations")
}

enum IntegrationType {
  ERP
  CRM
  HRIS
  DW
  BI
  OTHER
}

enum IntegrationStatus {
  active
  inactive
  error
  pending_setup
}

model IntegrationSync {
  id              String    @id @default(uuid()) @db.Uuid
  integrationId   String    @map("integration_id") @db.Uuid
  startedAt       DateTime  @default(now()) @map("started_at") @db.Timestamptz
  completedAt     DateTime? @map("completed_at") @db.Timestamptz
  status          String    @default("running") @db.VarChar(50)
  recordsRead     Int       @default(0) @map("records_read")
  recordsWritten  Int       @default(0) @map("records_written")
  recordsFailed   Int       @default(0) @map("records_failed")
  durationMs      Int?      @map("duration_ms")
  errors          Json?
  triggerType     String?   @map("trigger_type") @db.VarChar(50)
  triggeredById   String?   @map("triggered_by") @db.Uuid

  // Relations
  integration     Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@index([integrationId, startedAt])
  @@map("integration_syncs")
}
```

---

## 10. Migration Strategy

### 10.1 Migration Commands

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_ai_conversations

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

### 10.2 Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create demo organization
  const org = await prisma.organization.create({
    data: {
      name: 'Aether Demo Corp',
      slug: 'aether-demo',
      settings: {
        fiscalYearStart: 'January',
        currency: 'USD',
        timezone: 'America/New_York',
      },
      subscriptionTier: 'enterprise',
    },
  });

  // Create demo users
  const cfo = await prisma.user.create({
    data: {
      organizationId: org.id,
      email: 'sarah.chen@aether-demo.com',
      name: 'Sarah Chen',
      role: UserRole.CFO,
    },
  });

  // Create sample financial metrics
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];

  for (const month of months) {
    await prisma.financialMetric.create({
      data: {
        organizationId: org.id,
        metricDate: new Date(`${month}-01`),
        metricType: 'REVENUE',
        actualValue: 4000000 + Math.random() * 1000000,
        forecastValue: 4500000,
        budgetValue: 4200000,
      },
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

*This schema is designed for enterprise-grade FP&A operations with multi-tenancy, comprehensive auditing, and integration support.*
