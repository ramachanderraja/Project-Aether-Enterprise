# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Project Aether is an Enterprise Autonomous FP&A (Financial Planning & Analysis) Platform. It's a full-stack TypeScript application with a React frontend and NestJS backend, deployed on Azure App Service with Docker containers.

## Common Commands

### Backend (from `/backend`)
```bash
npm run start:dev          # Start dev server with hot reload
npm run build              # Build for production
npm run test               # Run Jest unit tests
npm run test:e2e           # Run E2E tests
npm run lint               # Lint and fix

# Database
npx prisma migrate dev --name <name>  # Create new migration
npx prisma migrate deploy             # Apply migrations (production)
npx prisma generate                   # Regenerate Prisma client
npx prisma studio                     # Open database GUI
npx prisma db seed                    # Seed database
npm run db:reset                      # Reset database (Prisma reset)

# Data Import
npm run import:historical  # Import historical financial data
npm run import:validate    # Validate imported data
```

### Frontend (from `/frontend`)
```bash
npm run dev                # Start Vite dev server
npm run build              # Build (runs tsc then vite build)
npm run test               # Run Vitest tests
npm run test:coverage      # Run tests with coverage
npm run test:e2e           # Run Playwright E2E tests
npm run lint               # Lint code
npm run lint:fix           # Lint and auto-fix
npm run typecheck          # TypeScript type checking
```

### Local Development with Docker Compose
```bash
docker-compose up -d                  # Start all services (postgres, redis, backend, frontend)
docker-compose -f docker-compose.dev.yml up  # Start with dev overrides (hot reload, volume mounts)
docker-compose down                   # Stop all services
```

### Docker Deployment (to Azure)
```bash
# Login to Azure Container Registry
az acr login --name aetherdevacr04w9l0

# Backend
cd backend
docker build -t aetherdevacr04w9l0.azurecr.io/aether-backend:latest .
docker push aetherdevacr04w9l0.azurecr.io/aether-backend:latest
az webapp restart --name aether-dev-api-04w9l0 --resource-group aether-dev-rg

# Frontend
cd frontend
docker build -t aetherdevacr04w9l0.azurecr.io/aether-frontend:latest .
docker push aetherdevacr04w9l0.azurecr.io/aether-frontend:latest
az webapp restart --name aether-dev-web-04w9l0 --resource-group aether-dev-rg
```

## Architecture

### Monorepo Structure
- `/backend` - NestJS API with Prisma ORM
- `/frontend` - React SPA with Vite
- `/docs` - Architecture docs, PRD, API spec, user stories
- `/infrastructure` - Azure Terraform configs and deployment scripts
- `/data-templates` - CSV templates for data import (cost centers, vendors, deals, etc.)
- `/components` - Shared UI components (Sidebar, charts, views)
- `/services` - Shared services (e.g., `geminiService.ts`)

### Backend Module Pattern
Each feature is organized as a NestJS module under `/backend/src/modules/`:
- `auth/` - JWT authentication, login, MFA/2FA, OAuth/SSO support
- `dashboard/` - Executive KPIs and metrics
- `ai/` - Google Gemini integration for conversational analytics
- `sales/` - Pipeline tracking, deals, win probability
- `cost/` - Cost intelligence, vendor analysis
- `revenue/` - Revenue analytics and forecasting
- `scenarios/` - What-if analysis, Monte Carlo simulations
- `governance/` - Audit trails, approval workflows
- `data-fabric/` - Data sources, connections
- `integrations/` - External system connectors (SAP, Salesforce, etc.)
- `import/` - CSV/Excel data import
- `users/` - User management
- `health/` - Health check endpoints
- `gtm/` - Go-to-market analytics
- `intelligence/` - Business intelligence
- `marketing/` - Marketing analytics
- `reports/` - Report generation
- `training/` - Training content and onboarding

Backend infrastructure directories:
- `/backend/src/config/` - Configuration, environment validation, Redis module
- `/backend/src/database/` - Prisma service and module
- `/backend/src/common/` - Filters, interceptors, logger, metrics

### Frontend Module Pattern
Each feature under `/frontend/src/modules/` contains:
- `pages/` - Route components (e.g., `DashboardPage.tsx`)
- `components/` - Feature-specific components
- `store/` - Zustand stores (where applicable)
- `services/` - API service functions

Frontend modules: `ai-agent`, `auth`, `cost`, `dashboard`, `data-fabric`, `governance`, `gtm`, `integrations`, `intelligence`, `marketing`, `reports`, `revenue`, `sales`, `scenarios`, `settings`, `training`

Key frontend directories:
- `/frontend/src/shared/` - Shared components, layouts, services, utilities
- `/frontend/src/app/` - App configuration and routing
- `/frontend/src/styles/` - Global styles

#### Vite Path Aliases
Configured in both `vite.config.ts` and `vitest.config.ts`:
- `@` → `src/`
- `@modules` → `src/modules/`
- `@shared` → `src/shared/`
- `@types` → `src/types/`

### API Versioning
Backend uses URI versioning. All endpoints are prefixed with `/api/v1/`:
- Global prefix: `api` (set in main.ts)
- Version prefix: `v` (creates `/api/v1/...` paths)
- Default version: `1`
- Health endpoints excluded from prefix: `/health`, `/metrics`

### Authentication Flow
1. User POSTs to `/api/v1/auth/login` with email/password
2. Backend validates via bcrypt against PostgreSQL, returns JWT access + refresh tokens
3. JWT payload includes: `sub`, `email`, `tenant_id`, `roles`, `permissions`
4. Refresh token stored in database with hash and 7-day expiry
5. Frontend stores tokens in Zustand auth store (persisted to localStorage)
6. All API requests include `Authorization: Bearer <token>`
7. Token refresh via `/api/v1/auth/refresh`

MFA/2FA support:
- TOTP-based using `speakeasy` and `qrcode` libraries
- Backup codes generation for recovery
- Dedicated MFA module at `/backend/src/modules/auth/mfa/`

OAuth/SSO (configured, not fully integrated):
- Okta support via `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`
- Azure AD support via `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`

### Database
- PostgreSQL with Prisma ORM
- Schema at `/backend/prisma/schema.prisma`
- Migrations at `/backend/prisma/migrations/`
- Seed scripts: `seed.ts` (TypeScript dev), `seed.js` (production CommonJS), `seed-historical.ts` (historical data)
- Multi-tenant architecture with `Tenant` model
- Role-based access control: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`
- MFA fields on User: `mfaEnabled`, `mfaSecret`, `mfaBackupCodes`

### Data Import System
CSV templates in `/data-templates/` for importing:
- Cost centers, vendors, financial metrics, costs, deals, scenarios, anomalies
- Import via `npm run import:historical` (backend)
- Validate via `npm run import:validate` (backend)

## Azure Deployment

### Resources (aether-dev-rg)
| Resource | Name |
|----------|------|
| Frontend App Service | aether-dev-web-04w9l0 |
| Backend App Service | aether-dev-api-04w9l0 |
| PostgreSQL | aether-dev-psql-04w9l0 |
| Redis Cache | aether-dev-redis-04w9l0 |
| Container Registry | aetherdevacr04w9l0 |

### Infrastructure as Code
Terraform configs at `/infrastructure/azure/terraform/`:
- `main.tf` - Resource provisioning (App Service, PostgreSQL, Redis, Key Vault, ACR)
- `variables.tf` / `outputs.tf` - Input/output definitions
- `terraform.tfvars.example` - Example variable values

Deployment scripts at `/infrastructure/azure/`:
- `deploy.sh` (Bash) and `deploy.ps1` (PowerShell)

### URLs
- Frontend: https://aether-dev-web-04w9l0.azurewebsites.net
- Backend API: https://aether-dev-api-04w9l0.azurewebsites.net
- API Docs: https://aether-dev-api-04w9l0.azurewebsites.net/docs

### Demo Credentials
- Email: admin@demo.com
- Password: Demo@2024

## Key Technical Details

### Frontend Build Note
On Windows with paths containing spaces, use direct node invocation:
```bash
node ./node_modules/typescript/bin/tsc -b
node ./node_modules/vite/bin/vite.js build
```

### Backend Entry Point
- Docker entrypoint runs: `prisma migrate deploy` → `seed.js` → `node dist/src/main`
- Production seed uses CommonJS (`seed.js`), not TypeScript

### Docker Setup
- Backend: Multi-stage build (Node 20-slim), health check on `/health`
- Frontend: Multi-stage build (Node 20-alpine → Nginx alpine), `envsubst` for runtime `BACKEND_URL`
- docker-compose services: `postgres` (15-alpine), `redis` (7-alpine), `backend`, `frontend`
- Network: `aether-network` (bridge), Volumes: `postgres_data`, `redis_data`

### Environment Variables
Backend requires:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` - Redis connection
- `JWT_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` - Auth tokens
- `GEMINI_API_KEY` - Google Gemini API key
- `GEMINI_MODEL` (default: `gemini-2.5-pro`), `GEMINI_MAX_TOKENS` (default: 8192)
- `CORS_ORIGINS` - Allowed CORS origins
- `THROTTLE_TTL`, `THROTTLE_LIMIT` - Rate limiting config

Backend optional (OAuth/SSO):
- `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`, `OKTA_AUDIENCE`
- `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`

Frontend requires:
- `BACKEND_URL` (for nginx proxy)
- `VITE_API_URL` (for dev mode)

See `.env.example` at the project root for a template.

## Testing

### Backend
- Unit tests: Jest with `*.spec.ts` pattern
- E2E tests: Jest with separate config in `/test/jest-e2e.json`
- Coverage: `npm run test:cov`

### Frontend
- Unit tests: Vitest with React Testing Library (jsdom environment)
- Setup file: `src/test/setup.ts`
- E2E tests: Playwright
- Coverage: `npm run test:coverage` (reporters: text, json, html)

## CI/CD

GitHub Actions workflows in `/.github/workflows/`:
- `ci.yml` - Runs on PR/push to main/develop: lint, typecheck, tests, Docker build; E2E tests on main only
- `deploy.yml` - Deploys to staging on push to main; production on version tags (uses GitHub Container Registry)
- `azure-deploy.yml` - Azure-specific deployment: manual dispatch with environment selection, ACR integration, health checks, database migrations
