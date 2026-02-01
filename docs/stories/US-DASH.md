# User Stories: Executive Dashboard Module

## Module Overview

**Module ID:** DASH
**Module Name:** Executive Dashboard (Strategic Command Center)
**Priority:** P0 (Critical)
**Epic:** CFO Intelligence Hub

---

## US-DASH-001: Primary KPI Display

### Story

**As a** CFO
**I want to** see the four most critical financial KPIs at a glance
**So that** I can quickly assess the overall financial health of the organization

### Description

Display four primary KPI cards on the dashboard showing Total YTD Revenue, In-Year Closed ACV, EBITDA Margin, and Rule of 40 with trend indicators and period-over-period comparisons.

### Acceptance Criteria

```gherkin
Feature: Primary KPI Display

  Scenario: View primary KPIs on dashboard load
    Given I am logged in as a finance user
    When I navigate to the Executive Dashboard
    Then I should see 4 KPI cards in a responsive grid
    And each card should display:
      | KPI | Current Value | Change | Trend |
      | Total YTD Revenue | $58.5M | +24% | ▲ |
      | In-Year Closed ACV | $12.4M | +18% | ▲ |
      | EBITDA Margin | 21% | +2.5% | ▲ |
      | Rule of 40 | 51 | +3 | ▲ |

  Scenario: KPI card shows positive trend
    Given a KPI has improved compared to previous period
    When the dashboard displays the KPI
    Then the change indicator should be green
    And the trend arrow should point upward
    And the percentage should show positive change

  Scenario: KPI card shows negative trend
    Given a KPI has declined compared to previous period
    When the dashboard displays the KPI
    Then the change indicator should be red
    And the trend arrow should point downward
    And the percentage should show negative change

  Scenario: Real-time KPI refresh
    Given I am viewing the dashboard
    And the data refresh interval is set to 5 minutes
    When 5 minutes have elapsed
    Then the KPI values should be refreshed from the API
    And a subtle animation should indicate the refresh
    And the timestamp should update to current time

  Scenario: Loading state for KPIs
    Given I am navigating to the dashboard
    When the KPI data is being fetched
    Then skeleton loaders should display in place of values
    And the loading state should not persist beyond 3 seconds
```

### Technical Requirements

- [ ] Create `/api/v1/dashboard/kpis` endpoint
- [ ] Implement caching with 1-minute TTL
- [ ] Calculate YoY and PoP (Period over Period) changes
- [ ] Support organization-specific KPI configurations
- [ ] Implement WebSocket for real-time updates (optional)

### Data Model

```typescript
interface KPICard {
  id: string;
  label: string;
  value: number;
  formattedValue: string;     // "$58.5M"
  changeValue: number;        // 0.24 (24%)
  changeFormatted: string;    // "+24%"
  trend: 'up' | 'down' | 'flat';
  comparisonPeriod: string;   // "vs Previous YTD"
  icon: string;               // "DollarSign"
  color: string;              // "emerald" | "blue" | "rose"
  lastUpdated: Date;
}
```

### Story Points: 3

### Priority: P0

---

## US-DASH-002: Rolling Forecast Visualization

### Story

**As a** CFO
**I want to** see a rolling 12-month revenue forecast with confidence intervals
**So that** I can understand projected performance and planning scenarios

### Description

Display an interactive composed chart showing actual revenue (historical), forecasted revenue (projected), budget line, and confidence intervals (P10/P90) for a rolling 12-month period.

### Acceptance Criteria

```gherkin
Feature: Rolling Forecast Chart

  Scenario: View rolling forecast chart
    Given I am on the Executive Dashboard
    When the Rolling Forecast section loads
    Then I should see a composed chart with:
      | Series | Type | Color | Description |
      | Actual | Area | Blue | Historical actual revenue |
      | Forecast | Line | Teal | Projected revenue |
      | Budget | Line (dashed) | Gray | Budget baseline |
      | Confidence Band | Area | Blue (10% opacity) | P10-P90 range |

  Scenario: Hover over data point
    Given I am viewing the forecast chart
    When I hover over a specific month
    Then a tooltip should display:
      | Field | Example |
      | Month | "March 2024" |
      | Actual | "$4,200K" (if available) |
      | Forecast | "$5,200K" |
      | Budget | "$5,000K" |
      | Variance | "+4% vs Budget" |
      | Confidence | "P10: $4,900K | P90: $5,500K" |

  Scenario: Toggle chart series visibility
    Given I am viewing the forecast chart
    When I click on a legend item (e.g., "Budget")
    Then that series should toggle visibility
    And the chart should re-render smoothly
    And my preference should be remembered

  Scenario: Forecast accuracy indicator
    Given the chart displays historical periods
    When viewing months where both actual and forecast exist
    Then I should see the forecast accuracy indicator
    And accuracy should be calculated as MAPE
    And accuracy should be displayed as "Forecast Accuracy: 94%"

  Scenario: Drill-down to Revenue module
    Given I am viewing the forecast chart
    When I click on a data point or "View Details" link
    Then I should navigate to the Revenue module
    And the selected period should be pre-filtered
```

### Technical Requirements

- [ ] Create `/api/v1/dashboard/forecast` endpoint
- [ ] Implement forecast calculation service
- [ ] Calculate confidence intervals using historical variance
- [ ] Support multiple forecast models (Linear, ARIMA, ML-based)
- [ ] Implement chart export to PNG/PDF

### Chart Configuration

```typescript
interface ForecastChartConfig {
  dateRange: {
    start: Date;    // 6 months historical
    end: Date;      // 6 months projected
  };
  series: {
    actual: boolean;
    forecast: boolean;
    budget: boolean;
    confidence: boolean;
  };
  granularity: 'monthly' | 'quarterly';
  currencyFormat: string;
}
```

### Story Points: 5

### Priority: P0

---

## US-DASH-003: Cash Flow Projection

### Story

**As a** CFO
**I want to** see cash flow projections with runway calculation
**So that** I can ensure adequate liquidity and plan capital needs

### Description

Display a cash flow projection chart showing net cash flow bars and burn rate threshold line, with a prominently displayed runway indicator (months of runway remaining).

### Acceptance Criteria

```gherkin
Feature: Cash Flow Projection

  Scenario: View cash flow projection
    Given I am on the Executive Dashboard
    When the Cash Flow section loads
    Then I should see a composed chart with:
      | Element | Type | Description |
      | Net Cash Flow | Bar | Monthly net cash (green=positive, red=negative) |
      | Burn Rate | Line | Threshold line (red dashed) |
    And I should see a runway badge showing "Runway: 18 Months"

  Scenario: Positive cash flow month
    Given a month has positive net cash flow
    When the chart renders that month
    Then the bar should be green/emerald colored
    And the value should be displayed above the bar on hover

  Scenario: Negative cash flow month
    Given a month has negative net cash flow
    When the chart renders that month
    Then the bar should be red/rose colored
    And the value should be displayed below the bar on hover

  Scenario: Runway warning threshold
    Given the calculated runway is less than 12 months
    When the dashboard displays the runway
    Then the runway badge should be orange (warning)
    And a notification should appear: "Cash runway below 12-month threshold"

  Scenario: Runway critical threshold
    Given the calculated runway is less than 6 months
    When the dashboard displays the runway
    Then the runway badge should be red (critical)
    And an alert should be triggered to CFO
    And the anomaly system should flag this as high severity
```

### Technical Requirements

- [ ] Create `/api/v1/dashboard/cashflow` endpoint
- [ ] Implement runway calculation based on current burn rate
- [ ] Support multiple burn rate scenarios (optimistic, base, pessimistic)
- [ ] Integrate with anomaly detection for low runway alerts

### Runway Calculation

```typescript
interface CashFlowMetrics {
  currentCashPosition: number;
  averageMonthlyBurn: number;
  runwayMonths: number;
  projectedCashByMonth: {
    month: Date;
    cashFlow: number;
    cumulativeCash: number;
  }[];
  burnRateThreshold: number;
}

// Runway = Current Cash / Average Monthly Burn Rate
```

### Story Points: 5

### Priority: P0

---

## US-DASH-004: Strategic Anomaly Detection

### Story

**As a** CFO
**I want to** be alerted to significant financial anomalies in real-time
**So that** I can investigate and address issues before they escalate

### Description

Display a strategic risks card showing detected anomalies with severity indicators, brief descriptions, and financial impact. Allow clicking to open detailed analysis modal.

### Acceptance Criteria

```gherkin
Feature: Strategic Anomaly Detection

  Scenario: View anomaly alerts
    Given anomalies have been detected by the AI engine
    When I view the Strategic Risks card on the dashboard
    Then I should see a list of anomalies sorted by severity
    And each anomaly should display:
      | Field | Example |
      | Icon | ⚠️ (color coded by severity) |
      | Metric | "Operating Expenses" |
      | Description | "12% variance in Q3..." |
      | Impact | "Impact: $150,000" |

  Scenario: Anomaly severity levels
    Given multiple anomalies exist with different severities
    When the anomaly list is displayed
    Then anomalies should be color-coded:
      | Severity | Color | Icon |
      | Critical | Red | AlertTriangle (filled) |
      | High | Orange | AlertTriangle |
      | Medium | Yellow | AlertCircle |
      | Low | Blue | Info |

  Scenario: Click to investigate anomaly
    Given I see an anomaly in the Strategic Risks card
    When I click on the anomaly row
    Then a detailed modal should open
    And the AI Root Cause Analysis should begin loading
    And I should see the full anomaly profile

  Scenario: No anomalies state
    Given no anomalies have been detected
    When I view the Strategic Risks card
    Then I should see a positive message: "All systems healthy"
    And a green checkmark should be displayed
    And the last check timestamp should be shown

  Scenario: Real-time anomaly notification
    Given I am viewing the dashboard
    And a new high-severity anomaly is detected
    When the anomaly is flagged by the system
    Then a toast notification should appear
    And the Strategic Risks card should update
    And a badge should show "+1 new"
```

### Technical Requirements

- [ ] Create `/api/v1/dashboard/anomalies` endpoint
- [ ] Integrate with anomaly detection ML service
- [ ] Implement WebSocket for real-time anomaly alerts
- [ ] Create anomaly severity scoring algorithm
- [ ] Store anomaly history for trending

### Anomaly Data Model

```typescript
interface Anomaly {
  id: string;
  metric: string;
  detectedAt: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  primaryDriver: string;
  impactValue: number;
  impactPercentage: number;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  assignedTo?: string;
  relatedAnomalies?: string[];
}
```

### Story Points: 5

### Priority: P0

---

## US-DASH-005: AI Strategic Guidance

### Story

**As a** CFO
**I want to** receive AI-generated strategic insights on dashboard load
**So that** I can immediately understand the key financial narrative

### Description

Display an AI insight banner at the top of the dashboard that provides a contextual, strategic summary of the current financial position, generated by Gemini based on real-time data.

### Acceptance Criteria

```gherkin
Feature: AI Strategic Guidance

  Scenario: View AI insight on dashboard load
    Given I navigate to the Executive Dashboard
    When the page loads
    Then I should see an AI Insight banner below the header
    And the banner should display:
      | Element | Description |
      | Icon | Brain/Activity icon in blue |
      | Title | "AI Strategic Guidance" |
      | Insight | 1-2 sentence strategic summary |
    And the insight should be contextually relevant to current data

  Scenario: AI insight updates with data changes
    Given I am viewing the dashboard
    And the underlying financial data changes significantly
    When the dashboard refreshes
    Then the AI insight should regenerate
    And the new insight should reflect the data changes

  Scenario: AI insight loading state
    Given I am navigating to the dashboard
    When the AI is generating the insight
    Then I should see a loading animation
    And the text should show "Analyzing strategic financial positioning..."
    And the insight should appear within 5 seconds

  Scenario: AI insight generation failure
    Given there is an error generating the AI insight
    When the dashboard tries to display the insight
    Then a fallback message should be shown
    And the message should be: "Strategic analysis temporarily unavailable"
    And a retry button should be available

  Scenario: Click to expand AI conversation
    Given I see an AI insight on the dashboard
    When I click "Ask follow-up" or the insight banner
    Then I should navigate to the AI Agent module
    And the context from the insight should be pre-loaded
```

### Technical Requirements

- [ ] Create `/api/v1/ai/strategic-insight` endpoint
- [ ] Implement insight caching (5-minute TTL)
- [ ] Pass current KPI data as context to Gemini
- [ ] Implement graceful fallback for API failures
- [ ] Track insight generation latency

### Prompt Engineering

```typescript
const strategicInsightPrompt = `
Based on the following financial metrics, provide a 1-2 sentence
strategic guidance for the CFO:

- Rule of 40 Score: {{rule_of_40}}
- Revenue Growth (YoY): {{revenue_growth}}%
- EBITDA Margin: {{ebitda_margin}}%
- Forecast Variance: {{forecast_variance}}% vs Budget
- Active Anomalies: {{anomaly_count}} ({{high_severity_count}} high severity)
- Cash Runway: {{runway_months}} months

Focus on the most actionable insight. Be specific and data-driven.
`;
```

### Story Points: 3

### Priority: P0

---

## US-DASH-006: KPI Drill-Down Modal

### Story

**As a** CFO
**I want to** click on a KPI card to see detailed trend analysis
**So that** I can understand the drivers behind the numbers

### Description

Enable clicking on KPI cards to open a modal showing historical trend chart, comparative analysis, and a link to navigate to the detailed module view.

### Acceptance Criteria

```gherkin
Feature: KPI Drill-Down Modal

  Scenario: Open KPI detail modal
    Given I am viewing the dashboard KPI cards
    When I click on the "EBITDA Margin" KPI card
    Then a modal should open with title "EBITDA Margin Trend Analysis"
    And I should see a 6-month trend chart
    And I should see key statistics

  Scenario: View trend chart in modal
    Given the KPI detail modal is open
    Then I should see a chart showing:
      | Period | Value |
      | 6 months of historical data | Monthly values |
    And the chart should match the KPI type (area/line/bar)
    And the current value should be highlighted

  Scenario: Navigate to detailed report
    Given the KPI detail modal is open
    When I click "View Detailed Report" button
    Then the modal should close
    And I should navigate to the appropriate module
      | KPI | Target Module |
      | Revenue | Revenue & Profitability |
      | ACV | Sales Pipeline |
      | EBITDA Margin | Cost Management |
      | Rule of 40 | Revenue & Profitability |

  Scenario: Close modal
    Given the KPI detail modal is open
    When I click the X button or press Escape
    Then the modal should close smoothly
    And focus should return to the KPI card
```

### Technical Requirements

- [ ] Create reusable modal component
- [ ] Implement chart type mapping per KPI
- [ ] Implement navigation routing logic
- [ ] Add keyboard accessibility (Escape to close, Tab navigation)
- [ ] Implement modal animation (zoom-in effect)

### Story Points: 3

### Priority: P1

---

## US-DASH-007: Root Cause Analysis Modal

### Story

**As a** CFO
**I want to** see AI-powered root cause analysis for detected anomalies
**So that** I can understand why a variance occurred without manual investigation

### Description

When clicking on an anomaly, display a detailed modal showing the anomaly profile, AI-generated root cause narrative, driver analysis, hypothesis tracking, and recommended actions.

### Acceptance Criteria

```gherkin
Feature: Root Cause Analysis Modal

  Scenario: Open RCA modal for anomaly
    Given I click on an anomaly in the Strategic Risks card
    Then a detailed modal should open
    And I should see the following sections:
      | Section | Content |
      | Header | Anomaly title, severity badge, close button |
      | Anomaly Profile | Metric, Driver, Impact, Severity, Date |
      | AI Root Cause Analysis | AI-generated narrative |
      | Recommended Action Plan | Action items (after generation) |

  Scenario: AI generates root cause narrative
    Given the RCA modal is open
    When the AI analysis begins
    Then I should see a loading state: "Consulting Knowledge Graph..."
    And within 10 seconds, I should see a narrative explaining:
      - Business context
      - Why the anomaly occurred
      - Impact assessment
    And the narrative should be under 100 words

  Scenario: Generate action plan
    Given the RCA narrative has loaded
    And I review the analysis
    When I click "Generate Plan" button
    Then the AI should generate a step-by-step action plan
    And the plan should include:
      | Element | Example |
      | Action items | Bullet points |
      | Assigned department | "Sales", "Engineering", "Finance" |
      | Specific steps | Actionable recommendations |

  Scenario: Assign action plan to owner
    Given an action plan has been generated
    When I click "Assign to Owner"
    Then I should see a user selection dropdown
    And upon selecting a user, the plan should be assigned
    And an audit log entry should be created
    And a notification should be sent to the assignee

  Scenario: RCA generation failure
    Given there is an error generating the RCA
    When the modal attempts to display the analysis
    Then I should see: "Unable to generate analysis. Please try again."
    And a "Retry" button should be available
```

### Technical Requirements

- [ ] Integrate with `generateRootCauseNarrative()` Gemini service
- [ ] Integrate with `generateActionPlan()` Gemini service
- [ ] Implement retry logic with exponential backoff
- [ ] Cache RCA results for 1 hour
- [ ] Create action plan assignment workflow
- [ ] Log all AI generations in audit trail

### RCA Modal Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [!] Strategic Anomaly Detected                    [X Close] │
│     Impact Assessment & Remediation                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  LEFT COLUMN                    │  RIGHT COLUMN              │
│  ┌──────────────────────────┐  │  ┌──────────────────────┐  │
│  │ ANOMALY PROFILE          │  │  │ ACTION PLAN          │  │
│  │ • Metric: OpEx           │  │  │                      │  │
│  │ • Driver: Cloud Infra    │  │  │ [Generate Plan]      │  │
│  │ • Impact: -$150K         │  │  │                      │  │
│  │ • Severity: HIGH         │  │  │ or                   │  │
│  └──────────────────────────┘  │  │                      │  │
│  ┌──────────────────────────┐  │  │ • Action items...    │  │
│  │ AI ROOT CAUSE ANALYSIS   │  │  │ • Step 2...          │  │
│  │                          │  │  │ • Step 3...          │  │
│  │ [Loading indicator]      │  │  │                      │  │
│  │ or                       │  │  │ [Assign to Owner]    │  │
│  │ AI-generated narrative   │  │  │                      │  │
│  └──────────────────────────┘  │  └──────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Story Points: 8

### Priority: P0

---

## US-DASH-008: Action Plan Assignment

### Story

**As a** CFO
**I want to** assign generated action plans to team members
**So that** anomaly remediation is tracked and accountability is established

### Description

After an AI-generated action plan is created, allow assignment to a user with due date, priority, and notification.

### Acceptance Criteria

```gherkin
Feature: Action Plan Assignment

  Scenario: Assign action plan to user
    Given an action plan has been generated for an anomaly
    When I click "Assign to Owner"
    Then I should see an assignment form with:
      | Field | Type |
      | Assignee | User dropdown (searchable) |
      | Due Date | Date picker (default: 7 days) |
      | Priority | Select (High/Medium/Low) |
      | Notes | Text area (optional) |

  Scenario: Send assignment notification
    Given I complete the assignment form
    When I click "Assign"
    Then the assignee should receive:
      - Email notification
      - In-app notification
    And the notification should include:
      - Anomaly summary
      - Action plan items
      - Due date
      - Link to view details

  Scenario: Track assignment status
    Given an action plan has been assigned
    When I view the anomaly in the dashboard
    Then I should see assignment status:
      | Status | Badge Color |
      | Assigned | Blue |
      | In Progress | Yellow |
      | Completed | Green |
      | Overdue | Red |

  Scenario: View all assigned action items
    Given I am the CFO
    When I navigate to Governance > Action Items
    Then I should see all assigned action plans
    And I should be able to filter by status, assignee, and due date
```

### Technical Requirements

- [ ] Create action_plans table
- [ ] Implement assignment API endpoint
- [ ] Create email notification service integration
- [ ] Implement in-app notification system
- [ ] Create action item dashboard view

### Story Points: 5

### Priority: P1

---

## US-DASH-009: Rule of 40 Visualization

### Story

**As a** CFO
**I want to** see our Rule of 40 position relative to competitors
**So that** I can assess our competitive financial positioning

### Description

Display a scatter chart showing the organization's position (growth rate vs. margin) against industry benchmarks and competitors, with the Rule of 40 threshold line.

### Acceptance Criteria

```gherkin
Feature: Rule of 40 Scatter Chart

  Scenario: View Rule of 40 scatter chart
    Given I am on the Executive Dashboard
    When the Rule of 40 section loads
    Then I should see a scatter chart with:
      | Axis | Description |
      | X-Axis | Revenue Growth Rate (%) |
      | Y-Axis | Profit Margin (%) |
      | Threshold | Line at X + Y = 40 |
      | Our Position | Star marker in blue |
      | Competitors | Gray dots |

  Scenario: Identify our position
    Given the scatter chart is displayed
    Then our company's position should be:
      - Highlighted with a distinct star shape
      - Labeled as "Us (Current)"
      - Colored in blue
      - Interactive on hover (show exact values)

  Scenario: View competitor positions
    Given competitor data is available
    When I hover over a competitor dot
    Then I should see a tooltip with:
      | Field | Example |
      | Company | "Competitor A" |
      | Growth | "20%" |
      | Margin | "10%" |
      | Rule of 40 Score | "30" |

  Scenario: Rule of 40 threshold line
    Given the scatter chart is displayed
    Then a diagonal line should represent X + Y = 40
    And the area above the line should be subtly highlighted
    And a label should indicate "Rule of 40 Threshold"
```

### Technical Requirements

- [ ] Create `/api/v1/dashboard/rule-of-40` endpoint
- [ ] Integrate competitor benchmark data source
- [ ] Calculate growth and margin from financial data
- [ ] Implement responsive scatter chart with Recharts

### Story Points: 3

### Priority: P2

---

## US-DASH-010: Real-Time Data Refresh

### Story

**As a** CFO
**I want to** have the dashboard automatically refresh data
**So that** I always see the most current financial information

### Description

Implement configurable auto-refresh for dashboard data with visual indicators of data freshness and manual refresh capability.

### Acceptance Criteria

```gherkin
Feature: Real-Time Data Refresh

  Scenario: Automatic data refresh
    Given I am viewing the dashboard
    And auto-refresh is enabled (default: 5 minutes)
    When the refresh interval elapses
    Then all dashboard data should refresh
    And a subtle refresh indicator should animate
    And the "Last updated" timestamp should update

  Scenario: Manual refresh
    Given I am viewing the dashboard
    When I click the refresh icon in the header
    Then all data should immediately refresh
    And a loading indicator should show during refresh
    And a toast should confirm "Dashboard updated"

  Scenario: Configure refresh interval
    Given I am on the dashboard settings
    When I change the refresh interval to 10 minutes
    Then the new interval should take effect
    And my preference should be saved

  Scenario: Pause auto-refresh
    Given I am actively interacting with the dashboard
    When I open a modal or start editing
    Then auto-refresh should pause
    And it should resume when I close the modal

  Scenario: Data freshness indicator
    Given I am viewing the dashboard
    Then I should see "Last updated: X minutes ago"
    And if data is stale (>15 minutes), a warning should show
```

### Technical Requirements

- [ ] Implement React Query's refetch interval
- [ ] Create user preference storage for refresh settings
- [ ] Implement WebSocket for push-based updates (optional)
- [ ] Add document visibility API to pause when tab inactive
- [ ] Create data freshness calculation

### Story Points: 3

### Priority: P1

---

## Story Summary

| Story ID | Title | Priority | Points | Dependencies |
|----------|-------|----------|--------|--------------|
| US-DASH-001 | Primary KPI Display | P0 | 3 | - |
| US-DASH-002 | Rolling Forecast Visualization | P0 | 5 | - |
| US-DASH-003 | Cash Flow Projection | P0 | 5 | - |
| US-DASH-004 | Strategic Anomaly Detection | P0 | 5 | AI Service |
| US-DASH-005 | AI Strategic Guidance | P0 | 3 | AI Service |
| US-DASH-006 | KPI Drill-Down Modal | P1 | 3 | US-DASH-001 |
| US-DASH-007 | Root Cause Analysis Modal | P0 | 8 | US-DASH-004, AI Service |
| US-DASH-008 | Action Plan Assignment | P1 | 5 | US-DASH-007 |
| US-DASH-009 | Rule of 40 Visualization | P2 | 3 | - |
| US-DASH-010 | Real-Time Data Refresh | P1 | 3 | - |
| **Total** | | | **43** | |

---

## Definition of Done

- [ ] Code complete with unit tests (>80% coverage)
- [ ] Integration tests passing
- [ ] UI matches design specifications
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance benchmarks met (LCP < 2.5s)
- [ ] Mobile/tablet responsive
- [ ] Error states implemented
- [ ] Loading states implemented
- [ ] Code reviewed and merged
- [ ] QA sign-off received
