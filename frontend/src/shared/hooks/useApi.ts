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
