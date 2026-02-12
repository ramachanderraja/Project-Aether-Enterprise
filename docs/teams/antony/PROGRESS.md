# Antony - Progress Log

> Claude Code: Always update this file after completing tasks for Antony.
> Read `docs/teams/COMMON.md` for team workflow rules.

---

<!-- Add entries below in reverse chronological order (newest first) -->

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
