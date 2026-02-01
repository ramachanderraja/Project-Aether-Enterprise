# Project Aether - Enterprise Autonomous FP&A Platform

An AI-powered Financial Planning & Analysis platform that transforms financial operations through intelligent automation, conversational analytics, and predictive insights.

## Overview

Project Aether is a comprehensive FP&A platform designed for mid-market and enterprise organizations. It combines traditional financial planning capabilities with advanced AI features powered by Google Gemini, enabling CFOs and finance teams to make data-driven decisions faster.

### Key Features

- **AI-Powered Conversational Analytics** - Natural language interface for financial queries
- **Intelligent Revenue Forecasting** - ML-driven predictions with confidence intervals
- **Automated Cost Optimization** - AI-identified savings opportunities
- **Scenario Planning & Simulation** - Monte Carlo simulations for risk analysis
- **Real-time Financial Dashboard** - Comprehensive KPIs and metrics
- **Enterprise Integrations** - SAP, Salesforce, Workday, Snowflake connectors
- **Governance & Compliance** - SOX-compliant audit trails and approval workflows

## Tech Stack

### Backend
- **Framework**: NestJS 10.x with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for session management and caching
- **AI**: Google Gemini 2.5 Pro for conversational AI
- **Auth**: JWT + OAuth2/OIDC (Okta, Azure AD)

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Kubernetes-ready
- **CI/CD**: GitHub Actions

## Project Structure

```
project-aether/
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── config/         # Configuration and environment
│   │   ├── database/       # Prisma schema and migrations
│   │   └── modules/        # Feature modules
│   │       ├── auth/       # Authentication & authorization
│   │       ├── dashboard/  # Dashboard metrics
│   │       ├── ai/         # AI/Gemini integration
│   │       ├── sales/      # Sales pipeline
│   │       ├── cost/       # Cost management
│   │       ├── revenue/    # Revenue analytics
│   │       ├── scenarios/  # Scenario planning
│   │       ├── governance/ # Audit & compliance
│   │       ├── data-fabric/# Data integration
│   │       ├── integrations/# External integrations
│   │       ├── users/      # User management
│   │       ├── reports/    # Report generation
│   │       └── health/     # Health checks
│   └── Dockerfile
├── frontend/               # React SPA
│   ├── src/
│   │   ├── app/           # App configuration & routing
│   │   ├── modules/       # Feature modules
│   │   │   ├── dashboard/
│   │   │   ├── ai-agent/
│   │   │   ├── sales/
│   │   │   ├── cost/
│   │   │   ├── revenue/
│   │   │   ├── scenarios/
│   │   │   ├── governance/
│   │   │   ├── data-fabric/
│   │   │   ├── integrations/
│   │   │   └── settings/
│   │   └── shared/        # Shared components & utilities
│   └── Dockerfile
├── docs/                  # Documentation
│   ├── PRD.md            # Product Requirements
│   ├── ARCHITECTURE.md   # System Architecture
│   ├── DATABASE.md       # Database Schema
│   ├── API.md            # API Specification
│   └── stories/          # User Stories
├── docker-compose.yml    # Local development setup
└── .github/workflows/    # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- Docker & Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/project-aether.git
   cd project-aether
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/v1
   - API Documentation: http://localhost:3001/api/docs

### Manual Setup

#### Backend

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Configure your database, Redis, and API keys
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

#### Frontend

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Configure API URL
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

#### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `1h` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.5-pro` |

#### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001/api/v1` |
| `VITE_APP_NAME` | Application name | `Project Aether` |
| `VITE_ENABLE_AI_CHAT` | Enable AI chat feature | `true` |

### External Integrations

Configure these in the backend `.env` for enterprise integrations:

- **Okta SSO**: `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`
- **Azure AD**: `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`
- **SAP**: `SAP_BASE_URL`, `SAP_CLIENT_ID`, `SAP_CLIENT_SECRET`
- **Salesforce**: `SALESFORCE_INSTANCE_URL`, `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`
- **Workday**: `WORKDAY_BASE_URL`, `WORKDAY_CLIENT_ID`, `WORKDAY_CLIENT_SECRET`
- **Snowflake**: `SNOWFLAKE_ACCOUNT`, `SNOWFLAKE_USERNAME`, `SNOWFLAKE_PASSWORD`

## API Documentation

The API documentation is available via Swagger UI at `/api/docs` when running the backend server.

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/auth/login` | User authentication |
| `GET /api/v1/dashboard` | Dashboard metrics |
| `POST /api/v1/ai/chat` | AI chat (streaming SSE) |
| `GET /api/v1/revenue` | Revenue analytics |
| `GET /api/v1/cost` | Cost breakdown |
| `GET /api/v1/sales/pipeline` | Sales pipeline |
| `POST /api/v1/scenarios` | Create scenario |
| `POST /api/v1/reports/generate` | Generate report |

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend tests
cd frontend
npm run test
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Format code
npm run format
```

### Database Management

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## Deployment

### Docker Production Build

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

Kubernetes manifests are available in the `k8s/` directory:

```bash
kubectl apply -f k8s/
```

### CI/CD

GitHub Actions workflows are configured for:
- **CI**: Runs on every PR - linting, type checking, tests
- **CD**: Deploys to staging on merge to `develop`, production on merge to `main`

## Architecture

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system architecture documentation.

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   NestJS API    │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌─────────┐  ┌─────────┐  ┌─────────┐
              │  Redis  │  │ Gemini  │  │External │
              │ (Cache) │  │  (AI)   │  │  APIs   │
              └─────────┘  └─────────┘  └─────────┘
```

## Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- SOX-compliant audit logging
- Data encryption at rest and in transit
- OWASP security best practices

## License

Proprietary - All rights reserved.

## Support

For support, please contact the development team or open an issue in the repository.
