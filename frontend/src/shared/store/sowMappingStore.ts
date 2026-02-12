import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SOWMappingRecord {
  SOW_ID: string;
  Vertical: string;
  Region: string;
  Fees_Type: string;
  Revenue_Type: string;
  Segment_Type: string;
  Start_Date: string;
}

interface SOWMappingState {
  mappings: SOWMappingRecord[];
  lookupIndex: Record<string, SOWMappingRecord>;
  lastImportDate: string | null;
  setMappings: (records: SOWMappingRecord[]) => void;
  getMappingBySOWId: (sowId: string) => SOWMappingRecord | undefined;
  clear: () => void;
}

export const useSOWMappingStore = create<SOWMappingState>()(
  persist(
    (set, get) => ({
      mappings: [],
      lookupIndex: {},
      lastImportDate: null,

      setMappings: (records: SOWMappingRecord[]) => {
        const index: Record<string, SOWMappingRecord> = {};
        records.forEach(r => {
          if (r.SOW_ID) {
            index[r.SOW_ID] = r;
          }
        });
        set({
          mappings: records,
          lookupIndex: index,
          lastImportDate: new Date().toISOString(),
        });
      },

      getMappingBySOWId: (sowId: string) => {
        return get().lookupIndex[sowId];
      },

      clear: () => {
        set({ mappings: [], lookupIndex: {}, lastImportDate: null });
      },
    }),
    {
      name: 'aether-sow-mapping',
      partialize: (state) => ({
        mappings: state.mappings,
        lookupIndex: state.lookupIndex,
        lastImportDate: state.lastImportDate,
      }),
    }
  )
);
