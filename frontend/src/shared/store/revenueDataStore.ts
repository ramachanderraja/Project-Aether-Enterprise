import { create } from 'zustand';
import { apiClient } from '@shared/services/api/apiClient';
import type {
  RawClosedAcv,
  RawPipelineSnapshot,
  RawARRSnapshot,
  RawCustomerNameMapping,
  RawSOWMapping,
  RawARRSubCategory,
  RawProductCategoryMapping,
} from './dataTypes';

export interface RevenueDataState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  arrSnapshots: RawARRSnapshot[];
  pipelineSnapshots: RawPipelineSnapshot[];
  closedAcv: RawClosedAcv[];
  sowMappings: RawSOWMapping[];
  customerNameMappings: RawCustomerNameMapping[];
  arrSubCategoryBreakdown: RawARRSubCategory[];
  productCategoryMapping: RawProductCategoryMapping[];

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

export const useRevenueDataStore = create<RevenueDataState>((set, get) => ({
  isLoaded: false,
  isLoading: false,
  error: null,
  arrSnapshots: [],
  pipelineSnapshots: [],
  closedAcv: [],
  sowMappings: [],
  customerNameMappings: [],
  arrSubCategoryBreakdown: [],
  productCategoryMapping: [],
  sowMappingIndex: {},
  productCategoryIndex: {},
  customerNameIndex: {},

  loadData: async () => {
    if (get().isLoaded || get().isLoading) return;
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.get('/revenue/data');
      const data = response.data;

      const indexes = buildIndexes({
        sowMappings: data.sowMappings || [],
        productCategoryMapping: data.productCategoryMapping || [],
        customerNameMappings: data.customerNameMappings || [],
      });

      set({
        arrSnapshots: data.arrSnapshots || [],
        pipelineSnapshots: data.pipelineSnapshots || [],
        closedAcv: data.closedAcv || [],
        sowMappings: data.sowMappings || [],
        customerNameMappings: data.customerNameMappings || [],
        arrSubCategoryBreakdown: data.arrSubCategoryBreakdown || [],
        productCategoryMapping: data.productCategoryMapping || [],
        ...indexes,
        isLoaded: true,
        isLoading: false,
        error: null,
      });

      console.log(
        `[RevenueData] Loaded: ${(data.arrSnapshots || []).length} ARR snapshots, ` +
        `${(data.pipelineSnapshots || []).length} pipeline, ` +
        `${(data.closedAcv || []).length} closed ACV`,
      );
    } catch (err) {
      console.error('[RevenueData] Failed to load:', err);
      set({ error: String(err), isLoading: false });
    }
  },

  retry: async () => {
    set({ isLoaded: false, isLoading: false, error: null });
    await get().loadData();
  },
}));
