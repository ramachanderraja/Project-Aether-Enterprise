# User Stories: Revenue & Profitability Module

## Module Overview

**Module ID:** REV
**Module Name:** Revenue & Profitability Analytics
**Priority:** P0 (Critical)
**Epic:** Revenue Intelligence

---

## US-REV-001: ARR Waterfall Chart

### Story

**As a** CFO
**I want to** see a waterfall chart showing ARR movement
**So that** I can understand the components of revenue change (new, expansion, churn, contraction)

### Description

Display an interactive waterfall chart showing how Annual Recurring Revenue changes from opening balance through various movement categories to closing balance.

### Acceptance Criteria

```gherkin
Feature: ARR Waterfall Chart

  Scenario: View ARR waterfall
    Given I navigate to the Revenue module
    When the ARR Waterfall section loads
    Then I should see a waterfall chart with bars:
      | Category | Amount | Color | Running Total |
      | Opening ARR | $50.4M | Blue | $50.4M |
      | + New Sales | +$5.2M | Green | $55.6M |
      | + Expansion | +$3.8M | Green | $59.4M |
      | - Churn | -$2.1M | Red | $57.3M |
      | - Contraction | -$800K | Red | $56.5M |
      | = Closing ARR | $56.5M | Blue | $56.5M |

  Scenario: Hover for details
    Given I hover over the "Churn" bar
    Then I should see a tooltip with:
      | Field | Value |
      | Churned Revenue | $2.1M |
      | Customers Lost | 12 |
      | Top Reasons | Price (4), Competitor (3), Other (5) |
      | MoM Change | -$300K vs prior month |

  Scenario: Click for drill-down
    Given I click on the "New Sales" bar
    When the detail panel opens
    Then I should see:
      - List of new deals closed in period
      - Breakdown by region
      - Breakdown by product line
      - Comparison to forecast

  Scenario: Toggle time periods
    Given I can select different periods
    When I change from "Monthly" to "Quarterly"
    Then the waterfall should recalculate for Q4
    And amounts should aggregate appropriately
    And the chart should animate smoothly

  Scenario: Net Revenue Retention calculation
    Given the waterfall is displayed
    Then I should see NRR calculated as:
      - NRR = (Opening + Expansion - Contraction - Churn) / Opening
      - Displayed as percentage (e.g., "NRR: 112%")
      - With trend indicator vs. prior period
```

### Technical Requirements

- [ ] Create `/api/v1/revenue/waterfall` endpoint
- [ ] Calculate ARR movements from transaction data
- [ ] Implement waterfall chart component
- [ ] Support drill-down to underlying data
- [ ] Add period comparison capability

### Waterfall Data Model

```typescript
interface ARRWaterfall {
  period: string;
  openingARR: number;
  newSales: number;
  expansion: number;
  churn: number;
  contraction: number;
  closingARR: number;
  nrr: number;
  movements: ARRMovementDetail[];
}

interface ARRMovementDetail {
  category: 'new' | 'expansion' | 'churn' | 'contraction';
  customerId: string;
  customerName: string;
  amount: number;
  reason?: string;
  date: Date;
  product?: string;
}
```

### Story Points: 5

### Priority: P0

---

## US-REV-002: Product Profitability Matrix

### Story

**As a** finance director
**I want to** see profitability metrics by product line
**So that** I can identify our most and least profitable offerings

### Description

Display a profitability matrix showing revenue, COGS, gross margin, and contribution margin for each product, with visual indicators for profitability tiers.

### Acceptance Criteria

```gherkin
Feature: Product Profitability Matrix

  Scenario: View profitability matrix
    Given I navigate to Product Profitability
    When the matrix loads
    Then I should see a table:
      | Product | LOB | Revenue | COGS | Gross Margin | Contrib. Margin |
      | Aether Cloud | Software | $2.5M | $400K | 84% | 65% |
      | Aether On-Prem | Software | $1.2M | $300K | 75% | 55% |
      | Consulting | Services | $800K | $500K | 37.5% | 20% |
      | Managed Support | Services | $600K | $150K | 75% | 50% |

  Scenario: Color-code by profitability
    Given the matrix is displayed
    Then margin columns should be color-coded:
      | Margin | Color |
      | > 70% | Green |
      | 50-70% | Yellow |
      | < 50% | Red |
    And low-margin products should be visually flagged

  Scenario: Sort by profitability
    Given I want to find most profitable products
    When I click "Contribution Margin" header
    Then products should sort by contribution margin descending
    And the sort order should be indicated

  Scenario: View margin trend
    Given I click on a product row
    When the detail view expands
    Then I should see:
      - 6-month margin trend chart
      - COGS breakdown
      - Volume vs. price analysis
      - Improvement recommendations (AI-generated)

  Scenario: Compare to benchmarks
    Given industry benchmarks are configured
    When I enable "Show Benchmarks"
    Then I should see comparison indicators:
      - "Above benchmark" ✓
      - "Below benchmark" ⚠️
      - Gap to benchmark value
```

### Technical Requirements

- [ ] Create `/api/v1/revenue/product-profitability` endpoint
- [ ] Integrate with cost allocation data
- [ ] Implement margin calculations
- [ ] Create expandable row with trend chart
- [ ] Configure benchmark data

### Story Points: 5

### Priority: P0

---

## US-REV-003: SaaS Metrics Dashboard

### Story

**As a** CFO
**I want to** track key SaaS metrics (MRR, ARR, NRR, Churn, CAC, LTV)
**So that** I can monitor business health and investor-relevant metrics

### Description

Display a comprehensive SaaS metrics dashboard showing current values, trends, and benchmarks for all key subscription business metrics.

### Acceptance Criteria

```gherkin
Feature: SaaS Metrics Dashboard

  Scenario: View SaaS metrics cards
    Given I navigate to the SaaS Metrics section
    When the dashboard loads
    Then I should see metric cards:
      | Metric | Current | Change | Trend |
      | MRR | $4.9M | +$250K | ▲ |
      | ARR | $58.8M | +$3M | ▲ |
      | NRR | 112% | +3% | ▲ |
      | Gross Churn | 1.2% | -0.3% | ▼ (good) |
      | CAC | $4,250 | -$200 | ▼ (good) |
      | LTV | $25,000 | +$1,000 | ▲ |
      | LTV:CAC | 5.9x | +0.4x | ▲ |
      | Rule of 40 | 51 | +3 | ▲ |

  Scenario: View metric trend chart
    Given I click on the "MRR" card
    When the trend chart expands
    Then I should see:
      - 12-month MRR trend line
      - Monthly growth rate overlay
      - Target line (if configured)
      - Forecast projection (dotted)

  Scenario: SaaS Quick Ratio
    Given I want to assess growth efficiency
    Then I should see Quick Ratio:
      - Formula: (New MRR + Expansion MRR) / (Churn MRR + Contraction MRR)
      - Current value (e.g., "4.2x")
      - Benchmark comparison (healthy > 4x)

  Scenario: Cohort analysis view
    Given I want to see retention by cohort
    When I navigate to "Cohort Analysis" tab
    Then I should see a cohort matrix showing:
      - Rows: Signup months
      - Columns: Months since signup
      - Cells: Retention percentage
      - Color gradient (green = high retention)

  Scenario: Export SaaS metrics
    Given I need to share metrics with investors
    When I click "Export Metrics Pack"
    Then I should get a formatted report with:
      - All SaaS metrics
      - Trend charts
      - Definitions and calculations
      - As PDF or Excel
```

### Technical Requirements

- [ ] Create `/api/v1/revenue/saas-metrics` endpoint
- [ ] Implement all metric calculations
- [ ] Create cohort analysis query
- [ ] Build metric card components
- [ ] Add investor-ready export

### Metric Calculations

```typescript
interface SaaSMetrics {
  mrr: number;
  arr: number;                    // MRR × 12
  nrr: number;                    // (Start + Expansion - Churn - Contraction) / Start
  grossChurnRate: number;         // Churned MRR / Starting MRR
  netChurnRate: number;           // (Churn + Contraction - Expansion) / Starting MRR
  cac: number;                    // S&M Spend / New Customers
  ltv: number;                    // ARPA / Churn Rate × Gross Margin
  ltvCacRatio: number;            // LTV / CAC
  ruleOf40: number;               // Growth Rate + Profit Margin
  quickRatio: number;             // (New + Expansion) / (Churn + Contraction)
  arpa: number;                   // ARR / # Customers
  paybackPeriodMonths: number;    // CAC / (ARPA × Gross Margin)
}
```

### Story Points: 8

### Priority: P0

---

## US-REV-004: Gross Margin Analysis

### Story

**As a** finance analyst
**I want to** analyze gross margin by various dimensions
**So that** I can identify margin improvement opportunities

### Description

Provide detailed gross margin analysis with drill-down by product, region, customer segment, and time period.

### Acceptance Criteria

```gherkin
Feature: Gross Margin Analysis

  Scenario: View overall gross margin
    Given I am on the Revenue module
    When I view Gross Margin Analysis
    Then I should see:
      - Current gross margin: 72%
      - Trend vs. prior period: +2%
      - Target margin: 75%
      - Gap to target: -3%

  Scenario: Margin by dimension
    Given I want to analyze margin breakdown
    When I select "By Region" view
    Then I should see:
      | Region | Revenue | COGS | Gross Margin |
      | North America | $25M | $6M | 76% |
      | Europe | $15M | $4.5M | 70% |
      | APAC | $8M | $2.8M | 65% |
    And a bar chart visualizing the comparison

  Scenario: Identify margin erosion
    Given margin has declined quarter-over-quarter
    When I view the variance analysis
    Then I should see:
      - Volume impact: +$X
      - Price impact: -$Y
      - Mix impact: -$Z
      - Cost impact: -$W
    And the largest negative driver should be highlighted

  Scenario: Customer segment margin
    Given I select "By Segment" view
    Then I should see:
      | Segment | Revenue | Gross Margin | Trend |
      | Enterprise | $30M | 78% | Stable |
      | Mid-Market | $15M | 68% | Declining |
      | SMB | $5M | 55% | Improving |

  Scenario: Margin improvement recommendations
    Given I have identified low-margin areas
    When I click "Get Recommendations"
    Then the AI should suggest:
      - Pricing optimization opportunities
      - Cost reduction areas
      - Mix shift strategies
      - Specific action items
```

### Technical Requirements

- [ ] Create `/api/v1/revenue/gross-margin` endpoint
- [ ] Implement margin variance analysis (volume/price/mix/cost)
- [ ] Support multiple dimension views
- [ ] Add AI recommendation generation
- [ ] Create comparison visualizations

### Story Points: 5

### Priority: P1

---

## US-REV-005: Region/LOB Segmentation Filters

### Story

**As a** regional finance manager
**I want to** filter all revenue data by region and line of business
**So that** I can analyze my specific area of responsibility

### Description

Implement comprehensive filtering across all revenue views allowing segmentation by region, LOB, product, segment, and time period.

### Acceptance Criteria

```gherkin
Feature: Revenue Segmentation Filters

  Scenario: Filter by region
    Given I am on any Revenue module view
    When I select "Europe" from the Region filter
    Then all charts and tables should update to show Europe data only
    And totals should reflect filtered amounts
    And a filter badge should indicate "Region: Europe"

  Scenario: Filter by LOB
    Given I want to see only Software revenue
    When I select "Software" from LOB filter
    Then only Software-related revenue should display
    And Services data should be excluded

  Scenario: Combine multiple filters
    Given I apply multiple filters:
      | Filter | Value |
      | Region | North America |
      | LOB | Software |
      | Segment | Enterprise |
    Then data should reflect all filters (AND logic)
    And I should see "3 filters active"
    And "Clear All" should be available

  Scenario: Save filter as view
    Given I frequently analyze "NA Enterprise Software"
    When I click "Save View"
    And name it "NA Enterprise Software"
    Then the view should be saved
    And available in "My Views" dropdown
    And shareable with colleagues via link

  Scenario: Filter affects all related charts
    Given I am on the Revenue module
    When I apply a region filter
    Then all components should update:
      - ARR Waterfall
      - Product Profitability
      - SaaS Metrics
      - Trend Charts
    And consistency should be maintained
```

### Technical Requirements

- [ ] Create unified filter state management
- [ ] Implement filter propagation across components
- [ ] Add saved views functionality
- [ ] Create shareable filter URLs
- [ ] Ensure filter persistence across navigation

### Story Points: 3

### Priority: P0

---

## Story Summary

| Story ID | Title | Priority | Points | Dependencies |
|----------|-------|----------|--------|--------------|
| US-REV-001 | ARR Waterfall Chart | P0 | 5 | Revenue Data |
| US-REV-002 | Product Profitability Matrix | P0 | 5 | Cost Allocation |
| US-REV-003 | SaaS Metrics Dashboard | P0 | 8 | Multiple Data Sources |
| US-REV-004 | Gross Margin Analysis | P1 | 5 | COGS Data |
| US-REV-005 | Region/LOB Segmentation Filters | P0 | 3 | - |
| **Total** | | | **26** | |

---

## Definition of Done

- [ ] Code complete with unit tests (>80% coverage)
- [ ] API endpoints documented in Swagger
- [ ] Metric calculations verified against source
- [ ] Charts are interactive and responsive
- [ ] Filters persist and are shareable
- [ ] Export functionality working
- [ ] Code reviewed and merged
- [ ] QA sign-off received
