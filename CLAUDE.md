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
```

### Frontend (from `/frontend`)
```bash
npm run dev                # Start Vite dev server
npm run build              # Build (runs tsc then vite build)
npm run test               # Run Vitest tests
npm run test:coverage      # Run tests with coverage
npm run test:e2e           # Run Playwright E2E tests
npm run lint               # Lint code
npm run typecheck          # TypeScript type checking
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
- `/docs` - Architecture docs, PRD, user stories, data templates

### Backend Module Pattern
Each feature is organized as a NestJS module under `/backend/src/modules/`:
- `auth/` - JWT authentication, login, user validation
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

### Frontend Module Pattern
Each feature under `/frontend/src/modules/` contains:
- `pages/` - Route components (e.g., `DashboardPage.tsx`)
- `components/` - Feature-specific components

State management uses Zustand stores in `/frontend/src/shared/store/`.

### API Versioning
Backend uses URI versioning. All endpoints are prefixed with `/api/v1/`:
- Global prefix: `api` (set in main.ts)
- Version prefix: `v` (creates `/api/v1/...` paths)
- Health endpoints excluded from prefix: `/health`, `/metrics`

### Authentication Flow
1. User POSTs to `/api/v1/auth/login` with email/password
2. Backend validates against PostgreSQL, returns JWT access + refresh tokens
3. Frontend stores tokens in Zustand (persisted to localStorage)
4. All API requests include `Authorization: Bearer <token>`

### Database
- PostgreSQL with Prisma ORM
- Schema at `/backend/prisma/schema.prisma`
- Migrations at `/backend/prisma/migrations/`
- Seed scripts: `seed.ts` (TypeScript), `seed.js` (production CommonJS)

## Azure Deployment

### Resources (aether-dev-rg)
| Resource | Name |
|----------|------|
| Frontend App Service | aether-dev-web-04w9l0 |
| Backend App Service | aether-dev-api-04w9l0 |
| PostgreSQL | aether-dev-psql-04w9l0 |
| Redis Cache | aether-dev-redis-04w9l0 |
| Container Registry | aetherdevacr04w9l0 |

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

### Environment Variables
Backend requires: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `GEMINI_API_KEY`, `CORS_ORIGINS`
Frontend requires: `BACKEND_URL` (for nginx proxy)

## Testing

### Backend
- Unit tests: Jest with `*.spec.ts` pattern
- E2E tests: Jest with separate config in `/test/jest-e2e.json`
- Coverage: `npm run test:cov`

### Frontend
- Unit tests: Vitest with React Testing Library
- E2E tests: Playwright
- Coverage: `npm run test:coverage`

## CI/CD

GitHub Actions workflows in `/.github/workflows/`:
- `ci.yml` - Runs on PR/push: lint, typecheck, tests, Docker build
- `deploy.yml` - Deploys to Azure on merge to main/develop
