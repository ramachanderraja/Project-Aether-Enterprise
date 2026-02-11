# =============================================================================
# Project Aether - Azure Infrastructure
# Terraform Configuration for Azure App Service Deployment
# =============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }

  # Uncomment to use Azure Storage as backend for state management
  # backend "azurerm" {
  #   resource_group_name  = "tfstate-rg"
  #   storage_account_name = "tfstateaether"
  #   container_name       = "tfstate"
  #   key                  = "aether.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
  skip_provider_registration = true
}

# =============================================================================
# DATA SOURCES
# =============================================================================

data "azurerm_client_config" "current" {}

# =============================================================================
# RANDOM SUFFIX FOR UNIQUE NAMES
# =============================================================================

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# =============================================================================
# RESOURCE GROUP
# =============================================================================

resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location

  tags = local.common_tags
}

# =============================================================================
# VIRTUAL NETWORK (for private connectivity)
# =============================================================================

resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-${var.environment}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = local.common_tags
}

resource "azurerm_subnet" "app_service" {
  name                 = "app-service-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]

  delegation {
    name = "app-service-delegation"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "database" {
  name                 = "database-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]

  service_endpoints = ["Microsoft.Sql"]

  delegation {
    name = "postgres-delegation"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

resource "azurerm_subnet" "redis" {
  name                 = "redis-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.3.0/24"]
}

# =============================================================================
# AZURE CONTAINER REGISTRY
# =============================================================================

resource "azurerm_container_registry" "main" {
  name                = "${replace(var.project_name, "-", "")}${var.environment}acr${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku
  admin_enabled       = true

  tags = local.common_tags
}

# =============================================================================
# POSTGRESQL FLEXIBLE SERVER
# =============================================================================

resource "azurerm_private_dns_zone" "postgres" {
  name                = "${var.project_name}-${var.environment}.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name

  tags = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "postgres-vnet-link"
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id
  resource_group_name   = azurerm_resource_group.main.name
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.project_name}-${var.environment}-psql-${random_string.suffix.result}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  delegated_subnet_id    = azurerm_subnet.database.id
  private_dns_zone_id    = azurerm_private_dns_zone.postgres.id
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password
  zone                   = "1"

  storage_mb = var.db_storage_mb
  sku_name   = var.db_sku_name

  backup_retention_days = 7

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]

  tags = local.common_tags
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "UUID-OSSP,PGCRYPTO"
}

# =============================================================================
# AZURE CACHE FOR REDIS
# =============================================================================

resource "azurerm_redis_cache" "main" {
  name                = "${var.project_name}-${var.environment}-redis-${random_string.suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "volatile-lru"
  }

  tags = local.common_tags
}

# =============================================================================
# KEY VAULT
# =============================================================================

resource "azurerm_key_vault" "main" {
  name                        = "${var.project_name}-${var.environment}-kv-${random_string.suffix.result}"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  sku_name                    = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    key_permissions = [
      "Get", "List", "Create", "Delete", "Update",
    ]

    secret_permissions = [
      "Get", "List", "Set", "Delete",
    ]
  }

  tags = local.common_tags
}

# Store secrets in Key Vault
resource "azurerm_key_vault_secret" "db_connection_string" {
  name         = "database-url"
  value        = "postgresql://${var.db_admin_username}:${var.db_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.db_name}?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "redis-url"
  value        = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}"
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.main.id
}

# =============================================================================
# APP SERVICE PLAN
# =============================================================================

resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-${var.environment}-asp"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = var.app_service_sku

  tags = local.common_tags
}

# =============================================================================
# BACKEND APP SERVICE
# =============================================================================

resource "azurerm_linux_web_app" "backend" {
  name                = "${var.project_name}-${var.environment}-api-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  site_config {
    always_on = var.app_service_sku != "F1" && var.app_service_sku != "B1"

    application_stack {
      docker_image_name        = "aether-backend:latest"
      docker_registry_url      = "https://${azurerm_container_registry.main.login_server}"
      docker_registry_username = azurerm_container_registry.main.admin_username
      docker_registry_password = azurerm_container_registry.main.admin_password
    }

    cors {
      allowed_origins     = ["*"]
      support_credentials = false
    }

    health_check_path = "/health"
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_ENABLE_CI"                    = "true"

    # Database
    "DATABASE_URL" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=database-url)"

    # Redis
    "REDIS_URL" = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=redis-url)"

    # JWT
    "JWT_SECRET"             = "@Microsoft.KeyVault(VaultName=${azurerm_key_vault.main.name};SecretName=jwt-secret)"
    "JWT_EXPIRES_IN"         = "15m"
    "JWT_REFRESH_EXPIRES_IN" = "7d"

    # App Config
    "NODE_ENV" = var.environment == "prod" ? "production" : "development"
    "PORT"     = "3001"

    # AI (optional)
    "GEMINI_API_KEY" = var.gemini_api_key

    # Application Insights
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.main.connection_string
  }

  identity {
    type = "SystemAssigned"
  }

  virtual_network_subnet_id = azurerm_subnet.app_service.id

  tags = local.common_tags

  depends_on = [
    azurerm_key_vault_secret.db_connection_string,
    azurerm_key_vault_secret.redis_connection_string,
    azurerm_key_vault_secret.jwt_secret
  ]
}

# Grant backend access to Key Vault
resource "azurerm_key_vault_access_policy" "backend" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_linux_web_app.backend.identity[0].principal_id

  secret_permissions = [
    "Get", "List"
  ]
}

# =============================================================================
# FRONTEND APP SERVICE
# =============================================================================

resource "azurerm_linux_web_app" "frontend" {
  name                = "${var.project_name}-${var.environment}-web-${random_string.suffix.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id
  https_only          = true

  site_config {
    always_on = var.app_service_sku != "F1" && var.app_service_sku != "B1"

    application_stack {
      docker_image_name        = "aether-frontend:latest"
      docker_registry_url      = "https://${azurerm_container_registry.main.login_server}"
      docker_registry_username = azurerm_container_registry.main.admin_username
      docker_registry_password = azurerm_container_registry.main.admin_password
    }
  }

  app_settings = {
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE" = "false"
    "DOCKER_ENABLE_CI"                    = "true"
    "VITE_API_URL"                        = "https://${azurerm_linux_web_app.backend.default_hostname}"
  }

  tags = local.common_tags
}

# =============================================================================
# APPLICATION INSIGHTS
# =============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-law"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = local.common_tags
}

resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-${var.environment}-ai"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"

  tags = local.common_tags
}

# =============================================================================
# STORAGE ACCOUNT (for file uploads, backups)
# NOTE: Commented out due to GEP Azure policies - can be added later via
# Azure Portal with proper policy compliance
# =============================================================================

# resource "azurerm_storage_account" "main" {
#   name                     = "${replace(var.project_name, "-", "")}${var.environment}st${random_string.suffix.result}"
#   resource_group_name      = azurerm_resource_group.main.name
#   location                 = azurerm_resource_group.main.location
#   account_tier             = "Standard"
#   account_replication_type = "LRS"
#   min_tls_version          = "TLS1_2"
#
#   # GEP Policy compliance: Disable public access
#   public_network_access_enabled   = false
#   allow_nested_items_to_be_public = false
#
#   # Network rules - deny by default
#   network_rules {
#     default_action             = "Deny"
#     bypass                     = ["AzureServices"]
#     virtual_network_subnet_ids = [azurerm_subnet.app_service.id]
#   }
#
#   blob_properties {
#     cors_rule {
#       allowed_headers    = ["*"]
#       allowed_methods    = ["GET", "POST", "PUT"]
#       allowed_origins    = ["*"]
#       exposed_headers    = ["*"]
#       max_age_in_seconds = 3600
#     }
#   }
#
#   tags = local.common_tags
# }
#
# resource "azurerm_storage_container" "uploads" {
#   name                  = "uploads"
#   storage_account_name  = azurerm_storage_account.main.name
#   container_access_type = "private"
# }
#
# resource "azurerm_storage_container" "backups" {
#   name                  = "backups"
#   storage_account_name  = azurerm_storage_account.main.name
#   container_access_type = "private"
# }
