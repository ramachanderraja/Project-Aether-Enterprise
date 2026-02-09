# =============================================================================
# Deploy to Azure Container Apps
# =============================================================================
# Run this script after GitHub Actions builds and pushes images to ACR
# Usage: .\deploy-container-apps.ps1 [commit-sha]
# If no commit-sha provided, uses 'latest' tag
# =============================================================================

param(
    [string]$CommitSha = "latest"
)

$ACR = "aetherdevacr04w9l0.azurecr.io"
$RG = "aether-dev-rg"

Write-Host "=========================================="
Write-Host "🚀 Deploying to Azure Container Apps"
Write-Host "=========================================="
Write-Host ""
Write-Host "Image tag: $CommitSha"
Write-Host ""

# Deploy backend
Write-Host "Deploying backend..."
az containerapp update `
    --name aether-api `
    --resource-group $RG `
    --image "$ACR/aether-backend:$CommitSha"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend deployment failed"
    exit 1
}
Write-Host "✅ Backend deployed"

# Deploy frontend
Write-Host "Deploying frontend..."
az containerapp update `
    --name aether-web `
    --resource-group $RG `
    --image "$ACR/aether-frontend:$CommitSha"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend deployment failed"
    exit 1
}
Write-Host "✅ Frontend deployed"

Write-Host ""
Write-Host "=========================================="
Write-Host "✅ Deployment Complete!"
Write-Host "=========================================="
Write-Host ""
Write-Host "URLs:"
Write-Host "  Frontend: https://aether-web.orangesea-d82907cf.westus2.azurecontainerapps.io"
Write-Host "  Backend:  https://aether-api.orangesea-d82907cf.westus2.azurecontainerapps.io"
Write-Host "  API Docs: https://aether-api.orangesea-d82907cf.westus2.azurecontainerapps.io/docs"
Write-Host "=========================================="
