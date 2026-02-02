#!/bin/bash
# =============================================================================
# Project Aether - Azure Deployment Script (Bash)
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Functions
info() { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
TERRAFORM_DIR="$SCRIPT_DIR/terraform"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Default values
ACTION=""
ENVIRONMENT="dev"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--action)
            ACTION="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 -a <action> [-e <environment>]"
            echo ""
            echo "Actions:"
            echo "  init        - Initialize Terraform"
            echo "  plan        - Plan infrastructure changes"
            echo "  apply       - Apply infrastructure changes"
            echo "  destroy     - Destroy all resources"
            echo "  build       - Build Docker images"
            echo "  push        - Push images to ACR"
            echo "  deploy-all  - Full deployment pipeline"
            echo ""
            echo "Environments: dev, staging, prod"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

if [ -z "$ACTION" ]; then
    error "Action is required. Use -h for help."
fi

# Check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        error "Azure CLI is not installed. Install from: https://docs.microsoft.com/cli/azure/install-azure-cli"
    fi

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        error "Terraform is not installed. Install from: https://www.terraform.io/downloads"
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Install from: https://docs.docker.com/get-docker/"
    fi

    # Check Azure login
    if ! az account show &> /dev/null; then
        warning "Not logged in to Azure. Running 'az login'..."
        az login
    fi

    SUBSCRIPTION=$(az account show --query name -o tsv)
    success "All prerequisites met!"
    info "Using Azure subscription: $SUBSCRIPTION"
}

# Initialize Terraform
init_terraform() {
    info "Initializing Terraform..."
    cd "$TERRAFORM_DIR"
    terraform init
    success "Terraform initialized!"
}

# Plan Terraform
plan_terraform() {
    info "Planning Terraform changes for $ENVIRONMENT..."
    cd "$TERRAFORM_DIR"

    if [ ! -f "terraform.tfvars" ]; then
        warning "terraform.tfvars not found. Creating from example..."
        cp terraform.tfvars.example terraform.tfvars
        warning "Please edit terraform.tfvars with your values and run again."
        return
    fi

    terraform plan -var="environment=$ENVIRONMENT" -out="tfplan"
    success "Plan complete! Review the changes above."
}

# Apply Terraform
apply_terraform() {
    info "Applying Terraform changes for $ENVIRONMENT..."
    cd "$TERRAFORM_DIR"

    if [ -f "tfplan" ]; then
        terraform apply "tfplan"
    else
        terraform apply -var="environment=$ENVIRONMENT" -auto-approve
    fi

    success "Infrastructure deployed!"
}

# Destroy Terraform
destroy_terraform() {
    warning "This will destroy all resources in $ENVIRONMENT!"
    read -p "Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
        info "Cancelled."
        return
    fi

    cd "$TERRAFORM_DIR"
    terraform destroy -var="environment=$ENVIRONMENT" -auto-approve
    success "Resources destroyed!"
}

# Build Docker images
build_images() {
    cd "$TERRAFORM_DIR"
    ACR_LOGIN_SERVER=$(terraform output -raw acr_login_server 2>/dev/null)

    if [ -z "$ACR_LOGIN_SERVER" ]; then
        error "Infrastructure not deployed. Run 'deploy.sh -a apply' first."
    fi

    info "Building Docker images..."

    # Build backend
    info "Building backend image..."
    cd "$BACKEND_DIR"
    docker build -t "${ACR_LOGIN_SERVER}/aether-backend:latest" \
                 -t "${ACR_LOGIN_SERVER}/aether-backend:$ENVIRONMENT" .
    success "Backend image built!"

    # Build frontend
    info "Building frontend image..."
    cd "$FRONTEND_DIR"
    docker build -t "${ACR_LOGIN_SERVER}/aether-frontend:latest" \
                 -t "${ACR_LOGIN_SERVER}/aether-frontend:$ENVIRONMENT" .
    success "Frontend image built!"

    success "All images built!"
}

# Push Docker images
push_images() {
    cd "$TERRAFORM_DIR"
    ACR_LOGIN_SERVER=$(terraform output -raw acr_login_server 2>/dev/null)
    ACR_NAME=${ACR_LOGIN_SERVER%.azurecr.io}

    info "Logging in to Azure Container Registry..."
    az acr login --name "$ACR_NAME"

    info "Pushing images to ACR..."
    docker push "${ACR_LOGIN_SERVER}/aether-backend:latest"
    docker push "${ACR_LOGIN_SERVER}/aether-backend:$ENVIRONMENT"
    docker push "${ACR_LOGIN_SERVER}/aether-frontend:latest"
    docker push "${ACR_LOGIN_SERVER}/aether-frontend:$ENVIRONMENT"

    success "Images pushed to ACR!"
}

# Restart App Services
restart_apps() {
    cd "$TERRAFORM_DIR"
    RG=$(terraform output -raw resource_group_name)
    BACKEND_NAME=$(terraform output -raw backend_app_name)
    FRONTEND_NAME=$(terraform output -raw frontend_app_name)

    info "Restarting App Services..."
    az webapp restart --name "$BACKEND_NAME" --resource-group "$RG"
    az webapp restart --name "$FRONTEND_NAME" --resource-group "$RG"
    success "App Services restarted!"
}

# Full deployment
deploy_all() {
    init_terraform
    apply_terraform
    build_images
    push_images
    restart_apps

    cd "$TERRAFORM_DIR"
    FRONTEND_URL=$(terraform output -raw frontend_url)
    BACKEND_URL=$(terraform output -raw backend_url)
    BACKEND_NAME=$(terraform output -raw backend_app_name)
    RG=$(terraform output -raw resource_group_name)

    echo ""
    success "=============================================="
    success "FULL DEPLOYMENT COMPLETE!"
    success "=============================================="
    echo ""
    info "Frontend URL: $FRONTEND_URL"
    info "Backend URL: $BACKEND_URL"
    info "Health Check: ${BACKEND_URL}/health"
    echo ""
    warning "Don't forget to run database migrations!"
    info "Run: az webapp ssh --name $BACKEND_NAME --resource-group $RG"
    info "Then: npx prisma migrate deploy"
    echo ""
}

# Main execution
check_prerequisites

case $ACTION in
    init)
        init_terraform
        ;;
    plan)
        init_terraform
        plan_terraform
        ;;
    apply)
        init_terraform
        apply_terraform

        cd "$TERRAFORM_DIR"
        FRONTEND_URL=$(terraform output -raw frontend_url)
        BACKEND_URL=$(terraform output -raw backend_url)

        echo ""
        success "=============================================="
        success "DEPLOYMENT COMPLETE!"
        success "=============================================="
        echo ""
        info "Frontend URL: $FRONTEND_URL"
        info "Backend URL: $BACKEND_URL"
        echo ""
        ;;
    destroy)
        init_terraform
        destroy_terraform
        ;;
    build)
        build_images
        ;;
    push)
        push_images
        ;;
    deploy-all)
        deploy_all
        ;;
    *)
        error "Unknown action: $ACTION"
        ;;
esac
