import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/services/api/apiClient';

// Dashboard hooks
export function useDashboardExecutive() {
  return useQuery({
    queryKey: ['dashboard', 'executive'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/executive');
      return data;
    },
  });
}

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/kpis');
      return data;
    },
  });
}

export function useAnomalies(params?: { severity?: string; status?: string }) {
  return useQuery({
    queryKey: ['dashboard', 'anomalies', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/dashboard/anomalies', { params });
      return data;
    },
  });
}

// Sales hooks
export function useSalesPipeline() {
  return useQuery({
    queryKey: ['sales', 'pipeline'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/pipeline');
      return data;
    },
  });
}

export function useDeals(params?: { stage?: string; owner?: string }) {
  return useQuery({
    queryKey: ['sales', 'deals', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/deals', { params });
      return data;
    },
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['sales', 'deals', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/sales/deals/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useSalesForecast() {
  return useQuery({
    queryKey: ['sales', 'forecast'],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/forecast');
      return data;
    },
  });
}

// ── Sales Computed Hooks (Phase 1) ──

export interface SalesFilters {
  year?: string[];
  quarter?: string[];
  month?: string[];
  region?: string[];
  vertical?: string[];
  segment?: string[];
  logoType?: string[];
  soldBy?: string;
  revenueType?: string;
  productCategory?: string[];
  productSubCategory?: string[];
}

function buildSalesParams(filters: SalesFilters): Record<string, any> {
  const params: Record<string, any> = {};
  if (filters.year?.length) params.year = filters.year;
  if (filters.quarter?.length) params.quarter = filters.quarter;
  if (filters.month?.length) params.month = filters.month;
  if (filters.region?.length) params.region = filters.region;
  if (filters.vertical?.length) params.vertical = filters.vertical;
  if (filters.segment?.length) params.segment = filters.segment;
  if (filters.logoType?.length) params.logoType = filters.logoType;
  if (filters.soldBy && filters.soldBy !== 'All') params.soldBy = filters.soldBy;
  if (filters.revenueType) params.revenueType = filters.revenueType;
  if (filters.productCategory?.length) params.productCategory = filters.productCategory;
  if (filters.productSubCategory?.length) params.productSubCategory = filters.productSubCategory;
  return params;
}

export function useSalesOverviewMetrics(filters: SalesFilters) {
  const params = buildSalesParams(filters);
  return useQuery({
    queryKey: ['sales', 'overview', 'metrics', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/overview/metrics', { params });
      return data;
    },
  });
}

export function useSalesOverviewFunnel(filters: SalesFilters) {
  const params = buildSalesParams(filters);
  return useQuery({
    queryKey: ['sales', 'overview', 'funnel', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/overview/funnel', { params });
      return data;
    },
  });
}

export function useSalesOverviewKeyDeals(filters: SalesFilters & { sortField?: string; sortDirection?: string; limit?: number }) {
  const params = { ...buildSalesParams(filters), sortField: filters.sortField, sortDirection: filters.sortDirection, limit: filters.limit };
  return useQuery({
    queryKey: ['sales', 'overview', 'key-deals', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/overview/key-deals', { params });
      return data;
    },
  });
}

export function useSalesOverviewClosedDeals(filters: SalesFilters) {
  const params = buildSalesParams(filters);
  return useQuery({
    queryKey: ['sales', 'overview', 'closed-deals', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/overview/closed-deals', { params });
      return data;
    },
  });
}

export function useSalesForecastQuarterly(filters: SalesFilters) {
  const params = buildSalesParams(filters);
  return useQuery({
    queryKey: ['sales', 'forecast', 'quarterly', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/forecast/quarterly', { params });
      return data;
    },
  });
}

export function useSalesForecastRegional(filters: SalesFilters) {
  const params = buildSalesParams(filters);
  return useQuery({
    queryKey: ['sales', 'forecast', 'regional', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/forecast/regional', { params });
      return data;
    },
  });
}

export function useSalesForecastTrend(filters: SalesFilters) {
  const params = buildSalesParams(filters);
  return useQuery({
    queryKey: ['sales', 'forecast', 'trend', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/forecast/trend', { params });
      return data;
    },
  });
}

export function useSalesForecastBySubcategory(filters: SalesFilters) {
  const params = buildSalesParams(filters);
  return useQuery({
    queryKey: ['sales', 'forecast', 'by-subcategory', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/forecast/by-subcategory', { params });
      return data;
    },
  });
}

export function useSalesPipelineMovement(filters: SalesFilters & { targetMonth?: string }) {
  const params = { ...buildSalesParams(filters), targetMonth: filters.targetMonth };
  return useQuery({
    queryKey: ['sales', 'pipeline', 'movement', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/pipeline/movement', { params });
      return data;
    },
  });
}

export function useSalesPipelineBySubcategory(filters: SalesFilters) {
  const params = buildSalesParams(filters);
  return useQuery({
    queryKey: ['sales', 'pipeline', 'by-subcategory', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/pipeline/by-subcategory', { params });
      return data;
    },
  });
}

export function useSalesQuotaSalespeople(filters: SalesFilters & { nameFilter?: string; regionFilter?: string; sortField?: string; sortDirection?: string }) {
  const params = { ...buildSalesParams(filters), nameFilter: filters.nameFilter, regionFilter: filters.regionFilter, sortField: filters.sortField, sortDirection: filters.sortDirection };
  return useQuery({
    queryKey: ['sales', 'quota', 'salespeople', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/sales/quota/salespeople', { params });
      return data;
    },
  });
}

// ── Revenue Computed Hooks (Phase 1) ──

export interface RevenueFilters {
  year?: string[];
  month?: string[];
  region?: string[];
  vertical?: string[];
  segment?: string[];
  platform?: string[];
  quantumSmart?: string;
  feesType?: string;
}

function buildRevenueParams(filters: RevenueFilters): Record<string, any> {
  const params: Record<string, any> = {};
  if (filters.year?.length) params.year = filters.year;
  if (filters.month?.length) params.month = filters.month;
  if (filters.region?.length) params.region = filters.region;
  if (filters.vertical?.length) params.vertical = filters.vertical;
  if (filters.segment?.length) params.segment = filters.segment;
  if (filters.platform?.length) params.platform = filters.platform;
  if (filters.quantumSmart && filters.quantumSmart !== 'All') params.quantumSmart = filters.quantumSmart;
  if (filters.feesType && filters.feesType !== 'All') params.feesType = filters.feesType;
  return params;
}

export function useRevenueOverviewMetrics(filters: RevenueFilters) {
  const params = buildRevenueParams(filters);
  return useQuery({
    queryKey: ['revenue', 'overview', 'metrics', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/overview/metrics', { params });
      return data;
    },
  });
}

export function useRevenueOverviewArrTrend(filters: RevenueFilters) {
  const params = buildRevenueParams(filters);
  return useQuery({
    queryKey: ['revenue', 'overview', 'arr-trend', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/overview/arr-trend', { params });
      return data;
    },
  });
}

export function useRevenueOverviewArrByDimension(filters: RevenueFilters) {
  const params = buildRevenueParams(filters);
  return useQuery({
    queryKey: ['revenue', 'overview', 'arr-by-dimension', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/overview/arr-by-dimension', { params });
      return data;
    },
  });
}

export function useRevenueMovementSummary(filters: RevenueFilters & { lookbackPeriod?: number }) {
  const params = { ...buildRevenueParams(filters), lookbackPeriod: filters.lookbackPeriod };
  return useQuery({
    queryKey: ['revenue', 'movement', 'summary', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/movement/summary', { params });
      return data;
    },
  });
}

export function useRevenueMovementCustomers(filters: RevenueFilters & { lookbackPeriod?: number; movementType?: string; sortField?: string; sortDirection?: string }) {
  const params = { ...buildRevenueParams(filters), lookbackPeriod: filters.lookbackPeriod, movementType: filters.movementType, sortField: filters.sortField, sortDirection: filters.sortDirection };
  return useQuery({
    queryKey: ['revenue', 'movement', 'customers', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/movement/customers', { params });
      return data;
    },
  });
}

export function useRevenueMovementTrend(filters: RevenueFilters) {
  const params = buildRevenueParams(filters);
  return useQuery({
    queryKey: ['revenue', 'movement', 'trend', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/movement/trend', { params });
      return data;
    },
  });
}

export function useRevenueCustomersList(filters: RevenueFilters & { search?: string; renewals2026?: boolean; renewalRisk?: string; sortField?: string; sortDirection?: string }) {
  const params = { ...buildRevenueParams(filters), search: filters.search, renewals2026: filters.renewals2026, renewalRisk: filters.renewalRisk, sortField: filters.sortField, sortDirection: filters.sortDirection };
  return useQuery({
    queryKey: ['revenue', 'customers', 'list', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/customers/list', { params });
      return data;
    },
  });
}

export function useRevenueCustomerRenewalRisk(filters: RevenueFilters) {
  const params = buildRevenueParams(filters);
  return useQuery({
    queryKey: ['revenue', 'customers', 'renewal-risk', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/customers/renewal-risk', { params });
      return data;
    },
  });
}

export function useRevenueProducts(filters: RevenueFilters & { productCategory?: string; productSubCategory?: string }) {
  const params = { ...buildRevenueParams(filters), productCategory: filters.productCategory, productSubCategory: filters.productSubCategory };
  return useQuery({
    queryKey: ['revenue', 'products', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/products', { params });
      return data;
    },
  });
}

// Cost hooks
export function useCostOverview() {
  return useQuery({
    queryKey: ['cost', 'overview'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cost/overview');
      return data;
    },
  });
}

export function useVendorSpend(params?: { category?: string }) {
  return useQuery({
    queryKey: ['cost', 'vendors', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/cost/vendors', { params });
      return data;
    },
  });
}

export function useCostOptimizations() {
  return useQuery({
    queryKey: ['cost', 'optimizations'],
    queryFn: async () => {
      const { data } = await apiClient.get('/cost/optimizations');
      return data;
    },
  });
}

// Revenue hooks
export function useRevenueOverview() {
  return useQuery({
    queryKey: ['revenue', 'overview'],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/overview');
      return data;
    },
  });
}

export function useARRMovement() {
  return useQuery({
    queryKey: ['revenue', 'arr-movement'],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/arr-movement');
      return data;
    },
  });
}

export function useCustomerHealth() {
  return useQuery({
    queryKey: ['revenue', 'customer-health'],
    queryFn: async () => {
      const { data } = await apiClient.get('/revenue/customer-health');
      return data;
    },
  });
}

// Scenario hooks
export function useScenarios(params?: { type?: string; status?: string }) {
  return useQuery({
    queryKey: ['scenarios', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/scenarios', { params });
      return data;
    },
  });
}

export function useScenario(id: string) {
  return useQuery({
    queryKey: ['scenarios', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/scenarios/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scenario: any) => {
      const { data } = await apiClient.post('/scenarios', scenario);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export function useRunSimulation() {
  return useMutation({
    mutationFn: async (params: { scenario_id: string; iterations?: number }) => {
      const { data } = await apiClient.post('/scenarios/simulate', params);
      return data;
    },
  });
}

export function useCompareScenarios() {
  return useMutation({
    mutationFn: async (params: { scenario_ids: string[] }) => {
      const { data } = await apiClient.post('/scenarios/compare', params);
      return data;
    },
  });
}

// Governance hooks
export function useAuditLogs(params?: { action?: string; resource_type?: string }) {
  return useQuery({
    queryKey: ['governance', 'audit-logs', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/governance/audit-logs', { params });
      return data;
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['governance', 'roles'],
    queryFn: async () => {
      const { data } = await apiClient.get('/governance/roles');
      return data;
    },
  });
}

export function useApprovalRequests(status?: string) {
  return useQuery({
    queryKey: ['governance', 'approvals', status],
    queryFn: async () => {
      const { data } = await apiClient.get('/governance/approvals', { params: { status } });
      return data;
    },
  });
}

export function useProcessApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision, comments }: { id: string; decision: string; comments: string }) => {
      const { data } = await apiClient.post(`/governance/approvals/${id}/process`, { decision, comments });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance', 'approvals'] });
    },
  });
}

// Data Fabric hooks
export function useDataSources() {
  return useQuery({
    queryKey: ['data-fabric', 'sources'],
    queryFn: async () => {
      const { data } = await apiClient.get('/data-fabric/sources');
      return data;
    },
  });
}

export function useSyncHistory(params?: { source_id?: string }) {
  return useQuery({
    queryKey: ['data-fabric', 'sync-history', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/data-fabric/sync/history', { params });
      return data;
    },
  });
}

export function useTriggerSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { source_id: string; full_sync?: boolean }) => {
      const { data } = await apiClient.post('/data-fabric/sync', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-fabric', 'sync-history'] });
    },
  });
}

export function useDataCatalog() {
  return useQuery({
    queryKey: ['data-fabric', 'catalog'],
    queryFn: async () => {
      const { data } = await apiClient.get('/data-fabric/catalog');
      return data;
    },
  });
}

// Integrations hooks
export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data } = await apiClient.get('/integrations');
      return data;
    },
  });
}

export function useAvailableIntegrations() {
  return useQuery({
    queryKey: ['integrations', 'catalog'],
    queryFn: async () => {
      const { data } = await apiClient.get('/integrations/catalog');
      return data;
    },
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['integrations', 'api-keys'],
    queryFn: async () => {
      const { data } = await apiClient.get('/integrations/api-keys');
      return data;
    },
  });
}

export function useWebhooks(integrationId?: string) {
  return useQuery({
    queryKey: ['integrations', 'webhooks', integrationId],
    queryFn: async () => {
      const { data } = await apiClient.get('/integrations/webhooks', {
        params: integrationId ? { integration_id: integrationId } : undefined,
      });
      return data;
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { name: string; permissions: string[] }) => {
      const { data } = await apiClient.post('/integrations/api-keys', params);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', 'api-keys'] });
    },
  });
}

// AI Agent hooks
export function useAIConversations() {
  return useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ai/conversations');
      return data;
    },
  });
}

export function useSendAIMessage() {
  return useMutation({
    mutationFn: async (params: { conversation_id?: string; message: string }) => {
      const { data } = await apiClient.post('/ai/message', params);
      return data;
    },
  });
}

export function useAISuggestions() {
  return useQuery({
    queryKey: ['ai', 'suggestions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/ai/suggestions');
      return data;
    },
  });
}

// ==================== Phase 2: Mock Data Page Hooks ====================

// -- Dashboard --
export function useDashboardRollingForecast() {
  return useQuery({ queryKey: ['dashboard', 'rolling-forecast'], queryFn: async () => { const { data } = await apiClient.get('/dashboard/rolling-forecast'); return data; } });
}
export function useDashboardSaasMetrics() {
  return useQuery({ queryKey: ['dashboard', 'saas-metrics'], queryFn: async () => { const { data } = await apiClient.get('/dashboard/saas-metrics'); return data; } });
}
export function useDashboardRCA(metric: string) {
  return useQuery({ queryKey: ['dashboard', 'rca', metric], queryFn: async () => { const { data } = await apiClient.get(`/dashboard/rca/${metric}`); return data; }, enabled: !!metric });
}
export function useDashboardActionPlan(metric: string) {
  return useQuery({ queryKey: ['dashboard', 'action-plan', metric], queryFn: async () => { const { data } = await apiClient.get(`/dashboard/action-plan/${metric}`); return data; }, enabled: !!metric });
}
export function useDashboardCompetitors() {
  return useQuery({ queryKey: ['dashboard', 'competitors'], queryFn: async () => { const { data } = await apiClient.get('/dashboard/competitors'); return data; } });
}

// -- GTM --
export function useGTMMetrics() {
  return useQuery({ queryKey: ['gtm', 'metrics'], queryFn: async () => { const { data } = await apiClient.get('/gtm/metrics'); return data; } });
}
export function useGTMUnitEconomics() {
  return useQuery({ queryKey: ['gtm', 'unit-economics'], queryFn: async () => { const { data } = await apiClient.get('/gtm/unit-economics'); return data; } });
}
export function useGTMLtvCacTrend(period?: string) {
  return useQuery({ queryKey: ['gtm', 'ltv-cac-trend', period], queryFn: async () => { const { data } = await apiClient.get('/gtm/ltv-cac-trend', { params: { period } }); return data; } });
}
export function useGTMCohortRetention() {
  return useQuery({ queryKey: ['gtm', 'cohort-retention'], queryFn: async () => { const { data } = await apiClient.get('/gtm/cohort-retention'); return data; } });
}
export function useGTMBenchmarks() {
  return useQuery({ queryKey: ['gtm', 'benchmarks'], queryFn: async () => { const { data } = await apiClient.get('/gtm/benchmarks'); return data; } });
}
export function useGTMHealthSummary() {
  return useQuery({ queryKey: ['gtm', 'health-summary'], queryFn: async () => { const { data } = await apiClient.get('/gtm/health-summary'); return data; } });
}

// -- Marketing --
export function useMarketingOverview() {
  return useQuery({ queryKey: ['marketing', 'overview'], queryFn: async () => { const { data } = await apiClient.get('/marketing/overview'); return data; } });
}
export function useMarketingFunnel() {
  return useQuery({ queryKey: ['marketing', 'funnel'], queryFn: async () => { const { data } = await apiClient.get('/marketing/funnel'); return data; } });
}
export function useMarketingChannels() {
  return useQuery({ queryKey: ['marketing', 'channels'], queryFn: async () => { const { data } = await apiClient.get('/marketing/channels'); return data; } });
}
export function useMarketingCampaigns(status?: string) {
  return useQuery({ queryKey: ['marketing', 'campaigns', status], queryFn: async () => { const { data } = await apiClient.get('/marketing/campaigns', { params: { status } }); return data; } });
}
export function useMarketingLeadTrends(period?: string) {
  return useQuery({ queryKey: ['marketing', 'lead-trends', period], queryFn: async () => { const { data } = await apiClient.get('/marketing/trends', { params: { period } }); return data; } });
}

// -- Reports --
export function useReportsProfitability(params?: { type?: string; region?: string; segment?: string; vertical?: string }) {
  return useQuery({ queryKey: ['reports', 'profitability', params], queryFn: async () => { const { data } = await apiClient.get('/reports/profitability', { params }); return data; } });
}
export function useReportsMarginTrend(params?: { viewMode?: string; region?: string }) {
  return useQuery({ queryKey: ['reports', 'margin-trend', params], queryFn: async () => { const { data } = await apiClient.get('/reports/margin-trend', { params }); return data; } });
}

// -- Intelligence --
export function useIntelligenceModels() {
  return useQuery({ queryKey: ['intelligence', 'models'], queryFn: async () => { const { data } = await apiClient.get('/intelligence/models'); return data; } });
}
export function useIntelligenceDecisions(limit?: number) {
  return useQuery({ queryKey: ['intelligence', 'decisions', limit], queryFn: async () => { const { data } = await apiClient.get('/intelligence/decisions', { params: { limit } }); return data; } });
}
export function useIntelligenceCompute() {
  return useQuery({ queryKey: ['intelligence', 'compute'], queryFn: async () => { const { data } = await apiClient.get('/intelligence/compute'); return data; } });
}
export function useIntelligenceLatency(period?: string) {
  return useQuery({ queryKey: ['intelligence', 'latency', period], queryFn: async () => { const { data } = await apiClient.get('/intelligence/latency', { params: { period } }); return data; } });
}
export function useIntelligenceHealth() {
  return useQuery({ queryKey: ['intelligence', 'health'], queryFn: async () => { const { data } = await apiClient.get('/intelligence/health'); return data; } });
}

// -- Governance (additional) --
export function useComplianceReport() {
  return useQuery({ queryKey: ['governance', 'compliance'], queryFn: async () => { const { data } = await apiClient.get('/governance/compliance'); return data; } });
}

// -- Cost (additional) --
export function useCostTrends(period?: string) {
  return useQuery({ queryKey: ['cost', 'trends', period], queryFn: async () => { const { data } = await apiClient.get('/cost/trends', { params: { period } }); return data; } });
}
export function useCostDrivers() {
  return useQuery({ queryKey: ['cost', 'drivers'], queryFn: async () => { const { data } = await apiClient.get('/cost/drivers'); return data; } });
}
