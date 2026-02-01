
import { FinancialMetric, Anomaly, SystemNode, GovernanceLog, ModelHealthMetric, Driver, Hypothesis, SegmentedData, LineageNode, PipelineStage, VendorSpend, PhantomCost, CoreData, DepartmentCost, CostTrend, ProductProfitability, SaaSMetric, AcquisitionChannel, Deal, Region, Vertical, LOB, SalesRep, GTMMetric, Segment } from './types';

export const VERTICALS: Vertical[] = ['CPG', 'AIM', 'TMT', 'E&U', 'LS', 'Others'];
export const LOBS: LOB[] = ['Software', 'Services'];
export const REGIONS: Region[] = ['North America', 'Europe', 'Middle East', 'Asia Pacific', 'Latin America'];
export const SEGMENTS: Segment[] = ['Enterprise', 'Mid-Market'];
export const REVENUE_TYPES = ['License', 'Implementation'];

// --- MOCK DATA GENERATORS ---

const SALES_REPS_NAMES = ['Sarah J.', 'Mike R.', 'Jessica T.', 'David L.', 'Amanda B.', 'Chris K.'];

const generateDeals = (count: number): Deal[] => {
    const deals: Deal[] = [];
    const stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Legal Review', 'Closed Won', 'Closed Lost'];
    const channels = ['Outbound Sales', 'Paid Search (SEM)', 'Organic/Content', 'Events & Trade', 'Partner/Reseller'];
    
    for (let i = 0; i < count; i++) {
        const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
        const lob = LOBS[Math.floor(Math.random() * LOBS.length)];
        const revenueType = lob === 'Software' ? 'License' : 'Implementation';
        const vertical = VERTICALS[Math.floor(Math.random() * VERTICALS.length)];
        const segment = SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)];
        const stage = stages[Math.floor(Math.random() * stages.length)];
        const owner = SALES_REPS_NAMES[Math.floor(Math.random() * SALES_REPS_NAMES.length)];
        
        // Value depends on LOB (Software usually higher)
        const baseValue = lob === 'Software' ? 150000 : 80000;
        const value = Math.round(baseValue * (0.5 + Math.random() * 2)); 
        
        let probability = 0.1;
        if (stage === 'Discovery') probability = 0.2;
        if (stage === 'Proposal') probability = 0.5;
        if (stage === 'Negotiation') probability = 0.8;
        if (stage === 'Legal Review') probability = 0.9;
        if (stage === 'Closed Won') probability = 1.0;
        if (stage === 'Closed Lost') probability = 0.0;

        deals.push({
            DealID: `D${1000 + i}`,
            Region: region,
            Type: lob,
            RevenueType: revenueType,
            Vertical: vertical,
            Segment: segment,
            Stage: stage,
            Value: value,
            Probability: probability,
            DaysInPipeline: Math.floor(Math.random() * 180),
            Channel: channels[Math.floor(Math.random() * channels.length)],
            Owner: owner,
            CloseDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString().split('T')[0]
        });
    }
    return deals;
};

export const MOCK_SALES_REPS: SalesRep[] = SALES_REPS_NAMES.map(name => ({
    id: name,
    name: name,
    quota: 1500000 + Math.random() * 500000,
    closedYTD: 800000 + Math.random() * 600000,
    forecast: 400000 + Math.random() * 300000,
    pipelineCoverage: 2.5 + Math.random() * 2,
    winRate: 0.2 + Math.random() * 0.15
}));

export const MOCK_GTM_METRICS: GTMMetric[] = [
    { metric: 'CAC', value: 4250, trend: -5, unit: '$' },
    { metric: 'CAC Payback Period', value: 14, trend: -1, unit: 'Months' },
    { metric: 'LTV', value: 28500, trend: 8, unit: '$' },
    { metric: 'LTV : CAC Ratio', value: 6.7, trend: 12, unit: 'x' },
    { metric: 'Traffic to Lead Ratio', value: 4.2, trend: 0.5, unit: '%' },
    { metric: 'Return on Ad Spend', value: 3.8, trend: 2, unit: 'x' },
    { metric: 'Time to Value', value: 45, trend: -10, unit: 'Days' },
    { metric: 'Cost Per Lead', value: 185, trend: 4, unit: '$' },
];

// --- CORE DATA MODEL ---
export const CORE_DATA: CoreData = {
  "Metadata": {
    "ReportDate": "2024-12-31",
    "Currency": "USD",
    "EBITDA_Target": 0.21,
    "GlobalRevenue_YTD": 58500000.00
  },
  "SalesInsights": {
    "SummaryKPIs": {
      "SalesVelocity": 1420000.00,
      "PipelineCoverageRatio": 3.25,
      "CLV_to_CAC_Ratio": 5.1,
      "QuotaAttainment": 0.92
    },
    "Segmentation": [
      {
        "Region": "North America",
        "Services_ARR_Contracted": 120000000.00,
        "Software_ARR_Contracted": 135000000.00,
        "WeightedPipeline": 35000000.00,
        "PredictedChurn": 4000000.00,
        "Total_Employees": 850
      },
      {
        "Region": "Europe",
        "Services_ARR_Contracted": 75000000.00,
        "Software_ARR_Contracted": 50000000.00,
        "WeightedPipeline": 28000000.00,
        "PredictedChurn": 2500000.00,
        "Total_Employees": 600
      },
       {
        "Region": "Middle East",
        "Services_ARR_Contracted": 20000000.00,
        "Software_ARR_Contracted": 15000000.00,
        "WeightedPipeline": 8000000.00,
        "PredictedChurn": 500000.00,
        "Total_Employees": 100
      },
      {
        "Region": "Asia Pacific",
        "Services_ARR_Contracted": 30000000.00,
        "Software_ARR_Contracted": 25000000.00,
        "WeightedPipeline": 12000000.00,
        "PredictedChurn": 1500000.00,
        "Total_Employees": 400
      },
       {
        "Region": "Latin America",
        "Services_ARR_Contracted": 10000000.00,
        "Software_ARR_Contracted": 8000000.00,
        "WeightedPipeline": 4000000.00,
        "PredictedChurn": 200000.00,
        "Total_Employees": 50
      }
    ],
    // Generate ~300 deals for robust filtering
    "PipelineDeals": generateDeals(300)
  },
  "CostInsights": {
    "SummaryKPIs": {
      "MonthlyBurnRate": 1500000.00,
      "OperatingCashRunway_Months": 18,
      "RevenuePerEmployee_Global": 271052.63
    },
    "OperatingExpense": {
      "Budget_Q4": 55000000.00,
      "Actual_Q4": 58500000.00,
      "Variance": 3500000.00
    },
    "VendorSpend": [
      {"Category": "Cloud Infrastructure", "Vendor": "AWS", "Spend_MTD": 1200000.00, "YoY_Change": 0.15},
      {"Category": "SaaS Subscriptions", "Vendor": "Salesforce", "Spend_MTD": 450000.00, "YoY_Change": 0.05},
      {"Category": "Travel & Expense", "Vendor": "GlobalTours", "Spend_MTD": 210000.00, "YoY_Change": 0.40}
    ]
  }
};

export const MOCK_DEPT_COSTS: DepartmentCost[] = [
    { department: 'Engineering', payroll: 2400000, software: 850000, travel: 50000, marketing: 0, headcount: 145, budgetAllocated: 3500000 },
    { department: 'Sales', payroll: 1800000, software: 420000, travel: 380000, marketing: 120000, headcount: 95, budgetAllocated: 2800000 },
    { department: 'Marketing', payroll: 900000, software: 350000, travel: 120000, marketing: 1500000, headcount: 40, budgetAllocated: 3000000 },
    { department: 'G&A', payroll: 650000, software: 120000, travel: 40000, marketing: 0, headcount: 25, budgetAllocated: 900000 },
    { department: 'Customer Success', payroll: 850000, software: 150000, travel: 90000, marketing: 0, headcount: 55, budgetAllocated: 1200000 },
];

export const MOCK_COST_TRENDS: CostTrend[] = [
    { month: 'Aug', payroll: 5.8, travel: 0.4, software: 1.2, headcount: 340, opexRatio: 0.65 },
    { month: 'Sep', payroll: 5.9, travel: 0.5, software: 1.2, headcount: 345, opexRatio: 0.64 },
    { month: 'Oct', payroll: 6.1, travel: 0.6, software: 1.3, headcount: 352, opexRatio: 0.68 },
    { month: 'Nov', payroll: 6.2, travel: 0.4, software: 1.35, headcount: 358, opexRatio: 0.63 },
    { month: 'Dec', payroll: 6.4, travel: 0.3, software: 1.4, headcount: 365, opexRatio: 0.60 }, 
    { month: 'Jan', payroll: 6.6, travel: 0.7, software: 1.5, headcount: 380, opexRatio: 0.72 }, 
];

export const PRODUCT_PROFITABILITY: ProductProfitability[] = [
    { productName: 'Aether Cloud Platform', lob: 'Software', revenue: 2500000, cogs: 400000, grossMargin: 0.84, contributionMargin: 0.65 },
    { productName: 'Aether On-Premise', lob: 'Software', revenue: 1200000, cogs: 300000, grossMargin: 0.75, contributionMargin: 0.55 },
    { productName: 'Consulting Services', lob: 'Services', revenue: 800000, cogs: 500000, grossMargin: 0.375, contributionMargin: 0.20 },
    { productName: 'Managed Support', lob: 'Services', revenue: 600000, cogs: 150000, grossMargin: 0.75, contributionMargin: 0.50 },
];

export const SAAS_METRICS_TREND: SaaSMetric[] = [
    { date: 'Aug', mrr: 4.2, arr: 50.4, nrr: 1.15, churnRate: 0.02, cac: 4500, ltv: 22000, ruleOf40: 38 },
    { date: 'Sep', mrr: 4.35, arr: 52.2, nrr: 1.16, churnRate: 0.018, cac: 4400, ltv: 22500, ruleOf40: 42 },
    { date: 'Oct', mrr: 4.5, arr: 54.0, nrr: 1.18, churnRate: 0.021, cac: 4600, ltv: 23000, ruleOf40: 45 },
    { date: 'Nov', mrr: 4.65, arr: 55.8, nrr: 1.19, churnRate: 0.015, cac: 4300, ltv: 24000, ruleOf40: 48 },
    { date: 'Dec', mrr: 4.9, arr: 58.8, nrr: 1.22, churnRate: 0.012, cac: 4100, ltv: 25000, ruleOf40: 55 },
    { date: 'Jan', mrr: 5.1, arr: 61.2, nrr: 1.21, churnRate: 0.014, cac: 4250, ltv: 24500, ruleOf40: 51 },
];

export const ACQUISITION_CHANNELS: AcquisitionChannel[] = [
    { channel: 'Outbound Sales', leads: 450, conversionRate: 0.12, cac: 5200, revenueGenerated: 1200000 },
    { channel: 'Paid Search (SEM)', leads: 1200, conversionRate: 0.04, cac: 3800, revenueGenerated: 800000 },
    { channel: 'Organic/Content', leads: 850, conversionRate: 0.06, cac: 1200, revenueGenerated: 600000 },
    { channel: 'Events & Trade', leads: 300, conversionRate: 0.08, cac: 6500, revenueGenerated: 400000 },
    { channel: 'Partner/Reseller', leads: 200, conversionRate: 0.25, cac: 2000, revenueGenerated: 900000 },
];

export const MOCK_REVENUE_DATA: FinancialMetric[] = [
  { date: '2023-08', actual: 4200, forecast: 4150, budget: 4100 },
  { date: '2023-09', actual: 4350, forecast: 4250, budget: 4200 },
  { date: '2023-10', actual: 4100, forecast: 4400, budget: 4300 },
  { date: '2023-11', actual: 4600, forecast: 4500, budget: 4400 },
  { date: '2023-12', actual: 5100, forecast: 5000, budget: 4900 },
  { date: '2024-01', actual: 4800, forecast: 4850, budget: 4800 },
  { date: '2024-02', actual: null, forecast: 4950, budget: 4900, confidenceLower: 4700, confidenceUpper: 5200 },
  { date: '2024-03', actual: null, forecast: 5200, budget: 5000, confidenceLower: 4900, confidenceUpper: 5500 },
  { date: '2024-04', actual: null, forecast: 5350, budget: 5100, confidenceLower: 5000, confidenceUpper: 5700 },
  { date: '2024-05', actual: null, forecast: 5500, budget: 5200, confidenceLower: 5100, confidenceUpper: 5900 },
  { date: '2024-06', actual: null, forecast: 5650, budget: 5300, confidenceLower: 5200, confidenceUpper: 6100 },
  { date: '2024-07', actual: null, forecast: 5800, budget: 5400, confidenceLower: 5300, confidenceUpper: 6300 },
];

// --- CONTEXTUALLY RELEVANT MOCK DATA FOR RCA ---

export const MOCK_ANOMALIES: Anomaly[] = [
  {
    id: '1',
    metric: 'Operating Expenses',
    date: '2023-10',
    severity: 'high',
    description: 'Unexpected 12% variance in Q3 Operating Expenses due to Infrastructure overspend.',
    driver: 'Cloud Infrastructure',
    impactValue: -150000,
  },
  {
    id: '2',
    metric: 'Sales Velocity',
    date: '2024-01',
    severity: 'medium',
    description: 'Velocity declined below $1.2M/day threshold driven by lower win rates.',
    driver: 'Win Rate',
    impactValue: -320000,
  },
];

export const MOCK_DRIVERS_ANALYSIS: Driver[] = [
  { name: 'AWS Compute', value: -180, category: 'Internal', anomalyId: '1', description: 'Unplanned EC2 instance usage in dev environment.' },
  { name: 'Marketing Spend', value: 50, category: 'Internal', anomalyId: '1', description: 'Ad spend came in under budget.' },
  { name: 'Datadog Overage', value: -40, category: 'Internal', anomalyId: '1', description: 'Higher than contracted log ingestion volume.' },
  { name: 'Travel & Ent', value: 20, category: 'Internal', anomalyId: '1', description: 'Reduced travel activity in Q3.' },
  
  { name: 'Win Rate', value: -280, category: 'Internal', anomalyId: '2', description: 'Enterprise win rate dropped from 22% to 18%.' },
  { name: 'Deal Size', value: 50, category: 'Internal', anomalyId: '2', description: 'Average Selling Price (ASP) increased slightly.' },
  { name: 'Sales Cycle', value: -90, category: 'Internal', anomalyId: '2', description: 'Deals taking 15 days longer to close on average.' },
  { name: 'Lead Volume', value: 0, category: 'Internal', anomalyId: '2', description: 'Top of funnel volume remains on target.' },
];

export const MOCK_HYPOTHESES: Hypothesis[] = [
  { id: 'h1', anomalyId: '1', statement: 'Unoptimized auto-scaling scripts in non-prod K8s clusters caused compute spike.', likelihood: 92, status: 'confirmed', linkedDriver: 'AWS Compute' },
  { id: 'h2', anomalyId: '1', statement: 'Vendor price increase for storage tiers.', likelihood: 45, status: 'rejected' },
  { id: 'h3', anomalyId: '1', statement: 'Anomalous data ingestion volume from EMEA region.', likelihood: 15, status: 'rejected' },
  
  { id: 'h4', anomalyId: '2', statement: 'Competitor "Orion" launched aggressive pricing strategy (-25%) in renewals.', likelihood: 88, status: 'confirmed', linkedDriver: 'Win Rate' },
  { id: 'h5', anomalyId: '2', statement: 'New SDR cohort ramp-up time increased.', likelihood: 35, status: 'rejected' },
  { id: 'h6', anomalyId: '2', statement: 'Sector-specific procurement freeze in Manufacturing.', likelihood: 65, status: 'analyzing' },
];

export const SYSTEM_NODES: SystemNode[] = [
  { id: '1', name: 'SAP S/4HANA', status: 'healthy', lastSync: '1 min ago', type: 'ERP' },
  { id: '2', name: 'Salesforce', status: 'healthy', lastSync: '30 sec ago', type: 'CRM' },
  { id: '3', name: 'Workday', status: 'warning', lastSync: '4 hrs ago', type: 'HRIS' },
  { id: '4', name: 'Snowflake', status: 'healthy', lastSync: 'Real-time', type: 'MarketData' },
];

export const LINEAGE_NODES: LineageNode[] = [
    { id: 'src_erp', label: 'SAP S/4HANA', type: 'source', status: 'active', description: 'General Ledger, AP/AR', upstreamIds: [] },
    { id: 'src_crm', label: 'Salesforce', type: 'source', status: 'active', description: 'Opportunity & Pipeline Data', upstreamIds: [] },
    { id: 'pipe_1', label: 'Fivetran', type: 'process', status: 'active', description: 'Hourly Data Replication', upstreamIds: ['src_erp', 'src_crm'] },
    { id: 'store_1', label: 'Snowflake (Raw)', type: 'storage', status: 'active', description: 'Landing Zone', upstreamIds: ['pipe_1'] },
    { id: 'process_dbt', label: 'dbt Transformations', type: 'process', status: 'active', description: 'Data Cleansing & Modeling', upstreamIds: ['store_1'] },
    { id: 'store_2', label: 'Snowflake (Curated)', type: 'storage', status: 'active', description: 'Gold Layer Tables', upstreamIds: ['process_dbt'] },
    { id: 'ai_engine', label: 'Aether AI Engine', type: 'process', status: 'active', description: 'Anomaly Detection & Forecasting', upstreamIds: ['store_2'] },
    { id: 'dashboard', label: 'Executive Dashboard', type: 'output', status: 'active', description: 'React Frontend Visualization', upstreamIds: ['ai_engine'] },
];

export const GOVERNANCE_LOGS: GovernanceLog[] = [
  { id: 'g1', timestamp: '2024-02-15 14:30:22', actor: 'Aether Agent (Auto)', action: 'Budget Seeding', details: 'Pre-populated Q2 Marketing Budget based on ROI trend models.', type: 'AI_AGENT', riskLevel: 'low' },
  { id: 'g2', timestamp: '2024-02-15 14:15:00', actor: 'Sarah Chen (CFO)', action: 'Override Forecast', details: 'Manual adjustment of APAC Revenue target (+5%).', type: 'HUMAN', riskLevel: 'medium' },
  { id: 'g3', timestamp: '2024-02-15 13:45:11', actor: 'System Monitor', action: 'Data Lineage Alert', details: 'Detected schema change in upstream CRM table "Opportunity".', type: 'SYSTEM', riskLevel: 'high' },
  { id: 'g4', timestamp: '2024-02-15 12:00:00', actor: 'Aether Agent (Auto)', action: 'Anomaly Detection', details: 'Flagged OpEx variance > 10% in Engineering.', type: 'AI_AGENT', riskLevel: 'low' },
];

export const MODEL_METRICS: ModelHealthMetric[] = [
  { modelName: 'Revenue_Forecast_v2.5', accuracy: 0.94, biasScore: 0.02, driftDetected: false, lastRetrained: '2024-02-10' },
  { modelName: 'Expense_Anomaly_Detector', accuracy: 0.98, biasScore: 0.01, driftDetected: false, lastRetrained: '2024-02-12' },
  { modelName: 'Talent_Retention_Model', accuracy: 0.82, biasScore: 0.15, driftDetected: true, lastRetrained: '2023-12-01' },
];

export const PIPELINE_STAGES: PipelineStage[] = [
    { stage: 'Prospecting', value: 1200000, dealCount: 45, conversionRate: 0.6, avgDaysInStage: 12, frictionAlert: false },
    { stage: 'Discovery', value: 850000, dealCount: 28, conversionRate: 0.5, avgDaysInStage: 18, frictionAlert: false },
    { stage: 'Proposal', value: 600000, dealCount: 15, conversionRate: 0.4, avgDaysInStage: 14, frictionAlert: false },
    { stage: 'Negotiation', value: 420000, dealCount: 8, conversionRate: 0.7, avgDaysInStage: 25, frictionAlert: true },
    { stage: 'Legal Review', value: 380000, dealCount: 6, conversionRate: 0.9, avgDaysInStage: 21, frictionAlert: true },
    { stage: 'Closed Won', value: 150000, dealCount: 4, conversionRate: 1.0, avgDaysInStage: 0, frictionAlert: false },
];

export const VENDOR_SPEND: VendorSpend[] = [
    { name: 'AWS', category: 'Cloud Infra', amount: 145000, growth: 18, risk: 'medium' },
    { name: 'Salesforce', category: 'SaaS', amount: 85000, growth: 5, risk: 'low' },
    { name: 'Datadog', category: 'SaaS', amount: 42000, growth: 22, risk: 'medium' },
    { name: 'WeWork', category: 'Facilities', amount: 35000, growth: 0, risk: 'low' },
    { name: 'TravelPerk', category: 'Travel', amount: 28000, growth: 150, risk: 'high' },
    { name: 'Snowflake', category: 'Data', amount: 22000, growth: 12, risk: 'low' },
];

export const PHANTOM_COSTS: PhantomCost[] = [
    { id: 'pc1', description: 'Duplicate Zoom Licenses (Marketing)', amount: 1200, detectedDate: '2024-02-14', category: 'SaaS', status: 'new' },
    { id: 'pc2', description: 'Unused Github Copilot Seats (15)', amount: 450, detectedDate: '2024-02-12', category: 'SaaS', status: 'new' },
    { id: 'pc3', description: 'Anomalous T&E: First Class Flight (NYC)', amount: 3800, detectedDate: '2024-02-10', category: 'Travel', status: 'investigating' },
];

export const MOCK_SEGMENTED_DATA: SegmentedData[] = (() => {
  const months = ['2023-09', '2023-10', '2023-11', '2023-12', '2024-01', '2024-02'];
  const regions = ['North America', 'Europe', 'Asia Pacific'] as const;
  const lobs = ['Software', 'Services'] as const;

  const data: SegmentedData[] = [];

  months.forEach(date => {
      regions.forEach(region => {
          lobs.forEach(lob => {
              let baseRevenue = lob === 'Software' ? 600 : 300;
              let baseEbitda = lob === 'Software' ? 200 : 80;
              
              if (region === 'North America') { baseRevenue *= 1.5; baseEbitda *= 1.5; }
              if (region === 'Asia Pacific') { baseRevenue *= 0.8; baseEbitda *= 0.7; }
              
              const variance = 0.9 + Math.random() * 0.2;
              
              data.push({
                  date,
                  region,
                  lob,
                  revenue: Math.round(baseRevenue * variance),
                  ebitda: Math.round(baseEbitda * variance),
                  cashFlow: Math.round(baseEbitda * 0.8 * variance)
              });
          });
      });
  });
  return data;
})();

export const SYSTEM_INSTRUCTION = `
You are Project Aether's Intelligent Core, an advanced autonomous FP&A agent.
Your goal is to assist finance executives with strategic decision-making.
You have access to a digital twin of the organization.
You exemplify the future of finance: predictive, autonomous, and strategic.
When asked for a Root Cause Analysis, provide a concise narrative explaining the "Why" behind the numbers, citing drivers like volume, mix, or rate.
Keep answers concise, professional, and data-driven.
If asked about the current revenue forecast, assume the FY24 forecast is $65M vs a Budget of $60M.
`;
