# Project Aether - Administration Guide
## Enterprise Autonomous FP&A Platform
### Version 2.1 | February 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Azure Infrastructure](#3-azure-infrastructure)
4. [Access & Authentication](#4-access--authentication)
5. [Application URLs](#5-application-urls)
6. [Module Guide](#6-module-guide)
7. [Database Management](#7-database-management)
8. [Deployment Guide](#8-deployment-guide)
9. [Data Import](#9-data-import)
10. [Monitoring & Logging](#10-monitoring--logging)
11. [Troubleshooting](#11-troubleshooting)
12. [Security](#12-security)
13. [Appendix](#appendix)

---

## 1. System Overview

### 1.1 What is Project Aether?

Project Aether is an Enterprise Autonomous FP&A (Financial Planning & Analysis) Platform that leverages AI to provide:

- **Real-time Financial Dashboards** - Executive KPIs, revenue tracking, cost analysis
- **AI-Powered Insights** - Natural language queries with Google Gemini integration
- **Scenario Planning** - What-if analysis and forecasting
- **Sales Pipeline Analytics** - Deal tracking, win probability, revenue forecasting
- **ARR Analytics** - ARR tracking, customer movements, retention metrics
- **Cost Intelligence** - Vendor management, spend analysis, optimization recommendations
- **Governance & Compliance** - Audit trails, approval workflows, data lineage

### 1.2 Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Zustand, Recharts |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | Azure PostgreSQL Flexible Server |
| Cache | Azure Redis Cache |
| AI Engine | Google Gemini 2.5 Pro |
| Container Registry | Azure Container Registry |
| Hosting | Azure App Service (Linux containers) |
| Monitoring | Azure Application Insights |

### 1.3 Key Features (v2.1)

| Feature | Description |
|---------|-------------|
| **Sortable Tables** | All data tables support column sorting with ascending/descending options |
| **Filter Popups** | Click column headers to access filter options for each column |
| **Export Functionality** | Export any chart or table to CSV format |
| **Floating Waterfall Charts** | Visual representation of value changes (Pipeline Movement, ARR Bridge) |
| **Quarterly Filters** | Group data by quarters with expandable month-level detail |
| **Risk Analytics** | Comprehensive risk identification and tracking |
| **Real-time KPIs** | Live metrics updated with current actuals and forecasts |

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Virtual Network                        │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │   │
│  │   │  Frontend   │    │   Backend   │    │  Database  │  │   │
│  │   │  App Service│───▶│  App Service│───▶│ PostgreSQL │  │   │
│  │   │  (nginx)    │    │  (NestJS)   │    │ (Private)  │  │   │
│  │   └─────────────┘    └─────────────┘    └────────────┘  │   │
│  │         │                   │                  │         │   │
│  │         │            ┌──────┴──────┐          │         │   │
│  │         │            │ Redis Cache │          │         │   │
│  │         │            │  (Private)  │          │         │   │
│  │         │            └─────────────┘          │         │   │
│  └─────────│────────────────────────────────────│─────────┘   │
│            │                                     │              │
│  ┌─────────▼─────────┐              ┌───────────▼───────────┐ │
│  │ Container Registry│              │  Application Insights  │ │
│  │       (ACR)       │              │      (Monitoring)      │ │
│  └───────────────────┘              └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Network Security

- **VNet Integration**: All backend services are integrated with Azure VNet
- **Private Endpoints**: PostgreSQL and Redis are only accessible within the VNet
- **No Public Access**: Database has no public IP address
- **SSL/TLS**: All connections use encrypted transport

---

## 3. Azure Infrastructure

### 3.1 Resource Group

| Property | Value |
|----------|-------|
| Resource Group | `aether-dev-rg` |
| Location | West US 2 |
| Subscription | GEP Azure Subscription |

### 3.2 Resources

| Resource | Type | Name |
|----------|------|------|
| Frontend | App Service | `aether-dev-web-04w9l0` |
| Backend | App Service | `aether-dev-api-04w9l0` |
| Database | PostgreSQL Flexible | `aether-dev-psql-04w9l0` |
| Redis | Azure Cache | `aether-dev-redis-04w9l0` |
| Container Registry | ACR | `aetherdevacr04w9l0` |
| Virtual Network | VNet | `aether-dev-vnet` |
| App Insights | Monitoring | `aether-dev-insights` |

### 3.3 Database Configuration

| Property | Value |
|----------|-------|
| Server | `aether-dev-psql-04w9l0.postgres.database.azure.com` |
| Database | `aether_db` |
| Admin User | `aether_admin` |
| Version | PostgreSQL 16 |
| SKU | Burstable B1ms |
| Storage | 32 GB |
| Access | Private VNet only |

### 3.4 Redis Configuration

| Property | Value |
|----------|-------|
| Host | `aether-dev-redis-04w9l0.redis.cache.windows.net` |
| Port | 6380 (SSL) |
| SKU | Basic C0 |
| TLS | Required |

---

## 4. Access & Authentication

### 4.1 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | admin@demo.com | Demo@2024 |
| Analyst | analyst@demo.com | Demo@2024 |

### 4.2 User Roles & Permissions

**Administrator Role:**
- dashboard:view, dashboard:edit
- scenarios:view, scenarios:create, scenarios:edit, scenarios:delete
- users:view, users:manage
- settings:view, settings:edit
- ai:use

**Analyst Role:**
- dashboard:view
- scenarios:view, scenarios:create
- ai:use

### 4.3 Authentication Flow

1. User submits email/password to `/api/v1/auth/login`
2. Backend validates credentials against PostgreSQL
3. JWT access token (1 hour) and refresh token (7 days) returned
4. Frontend stores tokens in Zustand store (persisted to localStorage)
5. All API requests include `Authorization: Bearer <token>` header
6. Token refresh happens automatically before expiration

### 4.4 JWT Configuration

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Access Token Expiry | 1 hour |
| Refresh Token Expiry | 7 days |
| Secret | Stored in Azure App Settings |

---

## 5. Application URLs

### 5.1 Production URLs

| Application | URL |
|-------------|-----|
| **Frontend** | https://aether-dev-web-04w9l0.azurewebsites.net |
| **Backend API** | https://aether-dev-api-04w9l0.azurewebsites.net |
| **API Documentation** | https://aether-dev-api-04w9l0.azurewebsites.net/docs |
| **Health Check** | https://aether-dev-api-04w9l0.azurewebsites.net/v1/health |

### 5.2 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | User authentication |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/logout` | POST | Invalidate tokens |
| `/api/v1/auth/me` | GET | Get current user |
| `/api/v1/dashboard/*` | GET | Dashboard metrics |
| `/api/v1/scenarios/*` | CRUD | Scenario planning |
| `/api/v1/ai/chat` | POST | AI assistant |
| `/api/v1/import/*` | POST | Data import |
| `/v1/health` | GET | Health check |

---

## 6. Module Guide

### 6.1 Dashboard

The Executive Dashboard provides a comprehensive overview of company performance:

**Key Features:**
- **KPI Cards**: Revenue, Costs, Profit Margin, ARR, Customer Count
- **Revenue vs Cost Trend**: Time-series comparison chart
- **Rule of 40 Analysis**: Scatter plot comparing your company against competitors (SAP Ariba, Accenture, IBM, FTI Consulting, Oracle, Manhattan Associates, WNS, Genpact, Kinaxis, Blue Yonder)
- **Risk Indicators**: AI-identified risks with severity levels
- **Export Report**: Download dashboard data as CSV

**Navigation:**
- Click "View All Risks" to navigate to detailed risk reports

### 6.2 Sales Performance

Comprehensive sales pipeline and performance analytics:

**Tabs:**
1. **Pipeline Overview** - Visual pipeline by stage with deal values
2. **Rep Performance** - Individual sales rep metrics and rankings
3. **Quota Attainment** - Target vs actual performance tracking
4. **Forecast** - AI-powered revenue forecasting

**Key Features:**
- **KPI Tiles** (in order): Closed ACV (YTD), Forecast ACV, Gap to Target, Conversion Rate, Sales Velocity
- **Quarterly Filters**: Q1, Q2, Q3, Q4 with expandable month selection
- **Floating Waterfall Chart**: Pipeline Movement visualization showing Starting Pipeline → New Deals → Increased → Decreased → Lost → Closed Won → Ending Pipeline
- **Sortable Tables**: Click any column header to sort or filter
- **Export**: Download any chart or table as CSV

**Column Definitions (Quota Attainment Tab):**
- Rep Name: Sales representative name
- Territory: Assigned region
- YTD ATT: Year-to-date attainment percentage
- Forecast ATT: Projected full-year attainment
- Closed ACV: Actual closed annual contract value
- Target: Annual quota target
- Pipeline: Current qualified pipeline value
- Win Rate: Historical deal conversion rate

### 6.3 ARR Analytics (formerly Revenue Analytics)

Annual Recurring Revenue tracking and customer movement analysis:

**Tabs:**
1. **ARR Overview** - Current ARR, growth trends, customer metrics
2. **Customer Movements** - New, expansion, contraction, churn tracking
3. **Retention** - Logo and revenue retention metrics
4. **Cohort Analysis** - Customer behavior by cohort

**Key Features:**
- **ARR Bridge Waterfall Chart**: Floating waterfall showing Starting ARR → New Business → Expansion → Contraction → Churn → Ending ARR
- **Sortable Customer Tables**: Sort by any metric
- **Export Functionality**: Download ARR data as CSV
- **Trend Analysis**: Historical ARR growth visualization

### 6.4 Cost Intelligence

Spend analysis and vendor management:

**Features:**
- Cost breakdown by category
- Vendor spend analysis
- Budget vs actual tracking
- Cost optimization recommendations

### 6.5 Scenario Planning

What-if analysis and forecasting:

**Features:**
- Create and compare scenarios
- Adjust revenue, cost, and growth assumptions
- AI-powered forecast generation
- Scenario comparison charts

### 6.6 AI Assistant

Natural language queries powered by Google Gemini:

**Capabilities:**
- Ask questions about financial data
- Generate reports and summaries
- Get recommendations and insights
- Natural language to SQL translation

---

## 7. Database Management

### 7.1 Schema Overview

The database uses Prisma ORM with the following main entities:

**Core Entities:**
- `tenants` - Multi-tenant organization support
- `users` - User accounts
- `roles` / `permissions` - RBAC
- `user_roles` / `role_permissions` - Many-to-many relations

**Financial Data:**
- `financial_metrics` - Revenue, costs, KPIs
- `costs` - Detailed cost records
- `cost_centers` - Cost allocation hierarchy
- `vendors` - Vendor management

**Sales Data:**
- `deals` - Sales pipeline
- `deal_stage_history` - Stage transitions
- `deal_notes` - Deal annotations

**Planning:**
- `scenarios` - What-if scenarios
- `scenario_assumptions` - Scenario parameters
- `forecasts` - AI-generated forecasts

### 7.2 Running Migrations

Migrations run automatically on container startup via the entrypoint script:

```bash
# In docker-entrypoint.sh
npx prisma migrate deploy
```

To create new migrations (requires database access):
```bash
npx prisma migrate dev --name <migration_name>
```

### 7.3 Database Seeding

The seed runs automatically on startup. To manually trigger:

```bash
# Call the seed endpoint (creates demo users)
curl -X POST https://aether-dev-api-04w9l0.azurewebsites.net/api/v1/auth/seed
```

---

## 8. Deployment Guide

### 8.1 Prerequisites

- Azure CLI installed and authenticated
- Docker Desktop installed
- Node.js 20+ installed
- Access to Azure Container Registry

### 8.2 Backend Deployment

```bash
# 1. Navigate to backend directory
cd project-aether---autonomous-fp&a/backend

# 2. Login to Azure Container Registry
az acr login --name aetherdevacr04w9l0

# 3. Build Docker image
docker build -t aetherdevacr04w9l0.azurecr.io/aether-backend:latest .

# 4. Push to ACR
docker push aetherdevacr04w9l0.azurecr.io/aether-backend:latest

# 5. Restart App Service to pull new image
az webapp stop --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
az webapp start --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
```

### 8.3 Frontend Deployment

```bash
# 1. Navigate to frontend directory
cd project-aether---autonomous-fp&a/frontend

# 2. Login to Azure Container Registry
az acr login --name aetherdevacr04w9l0

# 3. Build Docker image
docker build -t aetherdevacr04w9l0.azurecr.io/aether-frontend:latest .

# 4. Push to ACR
docker push aetherdevacr04w9l0.azurecr.io/aether-frontend:latest

# 5. Restart App Service
az webapp stop --name aether-dev-web-04w9l0 --resource-group aether-dev-rg
az webapp start --name aether-dev-web-04w9l0 --resource-group aether-dev-rg
```

### 8.4 Environment Variables

**Backend App Service Settings:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Access token expiry (e.g., "1h") |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g., "7d") |
| `GEMINI_API_KEY` | Google Gemini API key |
| `CORS_ORIGINS` | Allowed CORS origins |
| `NODE_ENV` | Environment (development/production) |
| `PORT` | Application port (3001) |
| `WEBSITE_VNET_ROUTE_ALL` | Enable VNet routing (1) |

**Frontend App Service Settings:**

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Backend API URL |
| `WEBSITES_PORT` | Nginx port (80) |

---

## 9. Data Import

### 9.1 Supported Import Formats

- **CSV** - Comma-separated values
- **Excel** - .xlsx files
- **JSON** - Structured JSON arrays

### 9.2 Import Templates

Data templates are provided in the `/docs/templates/` directory:

| Template | Description | Key Fields |
|----------|-------------|------------|
| `financial_metrics_template.csv` | Revenue, costs, KPIs | metric_type, value, period_start, period_end, is_actual |
| `costs_template.csv` | Detailed cost records | category, subcategory, vendor_name, amount, period_date |
| `deals_template.csv` | Sales pipeline data | name, account_name, amount, stage, probability, close_date |
| `vendors_template.csv` | Vendor information | vendor_name, category, contract_start_date, annual_spend |
| `cost_centers_template.csv` | Cost center hierarchy | cost_center_name, department, budget_annual, manager_name |

### 9.3 Data Date Conventions

- **Actuals**: Data through the previous month (is_actual = true)
- **Forecasts**: Data from current month through end of 2026 (is_actual = false)
- **Period Format**: YYYY-MM-DD for all date fields

### 9.4 Import Process

1. Download the appropriate template
2. Fill in your historical data
3. Navigate to Settings > Data Import in the application
4. Upload the file
5. Map columns to database fields
6. Validate and import

### 9.5 API Import Endpoint

```bash
# POST /api/v1/import/upload
curl -X POST \
  https://aether-dev-api-04w9l0.azurewebsites.net/api/v1/import/upload \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@data.csv" \
  -F "type=financial_metrics"
```

---

## 10. Monitoring & Logging

### 10.1 Health Checks

**Backend Health Endpoint:**
```bash
curl https://aether-dev-api-04w9l0.azurewebsites.net/v1/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-05T19:05:25.637Z",
    "version": "2.1.0",
    "checks": {
      "database": "healthy",
      "memory": "healthy"
    }
  }
}
```

### 10.2 Application Insights

- **Connection String**: Configured in App Service settings
- **Dashboard**: Azure Portal > Application Insights > aether-dev-insights
- **Metrics**: Request rate, response time, failure rate, dependencies

### 10.3 Container Logs

```bash
# View real-time logs
az webapp log tail --name aether-dev-api-04w9l0 --resource-group aether-dev-rg

# Download logs
az webapp log download --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
```

### 10.4 Prometheus Metrics

```bash
# Prometheus format
curl https://aether-dev-api-04w9l0.azurewebsites.net/v1/metrics

# JSON format
curl https://aether-dev-api-04w9l0.azurewebsites.net/v1/metrics/json
```

---

## 11. Troubleshooting

### 11.1 Common Issues

**Issue: Frontend shows loading spinner indefinitely**
- **Cause**: Zustand hydration not completing
- **Solution**: Clear browser localStorage and refresh

**Issue: 502 Bad Gateway on API calls**
- **Cause**: Backend container not started
- **Solution**: Wait 2-3 minutes for container startup, or restart App Service

**Issue: 500 Internal Server Error on login**
- **Cause**: Database migrations not applied or user doesn't exist
- **Solution**:
  1. Check health endpoint for database status
  2. Call seed endpoint: `POST /api/v1/auth/seed`

**Issue: Cannot connect to database locally**
- **Cause**: Database is on private VNet
- **Solution**: Database can only be accessed from Azure App Services within the VNet

**Issue: Tables not sorting correctly**
- **Cause**: Browser cache with old JavaScript
- **Solution**: Hard refresh (Ctrl+Shift+R) or clear browser cache

**Issue: Export not working**
- **Cause**: Pop-up blocker preventing download
- **Solution**: Allow pop-ups for the application domain

### 11.2 Restart Services

```bash
# Restart backend
az webapp restart --name aether-dev-api-04w9l0 --resource-group aether-dev-rg

# Restart frontend
az webapp restart --name aether-dev-web-04w9l0 --resource-group aether-dev-rg

# Force new container pull (stop/start)
az webapp stop --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
az webapp start --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
```

### 11.3 Check Container Status

```bash
# Check if container is running
az webapp show --name aether-dev-api-04w9l0 --resource-group aether-dev-rg --query "state"

# Check container settings
az webapp config container show --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
```

---

## 12. Security

### 12.1 Security Features

- **HTTPS Only**: All traffic encrypted with TLS
- **JWT Authentication**: Stateless, secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configured allowed origins
- **Helmet.js**: Security headers (XSS, CSP, etc.)
- **Rate Limiting**: Throttling on API endpoints
- **Input Validation**: class-validator on all DTOs

### 12.2 Security Headers

The backend applies these security headers via Helmet:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 0` (modern browsers use CSP)
- `Strict-Transport-Security: max-age=15552000`
- `Content-Security-Policy: default-src 'self'`

### 12.3 Secrets Management

All secrets are stored in Azure App Service Application Settings:
- Never commit secrets to source control
- Rotate JWT_SECRET periodically
- Use Azure Key Vault for production secrets

---

## Appendix

### A. CLI Commands Quick Reference

```bash
# Azure Login
az login

# ACR Login
az acr login --name aetherdevacr04w9l0

# List App Settings
az webapp config appsettings list --name aether-dev-api-04w9l0 --resource-group aether-dev-rg

# Set App Setting
az webapp config appsettings set --name aether-dev-api-04w9l0 --resource-group aether-dev-rg --settings KEY=VALUE

# View Logs
az webapp log tail --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
```

### B. Docker Commands

```bash
# Build image
docker build -t aetherdevacr04w9l0.azurecr.io/aether-backend:latest .

# Push image
docker push aetherdevacr04w9l0.azurecr.io/aether-backend:latest

# Run locally (won't connect to Azure DB)
docker run -p 3001:3001 -e DATABASE_URL="..." aetherdevacr04w9l0.azurecr.io/aether-backend:latest
```

### C. Feature Reference

| Feature | Module | Description |
|---------|--------|-------------|
| Sortable Tables | All | Click column headers to sort ascending/descending |
| Filter Popups | All | Click column headers for filter options |
| CSV Export | All | Download table data as CSV |
| Chart Export | All | Download charts as CSV |
| Floating Waterfall | Sales, ARR | Visual representation of value changes |
| Quarterly Filters | Sales | Q1-Q4 grouping with expandable months |
| Risk Analytics | Dashboard, Reports | AI-identified risk tracking |

### D. Support Contacts

| Role | Contact |
|------|---------|
| Platform Admin | admin@gep.com |
| Azure Support | Azure Portal Support |
| Development Team | dev-team@gep.com |

---

**Document Version**: 2.1
**Last Updated**: February 5, 2026
**Author**: GEP FP&A Platform Team
