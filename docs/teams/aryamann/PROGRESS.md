# Aryamann - Progress Log

> Claude Code: Always update this file after completing tasks for Aryamann.
> Read `docs/teams/COMMON.md` for team workflow rules.

---

<!-- Add entries below in reverse chronological order (newest first) -->

## 2026-02-19 - Per-Module API Architecture + Backend Error Guard

**Task:** Replace monolithic `/data/all` endpoint with per-module APIs; add BackendStatusGuard so frontend shows error state when backend is down instead of displaying mock data.

**Changes:**

Backend:
- `backend/src/modules/sales/sales.service.ts` - Rewrote to inject `DataService`, added `getSalesData()` that reads from CSVs; replaced hardcoded pipeline/metrics/trends with real CSV-computed data
- `backend/src/modules/sales/sales.controller.ts` - Added `GET /sales/data` public endpoint
- `backend/src/modules/revenue/revenue.service.ts` - Rewrote to inject `DataService`, added `getRevenueData()` reading CSVs; replaced hardcoded overview/ARR/health/cohort/churn with real CSV-computed data
- `backend/src/modules/revenue/revenue.controller.ts` - Added `GET /revenue/data` public endpoint

Frontend stores:
- `frontend/src/shared/store/salesDataStore.ts` (new) - Zustand store calling `GET /sales/data`, caches in memory
- `frontend/src/shared/store/revenueDataStore.ts` (new) - Zustand store calling `GET /revenue/data`, caches in memory
- `frontend/src/shared/store/dataTypes.ts` (renamed from `realDataStore.ts`) - Now only exports shared types & parsing utilities, no store
- Deleted `frontend/src/shared/store/realDataStore.ts`

Frontend pages:
- `frontend/src/modules/sales/pages/SalesPage.tsx` -