import { create } from 'zustand';
import { apiClient } from '@shared/services/api/apiClient';
import type {
  RawClosedAcv,
  RawPipelineSnapshot,
  RawSalesTeam,
  RawCustomerNameMapping,
  RawSOWMapping,
  RawARRSubCategory,
  RawProductCategoryMapping,
  RawPriorYearPerformance,
} from './dataTypes';

export interface SalesDataState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  closedAcv: RawClosedAcv[];
  pipelineSnapshots: RawPipelineSnapshot[];
  salesTeam: RawSalesTeam[];
  customerNameMappings: RawCustomerNameMapping[];
  sowMappings: RawSOWMapping[];
  arrSubCategoryBreakdown: RawARRSubCategory[];
  productCategoryMapping: RawProductCategoryMapping[];
  priorYearPerformance: RawPriorYearPerformance[];

  sowMappingIndex: Record<string, RawSOWMapping>;
  productCategoryIndex: Record<string, string>;
  customerNameIndex: Record<string, string>;

  loadData: () => Promise<void>;
  retry: () => Promise<void>;
}

function buildIndexes(data: {
  sowMappings: RawSOWMapping[];
  productCategoryMapping: RawProductCategoryMapping[];
  customerNameMappings: RawCustomerNameMapping[];
}) {
  const sowMappingIndex: Record<string, RawSOWMapping> = {};
  data.sowMappings.forEach(m => {
    if (m.SOW_ID) sowMappingIndex[m.SOW_ID] = m;
  });

  const productCategoryIndex: Record<string, string> = {};
  data.productCategoryMapping.forEach(m => {
    if (m.Product_Sub_Category)
      productCategoryIndex[m.Product_Sub_Category] = m.Product_Category;
  });

  const customerNameIndex: Record<string, string> = {};
  data.customerNameMappings.forEach(m => {
    if (m.ARR_Customer_Name)
      customerNameIndex[m.ARR_Customer_Name] = m.Pipeline_Customer_Name;
  });

  return { sowMappingIndex, productCategoryIndex, customerNameIndex };
}

export const useSalesDataStore = create<SalesDataState>((set, get) => ({
  isLoaded: false,
  isLoading: false,
  error: null,
  closedAcv: [],
  pipelineSnapshots: [],
  salesTeam: [],
  customerNameMappings: [],
  sowMappings: [],
  arrSubCategoryBreakdown: [],
  productCategoryMapping: [],
  priorYearPerformance: [],
  sowMappingIndex: {},
  productCategoryIndex: {},
  customerNameIndex: {},

  loadData: async () => {
    if (get().isLoaded || get().isLoading) return;
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.get('/sales/data');
      const data = response.data;

      const indexes = buildIndexes({
        sowMappings: data.sowMappings || [],
        productCategoryMapping: data.productCategoryMapping || [],
        customerNameMappings: data.customerNameMappings || [],
      });

      set({
        closedAcv: data.closedAcv || [],
        pipelineSnapshots: data.pipelineSnapshots || [],
        salesTeam: data.salesTeam || [],
        customerNameMappings: data.customerNameMappings || [],
        sowMappings: data.sowMappings || [],
        arrSubCategoryBreakdown: data.arrSubCategoryBreakdown || [],
        productCategoryMapping: data.productCategoryMapping || [],
        priorYearPerformance: data.priorYearPerformance || [],
        ...indexes,
        isLoaded: true,
        isLoading: false,
        error: null,
      });

      console.log(
        `[SalesData] Loaded: ${(data.closedAcv || []).length} closed ACV, ` +
        `${(data.pipelineSnapshots || []).length} pipeline, ` +
        `${(data.salesTeam || []).length} team members`,
      );
    } catch (err) {
      console.error('[SalesData] Failed to load:', err);
      set({ error: String(err), isLoading: false });
    }
  },

  retry: async () => {
    set({ isLoaded: false, isLoading: false, error: null });
    await get().loadData();
  },
}));
