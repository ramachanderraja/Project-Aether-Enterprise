import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductCategoryMappingRecord {
  Product_Sub_Category: string;
  Product_Category: string;
  Description: string;
  Status: string;
}

interface ProductCategoryMappingState {
  records: ProductCategoryMappingRecord[];
  lookupIndex: Record<string, ProductCategoryMappingRecord>; // sub-category name -> record
  lastImportDate: string | null;
  validationWarnings: string[];
  setRecords: (records: ProductCategoryMappingRecord[], warnings?: string[]) => void;
  getCategoryForSubCategory: (subCategory: string) => string | undefined;
  getAllCategories: () => string[];
  getSubCategoriesForCategory: (category: string) => string[];
  clear: () => void;
}

export const useProductCategoryMappingStore = create<ProductCategoryMappingState>()(
  persist(
    (set, get) => ({
      records: [],
      lookupIndex: {},
      lastImportDate: null,
      validationWarnings: [],

      setRecords: (records: ProductCategoryMappingRecord[], warnings?: string[]) => {
        const index: Record<string, ProductCategoryMappingRecord> = {};
        records.forEach(r => {
          if (r.Product_Sub_Category) {
            index[r.Product_Sub_Category] = r;
          }
        });
        set({
          records,
          lookupIndex: index,
          lastImportDate: new Date().toISOString(),
          validationWarnings: warnings || [],
        });
      },

      getCategoryForSubCategory: (subCategory: string) => {
        const record = get().lookupIndex[subCategory];
        return record?.Product_Category;
      },

      getAllCategories: () => {
        const categories = new Set<string>();
        get().records.forEach(r => {
          if (r.Product_Category) categories.add(r.Product_Category);
        });
        return Array.from(categories).sort();
      },

      getSubCategoriesForCategory: (category: string) => {
        return get().records
          .filter(r => r.Product_Category === category)
          .map(r => r.Product_Sub_Category)
          .sort();
      },

      clear: () => {
        set({ records: [], lookupIndex: {}, lastImportDate: null, validationWarnings: [] });
      },
    }),
    {
      name: 'aether-product-category-mapping',
      partialize: (state) => ({
        records: state.records,
        lookupIndex: state.lookupIndex,
        lastImportDate: state.lastImportDate,
        validationWarnings: state.validationWarnings,
      }),
    }
  )
);
