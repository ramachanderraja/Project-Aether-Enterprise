# =============================================================================
# Project Aether - Azure Infrastructure Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "aether"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

# -----------------------------------------------------------------------------
# Container Registry
# -----------------------------------------------------------------------------

variable "acr_sku" {
  description = "SKU for Azure Container Registry"
  type        = string
  default     = "Basic"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be one of: Basic, Standard, Premium"
  }
}

# -----------------------------------------------------------------------------
# App Service Configuration
# -----------------------------------------------------------------------------

variable "app_service_sku" {
  description = "SKU for App Service Plan"
  type        = string
  default     = "B1"

  # Common SKUs:
  # F1   - Free (limited, no always-on)
  # B1   - Basic (cheapest paid, ~$13/month)
  # B2   - Basic (more resources, ~$26/month)
  # S1   - Standard (auto-scale, staging slots, ~$73/month)
  # P1V2 - Premium V2 (better performance, ~$81/month)
  # P1V3 - Premium V3 (latest hardware, ~$138/month)
}

# -----------------------------------------------------------------------------
# Database Configuration
# -----------------------------------------------------------------------------

variable "db_admin_username" {
  description = "PostgreSQL administrator username"
  type        = string
  default     = "aether_admin"
  sensitive   = true
}

variable "db_admin_password" {
  description = "PostgreSQL administrator password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.db_admin_password) >= 12
    error_message = "Database password must be at least 12 characters"
  }
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "aether_db"
}

variable "db_sku_name" {
  description = "SKU for PostgreSQL Flexible Server"
  type        = string
  default     = "B_Standard_B1ms"

  # Common SKUs:
  # B_Standard_B1ms - Burstable (cheapest, ~$12/month)
  # B_Standard_B2s  - Burstable (more memory)
  # GP_Standard_D2s_v3 - General Purpose (~$98/month)
  # MO_Standard_E2s_v3 - Memory Optimized
}

variable "db_storage_mb" {
  description = "Storage size in MB for PostgreSQL"
  type        = number
  default     = 32768 # 32 GB
}

# -----------------------------------------------------------------------------
# Redis Configuration
# -----------------------------------------------------------------------------

variable "redis_sku" {
  description = "SKU for Azure Cache for Redis"
  type        = string
  default     = "Basic"

  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.redis_sku)
    error_message = "Redis SKU must be one of: Basic, Standard, Premium"
  }
}

variable "redis_family" {
  description = "Redis family (C for Basic/Standard, P for Premium)"
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "Redis cache capacity (0-6 for Basic/Standard)"
  type        = number
  default     = 0
}

# -----------------------------------------------------------------------------
# Security Configuration
# -----------------------------------------------------------------------------

variable "jwt_secret" {
  description = "Secret key for JWT token signing"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.jwt_secret) >= 32
    error_message = "JWT secret must be at least 32 characters"
  }
}

# -----------------------------------------------------------------------------
# AI Configuration
# -----------------------------------------------------------------------------

variable "gemini_api_key" {
  description = "Google Gemini API key for AI features"
  type        = string
  default     = ""
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Custom Domain (Optional)
# -----------------------------------------------------------------------------

variable "custom_domain" {
  description = "Custom domain for the application (optional)"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Tags
# -----------------------------------------------------------------------------

variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  common_tags = merge({
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Application = "Project Aether FP&A"
  }, var.additional_tags)
}
