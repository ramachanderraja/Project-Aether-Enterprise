# Project Aether - Administration Guide

## Table of Contents
1. [Application URLs](#application-urls)
2. [First-Time Login](#first-time-login)
3. [Creating User Accounts](#creating-user-accounts)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Uploading Historical Data](#uploading-historical-data)
6. [Database Migrations](#database-migrations)
7. [Monitoring & Logs](#monitoring--logs)
8. [Troubleshooting](#troubleshooting)

---

## Application URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| **Frontend** | https://aether-dev-web-04w9l0.azurewebsites.net | Main application UI |
| **Backend API** | https://aether-dev-api-04w9l0.azurewebsites.net | REST API |
| **Health Check** | https://aether-dev-api-04w9l0.azurewebsites.net/health | API health status |
| **Azure Portal** | https://portal.azure.com | Infrastructure management |

---

## First-Time Login

### Default Admin Account
When the application is first deployed, you need to create an admin account:

1. **Navigate to the application**: https://aether-dev-web-04w9l0.azurewebsites.net
2. **Click "Sign Up"** or "Register" on the login page
3. **Create the first admin account**:
   - Email: Your corporate email (e.g., `admin@gep.com`)
   - Password: Choose a strong password (min 8 characters, include uppercase, lowercase, number, special char)
   - Name: Your full name

### Initial Admin Setup via API (Alternative)
If registration is disabled, create admin via API:

```bash
# Using curl
curl -X POST https://aether-dev-api-04w9l0.azurewebsites.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gep.com",
    "password": "YourSecurePassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Login Process
1. Go to https://aether-dev-web-04w9l0.azurewebsites.net
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to the dashboard

---

## Creating User Accounts

### Method 1: Self-Registration (If Enabled)
Users can register themselves:
1. Navigate to the application URL
2. Click "Sign Up" / "Register"
3. Fill in required details
4. Verify email (if email verification is enabled)

### Method 2: Admin Creates Users (Recommended for Teams)

#### Via Admin Dashboard
1. Login as an admin user
2. Navigate to **Settings** > **User Management**
3. Click **"Add User"**
4. Fill in user details:
   - Email address
   - First name
   - Last name
   - Role (Admin, Manager, Analyst, Viewer)
5. Click **"Create User"**
6. User will receive an email with login instructions

#### Via API (Bulk Creation)
```bash
# Create a single user
curl -X POST https://aether-dev-api-04w9l0.azurewebsites.net/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "user@gep.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ANALYST"
  }'
```

### Bulk User Import
For large teams, prepare a CSV file:

```csv
email,firstName,lastName,role
john.doe@gep.com,John,Doe,ANALYST
jane.smith@gep.com,Jane,Smith,MANAGER
bob.wilson@gep.com,Bob,Wilson,VIEWER
```

Upload via Settings > User Management > Import Users

---

## User Roles & Permissions

| Role | Dashboard | View Data | Edit Data | Upload Data | Manage Users | System Settings |
|------|-----------|-----------|-----------|-------------|--------------|-----------------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MANAGER** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **ANALYST** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **VIEWER** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### Role Descriptions
- **ADMIN**: Full system access, user management, settings configuration
- **MANAGER**: Can view/edit all data, create scenarios, approve forecasts
- **ANALYST**: Can view/edit data, upload files, create reports
- **VIEWER**: Read-only access to dashboards and reports

---

## Uploading Historical Data

### Supported Data Types
Project Aether accepts the following data categories:

1. **Revenue Data** - Sales, subscriptions, service revenue
2. **Cost Data** - COGS, operating expenses, overhead
3. **Headcount Data** - Employee counts, salaries, benefits
4. **Department Budgets** - Budget allocations by department
5. **Product Data** - Product catalog, pricing, margins
6. **Customer Data** - Customer segments, retention rates
7. **Market Data** - Market size, growth rates, competition

### Data Upload Methods

#### Method 1: Web Interface (Recommended)
1. Login to the application
2. Navigate to **Data Fabric** > **Import Data**
3. Select data type (Revenue, Costs, etc.)
4. Click **"Upload File"**
5. Select your CSV/Excel file
6. Map columns to system fields
7. Review and confirm import
8. Click **"Import"**

#### Method 2: API Upload
```bash
curl -X POST https://aether-dev-api-04w9l0.azurewebsites.net/api/import/revenue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@revenue_data.csv"
```

### Data Templates

Download templates from: **Data Fabric** > **Templates**

Or use these CSV formats:

#### Revenue Data Template
```csv
date,product_id,product_name,region,channel,quantity,unit_price,total_revenue,currency
2024-01-01,PROD001,Enterprise License,North America,Direct,100,1000.00,100000.00,USD
2024-01-01,PROD002,Professional License,EMEA,Partner,250,500.00,125000.00,USD
```

#### Cost Data Template
```csv
date,cost_center,department,category,subcategory,amount,currency,description
2024-01-01,CC001,Engineering,Personnel,Salaries,500000.00,USD,Engineering salaries
2024-01-01,CC002,Sales,Operations,Travel,25000.00,USD,Sales travel expenses
```

#### Headcount Data Template
```csv
date,department,role,level,location,headcount,avg_salary,total_cost
2024-01-01,Engineering,Software Engineer,Senior,US,25,150000,3750000
2024-01-01,Sales,Account Executive,Mid,UK,15,80000,1200000
```

### Data Validation Rules
- Dates must be in YYYY-MM-DD format
- Currency codes must be ISO 4217 (USD, EUR, GBP, etc.)
- Numeric fields cannot be empty (use 0 if needed)
- Required fields cannot be null

### Import Best Practices
1. **Start with small files** - Test with 100 rows first
2. **Check date formats** - Ensure consistency
3. **Validate currencies** - Use standard codes
4. **Remove duplicates** - Clean data before upload
5. **Backup existing data** - Before large imports

---

## Database Migrations

### Running Migrations (First-Time Setup)

After deploying the application, you need to run database migrations:

#### Option 1: Via Azure Portal
1. Go to Azure Portal > App Services > aether-dev-api-04w9l0
2. Click **SSH** in the left menu
3. Run:
```bash
npx prisma migrate deploy
npx prisma db seed  # Optional: seed with sample data
```

#### Option 2: Via Azure CLI
```bash
# Connect to the backend container
az webapp ssh --name aether-dev-api-04w9l0 --resource-group aether-dev-rg

# Inside the container, run:
npx prisma migrate deploy
```

#### Option 3: Via Kudu Console
1. Go to: https://aether-dev-api-04w9l0.scm.azurewebsites.net
2. Navigate to Debug Console > Bash
3. Run migration commands

### Checking Migration Status
```bash
npx prisma migrate status
```

---

## Monitoring & Logs

### Azure Application Insights
1. Go to Azure Portal
2. Navigate to: **aether-dev-rg** > **aether-dev-ai**
3. View:
   - Live metrics
   - Failures
   - Performance
   - Usage analytics

### Container Logs
```bash
# View backend logs
az webapp log tail --name aether-dev-api-04w9l0 --resource-group aether-dev-rg

# View frontend logs
az webapp log tail --name aether-dev-web-04w9l0 --resource-group aether-dev-rg
```

### Log Analytics Queries
In Azure Portal > Log Analytics > aether-dev-law:

```kusto
// Application errors in last 24 hours
AppExceptions
| where TimeGenerated > ago(24h)
| order by TimeGenerated desc

// Request performance
AppRequests
| where TimeGenerated > ago(1h)
| summarize avg(DurationMs) by Name
| order by avg_DurationMs desc
```

---

## Troubleshooting

### Common Issues

#### 1. "Application Error" on Frontend
**Cause**: Container still starting or crashed
**Solution**:
```bash
# Restart the app
az webapp restart --name aether-dev-web-04w9l0 --resource-group aether-dev-rg

# Wait 2-3 minutes and try again
```

#### 2. "504 Gateway Timeout"
**Cause**: Backend not responding
**Solution**:
```bash
# Check backend status
az webapp show --name aether-dev-api-04w9l0 --resource-group aether-dev-rg --query state

# Restart backend
az webapp restart --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
```

#### 3. "Database Connection Error"
**Cause**: PostgreSQL not accessible or credentials wrong
**Solution**:
- Verify database is running in Azure Portal
- Check connection string in Key Vault
- Ensure VNet integration is working

#### 4. "Invalid Token" or "Unauthorized"
**Cause**: JWT token expired or invalid
**Solution**:
- Clear browser cookies
- Login again
- Check JWT secret in Key Vault

#### 5. Cannot Upload Files
**Cause**: File size limit or format issue
**Solution**:
- Check file is under 50MB
- Ensure CSV format is correct
- Check for special characters in headers

### Health Check Endpoints
```bash
# Check backend health
curl https://aether-dev-api-04w9l0.azurewebsites.net/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Restarting Services
```bash
# Restart both services
az webapp restart --name aether-dev-api-04w9l0 --resource-group aether-dev-rg
az webapp restart --name aether-dev-web-04w9l0 --resource-group aether-dev-rg
```

### Scaling Up (If Performance Issues)
```bash
# Scale up the App Service Plan
az appservice plan update --name aether-dev-asp --resource-group aether-dev-rg --sku S1
```

---

## Sharing with Your Team

### Quick Start for Team Members

1. **Share the application URL**:
   ```
   https://aether-dev-web-04w9l0.azurewebsites.net
   ```

2. **Create accounts** for each team member (see Creating User Accounts section)

3. **Assign appropriate roles** based on responsibilities

4. **Share data templates** so team can prepare their data

5. **Schedule training session** to walk through features

### Team Onboarding Checklist
- [ ] Create user accounts for all team members
- [ ] Assign roles based on job functions
- [ ] Share application URL and login credentials
- [ ] Provide data template files
- [ ] Schedule demo/training session
- [ ] Set up communication channel (Teams/Slack) for support
- [ ] Document department-specific workflows

---

## Support Contacts

| Issue Type | Contact |
|------------|---------|
| Technical Issues | IT Support / DevOps Team |
| Access Requests | System Admin (you) |
| Data Questions | FP&A Team Lead |
| Feature Requests | Product Owner |

---

## Azure Resources Reference

| Resource | Name | Purpose |
|----------|------|---------|
| Resource Group | aether-dev-rg | Container for all resources |
| App Service Plan | aether-dev-asp | Hosts web apps |
| Backend API | aether-dev-api-04w9l0 | REST API service |
| Frontend | aether-dev-web-04w9l0 | React web application |
| PostgreSQL | aether-dev-psql-04w9l0 | Database server |
| Redis Cache | aether-dev-redis-04w9l0 | Caching layer |
| Key Vault | aether-dev-kv-04w9l0 | Secrets management |
| Container Registry | aetherdevacr04w9l0 | Docker images |
| Application Insights | aether-dev-ai | Monitoring |

---

*Last Updated: February 2026*
*Version: 1.0*
