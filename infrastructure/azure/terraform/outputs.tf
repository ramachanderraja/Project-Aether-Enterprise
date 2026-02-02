# =============================================================================
# Project Aether - Azure Infrastructure Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# Resource Group
# -----------------------------------------------------------------------------

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------

output "acr_login_server" {
  description = "Azure Container Registry login server"
  value       = azurerm_container_registry.main.login_server
}

output "acr_admin_username" {
  description = "Azure Container Registry admin username"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "Azure Container Registry admin password"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

# -----------------------------------------------------------------------------
# App Service URLs
# -----------------------------------------------------------------------------

output "backend_url" {
  description = "URL of the backend API"
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "frontend_url" {
  description = "URL of the frontend application"
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "backend_app_name" {
  description = "Name of the backend App Service"
  value       = azurerm_linux_web_app.backend.name
}

output "frontend_app_name" {
  description = "Name of the frontend App Service"
  value       = azurerm_linux_web_app.frontend.name
}

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------

output "postgresql_server_name" {
  description = "PostgreSQL server name"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "postgresql_fqdn" {
  description = "PostgreSQL fully qualified domain name"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "database_name" {
  description = "Name of the PostgreSQL database"
  value       = azurerm_postgresql_flexible_server_database.main.name
}

# -----------------------------------------------------------------------------
# Redis
# -----------------------------------------------------------------------------

output "redis_hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.main.hostname
}

output "redis_ssl_port" {
  description = "Redis SSL port"
  value       = azurerm_redis_cache.main.ssl_port
}

# -----------------------------------------------------------------------------
# Key Vault
# -----------------------------------------------------------------------------

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

# -----------------------------------------------------------------------------
# Application Insights
# -----------------------------------------------------------------------------

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Storage
# -----------------------------------------------------------------------------

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.main.name
}

output "storage_primary_connection_string" {
  description = "Storage account primary connection string"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Deployment Commands
# -----------------------------------------------------------------------------

output "docker_login_command" {
  description = "Command to login to Azure Container Registry"
  value       = "az acr login --name ${azurerm_container_registry.main.name}"
}

output "deployment_instructions" {
  description = "Instructions for deploying the application"
  value       = <<-EOT

    ============================================================
    DEPLOYMENT INSTRUCTIONS
    ============================================================

    1. Login to Azure Container Registry:
       az acr login --name ${azurerm_container_registry.main.name}

    2. Build and push Backend image:
       cd backend
       docker build -t ${azurerm_container_registry.main.login_server}/aether-backend:latest .
       docker push ${azurerm_container_registry.main.login_server}/aether-backend:latest

    3. Build and push Frontend image:
       cd frontend
       docker build -t ${azurerm_container_registry.main.login_server}/aether-frontend:latest .
       docker push ${azurerm_container_registry.main.login_server}/aether-frontend:latest

    4. Restart App Services to pull new images:
       az webapp restart --name ${azurerm_linux_web_app.backend.name} --resource-group ${azurerm_resource_group.main.name}
       az webapp restart --name ${azurerm_linux_web_app.frontend.name} --resource-group ${azurerm_resource_group.main.name}

    5. Run database migrations:
       az webapp ssh --name ${azurerm_linux_web_app.backend.name} --resource-group ${azurerm_resource_group.main.name}
       # Then run: npx prisma migrate deploy

    ============================================================
    ACCESS URLS
    ============================================================

    Frontend: https://${azurerm_linux_web_app.frontend.default_hostname}
    Backend API: https://${azurerm_linux_web_app.backend.default_hostname}
    Health Check: https://${azurerm_linux_web_app.backend.default_hostname}/health

    ============================================================

  EOT
}
