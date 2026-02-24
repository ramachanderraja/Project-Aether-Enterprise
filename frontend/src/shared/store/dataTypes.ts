// Shared data types and utility functions used across module-specific stores.
// The actual data loading is handled by per-module stores:
//   - useSalesDataStore   (salesDataStore.ts)   -> GET /sales/data
//   - useRevenueDataStore (revenueDataStore.ts)  -> GET /revenue/data

// ============ Parsing Utilities ============

export function parseNumber(str: string): number {
  if (!str) return 0;
  const cleaned = str.replace(/[$%\s]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
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
  if (trimmed === 'Renewal/Extn' || trimmed === 'Renewal/Extension') return 'Extension';
  return trimmed;
}

export function normalizeRegion(raw: string): string {
  const map: Record<string, string> = {
    'NA': 'North America',
    'EU': 'Europe',
    'ME': 'Middle East',
    'APAC': 'APAC',
    'LA': 'LATAM',
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
  Created_Date: string;
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
  SOW_Name: string;
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
