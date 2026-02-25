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
  Cell,
  Legend,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { useSOWMappingStore } from '@shared/store/sowMappingStore';
import { usePipelineSubCategoryStore } from '@shared/store/pipelineSubCategoryStore';
import { useARRSubCategoryStore } from '@shared/store/arrSubCategoryStore';
import { useProductCategoryMappingStore } from '@shared/store/productCategoryMappingStore';
import { normalizeRegion } from '@shared/store/dataTypes';
import { useSalesDataStore, type SalesDataState } from '@shared/store/salesDataStore';

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
  previousYearClosed: number;
  closedYTD: number;
  forecast: number;
  pipelineValue: number;        // weighted pipeline
  unweightedPipeline: number;   // unweighted pipeline (value / probability)
  monthlyAttainment: number[];
  quota: number;
  level?: number; // hierarchy depth: 0 = top-level, 1 = direct report of top, etc.
}

interface QuarterlyForecast {
  quarter: string;
  forecast: number;
  actual: number;
  previousYear: number;
}

interface RegionalForecast {
  region: string;
  forecast: number;
  previousYearACV: number;
  closedACV: number;
  variance: number;
  yoyGrowth: number;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

// ==================== FILTER OPTIONS ====================
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

const LICENSE_ACV_LOGO_TYPES = ['New Logo', 'Upsell', 'Cross-Sell'];
const RENEWAL_LOGO_TYPES = ['Extension', 'Renewal'];
const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const SOLD_BY_OPTIONS = ['Sales', 'GD', 'TSO'] as const;
const REVENUE_TYPE_OPTIONS = ['License', 'Implementation'] as const;

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d || 1);
}

// ==================== REAL DATA BUILDERS ====================

function buildRealOpportunities(store: SalesDataState): Opportunity[] {
  const opps: Opportunity[] = [];
  const ACV_LOGO_TYPES = ['New Logo', 'Upsell', 'Cross-Sell'];

  // 1. Closed ACV records → Won opportunities
  // ALL values/dates come DIRECTLY from the Closed ACV template:
  //   - License_ACV, Implementation_Value → value columns
  //   - Close_Date → date for time filters (year/quarter/month)
  //   - Logo_Type → from Closed ACV template
  // Region & Vertical come from SOW Mapping template (primary), Closed ACV template (fallback)
  // NOTHING is picked up from Pipeline Snapshot for Won/Closed deals.
  store.closedAcv.forEach(row => {
    const sowMapping = store.sowMappingIndex[row.SOW_ID];
    // SOW Mapping is primary source for Region/Vertical; Closed ACV is fallback
    const region = (sowMapping ? normalizeRegion(sowMapping.Region) : '') || normalizeRegion(row.Region) || '';
    const vertical = (sowMapping ? sowMapping.Vertical : '') || row.Vertical || '';
    const segment = (sowMapping ? sowMapping.Segment_Type : '') || row.Segment || 'Enterprise';

    // Pick up License_ACV and Implementation_Value directly from the template columns
    const licenseValue = row.License_ACV || 0;
    const implementationValue = row.Implementation_Value || 0;
    const totalValue = licenseValue + implementationValue;

    // Closed ACV rules: License only for New Logo/Upsell/Cross-Sell; Implementation always counts
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
      dealValue: totalValue || row.Amount,
      licenseValue,
      implementationValue,
      weightedValue: totalValue || row.Amount,
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

  // 2. Pipeline snapshots → Active/Lost/Stalled (LATEST snapshot month only)
  // Find the latest Snapshot_Month globally
  let latestSnapshotMonth = '';
  store.pipelineSnapshots.forEach(row => {
    if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month;
  });
  // Only use deals from the latest snapshot month, dedup by Pipeline_Deal_ID
  const dealMap = new Map<string, (typeof store.pipelineSnapshots)[0]>();
  store.pipelineSnapshots.forEach(row => {
    if (row.Snapshot_Month.slice(0, 7) !== latestSnapshotMonth.slice(0, 7)) return;
    dealMap.set(row.Pipeline_Deal_ID, row);
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

    const prob = status === 'Lost' ? 0 : row.Probability;

    opps.push({
      id: row.Pipeline_Deal_ID || `PIP-${String(++pipIdx).padStart(4, '0')}`,
      name: row.Deal_Name,
      accountName: row.Customer_Name,
      region: row.Region || 'North America',
      vertical: row.Vertical || 'Other Services',
      segment: (row.Segment || 'Enterprise') as 'Enterprise' | 'SMB',
      channel: 'Direct',
      stage: status === 'Lost' ? 'Closed Lost' : (row.Deal_Stage || 'Prospecting'),
      probability: prob,
      // Pipeline values (License_ACV, Implementation_Value) are already probability-adjusted
      dealValue: row.Deal_Value,
      licenseValue: row.License_ACV,
      implementationValue: row.Implementation_Value,
      weightedValue: row.License_ACV + row.Implementation_Value,
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

function buildRealSalespeople(
  store: SalesDataState, opps: Opportunity[], prevYearOpps: Opportunity[],
  yearFilter: string[], regionFilter: string[], segmentFilter: string[], verticalFilter: string[],
  revenueTypeFilter: string,
): Salesperson[] {
  // Revenue-type-aware value getters for closed and pipeline deals
  const getClosedVal = (o: Opportunity): number => {
    if (revenueTypeFilter === 'Implementation') return o.implementationValue || 0;
    if (revenueTypeFilter === 'License') return o.licenseValue || 0;
    return (o.licenseValue || 0) + (o.implementationValue || 0);
  };
  const getWeightedPipeVal = (o: Opportunity): number => {
    // Pipeline values are already probability-weighted
    if (revenueTypeFilter === 'Implementation') return o.implementationValue || 0;
    if (revenueTypeFilter === 'License') return o.licenseValue || 0;
    return (o.licenseValue || 0) + (o.implementationValue || 0);
  };
  const getUnweightedPipeVal = (o: Opportunity): number => {
    // Unweight: divide by probability to get original value
    const prob = o.probability > 0 ? o.probability / 100 : 0;
    if (prob === 0) return 0;
    if (revenueTypeFilter === 'Implementation') return (o.implementationValue || 0) / prob;
    if (revenueTypeFilter === 'License') return (o.licenseValue || 0) / prob;
    return ((o.licenseValue || 0) + (o.implementationValue || 0)) / prob;
  };
  const currentCalendarYear = new Date().getFullYear();
  const selectedYear = yearFilter.length > 0 ? parseInt(yearFilter[0]) : currentCalendarYear;
  const priorYear = selectedYear - 1;

  // Check if the selected year has data in the Prior Year Performance CSV
  const selectedYearHasCSV = store.priorYearPerformance.some(r => r.Year === selectedYear);

  // ── Historical year (CSV data exists, e.g. 2024/2025): flat list directly from CSV ──
  if (selectedYearHasCSV) {
    let csvRowsForYear = store.priorYearPerformance.filter(r => r.Year === selectedYear);
    // Apply global filters to CSV rows
    if (regionFilter.length > 0) csvRowsForYear = csvRowsForYear.filter(r => regionFilter.includes(r.Region));
    if (segmentFilter.length > 0) {
      csvRowsForYear = csvRowsForYear.filter(r => {
        // CSV has "Mid-Market", filter uses "SMB" — normalize for matching
        const normalizedSeg = r.Segment === 'Mid-Market' ? 'SMB' : r.Segment;
        return segmentFilter.includes(normalizedSeg);
      });
    }
    if (verticalFilter.length > 0) csvRowsForYear = csvRowsForYear.filter(r => r.Vertical === 'All' || verticalFilter.includes(r.Vertical));

    // Build prior-year lookup for previousYearClosed
    const priorYearCSVMap = new Map<string, number>();
    store.priorYearPerformance.filter(r => r.Year === priorYear).forEach(r => {
      priorYearCSVMap.set(r.Sales_Rep_ID, r.Total_Closed || 0);
    });

    return csvRowsForYear.map(row => {
      const quota = row.Annual_Quota || 0;
      const qClosed = [row.Q1_Closed, row.Q2_Closed, row.Q3_Closed, row.Q4_Closed];
      const qQuota = quota / 4;
      const monthlyAttainment = Array.from({ length: 12 }, (_, month) => {
        const q = Math.floor(month / 3);
        return qQuota > 0 ? Math.round((qClosed[q] / qQuota) * 100) : (qClosed[q] > 0 ? 100 : 0);
      });

      return {
        id: row.Sales_Rep_ID,
        name: row.Sales_Rep_Name,
        region: row.Region,
        isManager: false,       // flat list — no hierarchy for historical years
        managerId: undefined,
        previousYearClosed: priorYearCSVMap.get(row.Sales_Rep_ID) || 0,
        closedYTD: row.Total_Closed || 0,
        forecast: row.Total_Closed || 0,  // historical: forecast = closed (no pipeline)
        pipelineValue: 0,
        unweightedPipeline: 0,
        monthlyAttainment,
        quota,
      };
    });
  }

  // ── Current year (2026): existing logic — built from sales_team_structure + opportunities ──
  // Also use CSV for prior year comparison data if available
  const priorYearHasCSV = store.priorYearPerformance.some(r => r.Year === priorYear);
  const priorYearCSVMap = new Map<string, number>();
  if (priorYearHasCSV) {
    store.priorYearPerformance.filter(r => r.Year === priorYear).forEach(r => {
      priorYearCSVMap.set(r.Sales_Rep_ID, r.Total_Closed || 0);
    });
  }

  const activeTeam = store.salesTeam.filter(m => m.Name && m.Status === 'Active');
  const managerIds = new Set(activeTeam.map(m => m.Manager_ID).filter(Boolean));

  return activeTeam
    .map(member => {
      const isManager = managerIds.has(member.Sales_Rep_ID);
      const nameLower = member.Name.trim().toLowerCase();

      const wonDeals = opps.filter(o =>
        o.status === 'Won' &&
        o.owner.trim().toLowerCase() === nameLower &&
        o.expectedCloseDate.startsWith(String(selectedYear))
      );
      const closedYTD = wonDeals.reduce((sum, o) => sum + getClosedVal(o), 0);

      // Previous year: use CSV if available, otherwise compute from prevYearOpps
      let previousYearClosed: number;
      if (priorYearHasCSV && priorYearCSVMap.has(member.Sales_Rep_ID)) {
        previousYearClosed = priorYearCSVMap.get(member.Sales_Rep_ID)!;
      } else {
        const prevYearWon = prevYearOpps.filter(o =>
          o.status === 'Won' &&
          o.owner.trim().toLowerCase() === nameLower
        );
        previousYearClosed = prevYearWon.reduce((sum, o) => sum + getClosedVal(o), 0);
      }

      const activeDeals = opps.filter(o =>
        (o.status === 'Active' || o.status === 'Stalled') &&
        o.owner.trim().toLowerCase() === nameLower
      );
      const pipelineValue = activeDeals.reduce((sum, o) => sum + getWeightedPipeVal(o), 0);
      const unweightedPipeline = activeDeals.reduce((sum, o) => sum + getUnweightedPipeVal(o), 0);
      // Forecast = Closed YTD + Weighted Pipeline
      const forecast = closedYTD + pipelineValue;

      const prevYearWon = prevYearOpps.filter(o =>
        o.status === 'Won' &&
        o.owner.trim().toLowerCase() === nameLower
      );
      const monthlyAttainment = Array.from({ length: 12 }, (_, month) => {
        const monthDeals = wonDeals.filter(o => parseDateLocal(o.expectedCloseDate).getMonth() === month);
        const monthClosed = monthDeals.reduce((sum, o) => sum + getClosedVal(o), 0);
        const prevMonthDeals = prevYearWon.filter(o => parseDateLocal(o.expectedCloseDate).getMonth() === month);
        const prevMonthClosed = prevMonthDeals.reduce((sum, o) => sum + getClosedVal(o), 0);
        return prevMonthClosed > 0 ? Math.round((monthClosed / prevMonthClosed) * 100) : (monthClosed > 0 ? 100 : 0);
      });

      return {
        id: member.Sales_Rep_ID,
        name: member.Name,
        region: member.Region,
        isManager,
        managerId: member.Sales_Rep_ID === member.Manager_ID ? undefined : member.Manager_ID,
        previousYearClosed,
        closedYTD,
        forecast,
        pipelineValue,
        unweightedPipeline,
        monthlyAttainment,
        quota: member.Annual_Quota || 0,
      };
    });
}

function buildQuarterlyForecast(opps: Opportunity[], prevYearOpps: Opportunity[], revenueType: string): QuarterlyForecast[] {
  const yr = new Date().getFullYear();
  const prevYr = yr - 1;
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

  // Revenue-type-aware value getters — read column directly from template
  const getClosedVal = (o: Opportunity): number => {
    if (revenueType === 'Implementation') return o.implementationValue || 0;
    if (revenueType === 'License') return o.licenseValue || 0;
    return (o.licenseValue || 0) + (o.implementationValue || 0);
  };
  const getPipeVal = (o: Opportunity): number => {
    if (revenueType === 'Implementation') return o.implementationValue || 0;
    if (revenueType === 'License') return o.licenseValue || 0;
    return (o.licenseValue || 0) + (o.implementationValue || 0);
  };

  return [1, 2, 3, 4].map(q => {
    const qStart = new Date(yr, (q - 1) * 3, 1);
    const qEnd = new Date(yr, q * 3, 0);

    const wonInQ = opps.filter(o => {
      if (o.status !== 'Won') return false;
      const d = parseDateLocal(o.expectedCloseDate);
      return d >= qStart && d <= qEnd;
    });
    // Actual = closed deals from Closed ACV template (using Close_Date) for current & past quarters
    const actual = q <= currentQuarter
      ? wonInQ.reduce((sum, o) => sum + getClosedVal(o), 0)
      : 0;

    // ACV forecast excludes Renewal/Extension deals from pipeline
    const activeInQ = opps.filter(o => {
      if (o.status !== 'Active' && o.status !== 'Stalled') return false;
      if (RENEWAL_LOGO_TYPES.includes(o.logoType)) return false;
      const d = parseDateLocal(o.expectedCloseDate);
      return d >= qStart && d <= qEnd;
    });
    const weightedPipeline = activeInQ.reduce((sum, o) => sum + getPipeVal(o), 0);
    const forecast = actual + weightedPipeline;

    // Previous year same quarter actuals
    const prevQStart = new Date(prevYr, (q - 1) * 3, 1);
    const prevQEnd = new Date(prevYr, q * 3, 0);
    const prevYearWonInQ = prevYearOpps.filter(o => {
      if (o.status !== 'Won') return false;
      const d = parseDateLocal(o.expectedCloseDate);
      return d >= prevQStart && d <= prevQEnd;
    });
    const previousYear = prevYearWonInQ.reduce((sum, o) => sum + getClosedVal(o), 0);

    return { quarter: `Q${q}`, forecast, actual, previousYear };
  });
}

function buildRegionalForecast(opps: Opportunity[], prevYearOpps: Opportunity[], revenueType: string): RegionalForecast[] {
  const yr = new Date().getFullYear();

  // Revenue-type-aware value getters — read column directly from template
  const getClosedVal = (o: Opportunity): number => {
    if (revenueType === 'Implementation') return o.implementationValue || 0;
    if (revenueType === 'License') return o.licenseValue || 0;
    return (o.licenseValue || 0) + (o.implementationValue || 0);
  };
  const getPipeVal = (o: Opportunity): number => {
    if (revenueType === 'Implementation') return o.implementationValue || 0;
    if (revenueType === 'License') return o.licenseValue || 0;
    return (o.licenseValue || 0) + (o.implementationValue || 0);
  };

  return REGIONS.map(region => {
    const regionWon = opps.filter(o =>
      o.status === 'Won' && o.region === region && o.expectedCloseDate.startsWith(String(yr))
    );
    const closedACV = regionWon.reduce((sum, o) => sum + getClosedVal(o), 0);

    // ACV forecast excludes Renewal/Extension deals from pipeline
    const regionActive = opps.filter(o =>
      (o.status === 'Active' || o.status === 'Stalled') && o.region === region && !RENEWAL_LOGO_TYPES.includes(o.logoType)
    );
    const weightedPipeline = regionActive.reduce((sum, o) => sum + getPipeVal(o), 0);
    const forecast = closedACV + weightedPipeline;

    // Previous year closed ACV for same region
    const prevRegionWon = prevYearOpps.filter(o =>
      o.status === 'Won' && o.region === region
    );
    const previousYearACV = prevRegionWon.reduce((sum, o) => sum + getClosedVal(o), 0);

    // Previous year forecast = previous year closed + previous year pipeline (excl. Renewal/Extension)
    const prevRegionActive = prevYearOpps.filter(o =>
      (o.status === 'Active' || o.status === 'Stalled') && o.region === region && !RENEWAL_LOGO_TYPES.includes(o.logoType)
    );
    const prevYearPipeline = prevRegionActive.reduce((sum, o) => sum + getPipeVal(o), 0);
    const previousYearForecast = previousYearACV + prevYearPipeline;

    return {
      region,
      forecast,
      previousYearACV: previousYearForecast,
      closedACV,
      variance: forecast - previousYearForecast,
      yoyGrowth: previousYearForecast > 0 ? Math.round(((forecast - previousYearForecast) / previousYearForecast) * 100) : 0,
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

  // Sales data store - loads from /sales/data API, caches in Zustand
  const realData = useSalesDataStore();

  useEffect(() => {
    realData.loadData();
  }, []);

  const opportunities = useMemo(() => {
    if (!realData.isLoaded) return [];
    return buildRealOpportunities(realData);
  }, [realData.isLoaded, realData.closedAcv, realData.pipelineSnapshots, realData.sowMappingIndex]);

  // Filters - default to 2026
  const [yearFilter, setYearFilter] = useState<string[]>(['2026']);
  const [quarterFilter, setQuarterFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [verticalFilter, setVerticalFilter] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState<string[]>([]);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [logoTypeFilter, setLogoTypeFilter] = useState<string[]>(['New Logo', 'Upsell', 'Cross-Sell']);
  const [soldByFilter, setSoldByFilter] = useState<string>('All');  // Sold By filter (Change 9)
  const [revenueTypeFilter, setRevenueTypeFilter] = useState<string>('License');  // Revenue Type filter - default License
  const [productCategoryFilter, setProductCategoryFilter] = useState<string[]>([]);
  const [productSubCategoryFilter, setProductSubCategoryFilter] = useState<string[]>([]);
  const [pipelineLookbackMonths, setPipelineLookbackMonths] = useState<number>(1);
  const [waterfallSelectedCategory, setWaterfallSelectedCategory] = useState<string | null>(null);

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

      // Enrich from SOW Mapping (primary source for Region/Vertical)
      if (opp.sowId && sowMappingStore.mappings.length > 0) {
        const mapping = sowMappingStore.getMappingBySOWId(opp.sowId);
        if (mapping) {
          enriched = {
            ...enriched,
            vertical: mapping.Vertical || opp.vertical,
            region: normalizeRegion(mapping.Region) || opp.region,
            segment: (mapping.Segment_Type as 'Enterprise' | 'SMB') || opp.segment,
          };
        }
      }

      // For won deals with sowId: attach ARR sub-category breakdown
      if (opp.status === 'Won' && opp.sowId && arrSubCategoryStore.records.length > 0) {
        const year = parseDateLocal(opp.expectedCloseDate).getFullYear().toString();
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
        const oppYear = parseDateLocal(opp.expectedCloseDate).getFullYear().toString();
        if (!yearFilter.includes(oppYear)) return false;
      }

      // Quarter filter (multi-select)
      if (quarterFilter.length > 0) {
        const oppMonth = parseDateLocal(opp.expectedCloseDate).getMonth();
        const oppQuarter = `Q${Math.floor(oppMonth / 3) + 1}`;
        if (!quarterFilter.includes(oppQuarter)) return false;
      }

      // Month filter (multi-select)
      if (monthFilter.length > 0) {
        const oppMonth = parseDateLocal(opp.expectedCloseDate).getMonth();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (!monthFilter.includes(monthNames[oppMonth])) return false;
      }

      // Sold By filter (Change 9)
      if (soldByFilter !== 'All' && opp.soldBy !== soldByFilter) return false;

      // Revenue Type filter — NO row filtering for closed deals.
      // All closed deals have both License_ACV and Implementation_Value columns;
      // the metrics computation picks the right column based on the filter.

      // Product Category filter
      if (productCategoryFilter.length > 0 && opp.productCategory && !productCategoryFilter.includes(opp.productCategory)) return false;

      // Product Sub-Category filter
      if (productSubCategoryFilter.length > 0 && opp.productSubCategory && !productSubCategoryFilter.includes(opp.productSubCategory)) return false;

      return true;
    });
  }, [enrichedOpportunities, yearFilter, quarterFilter, monthFilter, regionFilter, verticalFilter, segmentFilter, channelFilter, logoTypeFilter, soldByFilter, revenueTypeFilter, productCategoryFilter, productSubCategoryFilter]);

  // Previous year opportunities for YoY comparison (same filters except year shifted back by 1)
  const previousYearOpportunities = useMemo(() => {
    const currentYears = yearFilter.length > 0
      ? yearFilter.map(y => parseInt(y))
      : [new Date().getFullYear()];
    const prevYears = currentYears.map(y => y - 1);

    return enrichedOpportunities.filter(opp => {
      const oppYear = parseDateLocal(opp.expectedCloseDate).getFullYear();
      if (!prevYears.includes(oppYear)) return false;

      if (regionFilter.length > 0 && !regionFilter.includes(opp.region)) return false;
      if (verticalFilter.length > 0 && !verticalFilter.includes(opp.vertical)) return false;
      if (segmentFilter.length > 0 && !segmentFilter.includes(opp.segment)) return false;
      if (channelFilter.length > 0 && !channelFilter.includes(opp.channel)) return false;
      if (logoTypeFilter.length > 0) {
        const normalizedLogoType = (opp.logoType === 'Renewal' || opp.logoType === 'Extension')
          ? 'Extension/Renewal' : opp.logoType;
        const normalizedFilters = logoTypeFilter.map(lt =>
          (lt === 'Extension' || lt === 'Renewal') ? 'Extension/Renewal' : lt
        );
        if (!normalizedFilters.includes(normalizedLogoType) && !logoTypeFilter.includes(opp.logoType)) return false;
      }
      if (quarterFilter.length > 0) {
        const oppMonth = parseDateLocal(opp.expectedCloseDate).getMonth();
        const oppQuarter = `Q${Math.floor(oppMonth / 3) + 1}`;
        if (!quarterFilter.includes(oppQuarter)) return false;
      }
      if (monthFilter.length > 0) {
        const oppMonth = parseDateLocal(opp.expectedCloseDate).getMonth();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (!monthFilter.includes(monthNames[oppMonth])) return false;
      }
      if (soldByFilter !== 'All' && opp.soldBy !== soldByFilter) return false;
      // Revenue Type — no row filtering; metrics pick the right column
      if (productCategoryFilter.length > 0 && opp.productCategory && !productCategoryFilter.includes(opp.productCategory)) return false;
      if (productSubCategoryFilter.length > 0 && opp.productSubCategory && !productSubCategoryFilter.includes(opp.productSubCategory)) return false;

      return true;
    });
  }, [enrichedOpportunities, yearFilter, quarterFilter, monthFilter, regionFilter, verticalFilter, segmentFilter, channelFilter, logoTypeFilter, soldByFilter, revenueTypeFilter, productCategoryFilter, productSubCategoryFilter]);

  const salespeople = useMemo(() => {
    if (!realData.isLoaded) return [];
    return buildRealSalespeople(realData, filteredOpportunities, previousYearOpportunities, yearFilter, regionFilter, segmentFilter, verticalFilter, revenueTypeFilter);
  }, [realData.isLoaded, realData.salesTeam, realData.priorYearPerformance, filteredOpportunities, previousYearOpportunities, yearFilter, regionFilter, segmentFilter, verticalFilter, revenueTypeFilter]);

  const quarterlyForecastData = useMemo(() => {
    if (!realData.isLoaded) return [];
    return buildQuarterlyForecast(filteredOpportunities, previousYearOpportunities, revenueTypeFilter);
  }, [realData.isLoaded, filteredOpportunities, previousYearOpportunities, revenueTypeFilter]);

  const regionalForecastData = useMemo(() => {
    if (!realData.isLoaded) return [];
    return buildRegionalForecast(filteredOpportunities, previousYearOpportunities, revenueTypeFilter);
  }, [realData.isLoaded, filteredOpportunities, previousYearOpportunities, revenueTypeFilter]);

  const ownerNames = useMemo(() => {
    return [...new Set(opportunities.map(o => o.owner).filter(Boolean))].sort();
  }, [opportunities]);

  const salespersonNames = useMemo(() => {
    return [...new Set(salespeople.map(s => s.name).filter(Boolean))].sort();
  }, [salespeople]);

  // Calculate metrics with proper Closed ACV rules
  const metrics = useMemo(() => {
    // Helper: get the relevant ACV value from a closed deal based on Revenue Type filter
    // Reads the column directly — License_ACV or Implementation_Value from Closed_ACV_Template
    const getClosedValue = (deal: Opportunity): number => {
      if (revenueTypeFilter === 'Implementation') return deal.implementationValue || 0;
      if (revenueTypeFilter === 'License') return deal.licenseValue || 0;
      return (deal.licenseValue || 0) + (deal.implementationValue || 0);
    };

    const getPipelineValue = (deal: Opportunity): number => {
      if (revenueTypeFilter === 'Implementation') return deal.implementationValue || 0;
      if (revenueTypeFilter === 'License') return deal.licenseValue || 0;
      return (deal.licenseValue || 0) + (deal.implementationValue || 0);
    };

    // Won deals come ONLY from Closed ACV template (Close_Date, License_ACV, Implementation_Value, Logo_Type)
    // Pipeline snapshot "Closed Won" deals are excluded in buildRealOpportunities — no pipeline data here.
    const closedWon = filteredOpportunities.filter(o => o.status === 'Won');
    const closedLost = filteredOpportunities.filter(o => o.status === 'Lost');
    const activeDeals = filteredOpportunities.filter(o => o.status === 'Active' || o.status === 'Stalled');

    // Closed ACV — reads License_ACV / Implementation_Value directly from Closed ACV template
    const totalClosedACV = closedWon.reduce((sum, o) => sum + getClosedValue(o), 0);

    // Debug: help identify $0 issues
    if (closedWon.length > 0 && totalClosedACV === 0) {
      console.warn('[SalesPage Metrics] closedWon has', closedWon.length, 'deals but totalClosedACV=0. revenueTypeFilter=', revenueTypeFilter,
        'Sample deal:', closedWon[0]?.id, 'logoType:', closedWon[0]?.logoType,
        'licenseValue:', closedWon[0]?.licenseValue, 'implValue:', closedWon[0]?.implementationValue,
        'revenueType:', closedWon[0]?.revenueType);
    }

    // Weighted Pipeline ACV — picks the right column from the pipeline snapshot
    // License filter → License_ACV, Implementation filter → Implementation_Value
    // ACV forecast excludes Renewal/Extension deals from pipeline
    const acvActiveDeals = activeDeals.filter(o => !RENEWAL_LOGO_TYPES.includes(o.logoType));
    const weightedPipelineACV = acvActiveDeals.reduce((sum, o) => sum + getPipelineValue(o), 0);

    // Forecast ACV = Closed ACV + Weighted Pipeline ACV (excl. Renewal/Extension pipeline)
    const forecastACV = totalClosedACV + weightedPipelineACV;

    // Previous year: compute same metrics for YoY comparison against Forecast ACV
    const prevYearWon = previousYearOpportunities.filter(o => o.status === 'Won');
    const previousYearClosedACV = prevYearWon.reduce((sum, o) => sum + getClosedValue(o), 0);
    const prevYearActive = previousYearOpportunities.filter(o => o.status === 'Active' || o.status === 'Stalled');
    const prevYearAcvActive = prevYearActive.filter(o => !RENEWAL_LOGO_TYPES.includes(o.logoType));
    const previousYearPipelineACV = prevYearAcvActive.reduce((sum, o) => sum + getPipelineValue(o), 0);
    const previousYearForecastACV = previousYearClosedACV + previousYearPipelineACV;

    // YoY Growth % is against Forecast ACV (Closed + Pipeline)
    const yoyGrowth = previousYearForecastACV > 0
      ? ((forecastACV - previousYearForecastACV) / previousYearForecastACV) * 100
      : 0;

    // Breakdown by component
    const newBusinessLicenseACV = closedWon
      .filter(o => LICENSE_ACV_LOGO_TYPES.includes(o.logoType))
      .reduce((sum, o) => sum + o.licenseValue, 0);

    const implementationACV = closedWon.reduce((sum, o) => sum + o.implementationValue, 0);

    const extensionRenewalLicense = closedWon
      .filter(o => o.logoType === 'Extension' || o.logoType === 'Renewal')
      .reduce((sum, o) => sum + o.licenseValue, 0);

    const totalPipelineValue = activeDeals.reduce((sum, o) => sum + o.dealValue, 0);

    // --- Conversion Rate: Won from Closed ACV, Lost from ALL pipeline snapshots ---
    // Won ACV from Closed ACV template (closedWon).
    // Lost ACV from pipeline snapshots: scan ALL months to find deals that reached
    // Closed Lost/Dead/Declined/Stalled. Take each deal's value from its LAST lost-stage snapshot.
    // Lost deals are dropped from later snapshots, so the latest snapshot has none.
    const wonACV = closedWon.reduce((sum, o) => sum + getClosedValue(o), 0);

    let lostACV = 0;
    {
      const snapshots = realData.pipelineSnapshots;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const isLostStage = (stage: string) =>
        stage.includes('Closed Lost') || stage.includes('Closed Dead') || stage.includes('Closed Declined') || stage.includes('Stalled');

      // Unweighted value: pipeline values are pre-multiplied by probability,
      // so divide by (Probability / 100) to get the original deal value.
      const getUnweightedValue = (s: { License_ACV: number; Implementation_Value: number; Probability: number }) => {
        const prob = s.Probability > 0 ? s.Probability / 100 : 0;
        if (prob === 0) return 0;
        const license = (s.License_ACV || 0) / prob;
        const impl = (s.Implementation_Value || 0) / prob;
        if (revenueTypeFilter === 'Implementation') return impl;
        if (revenueTypeFilter === 'License') return license;
        return license + impl;
      };

      // Collect last lost-stage snapshot per deal, applying filters
      const lostDealMap = new Map<string, number>();
      snapshots.forEach(s => {
        if (!isLostStage(s.Current_Stage)) return;
        // Apply year/quarter/month filters on Expected_Close_Date
        const d = parseDateLocal(s.Expected_Close_Date);
        const yr = d.getFullYear().toString();
        const mon = monthNames[d.getMonth()];
        const qtr = `Q${Math.floor(d.getMonth() / 3) + 1}`;
        if (yearFilter.length > 0 && !yearFilter.includes(yr)) return;
        if (monthFilter.length > 0 && !monthFilter.includes(mon)) return;
        if (quarterFilter.length > 0 && !quarterFilter.includes(qtr)) return;
        // Apply dimension filters
        if (regionFilter.length > 0 && !regionFilter.includes(s.Region)) return;
        if (verticalFilter.length > 0 && !verticalFilter.includes(s.Vertical)) return;
        if (segmentFilter.length > 0 && !segmentFilter.includes(s.Segment)) return;
        if (logoTypeFilter.length > 0) {
          const lt = s.Logo_Type.trim();
          const normalizedLt = (lt === 'Renewal' || lt === 'Extension') ? 'Extension/Renewal' : lt;
          const normalizedFilters = logoTypeFilter.map(f => (f === 'Extension' || f === 'Renewal') ? 'Extension/Renewal' : f);
          if (!normalizedFilters.includes(normalizedLt) && !logoTypeFilter.includes(lt)) return;
        }
        // Keep the latest snapshot value per deal (overwrite older entries)
        lostDealMap.set(s.Pipeline_Deal_ID, getUnweightedValue(s));
      });
      lostDealMap.forEach(val => { lostACV += val; });
    }

    const conversionRate = (wonACV + lostACV) > 0
      ? (wonACV / (wonACV + lostACV)) * 100
      : 0;

    // --- Time to Close ---
    // For Won deals in Closed ACV: days = Close_Date (from Closed ACV) - Created_Date (from pipeline snapshots).
    // For Lost/Dead/Declined/Stalled deals (pipeline only): days = LATEST snapshot month where
    //   deal appears with a closed stage - Created_Date.
    // Respects all active filters: year/quarter/month, region, vertical, segment,
    // logo type, and revenue type (License/Implementation).
    let avgSalesCycle = 0;
    {
      const snapshots = realData.pipelineSnapshots;
      const closedAcvRecords = realData.closedAcv;

      const isClosed = (stage: string) =>
        stage.includes('Closed Won') ||
        stage.includes('Closed Lost') ||
        stage.includes('Closed Dead') ||
        stage.includes('Closed Declined') ||
        stage.includes('Stalled');

      // Build Closed ACV lookup: Pipeline_Deal_ID → Close_Date
      const closedAcvDateMap = new Map<string, string>();
      closedAcvRecords.forEach(c => {
        if (c.Pipeline_Deal_ID && c.Close_Date) {
          closedAcvDateMap.set(c.Pipeline_Deal_ID, c.Close_Date);
        }
      });

      // Build per-deal history with deal attributes for filtering
      const dealHistory = new Map<string, {
        createdDate: string;
        licenseAcv: number;
        implementationValue: number;
        logoType: string;
        region: string;
        vertical: string;
        segment: string;
        entries: { month: string; stage: string }[];
      }>();
      snapshots.forEach(s => {
        if (!s.Pipeline_Deal_ID) return;
        if (!dealHistory.has(s.Pipeline_Deal_ID)) {
          dealHistory.set(s.Pipeline_Deal_ID, {
            createdDate: s.Created_Date || '',
            licenseAcv: s.License_ACV || 0,
            implementationValue: s.Implementation_Value || 0,
            logoType: s.Logo_Type || '',
            region: s.Region || '',
            vertical: s.Vertical || '',
            segment: s.Segment || '',
            entries: [],
          });
        }
        dealHistory.get(s.Pipeline_Deal_ID)!.entries.push({ month: s.Snapshot_Month, stage: s.Current_Stage });
      });

      let totalDays = 0;
      let closedDealCount = 0;

      dealHistory.forEach((deal, dealId) => {
        if (!deal.createdDate) return;

        // Apply revenue type filter: skip deals without relevant value
        if (revenueTypeFilter === 'License' && deal.licenseAcv <= 0) return;
        if (revenueTypeFilter === 'Implementation' && deal.implementationValue <= 0) return;

        // Apply logo type filter
        if (logoTypeFilter.length > 0) {
          const normalizedLogoType = (deal.logoType === 'Renewal' || deal.logoType === 'Extension')
            ? 'Extension/Renewal' : deal.logoType;
          const normalizedFilters = logoTypeFilter.map(lt =>
            (lt === 'Extension' || lt === 'Renewal') ? 'Extension/Renewal' : lt
          );
          if (!normalizedFilters.includes(normalizedLogoType) && !logoTypeFilter.includes(deal.logoType)) return;
        }

        // Apply region filter
        if (regionFilter.length > 0 && !regionFilter.includes(deal.region)) return;

        // Apply vertical filter
        if (verticalFilter.length > 0 && !verticalFilter.includes(deal.vertical)) return;

        // Apply segment filter
        if (segmentFilter.length > 0 && !segmentFilter.includes(deal.segment)) return;

        // Sort entries chronologically
        deal.entries.sort((a, b) => a.month.localeCompare(b.month));

        // Determine the actual close date:
        // 1. If deal is in Closed ACV template → use Close_Date (most accurate)
        // 2. Otherwise → use the LATEST snapshot month where deal has a closed stage
        let closeDate: string | null = null;
        const acvCloseDate = closedAcvDateMap.get(dealId);

        // Find the LATEST snapshot month where the deal has a closed stage
        let lastClosedMonth: string | null = null;
        for (const entry of deal.entries) {
          if (isClosed(entry.stage)) {
            lastClosedMonth = entry.month; // keep overwriting → ends up with latest
          }
        }
        if (!lastClosedMonth) return; // Deal never closed

        if (acvCloseDate) {
          closeDate = acvCloseDate; // Use actual Close_Date from Closed ACV
        } else {
          closeDate = lastClosedMonth; // Fallback to latest closed snapshot month
        }

        // Apply year/quarter/month filter on the close date
        const closeDateObj = parseDateLocal(closeDate);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const yr = closeDateObj.getFullYear().toString();
        const mon = monthNames[closeDateObj.getMonth()];
        const qtr = `Q${Math.floor(closeDateObj.getMonth() / 3) + 1}`;
        if (yearFilter.length > 0 && !yearFilter.includes(yr)) return;
        if (monthFilter.length > 0 && !monthFilter.includes(mon)) return;
        if (quarterFilter.length > 0 && !quarterFilter.includes(qtr)) return;

        // Calculate days from Created Date to close date
        const created = parseDateLocal(deal.createdDate);
        const diffMs = closeDateObj.getTime() - created.getTime();
        const diffDays = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
        totalDays += diffDays;
        closedDealCount++;
      });

      avgSalesCycle = closedDealCount > 0 ? totalDays / closedDealCount : 0;
    }

    return {
      conversionRate,
      avgSalesCycle,
      totalClosedACV,
      weightedPipelineACV,
      forecastACV,
      previousYearClosedACV,
      previousYearForecastACV,
      yoyGrowth,
      newBusinessLicenseACV,
      implementationACV,
      extensionRenewalLicense,
      totalPipelineValue,
      avgDealSize: (() => {
        const dealsWithValue = closedWon.filter(o => getClosedValue(o) > 0);
        return dealsWithValue.length > 0 ? totalClosedACV / dealsWithValue.length : 0;
      })(),
      closedWonWithValueCount: closedWon.filter(o => getClosedValue(o) > 0).length,
      closedWonCount: closedWon.length,
      closedLostCount: closedLost.length,
      activeDealsCount: activeDeals.length,
    };
  }, [filteredOpportunities, previousYearOpportunities, revenueTypeFilter, realData.pipelineSnapshots, realData.closedAcv, yearFilter, monthFilter, quarterFilter, logoTypeFilter, regionFilter, verticalFilter, segmentFilter]);

  // Funnel data - dynamically built from actual Deal_Stage values in the data
  const funnelData = useMemo(() => {
    const activeOpps = filteredOpportunities.filter(o => o.status === 'Active' || o.status === 'Stalled');

    // Revenue-type-aware value getter for pipeline deals
    const getPipeVal = (o: Opportunity): number => {
      if (revenueTypeFilter === 'Implementation') return o.implementationValue || 0;
      if (revenueTypeFilter === 'License') return o.licenseValue || 0;
      return (o.licenseValue || 0) + (o.implementationValue || 0);
    };

    // Collect unique stages from active opportunities (excluding Closed stages)
    const stageMap = new Map<string, { count: number; value: number }>();
    activeOpps.forEach(o => {
      if (o.stage.includes('Closed')) return;
      const entry = stageMap.get(o.stage) || { count: 0, value: 0 };
      entry.count += 1;
      entry.value += getPipeVal(o);
      stageMap.set(o.stage, entry);
    });

    if (stageMap.size === 0) {
      // Fallback mock data when no active deals
      return [
        { stage: 'Prospecting', count: 18, value: 4500000 },
        { stage: 'Qualification', count: 12, value: 3200000 },
        { stage: 'Proposal', count: 8, value: 2400000 },
        { stage: 'Negotiation', count: 5, value: 1800000 },
      ];
    }

    return Array.from(stageMap.entries())
      .map(([stage, data]) => ({ stage, count: data.count, value: data.value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOpportunities, revenueTypeFilter]);

  // Key deals (top 10 by value) - show UNWEIGHTED fee (weighted value / probability)
  const keyDeals = useMemo(() => {
    // Unweighted value = weighted value / (probability / 100)
    // Pipeline values are already probability-adjusted, so divide by probability to get unweighted
    const getUnweightedVal = (o: Opportunity): number => {
      const prob = o.probability > 0 ? o.probability / 100 : 1;
      if (revenueTypeFilter === 'Implementation') return (o.implementationValue || 0) / prob;
      if (revenueTypeFilter === 'License') return (o.licenseValue || 0) / prob;
      return ((o.licenseValue || 0) + (o.implementationValue || 0)) / prob;
    };

    let deals = filteredOpportunities
      .filter(o => o.status === 'Active')
      .sort((a, b) => getUnweightedVal(b) - getUnweightedVal(a));

    if (sortConfig) {
      deals = deals.sort((a: any, b: any) => {
        if (sortConfig.direction === 'asc') {
          return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
        }
        return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
      });
    }

    return deals.slice(0, 10);
  }, [filteredOpportunities, sortConfig, revenueTypeFilter]);

  // ====== Pipeline Movement: Month-over-Month Snapshot Comparison ======
  // Determine the target month from filters to compare previous vs current snapshot.
  const snapshotComparison = useMemo(() => {
    const snapshots = realData.pipelineSnapshots;
    if (!realData.isLoaded || snapshots.length === 0) return null;

    // Get all unique snapshot months sorted ascending (YYYY-MM-DD format)
    const allMonths = Array.from(new Set(snapshots.map(s => s.Snapshot_Month.slice(0, 7)))).sort();
    if (allMonths.length < 2) return null;

    // Determine the "current" snapshot month based on filters
    let targetYYYYMM = allMonths[allMonths.length - 1]; // default: latest
    if (yearFilter.length > 0) {
      const filteredMonths = allMonths.filter(m => yearFilter.includes(m.slice(0, 4)));
      if (filteredMonths.length > 0) {
        if (monthFilter.length === 1) {
          // Single month selected — find matching YYYY-MM
          const monthIdx = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(monthFilter[0]);
          if (monthIdx >= 0) {
            const mm = String(monthIdx + 1).padStart(2, '0');
            const match = filteredMonths.find(m => m.endsWith(`-${mm}`));
            if (match) targetYYYYMM = match;
            else targetYYYYMM = filteredMonths[filteredMonths.length - 1];
          }
        } else if (quarterFilter.length === 1) {
          // Single quarter — use the last month of that quarter within the filtered year
          const qNum = parseInt(quarterFilter[0].replace('Q', ''));
          const qMonths = [(qNum - 1) * 3 + 1, (qNum - 1) * 3 + 2, (qNum - 1) * 3 + 3]
            .map(m => String(m).padStart(2, '0'));
          const qMatches = filteredMonths.filter(m => qMonths.some(mm => m.endsWith(`-${mm}`)));
          if (qMatches.length > 0) targetYYYYMM = qMatches[qMatches.length - 1];
          else targetYYYYMM = filteredMonths[filteredMonths.length - 1];
        } else {
          targetYYYYMM = filteredMonths[filteredMonths.length - 1];
        }
      }
    }

    // Find the comparison month based on lookback setting
    const targetIdx = allMonths.indexOf(targetYYYYMM);
    if (targetIdx <= 0) return null; // No previous month available

    // For lookback: go back N months from target in the available data
    // e.g. lookback=1 → previous month, lookback=3 → 3 months back, etc.
    let prevIdx: number;
    if (pipelineLookbackMonths === 1) {
      // Default: just the immediately previous snapshot month
      prevIdx = targetIdx - 1;
    } else {
      // Find the snapshot month that is closest to N months before target
      const targetDate = new Date(parseInt(targetYYYYMM.slice(0, 4)), parseInt(targetYYYYMM.slice(5, 7)) - 1, 1);
      targetDate.setMonth(targetDate.getMonth() - pipelineLookbackMonths);
      const lookbackYYYYMM = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      // Find the closest available month that is <= the desired lookback month
      prevIdx = -1;
      for (let i = targetIdx - 1; i >= 0; i--) {
        if (allMonths[i] <= lookbackYYYYMM) { prevIdx = i; break; }
      }
      // If no month found at or before the lookback target, use the earliest available before target
      if (prevIdx < 0) prevIdx = 0;
    }
    if (prevIdx < 0 || prevIdx >= targetIdx) return null;
    const prevYYYYMM = allMonths[prevIdx];

    // Deal type for comparison between months
    type SnapDeal = {
      licenseACV: number; implValue: number; currentStage: string;
      dealName: string; customerName: string; salesRep: string;
      dealStage: string; probability: number; logoType: string;
      pipelineDealId: string;
    };

    // Individual deal movement detail
    type DealMovement = {
      id: string; dealName: string; customerName: string;
      prevValue: number; currValue: number; change: number;
      category: 'New' | 'Increased' | 'Decreased' | 'Won' | 'Lost';
      stage: string; salesRep: string;
    };

    // Apply global filters
    const passesFilters = (row: typeof snapshots[0]): boolean => {
      if (regionFilter.length > 0 && !regionFilter.includes(row.Region)) return false;
      if (verticalFilter.length > 0 && !verticalFilter.includes(row.Vertical)) return false;
      if (segmentFilter.length > 0 && !segmentFilter.includes(row.Segment)) return false;
      if (logoTypeFilter.length > 0) {
        const normalizedLogoType = (row.Logo_Type === 'Renewal' || row.Logo_Type === 'Extension')
          ? 'Extension/Renewal' : row.Logo_Type;
        const normalizedFilters = logoTypeFilter.map(lt =>
          (lt === 'Extension' || lt === 'Renewal') ? 'Extension/Renewal' : lt
        );
        if (!normalizedFilters.includes(normalizedLogoType) && !logoTypeFilter.includes(row.Logo_Type)) return false;
      }
      return true;
    };

    // Build maps using Pipeline_Deal_ID as key (IDs are now proper 12-digit numbers)
    const prevMap = new Map<string, SnapDeal>();
    const currMap = new Map<string, SnapDeal>();
    snapshots.forEach(row => {
      if (!passesFilters(row)) return;
      const ym = row.Snapshot_Month.slice(0, 7);
      const key = row.Pipeline_Deal_ID;
      const deal: SnapDeal = {
        licenseACV: row.License_ACV || 0,
        implValue: row.Implementation_Value || 0,
        currentStage: row.Current_Stage || '',
        dealName: row.Deal_Name || '',
        customerName: row.Customer_Name || '',
        salesRep: row.Sales_Rep || '',
        dealStage: row.Deal_Stage || '',
        probability: row.Probability || 0,
        logoType: row.Logo_Type || '',
        pipelineDealId: row.Pipeline_Deal_ID,
      };
      if (ym === prevYYYYMM) {
        prevMap.set(key, deal);
      } else if (ym === targetYYYYMM) {
        currMap.set(key, deal);
      }
    });

    // Revenue-type-aware value getter
    const getVal = (d: SnapDeal): number => {
      if (revenueTypeFilter === 'Implementation') return d.implValue;
      if (revenueTypeFilter === 'License') return d.licenseACV;
      return d.licenseACV + d.implValue;
    };

    // Starting Pipeline = sum of all deals in previous month
    let startingPipeline = 0;
    prevMap.forEach(d => { startingPipeline += getVal(d); });

    // Ending Pipeline = sum of all deals in current month
    let endingPipeline = 0;
    currMap.forEach(d => { endingPipeline += getVal(d); });

    // Compare deals between months — track both aggregates and individual deal details
    let newDealsValue = 0;
    let newDealsCount = 0;
    let increasedValue = 0;
    let increasedCount = 0;
    let decreasedValue = 0;
    let decreasedCount = 0;
    let wonValue = 0;
    let wonCount = 0;
    let lostValue = 0;
    let lostCount = 0;
    const dealDetails: DealMovement[] = [];

    // Deals in current but NOT in previous → New Deals
    currMap.forEach((currDeal, key) => {
      if (!prevMap.has(key)) {
        const val = getVal(currDeal);
        newDealsValue += val;
        newDealsCount++;
        dealDetails.push({
          id: key, dealName: currDeal.dealName, customerName: currDeal.customerName,
          prevValue: 0, currValue: val, change: val,
          category: 'New', stage: currDeal.dealStage, salesRep: currDeal.salesRep,
        });
      }
    });

    // Deals in both → Value Increase / Decrease
    currMap.forEach((currDeal, key) => {
      const prevDeal = prevMap.get(key);
      if (prevDeal) {
        const currVal = getVal(currDeal);
        const prevVal = getVal(prevDeal);
        if (currVal > prevVal) {
          increasedValue += currVal - prevVal;
          increasedCount++;
          dealDetails.push({
            id: key, dealName: currDeal.dealName, customerName: currDeal.customerName,
            prevValue: prevVal, currValue: currVal, change: currVal - prevVal,
            category: 'Increased', stage: currDeal.dealStage, salesRep: currDeal.salesRep,
          });
        } else if (currVal < prevVal) {
          decreasedValue += prevVal - currVal;
          decreasedCount++;
          dealDetails.push({
            id: key, dealName: currDeal.dealName, customerName: currDeal.customerName,
            prevValue: prevVal, currValue: currVal, change: currVal - prevVal,
            category: 'Decreased', stage: currDeal.dealStage, salesRep: currDeal.salesRep,
          });
        }
      }
    });

    // Deals in previous but NOT in current → check Current_Stage for Won/Lost
    // Stage 7 = Won, Stages 8/10/11/12 = Lost
    prevMap.forEach((prevDeal, key) => {
      if (!currMap.has(key)) {
        const stage = prevDeal.currentStage;
        const val = getVal(prevDeal);
        if (stage.startsWith('Stage 7')) {
          wonValue += val;
          wonCount++;
          dealDetails.push({
            id: key, dealName: prevDeal.dealName, customerName: prevDeal.customerName,
            prevValue: val, currValue: 0, change: -val,
            category: 'Won', stage: prevDeal.currentStage, salesRep: prevDeal.salesRep,
          });
        } else if (stage.startsWith('Stage 8') || stage.startsWith('Stage 10') ||
                   stage.startsWith('Stage 11') || stage.startsWith('Stage 12')) {
          lostValue += val;
          lostCount++;
          dealDetails.push({
            id: key, dealName: prevDeal.dealName, customerName: prevDeal.customerName,
            prevValue: val, currValue: 0, change: -val,
            category: 'Lost', stage: prevDeal.currentStage, salesRep: prevDeal.salesRep,
          });
        } else {
          lostValue += val;
          lostCount++;
          dealDetails.push({
            id: key, dealName: prevDeal.dealName, customerName: prevDeal.customerName,
            prevValue: val, currValue: 0, change: -val,
            category: 'Lost', stage: prevDeal.currentStage || 'Unknown', salesRep: prevDeal.salesRep,
          });
        }
      }
    });

    // Format month labels
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const prevMM = parseInt(prevYYYYMM.slice(5, 7), 10);
    const currMM = parseInt(targetYYYYMM.slice(5, 7), 10);
    const prevLabel = `${monthNames[prevMM - 1]}'${prevYYYYMM.slice(2, 4)}`;
    const currLabel = `${monthNames[currMM - 1]}'${targetYYYYMM.slice(2, 4)}`;

    return {
      prevLabel, currLabel,
      startingPipeline, endingPipeline,
      newDealsValue, newDealsCount,
      increasedValue, increasedCount,
      decreasedValue, decreasedCount,
      wonValue, wonCount,
      lostValue, lostCount,
      totalChange: endingPipeline - startingPipeline,
      dealDetails,
    };
  }, [realData.isLoaded, realData.pipelineSnapshots, yearFilter, monthFilter, quarterFilter,
      regionFilter, verticalFilter, segmentFilter, logoTypeFilter, revenueTypeFilter, pipelineLookbackMonths]);

  // Reset waterfall selection when comparison data changes
  useEffect(() => { setWaterfallSelectedCategory(null); }, [snapshotComparison]);

  // Pipeline movement waterfall chart data — built from snapshot comparison
  const pipelineMovementWaterfall = useMemo(() => {
    if (!snapshotComparison) {
      // Fallback when no snapshot data available
      return [
        { name: 'Starting\nPipeline', bottom: 0, value: 0, displayValue: 0, fill: COLORS.gray, type: 'initial' as const },
        { name: 'Ending\nPipeline', bottom: 0, value: 0, displayValue: 0, fill: COLORS.gray, type: 'final' as const },
      ];
    }

    const sc = snapshotComparison;
    let runningTotal = sc.startingPipeline;

    const data: Array<{
      name: string;
      bottom: number;
      value: number;
      displayValue: number;
      fill: string;
      type: 'initial' | 'increase' | 'decrease' | 'final';
      connectTo?: number;
    }> = [];

    // Starting Pipeline
    data.push({
      name: `${sc.prevLabel}\nPipeline`,
      bottom: 0, value: sc.startingPipeline, displayValue: sc.startingPipeline,
      fill: COLORS.gray, type: 'initial', connectTo: sc.startingPipeline,
    });

    // New Deals (+)
    data.push({
      name: 'New\nDeals',
      bottom: runningTotal, value: sc.newDealsValue, displayValue: sc.newDealsValue,
      fill: COLORS.success, type: 'increase', connectTo: runningTotal + sc.newDealsValue,
    });
    runningTotal += sc.newDealsValue;

    // Value Increased (+)
    data.push({
      name: 'Value\nIncreased',
      bottom: runningTotal, value: sc.increasedValue, displayValue: sc.increasedValue,
      fill: COLORS.primary, type: 'increase', connectTo: runningTotal + sc.increasedValue,
    });
    runningTotal += sc.increasedValue;

    // Value Decreased (-)
    data.push({
      name: 'Value\nDecreased',
      bottom: runningTotal - sc.decreasedValue, value: sc.decreasedValue, displayValue: -sc.decreasedValue,
      fill: COLORS.warning, type: 'decrease', connectTo: runningTotal - sc.decreasedValue,
    });
    runningTotal -= sc.decreasedValue;

    // Won (removed from pipeline) (-)
    data.push({
      name: 'Closed\nWon',
      bottom: runningTotal - sc.wonValue, value: sc.wonValue, displayValue: -sc.wonValue,
      fill: COLORS.purple, type: 'decrease', connectTo: runningTotal - sc.wonValue,
    });
    runningTotal -= sc.wonValue;

    // Lost (-)
    data.push({
      name: 'Lost\nDeals',
      bottom: runningTotal - sc.lostValue, value: sc.lostValue, displayValue: -sc.lostValue,
      fill: COLORS.danger, type: 'decrease', connectTo: runningTotal - sc.lostValue,
    });
    runningTotal -= sc.lostValue;

    // Ending Pipeline
    data.push({
      name: `${sc.currLabel}\nPipeline`,
      bottom: 0, value: sc.endingPipeline, displayValue: sc.endingPipeline,
      fill: COLORS.gray, type: 'final',
    });

    return data;
  }, [snapshotComparison]);

  // Pipeline movement summary data for cards
  type DealMovementDetail = {
    id: string; dealName: string; customerName: string;
    prevValue: number; currValue: number; change: number;
    category: 'New' | 'Increased' | 'Decreased' | 'Won' | 'Lost';
    stage: string; salesRep: string;
  };

  const pipelineMovement = useMemo(() => {
    const emptyDetails: DealMovementDetail[] = [];
    if (!snapshotComparison) {
      return {
        totalChange: 0, newDealsCount: 0, newDealsValue: 0,
        movedOutCount: 0, movedOutValue: 0,
        lostDealsCount: 0, lostDealsValue: 0,
        increasedCount: 0, wonCount: 0, wonValue: 0,
        dealDetails: emptyDetails,
        lostDeals: emptyDetails,
        topMovers: emptyDetails,
      };
    }
    const sc = snapshotComparison;
    const details = sc.dealDetails || [];
    const lostDeals = details.filter(d => d.category === 'Lost').sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    const topMovers = [...details].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    return {
      totalChange: sc.totalChange,
      newDealsCount: sc.newDealsCount,
      newDealsValue: sc.newDealsValue,
      movedOutCount: sc.decreasedCount,
      movedOutValue: sc.decreasedValue,
      lostDealsCount: sc.lostCount,
      lostDealsValue: sc.lostValue,
      increasedCount: sc.increasedCount,
      wonCount: sc.wonCount,
      wonValue: sc.wonValue,
      dealDetails: details,
      lostDeals,
      topMovers,
    };
  }, [snapshotComparison]);


  // Render tabs
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards - Closed ACV, Weighted Pipeline, Forecast ACV, YoY Growth, Conversion, Avg Deal Size, Time to Close */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Closed ACV (YTD){revenueTypeFilter !== 'All' ? ` - ${revenueTypeFilter}` : ''}</p>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(metrics.totalClosedACV)}</p>
          <p className="text-xs text-secondary-400 mt-1">{metrics.closedWonCount} deals</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Weighted Pipeline ACV{revenueTypeFilter !== 'All' ? ` - ${revenueTypeFilter}` : ''}</p>
          <p className="text-2xl font-bold text-orange-500">{formatCurrency(metrics.weightedPipelineACV)}</p>
          <p className="text-xs text-secondary-400 mt-1">{metrics.activeDealsCount} active deals</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
            Forecast ACV{yearFilter.length === 1 ? ` (${monthFilter.length > 0 ? monthFilter.join(', ') + ' ' : quarterFilter.length > 0 ? quarterFilter.join(', ') + ' ' : ''}${yearFilter[0]})` : ''}
          </p>
          <p className="text-2xl font-bold text-blue-500">{formatCurrency(metrics.forecastACV)}</p>
          <p className="text-xs text-secondary-400 mt-1">Closed + Pipeline</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">YoY Growth</p>
          <p className={`text-2xl font-bold ${metrics.yoyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {metrics.yoyGrowth >= 0 ? '+' : ''}{metrics.yoyGrowth.toFixed(1)}%
          </p>
          <p className="text-xs text-secondary-400 mt-1">vs {formatCurrency(metrics.previousYearForecastACV)} prev yr forecast</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Conversion Rate</p>
          <p className="text-2xl font-bold text-purple-500">{formatPercent(metrics.conversionRate)}</p>
          <p className="text-xs text-secondary-400 mt-1">Won / All Closed</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Avg Deal Size</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(metrics.avgDealSize)}</p>
          <p className="text-xs text-secondary-400 mt-1">{metrics.closedWonWithValueCount} closed deals</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Time to Close</p>
          <p className="text-2xl font-bold text-secondary-900">{Math.round(metrics.avgSalesCycle)} days</p>
          <p className="text-xs text-secondary-400 mt-1">avg active deals</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Forecast by Quarter - with $ values on forecast bars */}
        <ChartWrapper
          title="Forecast by Quarter"
          subtitle="Quarterly performance vs previous year"
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
                <Bar dataKey="previousYear" name="Previous Year" fill={COLORS.gray} radius={[4, 4, 0, 0]} />
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
          <div style={{ height: Math.max(280, funnelData.length * 50 + 40) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 10, right: 80, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tick={{ fontSize: 11, fill: '#374151' }}
                  width={220}
                  tickFormatter={(v: string) => v.length > 35 ? v.slice(0, 35) + '...' : v}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === 'value' ? formatCurrency(value) : value,
                    name === 'value' ? 'Value' : 'Count'
                  ]}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  labelFormatter={(label: string) => label}
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
                <SortableHeader label="Unweighted Fee" sortKey="dealValue" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Stage" sortKey="stage" currentSort={sortConfig} onSort={handleSort} filterOptions={STAGES.filter(s => !s.includes('Closed'))} />
                <SortableHeader label="Close Date" sortKey="expectedCloseDate" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Probability" sortKey="probability" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Owner" sortKey="owner" currentSort={sortConfig} onSort={handleSort} filterOptions={ownerNames} />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {keyDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-secondary-50">
                  <td className="px-5 py-4 font-medium text-secondary-900">{deal.name}</td>
                  <td className="px-5 py-4 text-secondary-600">{deal.accountName}</td>
                  <td className="px-5 py-4 font-medium text-secondary-900">{formatCurrency(
                    (() => {
                      const prob = deal.probability > 0 ? deal.probability / 100 : 1;
                      if (revenueTypeFilter === 'Implementation') return (deal.implementationValue || 0) / prob;
                      if (revenueTypeFilter === 'License') return (deal.licenseValue || 0) / prob;
                      return ((deal.licenseValue || 0) + (deal.implementationValue || 0)) / prob;
                    })()
                  )}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-secondary-600">
                    {parseDateLocal(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
        // Revenue-type-aware closed deal value for sorting and display
        const getClosedDealVal = (d: Opportunity): number => {
          if (revenueTypeFilter === 'Implementation') return d.implementationValue || 0;
          if (revenueTypeFilter === 'License') return d.licenseValue || 0;
          return (d.licenseValue || 0) + (d.implementationValue || 0);
        };
        const closedWonDeals = filteredOpportunities
          .filter(o => o.status === 'Won' && getClosedDealVal(o) > 0)
          .sort((a, b) => getClosedDealVal(b) - getClosedDealVal(a));

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
                    {(revenueTypeFilter === 'All' || revenueTypeFilter === 'License') && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">License ACV</th>
                    )}
                    {(revenueTypeFilter === 'All' || revenueTypeFilter === 'Implementation') && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Impl ACV</th>
                    )}
                    {revenueTypeFilter === 'All' && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Closed ACV</th>
                    )}
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
                          {(revenueTypeFilter === 'All' || revenueTypeFilter === 'License') && (
                            <td className="px-4 py-3 text-right text-sm font-medium">
                              {formatCurrency(deal.licenseValue)}
                            </td>
                          )}
                          {(revenueTypeFilter === 'All' || revenueTypeFilter === 'Implementation') && (
                            <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(deal.implementationValue)}</td>
                          )}
                          {revenueTypeFilter === 'All' && (
                            <td className="px-4 py-3 text-right text-sm font-bold text-green-600">{formatCurrency(getClosedDealVal(deal))}</td>
                          )}
                          <td className="px-4 py-3 text-sm text-secondary-600 font-mono">{deal.sowId || '-'}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">
                            {parseDateLocal(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                            {(revenueTypeFilter === 'All' || revenueTypeFilter === 'License') && (
                              <td className="px-4 py-2 text-right text-sm text-secondary-600">
                                {formatCurrency(deal.licenseValue * (sc.pct / 100))}
                              </td>
                            )}
                            {(revenueTypeFilter === 'All' || revenueTypeFilter === 'Implementation') && (
                              <td className="px-4 py-2 text-right text-sm text-secondary-600">
                                {formatCurrency(deal.implementationValue * (sc.pct / 100))}
                              </td>
                            )}
                            {revenueTypeFilter === 'All' && (
                              <td className="px-4 py-2 text-right text-sm font-medium text-blue-600">
                                {formatCurrency(getClosedDealVal(deal) * (sc.pct / 100))}
                              </td>
                            )}
                            <td colSpan={2}></td>
                          </tr>
                        ))}
                        {isExpanded && !hasBreakdown && (
                          <tr className="bg-secondary-50">
                            <td className="px-3 py-2"></td>
                            <td colSpan={revenueTypeFilter === 'All' ? 8 : 6} className="px-4 py-2 text-sm text-secondary-400 italic">
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
    return (
      <div className="space-y-6">
        {/* Forecast Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <p className="text-sm font-medium text-green-600 uppercase tracking-wider">Closed ACV{revenueTypeFilter !== 'All' ? ` (${revenueTypeFilter})` : ''}</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{formatCurrency(metrics.totalClosedACV)}</p>
            <p className="text-sm text-green-600 mt-1">{revenueTypeFilter !== 'All' ? `${revenueTypeFilter} only` : 'License + Implementation'} (YTD)</p>
          </div>
          <div className="card p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Weighted Pipeline ACV{revenueTypeFilter !== 'All' ? ` (${revenueTypeFilter})` : ''}</p>
            <p className="text-3xl font-bold text-orange-900 mt-2">{formatCurrency(metrics.weightedPipelineACV)}</p>
            <p className="text-sm text-orange-600 mt-1">{revenueTypeFilter !== 'All' ? `${revenueTypeFilter} only` : 'License + Implementation'} (probability-adjusted)</p>
          </div>
          <div className="card p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
            <p className="text-sm font-medium text-primary-600 uppercase tracking-wider">Forecast ACV</p>
            <p className="text-3xl font-bold text-primary-900 mt-2">{formatCurrency(metrics.forecastACV)}</p>
            <p className="text-sm text-primary-600 mt-1">Closed + Weighted Pipeline</p>
          </div>
        </div>
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600 uppercase tracking-wider">Forecast ACV Breakdown</p>
              <p className="text-4xl font-bold text-primary-900 mt-2">{formatCurrency(metrics.forecastACV)}</p>
              <p className="text-sm text-primary-600 mt-1">Closed ACV ({formatCurrency(metrics.totalClosedACV)}) + Weighted Pipeline ({formatCurrency(metrics.weightedPipelineACV)})</p>
            </div>
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Regional Performance vs Previous Year */}
        <ChartWrapper
          title="Regional Performance vs Previous Year"
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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Previous Year</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Variance</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">YoY Growth</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {regionalForecastData.map((region) => (
                  <tr key={region.region} className="hover:bg-secondary-50">
                    <td className="px-4 py-4 font-medium text-secondary-900">{region.region}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(region.closedACV)}</td>
                    <td className="px-4 py-4 text-right font-medium text-secondary-900">{formatCurrency(region.forecast)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(region.previousYearACV)}</td>
                    <td className={`px-4 py-4 text-right font-medium ${region.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {region.variance >= 0 ? '+' : ''}{formatCurrency(region.variance)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-medium ${region.yoyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {region.yoyGrowth >= 0 ? '+' : ''}{region.yoyGrowth}%
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        region.yoyGrowth >= 10 ? 'bg-green-100 text-green-800' :
                        region.yoyGrowth >= 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {region.yoyGrowth >= 10 ? 'Growing' : region.yoyGrowth >= 0 ? 'Flat' : 'Declining'}
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
          // Revenue-type-aware value getters
          const getClosedVal = (o: Opportunity): number => {
            if (revenueTypeFilter === 'Implementation') return o.implementationValue || 0;
            if (revenueTypeFilter === 'License') return o.licenseValue || 0;
            return (o.licenseValue || 0) + (o.implementationValue || 0);
          };
          const getPipeVal = (o: Opportunity): number => {
            if (revenueTypeFilter === 'Implementation') return o.implementationValue || 0;
            if (revenueTypeFilter === 'License') return o.licenseValue || 0;
            return (o.licenseValue || 0) + (o.implementationValue || 0);
          };
          // Cumulative closed won by month + weighted pipeline by expected close month
          const wonDeals = filteredOpportunities.filter(o => o.status === 'Won');
          const activeDeals = filteredOpportunities.filter(o => o.status === 'Active' || o.status === 'Stalled');
          const monthlyWon: Record<string, number> = {};
          const monthlyPipeline: Record<string, number> = {};
          wonDeals.forEach(d => {
            const m = monthNames[parseDateLocal(d.expectedCloseDate).getMonth()];
            monthlyWon[m] = (monthlyWon[m] || 0) + getClosedVal(d);
          });
          activeDeals.forEach(d => {
            const m = monthNames[parseDateLocal(d.expectedCloseDate).getMonth()];
            monthlyPipeline[m] = (monthlyPipeline[m] || 0) + getPipeVal(d);
          });
          // Build cumulative forecast trend with previous year comparison
          let cumulative = 0;
          // Previous year cumulative closed ACV by month
          const prevYearWonDeals = previousYearOpportunities.filter(o => o.status === 'Won');
          const monthlyPrevYear: Record<string, number> = {};
          prevYearWonDeals.forEach(d => {
            const m = monthNames[parseDateLocal(d.expectedCloseDate).getMonth()];
            monthlyPrevYear[m] = (monthlyPrevYear[m] || 0) + getClosedVal(d);
          });
          let cumulativePrevYear = 0;
          const forecastTrendData = monthNames.map(m => {
            cumulative += (monthlyWon[m] || 0) + (monthlyPipeline[m] || 0);
            cumulativePrevYear += (monthlyPrevYear[m] || 0);
            return { month: m, forecast: Math.round(cumulative), previousYear: Math.round(cumulativePrevYear) };
          }).filter(d => d.forecast > 0 || d.previousYear > 0);
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
                <Line type="monotone" dataKey="previousYear" name="Previous Year" stroke={COLORS.gray} strokeWidth={2} strokeDasharray="5 5" dot={false} />
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
      {/* Month-over-Month Comparison Info + Lookback Filter */}
      {snapshotComparison && (
        <div className="card p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-secondary-700">Comparing:</span>
            <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary-100 text-primary-700">
              {snapshotComparison.prevLabel} → {snapshotComparison.currLabel}
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs font-medium text-secondary-500">Look Back:</span>
              {[
                { label: '1M', value: 1 },
                { label: '3M', value: 3 },
                { label: '6M', value: 6 },
                { label: '12M', value: 12 },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPipelineLookbackMonths(opt.value)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    pipelineLookbackMonths === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Value Decreased</p>
          <p className="text-3xl font-bold text-orange-500">{pipelineMovement.movedOutCount}</p>
          <p className="text-xs text-secondary-400 mt-1">{formatCurrency(pipelineMovement.movedOutValue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Closed Won</p>
          <p className="text-3xl font-bold text-purple-500">{pipelineMovement.wonCount}</p>
          <p className="text-xs text-secondary-400 mt-1">{formatCurrency(pipelineMovement.wonValue)}</p>
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
        subtitle={snapshotComparison ? `${snapshotComparison.prevLabel} snapshot → ${snapshotComparison.currLabel} snapshot` : 'Month-over-month pipeline comparison'}
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
                cursor="pointer"
                onClick={(_data: any, index: number) => {
                  const categoryMap: Record<number, string> = { 1: 'New', 2: 'Increased', 3: 'Decreased', 4: 'Won', 5: 'Lost' };
                  const cat = categoryMap[index];
                  if (cat) {
                    setWaterfallSelectedCategory(prev => prev === cat ? null : cat);
                  } else {
                    setWaterfallSelectedCategory(null);
                  }
                }}
              >
                {pipelineMovementWaterfall.map((entry, index) => {
                  const categoryMap: Record<number, string> = { 1: 'New', 2: 'Increased', 3: 'Decreased', 4: 'Won', 5: 'Lost' };
                  const cat = categoryMap[index];
                  const isSelected = waterfallSelectedCategory === cat;
                  const isClickable = !!cat;
                  const dimmed = waterfallSelectedCategory && !isSelected && isClickable;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      fillOpacity={dimmed ? 0.3 : 1}
                      stroke={isSelected ? '#1e293b' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  );
                })}
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
            <strong>How to read:</strong> Previous Month Pipeline + New Deals + Value Increased - Value Decreased - Closed Won - Lost = Current Month Pipeline
          </p>
        </div>
      </ChartWrapper>

      {/* Active waterfall filter indicator */}
      {waterfallSelectedCategory && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary-50 border border-primary-200 rounded-lg">
          <span className="text-sm font-medium text-primary-700">
            Showing deals: <strong>{waterfallSelectedCategory}</strong>
          </span>
          <button
            onClick={() => setWaterfallSelectedCategory(null)}
            className="ml-auto px-2.5 py-1 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-md hover:bg-primary-100 transition-colors"
          >
            Clear Filter
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Deal Movement Table — top movers by absolute change */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-secondary-900">Key Deal Movement</h2>
            <button
              onClick={() => exportToCSV(pipelineMovement.topMovers, 'deal_movement')}
              className="px-2 py-0.5 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full" style={{ fontSize: '0.7rem' }}>
              <thead className="bg-secondary-50 sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Deal</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Account</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Previous</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Current</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Change</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {(waterfallSelectedCategory
                  ? pipelineMovement.topMovers.filter(d => d.category === waterfallSelectedCategory)
                  : pipelineMovement.topMovers
                ).slice(0, 10).map((deal) => (
                  <tr key={deal.id} className={`${deal.change > 0 ? 'bg-green-50' : deal.change < 0 ? 'bg-red-50' : ''}`}>
                    <td className="px-2 py-1.5 font-medium text-secondary-900 truncate max-w-[120px]">{deal.dealName}</td>
                    <td className="px-2 py-1.5 text-secondary-600 truncate max-w-[100px]">{deal.customerName}</td>
                    <td className="px-2 py-1.5 text-right text-secondary-600">{formatCurrency(deal.prevValue)}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-secondary-900">{formatCurrency(deal.currValue)}</td>
                    <td className={`px-2 py-1.5 text-right font-medium ${deal.change > 0 ? 'text-green-600' : deal.change < 0 ? 'text-red-600' : 'text-secondary-400'}`}>
                      {deal.change > 0 ? '+' : ''}{formatCurrency(deal.change)}
                      {deal.prevValue > 0 ? ` (${((deal.change / deal.prevValue) * 100).toFixed(0)}%)` : ''}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${
                        deal.category === 'New' ? 'bg-blue-100 text-blue-800' :
                        deal.category === 'Increased' ? 'bg-green-100 text-green-800' :
                        deal.category === 'Decreased' ? 'bg-amber-100 text-amber-800' :
                        deal.category === 'Won' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-red-100 text-red-800'
                      }`} style={{ fontSize: '0.6rem' }}>
                        {deal.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lost Deals Analysis */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-secondary-900">Lost Deals Analysis</h2>
            <button
              onClick={() => exportToCSV(pipelineMovement.lostDeals, 'lost_deals')}
              className="px-2 py-0.5 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full" style={{ fontSize: '0.7rem' }}>
              <thead className="bg-secondary-50 sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Deal Name</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Account</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Value</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Stage Lost At</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {(waterfallSelectedCategory && waterfallSelectedCategory !== 'Lost') ? (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-secondary-400 text-xs">Select "Lost Deals" on the waterfall chart or clear filter to view</td></tr>
                ) : pipelineMovement.lostDeals.length === 0 ? (
                  <tr><td colSpan={5} className="px-2 py-6 text-center text-secondary-400 text-xs">No lost deals in this period</td></tr>
                ) : pipelineMovement.lostDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-secondary-50">
                    <td className="px-2 py-1.5 font-medium text-secondary-900 truncate max-w-[120px]">{deal.dealName}</td>
                    <td className="px-2 py-1.5 text-secondary-600 truncate max-w-[100px]">{deal.customerName}</td>
                    <td className="px-2 py-1.5 text-right font-medium text-red-600">{formatCurrency(Math.abs(deal.prevValue))}</td>
                    <td className="px-2 py-1.5 text-secondary-600">{deal.stage}</td>
                    <td className="px-2 py-1.5 text-secondary-600 truncate max-w-[80px]">{deal.salesRep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* All Deal Movement Table — searchable by deal name */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-secondary-200 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-secondary-900">All Deal Movement</h2>
            <p className="text-xs text-secondary-500">
              {snapshotComparison ? `${snapshotComparison.prevLabel} → ${snapshotComparison.currLabel}` : 'Month-over-month deal changes'}
              {' — '}{waterfallSelectedCategory
                ? `${pipelineMovement.dealDetails.filter(d => d.category === waterfallSelectedCategory).length} ${waterfallSelectedCategory.toLowerCase()} deals`
                : `${pipelineMovement.dealDetails.length} deals with movement`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by deal name..."
              className="px-2 py-1 text-xs border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              onChange={(e) => {
                const el = e.target.closest('.card')?.querySelector('[data-deal-filter]');
                if (el) (el as HTMLElement).dataset.dealFilter = e.target.value.toLowerCase();
                e.target.closest('.card')?.querySelectorAll('[data-deal-row]').forEach((row) => {
                  const name = (row as HTMLElement).dataset.dealRow || '';
                  (row as HTMLElement).style.display = name.includes(e.target.value.toLowerCase()) ? '' : 'none';
                });
              }}
            />
            <button
              onClick={() => exportToCSV(pipelineMovement.dealDetails, 'all_deal_movement')}
              className="px-2 py-1 text-xs border border-secondary-200 rounded-lg hover:bg-secondary-50 flex items-center gap-2"
            >
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full" style={{ fontSize: '0.7rem' }}>
            <thead className="bg-secondary-50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Deal Name</th>
                <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Account</th>
                <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Category</th>
                <th className="px-2 py-1.5 text-right font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Prev Value</th>
                <th className="px-2 py-1.5 text-right font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Curr Value</th>
                <th className="px-2 py-1.5 text-right font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Change</th>
                <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Stage</th>
                <th className="px-2 py-1.5 text-left font-semibold text-secondary-500 uppercase" style={{ fontSize: '0.6rem' }}>Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {pipelineMovement.dealDetails.length === 0 ? (
                <tr><td colSpan={8} className="px-2 py-6 text-center text-secondary-400 text-xs">No deal movement in this period</td></tr>
              ) : (waterfallSelectedCategory
                ? pipelineMovement.dealDetails.filter(d => d.category === waterfallSelectedCategory)
                : pipelineMovement.dealDetails
              )
                .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                .map((deal) => (
                <tr key={deal.id} data-deal-row={deal.dealName.toLowerCase()} className={`hover:bg-secondary-50 ${
                  deal.category === 'Won' ? 'bg-emerald-50/50' :
                  deal.category === 'Lost' ? 'bg-red-50/50' :
                  deal.change > 0 ? 'bg-green-50/50' :
                  deal.change < 0 ? 'bg-red-50/30' : ''
                }`}>
                  <td className="px-2 py-1.5 font-medium text-secondary-900 truncate max-w-[110px]">{deal.dealName}</td>
                  <td className="px-2 py-1.5 text-secondary-600 truncate max-w-[90px]">{deal.customerName}</td>
                  <td className="px-2 py-1.5">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full font-medium ${
                      deal.category === 'New' ? 'bg-blue-100 text-blue-800' :
                      deal.category === 'Increased' ? 'bg-green-100 text-green-800' :
                      deal.category === 'Decreased' ? 'bg-amber-100 text-amber-800' :
                      deal.category === 'Won' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-red-100 text-red-800'
                    }`} style={{ fontSize: '0.6rem' }}>
                      {deal.category}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right text-secondary-600">{formatCurrency(deal.prevValue)}</td>
                  <td className="px-2 py-1.5 text-right font-medium text-secondary-900">{formatCurrency(deal.currValue)}</td>
                  <td className={`px-2 py-1.5 text-right font-medium ${deal.change > 0 ? 'text-green-600' : deal.change < 0 ? 'text-red-600' : 'text-secondary-400'}`}>
                    {deal.change > 0 ? '+' : ''}{formatCurrency(deal.change)}
                  </td>
                  <td className="px-2 py-1.5 text-secondary-600 truncate max-w-[80px]">{deal.stage}</td>
                  <td className="px-2 py-1.5 text-secondary-600 truncate max-w-[70px]">{deal.salesRep}</td>
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
    // Check if this is a historical CSV year (flat list, no hierarchy)
    const isHistoricalCSV = salespeople.length > 0 && salespeople.every(sp => !sp.isManager);

    let processed: (Salesperson & { pipelineCoverage: number; forecastAttainment: number; level: number })[];

    if (isHistoricalCSV) {
      // Historical year from CSV: flat list, simple metrics, no manager rollup
      // Coverage = (Closed YTD + Unweighted Pipeline) / Quota
      // Forecast Attainment = Forecast / Quota
      processed = salespeople.map(sp => {
        const pipelineCoverage = sp.quota > 0 ? (sp.closedYTD + sp.unweightedPipeline) / sp.quota : 0;
        const forecastAttainment = sp.quota > 0 ? (sp.forecast / sp.quota) * 100 : 0;
        return { ...sp, pipelineCoverage, forecastAttainment, level: 0 };
      });
    } else {
      // Current year: full manager hierarchy with cascading rollup
      const spById = new Map(salespeople.map(sp => [sp.id, sp]));

      const rollupCache = new Map<string, { closed: number; forecast: number; pipeline: number; unweightedPipeline: number; quota: number }>();
      const getRollup = (id: string): { closed: number; forecast: number; pipeline: number; unweightedPipeline: number; quota: number } => {
        if (rollupCache.has(id)) return rollupCache.get(id)!;
        const person = spById.get(id);
        if (!person) return { closed: 0, forecast: 0, pipeline: 0, unweightedPipeline: 0, quota: 0 };

        const result = {
          closed: person.closedYTD,
          forecast: person.forecast,
          pipeline: person.pipelineValue,
          unweightedPipeline: person.unweightedPipeline,
          quota: person.quota,
        };

        const directReports = salespeople.filter(s => s.managerId === id && s.id !== id);
        for (const report of directReports) {
          const sub = getRollup(report.id);
          result.closed += sub.closed;
          result.forecast += sub.forecast;
          result.pipeline += sub.pipeline;
          result.unweightedPipeline += sub.unweightedPipeline;
          result.quota += sub.quota;
        }

        rollupCache.set(id, result);
        return result;
      };

      const salespeopleWithTotals = salespeople.map(sp => {
        if (sp.isManager) {
          const rollup = getRollup(sp.id);
          // Coverage = (Closed YTD + Unweighted Pipeline) / Quota
          const mgrCoverage = rollup.quota > 0 ? (rollup.closed + rollup.unweightedPipeline) / rollup.quota : 0;
          const mgrForecastAtt = rollup.quota > 0 ? (rollup.forecast / rollup.quota) * 100 : 0;
          return { ...sp, level: 0 as number, closedYTD: rollup.closed, forecast: rollup.forecast,
            pipelineValue: rollup.pipeline, unweightedPipeline: rollup.unweightedPipeline,
            quota: rollup.quota, pipelineCoverage: mgrCoverage, forecastAttainment: mgrForecastAtt };
        }
        // Coverage = (Closed YTD + Unweighted Pipeline) / Quota
        const pipelineCoverage = sp.quota > 0 ? (sp.closedYTD + sp.unweightedPipeline) / sp.quota : 0;
        const forecastAttainment = sp.quota > 0 ? (sp.forecast / sp.quota) * 100 : 0;
        return { ...sp, level: 0 as number, pipelineCoverage, forecastAttainment };
      });

      // Build cascading hierarchical order
      const totalsById = new Map(salespeopleWithTotals.map(sp => [sp.id, sp]));
      const cascaded: typeof salespeopleWithTotals = [];
      const visited = new Set<string>();

      const addWithChildren = (id: string, level: number) => {
        if (visited.has(id)) return;
        visited.add(id);
        const person = totalsById.get(id);
        if (person) {
          cascaded.push({ ...person, level });
          const directReports = salespeopleWithTotals
            .filter(s => s.managerId === id && s.id !== id)
            .sort((a, b) => {
              if (a.isManager !== b.isManager) return a.isManager ? -1 : 1;
              return a.name.localeCompare(b.name);
            });
          for (const report of directReports) {
            addWithChildren(report.id, level + 1);
          }
        }
      };

      const topLevel = salespeopleWithTotals
        .filter(sp => !sp.managerId)
        .sort((a, b) => a.name.localeCompare(b.name));
      for (const top of topLevel) {
        addWithChildren(top.id, 0);
      }
      for (const sp of salespeopleWithTotals) {
        if (!visited.has(sp.id)) {
          cascaded.push({ ...sp, level: 0 });
        }
      }

      processed = cascaded;
    }

    // Apply table-specific column filters
    let filteredSalespeople = processed;

    if (tableColumnFilters.region && tableColumnFilters.region.length > 0) {
      filteredSalespeople = filteredSalespeople.filter(sp => tableColumnFilters.region.includes(sp.region));
    }

    if (tableColumnFilters.name && tableColumnFilters.name.length > 0) {
      filteredSalespeople = filteredSalespeople.filter(sp => tableColumnFilters.name.includes(sp.name));
    }

    // When sorting is active, sort within the flat list (overrides cascading order)
    if (sortConfig) {
      filteredSalespeople = [...filteredSalespeople].sort((a: any, b: any) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal?.toLowerCase() || ''; }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return { filteredSalespeople, salespeopleWithTotals: processed };
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
                  Quota: sp.quota,
                  ClosedYTD: sp.closedYTD,
                  WeightedPipeline: sp.pipelineValue,
                  UnweightedPipeline: sp.unweightedPipeline,
                  Forecast: sp.forecast,
                  PreviousYear: sp.previousYearClosed,
                  Coverage: sp.pipelineCoverage.toFixed(2),
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
                    filterOptions={salespersonNames}
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
                    label="Quota"
                    sortKey="quota"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Closed (YTD)"
                    sortKey="closedYTD"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Wtd Pipeline"
                    sortKey="pipelineValue"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Unwt Pipeline"
                    sortKey="unweightedPipeline"
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
                    label="Prev Year"
                    sortKey="previousYearClosed"
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
                    label="Forecast vs Quota"
                    sortKey="forecastAttainment"
                    currentSort={sortConfig}
                    onSort={handleSort}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredSalespeople.map((sp) => {
                  const indent = (sp.level || 0) * 20; // 20px per hierarchy level
                  const bgClass = sp.isManager
                    ? (sp.level || 0) === 0 ? 'bg-blue-50 font-semibold' : 'bg-blue-50/50 font-medium'
                    : '';
                  return (
                  <tr key={sp.id} className={`hover:bg-secondary-50 ${bgClass}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2" style={{ paddingLeft: indent }}>
                        {sp.isManager && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            MGR
                          </span>
                        )}
                        <span className="text-secondary-900">{sp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-secondary-600">{sp.region}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(sp.quota)}</td>
                    <td className="px-4 py-4 text-right text-green-600">{formatCurrency(sp.closedYTD)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(sp.pipelineValue)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(sp.unweightedPipeline)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(sp.forecast)}</td>
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(sp.previousYearClosed)}</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-medium ${sp.pipelineCoverage >= 1.5 ? 'text-green-600' : sp.pipelineCoverage >= 1 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sp.pipelineCoverage.toFixed(1)}x
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-medium ${sp.forecastAttainment >= 100 ? 'text-green-600' : sp.forecastAttainment >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {sp.forecastAttainment.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                  );
                })}
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
            title="Top Performers vs Previous Year"
            data={salespeople
              .filter(sp => !sp.isManager)
              .map(sp => ({
                name: sp.name.split(' ')[0],
                attainment: sp.previousYearClosed > 0 ? Math.round(((sp.closedYTD + sp.forecast) / sp.previousYearClosed) * 100) : 0,
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
                      attainment: sp.previousYearClosed > 0 ? Math.round(((sp.closedYTD + sp.forecast) / sp.previousYearClosed) * 100) : 0,
                    }))
                    .sort((a, b) => b.attainment - a.attainment)
                    .slice(0, 8)
                  }
                  margin={{ top: 0, right: 30, left: 60, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 200]} tickFormatter={(v) => `${v}%`} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#64748b' }} width={55} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'vs Previous Year']} />
                  <Bar dataKey="attainment" fill={COLORS.primary} radius={[0, 4, 4, 0]}>
                    {salespeople.filter(sp => !sp.isManager).slice(0, 8).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index < 3 ? COLORS.success : COLORS.primary}
                      />
                    ))}
                  </Bar>
                  <ReferenceLine x={100} stroke={COLORS.gray} strokeWidth={2} strokeDasharray="5 5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartWrapper>
        </div>

        {/* Pipeline Coverage vs Previous Year */}
        <ChartWrapper
          title="Pipeline Coverage by Rep"
          subtitle="Pipeline as multiple of previous year closed (1x line shown)"
          data={salespeople
            .filter(sp => !sp.isManager)
            .map(sp => ({
              name: sp.name.split(' ')[0],
              coverage: sp.previousYearClosed > 0 ? parseFloat((sp.pipelineValue / sp.previousYearClosed).toFixed(1)) : 0,
            }))
          }
          filename="pipeline_coverage"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salespeople
                  .filter(sp => !sp.isManager)
                  .map(sp => ({
                    name: sp.name.split(' ')[0],
                    coverage: sp.previousYearClosed > 0 ? parseFloat((sp.pipelineValue / sp.previousYearClosed).toFixed(1)) : 0,
                  }))
                }
                margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `${v}x`} />
                <Tooltip formatter={(value: number) => [`${value}x`, 'vs Prev Year']} />
                <Bar dataKey="coverage" fill={COLORS.purple} radius={[4, 4, 0, 0]}>
                  {salespeople.filter(sp => !sp.isManager).map((sp, index) => {
                    const coverage = sp.previousYearClosed > 0 ? sp.pipelineValue / sp.previousYearClosed : 0;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={coverage >= 1.5 ? COLORS.success : coverage >= 1 ? COLORS.warning : COLORS.danger}
                      />
                    );
                  })}
                </Bar>
                <ReferenceLine y={1} stroke={COLORS.gray} strokeWidth={2} strokeDasharray="5 5" />
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
          {((yearFilter.length !== 1 || yearFilter[0] !== '2026') || quarterFilter.length > 0 || monthFilter.length > 0 || regionFilter.length > 0 || verticalFilter.length > 0 || segmentFilter.length > 0 || logoTypeFilter.length > 0 || channelFilter.length > 0 || soldByFilter !== 'All' || revenueTypeFilter !== 'License' || productCategoryFilter.length > 0 || productSubCategoryFilter.length > 0) && (
            <button
              onClick={() => {
                setYearFilter(['2026']);
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
            { id: 'quota', label: 'YoY Performance' },
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
