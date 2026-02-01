# User Stories: Scenario Planning Module

## Module Overview

**Module ID:** SCEN
**Module Name:** Scenario Planning & Simulation
**Priority:** P0 (Critical)
**Epic:** Strategic Planning Intelligence

---

## US-SCEN-001: Multi-Variable Scenario Modeling

### Story

**As a** FP&A director
**I want to** model scenarios by adjusting multiple business variables
**So that** I can understand the impact of different strategic decisions

### Description

Provide an interactive scenario modeling interface with sliders for key variables (investment, headcount, pricing) that instantly recalculate financial projections.

### Acceptance Criteria

```gherkin
Feature: Multi-Variable Scenario Modeling

  Scenario: Adjust single variable
    Given I am on the Scenario Planning page
    And I see the baseline forecast
    When I move the "Investment" slider from 0% to +20%
    Then the revenue forecast should recalculate
    And the chart should update in real-time
    And I should see the projected impact displayed

  Scenario: View scenario variables
    Given I am configuring a scenario
    Then I should see adjustment sliders for:
      | Variable | Range | Default | Unit |
      | Investment | -50% to +100% | 0% | % change |
      | Headcount | -30% to +50% | 0% | % change |
      | Price | -20% to +30% | 0% | % change |
    And each slider should show current value and impact

  Scenario: Real-time projection update
    Given I adjust the "Headcount" slider
    When the value changes
    Then within 500ms, the following should update:
      - Revenue projection chart
      - Margin projections
      - Cash flow forecast
      - Break-even timeline

  Scenario: Combined variable effects
    Given I set multiple variables:
      | Variable | Value |
      | Investment | +15% |
      | Headcount | +10% |
      | Price | -5% |
    Then the combined effect should be calculated
    And I should see:
      - Net revenue impact
      - Net margin impact
      - Interaction effects noted

  Scenario: Reset to baseline
    Given I have made multiple adjustments
    When I click "Reset to Baseline"
    Then all sliders should return to 0%
    And projections should show original forecast
    And the change should animate smoothly
```

### Technical Requirements

- [ ] Create scenario calculation engine (backend)
- [ ] Implement real-time recalculation API
- [ ] Create slider components with debounce
- [ ] Build variable interaction model
- [ ] Add undo/redo capability

### Variable Impact Model

```typescript
interface ScenarioVariable {
  name: string;
  baseValue: number;
  adjustment: number;        // Percentage change
  min: number;
  max: number;
  step: number;
  impactMultiplier: {        // How this affects other metrics
    revenue: number;
    cost: number;
    margin: number;
    headcount: number;
  };
}

interface ScenarioCalculation {
  variables: ScenarioVariable[];
  baseline: FinancialProjection;
  adjusted: FinancialProjection;
  delta: {
    revenue: number;
    cost: number;
    margin: number;
    netIncome: number;
  };
  interactionEffects: string[];  // "Investment + Headcount boost = synergy"
}
```

### Story Points: 8

### Priority: P0

---

## US-SCEN-002: Monte Carlo Simulation

### Story

**As a** CFO
**I want to** run Monte Carlo simulations on my scenarios
**So that** I can understand the range of possible outcomes and their probabilities

### Description

Implement Monte Carlo simulation that generates thousands of possible outcomes based on variable distributions, presenting results as probability distributions and confidence intervals.

### Acceptance Criteria

```gherkin
Feature: Monte Carlo Simulation

  Scenario: Run simulation
    Given I have configured a scenario
    When I click "Run Simulation"
    Then the system should:
      - Run 10,000 iterations
      - Display a progress indicator
      - Complete within 10 seconds
      - Generate probability distribution

  Scenario: View probability distribution
    Given a simulation has completed
    When I view the results
    Then I should see a histogram showing:
      | Outcome | Probability |
      | $50M - $55M | 10% |
      | $55M - $60M | 25% |
      | $60M - $65M | 40% |
      | $65M - $70M | 20% |
      | $70M+ | 5% |
    And the distribution should be color-coded by probability

  Scenario: View confidence intervals
    Given simulation results are displayed
    Then I should see:
      - P10 (10th percentile): $52M
      - P50 (median): $62M
      - P90 (90th percentile): $68M
      - Mean: $61.5M
      - Standard deviation: $4.2M

  Scenario: Sensitivity analysis
    Given simulation has run
    When I view "Sensitivity Analysis"
    Then I should see a tornado chart showing:
      - Which variables have most impact
      - Ranked by contribution to variance
      - Direction of impact (positive/negative)

  Scenario: Configure variable distributions
    Given I want to customize uncertainty
    When I click "Configure Distributions"
    Then for each variable I should be able to set:
      | Setting | Options |
      | Distribution Type | Normal, Triangular, Uniform |
      | Mean/Mode | Numeric input |
      | Std Dev/Range | Numeric input |
      | Correlation | With other variables |
```

### Technical Requirements

- [ ] Create Monte Carlo simulation engine
- [ ] Implement multiple distribution types
- [ ] Calculate statistics (percentiles, mean, std dev)
- [ ] Build histogram visualization
- [ ] Create sensitivity/tornado chart
- [ ] Support correlation between variables

### Monte Carlo Data Model

```typescript
interface MonteCarloConfig {
  iterations: number;
  variables: VariableDistribution[];
  correlations?: CorrelationMatrix;
  seed?: number;               // For reproducibility
}

interface VariableDistribution {
  name: string;
  distributionType: 'normal' | 'triangular' | 'uniform' | 'lognormal';
  params: {
    mean?: number;
    stdDev?: number;
    min?: number;
    max?: number;
    mode?: number;            // For triangular
  };
}

interface MonteCarloResults {
  iterations: number;
  executionTimeMs: number;
  outcomes: number[];
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: Record<number, number>;  // {10: value, 25: value, ...}
  };
  histogram: {
    buckets: { min: number; max: number; count: number; probability: number }[];
  };
  sensitivityAnalysis: {
    variable: string;
    contribution: number;     // % of total variance
    correlation: number;      // With outcome
  }[];
}
```

### Story Points: 8

### Priority: P0

---

## US-SCEN-003: AI-Generated Scenario Analysis

### Story

**As a** CFO
**I want to** receive AI analysis of my scenario results
**So that** I can get strategic insights and recommendations

### Description

Integrate Gemini AI to analyze scenario results and provide strategic recommendations categorized into mitigation strategies and growth opportunities.

### Acceptance Criteria

```gherkin
Feature: AI Scenario Analysis

  Scenario: Generate AI analysis
    Given I have run a scenario simulation
    When I click "Analyze with AI"
    Then the system should:
      - Send scenario parameters to Gemini
      - Display loading state: "Analyzing scenario..."
      - Return structured analysis within 15 seconds

  Scenario: View mitigation strategies
    Given AI analysis is complete
    When I view the results
    Then I should see "Mitigation Strategies" section with:
      - 3-5 specific recommendations
      - Each with rationale
      - Potential impact quantified
      - Implementation difficulty noted

  Scenario: View growth opportunities
    Given AI analysis is complete
    When I view the results
    Then I should see "Growth Opportunities" section with:
      - 3-5 specific opportunities
      - Investment required
      - Expected ROI
      - Timeline to realize

  Scenario: Analysis considers context
    Given my scenario includes headcount reduction
    When AI generates analysis
    Then mitigation strategies should address:
      - Execution risks of reduction
      - Customer impact mitigation
      - Knowledge retention approaches
    And growth opportunities should consider:
      - Efficiency gains
      - Reallocation possibilities

  Scenario: Save analysis with scenario
    Given I want to keep the AI analysis
    When I save the scenario
    Then the AI analysis should be persisted
    And accessible when I reload the scenario
    And timestamped with model version
```

### Technical Requirements

- [ ] Create scenario analysis prompt template
- [ ] Implement structured JSON response parsing
- [ ] Store analysis with scenario
- [ ] Handle API failures gracefully
- [ ] Track AI model version for reproducibility

### AI Analysis Structure

```typescript
interface AIScenarioAnalysis {
  scenarioId: string;
  generatedAt: Date;
  modelVersion: string;
  mitigation: StrategyRecommendation[];
  growth: StrategyRecommendation[];
  summary: string;
  confidence: 'high' | 'medium' | 'low';
  dataQualityNotes?: string;
}

interface StrategyRecommendation {
  title: string;
  description: string;
  rationale: string;
  potentialImpact: {
    metric: string;
    value: string;
    confidence: 'high' | 'medium' | 'low';
  };
  implementationDifficulty: 'low' | 'medium' | 'high';
  timelineWeeks: number;
  dependencies?: string[];
}
```

### Story Points: 5

### Priority: P0

---

## US-SCEN-004: Save and Compare Scenarios

### Story

**As a** FP&A analyst
**I want to** save scenarios and compare them side-by-side
**So that** I can evaluate different strategic options

### Description

Allow users to save scenarios with names and descriptions, and provide a comparison view to evaluate multiple scenarios against each other.

### Acceptance Criteria

```gherkin
Feature: Save and Compare Scenarios

  Scenario: Save a scenario
    Given I have configured a scenario
    When I click "Save Scenario"
    Then I should be prompted for:
      | Field | Required |
      | Name | Yes |
      | Description | No |
      | Tags | No |
    And upon saving, the scenario should be persisted
    And I should see confirmation: "Scenario saved"

  Scenario: List saved scenarios
    Given I have saved multiple scenarios
    When I navigate to "Saved Scenarios"
    Then I should see a list showing:
      | Name | Created | Modified | Tags | Actions |
      | Aggressive Growth | Feb 10 | Feb 14 | Growth | Edit, Delete |
      | Conservative | Feb 8 | Feb 8 | Base | Edit, Delete |
      | Recession Plan | Jan 15 | Jan 20 | Risk | Edit, Delete |

  Scenario: Compare two scenarios
    Given I select two scenarios to compare
    When I click "Compare"
    Then I should see a side-by-side view:
      | Metric | Baseline | Scenario A | Scenario B | Delta A | Delta B |
      | Revenue | $60M | $65M | $55M | +$5M | -$5M |
      | Margin | 20% | 18% | 23% | -2% | +3% |
      | Cash | $10M | $8M | $12M | -$2M | +$2M |
    And differences should be color-coded

  Scenario: Compare up to 4 scenarios
    Given I want to compare multiple options
    When I select 4 scenarios
    Then all 4 should display in comparison view
    And I should be able to toggle scenarios on/off
    And selecting more than 4 should show warning

  Scenario: Export comparison report
    Given I am viewing a scenario comparison
    When I click "Export Comparison"
    Then I should get a PDF/Excel with:
      - All metrics compared
      - Visual charts
      - AI analysis summaries
      - Assumptions table
```

### Technical Requirements

- [ ] Create scenarios CRUD API
- [ ] Implement scenario versioning
- [ ] Build comparison view component
- [ ] Create export functionality
- [ ] Add scenario sharing permissions

### Scenario Storage Model

```typescript
interface SavedScenario {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  description?: string;
  tags: string[];
  variables: ScenarioVariable[];
  monteCarloResults?: MonteCarloResults;
  aiAnalysis?: AIScenarioAnalysis;
  baseline: FinancialProjection;
  adjusted: FinancialProjection;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isTemplate: boolean;        // Can be used as starting point
  sharedWith?: string[];      // User IDs
}
```

### Story Points: 5

### Priority: P1

---

## US-SCEN-005: Sensitivity Analysis Visualization

### Story

**As a** strategic planner
**I want to** visualize which variables have the most impact
**So that** I can focus planning efforts on the most important factors

### Description

Display sensitivity analysis using tornado charts and spider diagrams to show the relative impact of each variable on the outcome.

### Acceptance Criteria

```gherkin
Feature: Sensitivity Analysis Visualization

  Scenario: View tornado chart
    Given a Monte Carlo simulation has run
    When I view the Sensitivity Analysis section
    Then I should see a tornado chart showing:
      - Variables ranked by impact (largest at top)
      - Bars extending left (negative) and right (positive)
      - Clear labels with impact values
      - Color coding by category

  Scenario: Tornado chart interaction
    Given the tornado chart is displayed
    When I hover over a variable bar
    Then I should see:
      - Variable name
      - Base case value
      - Low case value and outcome
      - High case value and outcome
      - Contribution to variance: X%

  Scenario: One-at-a-time sensitivity
    Given I want to see individual variable impacts
    When I select "One-at-a-time Analysis"
    Then I should see a table:
      | Variable | -20% Impact | Base | +20% Impact |
      | Price | -$5M | $60M | +$4M |
      | Volume | -$4M | $60M | +$4M |
      | Cost | +$3M | $60M | -$3M |
    And links to drill into each variable

  Scenario: Spider/radar chart view
    Given I want to see multi-dimensional impact
    When I switch to "Spider Chart" view
    Then I should see:
      - Each axis representing a variable
      - Multiple scenario lines overlaid
      - Interactive hover for values
      - Toggle for different scenarios

  Scenario: Identify key drivers
    Given sensitivity analysis is complete
    Then I should see a summary:
      - "Top 3 drivers account for 78% of variance"
      - Priority ranking for planning focus
      - AI recommendation on where to focus
```

### Technical Requirements

- [ ] Create tornado chart component
- [ ] Implement spider/radar chart
- [ ] Calculate one-at-a-time sensitivity
- [ ] Rank variables by contribution
- [ ] Add drill-down to variable details

### Story Points: 5

### Priority: P2

---

## Story Summary

| Story ID | Title | Priority | Points | Dependencies |
|----------|-------|----------|--------|--------------|
| US-SCEN-001 | Multi-Variable Scenario Modeling | P0 | 8 | - |
| US-SCEN-002 | Monte Carlo Simulation | P0 | 8 | US-SCEN-001 |
| US-SCEN-003 | AI-Generated Scenario Analysis | P0 | 5 | US-SCEN-002, Gemini |
| US-SCEN-004 | Save and Compare Scenarios | P1 | 5 | US-SCEN-001 |
| US-SCEN-005 | Sensitivity Analysis Visualization | P2 | 5 | US-SCEN-002 |
| **Total** | | | **31** | |

---

## Definition of Done

- [ ] Code complete with unit tests (>80% coverage)
- [ ] Monte Carlo accuracy verified against known distributions
- [ ] Simulations complete in <10 seconds
- [ ] AI analysis returns valid structured JSON
- [ ] Scenarios persist and reload correctly
- [ ] Comparison view handles edge cases
- [ ] Export functionality working
- [ ] Code reviewed and merged
- [ ] QA sign-off received
