# Antony - Progress Log

> Claude Code: Always update this file after completing tasks for Antony.
> Read `docs/teams/COMMON.md` for team workflow rules.

---

<!-- Add entries below in reverse chronological order (newest first) -->

## 2026-02-17 - Global Filters Fix: Sales Performance + ARR Analytics
**Task:** Ensure global filters (Region, Vertical, Segment, Quantum/SMART) work across ALL tabs, charts, and tables in both Sales Performance and ARR Analytics pages.
**Changes:**
- `frontend/src/modules/sales/pages/SalesPage.tsx`:
  - **Moved `salespeople`, `quarterlyForecastData`, `regionalForecastData`** useMemos from before filters to after `filteredOpportunities`. Now built from `filteredOpportunities` instead of unfiltered `opportunities`.
  - **Fixed "Forecast by Quarter" chart** (Overview tab): was using unfiltered data, now uses filtered quarterly forecast
  - **Fixed "Regional Forecast vs Target" table** (Forecast tab): was using unfiltered data, now uses filtered regional forecast
  - **Fixed "Pipeline Coverage by Rep" chart** (Quota tab): `salespeople` now built from filtered opportunities
  - **Fixed "Forecast Trend" chart** (Forecast tab): replaced hardcoded mock data with real cumulative forecast built from `filteredOpportunities` (won deals + weighted pipeline by month)
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - **Moved `products`** useMemo from before filters to after `filteredCustomers`. Now built from `filteredCustomers` instead of unfiltered `customers`.
  - **Fixed "By Category" view**: category table, KPI cards, and bar chart now respect global filters
  - **Fixed `categoryGroupedProducts`**: already used `filteredCustomers` for distinct customer counts (from previous fix)
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. The root cause in both pages was the same: builder functions (`buildRealProducts`, `buildRealSalespeople`, `buildQuarterlyForecast`, `buildRegionalForecast`) received unfiltered base data instead of the filtered version. All 4 tabs in Sales Performance and all 4 tabs in ARR Analytics now respond to global filter changes.

## 2026-02-16 - Customer Category Matrix + Customer Name Filter Across Tabs
**Task:** Rebuild the "By Customer" view in ARR by Category tab to show Customer summary level with SOW Name drill-down, using Category columns instead of Sub-Category. Add Expand All / Collapse All. Add Customer Name filter to: By Customer view, Customers tab, and ARR Movement Details table.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - **New state**: `expandedMatrixCustomers` (Set<string>) for matrix drill-down, `customerNameFilter` (string) shared across tabs
  - **Customer Category Matrix** ("By Customer" view, rewritten):
    - Groups `filteredCustomersForProducts` by customer name → summary row shows customer name (+/− toggle), region, vertical, category-level ARR columns, total ARR, SOW count
    - Expand: shows individual SOW rows with SOW Name (from SOW mapping) + SOW ID, category ARR per SOW
    - Category columns derived from `productCategoryIndex` (aggregates sub-category ARR up to category)
    - Customer Name search filter at top, Expand All / Collapse All buttons
    - Title: "Customer Category Matrix" (was "Customer Sub-Category Matrix")
  - **Scatter chart**: renamed to "Category Performance Matrix" using `categoryGroupedProducts`
  - **Customers Tab**: Added Customer Name text input in filter bar (alongside 2026 Renewals / Risk toggles). Filters `displayedSummary` by `customerName`.
  - **ARR Movement Details**: Added Customer Name text input above the table. Filters movement rows by `name`. Count in header reflects filtered count.
  - **Customer filter is shared**: Single `customerNameFilter` state used across all three tabs (persists when switching tabs, not reset by tab-switch logic). Clear button (×) next to each input.
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. The customer filter is case-insensitive substring match. Matrix shows max 50 customers. SOW Name comes from `realData.sowMappingIndex[sowId].SOW_Name` with fallback to `SOW {id}`.

## 2026-02-16 - ARR by Category Tab: Category-First Drill-Down with Expand/Collapse
**Task:** Restructure the "ARR by Sub-Category" tab to be "ARR by Category" with Category as the first level and Sub-Category as a drill-down using +/− expand. Add Expand All / Collapse All buttons.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - **Tab renamed**: "ARR by Sub-Category" → "ARR by Category"
  - **View mode button**: "By Sub-Category" → "By Category"
  - **New state**: `expandedProductCategories` (Set<string>) for tracking which categories are expanded
  - **New useMemo**: `categoryGroupedProducts` — groups `filteredProducts` by category, aggregates totalARR, customerCount, avgARRPerCustomer, and lists sub-categories per category. Sorted by totalARR descending.
  - **Category table**: Replaced flat sub-category table with hierarchical Category → Sub-Category drill-down. Category rows show `+`/`−` toggle, bold styling, and aggregated metrics. Clicking a category row expands/collapses its sub-category child rows (indented).
  - **Expand All / Collapse All**: Two buttons in the table header. "Expand All" sets all category names into the set. "Collapse All" clears the set.
  - **KPI cards updated**: Total Categories (with sub-category count below), Top Category, Total Sub-Categories, Most Adopted Category.
  - **Bar chart**: Changed from "Sub-Category ARR Comparison" to "Category ARR Comparison" showing category-level data.
  - **Removed**: Category/Sub-Category filter dropdowns (no longer needed since categories are the primary grouping with drill-down).
  - **"By Customer" view**: Unchanged.
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. Category rows have light background and bold text. Sub-category rows are indented with `pl-12`. The `+`/`−` button is styled with a rounded primary-colored badge.

## 2026-02-13 - Expand All/Collapse All + Full Risk Categories + Risk-Only Filter Fix
**Task:** Add Expand All / Collapse All buttons to Customers table. Fix Renewal Risk Distribution pie chart to show all actual categories from data (High Risk, Lost, Mgmt Approval, In Process, Win/PO). Make "Renewal Risk Only" filter show only High Risk and Lost customers.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - **Expand All / Collapse All**: Added two buttons in the customer table header. "Expand All" sets `expandedCustomers` to all displayed customers. "Collapse All" clears the set.
  - **`realRenewalRiskDistribution`**: Rewritten to dynamically collect all risk categories from data instead of hardcoded Low/Medium/High Risk/Critical. Filters out bad data (CSV parse artifacts starting with `"`, `#N/A`). Ordered: High Risk, Lost, Mgmt Approval, In Process, Win/PO.
  - **`RISK_COLORS` map**: New constant mapping all 5 risk categories to distinct colors (Lost=red, High Risk=orange, Mgmt Approval=yellow, In Process=blue, Win/PO=green).
  - **`riskBadge` helper**: Updated to use per-category badge colors for all 5 categories.
  - **Pie chart Cell colors**: Now use `RISK_COLORS[entry.name]` instead of hardcoded conditions.
  - **`customerSummaryRiskOnly`**: Changed to filter only customers with SOWs having "High Risk" or "Lost" risk (was previously `hasRenewalRisk` which matched any risk).
  - **`RISK_ONLY_CATEGORIES`**: New constant `['High Risk', 'Lost']` used by the Renewal Risk Only filter.
  - **`riskOrder`**: Updated to rank all 5 categories (Lost=5, High Risk=4, Mgmt Approval=3, In Process=2, Win/PO=1).
  - **Calendar `hasHighRisk`**: Now checks for "High Risk" OR "Lost" (was checking "Critical").
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. Pie chart now shows all 5 real risk categories. "Renewal Risk Only" checkbox filters to only High Risk + Lost. Clicking a pie segment still filters the table (existing interaction).

## 2026-02-13 - Cross-Interactions Across Overview, Movement, and Customers Tabs
**Task:** Add click-to-filter interactions across all tabs: Overview (ARR by Category/Region/Vertical charts filter each other and KPIs), Movement (summary cards + waterfall filter the details table and top movers), Customers (pie chart risk segments and calendar months filter the table, auto-expand rows on toggle).
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - **New state variables:**
    - `overviewCategoryFilter`, `overviewRegionFilter`, `overviewVerticalFilter` for Overview cross-filtering
    - `movementTypeFilter` for Movement card/waterfall click filtering
    - `selectedRiskFilter`, `selectedRenewalMonth` for Customers tab pie/calendar interactions
  - **Auto-expand**: `useEffect` auto-expands all customer rows when "Show 2026 Renewals" or "Renewal Risk Only" toggles on
  - **Tab reset**: `useEffect` resets all interactive filters when switching tabs
  - **Overview tab cross-filtering:**
    - `overviewFilteredCustomers` useMemo applies category/region/vertical click filters
    - `crossFilteredByCategory`, `crossFilteredByRegion`, `crossFilteredByVertical`, `crossFilteredCurrentARR` useMemos recompute chart data from filtered customers
    - Category bar chart: click a bar to toggle `overviewCategoryFilter`, selected bar highlighted (dark blue), unselected bars dimmed
    - Region bar chart: click a bar to toggle `overviewRegionFilter`, same highlight/dim pattern
    - Vertical pie chart: click a segment to toggle `overviewVerticalFilter`, selected segment has border, others dimmed
    - Current ARR KPI card shows filtered value when filters active, with "Filtered from $X" note
    - Active filter chips shown at top with individual and "Clear all" buttons
  - **Movement tab cross-filtering:**
    - `movementFilteredCustomers` useMemo filters `customersWithMovement` by `movementTypeFilter`
    - Summary cards (New Business, Expansion, etc.) are clickable toggles — selected card gets ring highlight, others dim
    - Movement Details table, Top Expansions, Top Contractions & Churns all use `movementFilteredCustomers`
    - Active filter chip shown when a card is selected
    - Table header shows count and filter name
  - **Customers tab interactions:**
    - Pie chart risk segments are clickable — toggle `selectedRiskFilter`, filtering the table to customers with matching risk on 2026 SOWs
    - Calendar months are clickable — toggle `selectedRenewalMonth`, filtering the table to customers with SOWs ending in that month
    - Active filter chips (Risk, Month) shown at top with clear buttons
    - Table `displayedSummary` applies `selectedRiskFilter` and `selectedRenewalMonth` before rendering
    - All interactive filters reset when "Show 2026 Renewals" is toggled off
  - **"Click to filter" hints** added below each interactive chart
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. All charts show "Click a bar/segment to filter" hint text. Clicking same element again deselects the filter (toggle behavior). Cross-filters compose — can click a Category AND a Region to see their intersection. All interactive state resets when switching tabs.

## 2026-02-13 - Customer Tab: Customer-Level ARR Summary with Expandable SOW Rows
**Task:** Rebuild the Customers tab in ARR Analytics to show customer-level ARR summaries with expandable SOW-level detail rows. Use SOW Name from updated SOW mapping template, Contract_End_Date from ARR snapshot for renewal dates, Renewal_Risk from ARR snapshot for risk categorization. Support "2026 Renewals Only" and "Renewal Risk Only" filters.
**Changes:**
- `frontend/src/shared/store/sowMappingStore.ts`:
  - Added `SOW_Name: string` to `SOWMappingRecord` interface
- `frontend/src/shared/store/realDataStore.ts`:
  - Added `SOW_Name: string` to `RawSOWMapping` interface
  - Updated SOW mapping parsing to extract `SOW Name` column (with fallback to `SOW_Name`)
- `frontend/src/modules/settings/pages/SettingsPage.tsx`:
  - Updated SOW mapping template headers/sample rows to include `SOW Name`
  - Updated SOW mapping CSV parser to extract `SOW_Name` field (backward compatible)
- `frontend/public/data/sow_mapping.csv`:
  - Replaced with latest template from Upload templates (includes SOW Name column)
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - Added `React` import for `React.Fragment`
  - Added `expandedCustomers` (Set state) and `show2026RenewalRiskOnly` (boolean state)
  - Added `toggleCustomerExpand()` handler
  - Added `SOWDetail` and `CustomerSummary` interfaces
  - Added `customerSummaryWithSOWs` useMemo: groups ARR snapshot rows (for selectedARRMonth) by Customer_Name, attaches SOW-level details (SOW_Name, ARR, Contract_End_Date, Renewal_Risk, platform) from snapshot + SOW mapping
  - Added `customerSummary2026Renewals` useMemo: filters for customers with SOWs ending in 2026
  - Added `customerSummaryRiskOnly` useMemo: filters for customers with Renewal_Risk set
  - Added `realRenewalRiskDistribution` useMemo: risk pie chart from real SOW-level data
  - Added `sortedCustomerSummary` useMemo: sorted customer list respecting both toggles and sort config
  - Rewrote `renderCustomersTab`:
    - Customer-level rows with `+`/`−` expand toggle
    - Columns: Customer, Total ARR, SOW count, Region, Vertical, Earliest Renewal, Risk
    - Expanded rows show SOW Name, SOW ID, ARR, Platform, Start Date, End Date, Risk badge
    - 2026 Renewal Risk Distribution pie chart uses real data with dynamic cell colors
    - 2026 Renewal Calendar uses SOW-level end dates
    - "Renewal Risk Only" sub-filter shows only customers with risk flagged
    - Top 10 Customers chart uses real summary data
    - Fallback to mock data when real data not loaded
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. Contract_End_Date and Renewal_Risk values come from the Monthly ARR Snapshot (only populated for some rows, mainly 1/1/2026 snapshot). SOW Name comes from the SOW Mapping CSV. The "2026 Renewals Only" filter now filters by SOWs with Contract_End_Date starting with "2026". When expanded, only the 2026 SOWs are shown if the filter is on.

## 2026-02-13 - Movement Tab Tables & Chart Aligned with ARR Bridge Filters
**Task:** Make all tables below the ARR Bridge (ARR Movement Details, Top Expansions, Top Contractions & Churns) and the Monthly Movement Trend chart use the same filters and date range as the waterfall bridge. Customer-wise details should reflect what is shown in the waterfall. Monthly Movement Trend shows gains and losses from Jan 2024 to prior month.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - Rewrote `customersWithMovement` useMemo to aggregate ARR snapshot rows by Customer_Name for the same date range and filters as the bridge (selectedARRMonth + lookback). Returns per-customer: Starting ARR, New Business, Expansion, Schedule Change, Contraction, Churn, Ending ARR, Net Change, movement type classification.
  - Added `filteredMovementTrend` useMemo — aggregates monthly movement data from Jan 2024 to prior month using filtered ARR snapshots, producing per-month: newBusiness, expansion, scheduleChange, contraction, churn, netChange.
  - Updated ARR Movement Details table with new columns: Starting ARR, New Business, Expansion, Schedule Chg, Contraction, Churn, Ending ARR, Net Change, Type.
  - Updated Top Expansions and Top Contractions & Churns cards to use snapshot-based customer data.
  - Replaced Monthly Movement Trend chart: changed from AreaChart (only gains) to BarChart with stacked gains (New Business + Expansion) and stacked losses (Contraction + Churn) with ReferenceLine at y=0. Shows full date range Jan 2024 to prior month. Schedule Change shown separately as it can be positive or negative.
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. Contraction and Churn values are negative in the CSV data so they naturally display below the zero line. All movement tab components now react to region/vertical/segment/Quantum-SMART filters and the same lookback period as the bridge.

## 2026-02-13 - ARR Bridge Uses Real Snapshot Data
**Task:** Rewrite the ARR Bridge (waterfall chart) in the Movement tab to use actual Monthly ARR Snapshot columns (Starting_ARR, New Business_ARR, Expansion_ARR, Schedule Change_ARR, Contraction_ARR, Churn_ARR, Ending_ARR) instead of mock data. Lookback period controls how many months back from the filtered month to aggregate.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - Extracted `buildWaterfallFromTotals()` helper function from the inline waterfall logic — takes startingARR, endingARR, and component totals, returns waterfall data structure
  - Rewrote `arrMovementData` useMemo to use `realData.arrSnapshots` directly:
    - Ending month = `selectedARRMonth` (from year/month filters)
    - Starting month = lookback months before that (1/3/6/12)
    - Aggregates all snapshot rows in the date range, applying `arrRowPassesFilters`
    - Starting ARR = sum of Starting_ARR from first month in range
    - Ending ARR = sum of Ending_ARR from last month in range
    - Components (New Business, Expansion, Schedule Change, Contraction, Churn) = sum across all months in range
    - Falls back to mock `arrMovementHistory` when real data unavailable
  - Dependencies updated: `selectedARRMonth`, `arrRowPassesFilters` added to useMemo deps
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. E.g., if filter = Jan 2026, lookback = 3: aggregates Nov 2025 + Dec 2025 + Jan 2026. Starting ARR = Nov 2025 Starting_ARR, Ending ARR = Jan 2026 Ending_ARR. All filters (region, vertical, segment, Quantum/SMART) apply to the bridge data.

## 2026-02-13 - Refresh CSVs + ARR by Category + Category/Sub-Category Terminology
**Task:** 1) Re-upload updated monthly_pipeline_snapshot (Quantum/SMART updates), sow_mapping (full region names). 2) Change "ARR by Product" in overview tab to "ARR by Category" (aggregated from sub-categories). 3) Use Category/Sub-Category terminology throughout (Sub-Category is the lowest classification level).
**Changes:**
- `frontend/public/data/monthly_pipeline_snapshot.csv` — **REPLACED** with updated data from Upload templates (Quantum/SMART updates, Feb 13)
- `frontend/public/data/sow_mapping.csv` — **REPLACED** with updated data (full region names: "North America" instead of "NA", "Middle East" instead of "ME", etc.)
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - Added `arrByCategory` useMemo — aggregates sub-category ARR up to Category level using `productCategoryIndex`
  - Changed overview tab chart from "ARR by Product" (sub-category level, with category filter) to "ARR by Category" (category level, no extra filter needed)
  - Tab "ARR by Products" → "ARR by Sub-Category"
  - View toggle "By Product" → "By Sub-Category"
  - KPI labels: "Total Products" → "Total Sub-Categories", "Top Product" → "Top Sub-Category", "Most Customers" → "Most Adopted"
  - "Product Performance" table → "Sub-Category Performance", column "Product" → "Sub-Category"
  - "Product ARR Comparison" chart → "Sub-Category ARR Comparison"
  - "Customer-Product Matrix" → "Customer Sub-Category Matrix"
  - Cross-sell labels: "1 Product" → "1 Sub-Category", "2 Products" → "2 Sub-Categories", etc.
  - "Product Performance Matrix" → "Sub-Category Performance Matrix"
  - Customer table column "Products" → "Sub-Categories"
- `frontend/src/modules/sales/pages/SalesPage.tsx`:
  - Filter label "Product Category" → "Category"
  - Section headings: "Pipeline by Product Sub-Category" → "Pipeline by Sub-Category"
  - "Forecast by Product Sub-Category" → "Forecast by Sub-Category"
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. SOW mapping now has full region names so `normalizeRegion()` passes them through (no abbreviation needed). Pipeline CSV header has whitespace around `License_ACV` but `parseCSV` already trims headers. No code changes needed for data parsing.

## 2026-02-12 - Year End ARR Card + Month Forecast Card + ARR Trend Breakdown
**Task:** 1) Rename "Forecasted ARR" KPI card to "Year End Forecasted ARR" (or "Year End ARR" for past years). 2) Add new "Forecasted ARR" card showing forecast for the specific selected month. 3) Break forecast in ARR Trend chart into stacked components: Ending ARR (Base), Renewals/Extensions, New/Upsell/Cross-Sell. 4) Remember: all pipeline in latest snapshot is Quantum.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - Extended `MonthlyARR` interface with `forecastBase`, `forecastRenewals`, `forecastNewBusiness` fields
  - Updated mock data generator to populate forecast breakdown fields
  - Updated `buildRealMonthlyARR` to split pipeline by Logo_Type: Renewal+Extension vs New Logo+Upsell+Cross-Sell. Two separate cumulative trackers (`cumulativeRenewals`, `cumulativeNewBiz`) populate the breakdown fields.
  - Added `monthForecastARR` useMemo — computes forecast for the specific selected month (past months show actual Ending ARR, future months show last actual + cumulative pipeline through that month)
  - Added `isFilteredYearPast` and `filteredYear` variables for KPI card labeling
  - Updated `metrics` useMemo: renamed `forecastedARR`→`yearEndARR`, added `monthForecast`, `yearEndGrowth`, `monthForecastGrowth`
  - Changed KPI grid from 4 to 5 columns: Current ARR, Year End Forecasted ARR (or Year End ARR), Forecasted ARR (month), NRR, GRR
  - Year End card label: "Year End Forecasted ARR (Dec 2026)" for current/future, "Year End ARR (Dec 2025)" for past
  - Forecasted ARR card shows forecast for selected month with month label
  - ARR Trend chart: replaced single `forecastedARR` area with 3 stacked areas (`forecastBase`, `forecastRenewals`, `forecastNewBusiness`) using `stackId="forecast"`
  - Updated export CSV to use new metric names
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. Pipeline = Quantum (saved to memory). Chart shows actual Ending ARR (solid) then stacked forecast breakdown (dashed): base ARR + renewals/extensions + new/upsell/cross-sell.

## 2026-02-12 - Pipeline Already Weighted + Forecast = End of Year + Filters on KPIs
**Task:** 1) Pipeline values (License_ACV, Deal_Value, Implementation_Value) are already weighted — remove double-weighting. 2) Forecast ARR = end of filtered year (Dec snapshot for past years, last actual + cumulative pipeline for current/future). 3) All filters (region, vertical, segment, Quantum/SMART) must work on Current ARR and Forecast ARR KPIs.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - Removed `* (row.Probability / 100)` from `buildRealMonthlyARR` pipeline forecast calculation (values already weighted)
  - Removed `* (row.Probability / 100)` from `pipelineForecastARR` useMemo (values already weighted)
  - Added `arrRowPassesFilters` useMemo — enriches ARR snapshot rows via SOW mapping, checks region/vertical/segment/platform/Quantum-SMART filters
  - Added `pipelineRowPassesFilters` useMemo — checks region/vertical/segment filters on pipeline rows
  - Updated `snapshotCurrentARR` to use `arrRowPassesFilters`
  - Updated `snapshotPreviousARR` to use `arrRowPassesFilters`
  - Added `forecastARR` useMemo — handles past years (actual Dec Ending_ARR) and current/future (last actual + cumulative filtered pipeline through Dec)
  - Updated `buildRealMonthlyARR` signature to accept filter functions `(store, arrFilter, pipelineFilter)`
  - Moved `monthlyARRData` useMemo after filter definitions, now passes filter functions to `buildRealMonthlyARR`
  - Updated `metrics` to use `forecastARR` instead of `pipelineForecastARR`
- `frontend/src/modules/sales/pages/SalesPage.tsx`:
  - Removed `* (prob / 100)` from pipeline `weightedValue` in `buildRealOpportunities` (values already weighted)
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. Pipeline CSV values are pre-multiplied by probability — no further weighting needed anywhere. Filters now propagate to KPI cards (Current ARR, Forecast ARR) and to the ARR Trend chart. Forecast for past years shows actual Dec Ending_ARR.

## 2026-02-12 - Fix Forecast: Latest Snapshot Month Only + Include Extension/Renewals
**Task:** Forecast ARR should use only the latest pipeline snapshot month (not latest per deal), include Extension/Renewals, and calculate cumulative weighted pipeline by expected close month.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx`:
  - `buildRealMonthlyARR`: Changed from "latest snapshot per deal" to "only latest Snapshot_Month" (Feb 2026). All deals in that snapshot included (Extension/Renewals not excluded). Weighted = License_ACV × Probability/100.
  - `pipelineForecastARR` useMemo: Same fix - finds max Snapshot_Month, filters to only that month's records. Includes all logo types (Extension, Renewal, New Logo, etc.).
  - Forecast for month M = Last actual Ending ARR + cumulative weighted pipeline deals closing from (prior month + 1) through M.
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** Build clean. E.g., Forecast Mar'26 = Jan'26 Ending ARR + weighted deals closing Feb'26 + weighted deals closing Mar'26.

## 2026-02-12 - ARR Overview Rework: Snapshot-Based Current ARR + Pipeline Forecast + Trend Graph
**Task:** 1) Re-upload updated Monthly_ARR_Snapshot CSV (new column names). 2) Current ARR = aggregate Ending_ARR from snapshot for selected year/month filter. 3) Year/Month filters default to prior month. 4) If year selected but no month → show Dec. 5) Forecasted ARR = Current ARR + weighted pipeline (License_ACV × Probability). 6) ARR Trend graph: actual Jan 2024 to prior month, forecast from current month to Dec 2026.
**Changes:**
- `frontend/public/data/monthly_arr_snapshot.csv` - **REPLACED** with updated data (new column names: `New Business_ARR`, `Schedule Change_ARR`)
- `frontend/src/shared/store/realDataStore.ts` - Updated ARR snapshot parsing to handle both old and new column names (`New_ARR`/`New Business_ARR`, `Schedule Change`/`Schedule Change_ARR`)
- `frontend/src/modules/revenue/pages/RevenuePage.tsx` - Major rework:
  - Year/month filter defaults now set to prior month (e.g., Year=2026, Month=Jan when today is Feb 2026)
  - Added `priorMonthDefaults` useMemo, `selectedARRMonth` useMemo, `currentARRMonthLabel` based on selected filters
  - Added `snapshotCurrentARR` - aggregates Ending_ARR directly from raw snapshot for selected month/year
  - Added `snapshotPreviousARR` - previous month's aggregate for YTD growth
  - Added `pipelineForecastARR` - weighted pipeline (License_ACV × Probability/100) from latest snapshot per deal
  - Metrics now uses snapshot-based Current ARR and pipeline-based Forecasted ARR (Current + Weighted Pipeline)
  - Completely rewrote `buildRealMonthlyARR`: actual Ending_ARR from Jan 2024 to prior month + forecast (last actual ARR + cumulative weighted pipeline) from current month to Dec 2026
  - ARR Trend chart shows full Jan 2024 - Dec 2026 range (removed `.slice(-24)`)
  - Chart labels updated: "Ending ARR (Actual)" and "Forecasted ARR"
  - X-axis interval set to 2 for readability with 36 months
  - Year/month filters no longer filter customers by renewal date (they control snapshot month selection)
  - Clear All resets year/month to prior month defaults instead of empty
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** TypeScript and Vite build clean. If user selects Year=2025, Month empty → shows Dec 2025 Ending ARR. ARR Trend shows smooth transition from actual to forecast at the prior month boundary.

## 2026-02-12 - Current ARR Prior Month Logic + Revenue Type Filter on Sales
**Task:** 1) Re-upload updated Monthly_ARR_Snapshot CSV. 2) Make Current ARR on RevenuePage always reflect the month prior to user's login date, and show which month it represents. 3) Add Revenue Type filter to SalesPage defaulting to License.
**Changes:**
- `frontend/public/data/monthly_arr_snapshot.csv` - **REPLACED** with updated data from Upload templates (12054 records, Jan 2024 - Dec 2026)
- `frontend/src/modules/revenue/pages/RevenuePage.tsx` - Added `getPriorMonth()` and `formatMonthLabel()` helpers. Modified `buildRealCustomers` to filter ARR snapshots to months <= prior month (Jan 2026 when today is Feb 2026). Modified `buildRealMonthlyARR` to use prior month as actual/forecast cutoff. Added `currentARRMonthLabel` useMemo. Updated Current ARR KPI card to show month label (e.g. "Current ARR (Jan 2026)").
- `frontend/src/modules/sales/pages/SalesPage.tsx` - Added `revenueType?: string` to Opportunity interface. Added `REVENUE_TYPE_OPTIONS` constant (License, Implementation, Services). Populated `revenueType` in `buildRealOpportunities` from SOW Mapping Revenue_Type (won deals) and default 'License' (pipeline deals). Added `revenueTypeFilter` state defaulting to 'License'. Added Revenue Type dropdown in filter bar. Added filter logic in `filteredOpportunities`. Updated Clear All to reset to 'License'.
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** TypeScript compiles clean, Vite build succeeds. Current ARR now shows data for the month prior to the user's login (e.g., Jan 2026 when accessed in Feb 2026). Revenue Type filter on Sales tab defaults to License, showing only License revenue type deals by default.

## 2026-02-12 - Replace Mock Data with Real CSV Data (8 Templates)
**Task:** Copy 8 real data CSV files to frontend/public/data/, create a centralized Zustand store (realDataStore) that auto-loads all CSVs at runtime, and update SalesPage and RevenuePage to display real data instead of mock data.
**Changes:**
- `frontend/public/data/closed_acv.csv` - **NEW** Real closed ACV data (597 records)
- `frontend/public/data/monthly_pipeline_snapshot.csv` - **NEW** Real pipeline snapshot data (5809 records)
- `frontend/public/data/monthly_arr_snapshot.csv` - **NEW** Real ARR snapshot data (12054 records)
- `frontend/public/data/sales_team_structure.csv` - **NEW** Real sales team data (42 members)
- `frontend/public/data/customer_name_mapping.csv` - **NEW** Customer name mappings (356 entries)
- `frontend/public/data/sow_mapping.csv` - **NEW** SOW mappings (840 entries)
- `frontend/public/data/arr_subcategory_breakdown.csv` - **NEW** ARR sub-category breakdown (2825 records)
- `frontend/public/data/product_category_mapping.csv` - **NEW** Product category mapping (29 entries)
- `frontend/src/shared/store/realDataStore.ts` - **NEW** Central Zustand store: CSV parser with quoted field support, parseNumber/parseDate/normalizeLogoType/normalizeRegion helpers, 8 raw data interfaces, auto-loads all CSVs from /data/ on import, builds SOW/product/customer lookup indexes.
- `frontend/src/modules/sales/pages/SalesPage.tsx` - Imports realDataStore, renames mock data with MOCK_ prefix, adds 4 builder functions (buildRealOpportunities, buildRealSalespeople, buildQuarterlyForecast, buildRegionalForecast), 4 useMemo hooks that return real data when loaded or mock fallback, updated dependency arrays, changed default yearFilter to [] (show all years).
- `frontend/src/modules/revenue/pages/RevenuePage.tsx` - Imports realDataStore, renames mock data with MOCK_ prefix, adds 4 builder functions (buildRealCustomers, buildRealMonthlyARR, buildRealARRMovement, buildRealProducts), 4 useMemo hooks that return real data when loaded or mock fallback, updated dependency arrays. Also removed dead generateSOWMappings function from previous session cleanup.
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** TypeScript compiles clean, Vite build succeeds. Real data auto-loads at runtime via fetch from /data/ CSVs. Pages show real data when loaded, fall back to mock data if CSVs unavailable. Closed ACV enriched from SOW mapping (region/vertical/segment). Pipeline deduped by Deal_Name+Customer_Name (latest snapshot). ARR grouped by SOW_ID with movement type detection.

## 2026-02-12 - Pipeline Sub-Category Breakdown + SOW_ID on Closed ACV
**Task:** Add Pipeline Sub-Category Breakdown import template, add SOW_ID to Closed ACV template, create 3 new Zustand stores, enable expandable Closed ACV rows with product sub-category breakdown, and add product filters to Sales page.
**Changes:**
- `frontend/src/shared/store/pipelineSubCategoryStore.ts` - **NEW** Zustand store for pipeline deal to product sub-category contribution mappings (Snapshot_Month, Pipeline_Deal_ID, Product_Sub_Category, Contribution_Pct), with validation warnings.
- `frontend/src/shared/store/arrSubCategoryStore.ts` - **NEW** Zustand store for ARR sub-category breakdown (SOW_ID -> sub-category contributions by year), with getContributionForSOWAndYear helper.
- `frontend/src/shared/store/productCategoryMappingStore.ts` - **NEW** Zustand store for product sub-category to category mapping, with helpers: getCategoryForSubCategory, getAllCategories, getSubCategoriesForCategory.
- `frontend/src/shared/types/sales-data.ts` - Added `sowId?` to ClosedACVRecord, `subCategoryBreakdown?` to CalculatedClosedACV.
- `frontend/src/modules/settings/pages/SettingsPage.tsx` - Added pipeline_subcategory_breakdown template card + CSV definition, added SOW_ID column to closed_acv template, real CSV parsing for pipeline_subcategory_breakdown (validates Contribution_Pct 0-1, warns on sum != 1.0), arr_subcategory_breakdown (validates contribution sums per SOW/year), and product_category_mapping. Added validation warning display (yellow box).
- `frontend/src/modules/sales/pages/SalesPage.tsx` - Imports 3 new stores, extended Opportunity interface with product fields, updated enrichedOpportunities to attach ARR sub-category breakdown (won deals) and pipeline sub-category breakdown (active deals), added Product Category / Sub-Category multi-select filters (cascading), added expandedRows state + Closed ACV Deals table with expandable sub-category rows, added Pipeline by Product Sub-Category section in Pipeline tab, added Forecast by Product Sub-Category section in Forecast tab.
- `frontend/src/modules/revenue/pages/RevenuePage.tsx` - Imports pipeline/ARR sub-category stores, uses uploaded store data in Sub-Category tab when available (falls back to mock data for both closed ACV breakdown and pipeline breakdown).
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** TypeScript compiles clean, Vite build succeeds. All features work with mock data by default - uploaded CSV data enriches/replaces mock data when available.

## 2026-02-12 - SOW Mapping Import Template
**Task:** Add SOW Mapping upload card to Settings > Data Import, create shared Zustand store, and enrich Sales and Revenue pages with uploaded SOW Mapping data.
**Changes:**
- `frontend/src/shared/store/sowMappingStore.ts` - **NEW** Zustand store with persist middleware for SOW Mapping data (SOW_ID, Vertical, Region, Fees_Type, Revenue_Type, Segment_Type, Start_Date), lookup index by SOW_ID.
- `frontend/src/modules/settings/pages/SettingsPage.tsx` - Added sow_mapping template card in Mapping & Reference section, CSV template definition with sample rows, real CSV parsing in handleImport (validates required columns, parses quoted fields), stores parsed data in sowMappingStore.
- `frontend/src/modules/sales/pages/SalesPage.tsx` - Imports SOW Mapping store, enriches opportunities with SOW Mapping data (overrides vertical, region, segment for matching sowId).
- `frontend/src/modules/revenue/pages/RevenuePage.tsx` - Imports SOW Mapping store, enriches customers with SOW Mapping data (overrides vertical, region, segment, feesType), SOW Mapping tab uses uploaded data when available (falls back to mock-generated data).
**Status:** Completed
**Branch:** `antony-branch-changes`
**Notes:** TypeScript compiles clean. Upload flow: Settings > Data Import > SOW Mapping card > upload CSV > data persisted to localStorage > enriches Sales + Revenue pages automatically.

## 2026-02-11 - Add Revenue Type Filter to ARR by Products
**Task:** Add a Revenue Type dropdown filter (All/Fees/Travel) to the ARR by Products sub-tab, defaulting to Fees, using Fees_Type from SOW Mapping.
**Changes:**
- `frontend/src/modules/revenue/pages/RevenuePage.tsx` - Added `REVENUE_TYPES` constant, `feesType` field to Customer interface & data generation, `revenueTypeFilter` state (default: Fees), `filteredCustomersForProducts` memo, Revenue Type dropdown UI (products tab only), updated Clear All Filters.
**Status:** Completed
**Branch:** `claude/antony/feat/revenue-type-filter-014MsHYxZMFP6Xw2PaSu41jo`
**Notes:** Filter only appears on ARR by Products tab. Works with all existing filters. PR needs to be created via GitHub UI.
