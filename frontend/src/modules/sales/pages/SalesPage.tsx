import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { useSOWMappingStore } from '@shared/store/sowMappingStore';
import { usePipelineSubCategoryStore } from '@shared/store/pipelineSubCategoryStore';
import { useARRSubCategoryStore } from '@shared/store/arrSubCategoryStore';
import { useProductCategoryMappingStore } from '@shared/store/productCategoryMappingStore';
import { useRealDataStore, normalizeRegion, type RealDataState } from '@shared/store/realDataStore';

// ==================== TYPE DEFINITIONS ====================
interface Opportunity {
  id: string;
  name: string;
  accountName: string;
  region: string;
  vertical: string;
  segment: 'Enterprise' | 'SMB';
  channel: string;
  stage: string;
  probability: number;
  dealValue: number;
  licenseValue: number;         // License component of deal
  implementationValue: number;  // Implementation component of deal
  weightedValue: number;
  expectedCloseDate: string;
  daysInStage: number;
  owner: string;
  status: 'Active' | 'Won' | 'Lost' | 'Stalled';
  lossReason?: string;
  logoType: 'New Logo' | 'Upsell' | 'Cross-Sell' | 'Extension' | 'Renewal';
  salesCycleDays: number;
  createdDate: string;
  previousValue?: number;
  movementReason?: string;
  // Calculated Closed ACV (License only for New Logo/Upsell/Cross-Sell + Implementation always)
  closedACV?: number;
  // Sold By classification (Change 9)
  soldBy: 'Sales' | 'GD' | 'TSO';
  // SOW ID for sub-category breakdown (Change 1)
  sowId?: string;
  // Product breakdown fields (Change 2/3)
  productSubCategory?: string;
  productCategory?: string;
  subCategoryBreakdown?: { subCategory: string; pct: number }[];
  pipelineSubCategoryBreakdown?: { subCategory: string; pct: number }[];
  // Revenue Type from SOW Mapping (License, Implementation, Services)
  revenueType?: string;
}

interface Salesperson {
  id: string;
  name: string;
  region: string;
  isManager: boolean;
  managerId?: string;
  annualTarget: number;
  closedYTD: number;
  forecast: number;
  pipelineValue: number;
  monthlyAttainment: number[];
}

interface QuarterlyForecast {
  quarter: string;
  forecast: number;
  actual: number;
  target: number;
}

interface RegionalForecast {
  region: string;
  forecast: number;
  target: number;
  closedACV: number;
  variance: number;
  percentToTarget: number;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

// ==================== SAMPLE DATA GENERATION ====================
// Standard filter options as per requirements document
const REGIONS = ['North America', 'Europe', 'LATAM', 'Middle East', 'APAC'];
const VERTICALS = [
  'Life Sciences',
  'Other Services',
  'CPG & Retail',
  'Chemicals/Oil/Gas/Resources',
  'Automotive and Industrial',
  'BFSI',
  'Telecom/Media/Tech',
  'Public Sector',
  'Energy & Utilities',
  'Private Equity',
  'Unilever',
];
const SEGMENTS = ['Enterprise', 'SMB'];
const CHANNELS = ['Direct', 'Partner', 'Reseller', 'Organic', 'Referral'];

// Logo Types - Extension and Renewal are interchangeable
const LOGO_TYPES = ['New Logo', 'Upsell', 'Cross-Sell', 'Extension', 'Renewal'];
// Logo types that count toward License ACV (excludes Extension/Renewal)
const LICENSE_ACV_LOGO_TYPES = ['New Logo', 'Upsell', 'Cross-Sell'];
const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const LOSS_REASONS = ['Budget Constraints', 'Competitor Selected', 'Project Cancelled', 'Timeline Delayed', 'Price Sensitivity', 'No Decision'];
const MOVEMENT_REASONS = ['Expanded Scope', 'Reduced Scope', 'Lost to Competitor', 'Budget Cuts', 'Timeline Change', 'New Opportunity'];

// Sold By classification (Change 9)
const SOLD_BY_OPTIONS = ['Sales', 'GD', 'TSO'] as const;

// Revenue Type options (from SOW Mapping Revenue_Type)
const REVENUE_TYPE_OPTIONS = ['License', 'Implementation', 'Services'] as const;

// Product Sub-Categories for breakdown (Change 1, 2)
const SALESPERSON_NAMES = [
  'Sarah Johnson', 'Mike Wilson', 'Emily Davis', 'John Smith', 'Lisa Chen',
  'David Brown', 'Jennifer Lee', 'Robert Taylor', 'Amanda White', 'Chris Martin',
  'Michelle Garcia', 'Kevin Anderson'
];

// Get current date info for mock data
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-indexed

// Generate 40+ opportunities with current data
const generateOpportunities = (): Opportunity[] => {
  const opportunities: Opportunity[] = [];

  for (let i = 1; i <= 50; i++) {
    const stageIndex = Math.floor(Math.random() * STAGES.length);
    const stage = STAGES[stageIndex];
    const isWon = stage === 'Closed Won';
    const isLost = stage === 'Closed Lost';
    const dealValue = Math.floor(Math.random() * 950000) + 50000; // $50K - $1M
    const probability = isWon ? 100 : isLost ? 0 : [10, 25, 50, 75][Math.min(stageIndex, 3)];

    // Split deal value into license and implementation components
    const licenseRatio = 0.6 + Math.random() * 0.3; // 60-90% license
    const licenseValue = Math.round(dealValue * licenseRatio);
    const implementationValue = dealValue - licenseValue;

    // Logo type distribution
    const logoType = LOGO_TYPES[Math.floor(Math.random() * LOGO_TYPES.length)] as Opportunity['logoType'];

    // Segment
    const segment = SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)] as 'Enterprise' | 'SMB';

    // For won deals, close date should be in past (before current month)
    // For active deals, close date should be current month onwards
    let closeDate: Date;
    if (isWon || isLost) {
      // Past months (actuals)
      const pastMonth = Math.floor(Math.random() * currentMonth);
      closeDate = new Date(currentYear, pastMonth, Math.floor(Math.random() * 28) + 1);
    } else {
      // Current month onwards (forecast)
      const futureMonth = currentMonth + Math.floor(Math.random() * (12 - currentMonth));
      closeDate = new Date(currentYear, futureMonth, Math.floor(Math.random() * 28) + 1);
    }

    const createdDate = new Date(closeDate);
    createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 180) - 30);

    const previousValue = Math.random() > 0.5 ? dealValue * (0.7 + Math.random() * 0.6) : undefined;

    // Calculate Closed ACV based on Logo Type rules:
    // - License: only count if Logo Type in (New Logo, Upsell, Cross-Sell)
    // - Implementation: always count regardless of Logo Type
    const licenseCountsTowardACV = LICENSE_ACV_LOGO_TYPES.includes(logoType);
    const closedACV = (licenseCountsTowardACV ? licenseValue : 0) + implementationValue;

    // Sold By distribution - Sales 60%, GD 25%, TSO 15%
    const soldByRand = Math.random();
    const soldBy: 'Sales' | 'GD' | 'TSO' = soldByRand < 0.6 ? 'Sales' : soldByRand < 0.85 ? 'GD' : 'TSO';

    opportunities.push({
      id: `OPP-${String(i).padStart(4, '0')}`,
      name: `${['Enterprise', 'Platform', 'Cloud', 'Analytics', 'Integration'][Math.floor(Math.random() * 5)]} Deal ${i}`,
      accountName: `${['Acme', 'Global', 'Tech', 'Prime', 'Alpha'][Math.floor(Math.random() * 5)]} ${['Corp', 'Inc', 'Solutions', 'Industries', 'Group'][Math.floor(Math.random() * 5)]}`,
      region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      vertical: VERTICALS[Math.floor(Math.random() * VERTICALS.length)],
      segment,
      channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
      stage,
      probability,
      dealValue,
      licenseValue,
      implementationValue,
      weightedValue: Math.round(dealValue * (probability / 100)),
      expectedCloseDate: closeDate.toISOString().split('T')[0],
      daysInStage: Math.floor(Math.random() * 120) + 5,
      owner: SALESPERSON_NAMES[Math.floor(Math.random() * SALESPERSON_NAMES.length)],
      status: isWon ? 'Won' : isLost ? 'Lost' : Math.random() > 0.9 ? 'Stalled' : 'Active',
      lossReason: isLost ? LOSS_REASONS[Math.floor(Math.random() * LOSS_REASONS.length)] : undefined,
      logoType,
      salesCycleDays: Math.floor(Math.random() * 120) + 30,
      createdDate: createdDate.toISOString().split('T')[0],
      previousValue: previousValue ? Math.round(previousValue) : undefined,
      movementReason: previousValue ? MOVEMENT_REASONS[Math.floor(Math.random() * MOVEMENT_REASONS.length)] : undefined,
      closedACV: isWon ? closedACV : undefined,
      soldBy,
      // SOW ID (Change 1) - only for won deals
      sowId: isWon ? `SOW-${String(Math.floor(Math.random() * 100) + 1).padStart(5, '0')}` : undefined,
      revenueType: ['License', 'Implementation', 'Services'][Math.floor(Math.random() * 3)],
    });
  }
  return opportunities;
};

// Generate salespeople with managers
const generateSalespeople = (): Salesperson[] => {
  const salespeople: Salesperson[] = [];

  // Add managers first
  const managers = [
    { name: 'Sarah Johnson', region: 'North America' },
    { name: 'David Brown', region: 'Europe' },
  ];

  managers.forEach((mgr, idx) => {
    salespeople.push({
      id: `SP-${String(idx + 1).padStart(3, '0')}`,
      name: mgr.name,
      region: mgr.region,
      isManager: true,
      annualTarget: 5000000,
      closedYTD: Math.floor(Math.random() * 2000000) + 1500000,
      forecast: Math.floor(Math.random() * 1500000) + 1000000,
      pipelineValue: Math.floor(Math.random() * 3000000) + 2000000,
      monthlyAttainment: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50) + 50),
    });
  });

  // Add individual contributors
  const icNames = SALESPERSON_NAMES.filter(n => !managers.find(m => m.name === n));
  icNames.forEach((name, idx) => {
    const region = REGIONS[idx % REGIONS.length];
    const managerId = managers.find(m => m.region === region)?.name ? `SP-001` : `SP-002`;

    salespeople.push({
      id: `SP-${String(idx + 3).padStart(3, '0')}`,
      name,
      region,
      isManager: false,
      managerId,
      annualTarget: 2000000,
      closedYTD: Math.floor(Math.random() * 1200000) + 300000,
      forecast: Math.floor(Math.random() * 800000) + 200000,
      pipelineValue: Math.floor(Math.random() * 1500000) + 500000,
      monthlyAttainment: Array.from({ length: 12 }, () => Math.floor(Math.random() * 60) + 40),
    });
  });

  return salespeople;
};

const MOCK_OPPORTUNITIES = generateOpportunities();
const MOCK_SALESPEOPLE = generateSalespeople();

// Quarterly forecast data - with actuals for past quarters only
const getQuarterlyForecastData = (): QuarterlyForecast[] => {
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  return [
    { quarter: 'Q1', forecast: 8500000, actual: currentQuarter > 1 ? 7800000 : 0, target: 8000000 },
    { quarter: 'Q2', forecast: 9200000, actual: currentQuarter > 2 ? 8900000 : 0, target: 9000000 },
    { quarter: 'Q3', forecast: 10500000, actual: currentQuarter > 3 ? 9200000 : 0, target: 10000000 },
    { quarter: 'Q4', forecast: 12000000, actual: 0, target: 11000000 },
  ];
};

const MOCK_QUARTERLY_FORECAST = getQuarterlyForecastData();

// Regional forecast data - using closedACV instead of actual
const MOCK_REGIONAL_FORECAST: RegionalForecast[] = REGIONS.map(region => {
  const target = Math.floor(Math.random() * 3000000) + 2000000;
  const closedACV = Math.floor(Math.random() * target * 0.8);
  const forecast = closedACV + Math.floor(Math.random() * 1000000);
  return {
    region,
    forecast,
    target,
    closedACV,
    variance: forecast - target,
    percentToTarget: Math.round((forecast / target) * 100),
  };
});

// ==================== REAL DATA BUILDERS ====================

function buildRealOpportunities(store: RealDataState): Opportunity[] {
  const opps: Opportunity[] = [];
  const ACV_LOGO_TYPES = ['New Logo', 'Upsell', 'Cross-Sell'];

  // 1. Closed ACV records → Won opportunities
  store.closedAcv.forEach(row => {
    const sowMapping = store.sowMappingIndex[row.SOW_ID];
    const region = row.Region || (sowMapping ? normalizeRegion(sowMapping.Region) : '');
    const vertical = row.Vertical || (sowMapping ? sowMapping.Vertical : '');
    const segment = row.Segment || (sowMapping ? sowMapping.Segment_Type : 'Enterprise');

    const isLicense = row.Value_Type === 'License';
    const licenseValue = isLicense ? row.Amount : 0;
    const implementationValue = !isLicense ? row.Amount : 0;

    const licenseCountsTowardACV = ACV_LOGO_TYPES.includes(row.Logo_Type);
    const closedACV = (licenseCountsTowardACV ? licenseValue : 0) + implementationValue;

    const soldBy = (['Sales', 'GD', 'TSO'].includes(row.Sold_By) ? row.Sold_By : 'Sales') as 'Sales' | 'GD' | 'TSO';

    opps.push({
      id: row.Closed_ACV_ID,
      name: row.Deal_Name,
      accountName: row.Customer_Name,
      region,
      vertical,
      segment: (segment === 'SMB' ? 'SMB' : 'Enterprise') as 'Enterprise' | 'SMB',
      channel: 'Direct',
      stage: 'Closed Won',
      probability: 100,
      dealValue: row.Amount,
      licenseValue,
      implementationValue,
      weightedValue: row.Amount,
      expectedCloseDate: row.Close_Date,
      daysInStage: 0,
      owner: row.Sales_Rep,
      status: 'Won',
      logoType: (row.Logo_Type || 'Upsell') as Opportunity['logoType'],
      salesCycleDays: 90,
      createdDate: row.Close_Date,
      closedACV,
      soldBy,
      sowId: row.SOW_ID,
      revenueType: sowMapping?.Revenue_Type || row.Value_Type || 'License',
    });
  });

  // 2. Pipeline snapshots → Active/Lost/Stalled (latest snapshot per deal)
  const dealMap = new Map<string, (typeof store.pipelineSnapshots)[0]>();
  store.pipelineSnapshots.forEach(row => {
    const key = `${row.Deal_Name}|${row.Customer_Name}`;
    const existing = dealMap.get(key);
    if (!existing || row.Snapshot_Month > existing.Snapshot_Month) {
      dealMap.set(key, row);
    }
  });

  let pipIdx = 0;
  dealMap.forEach((row) => {
    if (row.Current_Stage.includes('Closed Won')) return; // Covered by closed ACV

    let status: 'Active' | 'Lost' | 'Stalled' = 'Active';
    if (row.Current_Stage.includes('Closed Lost') ||
        row.Current_Stage.includes('Closed Dead') ||
        row.Current_Stage.includes('Closed Declined')) {
      status = 'Lost';
    } else if (row.Current_Stage.includes('Stalled')) {
      status = 'Stalled';
    }

    let simpleStage = 'Prospecting';
    if (row.Deal_Stage.includes('RFI') || row.Deal_Stage.includes('Deep-Dive')) simpleStage = 'Qualification';
    else if (row.Deal_Stage.includes('RFP') || row.Deal_Stage.includes('Proposal')) simpleStage = 'Proposal';
    else if (row.Deal_Stage.includes('Short-List') || row.Deal_Stage.includes('Finalizing')) simpleStage = 'Negotiation';
    else if (row.Deal_Stage.includes('Closed Won')) simpleStage = 'Closed Won';
    else if (row.Deal_Stage.includes('Closed')) simpleStage = 'Closed Lost';

    const prob = status === 'Lost' ? 0 : row.Probability;

    opps.push({
      id: `PIP-${String(++pipIdx).padStart(4, '0')}`,
      name: row.Deal_Name,
      accountName: row.Customer_Name,
      region: row.Region || 'North America',
      vertical: row.Vertical || 'Other Services',
      segment: (row.Segment || 'Enterprise') as 'Enterprise' | 'SMB',
      channel: 'Direct',
      stage: status === 'Lost' ? 'Closed Lost' : simpleStage,
      probability: prob,
      // Pipeline values (Deal_Value, License_ACV, Implementation_Value) are already weighted
      dealValue: row.Deal_Value,
      licenseValue: row.License_ACV,
      implementationValue: row.Implementation_Value,
      weightedValue: row.Deal_Value,
      expectedCloseDate: row.Expected_Close_Date,
      daysInStage: 30,
      owner: row.Sales_Rep,
      status,
      logoType: (row.Logo_Type || 'New Logo') as Opportunity['logoType'],
      salesCycleDays: 90,
      createdDate: row.Snapshot_Month,
      soldBy: 'Sales',
      productSubCategory: row.Product_Sub_Category || undefined,
      revenueType: 'License',
    });
  });

  return opps;
}

function buildRealSalespeople(store: RealDataState, opps: Opportunity[]): Salesperson[] {
  const yr = new Date().getFullYear();

  return store.salesTeam
    .filter(m => m.Name && m.Status === 'Active')
    .map(member => {
      const isManager = member.Sales_Rep_ID === member.Manager_ID;
      const nameLower = member.Name.trim().toLowerCase();

      const wonDeals = opps.filter(o =>
        o.status === 'Won' &&
        o.owner.trim().toLowerCase() === nameLower &&
        o.expectedCloseDate.startsWith(String(yr))
      );
      const closedYTD = wonDeals.reduce((sum, o) => sum + (o.closedACV || 0), 0);

      const activeDeals = opps.filter(o =>
        (o.status === 'Active' || o.status === 'Stalled') &&
        o.owner.trim().toLowerCase() === nameLower
      );
      const pipelineValue = activeDeals.reduce((sum, o) => sum + o.dealValue, 0);
      const forecast = activeDeals.reduce((sum, o) => sum + o.weightedValue, 0);

      const monthlyAttainment = Array.from({ length: 12 }, (_, month) => {
        const monthDeals = wonDeals.filter(o => new Date(o.expectedCloseDate).getMonth() === month);
        const monthClosed = monthDeals.reduce((sum, o) => sum + (o.closedACV || 0), 0);
        const monthTarget = member.Annual_Quota / 12;
        return monthTarget > 0 ? Math.round((monthClosed / monthTarget) * 100) : 0;
      });

      return {
        id: member.Sales_Rep_ID,
        name: member.Name,
        region: member.Region,
        isManager,
        managerId: isManager ? undefined : member.Manager_ID,
        annualTarget: member.Annual_Quota,
        closedYTD,
        forecast,
        pipelineValue,
        monthlyAttainment,
      };
    });
}

function buildQuarterlyForecast(opps: Opportunity[], salesTeam: RealDataState['salesTeam']): QuarterlyForecast[] {
  const yr = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

  // Total annual target from sales team
  const totalAnnualTarget = salesTeam
    .filter(m => m.Status === 'Active')
    .reduce((sum, m) => sum + m.Annual_Quota, 0);
  const quarterTarget = totalAnnualTarget / 4;

  return [1, 2, 3, 4].map(q => {
    const qStart = new Date(yr, (q - 1) * 3, 1);
    const qEnd = new Date(yr, q * 3, 0);

    const wonInQ = opps.filter(o => {
      if (o.status !== 'Won') return false;
      const d = new Date(o.expectedCloseDate);
      return d >= qStart && d <= qEnd;
    });
    const actual = q < currentQuarter
      ? wonInQ.reduce((sum, o) => sum + (o.closedACV || 0), 0)
      : 0;

    const activeInQ = opps.filter(o => {
      if (o.status !== 'Active' && o.status !== 'Stalled') return false;
      const d = new Date(o.expectedCloseDate);
      return d >= qStart && d <= qEnd;
    });
    const weightedPipeline = activeInQ.reduce((sum, o) => sum + o.weightedValue, 0);
    const forecast = actual + weightedPipeline;

    return { quarter: `Q${q}`, forecast, actual, target: quarterTarget || 10000000 };
  });
}

function buildRegionalForecast(opps: Opportunity[], salesTeam: RealDataState['salesTeam']): RegionalForecast[] {
  const yr = new Date().getFullYear();

  return REGIONS.map(region => {
    const regionWon = opps.filter(o =>
      o.status === 'Won' && o.region === region && o.expectedCloseDate.startsWith(String(yr))
    );
    const closedACV = regionWon.reduce((sum, o) => sum + (o.closedACV || 0), 0);

    const regionActive = opps.filter(o =>
      (o.status === 'Active' || o.status === 'Stalled') && o.region === region
    );
    const weightedPipeline = regionActive.reduce((sum, o) => sum + o.weightedValue, 0);
    const forecast = closedACV + weightedPipeline;

    const target = salesTeam
      .filter(t => t.Region === region && t.Status === 'Active')
      .reduce((sum, t) => sum + t.Annual_Quota, 0);

    return {
      region,
      forecast,
      target: target || 1000000,
      closedACV,
      variance: forecast - (target || 1000000),
      percentToTarget: Math.round((forecast / (target || 1000000)) * 100),
    };
  });
}

// ==================== UTILITY FUNCTIONS ====================
const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#64748b',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Note: Sub-category breakdown utility functions available for future implementation:
// - calculateDealSubCategoryBreakdown(deal, contributions) - for Closed ACV breakdown
// - calculatePipelineSubCategories(deal, breakdowns, snapshotMonth) - for Pipeline breakdown

// Export to CSV function
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = row[h];
      if (typeof val === 'string' && val.includes(',')) {
        return `"${val}"`;
      }
      return val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Export chart as image (placeholder - would require html2canvas in production)
const exportChartAsImage = (_chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
  alert(`Chart export for "${filename}" would be available with html2canvas library installed.`);
};

// ==================== MULTI-SELECT DROPDOWN ====================
interface MultiSelectDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ label, options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  const displayText = selected.length === 0
    ? placeholder || `All ${label}`
    : selected.length === 1
    ? selected[0]
    : `${selected.length} selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white flex items-center gap-2 min-w-[140px]"
      >
        <span className="truncate">{displayText}</span>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg z-50 min-w-[200px] max-h-64 overflow-auto">
          <div className="flex items-center justify-between px-3 py-2 border-b border-secondary-100 bg-secondary-50 sticky top-0">
            <button onClick={selectAll} className="text-xs text-primary-600 hover:text-primary-800">Select All</button>
            <button onClick={clearAll} className="text-xs text-secondary-500 hover:text-secondary-700">Clear</button>
          </div>
          {options.map(option => (
            <label key={option} className="flex items-center gap-2 px-3 py-2 hover:bg-secondary-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
                className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-secondary-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== SORTABLE TABLE HEADER ====================
interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: SortConfig | null;
  onSort: (key: string, direction: SortDirection) => void;
  onFilter?: (key: string, values: string[]) => void;
  filterOptions?: string[];
  activeFilters?: string[];
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, currentSort, onSort, onFilter, filterOptions, activeFilters = [] }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [localFilters, setLocalFilters] = useState<string[]>(activeFilters);
  const menuRef = useRef<HTMLTableHeaderCellElement>(null);
  const isActive = currentSort?.key === sortKey;
  const hasActiveFilters = activeFilters.length > 0;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync local filters with activeFilters prop
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  const toggleFilter = (opt: string) => {
    const newFilters = localFilters.includes(opt)
      ? localFilters.filter(f => f !== opt)
      : [...localFilters, opt];
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    if (onFilter) {
      onFilter(sortKey, localFilters);
    }
    setShowMenu(false);
  };

  const clearFilters = () => {
    setLocalFilters([]);
    if (onFilter) {
      onFilter(sortKey, []);
    }
  };

  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-1 hover:text-secondary-700 ${hasActiveFilters ? 'text-primary-600' : ''}`}
      >
        {label}
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
        {isActive && (
          <span className="ml-1 text-primary-500">
            {currentSort.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
        {hasActiveFilters && (
          <span className="ml-1 w-2 h-2 rounded-full bg-primary-500"></span>
        )}
      </button>

      {showMenu && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg z-50 min-w-[180px]">
          <button
            onClick={() => { onSort(sortKey, 'asc'); setShowMenu(false); }}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary-50 flex items-center gap-2 ${isActive && currentSort?.direction === 'asc' ? 'bg-primary-50 text-primary-600' : ''}`}
          >
            <span>↑</span> Sort Ascending
          </button>
          <button
            onClick={() => { onSort(sortKey, 'desc'); setShowMenu(false); }}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary-50 flex items-center gap-2 ${isActive && currentSort?.direction === 'desc' ? 'bg-primary-50 text-primary-600' : ''}`}
          >
            <span>↓</span> Sort Descending
          </button>
          {filterOptions && onFilter && (
            <>
              <hr className="my-1" />
              <div className="px-4 py-2 text-xs font-semibold text-secondary-400 flex justify-between items-center">
                <span>Filter by</span>
                {localFilters.length > 0 && (
                  <button onClick={clearFilters} className="text-primary-500 hover:text-primary-700">Clear</button>
                )}
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filterOptions.map(opt => (
                  <label key={opt} className="flex items-center gap-2 px-4 py-2 hover:bg-secondary-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters.includes(opt)}
                      onChange={() => toggleFilter(opt)}
                      className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-secondary-100">
                <button
                  onClick={applyFilters}
                  className="w-full px-3 py-1.5 bg-primary-500 text-white text-sm rounded hover:bg-primary-600"
                >
                  Apply Filters
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </th>
  );
};

// ==================== CHART EXPORT WRAPPER ====================
interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  data: any[];
  filename: string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, subtitle, children, data, filename }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="card p-6" ref={chartRef}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
          {subtitle && <p className="text-sm text-secondary-500">{subtitle}</p>}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg z-50 min-w-[140px]">
              <button
                onClick={() => { exportChartAsImage(chartRef, filename); setShowExportMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary-50"
              >
                Export as Image
              </button>
              <button
                onClick={() => { exportToCSV(data, filename); setShowExportMenu(false); }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary-50"
              >
                Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function SalesPage() {
  // Stores for enrichment
  const sowMappingStore = useSOWMappingStore();
  const pipelineSubCategoryStore = usePipelineSubCategoryStore();
  const arrSubCategoryStore = useARRSubCategoryStore();
  const productCategoryMappingStore = useProductCategoryMappingStore();

  // Real data store - loads actual CSV data
  const realData = useRealDataStore();

  // Build opportunities from real data or fall back to mock
  const opportunities = useMemo(() => {
    if (!realData.isLoaded || realData.closedAcv.length === 0) return MOCK_OPPORTUNITIES;
    return buildRealOpportunities(realData);
  }, [realData.isLoaded, realData.closedAcv, realData.pipelineSnapshots, realData.sowMappingIndex]);

  // Filters - now with multi-select support (empty = show all years for real data)
  const [yearFilter, setYearFilter] = useState<string[]>([]);
  const [quarterFilter, setQuarterFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [verticalFilter, setVerticalFilter] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState<string[]>([]);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [logoTypeFilter, setLogoTypeFilter] = useState<string[]>([]);
  const [soldByFilter, setSoldByFilter] = useState<string>('All');  // Sold By filter (Change 9)
  const [revenueTypeFilter, setRevenueTypeFilter] = useState<string>('License');  // Revenue Type filter - default License
  const [productCategoryFilter, setProductCategoryFilter] = useState<string[]>([]);
  const [productSubCategoryFilter, setProductSubCategoryFilter] = useState<string[]>([]);

  // Expandable rows for Closed ACV table
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'pipeline' | 'quota'>('overview');

  // Pipeline Movement
  const [lookbackPeriod, setLookbackPeriod] = useState<'1' | '3' | '6' | '12'>('1');

  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Table-specific column filters
  const [tableColumnFilters, setTableColumnFilters] = useState<Record<string, string[]>>({});

  // Handle sort
  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

  // Handle table column filter
  const handleTableFilter = (key: string, values: string[]) => {
    setTableColumnFilters(prev => ({
      ...prev,
      [key]: values
    }));
  };

  // Enrich opportunities with SOW Mapping + sub-category data when available
  const enrichedOpportunities = useMemo(() => {
    return opportunities.map(opp => {
      let enriched = { ...opp };

      // Enrich from SOW Mapping
      if (opp.sowId && sowMappingStore.mappings.length > 0) {
        const mapping = sowMappingStore.getMappingBySOWId(opp.sowId);
        if (mapping) {
          enriched = {
            ...enriched,
            vertical: mapping.Vertical || opp.vertical,
            region: mapping.Region || opp.region,
            segment: (mapping.Segment_Type as 'Enterprise' | 'SMB') || opp.segment,
          };
        }
      }

      // For won deals with sowId: attach ARR sub-category breakdown
      if (opp.status === 'Won' && opp.sowId && arrSubCategoryStore.records.length > 0) {
        const year = new Date(opp.expectedCloseDate).getFullYear().toString();
        const contributions = arrSubCategoryStore.getContributionForSOWAndYear(opp.sowId, year);
        if (contributions.length > 0) {
          enriched.subCategoryBreakdown = contributions;
          // Use the highest pct sub-category as primary
          const primary = contributions.sort((a, b) => b.pct - a.pct)[0];
          enriched.productSubCategory = primary.subCategory;
          enriched.productCategory = productCategoryMappingStore.getCategoryForSubCategory(primary.subCategory) || 'Unallocated';
        }
      }

      // For active deals: attach pipeline sub-category breakdown
      if (opp.status === 'Active' && pipelineSubCategoryStore.records.length > 0) {
        const breakdown = pipelineSubCategoryStore.getLatestBreakdownForDeal(opp.id);
        if (breakdown.length > 0) {
          enriched.pipelineSubCategoryBreakdown = breakdown.map(b => ({
            subCategory: b.Product_Sub_Category,
            pct: b.Contribution_Pct,
          }));
          const primary = breakdown.sort((a, b) => b.Contribution_Pct - a.Contribution_Pct)[0];
          enriched.productSubCategory = primary.Product_Sub_Category;
          enriched.productCategory = productCategoryMappingStore.getCategoryForSubCategory(primary.Product_Sub_Category) || 'Unallocated';
        }
      }

      // Default to Unallocated if no product data
      if (!enriched.productSubCategory) {
        enriched.productSubCategory = 'Unallocated';
        enriched.productCategory = 'Unallocated';
      }

      return enriched;
    });
  }, [opportunities, sowMappingStore.mappings, arrSubCategoryStore.records, pipelineSubCategoryStore.records, productCategoryMappingStore.records]);

  // Filter opportunities based on selected filters (multi-select)
  const filteredOpportunities = useMemo(() => {
    return enrichedOpportunities.filter(opp => {
      // Region filter (multi-select)
      if (regionFilter.length > 0 && !regionFilter.includes(opp.region)) return false;

      // Vertical filter (multi-select)
      if (verticalFilter.length > 0 && !verticalFilter.includes(opp.vertical)) return false;

      // Segment filter (multi-select)
      if (segmentFilter.length > 0 && !segmentFilter.includes(opp.segment)) return false;

      // Channel filter (multi-select)
      if (channelFilter.length > 0 && !channelFilter.includes(opp.channel)) return false;

      // Logo Type filter (multi-select) - treat Extension and Renewal as same
      if (logoTypeFilter.length > 0) {
        // Normalize Extension/Renewal
        const normalizedLogoType = (opp.logoType === 'Renewal' || opp.logoType === 'Extension')
          ? 'Extension/Renewal'
          : opp.logoType;
        const normalizedFilters = logoTypeFilter.map(lt =>
          (lt === 'Extension' || lt === 'Renewal') ? 'Extension/Renewal' : lt
        );
        if (!normalizedFilters.includes(normalizedLogoType) && !logoTypeFilter.includes(opp.logoType)) return false;
      }

      // Year filter (multi-select)
      if (yearFilter.length > 0) {
        const oppYear = new Date(opp.expectedCloseDate).getFullYear().toString();
        if (!yearFilter.includes(oppYear)) return false;
      }

      // Quarter filter (multi-select)
      if (quarterFilter.length > 0) {
        const oppMonth = new Date(opp.expectedCloseDate).getMonth();
        const oppQuarter = `Q${Math.floor(oppMonth / 3) + 1}`;
        if (!quarterFilter.includes(oppQuarter)) return false;
      }

      // Month filter (multi-select)
      if (monthFilter.length > 0) {
        const oppMonth = new Date(opp.expectedCloseDate).getMonth();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (!monthFilter.includes(monthNames[oppMonth])) return false;
      }

      // Sold By filter (Change 9)
      if (soldByFilter !== 'All' && opp.soldBy !== soldByFilter) return false;

      // Revenue Type filter
      if (revenueTypeFilter !== 'All' && opp.revenueType && opp.revenueType !== revenueTypeFilter) return false;

      // Product Category filter
      if (productCategoryFilter.length > 0 && opp.productCategory && !productCategoryFilter.includes(opp.productCategory)) return false;

      // Product Sub-Category filter
      if (productSubCategoryFilter.length > 0 && opp.productSubCategory && !productSubCategoryFilter.includes(opp.productSubCategory)) return false;

      return true;
    });
  }, [enrichedOpportunities, yearFilter, quarterFilter, monthFilter, regionFilter, verticalFilter, segmentFilter, channelFilter, logoTypeFilter, soldByFilter, revenueTypeFilter, productCategoryFilter, productSubCategoryFilter]);

  // Build salespeople from filtered opportunities so global filters apply
  const salespeople = useMemo(() => {
    if (!realData.isLoaded || realData.salesTeam.length === 0) return MOCK_SALESPEOPLE;
    return buildRealSalespeople(realData, filteredOpportunities);
  }, [realData.isLoaded, realData.salesTeam, filteredOpportunities]);

  // Build quarterly forecast from filtered opportunities so global filters apply
  const quarterlyForecastData = useMemo(() => {
    if (!realData.isLoaded) return MOCK_QUARTERLY_FORECAST;
    return buildQuarterlyForecast(filteredOpportunities, realData.salesTeam);
  }, [realData.isLoaded, filteredOpportunities, realData.salesTeam]);

  // Build regional forecast from filtered opportunities so global filters apply
  const regionalForecastData = useMemo(() => {
    if (!realData.isLoaded) return MOCK_REGIONAL_FORECAST;
    return buildRegionalForecast(filteredOpportunities, realData.salesTeam);
  }, [realData.isLoaded, filteredOpportunities, realData.salesTeam]);

  // Calculate metrics with proper Closed ACV rules
  const metrics = useMemo(() => {
    const closedWon = filteredOpportunities.filter(o => o.status === 'Won');
    const closedLost = filteredOpportunities.filter(o => o.status === 'Lost');
    const allClosed = [...closedWon, ...closedLost];
    const activeDeals = filteredOpportunities.filter(o => o.status === 'Active' || o.status === 'Stalled');

    // Calculate Closed ACV using business rules:
    // - License: only count if Logo Type in (New Logo, Upsell, Cross-Sell)
    // - Implementation: always count regardless of Logo Type
    // - Extension = Renewal (both excluded from license ACV)
    const calculateDealClosedACV = (deal: Opportunity): number => {
      const licenseCountsTowardACV = LICENSE_ACV_LOGO_TYPES.includes(deal.logoType);
      return (licenseCountsTowardACV ? deal.licenseValue : 0) + deal.implementationValue;
    };

    const totalClosedACV = closedWon.reduce((sum, o) => sum + calculateDealClosedACV(o), 0);

    // Breakdown by component
    const newBusinessLicenseACV = closedWon
      .filter(o => LICENSE_ACV_LOGO_TYPES.includes(o.logoType))
      .reduce((sum, o) => sum + o.licenseValue, 0);

    const implementationACV = closedWon.reduce((sum, o) => sum + o.implementationValue, 0);

    const extensionRenewalLicense = closedWon
      .filter(o => o.logoType === 'Extension' || o.logoType === 'Renewal')
      .reduce((sum, o) => sum + o.licenseValue, 0);

    const weightedForecast = activeDeals.reduce((sum, o) => sum + o.weightedValue, 0);
    const totalPipelineValue = activeDeals.reduce((sum, o) => sum + o.dealValue, 0);

    // Forecast ACV = weighted forecast from active deals
    const forecastACV = weightedForecast;

    const conversionRate = allClosed.length > 0
      ? (closedWon.length / allClosed.length) * 100
      : 0;

    const annualTarget = 40000000; // $40M target
    const gapToTarget = annualTarget - (totalClosedACV + weightedForecast);
    const pipelineCoverage = gapToTarget > 0 ? totalPipelineValue / gapToTarget : 0;

    const avgSalesCycle = activeDeals.length > 0
      ? activeDeals.reduce((sum, o) => sum + o.salesCycleDays, 0) / activeDeals.length
      : 0;

    const salesVelocity = avgSalesCycle > 0
      ? (activeDeals.length * (totalPipelineValue / activeDeals.length) * (conversionRate / 100)) / avgSalesCycle
      : 0;

    return {
      conversionRate,
      pipelineCoverage,
      salesVelocity,
      gapToTarget,
      totalClosedACV,
      newBusinessLicenseACV,
      implementationACV,
      extensionRenewalLicense,
      forecastACV,
      weightedForecast,
      totalPipelineValue,
      avgDealSize: closedWon.length > 0 ? totalClosedACV / closedWon.length : 0,
      closedWonCount: closedWon.length,
      closedLostCount: closedLost.length,
      activeDealsCount: activeDeals.length,
    };
  }, [filteredOpportunities]);

  // Funnel data - ensure all stages have data
  const funnelData = useMemo(() => {
    const activeOpps = filteredOpportunities.filter(o => o.status === 'Active' || o.status === 'Stalled');
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation'];

    // Calculate actual data from opportunities
    const actualData = stages.map(stage => {
      const stageOpps = activeOpps.filter(o => o.stage === stage);
      return {
        stage,
        count: stageOpps.length,
        value: stageOpps.reduce((sum, o) => sum + o.dealValue, 0),
      };
    });

    // If any stage has zero data, generate mock data for visualization
    const hasEmptyStages = actualData.some(d => d.count === 0);
    if (hasEmptyStages) {
      // Generate realistic funnel data with decreasing counts
      const baseValues = [
        { stage: 'Prospecting', count: 18, value: 4500000 },
        { stage: 'Qualification', count: 12, value: 3200000 },
        { stage: 'Proposal', count: 8, value: 2400000 },
        { stage: 'Negotiation', count: 5, value: 1800000 },
      ];

      return baseValues.map((base, index) => {
        const actual = actualData[index];
        return {
          stage: base.stage,
          count: actual.count > 0 ? actual.count : base.count,
          value: actual.value > 0 ? actual.value : base.value,
        };
      });
    }

    return actualData;
  }, [filteredOpportunities]);

  // Key deals (top 10 by value)
  const keyDeals = useMemo(() => {
    let deals = filteredOpportunities
      .filter(o => o.status === 'Active')
      .sort((a, b) => b.dealValue - a.dealValue);

    if (sortConfig) {
      deals = deals.sort((a: any, b: any) => {
        if (sortConfig.direction === 'asc') {
          return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
        }
        return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
      });
    }

    return deals.slice(0, 10);
  }, [filteredOpportunities, sortConfig]);

  // Pipeline movement data - TRUE floating waterfall chart
  const pipelineMovementWaterfall = useMemo(() => {
    const oppsWithMovement = filteredOpportunities.filter(o => o.previousValue !== undefined);

    const newDeals = filteredOpportunities.filter(o => {
      const createdDate = new Date(o.createdDate);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(lookbackPeriod));
      return createdDate >= cutoffDate && o.status !== 'Lost';
    });

    const lostDeals = filteredOpportunities.filter(o => o.status === 'Lost');

    // Calculate starting pipeline
    const startingPipeline = filteredOpportunities
      .filter(o => o.status === 'Active' || o.status === 'Won')
      .reduce((sum, o) => sum + (o.previousValue || o.dealValue), 0);

    // New deals added
    const newDealsValue = newDeals.reduce((sum, o) => sum + o.dealValue, 0);

    // Deals increased
    const increasedValue = oppsWithMovement
      .filter(o => o.dealValue > (o.previousValue || 0))
      .reduce((sum, o) => sum + (o.dealValue - (o.previousValue || 0)), 0);

    // Deals decreased
    const decreasedValue = oppsWithMovement
      .filter(o => o.dealValue < (o.previousValue || 0) && o.status !== 'Lost')
      .reduce((sum, o) => sum + ((o.previousValue || 0) - o.dealValue), 0);

    // Lost deals
    const lostValue = lostDeals.reduce((sum, o) => sum + o.dealValue, 0);

    // Closed won
    const closedWonValue = filteredOpportunities
      .filter(o => o.status === 'Won')
      .reduce((sum, o) => sum + o.dealValue, 0);

    // Build waterfall data with proper floating columns
    // Each bar needs: bottom (invisible spacer), value (visible bar), and type (initial/increase/decrease/final)
    let runningTotal = startingPipeline;

    const data: Array<{
      name: string;
      bottom: number;      // Invisible spacer height (where bar starts)
      value: number;       // Visible bar height
      displayValue: number; // Value to display on label
      fill: string;
      type: 'initial' | 'increase' | 'decrease' | 'final';
      connectTo?: number;  // Y value to connect to next bar
    }> = [];

    // Starting Pipeline - anchored to axis
    data.push({
      name: 'Starting\nPipeline',
      bottom: 0,
      value: startingPipeline,
      displayValue: startingPipeline,
      fill: COLORS.gray,
      type: 'initial',
      connectTo: startingPipeline
    });

    // New Deals - positive, floats from running total
    data.push({
      name: 'New\nDeals',
      bottom: runningTotal,
      value: newDealsValue,
      displayValue: newDealsValue,
      fill: COLORS.success,
      type: 'increase',
      connectTo: runningTotal + newDealsValue
    });
    runningTotal += newDealsValue;

    // Value Increased - positive, floats from running total
    data.push({
      name: 'Value\nIncreased',
      bottom: runningTotal - increasedValue,
      value: increasedValue,
      displayValue: increasedValue,
      fill: COLORS.primary,
      type: 'increase',
      connectTo: runningTotal
    });
    // Note: runningTotal already includes this since we add increasedValue above the previous total

    data.push({
      name: 'Value\nDecreased',
      bottom: runningTotal - decreasedValue,
      value: decreasedValue,
      displayValue: -decreasedValue,
      fill: COLORS.warning,
      type: 'decrease',
      connectTo: runningTotal - decreasedValue
    });
    runningTotal -= decreasedValue;

    // Lost Deals - negative, hangs down from running total
    data.push({
      name: 'Lost\nDeals',
      bottom: runningTotal - lostValue,
      value: lostValue,
      displayValue: -lostValue,
      fill: COLORS.danger,
      type: 'decrease',
      connectTo: runningTotal - lostValue
    });
    runningTotal -= lostValue;

    // Closed Won - negative (removed from pipeline), hangs down
    data.push({
      name: 'Closed\nWon',
      bottom: runningTotal - closedWonValue,
      value: closedWonValue,
      displayValue: -closedWonValue,
      fill: COLORS.purple,
      type: 'decrease',
      connectTo: runningTotal - closedWonValue
    });
    runningTotal -= closedWonValue;

    // Ending Pipeline - anchored to axis
    data.push({
      name: 'Ending\nPipeline',
      bottom: 0,
      value: runningTotal,
      displayValue: runningTotal,
      fill: COLORS.gray,
      type: 'final'
    });

    return data;
  }, [filteredOpportunities, lookbackPeriod]);

  // Pipeline movement legacy data for cards/tables
  const pipelineMovement = useMemo(() => {
    const oppsWithMovement = filteredOpportunities.filter(o => o.previousValue !== undefined);

    const newDeals = filteredOpportunities.filter(o => {
      const createdDate = new Date(o.createdDate);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(lookbackPeriod));
      return createdDate >= cutoffDate;
    });

    const lostDeals = filteredOpportunities.filter(o => o.status === 'Lost');

    const totalChange = oppsWithMovement.reduce((sum, o) => {
      return sum + (o.dealValue - (o.previousValue || 0));
    }, 0);

    const movedOut = oppsWithMovement.filter(o => o.dealValue < (o.previousValue || 0));
    const increased = oppsWithMovement.filter(o => o.dealValue > (o.previousValue || 0));

    // Group by reason
    const reasonCounts: Record<string, number> = {};
    oppsWithMovement.forEach(o => {
      if (o.movementReason) {
        reasonCounts[o.movementReason] = (reasonCounts[o.movementReason] || 0) + 1;
      }
    });

    const reasonData = Object.entries(reasonCounts).map(([name, value]) => ({ name, value }));

    return {
      totalChange,
      newDealsCount: newDeals.length,
      newDealsValue: newDeals.reduce((sum, o) => sum + o.dealValue, 0),
      movedOutCount: movedOut.length,
      movedOutValue: movedOut.reduce((sum, o) => sum + ((o.previousValue || 0) - o.dealValue), 0),
      lostDealsCount: lostDeals.length,
      lostDealsValue: lostDeals.reduce((sum, o) => sum + o.dealValue, 0),
      increasedCount: increased.length,
      oppsWithMovement,
      lostDeals,
      reasonData,
    };
  }, [filteredOpportunities, lookbackPeriod]);


  // Render tabs
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards - Reordered: Closed ACV, Forecast ACV, Gap to Target, Conversion, Sales Velocity */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Closed ACV (YTD)</p>
          <p className="text-3xl font-bold text-green-500">{formatCurrency(metrics.totalClosedACV)}</p>
          <p className="text-xs text-secondary-400 mt-1">{metrics.closedWonCount} deals</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Forecast ACV</p>
          <p className="text-3xl font-bold text-blue-500">{formatCurrency(metrics.forecastACV)}</p>
          <p className="text-xs text-secondary-400 mt-1">Weighted pipeline</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Gap to Target</p>
          <p className={`text-3xl font-bold ${metrics.gapToTarget > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {formatCurrency(Math.abs(metrics.gapToTarget))}
          </p>
          <p className="text-xs text-secondary-400 mt-1">{metrics.gapToTarget > 0 ? 'remaining' : 'exceeded'}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Conversion Rate</p>
          <p className="text-3xl font-bold text-purple-500">{formatPercent(metrics.conversionRate)}</p>
          <p className="text-xs text-secondary-400 mt-1">Won / All Closed</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Sales Velocity</p>
          <p className="text-3xl font-bold text-secondary-900">{formatCurrency(metrics.salesVelocity)}</p>
          <p className="text-xs text-secondary-400 mt-1">per day</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast by Quarter - with $ values on forecast bars */}
        <ChartWrapper
          title="Forecast by Quarter"
          subtitle="Quarterly performance vs target"
          data={quarterlyForecastData}
          filename="forecast_by_quarter"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyForecastData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="actual" name="Actual" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecast" name="Forecast" fill={COLORS.primary} radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="forecast"
                    position="top"
                    formatter={(v: number) => formatCurrency(v)}
                    style={{ fontSize: 10, fill: '#3b82f6', fontWeight: 600 }}
                  />
                </Bar>
                <Bar dataKey="target" name="Target" fill={COLORS.gray} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>

        {/* Sales Funnel Analysis */}
        <ChartWrapper
          title="Sales Funnel Analysis"
          subtitle="Pipeline by stage (count & value)"
          data={funnelData}
          filename="sales_funnel"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={90} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'value' ? formatCurrency(value) : value,
                    name === 'value' ? 'Value' : 'Count'
                  ]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="value" name="value" fill={COLORS.primary} radius={[0, 4, 4, 0]}>
                  <LabelList
                    dataKey="count"
                    position="right"
                    formatter={(v: number) => `${v} opps`}
                    style={{ fontSize: 11, fill: '#64748b' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
      </div>

      {/* Key Deals Table with sortable headers */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900">Key Deals in Pipeline</h2>
            <p className="text-sm text-secondary-500">Top 10 active deals by value</p>
          </div>
          <button
            onClick={() => exportToCSV(keyDeals, 'key_deals')}
            className="px-3 py-1.5 text-sm border border-secondary-200 rounded-lg hover:bg-secondary-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <SortableHeader label="Deal Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Account" sortKey="accountName" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Value" sortKey="dealValue" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Stage" sortKey="stage" currentSort={sortConfig} onSort={handleSort} filterOptions={STAGES.filter(s => !s.includes('Closed'))} />
                <SortableHeader label="Close Date" sortKey="expectedCloseDate" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Probability" sortKey="probability" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Owner" sortKey="owner" currentSort={sortConfig} onSort={handleSort} filterOptions={SALESPERSON_NAMES} />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {keyDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-secondary-50">
                  <td className="px-5 py-4 font-medium text-secondary-900">{deal.name}</td>
                  <td className="px-5 py-4 text-secondary-600">{deal.accountName}</td>
                  <td className="px-5 py-4 font-medium text-secondary-900">{formatCurrency(deal.dealValue)}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-secondary-600">
                    {new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                      <span className="text-sm text-secondary-600">{deal.probability}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-secondary-600">{deal.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closed ACV Deals Table with Expandable Sub-Category Breakdown */}
      {(() => {
        const closedWonDeals = filteredOpportunities
          .filter(o => o.status === 'Won')
          .sort((a, b) => (b.closedACV || 0) - (a.closedACV || 0));

        if (closedWonDeals.length === 0) return null;

        return (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">Closed ACV Deals</h2>
                <p className="text-sm text-secondary-500">Won deals with sub-category breakdown (click to expand)</p>
              </div>
              <button
                onClick={() => exportToCSV(closedWonDeals.map(d => ({
                  dealName: d.name,
                  account: d.accountName,
                  logoType: d.logoType,
                  licenseValue: d.licenseValue,
                  implValue: d.implementationValue,
                  closedACV: d.closedACV,
                  sowId: d.sowId || '',
                  closeDate: d.expectedCloseDate,
                  productSubCategory: d.productSubCategory || 'Unallocated',
                })), 'closed_acv_deals')}
                className="px-3 py-1.5 text-sm border border-secondary-200 rounded-lg hover:bg-secondary-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-secondary-500 uppercase w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Deal Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Account</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Logo Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">License ACV</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Impl ACV</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Closed ACV</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">SOW ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Close Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {closedWonDeals.slice(0, 20).map((deal) => {
                    const hasBreakdown = deal.subCategoryBreakdown && deal.subCategoryBreakdown.length > 0;
                    const isExpanded = expandedRows.has(deal.id);
                    const licenseCountsToACV = LICENSE_ACV_LOGO_TYPES.includes(deal.logoType);

                    return (
                      <React.Fragment key={deal.id}>
                        <tr
                          className={`hover:bg-secondary-50 ${hasBreakdown ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-primary-50' : ''}`}
                          onClick={() => hasBreakdown && toggleRowExpansion(deal.id)}
                        >
                          <td className="px-3 py-3 text-center">
                            {hasBreakdown ? (
                              <span className={`text-secondary-400 transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>
                                &#9654;
                              </span>
                            ) : (
                              <span className="text-secondary-200">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-secondary-900 text-sm">{deal.name}</td>
                          <td className="px-4 py-3 text-secondary-600 text-sm">{deal.accountName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              licenseCountsToACV ? 'bg-green-100 text-green-800' : 'bg-secondary-100 text-secondary-600'
                            }`}>
                              {deal.logoType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            {licenseCountsToACV ? formatCurrency(deal.licenseValue) : <span className="text-secondary-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(deal.implementationValue)}</td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-green-600">{formatCurrency(deal.closedACV || 0)}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600 font-mono">{deal.sowId || '-'}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">
                            {new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                        {isExpanded && hasBreakdown && deal.subCategoryBreakdown!.map((sc, idx) => (
                          <tr key={`${deal.id}-sc-${idx}`} className="bg-blue-50">
                            <td className="px-3 py-2"></td>
                            <td colSpan={2} className="px-4 py-2 text-sm text-secondary-700">
                              <span className="text-secondary-400 mr-2">{idx < deal.subCategoryBreakdown!.length - 1 ? '├──' : '└──'}</span>
                              {sc.subCategory}
                              {productCategoryMappingStore.getCategoryForSubCategory(sc.subCategory) && (
                                <span className="text-xs text-secondary-400 ml-2">({productCategoryMappingStore.getCategoryForSubCategory(sc.subCategory)})</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right text-sm text-secondary-600">
                              {sc.pct.toFixed(0)}%
                            </td>
                            <td className="px-4 py-2 text-right text-sm text-secondary-600">
                              {licenseCountsToACV ? formatCurrency(deal.licenseValue * (sc.pct / 100)) : '-'}
                            </td>
                            <td className="px-4 py-2 text-right text-sm text-secondary-600">
                              {formatCurrency(deal.implementationValue * (sc.pct / 100))}
                            </td>
                            <td className="px-4 py-2 text-right text-sm font-medium text-blue-600">
                              {formatCurrency((deal.closedACV || 0) * (sc.pct / 100))}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        ))}
                        {isExpanded && !hasBreakdown && (
                          <tr className="bg-secondary-50">
                            <td className="px-3 py-2"></td>
                            <td colSpan={8} className="px-4 py-2 text-sm text-secondary-400 italic">
                              No sub-category breakdown available for this deal
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );

  const renderForecastTab = () => {
    const weightedForecastValue = filteredOpportunities
      .filter(o => o.status === 'Active')
      .reduce((sum, o) => sum + o.weightedValue, 0);

    return (
      <div className="space-y-6">
        {/* Weighted Forecast Card */}
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600 uppercase tracking-wider">Weighted Forecast Value</p>
              <p className="text-4xl font-bold text-primary-900 mt-2">{formatCurrency(weightedForecastValue)}</p>
              <p className="text-sm text-primary-600 mt-1">Sum of (Deal Value x Probability)</p>
            </div>
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Regional Forecast vs Target */}
        <ChartWrapper
          title="Regional Forecast vs Target"
          data={regionalForecastData}
          filename="regional_forecast"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <SortableHeader label="Region" sortKey="region" currentSort={sortConfig} onSort={handleSort} />
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Closed ACV</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Forecast</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Target</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Variance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">% to Target</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {regionalForecastData.map((region) => (
                  <tr key={region.region} className="hover:bg-secondary-50">
                    <td className="px-4 py-4 font-medium text-secondary-900">{region.region}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(region.closedACV)}</td>
                    <td className="px-4 py-4 text-right font-medium text-secondary-900">{formatCurrency(region.forecast)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(region.target)}</td>
                    <td className={`px-4 py-4 text-right font-medium ${region.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {region.variance >= 0 ? '+' : ''}{formatCurrency(region.variance)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-2 bg-secondary-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${region.percentToTarget >= 100 ? 'bg-green-500' : region.percentToTarget >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(region.percentToTarget, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{region.percentToTarget}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        region.percentToTarget >= 100 ? 'bg-green-100 text-green-800' :
                        region.percentToTarget >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {region.percentToTarget >= 100 ? 'On Track' : region.percentToTarget >= 80 ? 'At Risk' : 'Behind'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartWrapper>

        {/* Forecast Trend - built from filtered opportunities */}
        {(() => {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          // Cumulative closed won by month + weighted pipeline by expected close month
          const wonDeals = filteredOpportunities.filter(o => o.status === 'Won');
          const activeDeals = filteredOpportunities.filter(o => o.status === 'Active' || o.status === 'Stalled');
          const monthlyWon: Record<string, number> = {};
          const monthlyPipeline: Record<string, number> = {};
          wonDeals.forEach(d => {
            const m = monthNames[new Date(d.expectedCloseDate).getMonth()];
            monthlyWon[m] = (monthlyWon[m] || 0) + d.dealValue;
          });
          activeDeals.forEach(d => {
            const m = monthNames[new Date(d.expectedCloseDate).getMonth()];
            monthlyPipeline[m] = (monthlyPipeline[m] || 0) + d.weightedValue;
          });
          // Build cumulative forecast trend
          let cumulative = 0;
          const totalTarget = quarterlyForecastData.reduce((s, q) => s + q.target, 0);
          const monthlyTarget = totalTarget > 0 ? totalTarget / 12 : 0;
          let cumulativeTarget = 0;
          const forecastTrendData = monthNames.map(m => {
            cumulative += (monthlyWon[m] || 0) + (monthlyPipeline[m] || 0);
            cumulativeTarget += monthlyTarget;
            return { month: m, forecast: Math.round(cumulative), target: Math.round(cumulativeTarget) };
          }).filter(d => d.forecast > 0 || d.target > 0);
          return (
        <ChartWrapper
          title="Forecast Trend"
          data={forecastTrendData}
          filename="forecast_trend"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forecastTrendData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="target" name="Target" stroke={COLORS.danger} strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
          );
        })()}

        {/* Forecast by Sub-Category */}
        {(() => {
          const activeDeals = filteredOpportunities.filter(o => o.status === 'Active');
          const subCatMap = new Map<string, { weighted: number; count: number }>();

          activeDeals.forEach(deal => {
            if (deal.pipelineSubCategoryBreakdown && deal.pipelineSubCategoryBreakdown.length > 0) {
              deal.pipelineSubCategoryBreakdown.forEach(sc => {
                const key = sc.subCategory;
                const entry = subCatMap.get(key) || { weighted: 0, count: 0 };
                entry.weighted += deal.weightedValue * sc.pct;
                entry.count += 1;
                subCatMap.set(key, entry);
              });
            } else {
              const key = deal.productSubCategory || 'Unallocated';
              const entry = subCatMap.get(key) || { weighted: 0, count: 0 };
              entry.weighted += deal.weightedValue;
              entry.count += 1;
              subCatMap.set(key, entry);
            }
          });

          const subCatData = Array.from(subCatMap.entries())
            .map(([subCategory, data]) => ({
              subCategory,
              category: productCategoryMappingStore.getCategoryForSubCategory(subCategory) || 'Unallocated',
              weightedForecast: data.weighted,
              dealCount: data.count,
            }))
            .sort((a, b) => b.weightedForecast - a.weightedForecast);

          if (subCatData.length <= 1 && subCatData[0]?.subCategory === 'Unallocated') return null;

          return (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-1">Forecast by Sub-Category</h3>
              <p className="text-sm text-secondary-500 mb-4">Weighted forecast values allocated by sub-category</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="px-3 py-2 text-left font-semibold text-secondary-700">Sub-Category</th>
                      <th className="px-3 py-2 text-left font-semibold text-secondary-700">Category</th>
                      <th className="px-3 py-2 text-right font-semibold text-secondary-700">Weighted Forecast</th>
                      <th className="px-3 py-2 text-right font-semibold text-secondary-700">% of Total</th>
                      <th className="px-3 py-2 text-right font-semibold text-secondary-700">Deals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {subCatData.map(sc => {
                      const totalWeighted = subCatData.reduce((s, d) => s + d.weightedForecast, 0);
                      return (
                        <tr key={sc.subCategory} className="hover:bg-secondary-50">
                          <td className="px-3 py-2 font-medium text-secondary-900">{sc.subCategory}</td>
                          <td className="px-3 py-2 text-secondary-600">{sc.category}</td>
                          <td className="px-3 py-2 text-right font-medium text-blue-600">{formatCurrency(sc.weightedForecast)}</td>
                          <td className="px-3 py-2 text-right text-secondary-700">
                            {totalWeighted > 0 ? ((sc.weightedForecast / totalWeighted) * 100).toFixed(1) : '0.0'}%
                          </td>
                          <td className="px-3 py-2 text-right text-secondary-700">{sc.dealCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderPipelineTab = () => (
    <div className="space-y-6">
      {/* Time Period Selector */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-secondary-700">Compare to:</span>
          {(['1', '3', '6', '12'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setLookbackPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                lookbackPeriod === period
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
            >
              {period} month{period !== '1' ? 's' : ''} back
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Pipeline Change</p>
          <p className={`text-3xl font-bold ${pipelineMovement.totalChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {pipelineMovement.totalChange >= 0 ? '+' : ''}{formatCurrency(pipelineMovement.totalChange)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">New Deals Added</p>
          <p className="text-3xl font-bold text-green-500">{pipelineMovement.newDealsCount}</p>
          <p className="text-xs text-secondary-400 mt-1">{formatCurrency(pipelineMovement.newDealsValue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Deals Moved Out</p>
          <p className="text-3xl font-bold text-orange-500">{pipelineMovement.movedOutCount}</p>
          <p className="text-xs text-secondary-400 mt-1">{formatCurrency(pipelineMovement.movedOutValue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Deals Lost</p>
          <p className="text-3xl font-bold text-red-500">{pipelineMovement.lostDealsCount}</p>
          <p className="text-xs text-secondary-400 mt-1">{formatCurrency(pipelineMovement.lostDealsValue)}</p>
        </div>
      </div>

      {/* Pipeline Movement Floating Waterfall Chart */}
      <ChartWrapper
        title="Pipeline Movement"
        subtitle="Floating waterfall showing $ value changes in pipeline"
        data={pipelineMovementWaterfall}
        filename="pipeline_movement"
      >
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pipelineMovementWaterfall}
              margin={{ top: 30, right: 30, left: 30, bottom: 30 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748b' }}
                interval={0}
                height={50}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v) => formatCurrency(v)}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip
                formatter={(_value: number, _name: string, props: any) => {
                  const item = props.payload;
                  if (item && item.displayValue !== undefined) {
                    return [formatCurrency(item.displayValue), 'Change'];
                  }
                  return [formatCurrency(_value), 'Value'];
                }}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />

              {/* Invisible spacer bar - this creates the "floating" effect */}
              <Bar
                dataKey="bottom"
                stackId="waterfall"
                fill="#ffffff"
                fillOpacity={0}
                stroke="none"
                radius={0}
                isAnimationActive={false}
              />

              {/* Visible value bar - stacked on top of spacer */}
              <Bar
                dataKey="value"
                stackId="waterfall"
                radius={[4, 4, 4, 4]}
              >
                {pipelineMovementWaterfall.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="displayValue"
                  position="top"
                  formatter={(v: number) => formatCurrency(v)}
                  style={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
                  offset={8}
                />
              </Bar>

              {/* Reference line at 0 */}
              <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />

              {/* Connecting lines between bars */}
              {pipelineMovementWaterfall.map((entry, index) => {
                if (index < pipelineMovementWaterfall.length - 1 && entry.connectTo !== undefined) {
                  return (
                    <ReferenceLine
                      key={`connect-${index}`}
                      y={entry.connectTo}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      strokeDasharray="4 2"
                      segment={[
                        { x: index, y: entry.connectTo },
                        { x: index + 1, y: entry.connectTo }
                      ]}
                    />
                  );
                }
                return null;
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 flex-wrap border-t border-secondary-100 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.gray }}></span>
            <span className="text-xs text-secondary-600">Initial/Final Value</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.success }}></span>
            <span className="text-xs text-secondary-600">New Deals (+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.primary }}></span>
            <span className="text-xs text-secondary-600">Value Increased (+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.warning }}></span>
            <span className="text-xs text-secondary-600">Value Decreased (-)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.danger }}></span>
            <span className="text-xs text-secondary-600">Lost Deals (-)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.purple }}></span>
            <span className="text-xs text-secondary-600">Closed Won (-)</span>
          </div>
        </div>

        {/* Waterfall explanation */}
        <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
          <p className="text-xs text-secondary-500 text-center">
            <strong>How to read:</strong> Starting Pipeline + New Deals + Increases - Decreases - Lost - Closed Won = Ending Pipeline
          </p>
        </div>
      </ChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Deal Movement Table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-secondary-900">Key Deal Movement</h2>
            <button
              onClick={() => exportToCSV(pipelineMovement.oppsWithMovement, 'deal_movement')}
              className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full">
              <thead className="bg-secondary-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Deal</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Previous</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Current</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {pipelineMovement.oppsWithMovement.slice(0, 10).map((deal) => {
                  const change = deal.dealValue - (deal.previousValue || 0);
                  const changePercent = deal.previousValue ? ((change / deal.previousValue) * 100).toFixed(0) : 0;
                  return (
                    <tr key={deal.id} className={`${change > 0 ? 'bg-green-50' : change < 0 ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-secondary-900">{deal.name}</td>
                      <td className="px-4 py-3 text-right text-secondary-600">{formatCurrency(deal.previousValue || 0)}</td>
                      <td className="px-4 py-3 text-right font-medium text-secondary-900">{formatCurrency(deal.dealValue)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-secondary-400'}`}>
                        {change > 0 ? '+' : ''}{formatCurrency(change)} ({changePercent}%)
                      </td>
                      <td className="px-4 py-3 text-secondary-600">{deal.movementReason || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reasons for Pipeline Movement - Kept as Pie Chart per original */}
        <ChartWrapper
          title="Reasons for Pipeline Movement"
          data={pipelineMovement.reasonData}
          filename="movement_reasons"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineMovement.reasonData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pipelineMovement.reasonData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
      </div>

      {/* Lost Deals Analysis */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-secondary-900">Lost Deals Analysis</h2>
          <button
            onClick={() => exportToCSV(pipelineMovement.lostDeals, 'lost_deals')}
            className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
          >
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <SortableHeader label="Deal Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Account" sortKey="accountName" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Value" sortKey="dealValue" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Loss Reason" sortKey="lossReason" currentSort={sortConfig} onSort={handleSort} filterOptions={LOSS_REASONS} />
                <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Stage Lost At</th>
                <SortableHeader label="Owner" sortKey="owner" currentSort={sortConfig} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {pipelineMovement.lostDeals.slice(0, 10).map((deal) => (
                <tr key={deal.id} className="hover:bg-secondary-50">
                  <td className="px-5 py-4 font-medium text-secondary-900">{deal.name}</td>
                  <td className="px-5 py-4 text-secondary-600">{deal.accountName}</td>
                  <td className="px-5 py-4 text-right font-medium text-red-600">{formatCurrency(deal.dealValue)}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {deal.lossReason}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-secondary-600">{deal.stage}</td>
                  <td className="px-5 py-4 text-secondary-600">{deal.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pipeline by Sub-Category */}
      {(() => {
        const activeDeals = filteredOpportunities.filter(o => o.status === 'Active');
        const subCatMap = new Map<string, { totalWeighted: number; totalPipeline: number; count: number }>();

        activeDeals.forEach(deal => {
          if (deal.pipelineSubCategoryBreakdown && deal.pipelineSubCategoryBreakdown.length > 0) {
            deal.pipelineSubCategoryBreakdown.forEach(sc => {
              const key = sc.subCategory;
              const entry = subCatMap.get(key) || { totalWeighted: 0, totalPipeline: 0, count: 0 };
              entry.totalWeighted += deal.weightedValue * sc.pct;
              entry.totalPipeline += deal.dealValue * sc.pct;
              entry.count += 1;
              subCatMap.set(key, entry);
            });
          } else {
            const key = deal.productSubCategory || 'Unallocated';
            const entry = subCatMap.get(key) || { totalWeighted: 0, totalPipeline: 0, count: 0 };
            entry.totalWeighted += deal.weightedValue;
            entry.totalPipeline += deal.dealValue;
            entry.count += 1;
            subCatMap.set(key, entry);
          }
        });

        const subCatData = Array.from(subCatMap.entries())
          .map(([subCategory, data]) => ({
            subCategory,
            category: productCategoryMappingStore.getCategoryForSubCategory(subCategory) || 'Unallocated',
            totalPipeline: data.totalPipeline,
            weightedValue: data.totalWeighted,
            dealCount: data.count,
          }))
          .sort((a, b) => b.weightedValue - a.weightedValue);

        if (subCatData.length <= 1 && subCatData[0]?.subCategory === 'Unallocated') return null;

        return (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-1">Pipeline by Sub-Category</h3>
            <p className="text-sm text-secondary-500 mb-4">Weighted pipeline values allocated by sub-category</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subCatData.slice(0, 8)} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="subCategory" tick={{ fontSize: 10, fill: '#64748b' }} angle={-45} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="weightedValue" name="Weighted Pipeline" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-200">
                      <th className="px-3 py-2 text-left font-semibold text-secondary-700">Sub-Category</th>
                      <th className="px-3 py-2 text-left font-semibold text-secondary-700">Category</th>
                      <th className="px-3 py-2 text-right font-semibold text-secondary-700">Pipeline</th>
                      <th className="px-3 py-2 text-right font-semibold text-secondary-700">Weighted</th>
                      <th className="px-3 py-2 text-right font-semibold text-secondary-700">Deals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {subCatData.map(sc => (
                      <tr key={sc.subCategory} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 font-medium text-secondary-900">{sc.subCategory}</td>
                        <td className="px-3 py-2 text-secondary-600">{sc.category}</td>
                        <td className="px-3 py-2 text-right text-secondary-700">{formatCurrency(sc.totalPipeline)}</td>
                        <td className="px-3 py-2 text-right font-medium text-blue-600">{formatCurrency(sc.weightedValue)}</td>
                        <td className="px-3 py-2 text-right text-secondary-700">{sc.dealCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // Sorted salespeople data - moved outside render function for proper reactivity
  const sortedSalespeople = useMemo(() => {
    // Calculate totals for managers and derived fields
    const salespeopleWithTotals = salespeople.map(sp => {
      const remainingTarget = sp.annualTarget - sp.closedYTD;
      const pipelineCoverage = remainingTarget > 0 ? sp.pipelineValue / remainingTarget : 0;
      const forecastAttainment = ((sp.closedYTD + sp.forecast) / sp.annualTarget) * 100;
      const ytdAttainment = (sp.closedYTD / sp.annualTarget) * 100;

      if (sp.isManager) {
        const teamMembers = salespeople.filter(s => s.managerId === sp.id);
        const teamClosed = teamMembers.reduce((sum, s) => sum + s.closedYTD, 0) + sp.closedYTD;
        const teamForecast = teamMembers.reduce((sum, s) => sum + s.forecast, 0) + sp.forecast;
        const teamPipeline = teamMembers.reduce((sum, s) => sum + s.pipelineValue, 0) + sp.pipelineValue;
        // Change 10: Manager's quota is their OWN assigned quota, NOT aggregated from team
        // The teamTarget is the aggregated amount (for display/reference only)
        // But attainment calculations use the manager's individual quota (sp.annualTarget)
        const teamTarget = teamMembers.reduce((sum, s) => sum + s.annualTarget, 0) + sp.annualTarget;
        // Manager's attainment is based on their OWN quota, not team aggregate
        const managerYtdAttainment = (teamClosed / sp.annualTarget) * 100;
        const managerForecastAttainment = ((teamClosed + teamForecast) / sp.annualTarget) * 100;
        return { ...sp, teamClosed, teamForecast, teamPipeline, teamTarget, pipelineCoverage,
          forecastAttainment: managerForecastAttainment, ytdAttainment: managerYtdAttainment };
      }
      return { ...sp, pipelineCoverage, forecastAttainment, ytdAttainment };
    });

    // Apply table-specific column filters
    let filteredSalespeople = salespeopleWithTotals;

    // Filter by region
    if (tableColumnFilters.region && tableColumnFilters.region.length > 0) {
      filteredSalespeople = filteredSalespeople.filter(sp => tableColumnFilters.region.includes(sp.region));
    }

    // Filter by name
    if (tableColumnFilters.name && tableColumnFilters.name.length > 0) {
      filteredSalespeople = filteredSalespeople.filter(sp => tableColumnFilters.name.includes(sp.name));
    }

    // Apply sorting to Sales Rep table
    if (sortConfig) {
      filteredSalespeople = [...filteredSalespeople].sort((a: any, b: any) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle string comparison
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal?.toLowerCase() || '';
        }

        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return { filteredSalespeople, salespeopleWithTotals };
  }, [salespeople, tableColumnFilters, sortConfig]);

  const renderQuotaTab = () => {
    const { filteredSalespeople, salespeopleWithTotals } = sortedSalespeople;

    return (
      <div className="space-y-6">
        {/* Sales Rep Performance Table - With sorting and individual column filters */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Sales Rep Performance</h2>
              {Object.keys(tableColumnFilters).some(k => tableColumnFilters[k]?.length > 0) && (
                <p className="text-xs text-secondary-500 mt-1">
                  Filtered: {filteredSalespeople.length} of {salespeopleWithTotals.length} reps
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(tableColumnFilters).some(k => tableColumnFilters[k]?.length > 0) && (
                <button
                  onClick={() => setTableColumnFilters({})}
                  className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => exportToCSV(filteredSalespeople.map(sp => ({
                  Name: sp.name,
                  Region: sp.region,
                  IsManager: sp.isManager,
                  ClosedYTD: sp.closedYTD,
                  Forecast: sp.forecast,
                  Pipeline: sp.pipelineValue,
                  Target: sp.annualTarget,
                  Coverage: sp.pipelineCoverage.toFixed(2),
                  YTDAttainment: sp.ytdAttainment.toFixed(1),
                  ForecastAttainment: sp.forecastAttainment.toFixed(1),
                })), 'sales_rep_performance')}
                className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
              >
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <SortableHeader
                    label="Salesperson"
                    sortKey="name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    onFilter={handleTableFilter}
                    filterOptions={SALESPERSON_NAMES}
                    activeFilters={tableColumnFilters.name || []}
                  />
                  <SortableHeader
                    label="Region"
                    sortKey="region"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    onFilter={handleTableFilter}
                    filterOptions={REGIONS}
                    activeFilters={tableColumnFilters.region || []}
                  />
                  <SortableHeader
                    label="Closed (YTD)"
                    sortKey="closedYTD"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Forecast"
                    sortKey="forecast"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Pipeline"
                    sortKey="pipelineValue"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Target"
                    sortKey="annualTarget"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Coverage"
                    sortKey="pipelineCoverage"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="YTD Att."
                    sortKey="ytdAttainment"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Forecast Att."
                    sortKey="forecastAttainment"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredSalespeople.map((sp) => (
                  <tr key={sp.id} className={`hover:bg-secondary-50 ${sp.isManager ? 'bg-blue-50 font-semibold' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {sp.isManager && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            MGR
                          </span>
                        )}
                        <span className="text-secondary-900">{sp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-secondary-600">{sp.region}</td>
                    <td className="px-4 py-4 text-right text-green-600">{formatCurrency(sp.closedYTD)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(sp.forecast)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(sp.pipelineValue)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(sp.annualTarget)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-medium ${sp.pipelineCoverage >= 3 ? 'text-green-600' : sp.pipelineCoverage >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sp.pipelineCoverage.toFixed(1)}x
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-medium ${sp.ytdAttainment >= 50 ? 'text-green-600' : sp.ytdAttainment >= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sp.ytdAttainment.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-medium ${sp.forecastAttainment >= 100 ? 'text-green-600' : sp.forecastAttainment >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sp.forecastAttainment.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quota Attainment Heatmap */}
          <ChartWrapper
            title="Monthly Attainment Heatmap"
            data={salespeople.filter(sp => !sp.isManager).map(sp => ({
              name: sp.name,
              ...sp.monthlyAttainment.reduce((acc, v, i) => ({ ...acc, [`M${i+1}`]: v }), {})
            }))}
            filename="monthly_heatmap"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium text-secondary-500">Rep</th>
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
                      <th key={i} className="px-1 py-2 text-center text-xs font-medium text-secondary-500">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {salespeople.filter(sp => !sp.isManager).slice(0, 8).map((sp) => (
                    <tr key={sp.id}>
                      <td className="px-2 py-1 text-xs text-secondary-700 truncate max-w-[80px]">{sp.name.split(' ')[0]}</td>
                      {sp.monthlyAttainment.map((att, i) => (
                        <td key={i} className="px-1 py-1">
                          <div
                            className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${
                              att >= 100 ? 'bg-green-500 text-white' :
                              att >= 75 ? 'bg-yellow-400 text-yellow-900' :
                              'bg-red-500 text-white'
                            }`}
                          >
                            {att}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1"><span className="w-4 h-4 bg-green-500 rounded"></span> &ge;100%</div>
              <div className="flex items-center gap-1"><span className="w-4 h-4 bg-yellow-400 rounded"></span> 75-99%</div>
              <div className="flex items-center gap-1"><span className="w-4 h-4 bg-red-500 rounded"></span> &lt;75%</div>
            </div>
          </ChartWrapper>

          {/* Top Performers */}
          <ChartWrapper
            title="Top Performers by Forecast Attainment"
            data={salespeople
              .filter(sp => !sp.isManager)
              .map(sp => ({
                name: sp.name.split(' ')[0],
                attainment: Math.round(((sp.closedYTD + sp.forecast) / sp.annualTarget) * 100),
              }))
              .sort((a, b) => b.attainment - a.attainment)
              .slice(0, 8)
            }
            filename="top_performers"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={salespeople
                    .filter(sp => !sp.isManager)
                    .map(sp => ({
                      name: sp.name.split(' ')[0],
                      attainment: Math.round(((sp.closedYTD + sp.forecast) / sp.annualTarget) * 100),
                    }))
                    .sort((a, b) => b.attainment - a.attainment)
                    .slice(0, 8)
                  }
                  margin={{ top: 0, right: 30, left: 60, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 150]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={55} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Attainment']} />
                  <Bar dataKey="attainment" fill={COLORS.primary} radius={[0, 4, 4, 0]}>
                    {salespeople.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index < 3 ? COLORS.success : COLORS.primary}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        </div>

        {/* Pipeline Coverage Distribution */}
        <ChartWrapper
          title="Pipeline Coverage by Rep"
          subtitle="Recommended coverage: 3x (shown as dashed line)"
          data={salespeople
            .filter(sp => !sp.isManager)
            .map(sp => {
              const remaining = sp.annualTarget - sp.closedYTD;
              return {
                name: sp.name.split(' ')[0],
                coverage: remaining > 0 ? parseFloat((sp.pipelineValue / remaining).toFixed(1)) : 0,
              };
            })
          }
          filename="pipeline_coverage"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salespeople
                  .filter(sp => !sp.isManager)
                  .map(sp => {
                    const remaining = sp.annualTarget - sp.closedYTD;
                    return {
                      name: sp.name.split(' ')[0],
                      coverage: remaining > 0 ? parseFloat((sp.pipelineValue / remaining).toFixed(1)) : 0,
                    };
                  })
                }
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${v}x`} />
                <Tooltip formatter={(value: number) => [`${value}x`, 'Coverage']} />
                <Bar dataKey="coverage" fill={COLORS.purple} radius={[4, 4, 0, 0]}>
                  {salespeople.filter(sp => !sp.isManager).map((sp, index) => {
                    const remaining = sp.annualTarget - sp.closedYTD;
                    const coverage = remaining > 0 ? sp.pipelineValue / remaining : 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={coverage >= 3 ? COLORS.success : coverage >= 2 ? COLORS.warning : COLORS.danger}
                      />
                    );
                  })}
                </Bar>
                <ReferenceLine y={3} stroke={COLORS.danger} strokeWidth={2} strokeDasharray="5 5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Sales Performance</h1>
        <p className="text-secondary-500 uppercase text-sm tracking-wide">Pipeline Velocity & Forecast Accuracy</p>
      </div>

      {/* Global Filters - Multi-Select */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-secondary-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium">Filters:</span>
          </div>

          <MultiSelectDropdown
            label="Years"
            options={['2024', '2025', '2026']}
            selected={yearFilter}
            onChange={setYearFilter}
            placeholder="All Years"
          />

          <MultiSelectDropdown
            label="Quarters"
            options={['Q1', 'Q2', 'Q3', 'Q4']}
            selected={quarterFilter}
            onChange={setQuarterFilter}
            placeholder="All Quarters"
          />

          <MultiSelectDropdown
            label="Months"
            options={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
            selected={monthFilter}
            onChange={setMonthFilter}
            placeholder="All Months"
          />

          <MultiSelectDropdown
            label="Regions"
            options={REGIONS}
            selected={regionFilter}
            onChange={setRegionFilter}
            placeholder="All Regions"
          />

          <MultiSelectDropdown
            label="Verticals"
            options={VERTICALS}
            selected={verticalFilter}
            onChange={setVerticalFilter}
            placeholder="All Verticals"
          />

          <MultiSelectDropdown
            label="Segments"
            options={SEGMENTS}
            selected={segmentFilter}
            onChange={setSegmentFilter}
            placeholder="All Segments"
          />

          <MultiSelectDropdown
            label="Logo Types"
            options={['New Logo', 'Upsell', 'Cross-Sell', 'Extension/Renewal']}
            selected={logoTypeFilter}
            onChange={setLogoTypeFilter}
            placeholder="All Logo Types"
          />

          <MultiSelectDropdown
            label="Channels"
            options={CHANNELS}
            selected={channelFilter}
            onChange={setChannelFilter}
            placeholder="All Channels"
          />

          {/* Category / Sub-Category Filters */}
          {(() => {
            const allCategories = productCategoryMappingStore.getAllCategories();
            if (allCategories.length === 0) return null;
            return (
              <>
                <MultiSelectDropdown
                  label="Category"
                  options={allCategories}
                  selected={productCategoryFilter}
                  onChange={(vals) => {
                    setProductCategoryFilter(vals);
                    // Clear sub-category filter if categories changed
                    if (vals.length > 0) {
                      const validSubCats = vals.flatMap(c => productCategoryMappingStore.getSubCategoriesForCategory(c));
                      setProductSubCategoryFilter(prev => prev.filter(sc => validSubCats.includes(sc)));
                    }
                  }}
                  placeholder="All Categories"
                />
                <MultiSelectDropdown
                  label="Sub-Category"
                  options={
                    productCategoryFilter.length > 0
                      ? productCategoryFilter.flatMap(c => productCategoryMappingStore.getSubCategoriesForCategory(c))
                      : productCategoryMappingStore.records.map(r => r.Product_Sub_Category).sort()
                  }
                  selected={productSubCategoryFilter}
                  onChange={setProductSubCategoryFilter}
                  placeholder="All Sub-Categories"
                />
              </>
            );
          })()}

          {/* Sold By Filter (Change 9) */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary-600">Sold By:</label>
            <select
              value={soldByFilter}
              onChange={(e) => setSoldByFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-secondary-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="All">All</option>
              {SOLD_BY_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Revenue Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary-600">Revenue Type:</label>
            <select
              value={revenueTypeFilter}
              onChange={(e) => setRevenueTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-secondary-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="All">All</option>
              {REVENUE_TYPE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Clear All Filters Button */}
          {(yearFilter.length > 0 || quarterFilter.length > 0 || monthFilter.length > 0 || regionFilter.length > 0 || verticalFilter.length > 0 || segmentFilter.length > 0 || logoTypeFilter.length > 0 || channelFilter.length > 0 || soldByFilter !== 'All' || revenueTypeFilter !== 'License' || productCategoryFilter.length > 0 || productSubCategoryFilter.length > 0) && (
            <button
              onClick={() => {
                setYearFilter([]);
                setQuarterFilter([]);
                setMonthFilter([]);
                setRegionFilter([]);
                setVerticalFilter([]);
                setSegmentFilter([]);
                setLogoTypeFilter([]);
                setChannelFilter([]);
                setSoldByFilter('All');
                setRevenueTypeFilter('License');
                setProductCategoryFilter([]);
                setProductSubCategoryFilter([]);
              }}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'forecast', label: 'Forecast Deep Dive' },
            { id: 'pipeline', label: 'Pipeline Movement' },
            { id: 'quota', label: 'Quota Attainment' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'forecast' && renderForecastTab()}
      {activeTab === 'pipeline' && renderPipelineTab()}
      {activeTab === 'quota' && renderQuotaTab()}
    </div>
  );
}
