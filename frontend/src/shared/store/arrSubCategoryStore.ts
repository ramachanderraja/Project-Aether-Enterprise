import { create } from 'zustand';

export interface ARRSubCategoryRecord {
  SOW_ID: string;
  Customer_Name: string;
  Product_Sub_Category: string;
  contributions: Record<string, number>; // year -> pct (e.g., { "2024": 100, "2025": 85 })
}

interface ARRSubCategoryState {
  records: ARRSubCategoryRecord[];
  lookupIndex: Record<string, ARRSubCategoryRecord[]>; // SOW_ID -> records
  lastImportDate: string | null;
  validationWarnings: string[];
  setRecords: (records: ARRSubCategoryRecord[], warnings?: string[]) => void;
  getRecordsBySOWId: (sowId: string) => ARRSubCategoryRecord[];
  getContributionForSOWAndYear: (sowId: string, year: string) => { subCategory: string; pct: number }[];
  clear: () => void;
}

export const useARRSubCategoryStore = create<ARRSubCategoryState>()(
  (set, get) => ({
    records: [],
    lookupIndex: {},
    lastImportDate: null,
    validationWarnings: [],

    setRecords: (records: ARRSubCategoryRecord[], warnings?: string[]) => {
      const index: Record<string, ARRSubCategoryRecord[]> = {};
      records.forEach(r => {
        if (!index[r.SOW_ID]) index[r.SOW_ID] = [];
        index[r.SOW_ID].push(r);
      });
      set({
        records,
        lookupIndex: index,
        lastImportDate: new Date().toISOString(),
        validationWarnings: warnings || [],
      });
    },

    getRecordsBySOWId: (sowId: string) => {
      return get().lookupIndex[sowId] || [];
    },

    getContributionForSOWAndYear: (sowId: string, year: string) => {
      const records = get().lookupIndex[sowId] || [];
      return records
        .filter(r => r.contributions[year] !== undefined && r.contributions[year] > 0)
        .map(r => ({
          subCategory: r.Product_Sub_Category,
          pct: r.contributions[year],
        }));
    },

    clear: () => {
      set({ records: [], lookupIndex: {}, lastImportDate: null, validationWarnings: [] });
    },
  })
);
