# Project Aether - Azure Deployment Guide

This guide explains how to deploy Project Aether to Microsoft Azure using Azure App Service.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Cost Estimation](#cost-estimation)
4. [Quick Start](#quick-start)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [CI/CD Setup](#cicd-setup)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                               │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   Backend    │    │   Database   │      │
│  │  App Service │───▶│  App Service │───▶│  PostgreSQL  │      │
│  │   (React)    │    │   (NestJS)   │    │   Flexible   │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                    │               │
│         │                   │                    │               │
│         ▼                   ▼                    │               │
│  ┌──────────────┐    ┌──────────────┐           │               │
│  │     CDN      │    │    Redis     │           │               │
│  │  (Optional)  │    │    Cache     │◀──────────┘               │
│  └──────────────┘    └──────────────┘                           │
│                             │                                    │
│                             ▼                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Key Vault   │    │   App       │    │   Storage    │      │
│  │  (Secrets)   │    │  Insights   │    │   Account    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Virtual Network (VNet)                   │      │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │      │
│  │  │App Svc  │  │Database │  │  Redis  │              │      │
│  │  │ Subnet  │  │ Subnet  │  │ Subnet  │              │      │
│  │  └─────────┘  └─────────┘  └─────────┘              │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Azure Service | Purpose |
|-----------|--------------|---------|
| Frontend | App Service (Linux) | React SPA hosting |
| Backend API | App Service (Linux) | NestJS API server |
| Database | PostgreSQL Flexible Server | Primary data store |
| Cache | Azure Cache for Redis | Session & data caching |
| Secrets | Key Vault | Secure credential storage |
| Container Registry | ACR | Docker image storage |
| Monitoring | Application Insights | APM & logging |
| Storage | Blob Storage | File uploads & backups |

---

## Prerequisites

### Required Tools

1. **Azure CLI** (v2.50+)
   ```bash
   # Windows (PowerShell)
   winget install Microsoft.AzureCLI

   # macOS
   brew install azure-cli

   # Linux
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

2. **Terraform** (v1.5+)
   ```bash
   # Windows (PowerShell)
   winget install HashiCorp.Terraform

   # macOS
   brew install terraform

   # Linux
   sudo apt-get install terraform
   ```

3. **Docker** (v24+)
   - [Docker Desktop for Windows/Mac](https://www.docker.com/products/docker-desktop)
   - [Docker Engine for Linux](https://docs.docker.com/engine/install/)

### Azure Requirements

- Active Azure subscription
- Contributor role on the subscription (or a resource group)
- Ability to create service principals (for CI/CD)

### Login to Azure

```bash
# Login interactively
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your Subscription Name"

# Verify
az account show
```

---

## Cost Estimation

### Development Environment (~$75/month)

| Resource | SKU | Est. Cost |
|----------|-----|-----------|
| App Service Plan | B1 (Basic) | $13/month |
| PostgreSQL | B_Standard_B1ms | $12/month |
| Redis Cache | Basic C0 | $16/month |
| Container Registry | Basic | $5/month |
| Key Vault | Standard | $0.03/10k ops |
| Storage | Standard LRS | ~$2/month |
| Application Insights | Pay-as-you-go | ~$5/month |
| **Total** | | **~$53-75/month** |

### Production Environment (~$350/month)

| Resource | SKU | Est. Cost |
|----------|-----|-----------|
| App Service Plan | P1V2 (Premium) | $81/month |
| PostgreSQL | GP_Standard_D2s_v3 | $98/month |
| Redis Cache | Standard C1 | $81/month |
| Container Registry | Standard | $20/month |
| Key Vault | Standard | ~$1/month |
| Storage | Standard LRS | ~$5/month |
| Application Insights | Pay-as-you-go | ~$20/month |
| **Total** | | **~$300-400/month** |

---

## Quick Start

### Option 1: One-Command Deployment (PowerShell)

```powershell
cd infrastructure/azure

# Copy and configure variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit terraform.tfvars with your values

# Deploy everything
.\deploy.ps1 -Action deploy-all -Environment dev
```

### Option 2: One-Command Deployment (Bash)

```bash
cd infrastructure/azure

# Copy and configure variables
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Edit terraform.tfvars with your values

# Make script executable
chmod +x deploy.sh

# Deploy everything
./deploy.sh -a deploy-all -e dev
```

---

## Step-by-Step Deployment

### Step 1: Configure Variables

```bash
cd infrastructure/azure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# Required settings
project_name      = "aether"
environment       = "dev"
location          = "East US"

# Database credentials
db_admin_username = "aether_admin"
db_admin_password = "YourSecurePassword123!"  # Min 12 chars

# JWT Secret (generate with: openssl rand -base64 48)
jwt_secret = "your-super-secret-jwt-key-at-least-32-characters-long"

# Optional: Gemini API key for AI features
gemini_api_key = ""
```

### Step 2: Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan -var="environment=dev"

# Apply changes (creates all Azure resources)
terraform apply -var="environment=dev"
```

This creates:
- Resource Group
- Virtual Network with subnets
- PostgreSQL Flexible Server
- Redis Cache
- Key Vault with secrets
- App Service Plan
- Backend & Frontend App Services
- Container Registry
- Application Insights
- Storage Account

### Step 3: Build Docker Images

```bash
# Get ACR login server from Terraform output
ACR_SERVER=$(terraform output -raw acr_login_server)

# Login to ACR
az acr login --name ${ACR_SERVER%.azurecr.io}

# Build backend
cd ../../backend
docker build -t $ACR_SERVER/aether-backend:latest .

# Build frontend
cd ../frontend
docker build -t $ACR_SERVER/aether-frontend:latest .
```

### Step 4: Push Images to ACR

```bash
docker push $ACR_SERVER/aether-backend:latest
docker push $ACR_SERVER/aether-frontend:latest
```

### Step 5: Restart App Services

```bash
# Get resource group and app names
RG=$(terraform output -raw resource_group_name)
BACKEND=$(terraform output -raw backend_app_name)
FRONTEND=$(terraform output -raw frontend_app_name)

# Restart to pull new images
az webapp restart --name $BACKEND --resource-group $RG
az webapp restart --name $FRONTEND --resource-group $RG
```

### Step 6: Run Database Migrations

```bash
# SSH into backend container
az webapp ssh --name $BACKEND --resource-group $RG

# Inside the container, run:
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
exit
```

### Step 7: Verify Deployment

```bash
# Get URLs
terraform output frontend_url
terraform output backend_url

# Test health endpoint
curl $(terraform output -raw backend_url)/health
```

---

## CI/CD Setup

### GitHub Actions

1. **Create Azure Service Principal:**

```bash
# Create service principal with Contributor role
az ad sp create-for-rbac \
  --name "aether-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth
```

Copy the JSON output.

2. **Add GitHub Secrets:**

Go to your repository → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `AZURE_CREDENTIALS` | The JSON from step 1 |
| `ACR_LOGIN_SERVER` | `aetherdevacr123456.azurecr.io` |
| `ACR_USERNAME` | ACR admin username |
| `ACR_PASSWORD` | ACR admin password |
| `AZURE_RG` | `aether-dev-rg` |
| `BACKEND_APP_NAME` | `aether-dev-api-123456` |
| `FRONTEND_APP_NAME` | `aether-dev-web-123456` |

3. **Enable Workflow:**

The workflow at `.github/workflows/azure-deploy.yml` will automatically deploy on push to `main` or `master`.

---

## Post-Deployment Configuration

### Custom Domain Setup

1. **Add custom domain in Azure Portal:**
   - Go to App Service → Custom domains
   - Add custom domain
   - Validate ownership via CNAME/TXT record

2. **Add SSL certificate:**
   - Use App Service Managed Certificate (free)
   - Or upload your own certificate

3. **Update Terraform variables:**
   ```hcl
   custom_domain = "app.yourcompany.com"
   ```

### Configure Application Settings

```bash
# Add additional settings
az webapp config appsettings set \
  --name $BACKEND \
  --resource-group $RG \
  --settings \
    FEATURE_MFA_ENABLED=true \
    LOG_LEVEL=info
```

### Enable Auto-Scaling (Production)

```bash
# Enable autoscale
az monitor autoscale create \
  --resource-group $RG \
  --resource $BACKEND \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-cpu \
  --min-count 1 \
  --max-count 5 \
  --count 2

# Add CPU rule
az monitor autoscale rule create \
  --resource-group $RG \
  --autoscale-name autoscale-cpu \
  --condition "CpuPercentage > 70 avg 5m" \
  --scale out 1
```

---

## Troubleshooting

### Common Issues

#### 1. Container won't start

```bash
# Check logs
az webapp log tail --name $BACKEND --resource-group $RG

# Check container logs
az webapp log download --name $BACKEND --resource-group $RG --log-file logs.zip
```

#### 2. Database connection issues

- Verify the database subnet has delegation for PostgreSQL
- Check firewall rules allow App Service subnet
- Verify connection string in Key Vault

```bash
# Test database connectivity
az webapp ssh --name $BACKEND --resource-group $RG
# Then: psql "$DATABASE_URL" -c "SELECT 1"
```

#### 3. Redis connection issues

```bash
# Check Redis status
az redis show --name <redis-name> --resource-group $RG

# Test connectivity
az redis force-reboot --name <redis-name> --resource-group $RG --reboot-type PrimaryNode
```

#### 4. Terraform state issues

```bash
# Refresh state
terraform refresh

# Import existing resource
terraform import azurerm_resource_group.main /subscriptions/.../resourceGroups/aether-dev-rg
```

### Useful Commands

```bash
# View all resources
az resource list --resource-group $RG --output table

# View App Service logs
az webapp log tail --name $BACKEND --resource-group $RG

# Restart App Service
az webapp restart --name $BACKEND --resource-group $RG

# Scale App Service Plan
az appservice plan update --name <plan-name> --resource-group $RG --sku S1

# View Terraform outputs
terraform output

# Destroy everything (careful!)
terraform destroy -var="environment=dev"
```

---

## Security Best Practices

1. **Enable Managed Identity** - Already configured for Key Vault access
2. **Use Private Endpoints** - For production, enable private endpoints for database/redis
3. **Enable WAF** - Add Azure Front Door with WAF for production
4. **Regular Key Rotation** - Rotate JWT secrets and database passwords periodically
5. **Enable Diagnostic Logging** - Send logs to Log Analytics for audit

---

## Support

- **Azure Documentation**: https://docs.microsoft.com/azure
- **Terraform Azure Provider**: https://registry.terraform.io/providers/hashicorp/azurerm
- **Project Issues**: https://github.com/ramachanderraja/Project-Aether-Enterprise/issues
