# User Stories: Sales Pipeline Analytics Module

## Module Overview

**Module ID:** SALES
**Module Name:** Sales Pipeline Analytics
**Priority:** P0 (Critical)
**Epic:** Revenue Intelligence

---

## US-SALES-001: Pipeline Funnel Visualization

### Story

**As a** sales operations manager
**I want to** see a visual funnel of our sales pipeline by stage
**So that** I can identify bottlenecks and conversion issues

### Description

Display an interactive sales funnel chart showing deal count and value at each stage, with conversion rates between stages and visual indicators for friction points.

### Acceptance Criteria

```gherkin
Feature: Pipeline Funnel Visualization

  Scenario: View sales funnel
    Given I navigate to the Sales Pipeline module
    When the funnel chart loads
    Then I should see a funnel with stages:
      | Stage | Deal Count | Total Value | Conversion |
      | Prospecting | 45 | $1.2M | 60% |
      | Discovery | 28 | $850K | 50% |
      | Proposal | 15 | $600K | 40% |
      | Negotiation | 8 | $420K | 70% |
      | Legal Review | 6 | $380K | 90% |
      | Closed Won | 4 | $150K | - |

  Scenario: Funnel shows friction alerts
    Given a stage has a conversion rate below threshold (40%)
    When the funnel renders
    Then that stage should have a warning indicator
    And hovering should show: "Below target conversion rate"
    And the stage should be highlighted in orange/yellow

  Scenario: Click funnel stage to filter
    Given I am viewing the funnel
    When I click on the "Proposal" stage
    Then the deals table should filter to show only Proposal deals
    And the stage should be visually highlighted as selected
    And a "Clear filter" option should appear

  Scenario: Funnel responds to filters
    Given I have applied a region filter (e.g., "Europe")
    When the funnel re-renders
    Then only deals from Europe should be included
    And values and counts should update accordingly
    And a filter badge should show "Filtered: Europe"

  Scenario: Compare funnel periods
    Given I want to compare current funnel to previous quarter
    When I select "Compare to Q3" from the dropdown
    Then I should see side-by-side funnel comparison
    And changes should be highlighted (green=improved, red=declined)
```

### Technical Requirements

- [ ] Create `/api/v1/sales/funnel` endpoint
- [ ] Implement stage aggregation with filtering
- [ ] Calculate stage-to-stage conversion rates
- [ ] Define conversion rate thresholds per stage
- [ ] Support period-over-period comparison

### Funnel Data Model

```typescript
interface FunnelStage {
  stage: string;
  dealCount: number;
  totalValue: number;
  conversionRate: number;       // To next stage
  avgDaysInStage: number;
  frictionAlert: boolean;
  previousPeriod?: {
    dealCount: number;
    totalValue: number;
    conversionRate: number;
  };
}

interface FunnelResponse {
  stages: FunnelStage[];
  filters: AppliedFilters;
  totals: {
    totalDeals: number;
    totalValue: number;
    overallConversion: number;  // Prospect to Close
  };
}
```

### Story Points: 5

### Priority: P0

---

## US-SALES-002: Multi-Dimensional Filtering

### Story

**As a** finance manager
**I want to** filter the sales pipeline by region, LOB, vertical, and segment
**So that** I can analyze specific slices of the business

### Description

Implement comprehensive filtering capabilities allowing users to slice the sales data by multiple dimensions simultaneously with instant visual feedback.

### Acceptance Criteria

```gherkin
Feature: Multi-Dimensional Pipeline Filtering

  Scenario: Filter by single dimension
    Given I am on the Sales Pipeline page
    When I select "North America" from the Region filter
    Then all charts and tables should update to show only NA deals
    And the filter badge should display "Region: North America"
    And the total count should reflect filtered results

  Scenario: Filter by multiple dimensions
    Given I want to see Enterprise Software deals in EMEA
    When I apply filters:
      | Filter | Value |
      | Region | Europe |
      | LOB | Software |
      | Segment | Enterprise |
    Then data should reflect all three filters combined (AND logic)
    And filter badges should show all active filters
    And "Clear All Filters" button should appear

  Scenario: Filter options are dynamic
    Given I have selected "Asia Pacific" region
    When I open the Vertical filter dropdown
    Then I should only see verticals that have deals in APAC
    And verticals with zero deals should be disabled or hidden

  Scenario: Save filter preset
    Given I frequently use the same filter combination
    When I click "Save Filter Preset"
    And I name it "EMEA Enterprise Software"
    Then the preset should be saved
    And it should appear in my saved presets dropdown

  Scenario: Share filter via URL
    Given I have applied multiple filters
    When I click "Copy Link" or share the URL
    Then the URL should contain filter parameters
    And another user opening that URL should see the same filters applied
```

### Technical Requirements

- [ ] Create filter parameter API with query string support
- [ ] Implement filter state management (URL sync)
- [ ] Create dynamic filter option loading
- [ ] Implement filter presets storage
- [ ] Add filter analytics tracking

### Filter Configuration

```typescript
interface SalesFilters {
  region: Region[];           // Multi-select
  lob: LOB[];                 // Multi-select
  vertical: Vertical[];       // Multi-select
  segment: Segment[];         // Multi-select
  channel: string[];          // Multi-select
  owner: string[];            // User IDs
  dateRange: {
    start: Date;
    end: Date;
  };
  valueRange: {
    min: number;
    max: number;
  };
  probability: {
    min: number;              // 0-100
    max: number;
  };
}
```

### Story Points: 5

### Priority: P0

---

## US-SALES-003: Stalled Deal Detection

### Story

**As a** sales leader
**I want to** see deals that have been stagnant for too long
**So that** I can intervene and re-engage or disqualify them

### Description

Automatically identify and highlight deals that have exceeded the expected time in their current stage, with configurable thresholds and aging indicators.

### Acceptance Criteria

```gherkin
Feature: Stalled Deal Detection

  Scenario: View stalled deals
    Given deals exist that have been in the same stage > 90 days
    When I view the Stalled Deals section
    Then I should see a table showing:
      | Column | Description |
      | Deal ID | Clickable link to deal detail |
      | Account | Company name |
      | Stage | Current pipeline stage |
      | Value | Deal amount |
      | Days Stalled | Number of days in current stage |
      | Owner | Sales rep name |
      | Last Activity | Date of last update |

  Scenario: Stalled threshold configuration
    Given I am an admin
    When I configure stalled thresholds:
      | Stage | Threshold (days) |
      | Discovery | 30 |
      | Proposal | 45 |
      | Negotiation | 60 |
      | Legal Review | 30 |
    Then deals exceeding these thresholds should be flagged

  Scenario: Stalled deal severity
    Given a deal has been stalled
    Then severity should be calculated as:
      | Days Over Threshold | Severity |
      | 0-14 days | Warning (yellow) |
      | 15-30 days | High (orange) |
      | 30+ days | Critical (red) |

  Scenario: Take action on stalled deal
    Given I see a stalled deal
    When I click the action menu
    Then I should be able to:
      - "Push to Owner" (send notification)
      - "Mark for Review" (add to review list)
      - "Request Update" (trigger workflow)
      - "View in CRM" (link to Salesforce)

  Scenario: Stalled deals summary metric
    Given the Sales module loads
    Then I should see a KPI card showing:
      - "Stalled Deals: 12"
      - "Total At-Risk Value: $1.8M"
      - Trend vs. previous period
```

### Technical Requirements

- [ ] Create stalled deal detection service
- [ ] Implement configurable thresholds per organization
- [ ] Create notification workflow for deal alerts
- [ ] Calculate days in stage from deal history
- [ ] Add "last activity" tracking

### Stalled Deal Model

```typescript
interface StalledDeal {
  dealId: string;
  accountName: string;
  stage: string;
  value: number;
  daysInStage: number;
  thresholdDays: number;
  daysOverThreshold: number;
  severity: 'warning' | 'high' | 'critical';
  owner: {
    id: string;
    name: string;
    email: string;
  };
  lastActivity: Date;
  lastActivityType: string;   // "Email", "Call", "Meeting"
}
```

### Story Points: 5

### Priority: P0

---

## US-SALES-004: Closed Lost Analysis

### Story

**As a** sales leader
**I want to** analyze closed-lost deals to understand loss patterns
**So that** I can improve win rates and address common objections

### Description

Provide detailed analysis of deals that were lost, including loss reasons, patterns by segment/region, and trends over time.

### Acceptance Criteria

```gherkin
Feature: Closed Lost Analysis

  Scenario: View closed lost summary
    Given I navigate to the "Closed Lost" tab
    When the analysis loads
    Then I should see:
      - Total lost deals count and value this period
      - Comparison to previous period
      - Top 5 loss reasons breakdown

  Scenario: Loss reasons breakdown
    Given I am viewing closed lost analysis
    Then I should see a chart showing:
      | Loss Reason | Count | Value | % of Total |
      | Price/Budget | 15 | $2.1M | 35% |
      | Competitor Won | 10 | $1.5M | 25% |
      | No Decision | 8 | $800K | 15% |
      | Requirements | 5 | $600K | 12% |
      | Timing | 4 | $500K | 10% |
      | Other | 2 | $150K | 3% |

  Scenario: Sort closed lost table
    Given I am viewing the closed lost deals table
    When I click the "Value" column header
    Then deals should sort by value (descending)
    And clicking again should reverse the sort order
    And a sort indicator should show current sort state

  Scenario: Filter closed lost by period
    Given I want to analyze losses from a specific time
    When I select "Last Quarter" from the period filter
    Then only deals closed lost in that period should display
    And the analysis should update accordingly

  Scenario: Drill into loss reason
    Given I click on "Competitor Won" in the breakdown
    Then I should see:
      - Which competitors won these deals
      - Average deal size lost to each competitor
      - Common patterns (region, segment, vertical)
```

### Technical Requirements

- [ ] Create closed-lost analysis API endpoint
- [ ] Implement loss reason categorization
- [ ] Create competitor tracking (from deal data)
- [ ] Support time-based filtering
- [ ] Add sorting and pagination

### Story Points: 3

### Priority: P1

---

## US-SALES-005: Sales Rep Performance Tracking

### Story

**As a** sales director
**I want to** see performance metrics for each sales rep
**So that** I can identify top performers and those needing support

### Description

Display a performance dashboard showing key metrics for each sales representative including quota attainment, pipeline coverage, win rate, and activity levels.

### Acceptance Criteria

```gherkin
Feature: Sales Rep Performance

  Scenario: View sales rep leaderboard
    Given I navigate to the Sales Rep Performance section
    When the leaderboard loads
    Then I should see a table with:
      | Rep Name | Quota | YTD Closed | Attainment | Forecast | Coverage | Win Rate |
      | Sarah J. | $1.5M | $1.2M | 80% | $400K | 3.2x | 28% |
      | Mike R. | $1.8M | $1.6M | 89% | $350K | 2.8x | 32% |
      | ... | ... | ... | ... | ... | ... | ... |

  Scenario: Sort by performance metric
    Given I am viewing the leaderboard
    When I click on the "Win Rate" column
    Then reps should be sorted by win rate
    And I can toggle ascending/descending

  Scenario: Click rep for detail view
    Given I click on a sales rep name
    When the detail panel opens
    Then I should see:
      - Full pipeline breakdown by stage
      - Recent closed deals list
      - Activity trend chart
      - Comparison to team average

  Scenario: Performance alerts
    Given a rep has quota attainment below 60%
    Then they should be flagged with a warning indicator
    And their row should be highlighted
    And the sales director should receive an alert

  Scenario: Filter by team or region
    Given I manage a specific team
    When I filter by "My Direct Reports"
    Then only my team members should display
    And team totals should adjust
```

### Technical Requirements

- [ ] Create sales_rep_metrics view/table
- [ ] Implement quota tracking
- [ ] Calculate derived metrics (coverage, win rate)
- [ ] Integrate with user hierarchy for team filtering
- [ ] Create performance alert thresholds

### Story Points: 5

### Priority: P1

---

## US-SALES-006: Forecast Accuracy Tracking

### Story

**As a** CFO
**I want to** see how accurate our sales forecasts have been
**So that** I can assess forecast reliability and adjust planning assumptions

### Description

Track and display forecast accuracy over time, comparing submitted forecasts to actual results and highlighting patterns of over/under-forecasting.

### Acceptance Criteria

```gherkin
Feature: Forecast Accuracy Tracking

  Scenario: View forecast accuracy dashboard
    Given I navigate to Forecast Accuracy
    When the dashboard loads
    Then I should see:
      - Overall accuracy score (e.g., "85% accurate")
      - Trend chart showing accuracy over past 6 quarters
      - Breakdown by:
        - Region
        - Rep
        - Deal size category

  Scenario: Accuracy calculation
    Given forecasts were submitted for Q3
    And Q3 has now closed
    When accuracy is calculated
    Then it should use:
      - MAPE (Mean Absolute Percentage Error)
      - Weighted by deal value
      - Only include deals in forecast window

  Scenario: Identify consistent over-forecasters
    Given some reps consistently forecast higher than actual
    When I view the accuracy by rep
    Then I should see:
      - Average forecast vs. actual ratio
      - Number of periods over-forecast
      - Suggested adjustment factor

  Scenario: Forecast accuracy trend
    Given I want to see if we're improving
    When I view the trend chart
    Then I should see:
      - Quarterly accuracy scores
      - Rolling average line
      - Target accuracy line (e.g., 90%)
```

### Technical Requirements

- [ ] Create forecast snapshot storage
- [ ] Implement MAPE calculation
- [ ] Track forecast vs. actual by period
- [ ] Create accuracy trending analysis
- [ ] Build rep-level accuracy profiles

### Story Points: 5

### Priority: P1

---

## US-SALES-007: Weighted Pipeline Calculations

### Story

**As a** finance analyst
**I want to** see weighted pipeline values based on probability
**So that** I can create more accurate revenue projections

### Description

Calculate and display weighted pipeline values that apply deal probabilities to raw values, with the ability to view both weighted and unweighted views.

### Acceptance Criteria

```gherkin
Feature: Weighted Pipeline Calculations

  Scenario: View weighted pipeline
    Given I am on the Sales Pipeline page
    When I toggle to "Weighted View"
    Then all pipeline values should show:
      | Metric | Raw | Weighted |
      | Total Pipeline | $10M | $4.2M |
      | By Stage | Raw values | Value × Probability |

  Scenario: Weighted calculation by stage
    Given deals are in various stages with probabilities
    Then weighted value should be calculated as:
      | Stage | Raw Value | Probability | Weighted |
      | Prospecting | $500K | 10% | $50K |
      | Discovery | $300K | 20% | $60K |
      | Proposal | $200K | 50% | $100K |
      | Negotiation | $150K | 80% | $120K |

  Scenario: Toggle between views
    Given I can switch between Raw and Weighted views
    When I click the toggle
    Then the view should update instantly
    And charts should animate the transition
    And my preference should be remembered

  Scenario: Custom probability overrides
    Given a deal has a default 50% probability
    When the sales rep sets a custom probability of 70%
    Then the weighted calculation should use 70%
    And the override should be indicated visually
    And an audit trail should track the change

  Scenario: Weighted pipeline by close date
    Given I want to see expected revenue by month
    When I view the weighted forecast
    Then I should see:
      | Month | Weighted Pipeline |
      | Feb | $1.2M |
      | Mar | $1.5M |
      | Apr | $800K |
```

### Technical Requirements

- [ ] Implement weighted calculation service
- [ ] Support probability overrides
- [ ] Create view toggle with state persistence
- [ ] Aggregate weighted values by time period
- [ ] Track probability change history

### Story Points: 3

### Priority: P0

---

## Story Summary

| Story ID | Title | Priority | Points | Dependencies |
|----------|-------|----------|--------|--------------|
| US-SALES-001 | Pipeline Funnel Visualization | P0 | 5 | - |
| US-SALES-002 | Multi-Dimensional Filtering | P0 | 5 | - |
| US-SALES-003 | Stalled Deal Detection | P0 | 5 | US-SALES-002 |
| US-SALES-004 | Closed Lost Analysis | P1 | 3 | US-SALES-002 |
| US-SALES-005 | Sales Rep Performance | P1 | 5 | - |
| US-SALES-006 | Forecast Accuracy Tracking | P1 | 5 | - |
| US-SALES-007 | Weighted Pipeline Calculations | P0 | 3 | - |
| **Total** | | | **31** | |

---

## Definition of Done

- [ ] Code complete with unit tests (>80% coverage)
- [ ] API endpoints documented in Swagger
- [ ] Filters persist in URL (shareable)
- [ ] Responsive design for tablet+
- [ ] Accessibility audit passed
- [ ] Performance: <2s page load
- [ ] Integration with CRM verified
- [ ] Code reviewed and merged
- [ ] QA sign-off received
