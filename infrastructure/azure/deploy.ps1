<#
.SYNOPSIS
    Deploy Project Aether to Azure

.DESCRIPTION
    This script deploys the Project Aether infrastructure and application to Azure
    using Terraform and Docker.

.PARAMETER Action
    The action to perform: plan, apply, destroy, build, push, deploy-all

.PARAMETER Environment
    The target environment: dev, staging, prod

.EXAMPLE
    .\deploy.ps1 -Action plan -Environment dev
    .\deploy.ps1 -Action apply -Environment dev
    .\deploy.ps1 -Action deploy-all -Environment dev
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("plan", "apply", "destroy", "build", "push", "deploy-all", "init")]
    [string]$Action,

    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$TerraformDir = Join-Path $PSScriptRoot "terraform"
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

# Colors for output
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Green }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."

    # Check Azure CLI
    if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
        throw "Azure CLI is not installed. Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    }

    # Check Terraform
    if (-not (Get-Command terraform -ErrorAction SilentlyContinue)) {
        throw "Terraform is not installed. Install from: https://www.terraform.io/downloads"
    }

    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed. Install from: https://docs.docker.com/get-docker/"
    }

    # Check Azure login
    $account = az account show 2>$null | ConvertFrom-Json
    if (-not $account) {
        Write-Warning "Not logged in to Azure. Running 'az login'..."
        az login
    }

    Write-Success "All prerequisites met!"
    Write-Info "Using Azure subscription: $($account.name) ($($account.id))"
}

# Initialize Terraform
function Initialize-Terraform {
    Write-Info "Initializing Terraform..."
    Push-Location $TerraformDir
    try {
        terraform init
        if ($LASTEXITCODE -ne 0) { throw "Terraform init failed" }
        Write-Success "Terraform initialized!"
    }
    finally {
        Pop-Location
    }
}

# Plan Terraform changes
function Invoke-TerraformPlan {
    Write-Info "Planning Terraform changes for $Environment..."
    Push-Location $TerraformDir

    # Check if tfvars exists
    $tfvarsFile = "terraform.tfvars"
    if (-not (Test-Path $tfvarsFile)) {
        Write-Warning "terraform.tfvars not found. Creating from example..."
        Copy-Item "terraform.tfvars.example" $tfvarsFile
        Write-Warning "Please edit terraform.tfvars with your values and run again."
        return
    }

    try {
        terraform plan -var="environment=$Environment" -out="tfplan"
        if ($LASTEXITCODE -ne 0) { throw "Terraform plan failed" }
        Write-Success "Plan complete! Review the changes above."
    }
    finally {
        Pop-Location
    }
}

# Apply Terraform changes
function Invoke-TerraformApply {
    Write-Info "Applying Terraform changes for $Environment..."
    Push-Location $TerraformDir
    try {
        if (Test-Path "tfplan") {
            terraform apply "tfplan"
        } else {
            terraform apply -var="environment=$Environment" -auto-approve
        }
        if ($LASTEXITCODE -ne 0) { throw "Terraform apply failed" }
        Write-Success "Infrastructure deployed!"

        # Get outputs
        $outputs = terraform output -json | ConvertFrom-Json
        return $outputs
    }
    finally {
        Pop-Location
    }
}

# Destroy Terraform resources
function Invoke-TerraformDestroy {
    Write-Warning "This will destroy all resources in $Environment!"
    $confirm = Read-Host "Type 'yes' to confirm"
    if ($confirm -ne "yes") {
        Write-Info "Cancelled."
        return
    }

    Push-Location $TerraformDir
    try {
        terraform destroy -var="environment=$Environment" -auto-approve
        if ($LASTEXITCODE -ne 0) { throw "Terraform destroy failed" }
        Write-Success "Resources destroyed!"
    }
    finally {
        Pop-Location
    }
}

# Build Docker images
function Build-DockerImages {
    param([string]$AcrLoginServer)

    Write-Info "Building Docker images..."

    # Build backend
    Write-Info "Building backend image..."
    Push-Location $BackendDir
    try {
        docker build -t "${AcrLoginServer}/aether-backend:latest" -t "${AcrLoginServer}/aether-backend:$Environment" .
        if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }
        Write-Success "Backend image built!"
    }
    finally {
        Pop-Location
    }

    # Build frontend
    Write-Info "Building frontend image..."
    Push-Location $FrontendDir
    try {
        docker build -t "${AcrLoginServer}/aether-frontend:latest" -t "${AcrLoginServer}/aether-frontend:$Environment" .
        if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
        Write-Success "Frontend image built!"
    }
    finally {
        Pop-Location
    }

    Write-Success "All images built!"
}

# Push Docker images to ACR
function Push-DockerImages {
    param([string]$AcrName, [string]$AcrLoginServer)

    Write-Info "Logging in to Azure Container Registry..."
    az acr login --name $AcrName
    if ($LASTEXITCODE -ne 0) { throw "ACR login failed" }

    Write-Info "Pushing images to ACR..."

    docker push "${AcrLoginServer}/aether-backend:latest"
    docker push "${AcrLoginServer}/aether-backend:$Environment"
    docker push "${AcrLoginServer}/aether-frontend:latest"
    docker push "${AcrLoginServer}/aether-frontend:$Environment"

    Write-Success "Images pushed to ACR!"
}

# Restart App Services
function Restart-AppServices {
    param([string]$ResourceGroup, [string]$BackendName, [string]$FrontendName)

    Write-Info "Restarting App Services..."

    az webapp restart --name $BackendName --resource-group $ResourceGroup
    az webapp restart --name $FrontendName --resource-group $ResourceGroup

    Write-Success "App Services restarted!"
}

# Run database migrations
function Invoke-DatabaseMigration {
    param([string]$ResourceGroup, [string]$BackendName)

    Write-Info "Running database migrations..."
    Write-Warning "Opening SSH session to backend. Run: npx prisma migrate deploy"

    az webapp ssh --name $BackendName --resource-group $ResourceGroup
}

# Main execution
try {
    Test-Prerequisites

    switch ($Action) {
        "init" {
            Initialize-Terraform
        }
        "plan" {
            Initialize-Terraform
            Invoke-TerraformPlan
        }
        "apply" {
            Initialize-Terraform
            $outputs = Invoke-TerraformApply

            Write-Host ""
            Write-Success "=============================================="
            Write-Success "DEPLOYMENT COMPLETE!"
            Write-Success "=============================================="
            Write-Host ""
            Write-Info "Frontend URL: $($outputs.frontend_url.value)"
            Write-Info "Backend URL: $($outputs.backend_url.value)"
            Write-Host ""
        }
        "destroy" {
            Initialize-Terraform
            Invoke-TerraformDestroy
        }
        "build" {
            Push-Location $TerraformDir
            $outputs = terraform output -json | ConvertFrom-Json
            Pop-Location

            if (-not $outputs.acr_login_server) {
                throw "Infrastructure not deployed. Run 'deploy.ps1 -Action apply' first."
            }

            Build-DockerImages -AcrLoginServer $outputs.acr_login_server.value
        }
        "push" {
            Push-Location $TerraformDir
            $outputs = terraform output -json | ConvertFrom-Json
            Pop-Location

            $acrName = $outputs.acr_login_server.value -replace '\.azurecr\.io$', ''
            Push-DockerImages -AcrName $acrName -AcrLoginServer $outputs.acr_login_server.value
        }
        "deploy-all" {
            # Full deployment pipeline
            Initialize-Terraform
            $outputs = Invoke-TerraformApply

            Build-DockerImages -AcrLoginServer $outputs.acr_login_server.value

            $acrName = $outputs.acr_login_server.value -replace '\.azurecr\.io$', ''
            Push-DockerImages -AcrName $acrName -AcrLoginServer $outputs.acr_login_server.value

            Restart-AppServices `
                -ResourceGroup $outputs.resource_group_name.value `
                -BackendName $outputs.backend_app_name.value `
                -FrontendName $outputs.frontend_app_name.value

            Write-Host ""
            Write-Success "=============================================="
            Write-Success "FULL DEPLOYMENT COMPLETE!"
            Write-Success "=============================================="
            Write-Host ""
            Write-Info "Frontend URL: $($outputs.frontend_url.value)"
            Write-Info "Backend URL: $($outputs.backend_url.value)"
            Write-Info "Health Check: $($outputs.backend_url.value)/health"
            Write-Host ""
            Write-Warning "Don't forget to run database migrations!"
            Write-Info "Run: az webapp ssh --name $($outputs.backend_app_name.value) --resource-group $($outputs.resource_group_name.value)"
            Write-Info "Then: npx prisma migrate deploy"
            Write-Host ""
        }
    }
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
