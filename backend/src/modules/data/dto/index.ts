// Interfaces matching the frontend's RealDataStore types exactly

export interface ClosedAcvRecord {
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

export interface PipelineSnapshotRecord {
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

export interface ARRSnapshotRecord {
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

export interface SalesTeamRecord {
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

export interface CustomerNameMappingRecord {
  ARR_Customer_Name: string;
  Pipeline_Customer_Name: string;
}

export interface SOWMappingRecord {
  SOW_ID: string;
  SOW_Name: string;
  Vertical: string;
  Region: string;
  Fees_Type: string;
  Revenue_Type: string;
  Segment_Type: string;
  Start_Date: string;
}

export interface ARRSubCategoryRecord {
  SOW_ID: string;
  Customer_Name: string;
  Product_Sub_Category: string;
  Pct_2024: number;
  Pct_2025: number;
  Pct_2026: number;
}

export interface ProductCategoryMappingRecord {
  Product_Sub_Category: string;
  Product_Category: string;
  Description: string;
  Status: string;
}

export interface AllDataResponse {
  closedAcv: ClosedAcvRecord[];
  pipelineSnapshots: PipelineSnapshotRecord[];
  arrSnapshots: ARRSnapshotRecord[];
  salesTeam: SalesTeamRecord[];
  customerNameMappings: CustomerNameMappingRecord[];
  sowMappings: SOWMappingRecord[];
  arrSubCategoryBreakdown: ARRSubCategoryRecord[];
  productCategoryMapping: ProductCategoryMappingRecord[];
  sowMappingIndex: Record<string, SOWMappingRecord>;
  productCategoryIndex: Record<string, string>;
  customerNameIndex: Record<string, string>;
}
