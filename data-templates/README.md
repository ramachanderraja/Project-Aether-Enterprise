# Data Templates for Project Aether

This directory contains CSV templates for importing historical data into Project Aether.

## Import Order

**IMPORTANT**: Import data in this exact order to maintain referential integrity:

1. `01_cost_centers.csv` - Cost center hierarchy
2. `02_vendors.csv` - Vendor master data
3. `03_financial_metrics.csv` - Revenue, EBITDA, and other metrics
4. `04_costs.csv` - Detailed cost records
5. `05_deals.csv` - Sales pipeline/opportunities
6. `06_deal_stage_history.csv` - Deal stage progression
7. `07_scenarios.csv` - Budget and forecast scenarios
8. `08_anomalies.csv` - Historical anomalies (optional)
9. `09_sow_mapping.csv` - SOW master data (NEW)
10. `10_subcategory_contributions.csv` - Sub-category contribution breakdown (NEW)
11. `11_pipeline_subcategory_breakdown.csv` - Pipeline sub-category breakdown (NEW)

## File Specifications

### General Rules

- **Encoding**: UTF-8
- **Delimiter**: Comma (,)
- **Date Format**: YYYY-MM-DD (ISO 8601)
- **Decimal Format**: Use period (.) as decimal separator
- **Currency**: ISO 4217 codes (USD, EUR, GBP, etc.)
- **Boolean**: true/false (lowercase)
- **Null Values**: Leave field empty (not "NULL" or "null")

### Required vs Optional Fields

- Fields marked with `*` are required
- Fields marked with `?` are optional
- Fields marked with `^` are system-generated (leave empty for auto-generation)

## Template Details

### 01_cost_centers.csv

Hierarchical cost center structure.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| code | string | * | Unique cost center code |
| name | string | * | Display name |
| parent_code | string | ? | Parent cost center code (for hierarchy) |
| is_active | boolean | ? | Active status (default: true) |

### 02_vendors.csv

Vendor/supplier master data.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | * | Vendor name |
| category | string | ? | Vendor category |
| contract_start | date | ? | Contract start date |
| contract_end | date | ? | Contract end date |
| payment_terms | string | ? | e.g., "Net 30", "Net 60" |
| risk_score | string | ? | low, medium, high |
| is_active | boolean | ? | Active status |

### 03_financial_metrics.csv

Core financial metrics (revenue, EBITDA, etc.).

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| metric_type | string | * | Type: revenue, cost, ebitda, gross_margin, etc. |
| value | decimal | * | Metric value |
| currency | string | ? | ISO currency code (default: USD) |
| period_start | date | * | Period start date |
| period_end | date | * | Period end date |
| region | string | ? | Geographic region |
| lob | string | ? | Line of Business |
| cost_center_code | string | ? | Associated cost center |
| source | string | ? | Data source system |
| is_actual | boolean | ? | Actual (true) or Budget (false) |

### 04_costs.csv

Detailed cost/expense records.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| category | string | * | Cost category |
| subcategory | string | ? | Cost subcategory |
| vendor_name | string | ? | Vendor name (must exist in vendors) |
| amount | decimal | * | Cost amount |
| currency | string | ? | ISO currency code |
| period_date | date | * | Cost period/date |
| cost_center_code | string | ? | Cost center code |
| description | string | ? | Description |
| is_recurring | boolean | ? | Recurring cost flag |

### 05_deals.csv

Sales pipeline/opportunity data.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| external_id | string | ? | CRM ID (Salesforce, etc.) |
| name | string | * | Deal/opportunity name |
| account_name | string | * | Customer/account name |
| amount | decimal | * | Deal value |
| currency | string | ? | ISO currency code |
| stage | string | * | Current stage |
| probability | decimal | * | Win probability (0-100) |
| close_date | date | ? | Expected close date |
| owner_name | string | ? | Sales rep name |
| region | string | ? | Geographic region |
| lob | string | ? | Line of Business |
| product_line | string | ? | Product/service line |
| risk_level | string | ? | low, medium, high |
| last_activity_at | date | ? | Last activity date |

### 06_deal_stage_history.csv

Historical stage progression for deals.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| deal_external_id | string | * | Deal external ID or name |
| stage | string | * | Stage name |
| entered_at | datetime | * | When deal entered stage |
| exited_at | datetime | ? | When deal left stage |
| duration_days | integer | ? | Days in stage |

### 07_scenarios.csv

Budget, forecast, and what-if scenarios.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| name | string | * | Scenario name |
| description | string | ? | Description |
| type | string | * | budget, forecast, what_if, strategic |
| status | string | ? | draft, in_review, approved, active |
| owner_email | string | * | Owner's email address |
| time_horizon_start | date | ? | Scenario start date |
| time_horizon_end | date | ? | Scenario end date |
| assumptions | json | ? | JSON object with assumptions |
| projections | json | ? | JSON object with projections |

### 08_anomalies.csv

Historical anomalies/alerts (optional).

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| severity | string | * | critical, high, medium, low |
| category | string | * | cost_spike, revenue_drop, variance, pattern |
| metric_name | string | * | Affected metric |
| account_code | string | ? | Related account code |
| description | string | * | Anomaly description |
| current_value | decimal | * | Actual value |
| expected_value | decimal | * | Expected/baseline value |
| variance_percent | decimal | * | Variance percentage |
| detected_at | datetime | * | Detection timestamp |
| status | string | ? | unresolved, investigating, resolved, dismissed |
| notes | string | ? | Resolution notes |

## Sample Data

Each template includes 5-10 sample rows to illustrate the expected format. Delete sample data before importing your real data.

## Validation

Before importing, validate your data:

```bash
# Using the validation script
node scripts/validate-import-data.js data-templates/

# Or manually check
head -5 data-templates/03_financial_metrics.csv
```

## Troubleshooting

### Common Errors

1. **"Foreign key constraint failed"**
   - Ensure referenced records exist (e.g., cost center before costs)
   - Check for typos in reference codes

2. **"Duplicate key value"**
   - Check for duplicate records in your data
   - Use `external_id` to enable upsert behavior

3. **"Invalid date format"**
   - Ensure dates are in YYYY-MM-DD format
   - Check for empty dates in required fields

4. **"Number format error"**
   - Use period (.) as decimal separator
   - Remove currency symbols from amounts
   - Remove thousand separators

### 09_sow_mapping.csv (NEW)

SOW master data for ARR Analytics and Sales Performance.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| SOW_ID | string | * | Unique SOW identifier |
| Vertical | string | * | Industry vertical |
| Region | string | * | Geographic region |
| Fees_Type | string | * | Fee classification: Fees or Travel |
| Revenue_Type | string | * | Revenue type: License or Implementation |
| Segment_Type | string | * | Customer segment: Enterprise or SMB |
| Start_Date | date | * | SOW start date |
| End_Date | date | * | SOW end date |

### 10_subcategory_contributions.csv (NEW)

Sub-category contribution breakdown for Closed ACV by SOW.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| SOW_ID | string | * | SOW identifier (must exist in 09_sow_mapping) |
| Year | integer | * | Year for the contribution split |
| Product_Sub_Category | string | * | Product sub-category name |
| Contribution_Pct | decimal | * | Contribution percentage (0.0-1.0) |

**Note**: Contributions for each SOW_ID + Year must sum to 1.0 (100%).

### 11_pipeline_subcategory_breakdown.csv (NEW)

Pipeline sub-category breakdown for weighted pipeline calculations.

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| Snapshot_Month | string | * | Snapshot month (YYYY-MM) |
| Pipeline_Deal_ID | string | * | Pipeline deal identifier |
| Product_Sub_Category | string | * | Product sub-category name |
| Contribution_Pct | decimal | * | Contribution percentage (0.0-1.0) |

**Note**: Contributions for each Snapshot_Month + Pipeline_Deal_ID must sum to 1.0 (100%).

---

## Recent Updates (v2.0)

### New Features Added

1. **SOW Mapping** - Master data for SOW IDs with metadata (Vertical, Region, Fees_Type, Revenue_Type, Segment_Type)

2. **Sub-Category Breakdown** - Product sub-category contribution percentages for:
   - Closed ACV (by SOW_ID and Year)
   - Pipeline (by Snapshot Month and Deal ID)

3. **Quantum/SMART Platform Classification** - Platform filter in ARR Analytics with:
   - Quantum_SMART column value
   - Quantum_GoLive_Date (takes precedence for classification)

4. **Revenue Type Filter** - Fees vs Travel filter for ARR by Products tab

5. **Schedule Change** - New ARR Movement category for schedule-based ARR changes

6. **Sold By Filter** - Sales, GD, TSO classification for Sales Performance

7. **Manager Quota Logic** - Manager attainment calculated against their OWN quota, not team aggregate

### Product Sub-Categories

Valid product sub-categories for templates 10 and 11:
- Core Platform
- Business Intelligence
- Advanced Analytics
- Supplier Management
- Contract Management
- Spend Analytics
- Savings Tracking
- Risk Management

### Product Category Mapping

Sub-categories roll up to Product Categories as follows:
- **Platform**: Core Platform, Business Intelligence
- **Analytics**: Advanced Analytics, Spend Analytics, Savings Tracking
- **Supplier Solutions**: Supplier Management
- **Contract Solutions**: Contract Management
- **Risk & Compliance**: Risk Management

---

## Need Help?

- See `/docs/IMPLEMENTATION-PLAN.md` for full implementation guide
- Check `/docs/DATABASE-SCHEMA.md` for data model details
