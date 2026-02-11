# Update Container Apps to pull latest images from ACR
# Run this script after pushing code to trigger deployment

$ErrorActionPreference = "Stop"

$RESOURCE_GROUP = "rg-aether-ca-dev"
$API_APP = "ca-aether-ca-dev-api"
$WEB_APP = "ca-aether-ca-dev-web"
$ACR = "acraetherdev.azurecr.io"

Write-Host "Updating Container Apps to pull latest images..." -ForegroundColor Cyan

# Update API Container App
Write-Host "`nUpdating API ($API_APP)..." -ForegroundColor Yellow
az containerapp update `
    --name $API_APP `
    --resource-group $RESOURCE_GROUP `
    --image "$ACR/aether-backend:latest"

if ($LASTEXITCODE -eq 0) {
    Write-Host "API updated successfully" -ForegroundColor Green
} else {
    Write-Host "API update failed" -ForegroundColor Red
}

# Update Web Container App
Write-Host "`nUpdating Web ($WEB_APP)..." -ForegroundColor Yellow
az containerapp update `
    --name $WEB_APP `
    --resource-group $RESOURCE_GROUP `
    --image "$ACR/aether-frontend:latest"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Web updated successfully" -ForegroundColor Green
} else {
    Write-Host "Web update failed" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Container Apps URLs:" -ForegroundColor Cyan
Write-Host "  Web: https://ca-aether-ca-dev-web.wonderfulsea-4938652c.westus2.azurecontainerapps.io"
Write-Host "  API: https://ca-aether-ca-dev-api.wonderfulsea-4938652c.westus2.azurecontainerapps.io"
Write-Host "========================================" -ForegroundColor Cyan
