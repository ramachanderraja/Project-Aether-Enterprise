# User Stories: Marketing Analytics Module

## Module Overview

**Module ID:** MKT
**Module Name:** Marketing Analytics
**Priority:** P1 (High)
**Epic:** Marketing Intelligence

---

## US-MKT-001: Acquisition Channel Efficiency

### Story

**As a** marketing director
**I want to** compare the efficiency of different acquisition channels
**So that** I can optimize marketing spend allocation

### Description

Display a comparative analysis of acquisition channels showing leads generated, conversion rates, CAC, and revenue generated per channel.

### Acceptance Criteria

```gherkin
Feature: Acquisition Channel Efficiency

  Scenario: View channel comparison chart
    Given I navigate to Marketing Analytics
    When the channel efficiency section loads
    Then I should see a bar chart comparing channels:
      | Channel | Leads | Conv Rate | CAC | Revenue |
      | Outbound Sales | 450 | 12% | $5,200 | $1.2M |
      | Paid Search | 1,200 | 4% | $3,800 | $800K |
      | Organic/Content | 850 | 6% | $1,200 | $600K |
      | Events & Trade | 300 | 8% | $6,500 | $400K |
      | Partner/Reseller | 200 | 25% | $2,000 | $900K |

  Scenario: Sort by metric
    Given I am viewing the channel comparison
    When I select "Sort by: CAC (Lowest)"
    Then channels should reorder:
      1. Organic/Content ($1,200)
      2. Partner/Reseller ($2,000)
      3. Paid Search ($3,800)
      4. Outbound ($5,200)
      5. Events ($6,500)

  Scenario: View efficiency score
    Given each channel has performance data
    Then an efficiency score should be calculated:
      - Formula: (Revenue Generated / CAC) × Conversion Rate
      - Displayed as a normalized score (0-100)
      - Color-coded: Green (>70), Yellow (40-70), Red (<40)

  Scenario: Drill into channel details
    Given I click on "Partner/Reseller"
    When the detail panel opens
    Then I should see:
      - Individual partner performance
      - Lead quality breakdown
      - Deal size distribution
      - Time-to-close comparison
      - Trend over last 12 months

  Scenario: Compare to benchmarks
    Given industry benchmarks are configured
    When I enable "Show Benchmarks"
    Then I should see:
      - Benchmark CAC by channel
      - Our performance vs. benchmark
      - Gap analysis
      - Improvement recommendations
```

### Technical Requirements

- [ ] Create `/api/v1/marketing/channels` endpoint
- [ ] Implement efficiency score calculation
- [ ] Add benchmark data configuration
- [ ] Create drill-down channel detail view
- [ ] Build comparison bar chart component

### Channel Efficiency Model

```typescript
interface ChannelEfficiency {
  channelId: string;
  channelName: string;
  period: string;
  leads: number;
  mqls: number;
  sqls: number;
  opportunities: number;
  closedWon: number;
  conversionRate: number;       // Leads to Closed
  cac: number;
  totalSpend: number;
  revenueGenerated: number;
  roas: number;                 // Return on Ad Spend
  efficiencyScore: number;      // Composite score
  benchmark?: {
    cac: number;
    conversionRate: number;
    roas: number;
  };
}
```

### Story Points: 5

### Priority: P0

---

## US-MKT-002: Lead Distribution Analysis

### Story

**As a** marketing analyst
**I want to** see how leads are distributed across channels
**So that** I can understand our lead generation mix

### Description

Display a pie or donut chart showing the distribution of leads by acquisition channel, with the ability to filter by lead status and time period.

### Acceptance Criteria

```gherkin
Feature: Lead Distribution Analysis

  Scenario: View lead distribution pie chart
    Given I am on Marketing Analytics
    When I view the Lead Distribution section
    Then I should see a donut chart showing:
      - Paid Search: 40% (1,200 leads)
      - Organic/Content: 28% (850 leads)
      - Outbound Sales: 15% (450 leads)
      - Events & Trade: 10% (300 leads)
      - Partner/Reseller: 7% (200 leads)
    And the center should show total: "3,000 Leads"

  Scenario: Hover for details
    Given I hover over a pie segment
    Then I should see a tooltip with:
      - Channel name
      - Lead count
      - Percentage of total
      - MoM change

  Scenario: Filter by lead status
    Given I want to see only qualified leads
    When I select "MQL" from status filter
    Then the pie chart should update to show MQL distribution
    And percentages should recalculate
    And total should show "MQLs: 1,200"

  Scenario: Filter by time period
    Given I select "Last 30 Days"
    Then the distribution should show only recent leads
    And I should be able to compare to prior period
    And change indicators should display

  Scenario: Click segment to drill down
    Given I click on "Paid Search" segment
    Then the segment should expand to show:
      - Sub-channels (Google, Bing, LinkedIn)
      - Individual campaign performance
      - Lead quality breakdown
```

### Technical Requirements

- [ ] Create lead aggregation API
- [ ] Implement donut chart with drill-down
- [ ] Add lead status filtering
- [ ] Create period-over-period comparison
- [ ] Support segment expansion

### Story Points: 3

### Priority: P1

---

## US-MKT-003: CAC by Channel Analysis

### Story

**As a** CFO
**I want to** see Customer Acquisition Cost broken down by channel
**So that** I can evaluate marketing ROI and optimize spend

### Description

Provide detailed CAC analysis by acquisition channel including trend analysis, component breakdown (spend categories), and comparison to target CAC.

### Acceptance Criteria

```gherkin
Feature: CAC by Channel Analysis

  Scenario: View CAC comparison
    Given I navigate to CAC Analysis
    When the view loads
    Then I should see a horizontal bar chart:
      | Channel | CAC | Target | Variance |
      | Events & Trade | $6,500 | $5,000 | +30% (over) |
      | Outbound Sales | $5,200 | $5,500 | -5% (under) |
      | Paid Search | $3,800 | $4,000 | -5% (under) |
      | Partner/Reseller | $2,000 | $2,500 | -20% (under) |
      | Organic/Content | $1,200 | $1,500 | -20% (under) |
    And over-target bars should be red, under should be green

  Scenario: View CAC trend
    Given I want to see CAC over time
    When I select "Show Trend"
    Then I should see a line chart with:
      - Monthly CAC per channel
      - Overall blended CAC line
      - Target CAC line
      - 12-month historical view

  Scenario: View CAC components
    Given I click on "Outbound Sales" CAC
    When the breakdown opens
    Then I should see CAC composition:
      | Component | Amount | % of CAC |
      | Personnel | $3,200 | 62% |
      | Technology (CRM/Tools) | $800 | 15% |
      | Travel & Entertainment | $600 | 12% |
      | Marketing Collateral | $400 | 8% |
      | Other | $200 | 4% |

  Scenario: CAC payback period
    Given CAC is displayed
    Then each channel should show:
      - CAC Payback Period (months)
      - Comparison to target (12 months typical)
      - LTV:CAC ratio for the channel

  Scenario: Optimize recommendations
    Given CAC analysis is complete
    When I click "Get Optimization Tips"
    Then AI should suggest:
      - Channels to increase investment (low CAC, high capacity)
      - Channels to optimize (high CAC, fixable issues)
      - Channels to reduce (high CAC, low returns)
```

### Technical Requirements

- [ ] Create CAC calculation service
- [ ] Implement cost allocation by channel
- [ ] Build component breakdown API
- [ ] Add trend analysis
- [ ] Create payback period calculation

### Story Points: 5

### Priority: P0

---

## US-MKT-004: Marketing ROI Tracking

### Story

**As a** marketing VP
**I want to** track ROI for marketing campaigns and channels
**So that** I can demonstrate marketing's contribution to revenue

### Description

Provide comprehensive marketing ROI tracking including campaign-level and channel-level ROI, attribution modeling, and contribution to pipeline and revenue.

### Acceptance Criteria

```gherkin
Feature: Marketing ROI Tracking

  Scenario: View marketing ROI dashboard
    Given I navigate to Marketing ROI
    When the dashboard loads
    Then I should see:
      - Total Marketing Spend YTD: $5.2M
      - Revenue Attributed: $18M
      - Marketing ROI: 3.5x
      - Pipeline Influenced: $45M
      - Trend vs. prior year

  Scenario: View ROI by channel
    Given I view channel-level ROI
    Then I should see:
      | Channel | Spend | Revenue | ROI |
      | Organic | $200K | $600K | 3.0x |
      | Paid | $1.2M | $800K | 0.67x |
      | Events | $800K | $400K | 0.5x |
      | Partner | $400K | $900K | 2.25x |
    And channels with ROI < 1x should be flagged

  Scenario: View attribution model
    Given I want to understand attribution
    When I select "Attribution Model"
    Then I should see:
      - First-touch attribution results
      - Last-touch attribution results
      - Multi-touch (linear) attribution
      - Ability to switch between models

  Scenario: Campaign-level ROI
    Given I drill into "Events & Trade"
    When I view campaign breakdown
    Then I should see:
      | Campaign | Spend | Leads | Revenue | ROI |
      | Summit 2024 | $300K | 150 | $250K | 0.83x |
      | Roadshow | $200K | 80 | $100K | 0.5x |
      | Webinars | $100K | 70 | $50K | 0.5x |
    And recommendations for each campaign

  Scenario: ROI trend analysis
    Given I want to see ROI improvement
    When I view "ROI Trends"
    Then I should see:
      - Quarterly ROI trend
      - Moving average line
      - Annotation of key initiatives
      - Forecast for next quarter
```

### Technical Requirements

- [ ] Create ROI calculation engine
- [ ] Implement multiple attribution models
- [ ] Build campaign tracking integration
- [ ] Create pipeline influence tracking
- [ ] Add forecasting model

### Marketing ROI Model

```typescript
interface MarketingROI {
  period: string;
  totalSpend: number;
  revenueAttributed: {
    firstTouch: number;
    lastTouch: number;
    multiTouch: number;
  };
  roi: number;                   // Revenue / Spend
  roas: number;                  // For paid channels
  pipelineInfluenced: number;
  pipelineSourced: number;
  channels: ChannelROI[];
  campaigns: CampaignROI[];
}

interface CampaignROI {
  id: string;
  name: string;
  channel: string;
  spend: number;
  leads: number;
  mqls: number;
  opportunities: number;
  revenueAttributed: number;
  roi: number;
  status: 'profitable' | 'break-even' | 'loss';
  recommendations?: string[];
}
```

### Story Points: 5

### Priority: P1

---

## Story Summary

| Story ID | Title | Priority | Points | Dependencies |
|----------|-------|----------|--------|--------------|
| US-MKT-001 | Acquisition Channel Efficiency | P0 | 5 | CRM Data |
| US-MKT-002 | Lead Distribution Analysis | P1 | 3 | US-MKT-001 |
| US-MKT-003 | CAC by Channel Analysis | P0 | 5 | Cost Allocation |
| US-MKT-004 | Marketing ROI Tracking | P1 | 5 | Attribution Model |
| **Total** | | | **18** | |

---

## Definition of Done

- [ ] Code complete with unit tests (>80% coverage)
- [ ] Attribution models verified against known data
- [ ] Drill-down to campaign level working
- [ ] ROI calculations match finance definitions
- [ ] Charts are interactive and responsive
- [ ] Code reviewed and merged
- [ ] QA sign-off received
