# =============================================================================
# Project Aether - Azure Container Apps Deployment Script
# =============================================================================
# Usage: .\deploy.ps1 [-Environment dev] [-Location westus2]
# =============================================================================

param(
    [string]$Environment = "dev",
    [string]$Location = "westus2",
    [switch]$SkipInfra,
    [switch]$SkipImages,
    [switch]$SkipMigrations
)

$ErrorActionPreference = "Stop"

# =============================================================================
# Configuration
# =============================================================================

$PROJECT_NAME = "aether"
$RESOURCE_PREFIX = "$PROJECT_NAME-ca-$Environment"
$RESOURCE_GROUP = "rg-$RESOURCE_PREFIX"
$ACR_NAME = "acr${PROJECT_NAME}${Environment}".Replace("-", "")

Write-Host "=========================================="
Write-Host "Project Aether - Container Apps Deployment"
Write-Host "=========================================="
Write-Host "Environment:    $Environment"
Write-Host "Location:       $Location"
Write-Host "Resource Group: $RESOURCE_GROUP"
Write-Host "ACR:            $ACR_NAME"
Write-Host "=========================================="
Write-Host ""

# =============================================================================
# Prerequisites Check
# =============================================================================

Write-Host "Checking prerequisites..."

# Check Azure CLI
$azVersion = az --version 2>$null | Select-String "azure-cli" | ForEach-Object { $_.ToString() }
if (-not $azVersion) {
    Write-Error "Azure CLI not found. Install from https://aka.ms/installazurecli"
    exit 1
}
Write-Host "  Azure CLI: OK"

# Check Docker
$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
    Write-Error "Docker not found. Install Docker Desktop"
    exit 1
}
Write-Host "  Docker: OK"

# Check Azure login
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "  Not logged in to Azure. Running az login..."
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "  Azure Account: $($account.name)"

# =============================================================================
# Generate Secrets
# =============================================================================

Write-Host ""
Write-Host "Generating secrets..."

# Generate random password for PostgreSQL
$POSTGRES_PASSWORD = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_}) + "!@2024"
Write-Host "  PostgreSQL password: Generated"

# Generate JWT secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 48 | ForEach-Object {[char]$_})
Write-Host "  JWT secret: Generated"

# =============================================================================
# Deploy Infrastructure
# =============================================================================

if (-not $SkipInfra) {
    Write-Host ""
    Write-Host "Deploying infrastructure via Bicep..."
    Write-Host "  This will take 15-20 minutes..."

    $deploymentName = "aether-ca-$Environment-$(Get-Date -Format 'yyyyMMddHHmmss')"

    $env:MSYS_NO_PATHCONV = 1

    az deployment sub create `
        --name $deploymentName `
        --location $Location `
        --template-file "$PSScriptRoot\..\bicep\main.bicep" `
        --parameters `
            projectName=$PROJECT_NAME `
            environment=$Environment `
            location=$Location `
            postgresAdminPassword=$POSTGRES_PASSWORD `
            jwtSecret=$JWT_SECRET `
        --output table

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Infrastructure deployment failed!"
        exit 1
    }

    Write-Host "  Infrastructure deployed successfully!"
} else {
    Write-Host ""
    Write-Host "Skipping infrastructure deployment (--SkipInfra)"
}

# =============================================================================
# Build and Push Docker Images
# =============================================================================

if (-not $SkipImages) {
    Write-Host ""
    Write-Host "Building and pushing Docker images..."

    # Get ACR credentials
    $ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer -o tsv

    if (-not $ACR_LOGIN_SERVER) {
        Write-Error "Could not get ACR login server. Make sure infrastructure is deployed."
        exit 1
    }

    Write-Host "  ACR: $ACR_LOGIN_SERVER"

    # Login to ACR
    az acr login --name $ACR_NAME

    # Get commit SHA for tagging
    $COMMIT_SHA = git rev-parse --short HEAD
    Write-Host "  Commit SHA: $COMMIT_SHA"

    # Build backend
    Write-Host "  Building backend..."
    docker build -t "${ACR_LOGIN_SERVER}/aether-backend:latest" -t "${ACR_LOGIN_SERVER}/aether-backend:${COMMIT_SHA}" -f "$PSScriptRoot\..\..\backend\Dockerfile" "$PSScriptRoot\..\.."

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend build failed!"
        exit 1
    }

    # Push backend
    Write-Host "  Pushing backend..."
    docker push "${ACR_LOGIN_SERVER}/aether-backend:latest"
    docker push "${ACR_LOGIN_SERVER}/aether-backend:${COMMIT_SHA}"

    # Build frontend
    Write-Host "  Building frontend..."
    docker build -t "${ACR_LOGIN_SERVER}/aether-frontend:latest" -t "${ACR_LOGIN_SERVER}/aether-frontend:${COMMIT_SHA}" -f "$PSScriptRoot\..\..\frontend\Dockerfile" "$PSScriptRoot\..\.."

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build failed!"
        exit 1
    }

    # Push frontend
    Write-Host "  Pushing frontend..."
    docker push "${ACR_LOGIN_SERVER}/aether-frontend:latest"
    docker push "${ACR_LOGIN_SERVER}/aether-frontend:${COMMIT_SHA}"

    Write-Host "  Images pushed successfully!"

    # Update Container Apps with new images
    Write-Host "  Updating Container Apps..."

    az containerapp update `
        --name "ca-$RESOURCE_PREFIX-api" `
        --resource-group $RESOURCE_GROUP `
        --image "${ACR_LOGIN_SERVER}/aether-backend:${COMMIT_SHA}"

    az containerapp update `
        --name "ca-$RESOURCE_PREFIX-web" `
        --resource-group $RESOURCE_GROUP `
        --image "${ACR_LOGIN_SERVER}/aether-frontend:${COMMIT_SHA}"

    Write-Host "  Container Apps updated!"
} else {
    Write-Host ""
    Write-Host "Skipping image build (--SkipImages)"
}

# =============================================================================
# Run Database Migrations
# =============================================================================

if (-not $SkipMigrations) {
    Write-Host ""
    Write-Host "Running database migrations..."

    # Get database connection string from Key Vault
    $KEY_VAULT_NAME = "kv-$RESOURCE_PREFIX"
    $DATABASE_URL = az keyvault secret show --vault-name $KEY_VAULT_NAME --name "postgres-connection-string" --query value -o tsv

    if ($DATABASE_URL) {
        Write-Host "  DATABASE_URL retrieved from Key Vault"

        # Run migrations using npx prisma
        Push-Location "$PSScriptRoot\..\..\backend"
        $env:DATABASE_URL = $DATABASE_URL
        npx prisma migrate deploy
        npx prisma db seed
        Pop-Location

        Write-Host "  Migrations completed!"
    } else {
        Write-Host "  Could not get DATABASE_URL - skipping migrations"
        Write-Host "  Run manually: npx prisma migrate deploy && npx prisma db seed"
    }
} else {
    Write-Host ""
    Write-Host "Skipping migrations (--SkipMigrations)"
}

# =============================================================================
# Output URLs
# =============================================================================

Write-Host ""
Write-Host "=========================================="
Write-Host "Deployment Complete!"
Write-Host "=========================================="

$WEB_FQDN = az containerapp show --name "ca-$RESOURCE_PREFIX-web" --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv 2>$null
$API_FQDN = az containerapp show --name "ca-$RESOURCE_PREFIX-api" --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv 2>$null

if ($WEB_FQDN) {
    Write-Host ""
    Write-Host "URLs:"
    Write-Host "  Frontend: https://$WEB_FQDN"
    Write-Host "  Backend:  https://$API_FQDN"
    Write-Host "  API Docs: https://$API_FQDN/docs"
}

Write-Host ""
Write-Host "Credentials:"
Write-Host "  Email:    admin@demo.com"
Write-Host "  Password: Demo@2024"
Write-Host ""
Write-Host "=========================================="
