// Real Data Store - Loads actual CSV data from public/data/ and exposes it to pages
import { create } from 'zustand';

// ============ CSV Parsing Utilities ============

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h.trim()] = (values[i] || '').trim();
    });
    return record;
  }).filter(r => Object.values(r).some(v => v !== ''));
}

export function parseNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[$%\s]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // Handle M/D/YYYY format
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  return trimmed;
}

export function normalizeLogoType(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === 'New' || trimmed === 'New Logo') return 'New Logo';
  if (trimmed === 'Cross Sell' || trimmed === 'Cross-Sell') return 'Cross-Sell';
  return trimmed;
}

export function normalizeRegion(raw: string): string {
  const map: Record<string, string> = {
    'NA': 'North America',
    'EU': 'Europe',
    'ME': 'Middle East',
    'APAC': 'APAC',
    'LATAM': 'LATAM',
    'Global': 'Global',
  };
  return map[raw.trim()] || raw.trim() || '';
}

// ============ Raw Data Interfaces ============

export interface RawClosedAcv {
  Closed_ACV_ID: string;
  Pipeline_Deal_ID: string;
  Deal_Name: string;
  Customer_Name: string;
  Close_Date: string;
  Logo_Type: string;
  Value_Type: string;
  Amount: number;
  License_ACV: number;
  Implementation_Value: number;
  Region: string;
  Vertical: string;
  Segment: string;
  Platform: string;
  Sales_Rep: string;
  SOW_ID: string;
  Sold_By: string;
}

export interface RawPipelineSnapshot {
  Snapshot_Month: string;
  Pipeline_Deal_ID: string;
  Deal_Name: string;
  Customer_Name: string;
  Deal_Value: number;
  License_ACV: number;
  Implementation_Value: number;
  Logo_Type: string;
  Deal_Stage: string;
  Current_Stage: string;
  Probability: number;
  Expected_Close_Date: string;
  Region: string;
  Vertical: string;
  Segment: string;
  Product_Sub_Category: string;
  Sales_Rep: string;
}

export interface RawARRSnapshot {
  Snapshot_Month: string;
  SOW_ID: string;
  Customer_Name: string;
  Quantum_SMART: string;
  Quantum_GoLive_Date: string;
  Starting_ARR: number;
  New_ARR: number;
  Expansion_ARR: number;
  Schedule_Change: number;
  Contraction_ARR: number;
  Churn_ARR: number;
  Ending_ARR: number;
  Region: string;
  Vertical: string;
  Segment: string;
  Contract_Start_Date: string;
  Contract_End_Date: string;
  Renewal_Risk: string;
}

export interface RawSalesTeam {
  Sales_Rep_ID: string;
  Name: string;
  Email: string;
  Role: string;
  Region: string;
  Vertical_Focus: string;
  Segment: string;
  Manager_ID: string;
  Manager_Name: string;
  Annual_Quota: number;
  Q1_Quota: number;
  Q2_Quota: number;
  Q3_Quota: number;
  Q4_Quota: number;
  Hire_Date: string;
  Status: string;
}

export interface RawCustomerNameMapping {
  ARR_Customer_Name: string;
  Pipeline_Customer_Name: string;
}

export interface RawSOWMapping {
  SOW_ID: string;
  Vertical: string;
  Region: string;
  Fees_Type: string;
  Revenue_Type: string;
  Segment_Type: string;
  Start_Date: string;
}

export interface RawARRSubCategory {
  SOW_ID: string;
  Customer_Name: string;
  Product_Sub_Category: string;
  Pct_2024: number;
  Pct_2025: number;
  Pct_2026: number;
}

export interface RawProductCategoryMapping {
  Product_Sub_Category: string;
  Product_Category: string;
  Description: string;
  Status: string;
}

// ============ Store Interface ============

export interface RealDataState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  closedAcv: RawClosedAcv[];
  pipelineSnapshots: RawPipelineSnapshot[];
  arrSnapshots: RawARRSnapshot[];
  salesTeam: RawSalesTeam[];
  customerNameMappings: RawCustomerNameMapping[];
  sowMappings: RawSOWMapping[];
  arrSubCategoryBreakdown: RawARRSubCategory[];
  productCategoryMapping: RawProductCategoryMapping[];

  // Indexes for fast lookup
  sowMappingIndex: Record<string, RawSOWMapping>;
  productCategoryIndex: Record<string, string>;
  customerNameIndex: Record<string, string>;

  loadAllData: () => Promise<void>;
}

// ============ Store Implementation ============

export const useRealDataStore = create<RealDataState>((set, get) => ({
  isLoaded: false,
  isLoading: false,
  error: null,
  closedAcv: [],
  pipelineSnapshots: [],
  arrSnapshots: [],
  salesTeam: [],
  customerNameMappings: [],
  sowMappings: [],
  arrSubCategoryBreakdown: [],
  productCategoryMapping: [],
  sowMappingIndex: {},
  productCategoryIndex: {},
  customerNameIndex: {},

  loadAllData: async () => {
    if (get().isLoaded || get().isLoading) return;
    set({ isLoading: true });

    try {
      const fileNames = [
        'closed_acv', 'monthly_pipeline_snapshot', 'monthly_arr_snapshot',
        'sales_team_structure', 'customer_name_mapping', 'sow_mapping',
        'arr_subcategory_breakdown', 'product_category_mapping',
      ];

      const texts = await Promise.all(
        fileNames.map(f =>
          fetch(`/data/${f}.csv`).then(r => {
            if (!r.ok) throw new Error(`Failed to fetch ${f}.csv: ${r.status}`);
            return r.text();
          })
        )
      );

      const [closedAcvText, pipelineText, arrText, salesTeamText,
        customerMappingText, sowMappingText, arrSubCatText, prodCatText] = texts;

      // Parse Closed ACV
      const closedAcv: RawClosedAcv[] = parseCSV(closedAcvText).map(row => ({
        Closed_ACV_ID: row['Closed_ACV_ID'] || '',
        Pipeline_Deal_ID: row['Pipeline_Deal_ID'] || '',
        Deal_Name: row['Deal_Name'] || '',
        Customer_Name: row['Customer_Name'] || '',
        Close_Date: parseDate(row['Close_Date'] || ''),
        Logo_Type: normalizeLogoType(row['Logo_Type'] || ''),
        Value_Type: (row['Value_Type'] || '').trim(),
        Amount: parseNumber(row['Amount'] || ''),
        License_ACV: parseNumber(row['License_ACV'] || ''),
        Implementation_Value: parseNumber(row['Implementation_Value'] || ''),
        Region: row['Region'] || '',
        Vertical: row['Vertical'] || '',
        Segment: row['Segment'] || '',
        Platform: row['Platform'] || '',
        Sales_Rep: (row['Sales_Rep'] || '').trim(),
        SOW_ID: row['SOW_ID'] || '',
        Sold_By: (row['Sold By'] || row['Sold_By'] || 'Sales').trim(),
      }));

      // Parse Pipeline Snapshots
      const pipelineSnapshots: RawPipelineSnapshot[] = parseCSV(pipelineText).map(row => ({
        Snapshot_Month: parseDate(row['Snapshot_Month'] || ''),
        Pipeline_Deal_ID: row['Pipeline_Deal_ID'] || '',
        Deal_Name: row['Deal_Name'] || '',
        Customer_Name: row['Customer_Name'] || '',
        Deal_Value: parseNumber(row['Deal_Value'] || ''),
        License_ACV: parseNumber(row['License_ACV'] || ''),
        Implementation_Value: parseNumber(row['Implementation_Value'] || ''),
        Logo_Type: normalizeLogoType(row['Logo_Type'] || ''),
        Deal_Stage: (row['Deal_Stage'] || '').trim(),
        Current_Stage: (row['Current_Stage'] || '').trim(),
        Probability: parseNumber(row['Probability'] || ''),
        Expected_Close_Date: parseDate(row['Expected_Close_Date'] || ''),
        Region: (row['Region'] || '').trim(),
        Vertical: (row['Vertical'] || '').trim(),
        Segment: (row['Segment'] || '').trim(),
        Product_Sub_Category: (row['Product_Sub_Category'] || '').trim(),
        Sales_Rep: (row['Sales_Rep'] || '').trim(),
      }));

      // Parse ARR Snapshots
      const arrSnapshots: RawARRSnapshot[] = parseCSV(arrText).map(row => ({
        Snapshot_Month: parseDate(row['Snapshot_Month'] || ''),
        SOW_ID: row['SOW_ID'] || '',
        Customer_Name: row['Customer_Name'] || '',
        Quantum_SMART: (row['Quantum/SMART'] || '').trim(),
        Quantum_GoLive_Date: parseDate(row['Quantum Go-Live Date'] || row['Quantum_GoLive_Date'] || ''),
        Starting_ARR: parseNumber(row['Starting_ARR'] || ''),
        New_ARR: parseNumber(row['New_ARR'] || ''),
        Expansion_ARR: parseNumber(row['Expansion_ARR'] || ''),
        Schedule_Change: parseNumber(row['Schedule Change'] || row['Schedule_Change'] || ''),
        Contraction_ARR: parseNumber(row['Contraction_ARR'] || ''),
        Churn_ARR: parseNumber(row['Churn_ARR'] || ''),
        Ending_ARR: parseNumber(row['Ending_ARR'] || ''),
        Region: (row['Region'] || '').trim(),
        Vertical: (row['Vertical'] || '').trim(),
        Segment: (row['Segment'] || '').trim(),
        Contract_Start_Date: parseDate(row['Contract_Start_Date'] || ''),
        Contract_End_Date: parseDate(row['Contract_End_Date'] || ''),
        Renewal_Risk: (row['Renewal_Risk'] || '').trim(),
      }));

      // Parse Sales Team
      const salesTeam: RawSalesTeam[] = parseCSV(salesTeamText).map(row => ({
        Sales_Rep_ID: row['Sales_Rep_ID'] || '',
        Name: (row['Name'] || '').trim(),
        Email: row['Email'] || '',
        Role: (row['Role'] || '').trim(),
        Region: (row['Region'] || '').trim(),
        Vertical_Focus: row['Vertical_Focus'] || '',
        Segment: (row['Segment'] || '').trim(),
        Manager_ID: row['Manager_ID'] || '',
        Manager_Name: (row['Manager_Name'] || '').trim(),
        Annual_Quota: parseNumber(row['Annual_Quota'] || ''),
        Q1_Quota: parseNumber(row['Q1_Quota'] || ''),
        Q2_Quota: parseNumber(row['Q2_Quota'] || ''),
        Q3_Quota: parseNumber(row['Q3_Quota'] || ''),
        Q4_Quota: parseNumber(row['Q4_Quota'] || ''),
        Hire_Date: parseDate(row['Hire_Date'] || ''),
        Status: row['Status'] || '',
      }));

      // Parse Customer Name Mapping
      const customerNameMappings: RawCustomerNameMapping[] = parseCSV(customerMappingText).map(row => ({
        ARR_Customer_Name: row['ARR_Customer_Name'] || '',
        Pipeline_Customer_Name: row['Pipeline_Customer_Name'] || '',
      }));

      // Parse SOW Mapping
      const sowMappings: RawSOWMapping[] = parseCSV(sowMappingText).map(row => ({
        SOW_ID: row['SOW_ID'] || '',
        Vertical: (row['Vertical'] || '').trim(),
        Region: (row['Region'] || '').trim(),
        Fees_Type: (row['Fees_Type'] || '').trim(),
        Revenue_Type: (row['Revenue_Type'] || '').trim(),
        Segment_Type: (row['Segment_Type'] || '').trim(),
        Start_Date: parseDate(row['Start_Date'] || ''),
      }));

      // Parse ARR Sub-Category Breakdown
      const arrSubCategoryBreakdown: RawARRSubCategory[] = parseCSV(arrSubCatText).map(row => ({
        SOW_ID: row['SOW_ID'] || '',
        Customer_Name: row['Customer_Name'] || '',
        Product_Sub_Category: (row['Product_Sub_Category'] || '').trim(),
        Pct_2024: parseNumber(row['2024_Contribution_Pct'] || ''),
        Pct_2025: parseNumber(row['2025_Contribution_Pct'] || ''),
        Pct_2026: parseNumber(row['2026_Contribution_Pct'] || ''),
      }));

      // Parse Product Category Mapping
      const productCategoryMapping: RawProductCategoryMapping[] = parseCSV(prodCatText)
        .filter(row => row['Product_Sub_Category'])
        .map(row => ({
          Product_Sub_Category: (row['Product_Sub_Category'] || '').trim(),
          Product_Category: (row['Product_Category'] || '').trim(),
          Description: row['Description'] || '',
          Status: row['Status'] || '',
        }));

      // Build indexes
      const sowMappingIndex: Record<string, RawSOWMapping> = {};
      sowMappings.forEach(m => { if (m.SOW_ID) sowMappingIndex[m.SOW_ID] = m; });

      const productCategoryIndex: Record<string, string> = {};
      productCategoryMapping.forEach(m => {
        if (m.Product_Sub_Category) productCategoryIndex[m.Product_Sub_Category] = m.Product_Category;
      });

      const customerNameIndex: Record<string, string> = {};
      customerNameMappings.forEach(m => {
        if (m.ARR_Customer_Name) customerNameIndex[m.ARR_Customer_Name] = m.Pipeline_Customer_Name;
      });

      set({
        closedAcv, pipelineSnapshots, arrSnapshots, salesTeam,
        customerNameMappings, sowMappings, arrSubCategoryBreakdown, productCategoryMapping,
        sowMappingIndex, productCategoryIndex, customerNameIndex,
        isLoaded: true, isLoading: false,
      });

      console.log(`[RealData] Loaded: ${closedAcv.length} closed ACV, ${pipelineSnapshots.length} pipeline snapshots, ${arrSnapshots.length} ARR snapshots, ${salesTeam.length} team members, ${sowMappings.length} SOW mappings, ${arrSubCategoryBreakdown.length} sub-categories, ${productCategoryMapping.length} product categories`);

    } catch (err) {
      console.error('[RealData] Failed to load CSV data:', err);
      set({ error: String(err), isLoading: false });
    }
  },
}));

// Auto-load data when module is first imported
useRealDataStore.getState().loadAllData();
