# Project Aether - Technical Architecture Document

## Enterprise Autonomous FP&A Platform

**Version:** 1.0
**Date:** January 31, 2026
**Status:** Draft
**Author:** Architecture Team

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [System Context](#2-system-context)
3. [Container Architecture](#3-container-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Data Architecture](#7-data-architecture)
8. [Integration Architecture](#8-integration-architecture)
9. [AI/ML Architecture](#9-aiml-architecture)
10. [Security Architecture](#10-security-architecture)
11. [Infrastructure Architecture](#11-infrastructure-architecture)
12. [DevOps & CI/CD](#12-devops--cicd)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Disaster Recovery](#14-disaster-recovery)
15. [Architecture Decision Records](#15-architecture-decision-records)

---

## 1. Architecture Overview

### 1.1 Architecture Principles

| Principle | Description | Rationale |
|-----------|-------------|-----------|
| **Cloud-Native** | Designed for cloud deployment with containerization | Scalability, resilience, portability |
| **API-First** | All functionality exposed through well-defined APIs | Enables integrations, mobile, extensibility |
| **Security by Design** | Security embedded at every layer | Financial data requires highest protection |
| **Event-Driven** | Asynchronous processing where appropriate | Decoupling, scalability, real-time capabilities |
| **Domain-Driven Design** | Organized around business domains | Maintainability, team autonomy |
| **12-Factor App** | Following cloud-native best practices | Operational excellence |

### 1.2 Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FRONTEND                                                                │
│  ├── React 19 + TypeScript 5.x                                          │
│  ├── Zustand (State Management)                                         │
│  ├── TanStack Query (Data Fetching)                                     │
│  ├── React Router v7 (Routing)                                          │
│  ├── Tailwind CSS (Styling)                                             │
│  ├── Recharts + Tremor (Visualization)                                  │
│  └── Vitest + Playwright (Testing)                                      │
│                                                                          │
│  BACKEND                                                                 │
│  ├── NestJS 10.x (Framework)                                            │
│  ├── TypeScript 5.x                                                     │
│  ├── Prisma (ORM)                                                       │
│  ├── Passport.js (Authentication)                                       │
│  ├── BullMQ (Job Queue)                                                 │
│  ├── Socket.io (WebSockets)                                             │
│  └── Jest (Testing)                                                     │
│                                                                          │
│  DATA                                                                    │
│  ├── PostgreSQL 15+ (Primary Database)                                  │
│  ├── Redis 7+ (Cache & Sessions)                                        │
│  ├── Snowflake (Analytics Warehouse)                                    │
│  └── S3/Azure Blob (Object Storage)                                     │
│                                                                          │
│  AI/ML                                                                   │
│  ├── Google Gemini 2.5 (GenAI)                                          │
│  ├── pgvector (Vector Search)                                           │
│  └── Custom ML Models (Forecasting, Anomaly Detection)                  │
│                                                                          │
│  INFRASTRUCTURE                                                          │
│  ├── Kubernetes (Container Orchestration)                               │
│  ├── Docker (Containerization)                                          │
│  ├── Terraform (IaC)                                                    │
│  ├── GitHub Actions (CI/CD)                                             │
│  └── GCP/AWS/Azure (Cloud Platform)                                     │
│                                                                          │
│  OBSERVABILITY                                                           │
│  ├── Datadog/New Relic (APM)                                            │
│  ├── ELK Stack/CloudWatch (Logging)                                     │
│  ├── Prometheus + Grafana (Metrics)                                     │
│  └── Sentry (Error Tracking)                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. System Context

### 2.1 Context Diagram (C4 Level 1)

```
                                    ┌─────────────────────┐
                                    │    FINANCE USERS    │
                                    │  (CFO, Analysts,    │
                                    │   Managers)         │
                                    └──────────┬──────────┘
                                               │
                                               │ HTTPS
                                               ▼
┌─────────────────────┐           ┌─────────────────────────────────────────┐
│   IDENTITY          │           │                                         │
│   PROVIDER          │◄─────────►│          PROJECT AETHER                 │
│   (Okta/Azure AD)   │   SSO     │                                         │
└─────────────────────┘           │   Enterprise Autonomous FP&A Platform   │
                                  │                                         │
                                  │   • Financial Analytics                 │
                                  │   • AI-Powered Insights                 │
                                  │   • Scenario Planning                   │
                                  │   • Governance & Compliance             │
                                  │                                         │
                                  └──────────────┬──────────────────────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
         ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
         │   ERP SYSTEM    │          │   CRM SYSTEM    │          │   HRIS SYSTEM   │
         │   (SAP S/4HANA) │          │   (Salesforce)  │          │   (Workday)     │
         │                 │          │                 │          │                 │
         │ • General Ledger│          │ • Pipeline Data │          │ • Headcount     │
         │ • AP/AR         │          │ • Opportunities │          │ • Compensation  │
         │ • Fixed Assets  │          │ • Forecasts     │          │ • Benefits      │
         └─────────────────┘          └─────────────────┘          └─────────────────┘
                    │                            │                            │
                    └────────────────────────────┼────────────────────────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────┐
                                    │   GOOGLE GEMINI     │
                                    │   (GenAI API)       │
                                    │                     │
                                    │ • Financial Insights│
                                    │ • RCA Generation    │
                                    │ • Scenario Analysis │
                                    └─────────────────────┘
```

### 2.2 External System Interfaces

| System | Interface Type | Protocol | Data Flow | Frequency |
|--------|---------------|----------|-----------|-----------|
| Okta/Azure AD | SSO | SAML 2.0 / OIDC | User authentication | Real-time |
| SAP S/4HANA | REST API | HTTPS/OData | GL, AP/AR, Assets | Hourly |
| Salesforce | REST API | HTTPS | Pipeline, Opportunities | Real-time (CDC) |
| Workday | REST API | HTTPS | HR, Payroll | Daily |
| Snowflake | SQL/REST | HTTPS | Analytics queries | On-demand |
| Google Gemini | REST API | HTTPS | AI generation | Real-time |

---

## 3. Container Architecture

### 3.1 Container Diagram (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PROJECT AETHER SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           WEB APPLICATION                                    │   │
│  │                           (React SPA)                                        │   │
│  │                                                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │   │
│  │  │Dashboard │ │AI Agent  │ │ Sales    │ │Scenarios │ │Governance│          │   │
│  │  │ Module   │ │ Module   │ │ Module   │ │ Module   │ │ Module   │ ...      │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │   │
│  └─────────────────────────────────┬───────────────────────────────────────────┘   │
│                                    │ HTTPS/WSS                                      │
│                                    ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           API GATEWAY                                        │   │
│  │                      (Kong / AWS API Gateway)                               │   │
│  │                                                                              │   │
│  │  • Rate Limiting    • Authentication   • Request Validation                 │   │
│  │  • Load Balancing   • SSL Termination  • Request Logging                    │   │
│  └─────────────────────────────────┬───────────────────────────────────────────┘   │
│                                    │                                                │
│         ┌──────────────────────────┼──────────────────────────┐                    │
│         │                          │                          │                    │
│         ▼                          ▼                          ▼                    │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐              │
│  │  AUTH SERVICE   │     │  CORE API       │     │  AI SERVICE     │              │
│  │  (NestJS)       │     │  (NestJS)       │     │  (NestJS)       │              │
│  │                 │     │                 │     │                 │              │
│  │ • SSO/OAuth     │     │ • Dashboard API │     │ • Gemini Proxy  │              │
│  │ • JWT Tokens    │     │ • Financial API │     │ • RAG Pipeline  │              │
│  │ • RBAC          │     │ • Pipeline API  │     │ • Streaming     │              │
│  │ • Sessions      │     │ • Scenarios API │     │ • Conversations │              │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘              │
│           │                       │                       │                        │
│           └───────────────────────┼───────────────────────┘                        │
│                                   │                                                │
│         ┌─────────────────────────┼─────────────────────────┐                      │
│         │                         │                         │                      │
│         ▼                         ▼                         ▼                      │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐              │
│  │  WORKER SERVICE │     │  NOTIFICATION   │     │  INTEGRATION    │              │
│  │  (BullMQ)       │     │  SERVICE        │     │  SERVICE        │              │
│  │                 │     │                 │     │                 │              │
│  │ • Async Jobs    │     │ • Email         │     │ • SAP Connector │              │
│  │ • Reports       │     │ • Slack         │     │ • SFDC Connector│              │
│  │ • Data Sync     │     │ • In-App        │     │ • Workday Conn  │              │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘              │
│           │                       │                       │                        │
│           └───────────────────────┼───────────────────────┘                        │
│                                   │                                                │
│  ┌────────────────────────────────┴────────────────────────────────────────────┐   │
│  │                           DATA LAYER                                         │   │
│  │                                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │   │
│  │  │ PostgreSQL   │  │    Redis     │  │  Snowflake   │  │  S3/Blob     │    │   │
│  │  │ (Primary DB) │  │   (Cache)    │  │ (Analytics)  │  │  (Storage)   │    │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Container Responsibilities

| Container | Technology | Responsibilities | Scaling Strategy |
|-----------|------------|------------------|------------------|
| Web App | React SPA | UI rendering, client state | CDN, edge caching |
| API Gateway | Kong/AWS | Routing, rate limiting, auth | Horizontal |
| Auth Service | NestJS | Authentication, authorization | Horizontal (2-4) |
| Core API | NestJS | Business logic, data access | Horizontal (3-10) |
| AI Service | NestJS | Gemini integration, RAG | Horizontal (2-6) |
| Worker Service | BullMQ | Background jobs, reports | Horizontal (2-8) |
| Notification | NestJS | Email, Slack, in-app | Horizontal (2-4) |
| Integration | NestJS | External system connectors | Horizontal (2-4) |

---

## 4. Component Architecture

### 4.1 Core API Component Diagram (C4 Level 3)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CORE API SERVICE                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         PRESENTATION LAYER                                   │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│   │
│  │  │ Dashboard  │ │ Financial  │ │  Pipeline  │ │ Scenarios  │ │ Governance ││   │
│  │  │ Controller │ │ Controller │ │ Controller │ │ Controller │ │ Controller ││   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘│   │
│  └────────┼──────────────┼──────────────┼──────────────┼──────────────┼────────┘   │
│           │              │              │              │              │             │
│           ▼              ▼              ▼              ▼              ▼             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         APPLICATION LAYER                                    │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│   │
│  │  │  Dashboard │ │  Metrics   │ │  Pipeline  │ │  Scenario  │ │   Audit    ││   │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service   │ │  Service   ││   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘│   │
│  │        │              │              │              │              │        │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │   │
│  │  │  Anomaly   │ │  Forecast  │ │   Cost     │ │  Revenue   │              │   │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service   │              │   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘              │   │
│  └────────┼──────────────┼──────────────┼──────────────┼─────────────────────┘   │
│           │              │              │              │                          │
│           ▼              ▼              ▼              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                          DOMAIN LAYER                                        │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│   │
│  │  │ Financial  │ │   Deal     │ │   Cost     │ │  Scenario  │ │   Audit    ││   │
│  │  │  Metric    │ │  (Entity)  │ │  (Entity)  │ │  (Entity)  │ │   Log      ││   │
│  │  │  (Entity)  │ │            │ │            │ │            │ │  (Entity)  ││   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘│   │
│  │                                                                              │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐              │   │
│  │  │  Anomaly   │ │   User     │ │   Vendor   │ │  AI Conv   │              │   │
│  │  │  (Entity)  │ │  (Entity)  │ │  (Entity)  │ │  (Entity)  │              │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│           │              │              │              │                          │
│           ▼              ▼              ▼              ▼                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                       INFRASTRUCTURE LAYER                                   │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│   │
│  │  │  Prisma    │ │   Redis    │ │  Snowflake │ │   Event    │ │   Queue    ││   │
│  │  │ Repository │ │   Cache    │ │   Client   │ │  Emitter   │ │  Producer  ││   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Layer Responsibilities

| Layer | Responsibility | Technologies |
|-------|----------------|--------------|
| **Presentation** | HTTP handling, request validation, response formatting | NestJS Controllers, class-validator |
| **Application** | Business logic orchestration, use cases | NestJS Services, CQRS patterns |
| **Domain** | Business entities, domain logic, validation | TypeScript classes, value objects |
| **Infrastructure** | External services, persistence, messaging | Prisma, Redis, BullMQ |

---

## 5. Frontend Architecture

### 5.1 Frontend Structure

```
frontend/
├── src/
│   ├── app/                          # Application shell
│   │   ├── App.tsx                   # Root component
│   │   ├── Router.tsx                # Route definitions
│   │   └── Providers.tsx             # Context providers wrapper
│   │
│   ├── modules/                      # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── MFAChallenge.tsx
│   │   │   │   └── SessionManager.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── usePermissions.ts
│   │   │   ├── services/
│   │   │   │   └── authApi.ts
│   │   │   ├── store/
│   │   │   │   └── authStore.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   │   ├── DashboardView.tsx
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── AnomalyModal.tsx
│   │   │   │   ├── InsightBanner.tsx
│   │   │   │   └── CashFlowChart.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useKPIs.ts
│   │   │   │   ├── useAnomalies.ts
│   │   │   │   └── useForecast.ts
│   │   │   └── services/
│   │   │       └── dashboardApi.ts
│   │   │
│   │   ├── ai-agent/
│   │   │   ├── components/
│   │   │   │   ├── AIAgentView.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── SuggestionChips.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts
│   │   │   │   └── useStreaming.ts
│   │   │   └── services/
│   │   │       └── aiApi.ts
│   │   │
│   │   ├── sales/
│   │   ├── cost/
│   │   ├── revenue/
│   │   ├── marketing/
│   │   ├── gtm/
│   │   ├── scenarios/
│   │   ├── data-fabric/
│   │   ├── governance/
│   │   └── intelligence/
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/                   # Design system primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── charts/               # Chart wrappers
│   │   │   │   ├── RevenueChart.tsx
│   │   │   │   ├── WaterfallChart.tsx
│   │   │   │   ├── FunnelChart.tsx
│   │   │   │   └── TreemapChart.tsx
│   │   │   │
│   │   │   └── layout/               # Layout components
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Header.tsx
│   │   │       ├── MainLayout.tsx
│   │   │       └── ErrorBoundary.tsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   ├── useMediaQuery.ts
│   │   │   └── useWebSocket.ts
│   │   │
│   │   ├── services/
│   │   │   └── api/
│   │   │       ├── apiClient.ts      # Axios instance with interceptors
│   │   │       ├── queryClient.ts    # TanStack Query config
│   │   │       └── endpoints.ts      # API endpoint constants
│   │   │
│   │   ├── store/
│   │   │   ├── uiStore.ts            # UI state (sidebar, theme)
│   │   │   └── filterStore.ts        # Global filter state
│   │   │
│   │   └── utils/
│   │       ├── formatters.ts         # Number, date, currency formatting
│   │       ├── validators.ts         # Validation helpers
│   │       └── constants.ts          # App-wide constants
│   │
│   ├── types/
│   │   ├── api.types.ts              # API response types
│   │   ├── entities.types.ts         # Domain entity types
│   │   └── common.types.ts           # Utility types
│   │
│   └── styles/
│       ├── globals.css               # Global styles
│       └── tailwind.config.js        # Tailwind configuration
│
├── public/
│   ├── favicon.ico
│   └── assets/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

### 5.2 State Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           STATE MANAGEMENT ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           SERVER STATE                                       │   │
│  │                        (TanStack Query)                                      │   │
│  │                                                                              │   │
│  │  • API Data Caching          • Background Refetching                        │   │
│  │  • Optimistic Updates        • Infinite Queries                             │   │
│  │  • Prefetching               • Mutation Handling                            │   │
│  │                                                                              │   │
│  │  Example:                                                                    │   │
│  │  const { data: kpis } = useQuery({                                          │   │
│  │    queryKey: ['dashboard', 'kpis'],                                         │   │
│  │    queryFn: () => dashboardApi.getKPIs(),                                   │   │
│  │    staleTime: 60_000,  // 1 minute                                          │   │
│  │  });                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           CLIENT STATE                                       │   │
│  │                            (Zustand)                                         │   │
│  │                                                                              │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │   │
│  │  │    Auth Store    │  │     UI Store     │  │   Filter Store   │          │   │
│  │  │                  │  │                  │  │                  │          │   │
│  │  │ • user           │  │ • sidebarOpen    │  │ • region         │          │   │
│  │  │ • token          │  │ • theme          │  │ • lob            │          │   │
│  │  │ • permissions    │  │ • activeTab      │  │ • dateRange      │          │   │
│  │  │ • isAuthenticated│  │ • notifications  │  │ • segment        │          │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘          │   │
│  │                                                                              │   │
│  │  Example:                                                                    │   │
│  │  const useFilterStore = create<FilterState>((set) => ({                     │   │
│  │    region: null,                                                            │   │
│  │    setRegion: (region) => set({ region }),                                  │   │
│  │    clearFilters: () => set({ region: null, lob: null }),                    │   │
│  │  }));                                                                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           FORM STATE                                         │   │
│  │                      (React Hook Form + Zod)                                 │   │
│  │                                                                              │   │
│  │  • Form validation       • Field-level errors                               │   │
│  │  • Submit handling       • Type-safe schemas                                │   │
│  │                                                                              │   │
│  │  Example:                                                                    │   │
│  │  const schema = z.object({                                                  │   │
│  │    scenarioName: z.string().min(3).max(100),                                │   │
│  │    investment: z.number().min(-50).max(100),                                │   │
│  │  });                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           URL STATE                                          │   │
│  │                        (React Router)                                        │   │
│  │                                                                              │   │
│  │  • Route parameters      • Query strings for filters                        │   │
│  │  • Navigation state      • Shareable URLs                                   │   │
│  │                                                                              │   │
│  │  Example:                                                                    │   │
│  │  /sales?region=NA&lob=Software&tab=pipeline                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Data Flow Pattern

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW PATTERN                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│     ┌──────────────┐                                                                │
│     │  Component   │                                                                │
│     │  (View)      │◄─────────────────┐                                            │
│     └──────┬───────┘                  │                                            │
│            │                          │ Re-render                                   │
│            │ Calls                    │                                            │
│            ▼                          │                                            │
│     ┌──────────────┐          ┌──────┴───────┐                                     │
│     │    Hook      │          │    State     │                                     │
│     │ (useQuery)   │─────────►│   (Cache)    │                                     │
│     └──────┬───────┘  Updates └──────────────┘                                     │
│            │                                                                        │
│            │ If stale/missing                                                       │
│            ▼                                                                        │
│     ┌──────────────┐                                                                │
│     │  API Client  │                                                                │
│     │  (Axios)     │                                                                │
│     └──────┬───────┘                                                                │
│            │                                                                        │
│            │ HTTP Request                                                           │
│            ▼                                                                        │
│     ┌──────────────┐                                                                │
│     │  API Gateway │                                                                │
│     │  (Backend)   │                                                                │
│     └──────────────┘                                                                │
│                                                                                      │
│  MUTATIONS:                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                        │
│  │   Action     │────►│  Mutation    │────►│  Optimistic  │                        │
│  │  (onClick)   │     │  (useMutate) │     │   Update     │                        │
│  └──────────────┘     └──────┬───────┘     └──────────────┘                        │
│                              │                     │                                │
│                              │ API Call           │ Rollback on error              │
│                              ▼                     ▼                                │
│                       ┌──────────────┐     ┌──────────────┐                        │
│                       │   Server     │────►│ Invalidate   │                        │
│                       │   Persist    │     │  & Refetch   │                        │
│                       └──────────────┘     └──────────────┘                        │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Backend Architecture

### 6.1 Backend Structure

```
backend/
├── src/
│   ├── main.ts                       # Application entry point
│   ├── app.module.ts                 # Root module
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── controllers/
│   │   │   │   └── auth.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── token.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── saml.strategy.ts
│   │   │   │   └── oauth.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── token.dto.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── dashboard.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── kpi.controller.ts
│   │   │   │   ├── forecast.controller.ts
│   │   │   │   └── anomaly.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── kpi.service.ts
│   │   │   │   ├── forecast.service.ts
│   │   │   │   └── anomaly.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── financial/
│   │   │   ├── financial.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── metrics.controller.ts
│   │   │   │   ├── revenue.controller.ts
│   │   │   │   └── cost.controller.ts
│   │   │   ├── services/
│   │   │   └── repositories/
│   │   │       └── financial.repository.ts
│   │   │
│   │   ├── pipeline/
│   │   │   ├── pipeline.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── deals.controller.ts
│   │   │   │   └── funnel.controller.ts
│   │   │   └── services/
│   │   │
│   │   ├── scenarios/
│   │   │   ├── scenarios.module.ts
│   │   │   ├── controllers/
│   │   │   │   └── scenarios.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── scenarios.service.ts
│   │   │   │   └── monte-carlo.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── ai/
│   │   │   ├── ai.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── chat.controller.ts
│   │   │   │   └── insights.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── gemini.service.ts
│   │   │   │   ├── rag.service.ts
│   │   │   │   └── conversation.service.ts
│   │   │   └── prompts/
│   │   │       ├── financial-insight.prompt.ts
│   │   │       ├── rca.prompt.ts
│   │   │       └── scenario-analysis.prompt.ts
│   │   │
│   │   ├── governance/
│   │   │   ├── governance.module.ts
│   │   │   ├── controllers/
│   │   │   │   ├── audit.controller.ts
│   │   │   │   └── compliance.controller.ts
│   │   │   └── services/
│   │   │
│   │   ├── integrations/
│   │   │   ├── integrations.module.ts
│   │   │   ├── connectors/
│   │   │   │   ├── sap.connector.ts
│   │   │   │   ├── salesforce.connector.ts
│   │   │   │   └── workday.connector.ts
│   │   │   └── services/
│   │   │       └── sync.service.ts
│   │   │
│   │   └── notifications/
│   │       ├── notifications.module.ts
│   │       └── services/
│   │           ├── email.service.ts
│   │           ├── slack.service.ts
│   │           └── inapp.service.ts
│   │
│   ├── shared/
│   │   ├── database/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   │
│   │   ├── cache/
│   │   │   ├── cache.module.ts
│   │   │   └── redis.service.ts
│   │   │
│   │   ├── queue/
│   │   │   ├── queue.module.ts
│   │   │   └── processors/
│   │   │       ├── report.processor.ts
│   │   │       └── sync.processor.ts
│   │   │
│   │   ├── logging/
│   │   │   ├── logging.module.ts
│   │   │   └── winston.config.ts
│   │   │
│   │   └── websocket/
│   │       ├── websocket.module.ts
│   │       └── websocket.gateway.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── api-paginated.decorator.ts
│   │   │   └── audit-log.decorator.ts
│   │   │
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── prisma-exception.filter.ts
│   │   │
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   │
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   │
│   │   └── dto/
│   │       ├── pagination.dto.ts
│   │       └── response.dto.ts
│   │
│   └── config/
│       ├── configuration.ts
│       ├── database.config.ts
│       ├── redis.config.ts
│       └── gemini.config.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seeds/
│       └── seed.ts
│
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example
```

### 6.2 Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  HTTP Request                                                                        │
│       │                                                                              │
│       ▼                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         MIDDLEWARE PIPELINE                                  │   │
│  │                                                                              │   │
│  │  1. Request Logging    →  Log incoming request                              │   │
│  │  2. Helmet             →  Security headers                                  │   │
│  │  3. CORS               →  Cross-origin handling                             │   │
│  │  4. Compression        →  Response compression                              │   │
│  │  5. Rate Limiting      →  Throttle excessive requests                       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│       │                                                                              │
│       ▼                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           GUARD LAYER                                        │   │
│  │                                                                              │   │
│  │  1. JwtAuthGuard       →  Validate JWT token                                │   │
│  │  2. RolesGuard         →  Check user roles/permissions                      │   │
│  │  3. ThrottlerGuard     →  Per-user rate limiting                            │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│       │                                                                              │
│       ▼                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         INTERCEPTOR LAYER                                    │   │
│  │                                                                              │   │
│  │  1. LoggingInterceptor →  Log request/response                              │   │
│  │  2. TimeoutInterceptor →  Enforce timeout limits                            │   │
│  │  3. CacheInterceptor   →  Check/populate cache                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│       │                                                                              │
│       ▼                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                            PIPE LAYER                                        │   │
│  │                                                                              │   │
│  │  1. ValidationPipe     →  Validate DTO with class-validator                 │   │
│  │  2. TransformPipe      →  Transform input data                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│       │                                                                              │
│       ▼                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                          CONTROLLER                                          │   │
│  │                                                                              │   │
│  │  @Get('/dashboard/kpis')                                                    │   │
│  │  @UseGuards(JwtAuthGuard, RolesGuard)                                       │   │
│  │  @Roles('CFO', 'FINANCE_MANAGER', 'ANALYST')                                │   │
│  │  async getKPIs(@CurrentUser() user: User): Promise<KPIResponse>             │   │
│  └────────────────────────────────────┬────────────────────────────────────────┘   │
│                                       │                                             │
│       ┌───────────────────────────────┴───────────────────────────────┐            │
│       │                                                               │            │
│       ▼                                                               ▼            │
│  ┌─────────────────────┐                                 ┌─────────────────────┐   │
│  │      SERVICE        │                                 │       CACHE         │   │
│  │  (Business Logic)   │◄───────────────────────────────►│      (Redis)        │   │
│  └──────────┬──────────┘                                 └─────────────────────┘   │
│             │                                                                       │
│             ▼                                                                       │
│  ┌─────────────────────┐                                                           │
│  │     REPOSITORY      │                                                           │
│  │   (Data Access)     │                                                           │
│  └──────────┬──────────┘                                                           │
│             │                                                                       │
│             ▼                                                                       │
│  ┌─────────────────────┐                                                           │
│  │     DATABASE        │                                                           │
│  │   (PostgreSQL)      │                                                           │
│  └─────────────────────┘                                                           │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Architecture

### 7.1 Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA OVERVIEW                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CORE ENTITIES                       FINANCIAL ENTITIES                             │
│  ┌─────────────────┐                ┌─────────────────┐                            │
│  │  organizations  │                │financial_metrics│                            │
│  │  ─────────────  │                │  ─────────────  │                            │
│  │  id (PK)        │◄──────┐        │  id (PK)        │                            │
│  │  name           │       │        │  org_id (FK)────┼───────────┐                │
│  │  slug           │       │        │  metric_date    │           │                │
│  │  settings       │       │        │  metric_type    │           │                │
│  └─────────────────┘       │        │  actual         │           │                │
│           │                │        │  forecast       │           │                │
│           │                │        │  budget         │           │                │
│           ▼                │        └─────────────────┘           │                │
│  ┌─────────────────┐       │                                      │                │
│  │     users       │       │        ┌─────────────────┐           │                │
│  │  ─────────────  │       │        │     deals       │           │                │
│  │  id (PK)        │       │        │  ─────────────  │           │                │
│  │  org_id (FK)────┼───────┤        │  id (PK)        │           │                │
│  │  email          │       │        │  org_id (FK)────┼───────────┤                │
│  │  name           │       │        │  deal_id        │           │                │
│  │  role           │       │        │  region         │           │                │
│  │  preferences    │       │        │  lob            │           │                │
│  └─────────────────┘       │        │  stage          │           │                │
│                            │        │  value          │           │                │
│  GOVERNANCE ENTITIES       │        │  probability    │           │                │
│  ┌─────────────────┐       │        │  owner_id (FK)──┼──┐        │                │
│  │   audit_logs    │       │        └─────────────────┘  │        │                │
│  │  ─────────────  │       │                             │        │                │
│  │  id (PK)        │       │        ┌─────────────────┐  │        │                │
│  │  org_id (FK)────┼───────┤        │    anomalies    │  │        │                │
│  │  timestamp      │       │        │  ─────────────  │  │        │                │
│  │  actor_type     │       │        │  id (PK)        │  │        │                │
│  │  actor_id       │       │        │  org_id (FK)────┼──┼────────┤                │
│  │  action         │       │        │  metric_type    │  │        │                │
│  │  details        │       │        │  severity       │  │        │                │
│  │  risk_level     │       │        │  status         │  │        │                │
│  └─────────────────┘       │        │  ai_analysis    │  │        │                │
│                            │        └─────────────────┘  │        │                │
│  AI ENTITIES               │                             │        │                │
│  ┌─────────────────┐       │        ┌─────────────────┐  │        │                │
│  │ai_conversations │       │        │    scenarios    │  │        │                │
│  │  ─────────────  │       │        │  ─────────────  │  │        │                │
│  │  id (PK)        │       │        │  id (PK)        │  │        │                │
│  │  org_id (FK)────┼───────┤        │  org_id (FK)────┼──┼────────┘                │
│  │  user_id (FK)───┼──┐    │        │  created_by(FK)─┼──┘                         │
│  │  title          │  │    │        │  name           │                            │
│  │  created_at     │  │    │        │  parameters     │                            │
│  └─────────────────┘  │    │        │  results        │                            │
│           │           │    │        │  ai_analysis    │                            │
│           ▼           │    │        └─────────────────┘                            │
│  ┌─────────────────┐  │    │                                                       │
│  │   ai_messages   │  │    │        ┌─────────────────┐                            │
│  │  ─────────────  │  │    │        │    vendors      │                            │
│  │  id (PK)        │  │    │        │  ─────────────  │                            │
│  │  conversation_id│  │    │        │  id (PK)        │                            │
│  │  role           │  │    │        │  org_id (FK)────┼────────────────────────────┘
│  │  content        │  │    │        │  name           │
│  │  created_at     │  │    │        │  category       │
│  └─────────────────┘  │    │        │  risk_level     │
│                       │    │        └─────────────────┘
│                       │    │
│                       │    │
│                       └────┴────────────────────────────────────────────────────────┤
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Data Partitioning Strategy

| Table | Partitioning Strategy | Partition Key | Retention |
|-------|----------------------|---------------|-----------|
| `financial_metrics` | Range (Monthly) | `metric_date` | 7 years |
| `audit_logs` | Range (Monthly) | `timestamp` | 7 years |
| `ai_messages` | Range (Monthly) | `created_at` | 1 year |
| `deals` | List (Region) | `region` | Active + 3 years |
| `vendor_spend` | Range (Monthly) | `period_date` | 7 years |

### 7.3 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CACHING STRATEGY                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CACHE LAYERS                                                                       │
│  ═══════════                                                                        │
│                                                                                      │
│  Layer 1: Browser/CDN Cache                                                         │
│  ─────────────────────────                                                          │
│  • Static assets (JS, CSS, images)                                                  │
│  • TTL: 1 year (versioned)                                                          │
│  • Invalidation: Deploy                                                             │
│                                                                                      │
│  Layer 2: API Response Cache (Redis)                                                │
│  ────────────────────────────────────                                               │
│  • Dashboard KPIs:        TTL 1 minute                                              │
│  • Forecast data:         TTL 5 minutes                                             │
│  • User preferences:      TTL 1 hour                                                │
│  • Filter options:        TTL 15 minutes                                            │
│                                                                                      │
│  Layer 3: Database Query Cache (PostgreSQL)                                         │
│  ──────────────────────────────────────────                                         │
│  • Materialized views for complex aggregations                                      │
│  • Refresh: Every 15 minutes                                                        │
│                                                                                      │
│  CACHE PATTERNS                                                                     │
│  ══════════════                                                                     │
│                                                                                      │
│  Pattern 1: Cache-Aside (Primary)                                                   │
│  ┌──────────┐                                                                       │
│  │  Client  │──1. Read───►┌──────────┐                                             │
│  └──────────┘             │   Cache  │──2. Miss──►┌──────────┐                     │
│       ▲                   └──────────┘            │    DB    │                     │
│       │                        ▲                  └──────────┘                     │
│       │                        │                        │                          │
│       └────4. Return───────────┴────3. Populate─────────┘                          │
│                                                                                      │
│  Pattern 2: Write-Through (Audit Logs)                                              │
│  ┌──────────┐                                                                       │
│  │  Client  │──1. Write──►┌──────────┐──2. Write──►┌──────────┐                    │
│  └──────────┘             │   Cache  │             │    DB    │                    │
│                           └──────────┘             └──────────┘                    │
│                                                                                      │
│  CACHE KEY PATTERNS                                                                 │
│  ══════════════════                                                                 │
│                                                                                      │
│  • kpi:{org_id}:{period}                                                            │
│  • forecast:{org_id}:{type}:{date}                                                  │
│  • deals:{org_id}:{filters_hash}                                                    │
│  • user:{user_id}:permissions                                                       │
│  • session:{session_id}                                                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Integration Architecture

### 8.1 Integration Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           INTEGRATION PATTERNS                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  PATTERN 1: API Gateway Pattern (Synchronous)                                       │
│  ════════════════════════════════════════════                                       │
│                                                                                      │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐       │
│  │  Client  │────►│ API Gateway  │────►│ Integration  │────►│  External    │       │
│  │          │◄────│              │◄────│   Service    │◄────│   System     │       │
│  └──────────┘     └──────────────┘     └──────────────┘     └──────────────┘       │
│                                                                                      │
│  Use for:                                                                           │
│  • Real-time data lookups                                                           │
│  • User-triggered actions                                                           │
│  • Low-latency requirements                                                         │
│                                                                                      │
│  PATTERN 2: Event-Driven (Asynchronous)                                             │
│  ══════════════════════════════════════                                             │
│                                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  External    │────►│   Message    │────►│   Worker     │────►│   Database   │   │
│  │   System     │     │    Queue     │     │   Service    │     │              │   │
│  │  (Webhook)   │     │   (Redis)    │     │              │     │              │   │
│  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘   │
│                                                                                      │
│  Use for:                                                                           │
│  • Large data syncs                                                                 │
│  • Non-critical updates                                                             │
│  • Decoupled processing                                                             │
│                                                                                      │
│  PATTERN 3: Change Data Capture (CDC)                                               │
│  ════════════════════════════════════                                               │
│                                                                                      │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  Salesforce  │────►│   Fivetran   │────►│  Snowflake   │────►│   Aether     │   │
│  │     (CRM)    │ CDC │    (ETL)     │     │   (Staging)  │     │   (Sync)     │   │
│  └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘   │
│                                                                                      │
│  Use for:                                                                           │
│  • Database replication                                                             │
│  • Real-time analytics                                                              │
│  • Audit trail preservation                                                         │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Connector Architecture

```typescript
// Base Connector Interface
interface IExternalConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<HealthStatus>;
  sync(options: SyncOptions): Promise<SyncResult>;
}

// SAP Connector Implementation
@Injectable()
export class SAPConnector implements IExternalConnector {
  private client: SAPODataClient;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
    private readonly metrics: MetricsService,
  ) {}

  async connect(): Promise<void> {
    this.client = new SAPODataClient({
      baseUrl: this.config.get('SAP_BASE_URL'),
      auth: {
        type: 'oauth2',
        clientId: this.config.get('SAP_CLIENT_ID'),
        clientSecret: this.config.get('SAP_CLIENT_SECRET'),
      },
    });
  }

  async sync(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    try {
      // Fetch GL data
      const glData = await this.client.query('/sap/opu/odata/sap/GL_ACCOUNT_LINE_ITEMS');

      // Transform to internal format
      const transformed = this.transformGLData(glData);

      // Persist
      await this.persistFinancialData(transformed);

      const duration = Date.now() - startTime;
      this.metrics.recordSyncDuration('sap', duration);

      return {
        success: true,
        recordsProcessed: transformed.length,
        duration,
      };
    } catch (error) {
      this.logger.error('SAP sync failed', error);
      throw new IntegrationException('SAP_SYNC_FAILED', error);
    }
  }
}
```

---

## 9. AI/ML Architecture

### 9.1 AI System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              AI/ML ARCHITECTURE                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           AI SERVICE LAYER                                   │   │
│  │                                                                              │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │   │
│  │  │  Chat Service  │  │  RCA Service   │  │ Scenario Svc   │                │   │
│  │  │                │  │                │  │                │                │   │
│  │  │ • Query handling│  │ • Anomaly RCA  │  │ • Analysis gen │                │   │
│  │  │ • Streaming    │  │ • Action plans │  │ • Recommends   │                │   │
│  │  │ • History      │  │ • Citations    │  │                │                │   │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘                │   │
│  │          │                   │                   │                          │   │
│  │          └───────────────────┴───────────────────┘                          │   │
│  │                              │                                               │   │
│  │                              ▼                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                      RAG PIPELINE                                    │   │   │
│  │  │                                                                      │   │   │
│  │  │  1. Query         2. Retrieve         3. Augment        4. Generate │   │   │
│  │  │  ┌──────────┐    ┌──────────┐       ┌──────────┐      ┌──────────┐ │   │   │
│  │  │  │ Classify │───►│ Vector   │──────►│ Context  │─────►│ Gemini   │ │   │   │
│  │  │  │ Intent   │    │ Search   │       │ Builder  │      │ Generate │ │   │   │
│  │  │  └──────────┘    └──────────┘       └──────────┘      └──────────┘ │   │   │
│  │  │                        │                                            │   │   │
│  │  │                        ▼                                            │   │   │
│  │  │                 ┌──────────┐                                        │   │   │
│  │  │                 │ pgvector │                                        │   │   │
│  │  │                 │ (Embeds) │                                        │   │   │
│  │  │                 └──────────┘                                        │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                               │   │
│  │                              ▼                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    GEMINI CLIENT                                     │   │   │
│  │  │                                                                      │   │   │
│  │  │  • Model: gemini-2.5-flash                                          │   │   │
│  │  │  • Rate limiting: 30 req/min per user                               │   │   │
│  │  │  • Token tracking & cost allocation                                 │   │   │
│  │  │  • Response caching (5 min TTL)                                     │   │   │
│  │  │  • Fallback to cached responses on API failure                      │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                      ML MODELS (Custom)                                      │   │
│  │                                                                              │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │   │
│  │  │ Revenue        │  │ Anomaly        │  │ Churn          │                │   │
│  │  │ Forecast Model │  │ Detection      │  │ Prediction     │                │   │
│  │  │                │  │ Model          │  │ Model          │                │   │
│  │  │ • ARIMA/Prophet│  │ • Isolation    │  │ • XGBoost      │                │   │
│  │  │ • Ensemble     │  │   Forest       │  │ • LSTM         │                │   │
│  │  │ • Confidence   │  │ • Statistical  │  │ • Features     │                │   │
│  │  │   intervals    │  │   methods      │  │   engineering  │                │   │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘                │   │
│  │          │                   │                   │                          │   │
│  │          └───────────────────┴───────────────────┘                          │   │
│  │                              │                                               │   │
│  │                              ▼                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    ML PLATFORM                                       │   │   │
│  │  │                                                                      │   │   │
│  │  │  • Model Registry (MLflow/Vertex AI)                                │   │   │
│  │  │  • Feature Store                                                    │   │   │
│  │  │  • Training Pipeline                                                │   │   │
│  │  │  • Model Serving (Kubernetes)                                       │   │   │
│  │  │  • A/B Testing                                                      │   │   │
│  │  │  • Monitoring & Drift Detection                                     │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Prompt Engineering Strategy

```typescript
// Prompt Template Structure
interface PromptTemplate {
  systemInstruction: string;
  contextSlots: string[];
  outputFormat: 'text' | 'json' | 'markdown';
  maxTokens: number;
  temperature: number;
}

// Financial Insight Prompt
export const FINANCIAL_INSIGHT_PROMPT: PromptTemplate = {
  systemInstruction: `
You are Project Aether's Intelligent Core, an advanced autonomous FP&A agent.
Your goal is to assist finance executives with strategic decision-making.

CONTEXT:
- You have access to real-time financial data from the organization
- You should cite specific numbers and dates from the provided context
- Keep responses concise, professional, and data-driven
- If data is missing, acknowledge the limitation

GUIDELINES:
1. Start with the key insight or recommendation
2. Support with specific data points
3. Highlight risks or caveats
4. Suggest actionable next steps when appropriate
  `,
  contextSlots: ['currentMetrics', 'historicalTrends', 'anomalies', 'forecasts'],
  outputFormat: 'text',
  maxTokens: 500,
  temperature: 0.3,
};

// RCA Prompt
export const RCA_PROMPT: PromptTemplate = {
  systemInstruction: `
Perform a root cause analysis for the following financial anomaly.

STRUCTURE YOUR RESPONSE:
1. **Business Context**: Brief explanation of the metric and its importance
2. **Root Cause**: The primary driver behind the anomaly
3. **Contributing Factors**: Secondary factors if applicable
4. **Impact Assessment**: Quantified business impact
5. **Recommended Actions**: 2-3 specific steps to address

Keep the analysis under 150 words. Use bullet points for clarity.
  `,
  contextSlots: ['anomalyDetails', 'relatedMetrics', 'historicalContext'],
  outputFormat: 'markdown',
  maxTokens: 300,
  temperature: 0.2,
};
```

---

## 10. Security Architecture

### 10.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  LAYER 1: PERIMETER SECURITY                                                        │
│  ════════════════════════════                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  • WAF (Web Application Firewall)                                           │   │
│  │  • DDoS Protection (CloudFlare/AWS Shield)                                  │   │
│  │  • IP Whitelisting (Admin endpoints)                                        │   │
│  │  • TLS 1.3 Everywhere                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  LAYER 2: APPLICATION SECURITY                                                      │
│  ═════════════════════════════                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  • Authentication (OAuth 2.0 / SAML 2.0)                                    │   │
│  │  • Authorization (RBAC with permissions)                                    │   │
│  │  • Input Validation (class-validator)                                       │   │
│  │  • Output Encoding (XSS prevention)                                         │   │
│  │  • CSRF Protection (Double-submit cookies)                                  │   │
│  │  • Rate Limiting (Per user, per endpoint)                                   │   │
│  │  • Security Headers (Helmet.js)                                             │   │
│  │    - Content-Security-Policy                                                │   │
│  │    - X-Content-Type-Options                                                 │   │
│  │    - X-Frame-Options                                                        │   │
│  │    - Strict-Transport-Security                                              │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  LAYER 3: DATA SECURITY                                                             │
│  ══════════════════════                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  • Encryption at Rest (AES-256)                                             │   │
│  │  • Encryption in Transit (TLS 1.3)                                          │   │
│  │  • Field-Level Encryption (PII data)                                        │   │
│  │  • Database Connection Encryption                                           │   │
│  │  • Key Management (AWS KMS / Azure Key Vault)                               │   │
│  │  • Data Masking (Non-production environments)                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  LAYER 4: INFRASTRUCTURE SECURITY                                                   │
│  ════════════════════════════════                                                   │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  • Network Segmentation (VPC, Subnets)                                      │   │
│  │  • Kubernetes Network Policies                                              │   │
│  │  • Pod Security Policies                                                    │   │
│  │  • Secrets Management (HashiCorp Vault)                                     │   │
│  │  • Container Scanning (Trivy/Snyk)                                          │   │
│  │  • Infrastructure as Code Security (Checkov)                                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  LAYER 5: MONITORING & RESPONSE                                                     │
│  ════════════════════════════                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │  • Security Information and Event Management (SIEM)                         │   │
│  │  • Intrusion Detection System (IDS)                                         │   │
│  │  • Vulnerability Scanning (Weekly)                                          │   │
│  │  • Penetration Testing (Quarterly)                                          │   │
│  │  • Incident Response Plan                                                   │   │
│  │  • Security Audit Logs (Immutable, 7-year retention)                        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW (SSO)                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────┐    1. Access App     ┌──────────────┐                                │
│  │   User   │───────────────────►  │   Frontend   │                                │
│  └──────────┘                      └───────┬──────┘                                │
│       ▲                                    │                                        │
│       │                                    │ 2. Redirect to IdP                     │
│       │                                    ▼                                        │
│       │                            ┌──────────────┐                                │
│       │                            │   Identity   │                                │
│       │                            │   Provider   │                                │
│       │                            │  (Okta/AAD)  │                                │
│       │                            └───────┬──────┘                                │
│       │                                    │                                        │
│       │    3. Authenticate                 │                                        │
│       └────────────────────────────────────┘                                        │
│                                    │                                                │
│                                    │ 4. SAML Assertion / OAuth Code                │
│                                    ▼                                                │
│                            ┌──────────────┐                                        │
│                            │   Frontend   │                                        │
│                            └───────┬──────┘                                        │
│                                    │                                                │
│                                    │ 5. Exchange for tokens                        │
│                                    ▼                                                │
│                            ┌──────────────┐                                        │
│                            │ Auth Service │                                        │
│                            └───────┬──────┘                                        │
│                                    │                                                │
│                                    │ 6. Validate assertion                         │
│                                    │ 7. Create/update user                         │
│                                    │ 8. Generate JWT tokens                        │
│                                    │                                                │
│                                    ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           TOKEN STRUCTURE                                    │   │
│  │                                                                              │   │
│  │  Access Token (JWT):                   Refresh Token (Opaque):              │   │
│  │  ┌──────────────────────────┐          ┌──────────────────────────┐        │   │
│  │  │ {                        │          │  Stored in Redis          │        │   │
│  │  │   sub: "user_123",       │          │  Key: refresh:{token_id}  │        │   │
│  │  │   org: "org_456",        │          │  TTL: 7 days              │        │   │
│  │  │   role: "CFO",           │          │  Value: {                 │        │   │
│  │  │   permissions: [...],    │          │    userId,                │        │   │
│  │  │   exp: 1709251200,       │          │    sessionId,             │        │   │
│  │  │   iat: 1709250300        │          │    deviceInfo             │        │   │
│  │  │ }                        │          │  }                        │        │   │
│  │  │ Expires: 15 minutes      │          │                           │        │   │
│  │  └──────────────────────────┘          └──────────────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Infrastructure Architecture

### 11.1 Cloud Architecture (GCP)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                       CLOUD ARCHITECTURE (GCP)                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                            GLOBAL TIER                                       │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │   │
│  │  │  Cloud CDN     │  │ Cloud Armor    │  │ Cloud DNS      │                │   │
│  │  │  (Static)      │  │ (WAF/DDoS)     │  │ (DNS)          │                │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                            │
│                                        ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         REGIONAL TIER (us-central1)                          │   │
│  │                                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     VPC NETWORK (10.0.0.0/16)                        │   │   │
│  │  │                                                                      │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                 PUBLIC SUBNET (10.0.1.0/24)                  │   │   │   │
│  │  │  │                                                              │   │   │   │
│  │  │  │  ┌────────────────────────────────────────────────────────┐ │   │   │   │
│  │  │  │  │           Cloud Load Balancer (HTTPS)                  │ │   │   │   │
│  │  │  │  │  • SSL Termination    • Health Checks                  │ │   │   │   │
│  │  │  │  └────────────────────────────────────────────────────────┘ │   │   │   │
│  │  │  └──────────────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                                      │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │               PRIVATE SUBNET (10.0.2.0/24)                   │   │   │   │
│  │  │  │                                                              │   │   │   │
│  │  │  │  ┌────────────────────────────────────────────────────────┐ │   │   │   │
│  │  │  │  │                  GKE CLUSTER                            │ │   │   │   │
│  │  │  │  │                                                         │ │   │   │   │
│  │  │  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │   │   │   │
│  │  │  │  │  │ frontend    │ │ core-api    │ │ ai-service  │      │ │   │   │   │
│  │  │  │  │  │ (2-4 pods)  │ │ (3-10 pods) │ │ (2-6 pods)  │      │ │   │   │   │
│  │  │  │  │  └─────────────┘ └─────────────┘ └─────────────┘      │ │   │   │   │
│  │  │  │  │                                                         │ │   │   │   │
│  │  │  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │   │   │   │
│  │  │  │  │  │ auth-service│ │ worker      │ │ integration │      │ │   │   │   │
│  │  │  │  │  │ (2-4 pods)  │ │ (2-8 pods)  │ │ (2-4 pods)  │      │ │   │   │   │
│  │  │  │  │  └─────────────┘ └─────────────┘ └─────────────┘      │ │   │   │   │
│  │  │  │  │                                                         │ │   │   │   │
│  │  │  │  │  Node Pools:                                           │ │   │   │   │
│  │  │  │  │  • default: n2-standard-4 (3-10 nodes)                 │ │   │   │   │
│  │  │  │  │  • high-mem: n2-highmem-8 (1-3 nodes)                  │ │   │   │   │
│  │  │  │  └────────────────────────────────────────────────────────┘ │   │   │   │
│  │  │  └──────────────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                                      │   │   │
│  │  │  ┌─────────────────────────────────────────────────────────────┐   │   │   │
│  │  │  │                DATA SUBNET (10.0.3.0/24)                     │   │   │   │
│  │  │  │                                                              │   │   │   │
│  │  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │   │   │   │
│  │  │  │  │ Cloud SQL   │ │ Memorystore │ │ Cloud       │           │   │   │   │
│  │  │  │  │ (PostgreSQL)│ │ (Redis)     │ │ Storage     │           │   │   │   │
│  │  │  │  │             │ │             │ │ (GCS)       │           │   │   │   │
│  │  │  │  │ HA: Regional│ │ HA: Cluster │ │             │           │   │   │   │
│  │  │  │  │ 8 vCPU/32GB │ │ 6GB         │ │             │           │   │   │   │
│  │  │  │  └─────────────┘ └─────────────┘ └─────────────┘           │   │   │   │
│  │  │  └──────────────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                                      │   │   │
│  │  └─────────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                              │   │
│  │  ┌────────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    EXTERNAL CONNECTIONS                             │    │   │
│  │  │                                                                     │    │   │
│  │  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │    │   │
│  │  │  │ Snowflake   │   │ Vertex AI   │   │ External    │              │    │   │
│  │  │  │ (Private    │   │ (Gemini)    │   │ APIs        │              │    │   │
│  │  │  │  Service    │   │             │   │ (SAP/SFDC)  │              │    │   │
│  │  │  │  Connect)   │   │             │   │             │              │    │   │
│  │  │  └─────────────┘   └─────────────┘   └─────────────┘              │    │   │
│  │  └────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Kubernetes Deployment

```yaml
# deployment.yaml - Core API Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: core-api
  namespace: aether
spec:
  replicas: 3
  selector:
    matchLabels:
      app: core-api
  template:
    metadata:
      labels:
        app: core-api
    spec:
      containers:
        - name: core-api
          image: gcr.io/project-aether/core-api:v1.0.0
          ports:
            - containerPort: 3000
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: aether-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: aether-secrets
                  key: redis-url
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: core-api-hpa
  namespace: aether
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: core-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

---

## 12. DevOps & CI/CD

### 12.1 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CI/CD PIPELINE                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                           CONTINUOUS INTEGRATION                             │   │
│  │                                                                              │   │
│  │  Push/PR                                                                     │   │
│  │     │                                                                        │   │
│  │     ▼                                                                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │
│  │  │  Lint    │─►│  Build   │─►│  Unit    │─►│  Integ   │─►│ Security │     │   │
│  │  │          │  │          │  │  Tests   │  │  Tests   │  │  Scan    │     │   │
│  │  │ ESLint   │  │ TypeScript│  │ Vitest   │  │ Jest     │  │ Snyk     │     │   │
│  │  │ Prettier │  │ Vite     │  │ 80% cov  │  │ Supertest│  │ Trivy    │     │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │   │
│  │                                                              │               │   │
│  │                                                              ▼               │   │
│  │                                                    ┌──────────────────┐     │   │
│  │                                                    │ Quality Gate     │     │   │
│  │                                                    │ • Coverage > 80% │     │   │
│  │                                                    │ • No critical    │     │   │
│  │                                                    │   vulnerabilities│     │   │
│  │                                                    │ • All tests pass │     │   │
│  │                                                    └────────┬─────────┘     │   │
│  └─────────────────────────────────────────────────────────────┼───────────────┘   │
│                                                                 │                   │
│  ┌─────────────────────────────────────────────────────────────┼───────────────┐   │
│  │                      CONTINUOUS DELIVERY                     │               │   │
│  │                                                              ▼               │   │
│  │                                                    ┌──────────────────┐     │   │
│  │                                                    │  Docker Build    │     │   │
│  │                                                    │  Push to GCR     │     │   │
│  │                                                    └────────┬─────────┘     │   │
│  │                                                              │               │   │
│  │     ┌────────────────────────────────────────────────────────┼─────────┐    │   │
│  │     │                                                        │         │    │   │
│  │     ▼                                                        ▼         │    │   │
│  │  ┌──────────────┐                                   ┌──────────────┐   │    │   │
│  │  │   STAGING    │                                   │  PRODUCTION  │   │    │   │
│  │  │              │                                   │              │   │    │   │
│  │  │ Auto-deploy  │                                   │ Manual gate  │   │    │   │
│  │  │ on merge to  │                                   │ or auto on   │   │    │   │
│  │  │ develop      │                                   │ merge to main│   │    │   │
│  │  │              │                                   │              │   │    │   │
│  │  │ ┌──────────┐ │  Promote                          │ ┌──────────┐ │   │    │   │
│  │  │ │ E2E Tests│ │─────────►Approval────────────────►│ │ Canary   │ │   │    │   │
│  │  │ │Playwright│ │                                   │ │ 10%→50%  │ │   │    │   │
│  │  │ └──────────┘ │                                   │ │ →100%    │ │   │    │   │
│  │  └──────────────┘                                   │ └──────────┘ │   │    │   │
│  │                                                     └──────────────┘   │    │   │
│  └────────────────────────────────────────────────────────────────────────┘    │   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20.x'
  GCP_PROJECT: 'project-aether-prod'
  GKE_CLUSTER: 'aether-cluster'
  GKE_ZONE: 'us-central1-a'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'

  build-and-push:
    needs: [lint-and-test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4

      - name: Setup Google Cloud
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ env.GCP_PROJECT }}

      - name: Configure Docker
        run: gcloud auth configure-docker

      - name: Build and push
        run: |
          docker build -t gcr.io/$GCP_PROJECT/core-api:$GITHUB_SHA .
          docker push gcr.io/$GCP_PROJECT/core-api:$GITHUB_SHA

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          gcloud container clusters get-credentials $GKE_CLUSTER --zone $GKE_ZONE
          kubectl set image deployment/core-api core-api=gcr.io/$GCP_PROJECT/core-api:$GITHUB_SHA -n staging

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production (Canary)
        run: |
          gcloud container clusters get-credentials $GKE_CLUSTER --zone $GKE_ZONE
          # Canary deployment - 10% traffic
          kubectl set image deployment/core-api-canary core-api=gcr.io/$GCP_PROJECT/core-api:$GITHUB_SHA -n production
```

---

## 13. Monitoring & Observability

### 13.1 Observability Stack

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          OBSERVABILITY ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                            METRICS                                           │   │
│  │                                                                              │   │
│  │  ┌────────────────┐      ┌────────────────┐      ┌────────────────┐        │   │
│  │  │  Application   │      │   Prometheus   │      │    Grafana     │        │   │
│  │  │  Metrics       │─────►│   (Collect)    │─────►│  (Visualize)   │        │   │
│  │  │                │      │                │      │                │        │   │
│  │  │ • Request rate │      │ • Time series  │      │ • Dashboards   │        │   │
│  │  │ • Latency      │      │ • Aggregation  │      │ • Alerts       │        │   │
│  │  │ • Error rate   │      │ • Storage      │      │ • SLO tracking │        │   │
│  │  │ • Business KPIs│      │                │      │                │        │   │
│  │  └────────────────┘      └────────────────┘      └────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                            LOGGING                                           │   │
│  │                                                                              │   │
│  │  ┌────────────────┐      ┌────────────────┐      ┌────────────────┐        │   │
│  │  │  Application   │      │  Elasticsearch │      │    Kibana      │        │   │
│  │  │  Logs          │─────►│  (Index)       │─────►│  (Search)      │        │   │
│  │  │                │      │                │      │                │        │   │
│  │  │ • Structured   │      │ • Full-text    │      │ • Log explorer │        │   │
│  │  │ • JSON format  │      │   search       │      │ • Dashboards   │        │   │
│  │  │ • Correlation  │      │ • Retention    │      │ • Alerts       │        │   │
│  │  │   IDs          │      │                │      │                │        │   │
│  │  └────────────────┘      └────────────────┘      └────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                            TRACING                                           │   │
│  │                                                                              │   │
│  │  ┌────────────────┐      ┌────────────────┐      ┌────────────────┐        │   │
│  │  │  OpenTelemetry │      │    Jaeger      │      │   Trace UI     │        │   │
│  │  │  SDK           │─────►│  (Collect)     │─────►│  (Visualize)   │        │   │
│  │  │                │      │                │      │                │        │   │
│  │  │ • Spans        │      │ • Distributed  │      │ • Service map  │        │   │
│  │  │ • Context      │      │   tracing      │      │ • Latency      │        │   │
│  │  │ • Propagation  │      │ • Dependencies │      │   analysis     │        │   │
│  │  └────────────────┘      └────────────────┘      └────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         ERROR TRACKING                                       │   │
│  │                                                                              │   │
│  │  ┌────────────────┐      ┌────────────────┐                                 │   │
│  │  │    Sentry      │      │   PagerDuty    │                                 │   │
│  │  │                │─────►│   (Alert)      │                                 │   │
│  │  │ • Capture      │      │                │                                 │   │
│  │  │ • Aggregate    │      │ • On-call      │                                 │   │
│  │  │ • Stack traces │      │ • Escalation   │                                 │   │
│  │  │ • User context │      │ • Incidents    │                                 │   │
│  │  └────────────────┘      └────────────────┘                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Key Metrics & SLOs

| Metric | Target | SLO | Alert Threshold |
|--------|--------|-----|-----------------|
| Availability | 99.9% | Monthly | < 99.5% |
| API Latency (P95) | 500ms | Daily | > 750ms |
| Error Rate | 0.1% | Hourly | > 1% |
| Page Load Time | 3s | Daily | > 5s |
| AI Response Time | 10s | Daily | > 15s |
| Database Query Time | 100ms | Hourly | > 200ms |

---

## 14. Disaster Recovery

### 14.1 Recovery Objectives

| Metric | Target | Strategy |
|--------|--------|----------|
| **RTO** (Recovery Time Objective) | < 1 hour | Automated failover |
| **RPO** (Recovery Point Objective) | < 15 minutes | Continuous backup |

### 14.2 Backup Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           BACKUP & RECOVERY STRATEGY                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  DATABASE BACKUP                                                                    │
│  ═══════════════                                                                    │
│  • Point-in-time recovery: Continuous WAL archiving                                │
│  • Full backup: Daily at 2 AM UTC                                                  │
│  • Retention: 30 days (daily), 12 months (weekly)                                  │
│  • Storage: Cross-region (us-central1 → us-east1)                                  │
│                                                                                      │
│  APPLICATION STATE                                                                  │
│  ═════════════════                                                                  │
│  • Redis: RDB snapshots every 15 minutes + AOF                                     │
│  • File storage: Cross-region replication (automatic)                              │
│                                                                                      │
│  DISASTER RECOVERY RUNBOOK                                                          │
│  ═════════════════════════                                                          │
│                                                                                      │
│  1. Detection (< 5 min)                                                            │
│     • Automated health checks fail                                                 │
│     • PagerDuty alert triggered                                                    │
│                                                                                      │
│  2. Assessment (< 10 min)                                                          │
│     • On-call engineer confirms outage                                             │
│     • Classify: Partial vs. Full outage                                            │
│                                                                                      │
│  3. Failover (< 30 min)                                                            │
│     • Promote read replica to primary (if DB failure)                              │
│     • Switch DNS to DR region (if regional failure)                                │
│     • Scale up DR infrastructure                                                   │
│                                                                                      │
│  4. Validation (< 15 min)                                                          │
│     • Run smoke tests                                                              │
│     • Verify data integrity                                                        │
│     • Confirm integrations operational                                             │
│                                                                                      │
│  5. Communication                                                                   │
│     • Update status page                                                           │
│     • Notify stakeholders                                                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Architecture Decision Records

### ADR-001: NestJS for Backend Framework

**Status:** Accepted
**Date:** 2026-01-15

**Context:**
We need to choose a backend framework for the enterprise FP&A platform.

**Options Considered:**
1. Express.js (minimal, flexible)
2. NestJS (structured, enterprise patterns)
3. Fastify (performance-focused)

**Decision:**
NestJS was selected for the following reasons:
- TypeScript-first with excellent type safety
- Built-in support for dependency injection
- Modular architecture aligns with DDD
- Strong ecosystem (Prisma, Passport, etc.)
- Comprehensive documentation and community

**Consequences:**
- Steeper learning curve for developers unfamiliar with Angular patterns
- More boilerplate compared to Express
- Better long-term maintainability

---

### ADR-002: Zustand for Frontend State Management

**Status:** Accepted
**Date:** 2026-01-15

**Context:**
We need a state management solution for the React frontend.

**Options Considered:**
1. Redux Toolkit (industry standard)
2. Zustand (lightweight, simple)
3. MobX (reactive)
4. React Context (built-in)

**Decision:**
Zustand was selected because:
- Minimal boilerplate
- TypeScript-native
- No providers needed
- Easy to test
- Works well with React Query for server state

**Consequences:**
- Less opinionated than Redux
- Need to establish patterns for consistency
- Smaller community compared to Redux

---

### ADR-003: PostgreSQL with pgvector for Vector Search

**Status:** Accepted
**Date:** 2026-01-15

**Context:**
We need vector search capability for RAG pipeline without adding complexity.

**Options Considered:**
1. Pinecone (managed vector DB)
2. Weaviate (self-hosted vector DB)
3. pgvector (PostgreSQL extension)

**Decision:**
pgvector was selected because:
- Simplifies architecture (one database)
- Cost-effective
- Sufficient performance for our scale
- Familiar PostgreSQL operations

**Consequences:**
- May need to migrate if scale exceeds PostgreSQL capabilities
- Less specialized features than dedicated vector DBs
- Reduced operational complexity

---

*This document is a living architecture guide and will be updated as the system evolves.*
