# User Stories: GTM Unit Economics Module

## Module Overview

**Module ID:** GTM
**Module Name:** Go-To-Market Unit Economics
**Priority:** P1 (High)
**Epic:** GTM Intelligence

---

## US-GTM-001: Key GTM Metrics Display

### Story

**As a** revenue operations leader
**I want to** see all key GTM unit economics metrics in one view
**So that** I can assess the health of our go-to-market motion

### Description

Display 8 key GTM metrics in a card-based dashboard showing current values, trends, and comparison to targets/benchmarks.

### Acceptance Criteria

```gherkin
Feature: GTM Metrics Dashboard

  Scenario: View GTM metrics cards
    Given I navigate to GTM Unit Economics
    When the dashboard loads
    Then I should see 8 metric cards:
      | Metric | Value | Trend | Target |
      | CAC | $4,250 | -5% ↓ | $4,500 |
      | CAC Payback Period | 14 mo | -1 mo ↓ | 12 mo |
      | LTV | $28,500 | +8% ↑ | $25,000 |
      | LTV:CAC Ratio | 6.7x | +12% ↑ | 5.0x |
      | Traffic to Lead | 4.2% | +0.5% ↑ | 4.0% |
      | ROAS | 3.8x | +2% ↑ | 3.5x |
      | Time to Value | 45 days | -10 days ↓ | 60 days |
      | Cost Per Lead | $185 | +4% ↑ | $175 |

  Scenario: Metric card colors
    Given metrics have target values
    Then cards should be color-coded:
      | Condition | Color |
      | Exceeds target (good direction) | Green border |
      | Misses target | Red border |
      | Within 5% of target | Yellow border |

  Scenario: Click metric for details
    Given I click on the "CAC" metric card
    When the detail modal opens
    Then I should see:
      - 12-month CAC trend chart
      - CAC breakdown by component
      - CAC by segment (Enterprise, Mid-Market)
      - Comparison to industry benchmarks
      - Improvement recommendations

  Scenario: Hover for definition
    Given I hover over a metric label
    Then I should see a tooltip with:
      - Metric definition
      - Calculation formula
      - Why it matters
      - Benchmark ranges

  Scenario: Refresh metrics
    Given I want the latest data
    When I click the refresh icon
    Then all metrics should update
    And last updated timestamp should refresh
```

### Technical Requirements

- [ ] Create `/api/v1/gtm/metrics` endpoint
- [ ] Calculate all 8 GTM metrics
- [ ] Implement metric card component
- [ ] Add metric detail modal
- [ ] Create tooltip definitions

### GTM Metrics Definitions

```typescript
interface GTMMetric {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  unit: string;
  trend: number;              // Percentage change
  trendDirection: 'up' | 'down' | 'flat';
  trendIsGood: boolean;       // Is the direction positive?
  target: number;
  targetStatus: 'exceeds' | 'meets' | 'misses';
  definition: string;
  formula: string;
  benchmark?: {
    low: number;
    median: number;
    high: number;
  };
}

// Metric calculations
const gtmMetrics = {
  cac: totalSalesAndMarketingSpend / newCustomers,
  cacPayback: cac / (arpa * grossMargin),
  ltv: arpa * customerLifetimeMonths * grossMargin,
  ltvCacRatio: ltv / cac,
  trafficToLead: leads / websiteVisitors * 100,
  roas: revenueFromPaid / paidAdSpend,
  timeToValue: avgDaysToFirstValueRealization,
  costPerLead: marketingSpend / totalLeads,
};
```

### Story Points: 5

### Priority: P0

---

## US-GTM-002: LTV:CAC Ratio Trending

### Story

**As a** CFO
**I want to** see the trend of our LTV:CAC ratio over time
**So that** I can assess whether our unit economics are improving

### Description

Display a time-series chart showing LTV:CAC ratio trend with component breakdowns (LTV trend, CAC trend) and annotations for key events.

### Acceptance Criteria

```gherkin
Feature: LTV:CAC Trending

  Scenario: View LTV:CAC trend chart
    Given I navigate to LTV:CAC analysis
    When the chart loads
    Then I should see:
      - Primary line: LTV:CAC ratio over 12 months
      - Secondary lines: LTV and CAC individual trends
      - Reference line at 3.0x (minimum healthy)
      - Reference line at 5.0x (target)
      - Current value highlighted

  Scenario: Annotate significant events
    Given the trend chart is displayed
    Then I should see annotations for:
      - Product launches
      - Pricing changes
      - Major marketing campaigns
      - Organizational changes
    And clicking annotation shows details

  Scenario: View cohort-based LTV
    Given I want to see LTV by customer cohort
    When I switch to "Cohort View"
    Then I should see:
      - LTV curves by signup cohort
      - Cohort comparison (older vs. newer)
      - Improvement/degradation indicators

  Scenario: Break down components
    Given I want to understand ratio drivers
    When I toggle "Show Components"
    Then I should see:
      - LTV trend (line)
      - CAC trend (line)
      - Ratio derivation visualization
      - Which component is driving changes

  Scenario: Forecast future ratio
    Given historical data exists
    When I enable "Show Forecast"
    Then I should see:
      - 6-month projected ratio
      - Confidence interval
      - Scenario options (pessimistic, base, optimistic)
```

### Technical Requirements

- [ ] Create cohort-based LTV calculation
- [ ] Implement event annotation system
- [ ] Build multi-line trend chart
- [ ] Add forecasting model
- [ ] Create component breakdown view

### LTV Calculation Model

```typescript
interface LTVAnalysis {
  period: string;
  ltv: number;
  cac: number;
  ratio: number;
  components: {
    arpa: number;              // Average Revenue Per Account
    grossMargin: number;
    churnRate: number;
    customerLifetime: number;  // 1/churn rate
  };
  cohorts: CohortLTV[];
}

interface CohortLTV {
  cohortPeriod: string;        // e.g., "2024-Q1"
  customersInCohort: number;
  monthsSinceCohort: number;
  currentLTV: number;
  projectedLTV: number;
  revenueRealized: number;
  revenueRemaining: number;
}
```

### Story Points: 5

### Priority: P0

---

## US-GTM-003: Time to Value Tracking

### Story

**As a** customer success leader
**I want to** track how quickly customers achieve value from our product
**So that** I can optimize onboarding and reduce churn risk

### Description

Track and display Time to Value (TTV) metrics showing how long it takes customers to realize value milestones after purchase.

### Acceptance Criteria

```gherkin
Feature: Time to Value Tracking

  Scenario: View TTV dashboard
    Given I navigate to Time to Value
    When the dashboard loads
    Then I should see:
      - Average TTV: 45 days
      - Median TTV: 38 days
      - TTV by segment:
        | Segment | Avg TTV | Target |
        | Enterprise | 60 days | 45 days |
        | Mid-Market | 35 days | 30 days |

  Scenario: View TTV distribution
    Given I want to see TTV spread
    When I view the distribution chart
    Then I should see a histogram showing:
      - X-axis: Days to value (0-120+)
      - Y-axis: Number of customers
      - Mean and median lines
      - Highlighting of outliers (>90 days)

  Scenario: Track value milestones
    Given customers have multiple value milestones
    When I view milestone tracking
    Then I should see:
      | Milestone | Avg Days | % Achieved |
      | First Login | 2 | 98% |
      | Initial Setup | 7 | 92% |
      | First Report Run | 14 | 85% |
      | Full Adoption | 45 | 68% |

  Scenario: Identify at-risk customers
    Given some customers have slow time to value
    When I view "At Risk" segment
    Then I should see:
      - Customers >60 days without value milestone
      - Risk score based on engagement
      - Recommended interventions
      - Link to customer success workflow

  Scenario: TTV impact on retention
    Given I want to see TTV correlation
    When I view "TTV vs. Retention"
    Then I should see:
      - Scatter plot of TTV vs. 12-month retention
      - Trend line showing correlation
      - Statistical significance indicator
      - Insight: "Customers with TTV <30 days have 2x retention"
```

### Technical Requirements

- [ ] Create TTV tracking service
- [ ] Define value milestone events
- [ ] Implement distribution analysis
- [ ] Build correlation with retention
- [ ] Create at-risk customer identification

### Time to Value Model

```typescript
interface TimeToValue {
  customerId: string;
  purchaseDate: Date;
  milestones: ValueMilestone[];
  firstValueDate?: Date;
  fullAdoptionDate?: Date;
  ttv: number;                 // Days
  segment: string;
  atRisk: boolean;
  riskScore?: number;
}

interface ValueMilestone {
  name: string;
  targetDays: number;
  achievedDate?: Date;
  daysToAchieve?: number;
  status: 'achieved' | 'pending' | 'overdue';
}

interface TTVMetrics {
  period: string;
  averageTTV: number;
  medianTTV: number;
  p90TTV: number;
  bySegment: Record<string, number>;
  milestoneCompletion: {
    milestoneName: string;
    avgDays: number;
    completionRate: number;
  }[];
  correlation: {
    ttvVsRetention: number;    // Correlation coefficient
    significance: number;
  };
}
```

### Story Points: 5

### Priority: P1

---

## US-GTM-004: Cost Per Lead Analysis

### Story

**As a** demand generation manager
**I want to** analyze cost per lead across channels and campaigns
**So that** I can optimize lead generation spend

### Description

Provide detailed analysis of Cost Per Lead (CPL) with breakdowns by channel, campaign, lead quality tier, and trends over time.

### Acceptance Criteria

```gherkin
Feature: Cost Per Lead Analysis

  Scenario: View CPL summary
    Given I navigate to Cost Per Lead
    When the summary loads
    Then I should see:
      - Overall CPL: $185
      - Target CPL: $175
      - Variance: +$10 (5.7% over)
      - Trend: +4% vs. prior month

  Scenario: View CPL by channel
    Given I want to compare channels
    When I view channel breakdown
    Then I should see:
      | Channel | CPL | Leads | Quality Score |
      | Organic | $45 | 850 | 72 |
      | Paid Search | $125 | 1,200 | 65 |
      | Events | $350 | 300 | 85 |
      | Partner | $180 | 200 | 90 |
    And sorted by CPL default

  Scenario: CPL by lead quality
    Given not all leads are equal
    When I view "CPL by Quality"
    Then I should see:
      | Lead Quality | CPL | % of Leads | Conversion Rate |
      | Hot | $420 | 10% | 25% |
      | Warm | $210 | 30% | 12% |
      | Cool | $95 | 60% | 3% |
    And cost-per-qualified-lead calculated

  Scenario: CPL trend analysis
    Given I want to see historical CPL
    When I view "CPL Trend"
    Then I should see:
      - 12-month CPL trend line
      - Seasonality patterns
      - Cost driver annotations
      - Forecast for next quarter

  Scenario: Campaign-level CPL
    Given I drill into a specific channel
    When I view campaign breakdown
    Then I should see:
      | Campaign | Spend | Leads | CPL | Quality |
      | Brand Search | $50K | 600 | $83 | 58 |
      | Competitor Search | $30K | 200 | $150 | 75 |
      | Display Retarget | $20K | 150 | $133 | 70 |
```

### Technical Requirements

- [ ] Create CPL calculation service
- [ ] Implement lead quality scoring
- [ ] Build channel/campaign breakdown
- [ ] Add trend analysis
- [ ] Create cost driver attribution

### CPL Model

```typescript
interface CPLAnalysis {
  period: string;
  overallCPL: number;
  target: number;
  variance: number;
  leadCount: number;
  totalSpend: number;
  byChannel: ChannelCPL[];
  byQuality: QualityCPL[];
  trend: {
    period: string;
    cpl: number;
    leadCount: number;
  }[];
}

interface ChannelCPL {
  channel: string;
  spend: number;
  leads: number;
  cpl: number;
  qualityScore: number;         // 0-100
  costPerQualifiedLead: number;
  campaigns?: CampaignCPL[];
}

interface QualityCPL {
  qualityTier: 'hot' | 'warm' | 'cool';
  leads: number;
  percentOfTotal: number;
  cpl: number;
  conversionRate: number;
}
```

### Story Points: 5

### Priority: P1

---

## Story Summary

| Story ID | Title | Priority | Points | Dependencies |
|----------|-------|----------|--------|--------------|
| US-GTM-001 | Key GTM Metrics Display | P0 | 5 | Multiple Data Sources |
| US-GTM-002 | LTV:CAC Ratio Trending | P0 | 5 | Customer Data |
| US-GTM-003 | Time to Value Tracking | P1 | 5 | Event Tracking |
| US-GTM-004 | Cost Per Lead Analysis | P1 | 5 | Marketing Data |
| **Total** | | | **20** | |

---

## Definition of Done

- [ ] Code complete with unit tests (>80% coverage)
- [ ] Metric calculations verified against source data
- [ ] Tooltips with definitions for all metrics
- [ ] Responsive card-based layout
- [ ] Drill-down functionality working
- [ ] Code reviewed and merged
- [ ] QA sign-off received
