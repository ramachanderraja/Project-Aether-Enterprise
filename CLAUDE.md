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

**Deployment is manual via Docker + Azure Container Registry (ACR).** GitHub Actions CI/CD exists but the primary workflow is:

1. **Login to ACR** (requires Azure CLI authenticated)
2. **Build Docker image** from the respective Dockerfile
3. **Push to ACR**
4. **Restart App Service** to pull the new image

#### Quick Reference
| Component | ACR Image | App Service | Resource Group |
|-----------|-----------|-------------|----------------|
| Frontend | `aetherdevacr04w9l0.azurecr.io/aether-frontend:latest` | `aether-dev-web-04w9l0` | `aether-dev-rg` |
| Backend | `aetherdevacr04w9l0.azurecr.io/aether-backend:latest` | `aether-dev-api-04w9l0` | `aether-dev-rg` |

#### Frontend Deployment
```bash
# Step 1: Login to ACR
az acr login --name aetherdevacr04w9l0

# Step 2: Build image (from project root or frontend directory)
cd frontend
docker build -t aetherdevacr04w9l0.azurecr.io/aether-frontend:latest .

# Step 3: Push to ACR
docker push aetherdevacr04w9l0.azurecr.io/aether-frontend:latest

# Step 4: Restart App Service to pull new image
az webapp restart --name aether-dev-web-04w9l0 --resource-group aether-dev-rg
```

#### Backend Deployment
```bash
# Step 1: Login to ACR
az acr login --name aetherdevacr04w9l0

# Step 2: Build image
cd backend
docker build -t aetherdevacr04w9l0.azurecr.io/aether-backend:latest .

# Step 3: Push to ACR
docker push aetherdevacr04w9l0.azurecr.io/aether-backend:latest

# Step 4: Restart App Service
az webapp restart --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
```

#### Troubleshooting
- **ACR login fails**: Ensure Azure CLI is authenticated (`az login`)
- **Push fails**: Check ACR admin credentials are enabled in Azure Portal
- **App doesn't update after restart**: Wait 1-2 minutes for container to pull; check App Service logs in Azure Portal
- **View logs**: `az webapp log tail --name <app-name> --resource-group aether-dev-rg`

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

## Frontend Component Patterns

### Multi-Select Dropdown
For filter dropdowns that need multiple selections, use the `MultiSelectDropdown` pattern:
```tsx
const MultiSelectDropdown = ({
  label, options, selected, onChange, allLabel = 'All'
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel?: string;
}) => {
  // Renders a dropdown with checkboxes for each option
  // Empty array = all selected (shows allLabel)
  // Clicking outside closes dropdown
};
```

Used in: `SalesPage.tsx`, `RevenuePage.tsx`

### Sortable Table Headers with Column Filters
For tables needing sort + filter on each column:
```tsx
const SortableHeader = ({
  label, field, currentSort, currentDirection, onSort,
  filterOptions, filterValue, onFilterChange
}: {...}) => {
  // Click header to sort (toggles asc/desc)
  // Click filter icon for dropdown with checkboxes
  // useRef<HTMLTableHeaderCellElement> for ref typing
};
```

### Floating Waterfall Chart (Recharts)
For waterfall charts showing incremental changes:
```tsx
const waterfallData = [
  { name: 'Start', bottom: 0, value: 100, type: 'initial' },
  { name: 'Increase', bottom: 100, value: 20, type: 'increase' },  // floats at 100
  { name: 'Decrease', bottom: 70, value: 10, type: 'decrease' },   // floats at 70
  { name: 'End', bottom: 0, value: 110, type: 'final' }
];

// Use stacked BarChart - IMPORTANT: use fillOpacity={0} not fill="none" or fill="transparent"
<Bar
  dataKey="bottom"
  stackId="waterfall"
  fill="#ffffff"
  fillOpacity={0}
  stroke="none"
  isAnimationActive={false}
/>
<Bar dataKey="value" stackId="waterfall" fill={...} />
```

Key points:
- `bottom` = invisible spacer height (where bar starts)
- `value` = visible bar height
- For decreases: `bottom` = running total - decrease amount
- Use `ReferenceLine` for connecting lines between bars
- **CRITICAL**: Use `fill="#ffffff" fillOpacity={0}` for the spacer bar, NOT `fill="none"` or `fill="transparent"` - Recharts doesn't properly render the spacer with those values

### Table Sorting with React State
When implementing sortable tables, sorting logic MUST be in a `useMemo` with `sortConfig` as a dependency:
```tsx
// WRONG - sorting inside render function won't re-run on state change
const renderTable = () => {
  let data = [...items];
  if (sortConfig) {
    data.sort((a, b) => { /* sorting */ });
  }
  return data.map(...);
};

// CORRECT - useMemo with sortConfig dependency triggers re-render
const sortedData = useMemo(() => {
  let data = [...items];
  if (sortConfig) {
    data = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (typeof aVal === 'number') return (aVal - bVal) * direction;
      return String(aVal).localeCompare(String(bVal)) * direction;
    });
  }
  return data;
}, [items, sortConfig]);  // <-- sortConfig MUST be a dependency
```

### Standard Filter Options (from Prompts doc)
Located in `frontend/src/shared/constants/filters.ts`:
- **Regions**: North America, Europe, LATAM, Middle East, APAC
- **Verticals**: Life Sciences, Other Services, CPG & Retail, Chemicals/Oil/Gas/Resources, Automotive and Industrial, BFSI, Telecom/Media/Tech, Public Sector, Energy & Utilities, Private Equity, Unilever
- **Segments**: Enterprise, SMB
- **Platforms**: Quantum, SMART, Cost Drivers, Opus
- **Logo Types**: New Logo, Renewal, Upsell, Cross-Sell, Extension (Extension = Renewal for calculations)

### Closed ACV Calculation Rules
```tsx
// License Value: Only counts for New Logo, Upsell, Cross-Sell
// (Extension is treated as Renewal, excluded from License ACV)
const LICENSE_ACV_LOGO_TYPES = ['New Logo', 'Upsell', 'Cross-Sell'];

// Implementation Value: Counts for ALL logo types
// Closed ACV = License ACV (filtered) + Implementation ACV (all)
```

## Common TypeScript Fixes

### Table Header Refs
When using refs on `<th>` elements:
```tsx
// Wrong
const ref = useRef<HTMLDivElement>(null);

// Correct
const ref = useRef<HTMLTableHeaderCellElement>(null);
```

### Filter State for Multi-Select
```tsx
// Single select (old)
const [filter, setFilter] = useState<string>('all');

// Multi-select (new) - empty array means "all"
const [filters, setFilters] = useState<string[]>([]);
```

## Infrastructure

### Terraform Configuration
Infrastructure as code in `/infrastructure/azure/terraform/`:
- `main.tf` - Core resources (VNet, ACR, PostgreSQL, Redis, App Services, Key Vault)
- `variables.tf` - Input variables
- `outputs.tf` - Output values

Resources are named with pattern: `${project_name}-${environment}-${resource}-${random_suffix}`

### Key Vault Integration
Backend App Service uses Key Vault references for secrets:
```
DATABASE_URL = @Microsoft.KeyVault(VaultName=...;SecretName=database-url)
REDIS_URL = @Microsoft.KeyVault(VaultName=...;SecretName=redis-url)
JWT_SECRET = @Microsoft.KeyVault(VaultName=...;SecretName=jwt-secret)
```
