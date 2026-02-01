
// Financial Data Types
export interface FinancialMetric {
  date: string;
  actual: number | null;
  forecast: number | null;
  budget: number | null;
  confidenceLower?: number;
  confidenceUpper?: number;
}

export interface Anomaly {
  id: string;
  metric: string;
  date: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  driver: string;
  impactValue: number;
}

export interface Scenario {
  id: string;
  name: string;
  inflationRate: number;
  revenueGrowth: number;
  opexChange: number;
}

export interface SegmentedData {
  date: string;
  region: string;
  lob: 'Software' | 'Services';
  revenue: number;
  ebitda: number;
  cashFlow: number;
}

// Sales & Cost Types
export interface PipelineStage {
  stage: string;
  value: number;
  dealCount: number;
  conversionRate: number; 
  avgDaysInStage: number;
  frictionAlert: boolean;
}

export interface VendorSpend {
  name: string;
  category: string;
  amount: number;
  growth: number; // YoY growth
  risk: 'low' | 'medium' | 'high';
}

export interface PhantomCost {
  id: string;
  description: string;
  amount: number;
  detectedDate: string;
  category: string;
  status: 'new' | 'investigating' | 'resolved';
}

// --- COST ANALYSIS TYPES ---
export interface DepartmentCost {
    department: string;
    payroll: number;
    software: number;
    travel: number;
    marketing: number;
    headcount: number;
    budgetAllocated: number; 
}

export interface CostTrend {
    month: string;
    payroll: number;
    travel: number;
    software: number;
    headcount: number;
    opexRatio: number; 
}

// --- REVENUE & PROFITABILITY TYPES ---
export interface ProductProfitability {
    productName: string;
    lob: 'Software' | 'Services'; 
    revenue: number;
    cogs: number;
    grossMargin: number;
    contributionMargin: number;
}

export interface SaaSMetric {
    date: string;
    mrr: number;
    arr: number;
    nrr: number; 
    churnRate: number;
    cac: number;
    ltv: number;
    ruleOf40: number; 
}

export interface AcquisitionChannel {
    channel: string;
    leads: number;
    conversionRate: number;
    cac: number;
    revenueGenerated: number;
}

// XAI & Root Cause Analysis Types
export interface Driver {
  name: string;
  value: number; 
  category: 'Internal' | 'External' | 'Market';
  anomalyId?: string;
  description?: string; 
}

export interface Hypothesis {
  id: string;
  anomalyId?: string;
  statement: string;
  likelihood: number; 
  status: 'confirmed' | 'rejected' | 'analyzing';
  linkedDriver?: string; 
}

// AI Agent Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

// System Health Types
export interface SystemNode {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastSync: string;
  type: 'ERP' | 'CRM' | 'HRIS' | 'MarketData';
}

export interface LineageNode {
    id: string;
    label: string;
    type: 'source' | 'process' | 'storage' | 'output';
    status: 'active' | 'error' | 'processing';
    description: string;
    upstreamIds: string[];
}

// Governance Types
export interface GovernanceLog {
  id: string;
  timestamp: string;
  actor: string; 
  action: string;
  details: string;
  type: 'HUMAN' | 'AI_AGENT' | 'SYSTEM';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ModelHealthMetric {
  modelName: string;
  accuracy: number;
  biasScore: number; 
  driftDetected: boolean;
  lastRetrained: string;
}

// --- CORE DATA MODEL ---

export type Region = 'North America' | 'Europe' | 'Middle East' | 'Asia Pacific' | 'Latin America';
export type Vertical = 'CPG' | 'AIM' | 'TMT' | 'E&U' | 'LS' | 'Others';
export type LOB = 'Software' | 'Services';
export type Segment = 'Enterprise' | 'Mid-Market';

export interface Deal {
  DealID: string;
  Region: Region;
  Type: LOB;
  RevenueType: 'License' | 'Implementation'; // New
  Vertical: Vertical;
  Segment: Segment; // New
  Stage: string;
  Value: number;
  Probability: number;
  DaysInPipeline: number;
  Channel: string;
  Owner: string; // Sales Rep
  CloseDate: string;
}

export interface SalesRep {
    id: string;
    name: string;
    quota: number;
    closedYTD: number;
    forecast: number;
    pipelineCoverage: number;
    winRate: number;
}

export interface GTMMetric {
    metric: string;
    value: number | string;
    trend: number;
    unit: string;
}

export interface CoreData {
  Metadata: {
    ReportDate: string;
    Currency: string;
    EBITDA_Target: number;
    GlobalRevenue_YTD: number;
  };
  SalesInsights: {
    SummaryKPIs: {
      SalesVelocity: number;
      PipelineCoverageRatio: number;
      CLV_to_CAC_Ratio: number;
      QuotaAttainment: number; 
    };
    Segmentation: Array<{
      Region: string;
      Services_ARR_Contracted: number;
      Software_ARR_Contracted: number;
      WeightedPipeline: number;
      PredictedChurn: number;
      Total_Employees: number;
    }>;
    PipelineDeals: Deal[];
  };
  CostInsights: {
    SummaryKPIs: {
      MonthlyBurnRate: number;
      OperatingCashRunway_Months: number;
      RevenuePerEmployee_Global: number;
    };
    OperatingExpense: {
      Budget_Q4: number;
      Actual_Q4: number;
      Variance: number;
    };
    VendorSpend: Array<{
      Category: string;
      Vendor: string;
      Spend_MTD: number;
      YoY_Change: number;
    }>;
  };
}
