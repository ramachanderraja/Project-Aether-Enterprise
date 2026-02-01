# Project Aether - API Specification Document

## Enterprise Autonomous FP&A Platform

**Version:** 1.0
**Date:** January 31, 2026
**Status:** Draft
**Author:** API Design Team

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Common Patterns](#3-common-patterns)
4. [Dashboard API](#4-dashboard-api)
5. [Financial Metrics API](#5-financial-metrics-api)
6. [AI Agent API](#6-ai-agent-api)
7. [Sales & Pipeline API](#7-sales--pipeline-api)
8. [Cost Intelligence API](#8-cost-intelligence-api)
9. [Revenue Intelligence API](#9-revenue-intelligence-api)
10. [Scenario Planning API](#10-scenario-planning-api)
11. [Governance API](#11-governance-api)
12. [Data Fabric API](#12-data-fabric-api)
13. [Integration API](#13-integration-api)
14. [WebSocket Events](#14-websocket-events)
15. [Error Handling](#15-error-handling)
16. [Rate Limiting](#16-rate-limiting)

---

## 1. API Overview

### 1.1 Base URL

```
Production:  https://api.aether.gepfp.com/v1
Staging:     https://api.staging.aether.gepfp.com/v1
Development: http://localhost:3000/api/v1
```

### 1.2 API Design Principles

| Principle | Description |
|-----------|-------------|
| **RESTful** | Resources represented as nouns, actions as HTTP verbs |
| **JSON** | All request/response bodies use JSON format |
| **Versioned** | API version in URL path (`/v1/`) |
| **HATEOAS** | Links to related resources in responses |
| **Idempotent** | Safe retry for GET, PUT, DELETE operations |
| **Consistent** | Uniform response structure across all endpoints |

### 1.3 HTTP Methods

| Method | Usage | Idempotent |
|--------|-------|------------|
| GET | Retrieve resource(s) | Yes |
| POST | Create new resource | No |
| PUT | Full resource update | Yes |
| PATCH | Partial resource update | Yes |
| DELETE | Remove resource | Yes |

### 1.4 Content Negotiation

**Request Headers:**
```http
Content-Type: application/json
Accept: application/json
Accept-Language: en-US
X-Request-ID: <uuid>
X-Tenant-ID: <tenant-uuid>
```

**Response Headers:**
```http
Content-Type: application/json; charset=utf-8
X-Request-ID: <uuid>
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1706745600
```

---

## 2. Authentication & Authorization

### 2.1 Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Client    │     │   Aether     │     │   Okta/      │     │   Aether     │
│    (SPA)     │     │   Frontend   │     │   Azure AD   │     │   Backend    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │  1. Access App     │                    │                    │
       │───────────────────►│                    │                    │
       │                    │                    │                    │
       │  2. Redirect SSO   │                    │                    │
       │◄───────────────────│                    │                    │
       │                    │                    │                    │
       │  3. Login          │                    │                    │
       │────────────────────────────────────────►│                    │
       │                    │                    │                    │
       │  4. Auth Code      │                    │                    │
       │◄────────────────────────────────────────│                    │
       │                    │                    │                    │
       │  5. Exchange Code  │                    │                    │
       │───────────────────────────────────────────────────────────►│
       │                    │                    │                    │
       │  6. JWT Tokens     │                    │                    │
       │◄───────────────────────────────────────────────────────────│
       │                    │                    │                    │
```

### 2.2 Authentication Endpoints

#### POST /auth/login

Initiate OAuth2/OIDC login flow.

**Request:**
```json
{
  "provider": "okta" | "azure-ad" | "google",
  "redirect_uri": "https://app.aether.gepfp.com/callback"
}
```

**Response:**
```json
{
  "authorization_url": "https://okta.com/oauth2/authorize?...",
  "state": "random-state-string",
  "nonce": "random-nonce-string"
}
```

#### POST /auth/callback

Exchange authorization code for tokens.

**Request:**
```json
{
  "code": "authorization_code",
  "state": "state_from_login",
  "redirect_uri": "https://app.aether.gepfp.com/callback"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "user": {
    "id": "usr_abc123",
    "email": "analyst@company.com",
    "name": "Jane Analyst",
    "roles": ["finance_analyst", "dashboard_viewer"],
    "tenant_id": "ten_xyz789"
  }
}
```

#### POST /auth/refresh

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### POST /auth/logout

Invalidate user session and tokens.

**Request:**
```json
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/me

Get current authenticated user details.

**Response:**
```json
{
  "id": "usr_abc123",
  "email": "analyst@company.com",
  "name": "Jane Analyst",
  "avatar_url": "https://storage.aether.com/avatars/usr_abc123.jpg",
  "roles": ["finance_analyst", "dashboard_viewer"],
  "permissions": [
    "dashboard:read",
    "dashboard:create",
    "scenarios:read",
    "scenarios:create",
    "ai:chat"
  ],
  "tenant": {
    "id": "ten_xyz789",
    "name": "Acme Corporation",
    "plan": "enterprise"
  },
  "preferences": {
    "theme": "light",
    "locale": "en-US",
    "timezone": "America/New_York",
    "default_currency": "USD"
  },
  "last_login": "2026-01-31T10:30:00Z"
}
```

### 2.3 JWT Token Structure

**Access Token Payload:**
```json
{
  "sub": "usr_abc123",
  "email": "analyst@company.com",
  "tenant_id": "ten_xyz789",
  "roles": ["finance_analyst"],
  "permissions": ["dashboard:read", "dashboard:create"],
  "iat": 1706745600,
  "exp": 1706749200,
  "iss": "https://api.aether.gepfp.com",
  "aud": "aether-frontend"
}
```

### 2.4 Authorization Header

All authenticated requests must include:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

### 2.5 Role-Based Access Control (RBAC)

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | Full system access | All permissions |
| `finance_director` | Department-level access | Scenarios, approvals, all dashboards |
| `finance_analyst` | Standard analyst access | Dashboards, AI chat, read scenarios |
| `viewer` | Read-only access | View dashboards only |
| `auditor` | Compliance access | Audit logs, governance reports |

---

## 3. Common Patterns

### 3.1 Standard Response Envelope

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-01-31T12:00:00Z",
    "version": "1.0"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "start_date",
        "message": "Start date must be before end date"
      }
    ]
  },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-01-31T12:00:00Z"
  }
}
```

### 3.2 Pagination

**Request Parameters:**
```
GET /api/v1/deals?page=1&limit=20&sort=close_date&order=desc
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `limit` | integer | 20 | Items per page (max 100) |
| `sort` | string | varies | Field to sort by |
| `order` | string | desc | Sort order: `asc` or `desc` |

**Response with Pagination:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 156,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  },
  "links": {
    "self": "/api/v1/deals?page=1&limit=20",
    "next": "/api/v1/deals?page=2&limit=20",
    "last": "/api/v1/deals?page=8&limit=20"
  }
}
```

### 3.3 Filtering

**Query Parameters:**
```
GET /api/v1/deals?region=north-america&stage=negotiation&amount_gte=100000
```

| Suffix | Operator | Example |
|--------|----------|---------|
| (none) | equals | `stage=negotiation` |
| `_ne` | not equals | `stage_ne=lost` |
| `_gt` | greater than | `amount_gt=100000` |
| `_gte` | greater than or equal | `amount_gte=100000` |
| `_lt` | less than | `amount_lt=500000` |
| `_lte` | less than or equal | `amount_lte=500000` |
| `_in` | in list | `stage_in=qualified,negotiation` |
| `_contains` | contains (string) | `name_contains=enterprise` |
| `_between` | date range | `close_date_between=2026-01-01,2026-03-31` |

### 3.4 Field Selection

**Request:**
```
GET /api/v1/deals?fields=id,name,amount,stage,close_date
```

**Response:**
```json
{
  "data": [
    {
      "id": "deal_123",
      "name": "Enterprise License",
      "amount": 250000,
      "stage": "negotiation",
      "close_date": "2026-03-15"
    }
  ]
}
```

### 3.5 Resource Expansion

**Request:**
```
GET /api/v1/deals/deal_123?expand=account,owner,activities
```

**Response:**
```json
{
  "data": {
    "id": "deal_123",
    "name": "Enterprise License",
    "account": {
      "id": "acc_456",
      "name": "Acme Corp",
      "industry": "Technology"
    },
    "owner": {
      "id": "usr_789",
      "name": "John Sales",
      "email": "john@company.com"
    },
    "activities": [
      { "id": "act_001", "type": "meeting", "date": "2026-01-28" }
    ]
  }
}
```

### 3.6 Date/Time Handling

All dates use ISO 8601 format:
- **Date:** `2026-01-31`
- **DateTime:** `2026-01-31T12:00:00Z`
- **DateTime with timezone:** `2026-01-31T12:00:00-05:00`

---

## 4. Dashboard API

### 4.1 Get Executive Dashboard Summary

`GET /api/v1/dashboard/executive`

Returns high-level KPIs and insights for the executive dashboard.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `as_of_date` | date | No | Point-in-time date (default: today) |
| `comparison_period` | string | No | `mom`, `qoq`, `yoy` (default: `mom`) |
| `region` | string | No | Filter by region |
| `lob` | string | No | Filter by line of business |

**Response:**
```json
{
  "success": true,
  "data": {
    "as_of_date": "2026-01-31",
    "comparison_period": "mom",
    "kpis": {
      "revenue": {
        "current": 12500000,
        "previous": 11800000,
        "change_amount": 700000,
        "change_percent": 5.93,
        "trend": "up",
        "status": "on_track",
        "forecast": 14000000,
        "budget": 13000000,
        "variance_to_budget": -500000
      },
      "gross_margin": {
        "current": 0.425,
        "previous": 0.418,
        "change_percent": 0.7,
        "trend": "up",
        "status": "on_track"
      },
      "operating_expenses": {
        "current": 3200000,
        "previous": 3100000,
        "change_percent": 3.22,
        "trend": "up",
        "status": "at_risk",
        "budget": 3000000,
        "variance_to_budget": 200000
      },
      "ebitda": {
        "current": 2050000,
        "previous": 1830000,
        "change_percent": 12.02,
        "trend": "up",
        "status": "exceeding"
      },
      "cash_position": {
        "current": 8500000,
        "runway_months": 18,
        "burn_rate": 470000,
        "trend": "stable"
      },
      "arr": {
        "current": 48000000,
        "new_arr": 1200000,
        "churned_arr": 350000,
        "net_new_arr": 850000,
        "growth_rate": 0.22
      }
    },
    "anomalies": [
      {
        "id": "anom_001",
        "severity": "high",
        "category": "cost_spike",
        "metric": "Cloud Infrastructure",
        "description": "AWS spending 47% above forecast this month",
        "impact": 125000,
        "detected_at": "2026-01-30T14:23:00Z",
        "status": "unresolved"
      }
    ],
    "ai_insights": [
      {
        "id": "ins_001",
        "type": "recommendation",
        "priority": "high",
        "title": "Revenue Acceleration Opportunity",
        "summary": "Pipeline analysis suggests 3 deals worth $2.1M could close early with targeted engagement",
        "action_url": "/sales/pipeline?filter=accelerate"
      }
    ],
    "cash_flow_forecast": {
      "periods": ["Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"],
      "inflows": [4200000, 4500000, 4300000, 4800000, 5100000],
      "outflows": [3800000, 3900000, 4000000, 4100000, 4200000],
      "net_cash_flow": [400000, 600000, 300000, 700000, 900000],
      "ending_balance": [8900000, 9500000, 9800000, 10500000, 11400000]
    }
  }
}
```

### 4.2 Get KPI Details

`GET /api/v1/dashboard/kpis/{kpi_id}`

Returns detailed breakdown of a specific KPI.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `kpi_id` | string | KPI identifier (e.g., `revenue`, `gross_margin`) |

**Response:**
```json
{
  "success": true,
  "data": {
    "kpi_id": "revenue",
    "name": "Total Revenue",
    "description": "Sum of all recognized revenue for the period",
    "current_value": 12500000,
    "unit": "currency",
    "currency": "USD",
    "breakdown": {
      "by_region": [
        { "region": "North America", "value": 7500000, "percent": 60 },
        { "region": "EMEA", "value": 3125000, "percent": 25 },
        { "region": "APAC", "value": 1875000, "percent": 15 }
      ],
      "by_lob": [
        { "lob": "Enterprise", "value": 8750000, "percent": 70 },
        { "lob": "Mid-Market", "value": 2500000, "percent": 20 },
        { "lob": "SMB", "value": 1250000, "percent": 10 }
      ],
      "by_product": [
        { "product": "Core Platform", "value": 9375000, "percent": 75 },
        { "product": "Analytics Add-on", "value": 1875000, "percent": 15 },
        { "product": "Services", "value": 1250000, "percent": 10 }
      ]
    },
    "trend": {
      "periods": ["Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026"],
      "values": [10800000, 11200000, 11800000, 12500000],
      "growth_rates": [0.037, 0.053, 0.059]
    },
    "drivers": [
      {
        "driver": "New customer acquisition",
        "contribution": 850000,
        "impact": "positive"
      },
      {
        "driver": "Expansion revenue",
        "contribution": 450000,
        "impact": "positive"
      },
      {
        "driver": "Churn",
        "contribution": -200000,
        "impact": "negative"
      }
    ]
  }
}
```

### 4.3 Get Anomalies

`GET /api/v1/dashboard/anomalies`

Returns list of detected financial anomalies.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `severity` | string | No | `critical`, `high`, `medium`, `low` |
| `status` | string | No | `unresolved`, `investigating`, `resolved`, `dismissed` |
| `category` | string | No | `cost_spike`, `revenue_drop`, `variance`, `pattern` |
| `start_date` | date | No | Filter from date |
| `end_date` | date | No | Filter to date |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "anom_001",
      "severity": "high",
      "category": "cost_spike",
      "metric_name": "Cloud Infrastructure",
      "account_code": "6200-100",
      "description": "AWS spending 47% above forecast this month",
      "current_value": 245000,
      "expected_value": 166000,
      "variance_amount": 79000,
      "variance_percent": 47.6,
      "detected_at": "2026-01-30T14:23:00Z",
      "status": "unresolved",
      "assigned_to": null,
      "root_cause_analysis": {
        "ai_generated": true,
        "summary": "Spike attributed to increased data processing volumes following product launch",
        "contributing_factors": [
          "30% increase in API calls",
          "New ML model training jobs",
          "Unoptimized database queries"
        ],
        "confidence": 0.87
      },
      "recommended_actions": [
        "Review recent deployments for inefficiencies",
        "Implement auto-scaling policies",
        "Optimize top 5 expensive queries"
      ],
      "links": {
        "self": "/api/v1/dashboard/anomalies/anom_001",
        "investigate": "/api/v1/dashboard/anomalies/anom_001/investigate"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 8,
    "total_pages": 1
  }
}
```

### 4.4 Acknowledge/Resolve Anomaly

`PATCH /api/v1/dashboard/anomalies/{anomaly_id}`

Update anomaly status or assignment.

**Request:**
```json
{
  "status": "investigating",
  "assigned_to": "usr_abc123",
  "notes": "Reviewing with DevOps team"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "anom_001",
    "status": "investigating",
    "assigned_to": {
      "id": "usr_abc123",
      "name": "Jane Analyst"
    },
    "notes": "Reviewing with DevOps team",
    "updated_at": "2026-01-31T15:30:00Z"
  }
}
```

---

## 5. Financial Metrics API

### 5.1 Get Financial Metrics

`GET /api/v1/metrics`

Returns financial metrics with time series data.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metrics` | string[] | Yes | Comma-separated metric IDs |
| `start_date` | date | Yes | Period start date |
| `end_date` | date | Yes | Period end date |
| `granularity` | string | No | `daily`, `weekly`, `monthly`, `quarterly` |
| `region` | string | No | Filter by region |
| `lob` | string | No | Filter by line of business |
| `compare_to` | string | No | `budget`, `forecast`, `prior_period`, `prior_year` |

**Example Request:**
```
GET /api/v1/metrics?metrics=revenue,cogs,gross_profit,opex,ebitda&start_date=2026-01-01&end_date=2026-01-31&granularity=weekly&compare_to=budget
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start_date": "2026-01-01",
      "end_date": "2026-01-31",
      "granularity": "weekly"
    },
    "metrics": [
      {
        "id": "revenue",
        "name": "Total Revenue",
        "unit": "currency",
        "currency": "USD",
        "time_series": [
          {
            "period": "2026-W01",
            "start_date": "2026-01-01",
            "end_date": "2026-01-05",
            "actual": 2850000,
            "budget": 2700000,
            "variance": 150000,
            "variance_percent": 5.56
          },
          {
            "period": "2026-W02",
            "start_date": "2026-01-06",
            "end_date": "2026-01-12",
            "actual": 3100000,
            "budget": 3000000,
            "variance": 100000,
            "variance_percent": 3.33
          }
        ],
        "summary": {
          "total_actual": 12500000,
          "total_budget": 12000000,
          "total_variance": 500000,
          "variance_percent": 4.17,
          "ytd_actual": 12500000,
          "ytd_budget": 12000000
        }
      }
    ]
  }
}
```

### 5.2 Get Income Statement

`GET /api/v1/metrics/income-statement`

Returns structured income statement data.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | Yes | `month`, `quarter`, `year` |
| `date` | date | No | Period ending date (default: current) |
| `compare_to` | string | No | `budget`, `forecast`, `prior_period`, `prior_year` |
| `region` | string | No | Filter by region |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "January 2026",
    "currency": "USD",
    "line_items": [
      {
        "section": "Revenue",
        "items": [
          {
            "account_code": "4000",
            "name": "Product Revenue",
            "actual": 10500000,
            "budget": 10000000,
            "variance": 500000,
            "variance_percent": 5.0,
            "prior_period": 9800000,
            "prior_year": 8500000
          },
          {
            "account_code": "4100",
            "name": "Services Revenue",
            "actual": 2000000,
            "budget": 2200000,
            "variance": -200000,
            "variance_percent": -9.1,
            "prior_period": 1900000,
            "prior_year": 1800000
          }
        ],
        "subtotal": {
          "name": "Total Revenue",
          "actual": 12500000,
          "budget": 12200000,
          "variance": 300000,
          "variance_percent": 2.46
        }
      },
      {
        "section": "Cost of Goods Sold",
        "items": [
          {
            "account_code": "5000",
            "name": "Direct Costs",
            "actual": 4200000,
            "budget": 4000000,
            "variance": -200000,
            "variance_percent": -5.0
          },
          {
            "account_code": "5100",
            "name": "Hosting & Infrastructure",
            "actual": 1500000,
            "budget": 1400000,
            "variance": -100000,
            "variance_percent": -7.14
          }
        ],
        "subtotal": {
          "name": "Total COGS",
          "actual": 5700000,
          "budget": 5400000,
          "variance": -300000,
          "variance_percent": -5.56
        }
      }
    ],
    "totals": {
      "gross_profit": {
        "actual": 6800000,
        "budget": 6800000,
        "variance": 0,
        "margin": 54.4
      },
      "operating_income": {
        "actual": 2100000,
        "budget": 2000000,
        "variance": 100000,
        "margin": 16.8
      },
      "net_income": {
        "actual": 1680000,
        "budget": 1600000,
        "variance": 80000,
        "margin": 13.44
      }
    }
  }
}
```

### 5.3 Get Balance Sheet

`GET /api/v1/metrics/balance-sheet`

Returns balance sheet data.

**Response:**
```json
{
  "success": true,
  "data": {
    "as_of_date": "2026-01-31",
    "currency": "USD",
    "assets": {
      "current_assets": {
        "items": [
          { "name": "Cash & Cash Equivalents", "value": 8500000 },
          { "name": "Accounts Receivable", "value": 4200000 },
          { "name": "Prepaid Expenses", "value": 650000 }
        ],
        "total": 13350000
      },
      "non_current_assets": {
        "items": [
          { "name": "Property & Equipment", "value": 2100000 },
          { "name": "Intangible Assets", "value": 1500000 },
          { "name": "Goodwill", "value": 3200000 }
        ],
        "total": 6800000
      },
      "total_assets": 20150000
    },
    "liabilities": {
      "current_liabilities": {
        "items": [
          { "name": "Accounts Payable", "value": 1800000 },
          { "name": "Deferred Revenue", "value": 5200000 },
          { "name": "Accrued Expenses", "value": 950000 }
        ],
        "total": 7950000
      },
      "non_current_liabilities": {
        "items": [
          { "name": "Long-term Debt", "value": 2500000 },
          { "name": "Other Liabilities", "value": 400000 }
        ],
        "total": 2900000
      },
      "total_liabilities": 10850000
    },
    "equity": {
      "items": [
        { "name": "Common Stock", "value": 5000000 },
        { "name": "Retained Earnings", "value": 4300000 }
      ],
      "total_equity": 9300000
    }
  }
}
```

### 5.4 Get Cash Flow

`GET /api/v1/metrics/cash-flow`

Returns cash flow statement data.

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "January 2026",
    "currency": "USD",
    "operating_activities": {
      "net_income": 1680000,
      "adjustments": [
        { "name": "Depreciation & Amortization", "value": 250000 },
        { "name": "Stock-based Compensation", "value": 180000 },
        { "name": "Change in Accounts Receivable", "value": -350000 },
        { "name": "Change in Accounts Payable", "value": 120000 },
        { "name": "Change in Deferred Revenue", "value": 450000 }
      ],
      "net_cash_from_operating": 2330000
    },
    "investing_activities": {
      "items": [
        { "name": "Capital Expenditures", "value": -180000 },
        { "name": "Software Development Costs", "value": -220000 }
      ],
      "net_cash_from_investing": -400000
    },
    "financing_activities": {
      "items": [
        { "name": "Debt Repayment", "value": -250000 },
        { "name": "Stock Option Exercises", "value": 85000 }
      ],
      "net_cash_from_financing": -165000
    },
    "summary": {
      "beginning_cash": 6735000,
      "net_change": 1765000,
      "ending_cash": 8500000
    }
  }
}
```

---

## 6. AI Agent API

### 6.1 Start AI Conversation

`POST /api/v1/ai/conversations`

Create a new AI conversation session.

**Request:**
```json
{
  "context": "dashboard",
  "initial_message": "What's driving the OPEX variance this month?",
  "metadata": {
    "current_view": "executive_dashboard",
    "selected_period": "2026-01",
    "filters": {
      "region": "north-america"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_abc123",
    "created_at": "2026-01-31T15:30:00Z",
    "status": "active"
  }
}
```

### 6.2 Send Message (Streaming)

`POST /api/v1/ai/conversations/{conversation_id}/messages`

Send a message and receive streaming response.

**Request:**
```json
{
  "message": "What's driving the OPEX variance this month?",
  "context": {
    "visible_kpis": ["revenue", "opex", "ebitda"],
    "anomalies_shown": ["anom_001"]
  }
}
```

**Response (Server-Sent Events):**
```
event: message_start
data: {"message_id": "msg_xyz789", "timestamp": "2026-01-31T15:30:01Z"}

event: content_delta
data: {"text": "Based on "}

event: content_delta
data: {"text": "the current financial data, "}

event: content_delta
data: {"text": "the OPEX variance of $200K (6.7% over budget) is primarily driven by:"}

event: content_delta
data: {"text": "\n\n**1. Cloud Infrastructure (+$79K)**\n"}

event: citation
data: {"index": 0, "source": "anomaly", "id": "anom_001", "text": "AWS spending 47% above forecast"}

event: content_delta
data: {"text": "\n**2. Contractor Costs (+$65K)**\n"}

event: citation
data: {"index": 1, "source": "ledger", "account": "6500-200", "text": "Professional Services"}

event: content_delta
data: {"text": "\n**3. Software Licenses (+$56K)**\n"}

event: suggested_actions
data: {"actions": [{"type": "drill_down", "label": "View OPEX Breakdown", "url": "/metrics/opex/breakdown"}, {"type": "scenario", "label": "Model Cost Reduction", "url": "/scenarios/new?template=cost_reduction"}]}

event: message_complete
data: {"message_id": "msg_xyz789", "tokens_used": 847, "processing_time_ms": 2340}
```

### 6.3 Get Conversation History

`GET /api/v1/ai/conversations/{conversation_id}/messages`

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation_id": "conv_abc123",
    "messages": [
      {
        "id": "msg_001",
        "role": "user",
        "content": "What's driving the OPEX variance this month?",
        "timestamp": "2026-01-31T15:30:00Z"
      },
      {
        "id": "msg_002",
        "role": "assistant",
        "content": "Based on the current financial data, the OPEX variance of $200K (6.7% over budget) is primarily driven by:\n\n**1. Cloud Infrastructure (+$79K)**...",
        "citations": [
          { "index": 0, "source": "anomaly", "id": "anom_001" },
          { "index": 1, "source": "ledger", "account": "6500-200" }
        ],
        "suggested_actions": [
          { "type": "drill_down", "label": "View OPEX Breakdown", "url": "/metrics/opex/breakdown" }
        ],
        "timestamp": "2026-01-31T15:30:03Z"
      }
    ]
  }
}
```

### 6.4 Get AI Suggestions

`GET /api/v1/ai/suggestions`

Get contextual AI suggestions based on current view.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `context` | string | Yes | Current UI context |
| `limit` | integer | No | Max suggestions (default: 5) |

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "sug_001",
        "type": "question",
        "text": "What's driving the 12% EBITDA improvement?",
        "relevance": 0.95
      },
      {
        "id": "sug_002",
        "type": "action",
        "text": "Run variance analysis on Marketing spend",
        "relevance": 0.88
      },
      {
        "id": "sug_003",
        "type": "insight",
        "text": "3 deals worth $2.1M could close early with targeted engagement",
        "relevance": 0.82
      }
    ]
  }
}
```

---

## 7. Sales & Pipeline API

### 7.1 Get Pipeline Overview

`GET /api/v1/sales/pipeline`

Returns sales pipeline summary and metrics.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | `current_quarter`, `next_quarter`, `fiscal_year` |
| `owner_id` | string | No | Filter by deal owner |
| `region` | string | No | Filter by region |
| `stage` | string[] | No | Filter by stage(s) |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "Q1 2026",
    "summary": {
      "total_pipeline": 45000000,
      "weighted_pipeline": 22500000,
      "deal_count": 156,
      "average_deal_size": 288462,
      "win_rate": 0.32,
      "average_sales_cycle_days": 87
    },
    "by_stage": [
      {
        "stage": "Prospecting",
        "stage_order": 1,
        "value": 8500000,
        "weighted_value": 850000,
        "count": 45,
        "probability": 0.10,
        "avg_days_in_stage": 12
      },
      {
        "stage": "Qualification",
        "stage_order": 2,
        "value": 12000000,
        "weighted_value": 3000000,
        "count": 38,
        "probability": 0.25,
        "avg_days_in_stage": 18
      },
      {
        "stage": "Proposal",
        "stage_order": 3,
        "value": 15000000,
        "weighted_value": 7500000,
        "count": 42,
        "probability": 0.50,
        "avg_days_in_stage": 21
      },
      {
        "stage": "Negotiation",
        "stage_order": 4,
        "value": 9500000,
        "weighted_value": 7125000,
        "count": 31,
        "probability": 0.75,
        "avg_days_in_stage": 14
      }
    ],
    "forecast": {
      "best_case": 18000000,
      "commit": 12500000,
      "most_likely": 14200000,
      "target": 15000000,
      "gap_to_target": 800000
    },
    "trends": {
      "pipeline_change_30d": 2500000,
      "pipeline_change_percent": 5.9,
      "deals_added_30d": 28,
      "deals_closed_won_30d": 12,
      "deals_closed_lost_30d": 8
    }
  }
}
```

### 7.2 Get Deals

`GET /api/v1/sales/deals`

Returns list of deals with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `stage` | string[] | No | Filter by stage(s) |
| `owner_id` | string | No | Filter by deal owner |
| `amount_gte` | number | No | Minimum deal amount |
| `amount_lte` | number | No | Maximum deal amount |
| `close_date_gte` | date | No | Close date from |
| `close_date_lte` | date | No | Close date to |
| `risk_level` | string | No | `low`, `medium`, `high` |
| `page` | integer | No | Page number |
| `limit` | integer | No | Items per page |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "deal_abc123",
      "name": "Acme Corp Enterprise License",
      "account": {
        "id": "acc_456",
        "name": "Acme Corporation",
        "industry": "Technology",
        "size": "Enterprise"
      },
      "owner": {
        "id": "usr_789",
        "name": "Sarah Sales",
        "email": "sarah@company.com"
      },
      "amount": 450000,
      "currency": "USD",
      "stage": "Negotiation",
      "probability": 0.75,
      "weighted_amount": 337500,
      "close_date": "2026-03-15",
      "created_date": "2025-11-20",
      "days_in_pipeline": 72,
      "days_in_stage": 8,
      "last_activity_date": "2026-01-29",
      "next_step": "Final contract review with legal",
      "risk_level": "low",
      "risk_factors": [],
      "ai_insights": {
        "win_probability": 0.82,
        "confidence": 0.89,
        "key_factors": [
          "Strong executive sponsorship",
          "Successful POC completion",
          "Budget confirmed"
        ],
        "recommendations": [
          "Schedule final demo with CFO",
          "Address security questionnaire items"
        ]
      },
      "products": [
        { "id": "prod_001", "name": "Core Platform", "amount": 350000 },
        { "id": "prod_002", "name": "Analytics Add-on", "amount": 100000 }
      ],
      "links": {
        "self": "/api/v1/sales/deals/deal_abc123",
        "activities": "/api/v1/sales/deals/deal_abc123/activities",
        "account": "/api/v1/accounts/acc_456"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 156,
    "total_pages": 8
  }
}
```

### 7.3 Get Deal Details

`GET /api/v1/sales/deals/{deal_id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "deal_abc123",
    "name": "Acme Corp Enterprise License",
    "description": "Multi-year enterprise license agreement for Acme Corporation...",
    "account": { ... },
    "owner": { ... },
    "amount": 450000,
    "recurring_amount": 150000,
    "one_time_amount": 300000,
    "stage": "Negotiation",
    "stage_history": [
      { "stage": "Prospecting", "entered_at": "2025-11-20", "duration_days": 15 },
      { "stage": "Qualification", "entered_at": "2025-12-05", "duration_days": 22 },
      { "stage": "Proposal", "entered_at": "2025-12-27", "duration_days": 27 },
      { "stage": "Negotiation", "entered_at": "2026-01-23", "duration_days": 8 }
    ],
    "contacts": [
      {
        "id": "con_001",
        "name": "John Executive",
        "title": "CFO",
        "role": "Economic Buyer",
        "email": "john@acme.com"
      },
      {
        "id": "con_002",
        "name": "Jane Manager",
        "title": "VP Finance",
        "role": "Champion",
        "email": "jane@acme.com"
      }
    ],
    "competitors": [
      { "name": "Competitor A", "status": "Active", "strength": "Lower price" },
      { "name": "Competitor B", "status": "Eliminated", "reason": "Feature gap" }
    ],
    "activities": [
      {
        "id": "act_001",
        "type": "meeting",
        "subject": "Contract Review Call",
        "date": "2026-01-29",
        "outcome": "Positive - minor redlines to address"
      }
    ],
    "documents": [
      { "id": "doc_001", "name": "Proposal v3.pdf", "uploaded_at": "2026-01-15" },
      { "id": "doc_002", "name": "MSA Draft.pdf", "uploaded_at": "2026-01-25" }
    ],
    "custom_fields": {
      "deployment_type": "Cloud",
      "contract_term_months": 36,
      "payment_terms": "Annual upfront"
    }
  }
}
```

### 7.4 Update Deal

`PATCH /api/v1/sales/deals/{deal_id}`

**Request:**
```json
{
  "stage": "Closed Won",
  "amount": 475000,
  "close_date": "2026-01-31",
  "notes": "Contract signed with 3-year term"
}
```

### 7.5 Get Pipeline Forecast

`GET /api/v1/sales/forecast`

Returns AI-powered sales forecast.

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "Q1 2026",
    "forecast_date": "2026-01-31",
    "target": 15000000,
    "scenarios": {
      "pessimistic": {
        "value": 11500000,
        "probability": 0.20,
        "gap_to_target": -3500000,
        "assumptions": [
          "3 at-risk deals slip to Q2",
          "Conservative conversion rates"
        ]
      },
      "most_likely": {
        "value": 14200000,
        "probability": 0.55,
        "gap_to_target": -800000,
        "assumptions": [
          "Current pipeline conversion rates",
          "No major deal slippage"
        ]
      },
      "optimistic": {
        "value": 17500000,
        "probability": 0.25,
        "gap_to_target": 2500000,
        "assumptions": [
          "2 early close opportunities convert",
          "Improved conversion from new marketing campaign"
        ]
      }
    },
    "weekly_projections": [
      { "week": "2026-W05", "cumulative_closed": 3200000, "remaining_target": 11800000 },
      { "week": "2026-W06", "cumulative_closed": 5100000, "remaining_target": 9900000 },
      { "week": "2026-W07", "cumulative_closed": 7800000, "remaining_target": 7200000 },
      { "week": "2026-W08", "cumulative_closed": 10200000, "remaining_target": 4800000 },
      { "week": "2026-W09", "cumulative_closed": 12500000, "remaining_target": 2500000 },
      { "week": "2026-W10", "cumulative_closed": 14200000, "remaining_target": 800000 }
    ],
    "coverage_ratio": 3.0,
    "ai_confidence": 0.78,
    "risk_factors": [
      {
        "factor": "2 large deals with delayed legal review",
        "impact": -1200000,
        "mitigation": "Escalate to executive sponsor"
      },
      {
        "factor": "Competitor aggressive pricing in EMEA",
        "impact": -500000,
        "mitigation": "Value-based selling training"
      }
    ],
    "opportunities": [
      {
        "opportunity": "Upsell potential in 5 existing accounts",
        "impact": 800000,
        "action": "Launch expansion campaign"
      }
    ]
  }
}
```

---

## 8. Cost Intelligence API

### 8.1 Get Cost Overview

`GET /api/v1/costs/overview`

Returns cost summary by category.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `period` | string | No | `mtd`, `qtd`, `ytd`, `custom` |
| `start_date` | date | No | Start date (if custom) |
| `end_date` | date | No | End date (if custom) |
| `department` | string | No | Filter by department |
| `cost_center` | string | No | Filter by cost center |

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "type": "mtd",
      "start_date": "2026-01-01",
      "end_date": "2026-01-31"
    },
    "summary": {
      "total_costs": 8200000,
      "budget": 7800000,
      "variance": 400000,
      "variance_percent": 5.13,
      "prior_period": 7600000,
      "change_percent": 7.89
    },
    "by_category": [
      {
        "category": "Personnel",
        "amount": 4500000,
        "budget": 4400000,
        "variance": 100000,
        "percent_of_total": 54.88,
        "trend": "stable",
        "subcategories": [
          { "name": "Salaries", "amount": 3200000 },
          { "name": "Benefits", "amount": 800000 },
          { "name": "Stock Compensation", "amount": 500000 }
        ]
      },
      {
        "category": "Technology",
        "amount": 1800000,
        "budget": 1600000,
        "variance": 200000,
        "percent_of_total": 21.95,
        "trend": "increasing",
        "anomaly": true,
        "subcategories": [
          { "name": "Cloud Infrastructure", "amount": 1100000, "anomaly": true },
          { "name": "Software Licenses", "amount": 450000 },
          { "name": "Equipment", "amount": 250000 }
        ]
      },
      {
        "category": "Facilities",
        "amount": 650000,
        "budget": 650000,
        "variance": 0,
        "percent_of_total": 7.93,
        "trend": "stable"
      },
      {
        "category": "Professional Services",
        "amount": 750000,
        "budget": 700000,
        "variance": 50000,
        "percent_of_total": 9.15,
        "trend": "stable"
      },
      {
        "category": "Marketing",
        "amount": 500000,
        "budget": 450000,
        "variance": 50000,
        "percent_of_total": 6.10,
        "trend": "increasing"
      }
    ],
    "optimization_opportunities": [
      {
        "id": "opt_001",
        "category": "Technology",
        "opportunity": "Right-size unused cloud instances",
        "potential_savings": 85000,
        "effort": "low",
        "timeline": "2 weeks"
      },
      {
        "id": "opt_002",
        "category": "Software Licenses",
        "opportunity": "Consolidate redundant SaaS tools",
        "potential_savings": 45000,
        "effort": "medium",
        "timeline": "1 month"
      }
    ]
  }
}
```

### 8.2 Get Vendor Spend Analysis

`GET /api/v1/costs/vendors`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "YTD 2026",
    "total_vendor_spend": 12500000,
    "vendor_count": 245,
    "top_vendors": [
      {
        "id": "ven_001",
        "name": "Amazon Web Services",
        "category": "Cloud Infrastructure",
        "ytd_spend": 2800000,
        "budget": 2500000,
        "variance": 300000,
        "contract_end_date": "2026-12-31",
        "payment_terms": "Net 30",
        "risk_score": "medium",
        "spend_trend": [2100000, 2300000, 2500000, 2800000]
      },
      {
        "id": "ven_002",
        "name": "Salesforce",
        "category": "CRM",
        "ytd_spend": 850000,
        "budget": 800000,
        "variance": 50000,
        "contract_end_date": "2027-03-15",
        "payment_terms": "Annual",
        "risk_score": "low"
      }
    ],
    "by_category": [
      { "category": "Cloud Infrastructure", "spend": 3200000, "vendor_count": 8 },
      { "category": "SaaS Applications", "spend": 2100000, "vendor_count": 45 },
      { "category": "Professional Services", "spend": 1800000, "vendor_count": 32 }
    ],
    "insights": [
      {
        "type": "consolidation",
        "message": "12 vendors provide overlapping project management tools",
        "potential_savings": 120000
      },
      {
        "type": "renegotiation",
        "message": "3 contracts expiring in Q2 represent $450K in spend",
        "action": "Initiate renewal negotiations"
      }
    ]
  }
}
```

### 8.3 Get Cost Drivers Analysis

`GET /api/v1/costs/drivers`

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis_period": "January 2026",
    "total_cost_change": 600000,
    "drivers": [
      {
        "driver": "Headcount Growth",
        "impact": 350000,
        "impact_percent": 58.33,
        "direction": "increase",
        "details": "12 new hires in Engineering and Sales",
        "controllable": true
      },
      {
        "driver": "Cloud Usage Growth",
        "impact": 150000,
        "impact_percent": 25.0,
        "direction": "increase",
        "details": "40% increase in compute hours from product launch",
        "controllable": true
      },
      {
        "driver": "Annual License Renewals",
        "impact": 80000,
        "impact_percent": 13.33,
        "direction": "increase",
        "details": "5% price increase across SaaS tools",
        "controllable": false
      },
      {
        "driver": "Travel Optimization",
        "impact": -30000,
        "impact_percent": -5.0,
        "direction": "decrease",
        "details": "Shift to virtual meetings",
        "controllable": true
      }
    ],
    "waterfall_chart_data": {
      "starting_value": 7600000,
      "changes": [
        { "label": "Prior Month", "value": 7600000, "type": "start" },
        { "label": "Headcount", "value": 350000, "type": "increase" },
        { "label": "Cloud", "value": 150000, "type": "increase" },
        { "label": "Licenses", "value": 80000, "type": "increase" },
        { "label": "Other", "value": 50000, "type": "increase" },
        { "label": "Travel Savings", "value": -30000, "type": "decrease" },
        { "label": "Current Month", "value": 8200000, "type": "end" }
      ]
    }
  }
}
```

---

## 9. Revenue Intelligence API

### 9.1 Get Revenue Overview

`GET /api/v1/revenue/overview`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "January 2026",
    "summary": {
      "total_revenue": 12500000,
      "recurring_revenue": 4000000,
      "one_time_revenue": 8500000,
      "arr": 48000000,
      "mrr": 4000000,
      "budget": 12000000,
      "variance": 500000,
      "prior_year": 10200000,
      "yoy_growth": 22.55
    },
    "by_type": [
      { "type": "Subscription", "amount": 4000000, "percent": 32.0 },
      { "type": "License", "amount": 6500000, "percent": 52.0 },
      { "type": "Services", "amount": 2000000, "percent": 16.0 }
    ],
    "by_segment": [
      { "segment": "Enterprise", "amount": 8750000, "percent": 70.0, "growth": 25.0 },
      { "segment": "Mid-Market", "amount": 2500000, "percent": 20.0, "growth": 18.0 },
      { "segment": "SMB", "amount": 1250000, "percent": 10.0, "growth": 12.0 }
    ],
    "by_region": [
      { "region": "North America", "amount": 7500000, "percent": 60.0 },
      { "region": "EMEA", "amount": 3125000, "percent": 25.0 },
      { "region": "APAC", "amount": 1875000, "percent": 15.0 }
    ],
    "cohort_analysis": {
      "new_customers": {
        "count": 28,
        "revenue": 1200000,
        "average_deal_size": 42857
      },
      "expansion": {
        "count": 45,
        "revenue": 450000,
        "ndr": 1.12
      },
      "churn": {
        "count": 8,
        "lost_revenue": 200000,
        "gross_churn_rate": 0.05
      }
    }
  }
}
```

### 9.2 Get ARR Movement

`GET /api/v1/revenue/arr-movement`

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "January 2026",
    "opening_arr": 47150000,
    "closing_arr": 48000000,
    "movements": {
      "new_business": {
        "arr": 1200000,
        "deals": 28,
        "avg_arr": 42857
      },
      "expansion": {
        "arr": 450000,
        "customers": 45,
        "upsell": 300000,
        "cross_sell": 150000
      },
      "contraction": {
        "arr": -150000,
        "customers": 12,
        "reasons": [
          { "reason": "Downsized", "arr": -100000, "count": 8 },
          { "reason": "Product Change", "arr": -50000, "count": 4 }
        ]
      },
      "churn": {
        "arr": -350000,
        "customers": 8,
        "reasons": [
          { "reason": "Competitor", "arr": -150000, "count": 3 },
          { "reason": "Budget Cuts", "arr": -120000, "count": 3 },
          { "reason": "Company Closed", "arr": -80000, "count": 2 }
        ]
      },
      "reactivation": {
        "arr": 100000,
        "customers": 2
      }
    },
    "net_arr_change": 850000,
    "ndr": 1.0063,
    "grr": 0.9894,
    "logo_retention": 0.9657
  }
}
```

### 9.3 Get Customer Health Scores

`GET /api/v1/revenue/customer-health`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `risk_level` | string | No | `healthy`, `at_risk`, `critical` |
| `segment` | string | No | Customer segment filter |

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_customers": 485,
      "healthy": 380,
      "at_risk": 75,
      "critical": 30,
      "arr_at_risk": 4500000
    },
    "customers": [
      {
        "id": "cust_001",
        "name": "Enterprise Corp",
        "arr": 250000,
        "health_score": 85,
        "risk_level": "healthy",
        "factors": {
          "product_usage": 92,
          "support_tickets": 78,
          "nps_score": 85,
          "payment_history": 100,
          "engagement": 80
        },
        "last_contact": "2026-01-28",
        "renewal_date": "2026-07-15",
        "csm": { "id": "usr_csm01", "name": "Customer Success Manager" }
      },
      {
        "id": "cust_002",
        "name": "At Risk Inc",
        "arr": 150000,
        "health_score": 45,
        "risk_level": "at_risk",
        "factors": {
          "product_usage": 35,
          "support_tickets": 55,
          "nps_score": 40,
          "payment_history": 100,
          "engagement": 30
        },
        "risk_indicators": [
          "Product usage declined 60% last 30 days",
          "No executive engagement in 90 days",
          "Missed last QBR"
        ],
        "recommended_actions": [
          "Schedule executive business review",
          "Assign adoption specialist",
          "Review product fit"
        ],
        "renewal_date": "2026-04-30",
        "churn_probability": 0.45
      }
    ]
  }
}
```

---

## 10. Scenario Planning API

### 10.1 List Scenarios

`GET /api/v1/scenarios`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | `draft`, `in_review`, `approved`, `active`, `archived` |
| `type` | string | No | `budget`, `forecast`, `what_if`, `strategic` |
| `owner_id` | string | No | Filter by owner |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "scen_abc123",
      "name": "Q2 2026 Headcount Expansion",
      "description": "Model impact of adding 25 engineering headcount in Q2",
      "type": "what_if",
      "status": "in_review",
      "owner": {
        "id": "usr_001",
        "name": "Jane Analyst"
      },
      "created_at": "2026-01-25T10:00:00Z",
      "updated_at": "2026-01-30T15:30:00Z",
      "base_scenario_id": "scen_base_q2",
      "summary": {
        "revenue_impact": 0,
        "cost_impact": 3750000,
        "ebitda_impact": -3750000,
        "headcount_change": 25
      },
      "approval_status": {
        "required_approvers": ["usr_cfp", "usr_vp_eng"],
        "approved_by": ["usr_cfp"],
        "pending": ["usr_vp_eng"]
      },
      "links": {
        "self": "/api/v1/scenarios/scen_abc123",
        "compare": "/api/v1/scenarios/scen_abc123/compare"
      }
    }
  ],
  "pagination": { ... }
}
```

### 10.2 Get Scenario Details

`GET /api/v1/scenarios/{scenario_id}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scen_abc123",
    "name": "Q2 2026 Headcount Expansion",
    "description": "Model impact of adding 25 engineering headcount in Q2",
    "type": "what_if",
    "status": "in_review",
    "owner": { ... },
    "base_scenario": {
      "id": "scen_base_q2",
      "name": "Q2 2026 Base Budget"
    },
    "time_horizon": {
      "start_date": "2026-04-01",
      "end_date": "2026-12-31",
      "granularity": "monthly"
    },
    "assumptions": [
      {
        "id": "asm_001",
        "category": "Headcount",
        "name": "Engineering Hires",
        "value": 25,
        "unit": "headcount",
        "timing": "Q2 2026",
        "notes": "Senior engineers, average cost $150K"
      },
      {
        "id": "asm_002",
        "category": "Compensation",
        "name": "Average Salary",
        "value": 150000,
        "unit": "currency",
        "currency": "USD"
      },
      {
        "id": "asm_003",
        "category": "Productivity",
        "name": "Ramp Time",
        "value": 3,
        "unit": "months",
        "notes": "Full productivity achieved after 3 months"
      }
    ],
    "projections": {
      "monthly": [
        {
          "period": "2026-04",
          "revenue": 14000000,
          "costs": 9500000,
          "headcount_cost_delta": 625000,
          "ebitda": 4500000,
          "headcount": 525
        },
        {
          "period": "2026-05",
          "revenue": 14500000,
          "costs": 9750000,
          "headcount_cost_delta": 1250000,
          "ebitda": 4750000,
          "headcount": 550
        }
      ],
      "summary": {
        "total_revenue": 100000000,
        "total_costs": 75000000,
        "total_ebitda": 25000000,
        "ebitda_margin": 0.25,
        "peak_headcount": 550
      }
    },
    "comparison_to_base": {
      "revenue_delta": 0,
      "cost_delta": 3750000,
      "ebitda_delta": -3750000,
      "ebitda_margin_delta": -0.0375,
      "roi_analysis": {
        "payback_period_months": 18,
        "expected_productivity_gain": 8000000,
        "net_benefit_12m": 4250000
      }
    },
    "sensitivity_analysis": [
      {
        "variable": "Average Salary",
        "base_value": 150000,
        "range": [130000, 170000],
        "impact_range": [-500000, 500000]
      },
      {
        "variable": "Ramp Time",
        "base_value": 3,
        "range": [2, 4],
        "impact_range": [250000, -250000]
      }
    ],
    "audit_trail": [
      {
        "timestamp": "2026-01-30T15:30:00Z",
        "user": "Jane Analyst",
        "action": "Updated assumption",
        "details": "Changed engineering hires from 20 to 25"
      }
    ]
  }
}
```

### 10.3 Create Scenario

`POST /api/v1/scenarios`

**Request:**
```json
{
  "name": "Cost Reduction Initiative",
  "description": "Model 15% reduction in discretionary spending",
  "type": "what_if",
  "base_scenario_id": "scen_base_q2",
  "time_horizon": {
    "start_date": "2026-04-01",
    "end_date": "2026-12-31",
    "granularity": "monthly"
  },
  "assumptions": [
    {
      "category": "Costs",
      "name": "Discretionary Spend Reduction",
      "type": "percentage",
      "value": -15,
      "applies_to": ["Travel", "Marketing Events", "Contractor Services"]
    }
  ]
}
```

### 10.4 Compare Scenarios

`GET /api/v1/scenarios/compare`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scenario_ids` | string[] | Yes | Comma-separated scenario IDs |
| `metrics` | string[] | No | Metrics to compare |

**Response:**
```json
{
  "success": true,
  "data": {
    "scenarios": [
      { "id": "scen_001", "name": "Base Budget" },
      { "id": "scen_002", "name": "Growth Scenario" },
      { "id": "scen_003", "name": "Conservative Scenario" }
    ],
    "comparison": {
      "revenue": {
        "scen_001": 50000000,
        "scen_002": 60000000,
        "scen_003": 45000000
      },
      "costs": {
        "scen_001": 38000000,
        "scen_002": 45000000,
        "scen_003": 34000000
      },
      "ebitda": {
        "scen_001": 12000000,
        "scen_002": 15000000,
        "scen_003": 11000000
      },
      "headcount": {
        "scen_001": 500,
        "scen_002": 575,
        "scen_003": 480
      }
    },
    "time_series": {
      "periods": ["Q1", "Q2", "Q3", "Q4"],
      "revenue": {
        "scen_001": [12000000, 12500000, 12750000, 12750000],
        "scen_002": [12000000, 14000000, 16000000, 18000000],
        "scen_003": [11000000, 11250000, 11375000, 11375000]
      }
    }
  }
}
```

### 10.5 Run Scenario Simulation

`POST /api/v1/scenarios/{scenario_id}/simulate`

**Request:**
```json
{
  "iterations": 1000,
  "variables": [
    {
      "name": "Revenue Growth Rate",
      "distribution": "normal",
      "mean": 0.20,
      "std_dev": 0.05
    },
    {
      "name": "Cost Inflation",
      "distribution": "uniform",
      "min": 0.02,
      "max": 0.05
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scenario_id": "scen_abc123",
    "simulation_id": "sim_xyz789",
    "iterations": 1000,
    "results": {
      "revenue": {
        "mean": 52500000,
        "median": 52200000,
        "std_dev": 2500000,
        "percentiles": {
          "p10": 49000000,
          "p25": 50500000,
          "p75": 54500000,
          "p90": 56500000
        }
      },
      "ebitda": {
        "mean": 12800000,
        "median": 12600000,
        "std_dev": 1200000,
        "percentiles": {
          "p10": 11200000,
          "p25": 11900000,
          "p75": 13600000,
          "p90": 14500000
        }
      },
      "probability_of_meeting_target": 0.72
    }
  }
}
```

---

## 11. Governance API

### 11.1 Get Audit Logs

`GET /api/v1/governance/audit-logs`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | datetime | No | Filter from date |
| `end_date` | datetime | No | Filter to date |
| `user_id` | string | No | Filter by user |
| `action_type` | string | No | `create`, `update`, `delete`, `view`, `export`, `approve` |
| `resource_type` | string | No | `scenario`, `dashboard`, `report`, `user` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_abc123",
      "timestamp": "2026-01-31T15:30:00Z",
      "user": {
        "id": "usr_001",
        "name": "Jane Analyst",
        "email": "jane@company.com",
        "ip_address": "192.168.1.100"
      },
      "action": {
        "type": "update",
        "description": "Modified scenario assumptions"
      },
      "resource": {
        "type": "scenario",
        "id": "scen_xyz789",
        "name": "Q2 Budget Revision"
      },
      "changes": {
        "before": { "revenue_growth": 0.15 },
        "after": { "revenue_growth": 0.18 }
      },
      "metadata": {
        "user_agent": "Mozilla/5.0...",
        "session_id": "sess_abc123"
      }
    }
  ],
  "pagination": { ... }
}
```

### 11.2 Get Approval Workflows

`GET /api/v1/governance/approvals`

**Response:**
```json
{
  "success": true,
  "data": {
    "pending": [
      {
        "id": "appr_001",
        "type": "scenario_approval",
        "resource": {
          "type": "scenario",
          "id": "scen_abc123",
          "name": "Q2 Headcount Expansion"
        },
        "requestor": {
          "id": "usr_001",
          "name": "Jane Analyst"
        },
        "requested_at": "2026-01-30T10:00:00Z",
        "due_by": "2026-02-05T17:00:00Z",
        "current_step": 2,
        "total_steps": 3,
        "workflow": [
          { "step": 1, "approver": "Finance Manager", "status": "approved", "approved_at": "2026-01-30T14:00:00Z" },
          { "step": 2, "approver": "VP Engineering", "status": "pending" },
          { "step": 3, "approver": "CFO", "status": "pending" }
        ],
        "links": {
          "approve": "/api/v1/governance/approvals/appr_001/approve",
          "reject": "/api/v1/governance/approvals/appr_001/reject"
        }
      }
    ],
    "recent": [
      {
        "id": "appr_002",
        "type": "budget_approval",
        "resource": { ... },
        "status": "approved",
        "completed_at": "2026-01-28T16:00:00Z"
      }
    ]
  }
}
```

### 11.3 Approve/Reject Request

`POST /api/v1/governance/approvals/{approval_id}/approve`

**Request:**
```json
{
  "comments": "Approved with recommendation to review in Q3",
  "conditions": []
}
```

`POST /api/v1/governance/approvals/{approval_id}/reject`

**Request:**
```json
{
  "reason": "Budget allocation exceeds department limits",
  "comments": "Please revise headcount to 20 and resubmit"
}
```

### 11.4 Get Compliance Status

`GET /api/v1/governance/compliance`

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_score": 94,
    "status": "compliant",
    "last_assessment": "2026-01-31T00:00:00Z",
    "categories": [
      {
        "category": "Data Access Controls",
        "score": 98,
        "status": "compliant",
        "checks": [
          { "name": "Role-based access enforced", "status": "pass" },
          { "name": "MFA enabled for all users", "status": "pass" },
          { "name": "Access reviews completed", "status": "pass" }
        ]
      },
      {
        "category": "Financial Controls",
        "score": 92,
        "status": "compliant",
        "checks": [
          { "name": "Segregation of duties", "status": "pass" },
          { "name": "Approval workflows active", "status": "pass" },
          { "name": "Manual journal entry review", "status": "warning", "details": "2 entries pending review > 48 hours" }
        ]
      },
      {
        "category": "Data Retention",
        "score": 90,
        "status": "compliant",
        "checks": [
          { "name": "Retention policies defined", "status": "pass" },
          { "name": "Archived data encrypted", "status": "pass" }
        ]
      }
    ],
    "upcoming_requirements": [
      {
        "requirement": "Q1 SOX compliance review",
        "due_date": "2026-02-15",
        "status": "in_progress"
      }
    ]
  }
}
```

---

## 12. Data Fabric API

### 12.1 Get Data Sources

`GET /api/v1/data/sources`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "src_sap",
      "name": "SAP S/4HANA",
      "type": "erp",
      "status": "connected",
      "last_sync": "2026-01-31T14:00:00Z",
      "sync_frequency": "hourly",
      "tables_synced": 45,
      "records_synced": 2500000,
      "health": {
        "status": "healthy",
        "latency_ms": 250,
        "error_rate": 0.001
      },
      "data_quality": {
        "completeness": 0.98,
        "accuracy": 0.995,
        "freshness": "1 hour"
      }
    },
    {
      "id": "src_sfdc",
      "name": "Salesforce",
      "type": "crm",
      "status": "connected",
      "last_sync": "2026-01-31T14:30:00Z",
      "sync_frequency": "real-time",
      "objects_synced": ["Opportunity", "Account", "Contact", "Task"],
      "health": {
        "status": "healthy",
        "latency_ms": 180
      }
    }
  ]
}
```

### 12.2 Trigger Data Sync

`POST /api/v1/data/sources/{source_id}/sync`

**Request:**
```json
{
  "sync_type": "incremental",
  "tables": ["GL_ACCOUNTS", "GL_TRANSACTIONS"],
  "date_range": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job_id": "job_abc123",
    "status": "running",
    "started_at": "2026-01-31T15:00:00Z",
    "estimated_duration_minutes": 15
  }
}
```

### 12.3 Get Data Quality Report

`GET /api/v1/data/quality`

**Response:**
```json
{
  "success": true,
  "data": {
    "report_date": "2026-01-31",
    "overall_score": 94.5,
    "dimensions": {
      "completeness": {
        "score": 97.2,
        "issues": [
          {
            "table": "opportunities",
            "field": "close_date",
            "null_rate": 0.028,
            "records_affected": 45
          }
        ]
      },
      "accuracy": {
        "score": 95.8,
        "issues": [
          {
            "table": "gl_transactions",
            "issue": "Negative amounts in revenue accounts",
            "records_affected": 12
          }
        ]
      },
      "consistency": {
        "score": 93.5,
        "issues": [
          {
            "issue": "Customer ID mismatch between CRM and ERP",
            "records_affected": 28
          }
        ]
      },
      "timeliness": {
        "score": 96.0,
        "stale_sources": []
      }
    },
    "recommendations": [
      {
        "priority": "high",
        "issue": "Missing close dates in 45 opportunities",
        "impact": "Affects forecast accuracy",
        "action": "Run data enrichment job"
      }
    ]
  }
}
```

### 12.4 Get Calculated Metrics Definitions

`GET /api/v1/data/metrics`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "metric_arr",
      "name": "Annual Recurring Revenue (ARR)",
      "description": "Annualized value of all active recurring contracts",
      "category": "Revenue",
      "formula": "SUM(monthly_recurring_revenue) * 12",
      "source_tables": ["subscriptions", "contracts"],
      "refresh_frequency": "daily",
      "last_calculated": "2026-01-31T06:00:00Z",
      "current_value": 48000000,
      "data_lineage": {
        "sources": ["Salesforce.Subscriptions", "SAP.Contracts"],
        "transformations": [
          "Filter active subscriptions",
          "Convert to annual",
          "Aggregate by customer"
        ]
      }
    }
  ]
}
```

---

## 13. Integration API

### 13.1 Get Integration Status

`GET /api/v1/integrations`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "int_sap",
      "name": "SAP S/4HANA",
      "type": "erp",
      "status": "active",
      "version": "2.3.1",
      "connection": {
        "host": "sap.company.com",
        "protocol": "OData",
        "authentication": "OAuth2"
      },
      "capabilities": ["gl", "ap", "ar", "assets", "cost_centers"],
      "last_health_check": "2026-01-31T14:55:00Z",
      "health": {
        "status": "healthy",
        "response_time_ms": 245,
        "success_rate_24h": 0.998
      }
    },
    {
      "id": "int_sfdc",
      "name": "Salesforce",
      "type": "crm",
      "status": "active",
      "capabilities": ["opportunities", "accounts", "contacts", "forecasts"],
      "health": {
        "status": "healthy",
        "response_time_ms": 180
      }
    }
  ]
}
```

### 13.2 Test Integration Connection

`POST /api/v1/integrations/{integration_id}/test`

**Response:**
```json
{
  "success": true,
  "data": {
    "integration_id": "int_sap",
    "test_results": {
      "connection": "pass",
      "authentication": "pass",
      "data_access": "pass",
      "latency_ms": 245
    },
    "timestamp": "2026-01-31T15:00:00Z"
  }
}
```

### 13.3 Configure Webhook

`POST /api/v1/integrations/webhooks`

**Request:**
```json
{
  "name": "Slack Anomaly Alerts",
  "url": "https://hooks.slack.com/services/xxx/yyy/zzz",
  "events": ["anomaly.detected", "anomaly.resolved"],
  "filters": {
    "severity": ["critical", "high"]
  },
  "active": true
}
```

---

## 14. WebSocket Events

### 14.1 Connection

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://api.aether.gepfp.com/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'authenticate',
  token: 'Bearer eyJhbGciOiJSUzI1NiIs...'
}));

// Subscribe to channels
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['dashboard', 'anomalies', 'ai-conversations']
}));
```

### 14.2 Event Types

**Dashboard Updates:**
```json
{
  "type": "dashboard.kpi_updated",
  "channel": "dashboard",
  "data": {
    "kpi": "revenue",
    "previous_value": 12400000,
    "current_value": 12500000,
    "timestamp": "2026-01-31T15:00:00Z"
  }
}
```

**Anomaly Detected:**
```json
{
  "type": "anomaly.detected",
  "channel": "anomalies",
  "data": {
    "id": "anom_001",
    "severity": "high",
    "metric": "Cloud Infrastructure",
    "description": "AWS spending spike detected",
    "timestamp": "2026-01-31T14:23:00Z"
  }
}
```

**AI Streaming Response:**
```json
{
  "type": "ai.message_delta",
  "channel": "ai-conversations",
  "data": {
    "conversation_id": "conv_abc123",
    "message_id": "msg_xyz789",
    "delta": "Based on the current financial data, "
  }
}
```

**Sync Status:**
```json
{
  "type": "data.sync_completed",
  "channel": "data",
  "data": {
    "source": "SAP S/4HANA",
    "job_id": "job_abc123",
    "records_synced": 15000,
    "duration_seconds": 45
  }
}
```

---

## 15. Error Handling

### 15.1 Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": [
      {
        "field": "field_name",
        "message": "Specific field error"
      }
    ],
    "trace_id": "trace_abc123"
  },
  "meta": {
    "request_id": "req_xyz789",
    "timestamp": "2026-01-31T15:30:00Z"
  }
}
```

### 15.2 Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 400 | `INVALID_PARAMETER` | Invalid query parameter |
| 400 | `MALFORMED_REQUEST` | Request body is malformed |
| 401 | `UNAUTHORIZED` | Authentication required |
| 401 | `TOKEN_EXPIRED` | Access token has expired |
| 401 | `INVALID_TOKEN` | Token is invalid |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 403 | `ROLE_REQUIRED` | Specific role required |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (duplicate) |
| 409 | `CONCURRENT_MODIFICATION` | Resource was modified |
| 422 | `UNPROCESSABLE_ENTITY` | Business rule violation |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 502 | `BAD_GATEWAY` | Upstream service error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |
| 504 | `GATEWAY_TIMEOUT` | Upstream service timeout |

### 15.3 Validation Error Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "start_date",
        "message": "Start date must be before end date"
      },
      {
        "field": "amount",
        "message": "Amount must be a positive number"
      }
    ]
  }
}
```

---

## 16. Rate Limiting

### 16.1 Rate Limit Tiers

| Tier | Requests/Minute | Burst | Description |
|------|-----------------|-------|-------------|
| Standard | 60 | 100 | Default for all users |
| Premium | 300 | 500 | Enterprise plan users |
| API Partner | 1000 | 2000 | Approved integrations |

### 16.2 Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706749260
X-RateLimit-Retry-After: 15
```

### 16.3 Rate Limited Response

**HTTP 429 Too Many Requests:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Please retry after 15 seconds.",
    "retry_after": 15
  }
}
```

### 16.4 Special Endpoints

| Endpoint Pattern | Limit | Notes |
|-----------------|-------|-------|
| `/ai/*` | 30/min | AI endpoints have lower limits |
| `/reports/export` | 10/hour | Export operations |
| `/data/sync` | 5/hour | Data sync triggers |

---

## Appendix A: API Changelog

### Version 1.0 (January 2026)
- Initial API release
- Dashboard, Metrics, AI Agent, Sales Pipeline APIs
- Cost Intelligence, Revenue Intelligence APIs
- Scenario Planning, Governance APIs
- Data Fabric, Integration APIs
- WebSocket real-time events

---

## Appendix B: SDK Support

### Official SDKs

| Language | Package | Repository |
|----------|---------|------------|
| JavaScript/TypeScript | `@aether/sdk` | github.com/aether/sdk-js |
| Python | `aether-sdk` | github.com/aether/sdk-python |
| Java | `com.aether.sdk` | github.com/aether/sdk-java |

### SDK Example (TypeScript)

```typescript
import { AetherClient } from '@aether/sdk';

const client = new AetherClient({
  baseUrl: 'https://api.aether.gepfp.com/v1',
  apiKey: process.env.AETHER_API_KEY
});

// Get dashboard summary
const dashboard = await client.dashboard.getExecutive({
  asOfDate: '2026-01-31',
  comparisonPeriod: 'mom'
});

// Stream AI conversation
const stream = await client.ai.chat({
  conversationId: 'conv_abc123',
  message: 'What drove the revenue increase?'
});

for await (const chunk of stream) {
  console.log(chunk.text);
}
```

---

*Document Version: 1.0*
*Last Updated: January 31, 2026*
*Next Review: February 28, 2026*
