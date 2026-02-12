import { useState, useRef } from 'react';
import { useSOWMappingStore, SOWMappingRecord } from '@shared/store/sowMappingStore';
import { usePipelineSubCategoryStore, PipelineSubCategoryRecord } from '@shared/store/pipelineSubCategoryStore';
import { useARRSubCategoryStore, ARRSubCategoryRecord } from '@shared/store/arrSubCategoryStore';
import { useProductCategoryMappingStore, ProductCategoryMappingRecord } from '@shared/store/productCategoryMappingStore';

interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  fileType: string;
  lastImport: string | null;
  recordCount: number | null;
}

interface ImportHistory {
  id: string;
  templateName: string;
  fileName: string;
  status: 'completed' | 'failed' | 'processing';
  recordsImported: number;
  errors: number;
  importedAt: string;
  importedBy: string;
}

const importTemplates: ImportTemplate[] = [
  // Sales & Pipeline Templates
  { id: 'closed_acv', name: 'Closed ACV', description: 'Closed deals with License/Implementation split, Logo Type, and ACV calculation rules', fileType: 'CSV', lastImport: '2025-01-30T14:30:00Z', recordCount: 24 },
  { id: 'monthly_pipeline_snapshot', name: 'Monthly Pipeline Snapshots', description: '12 months of deal progression showing new, growing, shrinking, and closing deals', fileType: 'CSV', lastImport: '2025-01-30T11:00:00Z', recordCount: 65 },
  { id: 'sales_team_structure', name: 'Sales Team Structure', description: 'Team hierarchy with quotas by rep, region, and manager relationships', fileType: 'CSV', lastImport: '2025-01-25T09:15:00Z', recordCount: 20 },
  { id: 'prior_year_performance', name: 'Prior Year Performance', description: 'Historical sales data with attainment, win rates, and deal counts by rep', fileType: 'CSV', lastImport: '2025-01-25T09:15:00Z', recordCount: 21 },
  { id: 'pipeline_subcategory_breakdown', name: 'Pipeline Sub-Category Breakdown', description: 'Maps pipeline deals to product sub-category contribution percentages for weighted pipeline/forecast by product', fileType: 'CSV', lastImport: null, recordCount: null },
  // Revenue & ARR Templates
  { id: 'monthly_arr_snapshot', name: 'Monthly ARR Snapshots', description: '12 months of SOW-level ARR with movements (New, Expansion, Contraction, Churn)', fileType: 'CSV', lastImport: '2025-01-28T14:30:00Z', recordCount: 95 },
  { id: 'arr_subcategory_breakdown', name: 'ARR Sub-Category Breakdown', description: 'SOW-level annual contribution % by product sub-category for 2024-2026', fileType: 'CSV', lastImport: '2025-01-28T14:30:00Z', recordCount: 22 },
  // Mapping & Reference Templates
  { id: 'customer_name_mapping', name: 'Customer Name Mapping', description: 'Mapping between ARR and Pipeline customer names (legal vs common names)', fileType: 'CSV', lastImport: '2025-01-25T09:15:00Z', recordCount: 30 },
  { id: 'product_category_mapping', name: 'Product Category Mapping', description: 'Sub-category to category mapping - the ONLY place Product Category is stored', fileType: 'CSV', lastImport: '2025-01-25T09:15:00Z', recordCount: 20 },
  { id: 'sow_mapping', name: 'SOW Mapping', description: 'SOW-level metadata: Vertical, Region, Fees Type, Revenue Type, Segment Type, and contract start date. Used to enrich Closed ACV and ARR records for filtering.', fileType: 'CSV', lastImport: null, recordCount: null },
  // Legacy Templates (kept for backward compatibility)
  { id: 'cost_data', name: 'Cost Data', description: 'Cost line items with categories, vendors, and cost centers', fileType: 'CSV', lastImport: '2025-01-25T09:15:00Z', recordCount: 423 },
  { id: 'vendors', name: 'Vendors', description: 'Vendor master data with contacts, contracts, and spend info', fileType: 'CSV', lastImport: null, recordCount: null },
  { id: 'cost_centers', name: 'Cost Centers', description: 'Hierarchical cost center structure with budgets', fileType: 'CSV', lastImport: '2025-01-20T16:45:00Z', recordCount: 34 },
];

// CSV Template definitions with proper data structures for all reports
const templateCSVData: Record<string, { headers: string[]; sampleRows: string[][]; notes?: string }> = {
  // ============== SALES & PIPELINE TEMPLATES ==============
  'closed_acv': {
    headers: ['Closed_ACV_ID', 'Pipeline_Deal_ID', 'Deal_Name', 'Customer_Name', 'Close_Date', 'Logo_Type', 'Value_Type', 'Amount', 'License_ACV', 'Implementation_Value', 'Region', 'Vertical', 'Segment', 'Platform', 'Sales_Rep', 'SOW_ID', 'Notes'],
    sampleRows: [
      ['CACV-001', 'PD-101', 'Acme Corp Digital Transformation', 'Acme Corporation', '2024-01-15', 'New Logo', 'License', '450000', '450000', '0', 'North America', 'Life Sciences', 'Enterprise', 'Quantum', 'John Smith', 'SOW-001', 'New enterprise deal - License component'],
      ['CACV-001', 'PD-101', 'Acme Corp Digital Transformation', 'Acme Corporation', '2024-01-15', 'New Logo', 'Implementation', '150000', '0', '150000', 'North America', 'Life Sciences', 'Enterprise', 'Quantum', 'John Smith', 'SOW-001', 'New enterprise deal - Implementation component'],
      ['CACV-002', '', 'FinServ Direct Deal', 'FinServ Partners', '2024-03-22', 'New Logo', 'License', '520000', '520000', '0', 'APAC', 'BFSI', 'Enterprise', 'Opus', 'Wei Zhang', 'SOW-002', 'Direct deal - not from pipeline (NULL Pipeline Deal ID)'],
      ['CACV-003', 'PD-104', 'RetailMax Contract Extension', 'RetailMax Holdings', '2024-02-28', 'Extension', 'License', '200000', '0', '0', 'LATAM', 'CPG & Retail', 'Enterprise', 'Quantum', 'Ana Rodriguez', 'SOW-003', 'Extension - License EXCLUDED from ACV'],
      ['CACV-003', 'PD-104', 'RetailMax Contract Extension', 'RetailMax Holdings', '2024-02-28', 'Extension', 'Implementation', '50000', '0', '50000', 'LATAM', 'CPG & Retail', 'Enterprise', 'Quantum', 'Ana Rodriguez', 'SOW-003', 'Extension - Implementation COUNTS'],
    ],
    notes: 'Logo Types: New Logo, Upsell, Cross-Sell (License counts) | Extension, Renewal (License excluded, Implementation counts). SOW_ID links to ARR Sub-Category Breakdown for product-level splits.'
  },
  'monthly_pipeline_snapshot': {
    headers: ['Snapshot_Month', 'Pipeline_Deal_ID', 'Deal_Name', 'Customer_Name', 'Deal_Value', 'License_ACV', 'Implementation_Value', 'Logo_Type', 'Deal_Stage', 'Current_Stage', 'Probability', 'Expected_Close_Date', 'Region', 'Vertical', 'Segment', 'Product_Sub_Category'],
    sampleRows: [
      ['2024-01', 'PD-201', 'Acme Digital Platform', 'Acme Corporation', '500000', '400000', '100000', 'New Logo', 'Discovery', 'Discovery', '30%', '2024-06-30', 'North America', 'Life Sciences', 'Enterprise', 'Quantum Platform'],
      ['2024-02', 'PD-201', 'Acme Digital Platform', 'Acme Corporation', '550000', '440000', '110000', 'New Logo', 'Qualification', 'Qualification', '30%', '2024-06-30', 'North America', 'Life Sciences', 'Enterprise', 'Quantum Platform'],
      ['2024-03', 'PD-201', 'Acme Digital Platform', 'Acme Corporation', '600000', '450000', '150000', 'New Logo', 'Proposal', 'Proposal', '50%', '2024-06-30', 'North America', 'Life Sciences', 'Enterprise', 'Quantum Platform'],
      ['2024-04', 'PD-201', 'Acme Digital Platform', 'Acme Corporation', '600000', '450000', '150000', 'New Logo', 'Negotiation', 'Negotiation', '70%', '2024-06-30', 'North America', 'Life Sciences', 'Enterprise', 'Quantum Platform'],
      ['2024-05', 'PD-201', 'Acme Digital Platform', 'Acme Corporation', '600000', '450000', '150000', 'New Logo', 'Closed Won', 'Closed Won', '100%', '2024-05-15', 'North America', 'Life Sciences', 'Enterprise', 'Quantum Platform'],
    ],
    notes: 'Shows deal progression over 12 months. Latest month feeds Pipeline Report. NO Product Category field - only Sub-Category.'
  },
  'sales_team_structure': {
    headers: ['Sales_Rep_ID', 'Name', 'Email', 'Role', 'Region', 'Vertical_Focus', 'Segment', 'Manager_ID', 'Manager_Name', 'Annual_Quota', 'Q1_Quota', 'Q2_Quota', 'Q3_Quota', 'Q4_Quota', 'Hire_Date', 'Status'],
    sampleRows: [
      ['SR-001', 'John Smith', 'john.smith@company.com', 'VP Sales', 'Global', 'All', 'All', '', 'None', '25000000', '5500000', '6000000', '6500000', '7000000', '2018-03-15', 'Active'],
      ['SR-002', 'Sarah Johnson', 'sarah.johnson@company.com', 'Regional Director', 'North America', 'All', 'Enterprise', 'SR-001', 'John Smith', '8000000', '1800000', '1950000', '2100000', '2150000', '2019-06-01', 'Active'],
      ['SR-003', 'Mike Chen', 'mike.chen@company.com', 'Senior AE', 'North America', 'Life Sciences', 'Enterprise', 'SR-002', 'Sarah Johnson', '3500000', '800000', '850000', '900000', '950000', '2020-01-15', 'Active'],
    ],
    notes: 'Team hierarchy with quotas. Manager_ID links to parent Sales_Rep_ID.'
  },
  'prior_year_performance': {
    headers: ['Year', 'Sales_Rep_ID', 'Sales_Rep_Name', 'Region', 'Vertical', 'Segment', 'Annual_Quota', 'Q1_Closed', 'Q2_Closed', 'Q3_Closed', 'Q4_Closed', 'Total_Closed', 'Attainment_Pct', 'New_Logo_Count', 'Upsell_Count', 'Cross_Sell_Count', 'Renewal_Count', 'Extension_Count', 'Avg_Deal_Size', 'Win_Rate_Pct'],
    sampleRows: [
      ['2023', 'SR-002', 'Sarah Johnson', 'North America', 'All', 'Enterprise', '7200000', '1650000', '1780000', '1920000', '2100000', '7450000', '103.5', '4', '8', '3', '12', '2', '258621', '42'],
      ['2023', 'SR-003', 'Mike Chen', 'North America', 'Life Sciences', 'Enterprise', '3000000', '680000', '740000', '810000', '920000', '3150000', '105.0', '2', '5', '2', '6', '1', '225000', '38'],
      ['2022', 'SR-002', 'Sarah Johnson', 'North America', 'All', 'Enterprise', '6500000', '1420000', '1560000', '1680000', '1850000', '6510000', '100.2', '3', '7', '3', '10', '2', '232500', '40'],
    ],
    notes: 'Historical performance by rep. Used for forecasting and trend analysis.'
  },
  // ============== REVENUE & ARR TEMPLATES ==============
  'monthly_arr_snapshot': {
    headers: ['Snapshot_Month', 'SOW_ID', 'Customer_Name', 'Product_Sub_Category', 'Starting_ARR', 'New_ARR', 'Expansion_ARR', 'Contraction_ARR', 'Churn_ARR', 'Ending_ARR', 'Region', 'Vertical', 'Segment', 'Contract_Start_Date', 'Contract_End_Date', 'Renewal_Risk'],
    sampleRows: [
      ['2024-01', 'SOW-001', 'Acme Corporation', 'Quantum Platform', '0', '450000', '0', '0', '0', '450000', 'North America', 'Life Sciences', 'Enterprise', '2024-01-15', '2027-01-15', 'Low'],
      ['2024-02', 'SOW-001', 'Acme Corporation', 'Quantum Platform', '450000', '0', '0', '0', '0', '450000', 'North America', 'Life Sciences', 'Enterprise', '2024-01-15', '2027-01-15', 'Low'],
      ['2024-03', 'SOW-001', 'Acme Corporation', 'Quantum Platform', '450000', '0', '100000', '0', '0', '550000', 'North America', 'Life Sciences', 'Enterprise', '2024-01-15', '2027-01-15', 'Low'],
    ],
    notes: 'SOW/contract level ARR. Customer_Name links to Pipeline via customer_name_mapping. NO Product Category - only Sub-Category.'
  },
  'arr_subcategory_breakdown': {
    headers: ['SOW_ID', 'Customer_Name', 'Product_Sub_Category', '2024_Contribution_Pct', '2025_Contribution_Pct', '2026_Contribution_Pct', 'Notes'],
    sampleRows: [
      ['SOW-001', 'Acme Corporation', 'Quantum Platform', '100', '85', '70', 'Migrating some workloads to SMART Analytics'],
      ['SOW-001', 'Acme Corporation', 'SMART Analytics', '0', '15', '30', 'New analytics adoption starting 2025'],
      ['SOW-003', 'Global Pharma Inc', 'Cost Drivers Suite', '80', '70', '60', 'Gradual shift to multi-product'],
    ],
    notes: 'Annual contribution % by sub-category. Total per SOW per year must = 100%.'
  },
  // ============== MAPPING & REFERENCE TEMPLATES ==============
  'customer_name_mapping': {
    headers: ['ARR_Customer_Name', 'Pipeline_Customer_Name', 'Mapping_Type', 'Notes'],
    sampleRows: [
      ['International Business Machines Corporation', 'IBM', 'Legal to Common', 'Legal name to common abbreviation'],
      ['Johnson & Johnson', 'Johnson and Johnson', 'Punctuation', 'Ampersand vs spelled out'],
      ['Google LLC', 'Alphabet Inc', 'Subsidiary', 'Subsidiary to parent company'],
      ['Acme Corporation', 'Acme Corp', 'Abbreviation', 'Corporation to Corp'],
    ],
    notes: 'Maps ARR customer names to Pipeline names. Essential for linking ARR to Pipeline data.'
  },
  'product_category_mapping': {
    headers: ['Product_Sub_Category', 'Product_Category', 'Description', 'Status'],
    sampleRows: [
      ['Quantum Platform', 'Platform', 'Core enterprise platform for digital transformation', 'Active'],
      ['SMART Analytics', 'Analytics', 'Advanced analytics and business intelligence suite', 'Active'],
      ['Cost Drivers Suite', 'Cost Management', 'Cost optimization and spend analytics platform', 'Active'],
      ['Opus Enterprise', 'Enterprise Solutions', 'Full-stack enterprise solution with AI capabilities', 'Active'],
    ],
    notes: 'ONLY place Product Category is stored. All other templates use Sub-Category only.'
  },
  'pipeline_subcategory_breakdown': {
    headers: ['Snapshot_Month', 'Pipeline_Deal_ID', 'Product_Sub_Category', 'Contribution_Pct'],
    sampleRows: [
      ['2024-01', 'PD-201', 'Quantum Platform', '0.70'],
      ['2024-01', 'PD-201', 'SMART Analytics', '0.30'],
      ['2024-02', 'PD-201', 'Quantum Platform', '0.60'],
      ['2024-02', 'PD-201', 'SMART Analytics', '0.40'],
      ['2024-01', 'PD-202', 'Cost Drivers Suite', '1.00'],
    ],
    notes: 'Contribution_Pct is a decimal 0-1. Total per deal per month must equal 1.0. Maps pipeline deals to product sub-categories.'
  },
  'sow_mapping': {
    headers: ['SOW_ID', 'Vertical', 'Region', 'Fees_Type', 'Revenue_Type', 'Segment_Type', 'Start_Date'],
    sampleRows: [
      ['SOW-001', 'Life Sciences', 'North America', 'Fees', 'License', 'Enterprise', '2024-01-15'],
      ['SOW-002', 'BFSI', 'APAC', 'Fees', 'License', 'Enterprise', '2024-03-01'],
      ['SOW-003', 'CPG & Retail', 'Europe', 'Travel', 'Implementation', 'SMB', '2024-02-10'],
      ['SOW-004', 'Telecom/Media/Tech', 'LATAM', 'Fees', 'License', 'Enterprise', '2024-04-20'],
      ['SOW-005', 'Energy & Utilities', 'Middle East', 'Travel', 'Implementation', 'SMB', '2024-05-01'],
    ],
    notes: 'SOW-level metadata for enriching Closed ACV and ARR records. Used for filtering by Vertical, Region, Fees Type, Revenue Type, Segment Type.'
  },
  // ============== LEGACY TEMPLATES (kept for backward compatibility) ==============
  'cost_data': {
    headers: ['Date', 'Cost_Center_ID', 'Cost_Center_Name', 'Category', 'Sub_Category', 'Vendor', 'Amount', 'Budget', 'Variance', 'Region', 'Department'],
    sampleRows: [
      ['2025-01-15', 'CC-001', 'Engineering', 'Personnel', 'Salaries', 'Internal', '450000', '500000', '-50000', 'North America', 'R&D'],
      ['2025-01-15', 'CC-002', 'Infrastructure', 'Cloud', 'AWS', 'Amazon', '125000', '120000', '5000', 'Global', 'IT'],
      ['2025-01-15', 'CC-003', 'Marketing', 'Advertising', 'Digital', 'Google Ads', '85000', '90000', '-5000', 'North America', 'Marketing'],
    ]
  },
  'vendors': {
    headers: ['Vendor_ID', 'Vendor_Name', 'Category', 'Contact_Name', 'Contact_Email', 'Contract_Start', 'Contract_End', 'Annual_Spend', 'Payment_Terms', 'Status', 'Risk_Rating'],
    sampleRows: [
      ['VND-001', 'Amazon Web Services', 'Cloud Infrastructure', 'John AWS', 'support@aws.com', '2024-01-01', '2026-12-31', '1500000', 'Net 30', 'Active', 'Low'],
      ['VND-002', 'Salesforce', 'CRM', 'Jane SF', 'support@salesforce.com', '2024-06-01', '2025-05-31', '250000', 'Annual', 'Active', 'Low'],
      ['VND-003', 'Consulting Partners Inc', 'Professional Services', 'Mike Consult', 'mike@consultpartners.com', '2024-03-01', '2025-02-28', '500000', 'Net 45', 'Active', 'Medium'],
    ]
  },
  'cost_centers': {
    headers: ['Cost_Center_ID', 'Name', 'Parent_ID', 'Level', 'Manager', 'Annual_Budget', 'YTD_Actual', 'YTD_Variance', 'Department', 'Region', 'Status'],
    sampleRows: [
      ['CC-001', 'Engineering', '', '1', 'Sarah Johnson', '5000000', '4200000', '800000', 'R&D', 'Global', 'Active'],
      ['CC-001-A', 'Frontend Development', 'CC-001', '2', 'Tom Frontend', '1500000', '1350000', '150000', 'R&D', 'North America', 'Active'],
      ['CC-001-B', 'Backend Development', 'CC-001', '2', 'Lisa Backend', '2000000', '1800000', '200000', 'R&D', 'Global', 'Active'],
    ]
  }
};

const importHistory: ImportHistory[] = [
  { id: '1', templateName: 'Closed ACV', fileName: 'closed_acv_2024.csv', status: 'completed', recordsImported: 24, errors: 0, importedAt: '2025-01-30T14:30:00Z', importedBy: 'John Smith' },
  { id: '2', templateName: 'Monthly Pipeline Snapshots', fileName: 'pipeline_snapshots_2024.csv', status: 'completed', recordsImported: 65, errors: 0, importedAt: '2025-01-30T11:00:00Z', importedBy: 'John Smith' },
  { id: '3', templateName: 'Monthly ARR Snapshots', fileName: 'arr_snapshots_2024.csv', status: 'completed', recordsImported: 95, errors: 2, importedAt: '2025-01-28T14:30:00Z', importedBy: 'Jane Doe' },
  { id: '4', templateName: 'Customer Name Mapping', fileName: 'customer_mapping_v2.csv', status: 'completed', recordsImported: 30, errors: 0, importedAt: '2025-01-25T09:15:00Z', importedBy: 'Jane Doe' },
  { id: '5', templateName: 'Product Category Mapping', fileName: 'product_categories.csv', status: 'completed', recordsImported: 20, errors: 0, importedAt: '2025-01-25T09:15:00Z', importedBy: 'John Smith' },
  { id: '6', templateName: 'Sales Team Structure', fileName: 'sales_team_2025.csv', status: 'completed', recordsImported: 20, errors: 0, importedAt: '2025-01-25T09:15:00Z', importedBy: 'Mike Wilson' },
  { id: '7', templateName: 'Prior Year Performance', fileName: 'historical_performance_2022_2023.csv', status: 'completed', recordsImported: 21, errors: 0, importedAt: '2025-01-25T09:15:00Z', importedBy: 'Mike Wilson' },
  { id: '8', templateName: 'ARR Sub-Category Breakdown', fileName: 'arr_breakdown_2024_2026.csv', status: 'completed', recordsImported: 22, errors: 1, importedAt: '2025-01-28T14:30:00Z', importedBy: 'Jane Doe' },
  { id: '9', templateName: 'Cost Centers', fileName: 'cost_centers_v2.csv', status: 'failed', recordsImported: 0, errors: 12, importedAt: '2025-01-22T10:30:00Z', importedBy: 'Mike Wilson' },
  { id: '10', templateName: 'Cost Centers', fileName: 'cost_centers_fixed.csv', status: 'completed', recordsImported: 34, errors: 0, importedAt: '2025-01-20T16:45:00Z', importedBy: 'Mike Wilson' },
];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

interface Notification {
  id: string;
  type: string;
  description: string;
  enabled: boolean;
  channels: ('email' | 'slack' | 'in_app')[];
}

const mockUsers: User[] = [
  { id: '1', name: 'John Smith', email: 'john.smith@company.com', role: 'Administrator', status: 'active', lastLogin: '2024-01-31T10:30:00Z' },
  { id: '2', name: 'Jane Doe', email: 'jane.doe@company.com', role: 'FP&A Manager', status: 'active', lastLogin: '2024-01-31T09:15:00Z' },
  { id: '3', name: 'Mike Wilson', email: 'mike.wilson@company.com', role: 'Sales Manager', status: 'active', lastLogin: '2024-01-30T16:20:00Z' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Analyst', status: 'active', lastLogin: '2024-01-30T14:00:00Z' },
  { id: '5', name: 'Bob Williams', email: 'bob.williams@company.com', role: 'Analyst', status: 'inactive', lastLogin: '2024-01-15T11:30:00Z' },
  { id: '6', name: 'Emily Davis', email: 'emily.davis@company.com', role: 'Executive', status: 'pending', lastLogin: '' },
];

const mockNotifications: Notification[] = [
  { id: '1', type: 'Anomaly Alerts', description: 'Get notified when anomalies are detected in financial data', enabled: true, channels: ['email', 'slack', 'in_app'] },
  { id: '2', type: 'Deal Updates', description: 'Notifications for deal stage changes and updates', enabled: true, channels: ['in_app'] },
  { id: '3', type: 'Budget Alerts', description: 'Alerts when spending approaches or exceeds budget thresholds', enabled: true, channels: ['email', 'in_app'] },
  { id: '4', type: 'Approval Requests', description: 'Notifications for pending approvals requiring your action', enabled: true, channels: ['email', 'slack', 'in_app'] },
  { id: '5', type: 'Weekly Summary', description: 'Weekly digest of key financial metrics and insights', enabled: false, channels: ['email'] },
  { id: '6', type: 'AI Insights', description: 'AI-generated insights and recommendations', enabled: true, channels: ['in_app'] },
];

// Parse a CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'notifications' | 'security' | 'billing' | 'data-import'>('general');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'importing' | 'complete' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState<string>('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sowMappingStore = useSOWMappingStore();
  const pipelineSubCategoryStore = usePipelineSubCategoryStore();
  const arrSubCategoryStore = useARRSubCategoryStore();
  const productCategoryMappingStore = useProductCategoryMappingStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      setImportStatus('idle');
    }
  };

  const handleImport = async () => {
    if (!uploadingFile || !selectedTemplate) return;

    setImportStatus('validating');
    setImportMessage('');

    setValidationWarnings([]);

    if (selectedTemplate === 'pipeline_subcategory_breakdown') {
      try {
        const text = await uploadingFile.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));

        if (lines.length < 2) {
          setImportStatus('error');
          setImportMessage('File must contain a header row and at least one data row.');
          return;
        }

        const headers = parseCSVLine(lines[0]);
        const requiredColumns = ['Snapshot_Month', 'Pipeline_Deal_ID', 'Product_Sub_Category', 'Contribution_Pct'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          setImportStatus('error');
          setImportMessage(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        const colIndex: Record<string, number> = {};
        headers.forEach((h, i) => { colIndex[h] = i; });

        setImportStatus('importing');

        const records: PipelineSubCategoryRecord[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const fields = parseCSVLine(lines[i]);
          if (fields.length < requiredColumns.length) {
            errors.push(`Row ${i + 1}: insufficient columns`);
            continue;
          }

          const dealId = fields[colIndex['Pipeline_Deal_ID']];
          const month = fields[colIndex['Snapshot_Month']];
          const pct = parseFloat(fields[colIndex['Contribution_Pct']]);

          if (!dealId) { errors.push(`Row ${i + 1}: empty Pipeline_Deal_ID`); continue; }
          if (isNaN(pct) || pct < 0 || pct > 1) {
            errors.push(`Row ${i + 1}: Contribution_Pct must be between 0 and 1 (got ${fields[colIndex['Contribution_Pct']]})`);
            continue;
          }

          records.push({
            Snapshot_Month: month,
            Pipeline_Deal_ID: dealId,
            Product_Sub_Category: fields[colIndex['Product_Sub_Category']] || '',
            Contribution_Pct: pct,
          });
        }

        // Validate sums per deal/month
        const sumMap = new Map<string, number>();
        records.forEach(r => {
          const key = `${r.Pipeline_Deal_ID}|${r.Snapshot_Month}`;
          sumMap.set(key, (sumMap.get(key) || 0) + r.Contribution_Pct);
        });
        sumMap.forEach((sum, key) => {
          if (Math.abs(sum - 1.0) > 0.01) {
            warnings.push(`Deal/Month ${key}: contributions sum to ${sum.toFixed(3)} (expected 1.0)`);
          }
        });

        pipelineSubCategoryStore.setRecords(records, warnings);
        setValidationWarnings(warnings);

        setImportStatus('complete');
        setImportMessage(`Successfully imported ${records.length} pipeline sub-category records.${errors.length > 0 ? ` ${errors.length} rows skipped.` : ''}`);

        setTimeout(() => {
          setUploadingFile(null);
          setSelectedTemplate(null);
          setImportStatus('idle');
          setImportMessage('');
          setValidationWarnings([]);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 5000);
      } catch {
        setImportStatus('error');
        setImportMessage('Failed to parse the CSV file. Please check the format and try again.');
      }
    } else if (selectedTemplate === 'arr_subcategory_breakdown') {
      try {
        const text = await uploadingFile.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));

        if (lines.length < 2) {
          setImportStatus('error');
          setImportMessage('File must contain a header row and at least one data row.');
          return;
        }

        const headers = parseCSVLine(lines[0]);
        const requiredColumns = ['SOW_ID', 'Customer_Name', 'Product_Sub_Category'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          setImportStatus('error');
          setImportMessage(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        const colIndex: Record<string, number> = {};
        headers.forEach((h, i) => { colIndex[h] = i; });

        // Find year contribution columns (e.g., 2024_Contribution_Pct, 2025_Contribution_Pct)
        const yearColumns = headers.filter(h => /^\d{4}_Contribution_Pct$/.test(h));

        setImportStatus('importing');

        const records: ARRSubCategoryRecord[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const fields = parseCSVLine(lines[i]);
          if (fields.length < requiredColumns.length) {
            errors.push(`Row ${i + 1}: insufficient columns`);
            continue;
          }

          const sowId = fields[colIndex['SOW_ID']];
          if (!sowId) { errors.push(`Row ${i + 1}: empty SOW_ID`); continue; }

          const contributions: Record<string, number> = {};
          yearColumns.forEach(col => {
            const year = col.split('_')[0];
            const val = parseFloat(fields[colIndex[col]] || '0');
            if (!isNaN(val)) contributions[year] = val;
          });

          records.push({
            SOW_ID: sowId,
            Customer_Name: fields[colIndex['Customer_Name']] || '',
            Product_Sub_Category: fields[colIndex['Product_Sub_Category']] || '',
            contributions,
          });
        }

        // Validate sums per SOW/year = 100
        const sumMap = new Map<string, number>();
        records.forEach(r => {
          Object.entries(r.contributions).forEach(([year, pct]) => {
            const key = `${r.SOW_ID}|${year}`;
            sumMap.set(key, (sumMap.get(key) || 0) + pct);
          });
        });
        sumMap.forEach((sum, key) => {
          if (Math.abs(sum - 100) > 1) {
            warnings.push(`SOW/Year ${key}: contributions sum to ${sum.toFixed(1)}% (expected 100%)`);
          }
        });

        arrSubCategoryStore.setRecords(records, warnings);
        setValidationWarnings(warnings);

        setImportStatus('complete');
        setImportMessage(`Successfully imported ${records.length} ARR sub-category records.${errors.length > 0 ? ` ${errors.length} rows skipped.` : ''}`);

        setTimeout(() => {
          setUploadingFile(null);
          setSelectedTemplate(null);
          setImportStatus('idle');
          setImportMessage('');
          setValidationWarnings([]);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 5000);
      } catch {
        setImportStatus('error');
        setImportMessage('Failed to parse the CSV file. Please check the format and try again.');
      }
    } else if (selectedTemplate === 'product_category_mapping') {
      try {
        const text = await uploadingFile.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));

        if (lines.length < 2) {
          setImportStatus('error');
          setImportMessage('File must contain a header row and at least one data row.');
          return;
        }

        const headers = parseCSVLine(lines[0]);
        const requiredColumns = ['Product_Sub_Category', 'Product_Category'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          setImportStatus('error');
          setImportMessage(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        const colIndex: Record<string, number> = {};
        headers.forEach((h, i) => { colIndex[h] = i; });

        setImportStatus('importing');

        const records: ProductCategoryMappingRecord[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const fields = parseCSVLine(lines[i]);
          if (fields.length < requiredColumns.length) {
            errors.push(`Row ${i + 1}: insufficient columns`);
            continue;
          }

          const subCategory = fields[colIndex['Product_Sub_Category']];
          if (!subCategory) { errors.push(`Row ${i + 1}: empty Product_Sub_Category`); continue; }

          records.push({
            Product_Sub_Category: subCategory,
            Product_Category: fields[colIndex['Product_Category']] || '',
            Description: fields[colIndex['Description']] || '',
            Status: fields[colIndex['Status']] || 'Active',
          });
        }

        productCategoryMappingStore.setRecords(records);

        setImportStatus('complete');
        setImportMessage(`Successfully imported ${records.length} product category mapping records.${errors.length > 0 ? ` ${errors.length} rows skipped.` : ''}`);

        setTimeout(() => {
          setUploadingFile(null);
          setSelectedTemplate(null);
          setImportStatus('idle');
          setImportMessage('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 4000);
      } catch {
        setImportStatus('error');
        setImportMessage('Failed to parse the CSV file. Please check the format and try again.');
      }
    } else if (selectedTemplate === 'sow_mapping') {
      // Actually parse the CSV for SOW Mapping
      try {
        const text = await uploadingFile.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#'));

        if (lines.length < 2) {
          setImportStatus('error');
          setImportMessage('File must contain a header row and at least one data row.');
          return;
        }

        const headers = parseCSVLine(lines[0]);
        const requiredColumns = ['SOW_ID', 'Vertical', 'Region', 'Fees_Type', 'Revenue_Type', 'Segment_Type', 'Start_Date'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));

        if (missingColumns.length > 0) {
          setImportStatus('error');
          setImportMessage(`Missing required columns: ${missingColumns.join(', ')}`);
          return;
        }

        const colIndex: Record<string, number> = {};
        headers.forEach((h, i) => { colIndex[h] = i; });

        setImportStatus('importing');

        const records: SOWMappingRecord[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const fields = parseCSVLine(lines[i]);
          if (fields.length < requiredColumns.length) {
            errors.push(`Row ${i + 1}: insufficient columns (${fields.length} found, ${requiredColumns.length} expected)`);
            continue;
          }

          const sowId = fields[colIndex['SOW_ID']];
          if (!sowId) {
            errors.push(`Row ${i + 1}: empty SOW_ID`);
            continue;
          }

          records.push({
            SOW_ID: sowId,
            Vertical: fields[colIndex['Vertical']] || '',
            Region: fields[colIndex['Region']] || '',
            Fees_Type: fields[colIndex['Fees_Type']] || '',
            Revenue_Type: fields[colIndex['Revenue_Type']] || '',
            Segment_Type: fields[colIndex['Segment_Type']] || '',
            Start_Date: fields[colIndex['Start_Date']] || '',
          });
        }

        sowMappingStore.setMappings(records);

        setImportStatus('complete');
        setImportMessage(`Successfully imported ${records.length} SOW mapping records.${errors.length > 0 ? ` ${errors.length} rows skipped.` : ''}`);

        setTimeout(() => {
          setUploadingFile(null);
          setSelectedTemplate(null);
          setImportStatus('idle');
          setImportMessage('');
          if (fileInputRef.current) fileInputRef.current.value = '';
        }, 4000);
      } catch {
        setImportStatus('error');
        setImportMessage('Failed to parse the CSV file. Please check the format and try again.');
      }
    } else {
      // Simulate validation for other templates
      await new Promise(resolve => setTimeout(resolve, 1500));
      setImportStatus('importing');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setImportStatus('complete');
      setTimeout(() => {
        setUploadingFile(null);
        setSelectedTemplate(null);
        setImportStatus('idle');
        setImportMessage('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);
    }
  };

  const downloadTemplate = (templateId: string) => {
    const templateData = templateCSVData[templateId];
    if (!templateData) {
      alert('Template not found');
      return;
    }

    // Generate CSV content with headers, notes (as comment), and sample rows
    const csvLines: string[] = [];

    // Add notes as a comment at the top if available
    if (templateData.notes) {
      csvLines.push(`# NOTES: ${templateData.notes}`);
      csvLines.push('# Delete this line and the notes line before importing');
    }

    // Add headers
    csvLines.push(templateData.headers.join(','));

    // Add sample rows
    templateData.sampleRows.forEach(row => {
      // Escape fields that contain commas by wrapping in quotes
      const escapedRow = row.map(field =>
        field.includes(',') || field.includes('"') ? `"${field.replace(/"/g, '""')}"` : field
      );
      csvLines.push(escapedRow.join(','));
    });

    const csvContent = csvLines.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templateId}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-secondary-100 text-secondary-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles];
  };

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n)
    );
  };

  const toggleChannel = (notificationId: string, channel: 'email' | 'slack' | 'in_app') => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === notificationId) {
          const channels = n.channels.includes(channel)
            ? n.channels.filter(c => c !== channel)
            : [...n.channels, channel];
          return { ...n, channels };
        }
        return n;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-500">Manage your account and application settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'General', icon: '⚙️' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'data-import', label: 'Data Import', icon: '📥' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'billing', label: 'Billing', icon: '💳' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Organization Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Organization Name</label>
                    <input
                      type="text"
                      defaultValue="Acme Corporation"
                      className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Fiscal Year Start</label>
                      <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option>January</option>
                        <option>April</option>
                        <option>July</option>
                        <option>October</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Default Currency</label>
                      <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option>USD - US Dollar</option>
                        <option>EUR - Euro</option>
                        <option>GBP - British Pound</option>
                        <option>JPY - Japanese Yen</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Timezone</label>
                    <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>America/New_York (EST)</option>
                      <option>America/Los_Angeles (PST)</option>
                      <option>Europe/London (GMT)</option>
                      <option>Asia/Tokyo (JST)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Display Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900">Dark Mode</p>
                      <p className="text-sm text-secondary-500">Use dark theme for the interface</p>
                    </div>
                    <button className="w-12 h-6 bg-secondary-200 rounded-full relative">
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900">Compact View</p>
                      <p className="text-sm text-secondary-500">Show more data in less space</p>
                    </div>
                    <button className="w-12 h-6 bg-primary-500 rounded-full relative">
                      <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Number Format</label>
                    <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>1,234.56 (US)</option>
                      <option>1.234,56 (EU)</option>
                      <option>1 234.56 (Space)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900">User Management</h2>
                  <p className="text-sm text-secondary-500">{mockUsers.length} users in your organization</p>
                </div>
                <button className="btn-primary">+ Invite User</button>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-secondary-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-700">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-900">{user.name}</p>
                              <p className="text-sm text-secondary-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-secondary-600">{user.role}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-secondary-600">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
                            <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">Notification Preferences</h2>
                <p className="text-sm text-secondary-500">Manage how and when you receive notifications</p>
              </div>

              <div className="card divide-y divide-secondary-100">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-secondary-900">{notification.type}</h3>
                          <button
                            onClick={() => toggleNotification(notification.id)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${
                              notification.enabled ? 'bg-primary-500' : 'bg-secondary-200'
                            }`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                              notification.enabled ? 'right-0.5' : 'left-0.5'
                            }`}></span>
                          </button>
                        </div>
                        <p className="text-sm text-secondary-500 mt-1">{notification.description}</p>

                        {notification.enabled && (
                          <div className="flex gap-3 mt-3">
                            {(['email', 'slack', 'in_app'] as const).map((channel) => (
                              <button
                                key={channel}
                                onClick={() => toggleChannel(notification.id, channel)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  notification.channels.includes(channel)
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-secondary-100 text-secondary-500'
                                }`}
                              >
                                {channel === 'in_app' ? 'In-App' : channel.charAt(0).toUpperCase() + channel.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button className="btn-primary">Save Preferences</button>
              </div>
            </div>
          )}

          {activeTab === 'data-import' && (
            <div className="space-y-6">
              {/* Import Section */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Import Data</h2>
                <p className="text-sm text-secondary-500 mb-6">
                  Upload CSV files to import historical data into Aether. Select a template type and upload your file.
                </p>

                {/* Template Selection - Grouped by Category */}
                <div className="mb-6 space-y-6">
                  {/* Sales & Pipeline Templates */}
                  <div>
                    <label className="block text-sm font-semibold text-secondary-800 mb-2">📊 Sales & Pipeline</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {importTemplates.filter(t => ['closed_acv', 'monthly_pipeline_snapshot', 'sales_team_structure', 'prior_year_performance', 'pipeline_subcategory_breakdown'].includes(t.id)).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedTemplate === template.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-secondary-200 hover:border-secondary-300'
                          }`}
                        >
                          <p className="font-medium text-secondary-900 text-sm">{template.name}</p>
                          <p className="text-xs text-secondary-500 mt-1 line-clamp-2">{template.description}</p>
                          {template.lastImport && (
                            <p className="text-xs text-primary-600 mt-2">
                              Last: {new Date(template.lastImport).toLocaleDateString()}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Revenue & ARR Templates */}
                  <div>
                    <label className="block text-sm font-semibold text-secondary-800 mb-2">💰 Revenue & ARR</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {importTemplates.filter(t => ['monthly_arr_snapshot', 'arr_subcategory_breakdown'].includes(t.id)).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedTemplate === template.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-secondary-200 hover:border-secondary-300'
                          }`}
                        >
                          <p className="font-medium text-secondary-900 text-sm">{template.name}</p>
                          <p className="text-xs text-secondary-500 mt-1 line-clamp-2">{template.description}</p>
                          {template.lastImport && (
                            <p className="text-xs text-primary-600 mt-2">
                              Last: {new Date(template.lastImport).toLocaleDateString()}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mapping & Reference Templates */}
                  <div>
                    <label className="block text-sm font-semibold text-secondary-800 mb-2">🔗 Mapping & Reference</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {importTemplates.filter(t => ['customer_name_mapping', 'product_category_mapping', 'sow_mapping'].includes(t.id)).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedTemplate === template.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-secondary-200 hover:border-secondary-300'
                          }`}
                        >
                          <p className="font-medium text-secondary-900 text-sm">{template.name}</p>
                          <p className="text-xs text-secondary-500 mt-1 line-clamp-2">{template.description}</p>
                          {template.lastImport && (
                            <p className="text-xs text-primary-600 mt-2">
                              Last: {new Date(template.lastImport).toLocaleDateString()}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cost & Operations Templates */}
                  <div>
                    <label className="block text-sm font-semibold text-secondary-800 mb-2">🏢 Cost & Operations</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {importTemplates.filter(t => ['cost_data', 'vendors', 'cost_centers'].includes(t.id)).map((template) => (
                        <button
                          key={template.id}
                          onClick={() => setSelectedTemplate(template.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedTemplate === template.id
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-secondary-200 hover:border-secondary-300'
                          }`}
                        >
                          <p className="font-medium text-secondary-900 text-sm">{template.name}</p>
                          <p className="text-xs text-secondary-500 mt-1 line-clamp-2">{template.description}</p>
                          {template.lastImport && (
                            <p className="text-xs text-primary-600 mt-2">
                              Last: {new Date(template.lastImport).toLocaleDateString()}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                {selectedTemplate && (
                  <div className="border-2 border-dashed border-secondary-200 rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={['sow_mapping', 'pipeline_subcategory_breakdown', 'arr_subcategory_breakdown', 'product_category_mapping'].includes(selectedTemplate) ? '.csv,.xlsx' : '.csv'}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    {!uploadingFile ? (
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-4xl mb-3">📄</div>
                        <p className="text-secondary-900 font-medium">Drop your CSV file here or click to browse</p>
                        <p className="text-sm text-secondary-500 mt-1">
                          Maximum file size: 50MB
                        </p>
                        <button
                          onClick={() => downloadTemplate(selectedTemplate)}
                          className="mt-4 text-sm text-primary-600 hover:text-primary-700 underline"
                        >
                          Download template for {importTemplates.find(t => t.id === selectedTemplate)?.name}
                        </button>
                      </label>
                    ) : (
                      <div>
                        <div className="text-4xl mb-3">
                          {importStatus === 'complete' ? '✅' : importStatus === 'error' ? '❌' : '📄'}
                        </div>
                        <p className="text-secondary-900 font-medium">{uploadingFile.name}</p>
                        <p className="text-sm text-secondary-500">
                          {(uploadingFile.size / 1024).toFixed(1)} KB
                        </p>

                        {importStatus === 'idle' && (
                          <div className="mt-4 flex justify-center gap-3">
                            <button
                              onClick={() => {
                                setUploadingFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="px-4 py-2 border border-secondary-200 text-secondary-600 rounded-lg text-sm font-medium hover:bg-secondary-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleImport}
                              className="btn-primary"
                            >
                              Start Import
                            </button>
                          </div>
                        )}

                        {importStatus === 'validating' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-2 text-primary-600">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Validating file...</span>
                            </div>
                          </div>
                        )}

                        {importStatus === 'importing' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-2 text-primary-600">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Importing data...</span>
                            </div>
                            <div className="mt-3 h-2 bg-secondary-100 rounded-full overflow-hidden max-w-xs mx-auto">
                              <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                          </div>
                        )}

                        {importStatus === 'complete' && (
                          <div className="mt-4 text-green-600">
                            <p className="font-medium">{importMessage || 'Import completed successfully!'}</p>
                          </div>
                        )}

                        {importStatus === 'complete' && validationWarnings.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left max-w-lg mx-auto">
                            <p className="text-sm font-medium text-yellow-800 mb-1">Validation Warnings ({validationWarnings.length})</p>
                            <ul className="text-xs text-yellow-700 space-y-0.5 max-h-32 overflow-y-auto">
                              {validationWarnings.slice(0, 10).map((w, i) => (
                                <li key={i}>{w}</li>
                              ))}
                              {validationWarnings.length > 10 && (
                                <li className="italic">...and {validationWarnings.length - 10} more</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {importStatus === 'error' && (
                          <div className="mt-4 text-red-600">
                            <p className="font-medium">{importMessage || 'Import failed. Please check your file and try again.'}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Import History */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Import History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Data Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">File Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Records</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Errors</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Imported</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {importHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 text-sm font-medium text-secondary-900">{item.templateName}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{item.fileName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'completed' ? 'bg-green-100 text-green-800' :
                              item.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{item.recordsImported.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">
                            {item.errors > 0 ? (
                              <span className="text-red-600">{item.errors}</span>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">
                            {new Date(item.importedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{item.importedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template Download Section */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Download Templates</h2>
                <p className="text-sm text-secondary-500 mb-4">
                  Download CSV templates with the correct format and sample data for each data type.
                </p>

                {/* Quick Download Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                  {importTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => downloadTemplate(template.id)}
                      className="flex items-center gap-2 p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 hover:border-primary-300 transition-colors"
                    >
                      <span className="text-lg">📥</span>
                      <span className="text-xs font-medium text-secondary-700 truncate">{template.name}</span>
                    </button>
                  ))}
                </div>

                {/* Template Field Reference */}
                <div className="border-t border-secondary-200 pt-4">
                  <h3 className="text-sm font-semibold text-secondary-800 mb-3">📋 Key Template Notes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-secondary-600">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="font-semibold text-blue-800 mb-1">Closed ACV Calculation Rules</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>License counts</strong>: New Logo, Upsell, Cross-Sell</li>
                        <li><strong>License excluded</strong>: Extension, Renewal</li>
                        <li><strong>Implementation</strong>: Always counts for ALL logo types</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="font-semibold text-green-800 mb-1">Product Category Rules</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Only <strong>Product Sub-Category</strong> in Pipeline & ARR templates</li>
                        <li><strong>product_category_mapping</strong> is the ONLY place Category is stored</li>
                        <li>Sub-Categories: Quantum Platform, SMART Analytics, Cost Drivers Suite, Opus Enterprise</li>
                      </ul>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="font-semibold text-yellow-800 mb-1">Customer Name Mapping</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Links ARR customer names to Pipeline names</li>
                        <li>Handles legal vs common names (e.g., IBM vs International Business Machines)</li>
                        <li>Essential for joining ARR and Pipeline data</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="font-semibold text-purple-800 mb-1">Standard Filter Values</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Regions</strong>: North America, Europe, LATAM, Middle East, APAC</li>
                        <li><strong>Segments</strong>: Enterprise, SMB</li>
                        <li><strong>Logo Types</strong>: New Logo, Upsell, Cross-Sell, Extension, Renewal</li>
                      </ul>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="font-semibold text-orange-800 mb-1">SOW Mapping</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Enriches Closed ACV and ARR records with SOW-level metadata</li>
                        <li><strong>Fees_Type</strong>: Fees, Travel (used for Revenue Type filter)</li>
                        <li><strong>Revenue_Type</strong>: License, Implementation</li>
                        <li>Upload updates Sales and Revenue pages automatically</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Authentication</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">Two-Factor Authentication</p>
                      <p className="text-sm text-secondary-500">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      Enabled
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">Single Sign-On (SSO)</p>
                      <p className="text-sm text-secondary-500">Configure SAML or OIDC for enterprise login</p>
                    </div>
                    <button className="px-4 py-2 border border-secondary-200 text-secondary-600 rounded-lg text-sm font-medium hover:bg-secondary-100">
                      Configure
                    </button>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Session Management</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Session Timeout</label>
                    <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                      <option>8 hours</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900">Active Sessions</p>
                      <p className="text-sm text-secondary-500">You have 2 active sessions</p>
                    </div>
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                      Revoke All Sessions
                    </button>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Password Policy</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary-600">Minimum 12 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary-600">Require uppercase and lowercase letters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary-600">Require at least one number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary-600">Require special characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-secondary-900">Current Plan</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                    Enterprise
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-secondary-500">Monthly Cost</p>
                    <p className="text-2xl font-bold text-secondary-900">$2,499</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Users</p>
                    <p className="text-2xl font-bold text-secondary-900">42 / 50</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Next Billing</p>
                    <p className="text-2xl font-bold text-secondary-900">Feb 15</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Usage This Month</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-secondary-600">API Calls</span>
                      <span className="font-medium">124,500 / 500,000</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-secondary-600">AI Queries</span>
                      <span className="font-medium">8,234 / 10,000</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-secondary-600">Data Storage</span>
                      <span className="font-medium">45 GB / 100 GB</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Payment Method</h2>
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">•••• •••• •••• 4242</p>
                      <p className="text-sm text-secondary-500">Expires 12/2025</p>
                    </div>
                  </div>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Update
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Billing History</h2>
                <div className="space-y-2">
                  {[
                    { date: 'Jan 15, 2024', amount: '$2,499.00', status: 'Paid' },
                    { date: 'Dec 15, 2023', amount: '$2,499.00', status: 'Paid' },
                    { date: 'Nov 15, 2023', amount: '$2,499.00', status: 'Paid' },
                  ].map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-4">
                        <span className="text-secondary-600">{invoice.date}</span>
                        <span className="font-medium text-secondary-900">{invoice.amount}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {invoice.status}
                        </span>
                      </div>
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
