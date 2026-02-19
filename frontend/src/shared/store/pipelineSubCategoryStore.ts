import { create } from 'zustand';

export interface PipelineSubCategoryRecord {
  Snapshot_Month: string;
  Pipeline_Deal_ID: string;
  Product_Sub_Category: string;
  Contribution_Pct: number;
}

interface PipelineSubCategoryState {
  records: PipelineSubCategoryRecord[];
  lookupIndex: Record<string, PipelineSubCategoryRecord[]>;
  lastImportDate: string | null;
  validationWarnings: string[];
  setRecords: (records: PipelineSubCategoryRecord[], warnings?: string[]) => void;
  getBreakdownForDealAndMonth: (dealId: string, month: string) => PipelineSubCategoryRecord[];
  getLatestBreakdownForDeal: (dealId: string) => PipelineSubCategoryRecord[];
  clear: () => void;
}

export const usePipelineSubCategoryStore = create<PipelineSubCategoryState>()(
  (set, get) => ({
    records: [],
    lookupIndex: {},
    lastImportDate: null,
    validationWarnings: [],

    setRecords: (records: PipelineSubCategoryRecord[], warnings?: string[]) => {
      const index: Record<string, PipelineSubCategoryRecord[]> = {};
      records.forEach(r => {
        const key = `${r.Pipeline_Deal_ID}|${r.Snapshot_Month}`;
        if (!index[key]) index[key] = [];
        index[key].push(r);
      });
      set({
        records,
        lookupIndex: index,
        lastImportDate: new Date().toISOString(),
        validationWarnings: warnings || [],
      });
    },

    getBreakdownForDealAndMonth: (dealId: string, month: string) => {
      const key = `${dealId}|${month}`;
      return get().lookupIndex[key] || [];
    },

    getLatestBreakdownForDeal: (dealId: string) => {
      const state = get();
      const dealRecords = state.records.filter(r => r.Pipeline_Deal_ID === dealId);
      if (dealRecords.length === 0) return [];

      const latestMonth = dealRecords
        .map(r => r.Snapshot_Month)
        .sort()
        .pop();

      if (!latestMonth) return [];
      return state.lookupIndex[`${dealId}|${latestMonth}`] || [];
    },

    clear: () => {
      set({ records: [], lookupIndex: {}, lastImportDate: null, validationWarnings: [] });
    },
  })
);
