# Project Aether - Azure Deployment Guide

This guide explains how to deploy Project Aether to Microsoft Azure using **Azure Container Apps** (recommended) or Azure App Service (legacy).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start - Container Apps](#quick-start---container-apps)
4. [CI/CD Deployment](#cicd-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Legacy: App Service Deployment](#legacy-app-service-deployment)

---

## Architecture Overview

### Container Apps Architecture (Current)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Azure Cloud (West US 2)                         │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                   Container Apps Environment                        │ │
│  │                      (cae-aether-ca-dev)                           │ │
│  │                                                                     │ │
│  │   ┌─────────────────┐         ┌─────────────────┐                 │ │
│  │   │   Web App       │  nginx  │    API App      │                 │ │
│  │   │ (React/Nginx)   │ ──────▶ │   (NestJS)      │                 │ │
│  │   │   Port 80       │  proxy  │   Port 3001     │                 │ │
│  │   └─────────────────┘         └─────────────────┘                 │ │
│  │           │                           │                            │ │
│  └───────────┼───────────────────────────┼────────────────────────────┘ │
│              │                           │                              │
│  ┌───────────┼───────────────────────────┼────────────────────────────┐ │
│  │           │      Virtual Network      │                            │ │
│  │           │       (10.1.0.0/16)       │                            │ │
│  │           │                           │                            │ │
│  │  ┌────────▼────────┐    ┌─────────────▼───────────┐               │ │
│  │  │  snet-apps      │    │     snet-data           │               │ │
│  │  │  10.1.0.0/21    │    │     10.1.8.0/24         │               │ │
│  │  │  (Container     │    │  ┌──────────────────┐   │               │ │
│  │  │   Apps Env)     │    │  │   PostgreSQL     │   │               │ │
│  │  └─────────────────┘    │  │  Flexible Server │   │               │ │
│  │                         │  └──────────────────┘   │               │ │
│  │                         │  ┌──────────────────┐   │               │ │
│  │                         │  │   Redis Cache    │   │               │ │
│  │                         │  │     (Basic)      │   │               │ │
│  │                         │  └──────────────────┘   │               │ │
│  │                         └─────────────────────────┘               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │     ACR      │    │  Key Vault   │    │ Azure OpenAI │              │
│  │ acraetherdev │    │ (private)    │    │   (gpt-4o)   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Azure Service | Details |
|-----------|--------------|---------|
| Frontend | Container App | React SPA served via nginx with API proxy |
| Backend API | Container App | NestJS API server |
| Database | PostgreSQL Flexible Server | Private, VNet-integrated |
| Cache | Azure Cache for Redis | Basic tier, TLS enabled |
| Container Registry | ACR | `acraetherdev.azurecr.io` |
| AI Services | Azure OpenAI | GPT-4o deployment |
| Secrets | Key Vault | Private network access |

### Current Deployment URLs

| Environment | Service | URL |
|-------------|---------|-----|
| Dev | Frontend | https://ca-aether-ca-dev-web.wonderfulsea-4938652c.westus2.azurecontainerapps.io |
| Dev | Backend | https://ca-aether-ca-dev-api.wonderfulsea-4938652c.westus2.azurecontainerapps.io |
| Dev | API Docs | https://ca-aether-ca-dev-api.wonderfulsea-4938652c.westus2.azurecontainerapps.io/docs |

**Default Credentials:** `admin@demo.com` / `Demo@2024`

---

## Prerequisites

### Required Tools

1. **Azure CLI** (v2.50+)
   ```bash
   # Windows
   winget install Microsoft.AzureCLI

   # macOS
   brew install azure-cli
   ```

2. **Docker** (v24+)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)

3. **GitHub CLI** (for CI/CD setup)
   ```bash
   winget install GitHub.cli
   ```

### Azure Login

```bash
az login
az account set --subscription "Your Subscription"
```

---

## Quick Start - Container Apps

### Deploy Infrastructure (Bicep)

```powershell
cd infrastructure/scripts

# Deploy with default parameters
.\deploy.ps1 -Environment dev -Location westus2

# Or with custom parameters
.\deploy.ps1 -Environment dev -Location westus2 -ProjectName aether
```

This deploys:
- Resource Group with GEP-required tags
- Virtual Network with subnets
- Container Apps Environment
- PostgreSQL Flexible Server
- Redis Cache
- ACR
- Key Vault

### Build and Deploy Images

```bash
# Login to ACR
az acr login --name acraetherdev

# Build and push backend
cd backend
docker build -t acraetherdev.azurecr.io/aether-backend:latest .
docker push acraetherdev.azurecr.io/aether-backend:latest

# Build and push frontend
cd ../frontend
docker build -t acraetherdev.azurecr.io/aether-frontend:latest .
docker push acraetherdev.azurecr.io/aether-frontend:latest

# Update Container Apps
az containerapp update --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev --image acraetherdev.azurecr.io/aether-backend:latest
az containerapp update --name ca-aether-ca-dev-web --resource-group rg-aether-ca-dev --image acraetherdev.azurecr.io/aether-frontend:latest
```

---

## CI/CD Deployment

### GEP Azure Subscription Constraints

> **IMPORTANT:** GEP's Azure subscription grants **Contributor** access only (not Owner). This means:
> - Cannot create RBAC role assignments for service principals
> - Service principals cannot use `az login` (fails with "No subscriptions found")
> - Must use ACR admin credentials for authentication

### How CI/CD Works

The GitHub Actions workflow (`.github/workflows/container-apps-deploy.yml`) automates deployment:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Push to     │────▶│    Build     │────▶│   Push to    │────▶│   Smoke      │
│  main/master │     │   Docker     │     │     ACR      │     │   Tests      │
│              │     │   Images     │     │              │     │   (HTTP)     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Trigger:** The workflow runs automatically when you push code to `main` or `master` branch.

**What happens:**
1. **Build Job**: Builds Docker images for frontend and backend using ACR admin credentials
2. **Push to ACR**: Tags images with commit SHA + `latest` and pushes to Azure Container Registry
3. **Smoke Tests**: Verifies deployment via HTTP health checks to Container Apps FQDNs

**Note:** The workflow does NOT use Azure CLI login. Container Apps pull new images automatically when `:latest` is updated. If auto-pull doesn't work, manual update commands are provided in the workflow output.

### GitHub Secrets Required

| Secret | Description | Value |
|--------|-------------|-------|
| `ACR_CA_LOGIN_SERVER` | ACR URL | `acraetherdev.azurecr.io` |
| `ACR_CA_USERNAME` | ACR admin username | `acraetherdev` |
| `ACR_CA_PASSWORD` | ACR admin password | (from ACR) |

> **Note:** `AZURE_CREDENTIALS` (service principal) is NOT used due to GEP subscription limitations.

### Manual Workflow Trigger

You can also manually trigger the workflow from GitHub:
1. Go to Actions tab
2. Select "Deploy to Container Apps"
3. Click "Run workflow"
4. Choose which components to deploy

### Workflow File Location

`.github/workflows/container-apps-deploy.yml`

---

## Manual Deployment

### Update Individual Container Apps

```bash
# Update API
az containerapp update \
  --name ca-aether-ca-dev-api \
  --resource-group rg-aether-ca-dev \
  --image acraetherdev.azurecr.io/aether-backend:latest

# Update Web
az containerapp update \
  --name ca-aether-ca-dev-web \
  --resource-group rg-aether-ca-dev \
  --image acraetherdev.azurecr.io/aether-frontend:latest
```

### View Container App Logs

```bash
# Stream API logs
az containerapp logs show \
  --name ca-aether-ca-dev-api \
  --resource-group rg-aether-ca-dev \
  --follow

# View Web logs
az containerapp logs show \
  --name ca-aether-ca-dev-web \
  --resource-group rg-aether-ca-dev \
  --tail 100
```

### Check Container App Status

```bash
az containerapp list --resource-group rg-aether-ca-dev -o table
```

### Restart Container App

```bash
# Restart by creating new revision
az containerapp revision restart \
  --name ca-aether-ca-dev-api \
  --resource-group rg-aether-ca-dev \
  --revision $(az containerapp revision list --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev --query "[0].name" -o tsv)
```

---

## Troubleshooting

### Common Issues

#### 0. CI/CD "No subscriptions found" Error

**Symptom:** GitHub Actions workflow fails at Azure Login step with:
```
Error: No subscriptions found for ***.
Login failed with Error: The process '/usr/bin/az' failed with exit code 1.
```

**Root Cause:** GEP's Azure subscription only grants Contributor access. Service principals cannot have role assignments created, so `az login` fails.

**Solution:** The workflow has been updated to use ACR admin credentials only, without Azure login. If you see this error:
1. Make sure you're using the updated workflow from `container-apps-deploy.yml`
2. Ensure `ACR_CA_LOGIN_SERVER`, `ACR_CA_USERNAME`, and `ACR_CA_PASSWORD` secrets are set
3. The workflow pushes images to ACR and relies on Container Apps auto-pulling `:latest`

**Manual Fallback:** If Container Apps don't auto-pull, run manually:
```bash
az containerapp update --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev --image acraetherdev.azurecr.io/aether-backend:latest
az containerapp update --name ca-aether-ca-dev-web --resource-group rg-aether-ca-dev --image acraetherdev.azurecr.io/aether-frontend:latest
```

#### 1. Container App won't start

```bash
# Check revision status
az containerapp revision list --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev -o table

# View detailed logs
az containerapp logs show --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev --tail 200
```

#### 2. Database connection issues

The PostgreSQL server is private (VNet-integrated). Container Apps must be in the same VNet to connect.

```bash
# Verify database is accessible from Container App
az containerapp exec --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev --command "sh -c 'nc -zv psql-aether-ca-dev.postgres.database.azure.com 5432'"
```

#### 3. 502 Bad Gateway from nginx proxy

This usually means the frontend can't reach the backend. Check:
- Backend Container App is running
- `BACKEND_URL` environment variable is set correctly
- nginx has DNS resolver configured (should be in nginx.conf)

```bash
# Check Web container nginx config
az containerapp exec --name ca-aether-ca-dev-web --resource-group rg-aether-ca-dev --command "cat /etc/nginx/conf.d/default.conf"
```

#### 4. Image pull errors

```bash
# Verify ACR credentials
az acr credential show --name acraetherdev

# Check if image exists
az acr repository show-tags --name acraetherdev --repository aether-backend
```

### Useful Commands

```bash
# List all resources in resource group
az resource list --resource-group rg-aether-ca-dev -o table

# Get Container App URL
az containerapp show --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev --query "properties.configuration.ingress.fqdn" -o tsv

# Scale Container App
az containerapp update --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev --min-replicas 2 --max-replicas 5

# Update environment variable
az containerapp update --name ca-aether-ca-dev-api --resource-group rg-aether-ca-dev --set-env-vars "LOG_LEVEL=debug"
```

---

## Legacy: App Service Deployment

> **Note:** App Service deployment is deprecated. Use Container Apps for new deployments.

The App Service deployment remains available at:
- Frontend: https://aether-dev-web-04w9l0.azurewebsites.net
- Backend: https://aether-dev-api-04w9l0.azurewebsites.net

Workflow file: `.github/workflows/azure-deploy.yml` (marked as Legacy)

---

## Cost Estimation

### Container Apps (Current - ~$60/month)

| Resource | SKU | Est. Cost |
|----------|-----|-----------|
| Container Apps Environment | Consumption | Pay-per-use (~$10-20) |
| PostgreSQL Flexible Server | B_Standard_B1ms | $12/month |
| Redis Cache | Basic C0 | $16/month |
| Container Registry | Basic | $5/month |
| Key Vault | Standard | ~$1/month |
| **Total** | | **~$45-60/month** |

---

## Security Best Practices

1. **Private VNet** - All data services (PostgreSQL, Redis) are in private subnets
2. **Key Vault** - All secrets stored in Key Vault with private access
3. **ACR Authentication** - Using admin credentials (can be upgraded to managed identity)
4. **TLS Everywhere** - All external endpoints use HTTPS
5. **No Public DB Access** - PostgreSQL only accessible within VNet
