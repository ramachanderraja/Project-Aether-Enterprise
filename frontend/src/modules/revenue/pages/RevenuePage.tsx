import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ReferenceLine,
  LabelList,
} from 'recharts';
import { useSOWMappingStore } from '@shared/store/sowMappingStore';
import { normalizeRegion } from '@shared/store/dataTypes';
import { useRevenueDataStore, type RevenueDataState } from '@shared/store/revenueDataStore';

// ==================== TYPE DEFINITIONS ====================

interface Customer {
  id: string;
  name: string;
  sowId: string;                  // Unique contract identifier (Change 1)
  currentARR: number;
  previousARR: number;
  region: string;
  vertical: string;
  segment: 'Enterprise' | 'SMB';
  platform: string;               // Quantum, SMART, Cost Drivers, Opus
  quantumSmart?: 'Quantum' | 'SMART';  // Platform classification (Change 5/6)
  quantumGoLiveDate?: string;          // Migration date - takes precedence (Change 5/6)
  feesType?: 'Fees' | 'Travel';        // From SOW Mapping (Change 4)
  products: string[];
  productARR: Record<string, number>;
  productSubCategory: string;     // From Product Category Mapping (Change 1/2)
  contractStartDate: string;
  contractEndDate: string;
  renewalDate: string;
  renewalRiskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  movementType?: 'New' | 'Expansion' | 'Contraction' | 'Churn' | 'ScheduleChange' | 'Flat';  // Added ScheduleChange (Change 8)
  movementReason?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  totalARR: number;
  customerCount: number;
  avgARRPerCustomer: number;
  growthPercent: number;
}

interface ARRMovementRecord {
  date: string;
  newBusiness: number;
  expansion: number;
  scheduleChange: number;         // Added (Change 8) - pre-agreed contract schedule changes
  contraction: number;
  churn: number;
  netChange: number;
}

interface MonthlyARR {
  month: string;
  currentARR: number;
  forecastedARR: number;
  // Forecast breakdown components (stacked)
  forecastBase: number;       // Last actual Ending ARR (carried forward)
  forecastRenewals: number;   // Cumulative Renewal + Extension pipeline
  forecastNewBusiness: number; // Cumulative New Logo + Upsell + Cross-Sell pipeline
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

// ==================== CONSTANTS ====================
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
const PLATFORMS = ['Quantum', 'SMART', 'Cost Drivers', 'Opus'];
const PLATFORM_FILTER_OPTIONS = ['All', 'Quantum', 'SMART'];  // For Quantum/SMART filter (Change 5)
const DEFAULT_PLATFORMS = ['Quantum', 'SMART', 'Cost Drivers']; // Default selected platforms
const REVENUE_TYPES = ['All', 'Fees', 'Travel'];  // Revenue Type filter options (Fees_Type from SOW Mapping)


const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#64748b',
  teal: '#14b8a6',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

// Utility function to classify platform based on Quantum/SMART rules (Change 5/6)
const classifyPlatform = (quantumSmart: string | undefined, quantumGoLiveDate: string | undefined, snapshotMonth: string): 'Quantum' | 'SMART' => {
  if (quantumGoLiveDate) {
    return snapshotMonth >= quantumGoLiveDate ? 'Quantum' : 'SMART';
  }
  return (quantumSmart as 'Quantum' | 'SMART') || 'SMART';
};

// ==================== REAL DATA BUILDERS ====================

// Compute the "prior month" YYYY-MM string (month before the user's current date)
function getPriorMonth(): string {
  const now = new Date();
  const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const y = prior.getFullYear();
  const m = String(prior.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// Format a YYYY-MM string to a display label like "Jan 2026"
function formatMonthLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

function buildRealCustomers(store: RevenueDataState): Customer[] {
  const priorMonth = getPriorMonth(); // e.g. "2026-01"

  // Group ARR snapshots by SOW_ID, only include months <= prior month
  const sowGroups = new Map<string, (typeof store.arrSnapshots)>();
  store.arrSnapshots.forEach(row => {
    const rowMonth = row.Snapshot_Month.slice(0, 7); // YYYY-MM
    if (rowMonth > priorMonth) return; // Skip future months
    const key = row.SOW_ID;
    if (!sowGroups.has(key)) sowGroups.set(key, []);
    sowGroups.get(key)!.push(row);
  });

  const year = new Date().getFullYear();
  const result: Customer[] = [];

  sowGroups.forEach((rows, sowId) => {
    // Sort by Snapshot_Month descending → latest first (up to prior month)
    rows.sort((a, b) => b.Snapshot_Month.localeCompare(a.Snapshot_Month));
    const latest = rows[0];
    const previous = rows.length > 1 ? rows[1] : null;

    const currentARR = latest.Ending_ARR;
    const previousARR = previous ? previous.Ending_ARR : latest.Starting_ARR;

    // Enrich from SOW Mapping
    const sowMapping = store.sowMappingIndex[sowId];
    const region = latest.Region || (sowMapping ? normalizeRegion(sowMapping.Region) : 'North America');
    const vertical = latest.Vertical || (sowMapping ? sowMapping.Vertical : 'Other Services');
    const segment = latest.Segment || (sowMapping ? sowMapping.Segment_Type : 'Enterprise');
    const feesType = (sowMapping?.Fees_Type as 'Fees' | 'Travel') || 'Fees';

    // Determine movement type from latest month's columns
    let movementType: Customer['movementType'] = 'Flat';
    if (latest.New_ARR > 0) movementType = 'New';
    else if (latest.Expansion_ARR > 0) movementType = 'Expansion';
    else if (Math.abs(latest.Schedule_Change) > 0) movementType = 'ScheduleChange';
    else if (latest.Contraction_ARR < 0) movementType = 'Contraction';
    else if (latest.Churn_ARR < 0) movementType = 'Churn';

    // Products from ARR sub-category breakdown
    const subCats = store.arrSubCategoryBreakdown.filter(s => s.SOW_ID === sowId);
    const prods = subCats.map(s => s.Product_Sub_Category).filter(Boolean);
    const productARR: Record<string, number> = {};
    subCats.forEach(s => {
      const pct = year <= 2024 ? s.Pct_2024 : year === 2025 ? s.Pct_2025 : s.Pct_2026;
      if (pct > 0) productARR[s.Product_Sub_Category] = Math.round(currentARR * (pct / 100));
    });

    const productSubCategory = prods.length > 0
      ? prods.sort((a, b) => (productARR[b] || 0) - (productARR[a] || 0))[0]
      : 'Unallocated';

    // Renewal risk
    let renewalRiskLevel: Customer['renewalRiskLevel'];
    if (latest.Renewal_Risk) {
      const riskMap: Record<string, Customer['renewalRiskLevel']> = {
        'Low': 'Low', 'Medium': 'Medium', 'High': 'High', 'Critical': 'Critical',
      };
      renewalRiskLevel = riskMap[latest.Renewal_Risk];
    }

    // Contract dates
    const contractStartDate = latest.Contract_Start_Date || sowMapping?.Start_Date || '2022-01-01';
    const contractEndDate = latest.Contract_End_Date || '2026-12-31';

    // Quantum/SMART
    const qSmart = latest.Quantum_SMART === 'Quantum' ? 'Quantum' : 'SMART';

    result.push({
      id: `CUST-${sowId}`,
      name: latest.Customer_Name,
      sowId: String(sowId),
      currentARR: Math.round(currentARR),
      previousARR: Math.round(previousARR),
      region,
      vertical,
      segment: (segment === 'SMB' ? 'SMB' : 'Enterprise') as 'Enterprise' | 'SMB',
      platform: latest.Quantum_SMART || 'SMART',
      quantumSmart: qSmart as 'Quantum' | 'SMART',
      quantumGoLiveDate: latest.Quantum_GoLive_Date || undefined,
      feesType,
      products: prods.length > 0 ? prods : [productSubCategory],
      productARR,
      productSubCategory,
      contractStartDate,
      contractEndDate,
      renewalDate: contractEndDate,
      renewalRiskLevel,
      movementType,
    });
  });

  return result;
}

function buildRealMonthlyARR(
  store: RevenueDataState,
  arrFilter: (row: RevenueDataState['arrSnapshots'][0]) => boolean,
  pipelineFilter: (row: RevenueDataState['pipelineSnapshots'][0]) => boolean,
): MonthlyARR[] {
  const priorMonth = getPriorMonth(); // Actual data cutoff (e.g. "2026-01")

  // 1. Aggregate actual Ending_ARR by month from ARR snapshots (ALL months, with filters)
  //    Months <= priorMonth are "actual"; months > priorMonth provide the base ARR for forecasting
  const actualMonthMap = new Map<string, number>();
  store.arrSnapshots.forEach(row => {
    const month = row.Snapshot_Month.slice(0, 7); // YYYY-MM
    if (arrFilter(row)) {
      actualMonthMap.set(month, (actualMonthMap.get(month) || 0) + row.Ending_ARR);
    }
  });

  // 2. Build the actual data points (Jan 2024 to prior month)
  const data: MonthlyARR[] = [];
  const startDate = new Date(2024, 0, 1); // Jan 2024
  const priorDate = new Date(parseInt(priorMonth.slice(0, 4)), parseInt(priorMonth.slice(5, 7)) - 1, 1);

  let lastActualARR = 0;
  const cursor = new Date(startDate);
  while (cursor <= priorDate) {
    const ym = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = cursor.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const endingARR = actualMonthMap.get(ym) || 0;
    if (endingARR > 0) lastActualARR = endingARR;
    data.push({
      month: monthLabel,
      currentARR: Math.round(endingARR),
      forecastedARR: 0,
      forecastBase: 0,
      forecastRenewals: 0,
      forecastNewBusiness: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // 3. Build pipeline forecast by month, split by logo type (latest snapshot only, with filters)
  // Pipeline values (License_ACV) are already weighted (pre-multiplied by probability)
  // Renewal logo types: Renewal, Extension (Extension = Renewal per business rules)
  // New business logo types: New Logo, Upsell, Cross-Sell
  let latestSnapshotMonth = '';
  store.pipelineSnapshots.forEach(row => {
    if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month;
  });

  const RENEWAL_TYPES = new Set(['Renewal', 'Extension']);
  const renewalByMonth = new Map<string, number>();
  const newBizByMonth = new Map<string, number>();
  store.pipelineSnapshots.forEach(row => {
    if (row.Snapshot_Month !== latestSnapshotMonth) return;
    if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
        row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
    if (!pipelineFilter(row)) return;
    const closeMonth = row.Expected_Close_Date.slice(0, 7);
    if (closeMonth <= priorMonth) return;
    const logoType = row.Logo_Type.trim();
    if (RENEWAL_TYPES.has(logoType)) {
      renewalByMonth.set(closeMonth, (renewalByMonth.get(closeMonth) || 0) + row.License_ACV);
    } else {
      newBizByMonth.set(closeMonth, (newBizByMonth.get(closeMonth) || 0) + row.License_ACV);
    }
  });

  // 4. Generate forecast months (month after prior through Dec 2026)
  const endDate = new Date(2026, 11, 1); // Dec 2026
  const forecastStart = new Date(priorDate);
  forecastStart.setMonth(forecastStart.getMonth() + 1);

  let cumulativeRenewals = 0;
  let cumulativeNewBiz = 0;
  const fc = new Date(forecastStart);
  while (fc <= endDate) {
    const ym = `${fc.getFullYear()}-${String(fc.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = fc.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    cumulativeRenewals += (renewalByMonth.get(ym) || 0);
    cumulativeNewBiz += (newBizByMonth.get(ym) || 0);
    // Use per-month actual ARR as base (from snapshot) if available, else fall back to lastActualARR
    const monthBaseARR = actualMonthMap.get(ym) || lastActualARR;
    const totalForecast = monthBaseARR + cumulativeRenewals + cumulativeNewBiz;
    data.push({
      month: monthLabel,
      currentARR: 0,
      forecastedARR: Math.round(totalForecast),
      forecastBase: Math.round(monthBaseARR),
      forecastRenewals: Math.round(cumulativeRenewals),
      forecastNewBusiness: Math.round(cumulativeNewBiz),
    });
    fc.setMonth(fc.getMonth() + 1);
  }

  return data;
}

// Build waterfall chart data from aggregated totals
function buildWaterfallFromTotals(
  startingARR: number,
  endingARR: number,
  totals: { newBusiness: number; expansion: number; scheduleChange: number; contraction: number; churn: number; netChange: number }
) {
  let runningTotal = startingARR;

  const waterfallData: Array<{
    name: string;
    bottom: number;
    value: number;
    displayValue: number;
    fill: string;
    type: 'initial' | 'increase' | 'decrease' | 'final';
    connectTo?: number;
  }> = [];

  // Starting ARR
  waterfallData.push({
    name: 'Starting\nARR', bottom: 0, value: startingARR, displayValue: startingARR,
    fill: COLORS.gray, type: 'initial', connectTo: startingARR
  });

  // New Business (positive)
  waterfallData.push({
    name: 'New\nBusiness', bottom: runningTotal, value: totals.newBusiness, displayValue: totals.newBusiness,
    fill: COLORS.success, type: 'increase', connectTo: runningTotal + totals.newBusiness
  });
  runningTotal += totals.newBusiness;

  // Expansion (positive)
  waterfallData.push({
    name: 'Expansion', bottom: runningTotal, value: totals.expansion, displayValue: totals.expansion,
    fill: COLORS.primary, type: 'increase', connectTo: runningTotal + totals.expansion
  });
  runningTotal += totals.expansion;

  // Schedule Change (can be positive or negative)
  if (totals.scheduleChange >= 0) {
    waterfallData.push({
      name: 'Schedule\nChange', bottom: runningTotal, value: totals.scheduleChange, displayValue: totals.scheduleChange,
      fill: COLORS.purple, type: 'increase', connectTo: runningTotal + totals.scheduleChange
    });
    runningTotal += totals.scheduleChange;
  } else {
    const abs = Math.abs(totals.scheduleChange);
    waterfallData.push({
      name: 'Schedule\nChange', bottom: runningTotal - abs, value: abs, displayValue: totals.scheduleChange,
      fill: COLORS.purple, type: 'decrease', connectTo: runningTotal - abs
    });
    runningTotal -= abs;
  }

  // Contraction (negative)
  const contractionAbs = Math.abs(totals.contraction);
  waterfallData.push({
    name: 'Contraction', bottom: runningTotal - contractionAbs, value: contractionAbs, displayValue: totals.contraction,
    fill: COLORS.warning, type: 'decrease', connectTo: runningTotal - contractionAbs
  });
  runningTotal -= contractionAbs;

  // Churn (negative)
  const churnAbs = Math.abs(totals.churn);
  waterfallData.push({
    name: 'Churn', bottom: runningTotal - churnAbs, value: churnAbs, displayValue: totals.churn,
    fill: COLORS.danger, type: 'decrease', connectTo: runningTotal - churnAbs
  });
  runningTotal -= churnAbs;

  // Ending ARR - use actual ending ARR from snapshot (not running total) to avoid float drift
  waterfallData.push({
    name: 'Ending\nARR', bottom: 0, value: endingARR, displayValue: endingARR,
    fill: COLORS.primary, type: 'final'
  });

  return {
    startingARR,
    endingARR,
    ...totals,
    waterfallData,
  };
}

function buildRealARRMovement(store: RevenueDataState): ARRMovementRecord[] {
  const monthMap = new Map<string, ARRMovementRecord>();

  store.arrSnapshots.forEach(row => {
    const month = row.Snapshot_Month.slice(0, 7);
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        date: row.Snapshot_Month,
        newBusiness: 0, expansion: 0, scheduleChange: 0,
        contraction: 0, churn: 0, netChange: 0,
      });
    }
    const m = monthMap.get(month)!;
    m.newBusiness += row.New_ARR;
    m.expansion += row.Expansion_ARR;
    m.scheduleChange += row.Schedule_Change;
    m.contraction += row.Contraction_ARR;
    m.churn += row.Churn_ARR;
  });

  return Array.from(monthMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({
      ...m,
      newBusiness: Math.round(m.newBusiness),
      expansion: Math.round(m.expansion),
      scheduleChange: Math.round(m.scheduleChange),
      contraction: Math.round(m.contraction),
      churn: Math.round(m.churn),
      netChange: Math.round(m.newBusiness + m.expansion + m.scheduleChange + m.contraction + m.churn),
    }));
}

function buildRealProducts(store: RevenueDataState, custs: Customer[]): Product[] {
  const productMap = new Map<string, { totalARR: number; customers: Set<string>; category: string }>();

  custs.forEach(c => {
    Object.entries(c.productARR).forEach(([product, arr]) => {
      if (!productMap.has(product)) {
        productMap.set(product, {
          totalARR: 0,
          customers: new Set(),
          category: store.productCategoryIndex[product] || 'Other',
        });
      }
      const p = productMap.get(product)!;
      p.totalARR += arr;
      p.customers.add(c.id);
    });
  });

  let idx = 0;
  return Array.from(productMap.entries())
    .map(([name, data]) => ({
      id: `PROD-${String(++idx).padStart(3, '0')}`,
      name,
      category: data.category,
      subCategory: name,
      totalARR: Math.round(data.totalARR),
      customerCount: data.customers.size,
      avgARRPerCustomer: data.customers.size > 0 ? Math.round(data.totalARR / data.customers.size) : 0,
      growthPercent: 0,
    }))
    .sort((a, b) => b.totalARR - a.totalARR);
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

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

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
export default function RevenuePage() {
  // SOW Mapping store for enrichment
  const sowMappingStore = useSOWMappingStore();

  // Revenue data store - loads from /revenue/data API, caches in Zustand
  const realData = useRevenueDataStore();

  useEffect(() => {
    realData.loadData();
  }, []);

  // currentARRMonthLabel is defined below after selectedARRMonth

  const customers = useMemo(() => {
    if (!realData.isLoaded) return [];
    return buildRealCustomers(realData);
  }, [realData.isLoaded, realData.arrSnapshots, realData.sowMappingIndex, realData.arrSubCategoryBreakdown]);

  const arrMovementHistory = useMemo(() => {
    if (!realData.isLoaded) return [];
    return buildRealARRMovement(realData);
  }, [realData.isLoaded, realData.arrSnapshots]);

  // Compute prior month defaults for year/month filters
  const priorMonthDefaults = useMemo(() => {
    const now = new Date();
    const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { year: String(prior.getFullYear()), month: monthNames[prior.getMonth()] };
  }, []);

  // Filters - Multi-select support (standard filters per requirements)
  // Default year and month to prior month from login
  const [yearFilterMulti, setYearFilterMulti] = useState<string[]>(() => {
    const now = new Date();
    const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return [String(prior.getFullYear())];
  });
  const [monthFilterMulti, setMonthFilterMulti] = useState<string[]>(() => {
    const now = new Date();
    const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return [monthNames[prior.getMonth()]];
  });
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [verticalFilter, setVerticalFilter] = useState<string[]>([]);
  const [segmentFilter, setSegmentFilter] = useState<string[]>([]);
  const [platformFilter, setPlatformFilter] = useState<string[]>(DEFAULT_PLATFORMS); // Default selected

  // New Filters (Changes 4, 5)
  const [quantumSmartFilter, setQuantumSmartFilter] = useState<string>('All');  // Platform filter for Quantum/SMART (Change 5)
  const [revenueTypeFilter, setRevenueTypeFilter] = useState<string>('Fees');   // Revenue Type filter - default Fees (Change 4)

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'movement' | 'customers' | 'products'>('overview');

  // ARR Movement
  const [lookbackPeriod, setLookbackPeriod] = useState<'1' | '3' | '6' | '12'>('1');

  // Products
  const [productViewMode, setProductViewMode] = useState<'product' | 'customer'>('product');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productSubCategoryFilter, setProductSubCategoryFilter] = useState('All');
  const [expandedProductCategories, setExpandedProductCategories] = useState<Set<string>>(new Set());
  const [expandedMatrixCustomers, setExpandedMatrixCustomers] = useState<Set<string>>(new Set());
  const [customerNameFilter, setCustomerNameFilter] = useState('');

  // Customers
  const [show2026RenewalsOnly, setShow2026RenewalsOnly] = useState(false);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [show2026RenewalRiskOnly, setShow2026RenewalRiskOnly] = useState(false);
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string | null>(null);
  const [selectedRenewalMonth, setSelectedRenewalMonth] = useState<number | null>(null);

  const toggleCustomerExpand = (customerName: string) => {
    setExpandedCustomers(prev => {
      const next = new Set(prev);
      if (next.has(customerName)) next.delete(customerName);
      else next.add(customerName);
      return next;
    });
  };

  // Overview tab cross-interaction filters
  const [overviewCategoryFilter, setOverviewCategoryFilter] = useState<string | null>(null);
  const [overviewRegionFilter, setOverviewRegionFilter] = useState<string | null>(null);
  const [overviewVerticalFilter, setOverviewVerticalFilter] = useState<string | null>(null);

  // Movement tab cross-interaction filter
  const [movementTypeFilter, setMovementTypeFilter] = useState<string | null>(null);

  // Sorting
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Handle sort
  const handleSort = (key: string, direction: SortDirection) => {
    setSortConfig({ key, direction });
  };

  // Enrich customers with SOW Mapping data when available
  const enrichedCustomers = useMemo(() => {
    if (sowMappingStore.mappings.length === 0) return customers;
    return customers.map(c => {
      if (!c.sowId) return c;
      const mapping = sowMappingStore.getMappingBySOWId(c.sowId);
      if (!mapping) return c;
      return {
        ...c,
        vertical: mapping.Vertical || c.vertical,
        region: mapping.Region || c.region,
        segment: (mapping.Segment_Type as 'Enterprise' | 'SMB') || c.segment,
        feesType: (mapping.Fees_Type as 'Fees' | 'Travel') || c.feesType,
      };
    });
  }, [customers, sowMappingStore.mappings]);

  // Filter customers (multi-select support with standard filters)
  const filteredCustomers = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);  // YYYY-MM format

    return enrichedCustomers.filter(c => {
      // Region filter (multi-select)
      if (regionFilter.length > 0 && !regionFilter.includes(c.region)) return false;

      // Vertical filter (multi-select)
      if (verticalFilter.length > 0 && !verticalFilter.includes(c.vertical)) return false;

      // Segment filter (multi-select) - for Sales Performance & ARR Analytics
      if (segmentFilter.length > 0 && !segmentFilter.includes(c.segment)) return false;

      // Platform filter (multi-select) - for ARR Analytics only
      if (platformFilter.length > 0 && !platformFilter.includes(c.platform)) return false;

      // Quantum/SMART Platform filter (Change 5/6)
      if (quantumSmartFilter !== 'All') {
        const effectivePlatform = classifyPlatform(c.quantumSmart, c.quantumGoLiveDate, currentMonth);
        if (effectivePlatform !== quantumSmartFilter) return false;
      }

      // Revenue Type filter (Change 4) - Applied only in Products tab but filter logic here
      // Note: The actual filtering for Products tab is done separately below

      // Year/Month filters now control the ARR snapshot month for Current ARR (not customer filtering)

      return true;
    });
  }, [enrichedCustomers, regionFilter, verticalFilter, segmentFilter, platformFilter, quantumSmartFilter]);

  // Filtered customers for Products tab with Revenue Type filter (Change 4)
  const filteredCustomersForProducts = useMemo(() => {
    if (revenueTypeFilter === 'All') return filteredCustomers;

    return filteredCustomers.filter(c => {
      // Use feesType from customer or look up from SOW Mapping
      const feesType = c.feesType || 'Fees';
      return feesType === revenueTypeFilter;
    });
  }, [filteredCustomers, revenueTypeFilter]);

  const products = useMemo(() => {
    if (!realData.isLoaded) return [];
    return buildRealProducts(realData, filteredCustomers);
  }, [realData.isLoaded, realData.arrSnapshots, filteredCustomers, realData.productCategoryIndex]);

  // Determine the selected ARR snapshot month from filters
  const selectedARRMonth = useMemo(() => {
    const monthNameToNum: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
    };
    const year = yearFilterMulti.length > 0 ? yearFilterMulti[0] : priorMonthDefaults.year;
    const month = monthFilterMulti.length > 0 ? monthNameToNum[monthFilterMulti[0]] || '12' : '12';
    return `${year}-${month}`;
  }, [yearFilterMulti, monthFilterMulti, priorMonthDefaults]);

  // Label for the selected ARR month (e.g. "Jan 2026")
  const currentARRMonthLabel = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) return '';
    return formatMonthLabel(selectedARRMonth);
  }, [realData.isLoaded, realData.arrSnapshots, selectedARRMonth]);

  // Helper: check if an ARR snapshot row passes active filters
  const arrRowPassesFilters = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return (row: typeof realData.arrSnapshots[0]) => {
      // Enrich from SOW mapping
      const sowMapping = realData.sowMappingIndex[row.SOW_ID];
      const rowRegion = row.Region || (sowMapping ? normalizeRegion(sowMapping.Region) : '');
      const rowVertical = row.Vertical || (sowMapping ? sowMapping.Vertical : '');
      const rowSegment = row.Segment || (sowMapping ? sowMapping.Segment_Type : '');

      if (regionFilter.length > 0 && !regionFilter.includes(rowRegion)) return false;
      if (verticalFilter.length > 0 && !verticalFilter.includes(rowVertical)) return false;
      if (segmentFilter.length > 0 && !segmentFilter.includes(rowSegment)) return false;
      if (platformFilter.length > 0 && !platformFilter.includes(row.Quantum_SMART || 'SMART')) return false;
      if (quantumSmartFilter !== 'All') {
        const effectivePlatform = classifyPlatform(
          row.Quantum_SMART || undefined,
          row.Quantum_GoLive_Date || undefined,
          currentMonth
        );
        if (effectivePlatform !== quantumSmartFilter) return false;
      }
      return true;
    };
  }, [realData.sowMappingIndex, regionFilter, verticalFilter, segmentFilter, platformFilter, quantumSmartFilter]);

  // Helper: check if a pipeline row passes active filters
  const pipelineRowPassesFilters = useMemo(() => {
    return (row: typeof realData.pipelineSnapshots[0]) => {
      if (regionFilter.length > 0 && !regionFilter.includes(row.Region)) return false;
      if (verticalFilter.length > 0 && !verticalFilter.includes(row.Vertical)) return false;
      if (segmentFilter.length > 0 && row.Segment && !segmentFilter.includes(row.Segment)) return false;
      // Pipeline doesn't have Quantum/SMART field, skip that filter
      return true;
    };
  }, [regionFilter, verticalFilter, segmentFilter]);

  const monthlyARRData = useMemo(() => {
    if (!realData.isLoaded) return [];
    return buildRealMonthlyARR(realData, arrRowPassesFilters, pipelineRowPassesFilters);
  }, [realData.isLoaded, realData.arrSnapshots, realData.pipelineSnapshots, arrRowPassesFilters, pipelineRowPassesFilters]);

  // Current ARR: aggregate Ending_ARR from snapshot for selected month, applying filters
  const snapshotCurrentARR = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) return 0;
    let total = 0;
    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth === selectedARRMonth && arrRowPassesFilters(row)) {
        total += row.Ending_ARR;
      }
    });
    return Math.round(total);
  }, [realData.isLoaded, realData.arrSnapshots, selectedARRMonth, arrRowPassesFilters]);

  // Previous month ARR (month before selectedARRMonth) for YTD growth, applying filters
  const snapshotPreviousARR = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) return 0;
    const [y, m] = selectedARRMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    let total = 0;
    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth === prevMonth && arrRowPassesFilters(row)) {
        total += row.Ending_ARR;
      }
    });
    return Math.round(total);
  }, [realData.isLoaded, realData.arrSnapshots, selectedARRMonth, arrRowPassesFilters]);

  // Snapshot-driven retention components for the selected month
  // Reads Expansion_ARR / Contraction_ARR / Churn_ARR / Schedule_Change directly from snapshot rows
  const snapshotMonthlyRetention = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) {
      return { expansion: 0, contraction: 0, churn: 0, scheduleChange: 0 };
    }
    let expansion = 0, contraction = 0, churn = 0, scheduleChange = 0;
    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth === selectedARRMonth && arrRowPassesFilters(row)) {
        expansion      += row.Expansion_ARR;
        contraction    += Math.abs(row.Contraction_ARR); // negative in CSV
        churn          += Math.abs(row.Churn_ARR);       // negative in CSV
        scheduleChange += row.Schedule_Change;            // net — can be positive or negative
      }
    });
    return { expansion, contraction, churn, scheduleChange };
  }, [realData.isLoaded, realData.arrSnapshots, selectedARRMonth, arrRowPassesFilters]);

  // Forecast ARR = Dec Ending ARR of filtered year
  // If year is past → Dec of that year from snapshot
  // If year is current/future → last actual ARR + cumulative pipeline through Dec of filtered year
  const forecastARR = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) return 0;
    const priorMonth = getPriorMonth();
    const filteredYear = yearFilterMulti.length > 0 ? yearFilterMulti[0] : priorMonthDefaults.year;
    const decOfYear = `${filteredYear}-12`;

    // If Dec of filtered year is at or before the prior month, get actual Dec Ending_ARR
    if (decOfYear <= priorMonth) {
      let total = 0;
      realData.arrSnapshots.forEach(row => {
        const rowMonth = row.Snapshot_Month.slice(0, 7);
        if (rowMonth === decOfYear && arrRowPassesFilters(row)) {
          total += row.Ending_ARR;
        }
      });
      return Math.round(total);
    }

    // Otherwise, compute forecast: per-month actual ARR as base + cumulative pipeline through Dec of filtered year
    // Get ALL months' ARR from snapshot (including future months as base)
    let lastActualARR = 0;
    const actualMonthMap = new Map<string, number>();
    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (arrRowPassesFilters(row)) {
        actualMonthMap.set(rowMonth, (actualMonthMap.get(rowMonth) || 0) + row.Ending_ARR);
      }
    });
    // lastActualARR = fallback from the latest actual month (≤ priorMonth)
    const sortedActualMonths = Array.from(actualMonthMap.entries())
      .filter(([m]) => m <= priorMonth)
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedActualMonths.length > 0) lastActualARR = sortedActualMonths[sortedActualMonths.length - 1][1];

    // Use Dec's snapshot ARR as base if available, else fall back to lastActualARR
    const decBaseARR = actualMonthMap.get(decOfYear) || lastActualARR;

    // Get latest pipeline snapshot month
    let latestSnapshotMonth = '';
    realData.pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month;
    });

    // Sum pipeline deals closing from (prior month + 1) through Dec of filtered year
    let cumulativePipeline = 0;
    realData.pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month !== latestSnapshotMonth) return;
      if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
          row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
      if (!pipelineRowPassesFilters(row)) return;
      const closeMonth = row.Expected_Close_Date.slice(0, 7);
      if (closeMonth > priorMonth && closeMonth <= decOfYear) {
        cumulativePipeline += row.License_ACV; // Already weighted
      }
    });

    return Math.round(decBaseARR + cumulativePipeline);
  }, [realData.isLoaded, realData.arrSnapshots, realData.pipelineSnapshots, yearFilterMulti, priorMonthDefaults, arrRowPassesFilters, pipelineRowPassesFilters]);

  // Forecasted ARR for the specific selected month (not year-end)
  // If selected month is past → actual Ending ARR for that month
  // If selected month is current/future → last actual ARR + cumulative pipeline through selected month
  const monthForecastARR = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) return 0;
    const priorMonth = getPriorMonth();

    // If selected month is at or before prior month, return actual Ending_ARR
    if (selectedARRMonth <= priorMonth) {
      let total = 0;
      realData.arrSnapshots.forEach(row => {
        const rowMonth = row.Snapshot_Month.slice(0, 7);
        if (rowMonth === selectedARRMonth && arrRowPassesFilters(row)) {
          total += row.Ending_ARR;
        }
      });
      return Math.round(total);
    }

    // Otherwise, compute forecast: per-month actual ARR as base + cumulative pipeline through selected month
    let lastActualARR = 0;
    const actualMonthMap = new Map<string, number>();
    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (arrRowPassesFilters(row)) {
        actualMonthMap.set(rowMonth, (actualMonthMap.get(rowMonth) || 0) + row.Ending_ARR);
      }
    });
    // lastActualARR = fallback from the latest actual month (≤ priorMonth)
    const sortedActualMonths = Array.from(actualMonthMap.entries())
      .filter(([m]) => m <= priorMonth)
      .sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedActualMonths.length > 0) lastActualARR = sortedActualMonths[sortedActualMonths.length - 1][1];

    // Use selected month's snapshot ARR as base if available, else fall back to lastActualARR
    const monthBaseARR = actualMonthMap.get(selectedARRMonth) || lastActualARR;

    let latestSnapshotMonth = '';
    realData.pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month;
    });

    let cumulativePipeline = 0;
    realData.pipelineSnapshots.forEach(row => {
      if (row.Snapshot_Month !== latestSnapshotMonth) return;
      if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
          row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
      if (!pipelineRowPassesFilters(row)) return;
      const closeMonth = row.Expected_Close_Date.slice(0, 7);
      if (closeMonth > priorMonth && closeMonth <= selectedARRMonth) {
        cumulativePipeline += row.License_ACV;
      }
    });

    return Math.round(monthBaseARR + cumulativePipeline);
  }, [realData.isLoaded, realData.arrSnapshots, realData.pipelineSnapshots, selectedARRMonth, arrRowPassesFilters, pipelineRowPassesFilters]);

  // Determine if the filtered year is in the past (for KPI card labeling)
  const filteredYear = yearFilterMulti.length > 0 ? yearFilterMulti[0] : priorMonthDefaults.year;
  const currentCalendarYear = String(new Date().getFullYear());
  const isFilteredYearPast = parseInt(filteredYear) < parseInt(currentCalendarYear);

  // Full-year GRR and NRR: Jan of filteredYear → Dec of filteredYear (actual or forecast)
  // For past/complete years: uses snapshot actuals only.
  // For current/future years (Dec not yet reached): supplements actuals with pipeline forecast:
  //   GRR  += Renewal + Extension pipeline (retention deals)
  //   NRR  += Renewal + Extension + Upsell + Cross-Sell pipeline (retention + expansion)
  const fullYearRetention = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) {
      return { startARR: 0, endARR: 0, nrr: 0, grr: 0 };
    }
    const yr = filteredYear;
    const janOfYear = `${yr}-01`;
    const priorMonth = getPriorMonth();
    const isForecastYear = `${yr}-12` > priorMonth; // Dec not yet in actuals

    // Starting ARR = Jan of filteredYear Ending_ARR (from snapshot)
    let startARR = 0;
    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth === janOfYear && arrRowPassesFilters(row)) startARR += row.Ending_ARR;
    });

    // Actual movement from snapshot — only months with real data (≤ priorMonth)
    let actualExpansion = 0, actualScheduleChange = 0, actualContraction = 0, actualChurn = 0;
    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth.startsWith(yr) && rowMonth <= priorMonth && arrRowPassesFilters(row)) {
        actualExpansion      += row.Expansion_ARR;
        actualScheduleChange += row.Schedule_Change;           // net — positive or negative
        actualContraction    += Math.abs(row.Contraction_ARR);
        actualChurn          += Math.abs(row.Churn_ARR);
      }
    });

    // Pipeline forecast for remaining months of the year (only when year is not yet complete)
    // GRR: Renewal + Extension License_ACV  (these deals represent retained revenue)
    // NRR: additionally Upsell + Cross-Sell License_ACV  (expansion on top of renewals)
    let forecastRenewalExt = 0;      // contributes to both GRR and NRR
    let forecastUpsellCrossSell = 0; // contributes to NRR only
    // Dec Actual ARR from snapshot (used as numerator base for forecast year)
    let decActualARR = 0;
    const decOfYear = `${yr}-12`;
    if (isForecastYear) {
      // Get Dec ending ARR from snapshot data
      realData.arrSnapshots.forEach(row => {
        const rowMonth = row.Snapshot_Month.slice(0, 7);
        if (rowMonth === decOfYear && arrRowPassesFilters(row)) decActualARR += row.Ending_ARR;
      });

      let latestSnapshotMonth = '';
      realData.pipelineSnapshots.forEach(row => {
        if (row.Snapshot_Month > latestSnapshotMonth) latestSnapshotMonth = row.Snapshot_Month;
      });
      realData.pipelineSnapshots.forEach(row => {
        if (row.Snapshot_Month !== latestSnapshotMonth) return;
        if (row.Current_Stage.includes('Closed Won') || row.Current_Stage.includes('Closed Lost') ||
            row.Current_Stage.includes('Closed Dead') || row.Current_Stage.includes('Closed Declined')) return;
        if (!pipelineRowPassesFilters(row)) return;
        const closeMonth = row.Expected_Close_Date.slice(0, 7);
        // Only forecast period: after last actual month and within the filtered year
        if (closeMonth <= priorMonth || !closeMonth.startsWith(yr)) return;
        const logoType = row.Logo_Type.trim();
        if (logoType === 'Renewal' || logoType === 'Extension') {
          forecastRenewalExt += row.License_ACV;
        } else if (logoType === 'Upsell' || logoType === 'Cross-Sell') {
          forecastUpsellCrossSell += row.License_ACV;
        }
      });
    }

    // For forecast year: numerator uses Dec Actual ARR (from snapshot) as base instead of startARR
    // For past years: numerator uses startARR as base (forecast components are 0)
    const nrr = startARR > 0
      ? isForecastYear
        ? ((decActualARR + actualExpansion + actualScheduleChange + forecastRenewalExt + forecastUpsellCrossSell - actualContraction - actualChurn) / startARR) * 100
        : ((startARR + actualExpansion + actualScheduleChange - actualContraction - actualChurn) / startARR) * 100
      : 0;
    const grr = startARR > 0
      ? isForecastYear
        ? ((decActualARR + actualScheduleChange + forecastRenewalExt - actualContraction - actualChurn) / startARR) * 100
        : ((startARR + actualScheduleChange - actualContraction - actualChurn) / startARR) * 100
      : 0;

    return { startARR: Math.round(startARR), endARR: forecastARR, nrr, grr };
  }, [realData.isLoaded, realData.arrSnapshots, realData.pipelineSnapshots, filteredYear, forecastARR, arrRowPassesFilters, pipelineRowPassesFilters]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const useRealARR = realData.isLoaded && realData.arrSnapshots.length > 0 && snapshotCurrentARR > 0;
    const currentARR = useRealARR ? snapshotCurrentARR : filteredCustomers.filter(c => c.currentARR > 0).reduce((sum, c) => sum + c.currentARR, 0);
    const previousARR = useRealARR ? snapshotPreviousARR : filteredCustomers.reduce((sum, c) => sum + c.previousARR, 0);
    const ytdGrowth = previousARR > 0 ? ((currentARR - previousARR) / previousARR) * 100 : 0;

    // Year End Forecasted ARR = Dec of filtered year
    const yearEndARR = useRealARR ? forecastARR : currentARR * 1.15;
    const yearEndGrowth = currentARR > 0 ? ((yearEndARR - currentARR) / currentARR) * 100 : 0;

    // Month-specific Forecasted ARR
    const monthForecast = useRealARR ? monthForecastARR : currentARR * 1.05;
    const monthForecastGrowth = currentARR > 0 ? ((monthForecast - currentARR) / currentARR) * 100 : 0;

    // Monthly NRR and GRR — snapshot-driven so they correctly reflect the selected month
    // When real data is loaded: reads all movement columns directly from the snapshot rows
    // for selectedARRMonth. Denominator = prior month Ending_ARR (snapshotPreviousARR).
    const expansion = useRealARR ? snapshotMonthlyRetention.expansion
      : filteredCustomers.filter(c => c.movementType === 'Expansion')
          .reduce((sum, c) => sum + (c.currentARR - c.previousARR), 0);
    const contraction = useRealARR ? snapshotMonthlyRetention.contraction
      : filteredCustomers.filter(c => c.movementType === 'Contraction')
          .reduce((sum, c) => sum + (c.previousARR - c.currentARR), 0);
    const churn = useRealARR ? snapshotMonthlyRetention.churn
      : filteredCustomers.filter(c => c.movementType === 'Churn')
          .reduce((sum, c) => sum + c.previousARR, 0);
    // Schedule change is net (positive = ARR pulled forward, negative = deferred)
    const scheduleChange = useRealARR ? snapshotMonthlyRetention.scheduleChange : 0;

    // NRR includes expansion + schedule change; GRR excludes expansion but keeps schedule change
    const nrr = previousARR > 0 ? ((previousARR + expansion + scheduleChange - contraction - churn) / previousARR) * 100 : 0;
    const grr = previousARR > 0 ? ((previousARR + scheduleChange - contraction - churn) / previousARR) * 100 : 0;

    return {
      currentARR,
      yearEndARR,
      monthForecast,
      ytdGrowth,
      yearEndGrowth,
      monthForecastGrowth,
      nrr,
      grr,
      customerCount: filteredCustomers.filter(c => c.currentARR > 0).length,
    };
  }, [filteredCustomers, snapshotCurrentARR, snapshotPreviousARR, snapshotMonthlyRetention, forecastARR, monthForecastARR, realData.isLoaded, realData.arrSnapshots]);

  // ARR by Region
  const arrByRegion = useMemo(() => {
    const regionData: Record<string, number> = {};
    filteredCustomers.forEach(c => {
      regionData[c.region] = (regionData[c.region] || 0) + c.currentARR;
    });
    return Object.entries(regionData)
      .map(([region, arr]) => ({ region, arr }))
      .sort((a, b) => b.arr - a.arr);
  }, [filteredCustomers]);

  // ARR by Vertical
  const arrByVertical = useMemo(() => {
    const verticalData: Record<string, number> = {};
    filteredCustomers.forEach(c => {
      verticalData[c.vertical] = (verticalData[c.vertical] || 0) + c.currentARR;
    });
    return Object.entries(verticalData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCustomers]);

  // ARR by Category (aggregated from Sub-Category → Category via product_category_mapping)
  const arrByCategory = useMemo(() => {
    const categoryData: Record<string, number> = {};
    filteredCustomers.forEach(c => {
      Object.entries(c.productARR).forEach(([subCategory, arr]) => {
        const category = realData.productCategoryIndex[subCategory] || 'Other';
        categoryData[category] = (categoryData[category] || 0) + arr;
      });
    });
    return Object.entries(categoryData)
      .map(([name, arr]) => ({ name, arr }))
      .sort((a, b) => b.arr - a.arr);
  }, [filteredCustomers, realData.productCategoryIndex]);

  // ARR Movement Data based on lookback - TRUE FLOATING WATERFALL
  const arrMovementData = useMemo(() => {
    const months = parseInt(lookbackPeriod);

    // Use real ARR snapshot data directly when available
    if (realData.isLoaded && realData.arrSnapshots.length > 0) {
      // Determine the range of months to aggregate
      // Ending month = selectedARRMonth (e.g. "2026-01")
      // Starting month = lookback months before that
      const endMonth = selectedARRMonth; // YYYY-MM
      const endYear = parseInt(endMonth.slice(0, 4));
      const endMon = parseInt(endMonth.slice(5, 7));

      // Compute the first month in the range
      const startDate = new Date(endYear, endMon - 1 - (months - 1), 1);
      const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

      // Collect all months in range
      const monthsInRange: string[] = [];
      const cursor = new Date(startDate);
      const endDate = new Date(endYear, endMon - 1, 1);
      while (cursor <= endDate) {
        monthsInRange.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
        cursor.setMonth(cursor.getMonth() + 1);
      }

      // Aggregate snapshot data for each month, applying filters
      // For each month, sum up the components across all filtered SOW rows
      const monthAggregates = new Map<string, {
        starting: number; newBiz: number; expansion: number;
        scheduleChange: number; contraction: number; churn: number; ending: number;
      }>();

      monthsInRange.forEach(m => {
        monthAggregates.set(m, { starting: 0, newBiz: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0, ending: 0 });
      });

      realData.arrSnapshots.forEach(row => {
        const rowMonth = row.Snapshot_Month.slice(0, 7);
        if (!monthAggregates.has(rowMonth)) return;
        if (!arrRowPassesFilters(row)) return;
        const agg = monthAggregates.get(rowMonth)!;
        agg.starting += row.Starting_ARR;
        agg.newBiz += row.New_ARR;
        agg.expansion += row.Expansion_ARR;
        agg.scheduleChange += row.Schedule_Change;
        agg.contraction += row.Contraction_ARR;
        agg.churn += row.Churn_ARR;
        agg.ending += row.Ending_ARR;
      });

      // Starting ARR = Starting_ARR of the first month in range
      // Ending ARR = Ending_ARR of the last month in range
      // Components = sum across all months in range
      const firstMonthAgg = monthAggregates.get(monthsInRange[0]);
      const lastMonthAgg = monthAggregates.get(monthsInRange[monthsInRange.length - 1]);

      const startingARR = Math.round(firstMonthAgg?.starting || 0);
      const endingARR = Math.round(lastMonthAgg?.ending || 0);

      let totalNewBiz = 0, totalExpansion = 0, totalScheduleChange = 0, totalContraction = 0, totalChurn = 0;
      monthAggregates.forEach(agg => {
        totalNewBiz += agg.newBiz;
        totalExpansion += agg.expansion;
        totalScheduleChange += agg.scheduleChange;
        totalContraction += agg.contraction;
        totalChurn += agg.churn;
      });

      const totals = {
        newBusiness: Math.round(totalNewBiz),
        expansion: Math.round(totalExpansion),
        scheduleChange: Math.round(totalScheduleChange),
        contraction: Math.round(-Math.abs(totalContraction)), // Ensure negative
        churn: Math.round(-Math.abs(totalChurn)),             // Ensure negative
        netChange: Math.round(endingARR - startingARR),
      };

      // Build waterfall
      return buildWaterfallFromTotals(startingARR, endingARR, totals);
    }

    // Fallback to mock data
    const recentData = arrMovementHistory.slice(-months);
    const totals = recentData.reduce(
      (acc, record) => ({
        newBusiness: acc.newBusiness + record.newBusiness,
        expansion: acc.expansion + record.expansion,
        scheduleChange: acc.scheduleChange + record.scheduleChange,
        contraction: acc.contraction + record.contraction,
        churn: acc.churn + record.churn,
        netChange: acc.netChange + record.netChange,
      }),
      { newBusiness: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0, netChange: 0 }
    );
    const currentARR = metrics.currentARR;
    const startingARR = currentARR - totals.netChange;
    return buildWaterfallFromTotals(startingARR, currentARR, totals);
  }, [lookbackPeriod, selectedARRMonth, realData.isLoaded, realData.arrSnapshots, arrRowPassesFilters, metrics.currentARR, arrMovementHistory]);

  // Customer-wise movement details from ARR snapshot (same filters + date range as bridge)
  const customersWithMovement = useMemo(() => {
    // Use real snapshot data when available
    if (realData.isLoaded && realData.arrSnapshots.length > 0) {
      const months = parseInt(lookbackPeriod);
      const endMonth = selectedARRMonth;
      const endYear = parseInt(endMonth.slice(0, 4));
      const endMon = parseInt(endMonth.slice(5, 7));
      const startDate = new Date(endYear, endMon - 1 - (months - 1), 1);
      const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

      // Aggregate by customer across the lookback range
      const customerMap = new Map<string, {
        name: string; startingARR: number; endingARR: number;
        newBiz: number; expansion: number; scheduleChange: number;
        contraction: number; churn: number;
      }>();

      realData.arrSnapshots.forEach(row => {
        const rowMonth = row.Snapshot_Month.slice(0, 7);
        if (rowMonth < startMonth || rowMonth > endMonth) return;
        if (!arrRowPassesFilters(row)) return;

        const custName = row.Customer_Name;
        if (!customerMap.has(custName)) {
          customerMap.set(custName, {
            name: custName, startingARR: 0, endingARR: 0,
            newBiz: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0,
          });
        }
        const c = customerMap.get(custName)!;
        // Starting ARR = sum of Starting_ARR from first month only
        if (rowMonth === startMonth) c.startingARR += row.Starting_ARR;
        // Ending ARR = sum of Ending_ARR from last month only
        if (rowMonth === endMonth) c.endingARR += row.Ending_ARR;
        // Components sum across all months in range
        c.newBiz += row.New_ARR;
        c.expansion += row.Expansion_ARR;
        c.scheduleChange += row.Schedule_Change;
        c.contraction += row.Contraction_ARR;
        c.churn += row.Churn_ARR;
      });

      let data = Array.from(customerMap.values())
        .map(c => {
          const change = Math.round(c.endingARR - c.startingARR);
          // Classify movement type based on dominant component
          let movementType: string;
          if (Math.abs(c.churn) > 0 && c.endingARR === 0) movementType = 'Churn';
          else if (c.newBiz > 0 && c.startingARR === 0) movementType = 'New';
          else if (change > 0 && c.expansion > 0) movementType = 'Expansion';
          else if (c.contraction < 0 || change < 0) movementType = 'Contraction';
          else if (c.scheduleChange !== 0) movementType = 'ScheduleChange';
          else movementType = 'Flat';
          return {
            id: c.name,
            name: c.name,
            previousARR: Math.round(c.startingARR),
            currentARR: Math.round(c.endingARR),
            change,
            changePercent: c.startingARR > 0 ? ((c.endingARR - c.startingARR) / c.startingARR) * 100 : (c.endingARR > 0 ? 100 : 0),
            movementType,
            newBiz: Math.round(c.newBiz),
            expansion: Math.round(c.expansion),
            scheduleChange: Math.round(c.scheduleChange),
            contraction: Math.round(c.contraction),
            churn: Math.round(c.churn),
          };
        })
        .filter(c => c.movementType !== 'Flat' || c.change !== 0);

      // Sort
      if (sortConfig) {
        data = [...data].sort((a: any, b: any) => {
          const aVal = a[sortConfig.key];
          const bVal = b[sortConfig.key];
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
          }
          const aStr = String(aVal || '').toLowerCase();
          const bStr = String(bVal || '').toLowerCase();
          return sortConfig.direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
      } else {
        data = data.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
      }
      return data;
    }

    // Fallback to customer-derived movement
    let data = filteredCustomers
      .filter(c => c.movementType && c.movementType !== 'Flat')
      .map(c => ({
        ...c,
        change: c.currentARR - c.previousARR,
        changePercent: c.previousARR > 0 ? ((c.currentARR - c.previousARR) / c.previousARR) * 100 : 100,
        newBiz: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0,
      }));
    if (sortConfig) {
      data = [...data].sort((a: any, b: any) => {
        const aVal = a[sortConfig.key]; const bVal = b[sortConfig.key];
        if (typeof aVal === 'number' && typeof bVal === 'number') return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        return sortConfig.direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
      });
    } else {
      data = data.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }
    return data;
  }, [realData.isLoaded, realData.arrSnapshots, lookbackPeriod, selectedARRMonth, arrRowPassesFilters, filteredCustomers, sortConfig]);

  // Monthly Movement Trend - from Jan 2024 to prior month, using filtered snapshot data
  const filteredMovementTrend = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) return arrMovementHistory;

    const priorMonth = getPriorMonth();
    const monthMap = new Map<string, { date: string; newBusiness: number; expansion: number; scheduleChange: number; contraction: number; churn: number; netChange: number }>();

    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth < '2024-01' || rowMonth > priorMonth) return;
      if (!arrRowPassesFilters(row)) return;

      if (!monthMap.has(rowMonth)) {
        monthMap.set(rowMonth, { date: rowMonth + '-01', newBusiness: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0, netChange: 0 });
      }
      const m = monthMap.get(rowMonth)!;
      m.newBusiness += row.New_ARR;
      m.expansion += row.Expansion_ARR;
      m.scheduleChange += row.Schedule_Change;
      m.contraction += row.Contraction_ARR;
      m.churn += row.Churn_ARR;
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => ({
        ...m,
        newBusiness: Math.round(m.newBusiness),
        expansion: Math.round(m.expansion),
        scheduleChange: Math.round(m.scheduleChange),
        contraction: Math.round(m.contraction),
        churn: Math.round(m.churn),
        netChange: Math.round(m.newBusiness + m.expansion + m.scheduleChange + m.contraction + m.churn),
      }));
  }, [realData.isLoaded, realData.arrSnapshots, arrRowPassesFilters, arrMovementHistory]);

  // 2026 Renewals
  const renewals2026 = useMemo(() => {
    return filteredCustomers.filter(c => c.renewalDate.startsWith('2026') && c.renewalRiskLevel);
  }, [filteredCustomers]);

  // Renewal risk distribution
  const renewalRiskDistribution = useMemo(() => {
    const distribution: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    renewals2026.forEach(c => {
      if (c.renewalRiskLevel) {
        distribution[c.renewalRiskLevel]++;
      }
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [renewals2026]);

  // Customer summary with SOW-level breakdown from real ARR snapshot data
  interface SOWDetail {
    sowId: string;
    sowName: string;
    endingARR: number;
    contractEndDate: string;
    renewalRisk: string;
    contractStartDate: string;
    quantumSmart: string;
    region: string;
    vertical: string;
    segment: string;
  }

  interface CustomerSummary {
    customerName: string;
    totalARR: number;
    region: string;
    vertical: string;
    segment: string;
    sowCount: number;
    sows: SOWDetail[];
    earliestRenewalDate: string;
    hasRenewalRisk: boolean;
    highestRisk: string;
  }

  const customerSummaryWithSOWs = useMemo(() => {
    if (!realData.isLoaded || realData.arrSnapshots.length === 0) return [];

    // Use selectedARRMonth to get the right snapshot
    const targetMonth = selectedARRMonth;

    // Group ARR snapshot rows for the target month by customer
    const customerMap = new Map<string, { totalARR: number; region: string; vertical: string; segment: string; sows: SOWDetail[] }>();

    realData.arrSnapshots.forEach(row => {
      const rowMonth = row.Snapshot_Month.slice(0, 7);
      if (rowMonth !== targetMonth) return;
      if (!arrRowPassesFilters(row)) return;
      if (row.Ending_ARR === 0 && row.Starting_ARR === 0) return; // Skip zero-ARR rows

      const sowMapping = realData.sowMappingIndex[row.SOW_ID];
      const sowName = sowMapping?.SOW_Name || `SOW ${row.SOW_ID}`;

      const sowDetail: SOWDetail = {
        sowId: row.SOW_ID,
        sowName,
        endingARR: row.Ending_ARR,
        contractEndDate: row.Contract_End_Date || '',
        renewalRisk: row.Renewal_Risk || '',
        contractStartDate: row.Contract_Start_Date || (sowMapping?.Start_Date || ''),
        quantumSmart: row.Quantum_SMART || '',
        region: row.Region || (sowMapping ? normalizeRegion(sowMapping.Region) : ''),
        vertical: row.Vertical || (sowMapping?.Vertical || ''),
        segment: row.Segment || (sowMapping?.Segment_Type || ''),
      };

      const existing = customerMap.get(row.Customer_Name);
      if (existing) {
        existing.totalARR += row.Ending_ARR;
        existing.sows.push(sowDetail);
        // Use most common region/vertical/segment
        if (!existing.region && sowDetail.region) existing.region = sowDetail.region;
        if (!existing.vertical && sowDetail.vertical) existing.vertical = sowDetail.vertical;
        if (!existing.segment && sowDetail.segment) existing.segment = sowDetail.segment;
      } else {
        customerMap.set(row.Customer_Name, {
          totalARR: row.Ending_ARR,
          region: sowDetail.region,
          vertical: sowDetail.vertical,
          segment: sowDetail.segment,
          sows: [sowDetail],
        });
      }
    });

    // Build customer summaries
    const riskOrder: Record<string, number> = { 'Lost': 5, 'High Risk': 4, 'Mgmt Approval': 3, 'In Process': 2, 'Win/PO': 1 };
    const summaries: CustomerSummary[] = [];
    customerMap.forEach((data, customerName) => {
      // Sort SOWs by ARR descending
      data.sows.sort((a, b) => b.endingARR - a.endingARR);

      // Determine earliest renewal date and highest risk across SOWs
      let earliestDate = '';
      let highestRisk = '';
      let highestRiskOrder = 0;
      let hasRisk = false;

      data.sows.forEach(sow => {
        if (sow.contractEndDate) {
          if (!earliestDate || sow.contractEndDate < earliestDate) {
            earliestDate = sow.contractEndDate;
          }
        }
        if (sow.renewalRisk) {
          hasRisk = true;
          const order = riskOrder[sow.renewalRisk] || 0;
          if (order > highestRiskOrder) {
            highestRiskOrder = order;
            highestRisk = sow.renewalRisk;
          }
        }
      });

      summaries.push({
        customerName,
        totalARR: Math.round(data.totalARR),
        region: data.region,
        vertical: data.vertical,
        segment: data.segment,
        sowCount: data.sows.length,
        sows: data.sows,
        earliestRenewalDate: earliestDate,
        hasRenewalRisk: hasRisk,
        highestRisk,
      });
    });

    // Sort by total ARR descending
    summaries.sort((a, b) => b.totalARR - a.totalARR);
    return summaries;
  }, [realData.isLoaded, realData.arrSnapshots, realData.sowMappingIndex, selectedARRMonth, arrRowPassesFilters]);

  // Filtered customer summaries for 2026 renewals
  const customerSummary2026Renewals = useMemo(() => {
    return customerSummaryWithSOWs.filter(c =>
      c.sows.some(sow => sow.contractEndDate && sow.contractEndDate.startsWith('2026'))
    );
  }, [customerSummaryWithSOWs]);

  // Filtered for renewal risk only (High Risk and Lost)
  const RISK_ONLY_CATEGORIES = ['High Risk', 'Lost'];
  const customerSummaryRiskOnly = useMemo(() => {
    return customerSummary2026Renewals.filter(c =>
      c.sows.some(sow =>
        sow.contractEndDate?.startsWith('2026') && RISK_ONLY_CATEGORIES.includes(sow.renewalRisk)
      )
    );
  }, [customerSummary2026Renewals]);

  // Risk color mapping for all categories
  const RISK_COLORS: Record<string, string> = {
    'Win/PO': COLORS.success,
    'In Process': COLORS.primary,
    'Mgmt Approval': COLORS.warning,
    'High Risk': '#f97316',
    'Lost': COLORS.danger,
  };

  // Renewal risk distribution from real data - dynamic, all categories
  const realRenewalRiskDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    customerSummary2026Renewals.forEach(c => {
      c.sows.forEach(sow => {
        if (sow.contractEndDate?.startsWith('2026') && sow.renewalRisk) {
          // Skip bad data (CSV parse artifacts like names starting with quotes, #N/A)
          const risk = sow.renewalRisk.trim();
          if (!risk || risk.startsWith('"') || risk === '#N/A') return;
          distribution[risk] = (distribution[risk] || 0) + 1;
        }
      });
    });
    // Order: High Risk, Lost, Mgmt Approval, In Process, Win/PO, then anything else
    const order = ['High Risk', 'Lost', 'Mgmt Approval', 'In Process', 'Win/PO'];
    const entries = Object.entries(distribution);
    entries.sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return entries.map(([name, value]) => ({ name, value }));
  }, [customerSummary2026Renewals]);

  // Sorted customer summary list
  const sortedCustomerSummary = useMemo(() => {
    const source = show2026RenewalsOnly
      ? (show2026RenewalRiskOnly ? customerSummaryRiskOnly : customerSummary2026Renewals)
      : customerSummaryWithSOWs;

    if (!sortConfig) return source;

    return [...source].sort((a: any, b: any) => {
      const keyMap: Record<string, string> = { name: 'customerName', currentARR: 'totalARR' };
      const sortKey = keyMap[sortConfig.key] || sortConfig.key;
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customerSummaryWithSOWs, customerSummary2026Renewals, customerSummaryRiskOnly, show2026RenewalsOnly, show2026RenewalRiskOnly, sortConfig]);

  // Auto-expand all customer rows when 2026 Renewals or Risk filter toggles on
  useEffect(() => {
    if (show2026RenewalsOnly) {
      const source = show2026RenewalRiskOnly ? customerSummaryRiskOnly : customerSummary2026Renewals;
      setExpandedCustomers(new Set(source.map(c => c.customerName)));
    }
  }, [show2026RenewalsOnly, show2026RenewalRiskOnly, customerSummary2026Renewals, customerSummaryRiskOnly]);

  // Reset cross-interaction filters when switching tabs
  useEffect(() => {
    setOverviewCategoryFilter(null);
    setOverviewRegionFilter(null);
    setOverviewVerticalFilter(null);
    setMovementTypeFilter(null);
    setSelectedRiskFilter(null);
    setSelectedRenewalMonth(null);
  }, [activeTab]);

  // Overview cross-filtered data
  const overviewFilteredCustomers = useMemo(() => {
    if (!overviewCategoryFilter && !overviewRegionFilter && !overviewVerticalFilter) return filteredCustomers;
    return filteredCustomers.filter(c => {
      if (overviewRegionFilter && c.region !== overviewRegionFilter) return false;
      if (overviewVerticalFilter && c.vertical !== overviewVerticalFilter) return false;
      if (overviewCategoryFilter) {
        const hasCategory = Object.entries(c.productARR).some(([subCat]) => {
          const cat = realData.productCategoryIndex[subCat] || 'Other';
          return cat === overviewCategoryFilter;
        });
        if (!hasCategory) return false;
      }
      return true;
    });
  }, [filteredCustomers, overviewCategoryFilter, overviewRegionFilter, overviewVerticalFilter, realData.productCategoryIndex]);

  // Cross-filtered Overview charts
  const crossFilteredByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    overviewFilteredCustomers.forEach(c => {
      Object.entries(c.productARR).forEach(([sub, arr]) => {
        const cat = realData.productCategoryIndex[sub] || 'Other';
        data[cat] = (data[cat] || 0) + arr;
      });
    });
    return Object.entries(data).map(([name, arr]) => ({ name, arr })).sort((a, b) => b.arr - a.arr);
  }, [overviewFilteredCustomers, realData.productCategoryIndex]);

  const crossFilteredByRegion = useMemo(() => {
    const data: Record<string, number> = {};
    overviewFilteredCustomers.forEach(c => { data[c.region] = (data[c.region] || 0) + c.currentARR; });
    return Object.entries(data).map(([region, arr]) => ({ region, arr })).sort((a, b) => b.arr - a.arr);
  }, [overviewFilteredCustomers]);

  const crossFilteredByVertical = useMemo(() => {
    const data: Record<string, number> = {};
    overviewFilteredCustomers.forEach(c => { data[c.vertical] = (data[c.vertical] || 0) + c.currentARR; });
    return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [overviewFilteredCustomers]);

  const crossFilteredCurrentARR = useMemo(() => {
    return overviewFilteredCustomers.filter(c => c.currentARR > 0).reduce((sum, c) => sum + c.currentARR, 0);
  }, [overviewFilteredCustomers]);

  // Movement tab cross-filtered customers
  const movementFilteredCustomers = useMemo(() => {
    if (!movementTypeFilter) return customersWithMovement;
    return customersWithMovement.filter(c => {
      if (movementTypeFilter === 'New Business') return c.movementType === 'New';
      if (movementTypeFilter === 'Expansion') return c.movementType === 'Expansion';
      if (movementTypeFilter === 'Schedule Change') return c.movementType === 'ScheduleChange';
      if (movementTypeFilter === 'Contraction') return c.movementType === 'Contraction';
      if (movementTypeFilter === 'Churn') return c.movementType === 'Churn';
      return true;
    });
  }, [customersWithMovement, movementTypeFilter]);

  // Render Overview Tab
  const hasOverviewFilter = overviewCategoryFilter || overviewRegionFilter || overviewVerticalFilter;
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Active Cross-Filter Indicator */}
      {hasOverviewFilter && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700 font-medium">Active filters:</span>
          {overviewCategoryFilter && (
            <button onClick={() => setOverviewCategoryFilter(null)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200">
              Category: {overviewCategoryFilter} <span className="ml-1">&times;</span>
            </button>
          )}
          {overviewRegionFilter && (
            <button onClick={() => setOverviewRegionFilter(null)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 hover:bg-teal-200">
              Region: {overviewRegionFilter} <span className="ml-1">&times;</span>
            </button>
          )}
          {overviewVerticalFilter && (
            <button onClick={() => setOverviewVerticalFilter(null)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 hover:bg-purple-200">
              Vertical: {overviewVerticalFilter} <span className="ml-1">&times;</span>
            </button>
          )}
          <button onClick={() => { setOverviewCategoryFilter(null); setOverviewRegionFilter(null); setOverviewVerticalFilter(null); }}
            className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline">Clear all</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
            Current ARR{currentARRMonthLabel ? ` (${currentARRMonthLabel})` : ''}
          </p>
          <p className="text-3xl font-bold text-secondary-900">{formatCurrency(hasOverviewFilter ? crossFilteredCurrentARR : metrics.currentARR)}</p>
          {hasOverviewFilter ? (
            <p className="text-sm mt-1 text-blue-600">Filtered from {formatCurrency(metrics.currentARR)}</p>
          ) : (
            <p className={`text-sm mt-1 ${metrics.ytdGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(metrics.ytdGrowth)} YTD Growth
            </p>
          )}
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
            {isFilteredYearPast ? `Year End ARR (Dec ${filteredYear})` : `Year End Forecasted ARR (Dec ${filteredYear})`}
          </p>
          <p className="text-3xl font-bold text-primary-600">{formatCurrency(metrics.yearEndARR)}</p>
          <p className="text-sm text-primary-500 mt-1">{formatPercent(metrics.yearEndGrowth)} vs current</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
            Forecasted ARR{currentARRMonthLabel ? ` (${formatMonthLabel(selectedARRMonth)})` : ''}
          </p>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(metrics.monthForecast)}</p>
          <p className="text-sm text-purple-500 mt-1">{formatPercent(metrics.monthForecastGrowth)} vs current</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
            Monthly NRR{currentARRMonthLabel ? ` (${currentARRMonthLabel})` : ''}
          </p>
          <p className={`text-3xl font-bold ${metrics.nrr >= 100 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.nrr.toFixed(1)}%
          </p>
          <p className="text-sm text-secondary-400 mt-1">vs prior month ARR</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
            Monthly GRR{currentARRMonthLabel ? ` (${currentARRMonthLabel})` : ''}
          </p>
          <p className={`text-3xl font-bold ${metrics.grr >= 90 ? 'text-green-600' : metrics.grr >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
            {metrics.grr.toFixed(1)}%
          </p>
          <p className="text-sm text-secondary-400 mt-1">vs prior month ARR</p>
        </div>
      </div>

      {/* Full-Year Retention Cards — Jan of filteredYear → Dec of filteredYear */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">
            Full-Year NRR ({filteredYear})
          </p>
          <p className="text-xs text-secondary-400 mb-3">
            Including expansion from existing customers
          </p>
          <p className={`text-3xl font-bold ${fullYearRetention.nrr >= 100 ? 'text-green-600' : 'text-red-600'}`}>
            {fullYearRetention.nrr.toFixed(1)}%
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary-100">
            <div>
              <p className="text-xs text-secondary-400">Jan {filteredYear} ARR</p>
              <p className="text-sm font-semibold text-secondary-700">{formatCurrency(fullYearRetention.startARR)}</p>
            </div>
            <div className="text-secondary-300 text-lg">→</div>
            <div className="text-right">
              <p className="text-xs text-secondary-400">
                {isFilteredYearPast ? `Dec ${filteredYear} ARR` : `Dec ${filteredYear} (Forecast)`}
              </p>
              <p className="text-sm font-semibold text-secondary-700">{formatCurrency(fullYearRetention.endARR)}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-1">
            Full-Year GRR ({filteredYear})
          </p>
          <p className="text-xs text-secondary-400 mb-3">
            Excluding expansion, contraction + churn only
          </p>
          <p className={`text-3xl font-bold ${fullYearRetention.grr >= 90 ? 'text-green-600' : fullYearRetention.grr >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
            {fullYearRetention.grr.toFixed(1)}%
          </p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary-100">
            <div>
              <p className="text-xs text-secondary-400">Jan {filteredYear} ARR</p>
              <p className="text-sm font-semibold text-secondary-700">{formatCurrency(fullYearRetention.startARR)}</p>
            </div>
            <div className="text-secondary-300 text-lg">→</div>
            <div className="text-right">
              <p className="text-xs text-secondary-400">
                {isFilteredYearPast ? `Dec ${filteredYear} ARR` : `Dec ${filteredYear} (Forecast)`}
              </p>
              <p className="text-sm font-semibold text-secondary-700">{formatCurrency(fullYearRetention.endARR)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ARR Trend - Jan 2024 to Dec 2026 */}
      <ChartWrapper
        title="ARR Trend (Jan 2024 – Dec 2026)"
        data={monthlyARRData}
        filename="arr_trend"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyARRData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} interval={2} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  // Hide the base from tooltip since it's just the carry-forward
                  if (name === 'Ending ARR (Base)') return [formatCurrency(value), name];
                  return [formatCurrency(value), name];
                }}
              />
              <Legend />
              {/* Actual Ending ARR - shown for historical months */}
              <Area
                type="monotone"
                dataKey="currentARR"
                name="Ending ARR (Actual)"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.3}
              />
              {/* Forecast breakdown - stacked areas for forecast months */}
              <Area
                type="monotone"
                dataKey="forecastBase"
                name="Ending ARR (Base)"
                stackId="forecast"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.15}
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="forecastRenewals"
                name="Renewals / Extensions"
                stackId="forecast"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.3}
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="forecastNewBusiness"
                name="New / Upsell / Cross-Sell"
                stackId="forecast"
                stroke={COLORS.purple}
                fill={COLORS.purple}
                fillOpacity={0.3}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ARR by Category - clickable bars */}
        <ChartWrapper
          title={`ARR by Category${overviewCategoryFilter ? ` (${overviewCategoryFilter})` : ''}`}
          data={hasOverviewFilter ? crossFilteredByCategory : arrByCategory}
          filename="arr_by_category"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={(hasOverviewFilter ? crossFilteredByCategory : arrByCategory).slice(0, 10)}
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
                onClick={(data) => {
                  if (data?.activePayload?.[0]?.payload?.name) {
                    const clicked = data.activePayload[0].payload.name;
                    setOverviewCategoryFilter(prev => prev === clicked ? null : clicked);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={95} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="arr" radius={[0, 4, 4, 0]}>
                  {(hasOverviewFilter ? crossFilteredByCategory : arrByCategory).slice(0, 10).map((entry, i) => (
                    <Cell key={i} fill={overviewCategoryFilter === entry.name ? '#1e40af' : COLORS.primary} opacity={overviewCategoryFilter && overviewCategoryFilter !== entry.name ? 0.4 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-secondary-400 text-center mt-1">Click a bar to filter</p>
        </ChartWrapper>

        {/* ARR by Region - clickable bars */}
        <ChartWrapper
          title={`ARR by Region${overviewRegionFilter ? ` (${overviewRegionFilter})` : ''}`}
          data={hasOverviewFilter ? crossFilteredByRegion : arrByRegion}
          filename="arr_by_region"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={hasOverviewFilter ? crossFilteredByRegion : arrByRegion}
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
                onClick={(data) => {
                  if (data?.activePayload?.[0]?.payload?.region) {
                    const clicked = data.activePayload[0].payload.region;
                    setOverviewRegionFilter(prev => prev === clicked ? null : clicked);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="region" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={95} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="arr" radius={[0, 4, 4, 0]}>
                  {(hasOverviewFilter ? crossFilteredByRegion : arrByRegion).map((entry, i) => (
                    <Cell key={i} fill={overviewRegionFilter === entry.region ? '#0f766e' : COLORS.teal} opacity={overviewRegionFilter && overviewRegionFilter !== entry.region ? 0.4 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-secondary-400 text-center mt-1">Click a bar to filter</p>
        </ChartWrapper>

        {/* ARR by Vertical - clickable pie */}
        <ChartWrapper
          title={`ARR by Vertical${overviewVerticalFilter ? ` (${overviewVerticalFilter})` : ''}`}
          data={hasOverviewFilter ? crossFilteredByVertical : arrByVertical}
          filename="arr_by_vertical"
        >
          <div className="h-64 lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasOverviewFilter ? crossFilteredByVertical : arrByVertical}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(_, index) => {
                    const vertData = hasOverviewFilter ? crossFilteredByVertical : arrByVertical;
                    const clicked = vertData[index]?.name;
                    if (clicked) setOverviewVerticalFilter(prev => prev === clicked ? null : clicked);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {(hasOverviewFilter ? crossFilteredByVertical : arrByVertical).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      opacity={overviewVerticalFilter && overviewVerticalFilter !== entry.name ? 0.3 : 1}
                      stroke={overviewVerticalFilter === entry.name ? '#1e293b' : 'none'}
                      strokeWidth={overviewVerticalFilter === entry.name ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-secondary-400 text-center mt-1">Click a segment to filter</p>
        </ChartWrapper>
      </div>
    </div>
  );

  // Render ARR Movement Tab
  const renderMovementTab = () => (
    <div className="space-y-6">
      {/* Lookback Period Selector */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-secondary-700">Look-back Period:</span>
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
              {period} Month{period !== '1' ? 's' : ''} Back
            </button>
          ))}
        </div>
      </div>

      {/* Movement Summary Cards - clickable to filter tables */}
      {movementTypeFilter && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm text-blue-700 font-medium">Filtered by:</span>
          <button onClick={() => setMovementTypeFilter(null)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200">
            {movementTypeFilter} <span className="ml-1">&times;</span>
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className={`card p-5 cursor-pointer transition-all ${movementTypeFilter === null ? '' : 'opacity-50'}`}
          onClick={() => setMovementTypeFilter(null)}>
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Net ARR Change</p>
          <p className={`text-2xl font-bold ${arrMovementData.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {arrMovementData.netChange >= 0 ? '+' : ''}{formatCurrency(arrMovementData.netChange)}
          </p>
        </div>
        {([
          { key: 'New Business', value: arrMovementData.newBusiness, border: 'border-green-500', text: 'text-green-600', prefix: '+' },
          { key: 'Expansion', value: arrMovementData.expansion, border: 'border-blue-500', text: 'text-blue-600', prefix: '+' },
          { key: 'Schedule Change', value: arrMovementData.scheduleChange, border: 'border-purple-500', text: 'text-purple-600', prefix: arrMovementData.scheduleChange >= 0 ? '+' : '' },
          { key: 'Contraction', value: arrMovementData.contraction, border: 'border-yellow-500', text: 'text-yellow-600', prefix: '' },
          { key: 'Churn', value: arrMovementData.churn, border: 'border-red-500', text: 'text-red-600', prefix: '' },
        ] as const).map((card) => (
          <div
            key={card.key}
            className={`card p-5 border-l-4 ${card.border} cursor-pointer transition-all hover:shadow-md ${
              movementTypeFilter === card.key ? 'ring-2 ring-primary-500 shadow-md' : movementTypeFilter ? 'opacity-50' : ''
            }`}
            onClick={() => setMovementTypeFilter(prev => prev === card.key ? null : card.key)}
          >
            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">{card.key}</p>
            <p className={`text-2xl font-bold ${card.text}`}>{card.prefix}{formatCurrency(card.value)}</p>
          </div>
        ))}
      </div>

      {/* ARR Bridge / Floating Waterfall */}
      <ChartWrapper
        title="ARR Bridge"
        subtitle="Floating waterfall showing ARR movement over the selected period"
        data={arrMovementData.waterfallData}
        filename="arr_bridge"
      >
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={arrMovementData.waterfallData}
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
                    return [formatCurrency(item.displayValue), item.type === 'initial' || item.type === 'final' ? 'Total ARR' : 'Change'];
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

              {/* Visible value bar - stacked on top of spacer, clickable to filter tables */}
              <Bar
                dataKey="value"
                stackId="waterfall"
                radius={[4, 4, 4, 4]}
                onClick={(_data: any, index: number) => {
                  const categoryMap: Record<number, string | null> = {
                    0: null, // Starting ARR - clears filter
                    1: 'New Business',
                    2: 'Expansion',
                    3: 'Schedule Change',
                    4: 'Contraction',
                    5: 'Churn',
                    6: null, // Ending ARR - clears filter
                  };
                  const category = categoryMap[index];
                  if (category === null) {
                    setMovementTypeFilter(null);
                  } else {
                    setMovementTypeFilter(prev => prev === category ? null : category);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {arrMovementData.waterfallData.map((entry, index) => {
                  const categoryMap: Record<number, string | null> = {
                    0: null, 1: 'New Business', 2: 'Expansion', 3: 'Schedule Change', 4: 'Contraction', 5: 'Churn', 6: null,
                  };
                  const barCategory = categoryMap[index];
                  const isActive = movementTypeFilter === null || movementTypeFilter === barCategory;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      fillOpacity={isActive ? 1 : 0.3}
                      stroke={movementTypeFilter !== null && movementTypeFilter === barCategory ? '#1e40af' : 'none'}
                      strokeWidth={movementTypeFilter !== null && movementTypeFilter === barCategory ? 2 : 0}
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
              {arrMovementData.waterfallData.map((entry, index) => {
                if (index < arrMovementData.waterfallData.length - 1 && entry.connectTo !== undefined) {
                  return (
                    <ReferenceLine
                      key={`connect-${index}`}
                      y={entry.connectTo}
                      stroke="#cbd5e1"
                      strokeWidth={1}
                      strokeDasharray="4 2"
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
            <span className="text-xs text-secondary-600">New Business (+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.primary }}></span>
            <span className="text-xs text-secondary-600">Expansion (+)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.purple }}></span>
            <span className="text-xs text-secondary-600">Schedule Change (+/-)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.warning }}></span>
            <span className="text-xs text-secondary-600">Contraction (-)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: COLORS.danger }}></span>
            <span className="text-xs text-secondary-600">Churn (-)</span>
          </div>
        </div>

        {/* Waterfall explanation */}
        <div className="mt-4 p-3 bg-secondary-50 rounded-lg">
          <p className="text-xs text-secondary-500 text-center">
            <strong>How to read:</strong> Starting ARR + New Business + Expansion + Schedule Change - Contraction - Churn = Ending ARR
          </p>
        </div>
      </ChartWrapper>

      {/* Movement Details Table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-secondary-200">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-secondary-900">
              ARR Movement Details{movementTypeFilter ? ` — ${movementTypeFilter}` : ''} ({(customerNameFilter ? movementFilteredCustomers.filter(c => c.name.toLowerCase().includes(customerNameFilter.toLowerCase())) : movementFilteredCustomers).length})
            </h2>
            <button
              onClick={() => exportToCSV(movementFilteredCustomers, 'arr_movement_details')}
              className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary-600">Customer:</label>
            <input
              type="text"
              value={customerNameFilter}
              onChange={(e) => setCustomerNameFilter(e.target.value)}
              placeholder="Search customer..."
              className="px-3 py-1.5 text-sm border border-secondary-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-48"
            />
            {customerNameFilter && (
              <button onClick={() => setCustomerNameFilter('')} className="text-xs text-secondary-400 hover:text-secondary-600">&times;</button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-secondary-50 sticky top-0">
              <tr>
                <SortableHeader label="Customer" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Starting ARR" sortKey="previousARR" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="New Business" sortKey="newBiz" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Expansion" sortKey="expansion" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Schedule Chg" sortKey="scheduleChange" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Contraction" sortKey="contraction" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Churn" sortKey="churn" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Ending ARR" sortKey="currentARR" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Net Change" sortKey="change" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Type" sortKey="movementType" currentSort={sortConfig} onSort={handleSort} filterOptions={['New', 'Expansion', 'ScheduleChange', 'Contraction', 'Churn']} />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {(customerNameFilter ? movementFilteredCustomers.filter(c => c.name.toLowerCase().includes(customerNameFilter.toLowerCase())) : movementFilteredCustomers).slice(0, 50).map((customer) => (
                <tr
                  key={customer.id}
                  className={`${
                    customer.movementType === 'Expansion' || customer.movementType === 'New'
                      ? 'bg-green-50'
                      : customer.movementType === 'Churn'
                      ? 'bg-red-50'
                      : customer.movementType === 'Contraction'
                      ? 'bg-yellow-50'
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-secondary-900">{customer.name}</td>
                  <td className="px-4 py-3 text-right text-secondary-600">{formatCurrency(customer.previousARR)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{customer.newBiz > 0 ? `+${formatCurrency(customer.newBiz)}` : '-'}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{customer.expansion > 0 ? `+${formatCurrency(customer.expansion)}` : '-'}</td>
                  <td className={`px-4 py-3 text-right ${customer.scheduleChange >= 0 ? 'text-purple-600' : 'text-purple-600'}`}>
                    {customer.scheduleChange !== 0 ? formatCurrency(customer.scheduleChange) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-yellow-600">{customer.contraction < 0 ? formatCurrency(customer.contraction) : '-'}</td>
                  <td className="px-4 py-3 text-right text-red-600">{customer.churn < 0 ? formatCurrency(customer.churn) : '-'}</td>
                  <td className="px-4 py-3 text-right font-medium text-secondary-900">{formatCurrency(customer.currentARR)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${customer.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customer.change >= 0 ? '+' : ''}{formatCurrency(customer.change)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      customer.movementType === 'New' ? 'bg-green-100 text-green-800' :
                      customer.movementType === 'Expansion' ? 'bg-blue-100 text-blue-800' :
                      customer.movementType === 'ScheduleChange' ? 'bg-purple-100 text-purple-800' :
                      customer.movementType === 'Contraction' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {customer.movementType === 'ScheduleChange' ? 'Sched. Change' : customer.movementType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Expansions */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Top Expansions</h2>
            <button
              onClick={() => exportToCSV(
                movementFilteredCustomers.filter(c => c.movementType === 'Expansion' || c.movementType === 'New').slice(0, 10),
                'top_expansions'
              )}
              className="px-2 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
          <div className="space-y-3">
            {movementFilteredCustomers
              .filter(c => c.movementType === 'Expansion' || c.movementType === 'New')
              .sort((a, b) => b.change - a.change)
              .slice(0, 5)
              .map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary-900">{customer.name}</p>
                    <p className="text-xs text-secondary-500">{customer.movementType === 'New' ? 'New Business' : 'Expansion'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+{formatCurrency(customer.change)}</p>
                    <p className="text-xs text-green-500">
                      {customer.previousARR > 0 ? formatPercent(customer.changePercent) : 'New'}
                    </p>
                  </div>
                </div>
              ))}
            {movementFilteredCustomers.filter(c => c.movementType === 'Expansion' || c.movementType === 'New').length === 0 && (
              <p className="text-sm text-secondary-400 text-center py-4">No expansions in this period</p>
            )}
          </div>
        </div>

        {/* Top Contractions/Churns */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Top Contractions & Churns</h2>
            <button
              onClick={() => exportToCSV(
                movementFilteredCustomers.filter(c => c.movementType === 'Contraction' || c.movementType === 'Churn').slice(0, 10),
                'top_contractions'
              )}
              className="px-2 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
          <div className="space-y-3">
            {movementFilteredCustomers
              .filter(c => c.movementType === 'Contraction' || c.movementType === 'Churn')
              .sort((a, b) => a.change - b.change)
              .slice(0, 5)
              .map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary-900">{customer.name}</p>
                    <p className="text-xs text-secondary-500">{customer.movementType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(customer.change)}</p>
                    <p className="text-xs text-red-500">{formatPercent(customer.changePercent)}</p>
                  </div>
                </div>
              ))}
            {movementFilteredCustomers.filter(c => c.movementType === 'Contraction' || c.movementType === 'Churn').length === 0 && (
              <p className="text-sm text-secondary-400 text-center py-4">No contractions or churns in this period</p>
            )}
          </div>
        </div>
      </div>

      {/* Movement Trend */}
      <ChartWrapper
        title="Monthly Movement Trend (Jan 2024 to Prior Month)"
        data={filteredMovementTrend}
        filename="movement_trend"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredMovementTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="newBusiness" name="New Business" stackId="gains" fill={COLORS.success} />
              <Bar dataKey="expansion" name="Expansion" stackId="gains" fill={COLORS.primary} />
              <Bar dataKey="scheduleChange" name="Schedule Change" stackId="gains" fill={COLORS.warning} />
              <Bar dataKey="contraction" name="Contraction" stackId="losses" fill={COLORS.pink} />
              <Bar dataKey="churn" name="Churn" stackId="losses" fill={COLORS.danger} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>
    </div>
  );

  // Render Customers Tab
  const renderCustomersTab = () => {
    const useRealSummary = customerSummaryWithSOWs.length > 0;

    // Apply pie chart risk filter, calendar month filter, and customer name filter to the sorted list
    let displayedSummary = sortedCustomerSummary;
    if (customerNameFilter) {
      const lcFilter = customerNameFilter.toLowerCase();
      displayedSummary = displayedSummary.filter(c => c.customerName.toLowerCase().includes(lcFilter));
    }
    if (selectedRiskFilter && show2026RenewalsOnly) {
      displayedSummary = displayedSummary.filter(c =>
        c.sows.some(s => s.contractEndDate?.startsWith('2026') && s.renewalRisk === selectedRiskFilter)
      );
    }
    if (selectedRenewalMonth !== null && show2026RenewalsOnly) {
      displayedSummary = displayedSummary.filter(c =>
        c.sows.some(s => {
          if (!s.contractEndDate?.startsWith('2026')) return false;
          try { return new Date(s.contractEndDate).getMonth() === selectedRenewalMonth; } catch { return false; }
        })
      );
    }

    // Helper to format date safely
    const fmtDate = (d: string) => {
      if (!d) return '—';
      try {
        return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch { return d; }
    };

    // Renewal risk badge
    const riskBadge = (risk: string) => {
      if (!risk) return null;
      const badgeColors: Record<string, string> = {
        'Win/PO': 'bg-green-100 text-green-800',
        'In Process': 'bg-blue-100 text-blue-800',
        'Mgmt Approval': 'bg-yellow-100 text-yellow-800',
        'High Risk': 'bg-orange-100 text-orange-800',
        'Lost': 'bg-red-100 text-red-800',
      };
      const colors = badgeColors[risk] || 'bg-secondary-100 text-secondary-800';
      return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors}`}>{risk}</span>;
    };

    // 2026 Renewal calendar data from real customer summaries
    const calendarData = show2026RenewalsOnly ? customerSummary2026Renewals : [];

    return (
      <div className="space-y-6">
        {/* Filter Toggles */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={show2026RenewalsOnly}
                  onChange={(e) => { setShow2026RenewalsOnly(e.target.checked); if (!e.target.checked) { setShow2026RenewalRiskOnly(false); setSelectedRiskFilter(null); setSelectedRenewalMonth(null); } }}
                  className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700">Show 2026 Renewals Only</span>
              </label>
              {show2026RenewalsOnly && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={show2026RenewalRiskOnly}
                    onChange={(e) => setShow2026RenewalRiskOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-secondary-700">Renewal Risk Only</span>
                </label>
              )}
              <div className="flex items-center gap-2 ml-4">
                <label className="text-sm text-secondary-600">Customer:</label>
                <input
                  type="text"
                  value={customerNameFilter}
                  onChange={(e) => setCustomerNameFilter(e.target.value)}
                  placeholder="Search customer..."
                  className="px-3 py-1.5 text-sm border border-secondary-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-48"
                />
                {customerNameFilter && (
                  <button onClick={() => setCustomerNameFilter('')} className="text-xs text-secondary-400 hover:text-secondary-600">&times;</button>
                )}
              </div>
            </div>
            <button
              onClick={() => exportToCSV(displayedSummary.map(c => ({
                Customer: c.customerName, 'Total ARR': c.totalARR, SOWs: c.sowCount,
                Region: c.region, Vertical: c.vertical,
                'Earliest Renewal': c.earliestRenewalDate, Risk: c.highestRisk,
              })), 'customers')}
              className="px-4 py-2 border border-secondary-200 rounded-lg text-sm font-medium text-secondary-600 hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
        </div>

        {/* Active interaction filters */}
        {show2026RenewalsOnly && (selectedRiskFilter || selectedRenewalMonth !== null) && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm text-blue-700 font-medium">Filtered by:</span>
            {selectedRiskFilter && (
              <button onClick={() => setSelectedRiskFilter(null)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200">
                Risk: {selectedRiskFilter} <span className="ml-1">&times;</span>
              </button>
            )}
            {selectedRenewalMonth !== null && (
              <button onClick={() => setSelectedRenewalMonth(null)} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200">
                Month: {new Date(2026, selectedRenewalMonth, 1).toLocaleString('en-US', { month: 'short' })} 2026 <span className="ml-1">&times;</span>
              </button>
            )}
            <button onClick={() => { setSelectedRiskFilter(null); setSelectedRenewalMonth(null); }}
              className="ml-auto text-xs text-blue-600 hover:text-blue-800 underline">Clear all</button>
          </div>
        )}

        {/* 2026 Renewal Risk Distribution */}
        {show2026RenewalsOnly && useRealSummary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartWrapper
              title={`2026 Renewal Risk Distribution${selectedRiskFilter ? ` (${selectedRiskFilter})` : ''}`}
              data={realRenewalRiskDistribution}
              filename="renewal_risk_distribution"
            >
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={realRenewalRiskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      onClick={(_, idx) => {
                        const clicked = realRenewalRiskDistribution[idx]?.name;
                        if (clicked) setSelectedRiskFilter(prev => prev === clicked ? null : clicked);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {realRenewalRiskDistribution.map((entry, idx) => {
                        const baseColor = RISK_COLORS[entry.name] || COLORS.gray;
                        return (
                          <Cell key={idx} fill={baseColor}
                            opacity={selectedRiskFilter && selectedRiskFilter !== entry.name ? 0.3 : 1}
                            stroke={selectedRiskFilter === entry.name ? '#1e293b' : 'none'}
                            strokeWidth={selectedRiskFilter === entry.name ? 2 : 0}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-secondary-400 text-center mt-1">Click a segment to filter</p>
            </ChartWrapper>

            <div className="card p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">2026 Renewal Calendar</h2>
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  // Count SOWs with end dates in this month of 2026
                  const monthSOWs = calendarData.flatMap(c =>
                    c.sows.filter(s => {
                      if (!s.contractEndDate?.startsWith('2026')) return false;
                      try { return new Date(s.contractEndDate).getMonth() === i; } catch { return false; }
                    })
                  );
                  const totalARR = monthSOWs.reduce((sum, s) => sum + s.endingARR, 0);
                  const hasHighRisk = monthSOWs.some(s => s.renewalRisk === 'High Risk' || s.renewalRisk === 'Lost');
                  const isSelected = selectedRenewalMonth === i;

                  return (
                    <div
                      key={i}
                      onClick={() => monthSOWs.length > 0 && setSelectedRenewalMonth(prev => prev === i ? null : i)}
                      className={`p-2 rounded text-center transition-all ${
                        monthSOWs.length > 0 ? 'cursor-pointer hover:shadow-md' : ''
                      } ${
                        isSelected ? 'ring-2 ring-primary-500 shadow-md' :
                        selectedRenewalMonth !== null && !isSelected ? 'opacity-40' :
                        hasHighRisk ? 'bg-red-100' : monthSOWs.length > 0 ? 'bg-blue-100' : 'bg-secondary-100'
                      } ${isSelected ? (hasHighRisk ? 'bg-red-200' : 'bg-blue-200') : ''}`}
                    >
                      <p className="text-xs font-medium text-secondary-600">
                        {new Date(2026, i, 1).toLocaleString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-sm font-bold text-secondary-900">{monthSOWs.length}</p>
                      <p className="text-[10px] text-secondary-500">{formatCurrency(totalARR)}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-secondary-400 text-center mt-2">Click a month to filter the table below</p>
            </div>
          </div>
        )}

        {/* Customer Table with Expandable SOW Rows */}
        {useRealSummary ? (
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-secondary-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">
                {show2026RenewalsOnly ? (show2026RenewalRiskOnly ? '2026 Renewal Risk' : '2026 Renewals') : 'All Customers'} ({displayedSummary.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpandedCustomers(new Set(displayedSummary.map(c => c.customerName)))}
                  className="px-3 py-1.5 text-xs font-medium border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  Expand All
                </button>
                <button
                  onClick={() => setExpandedCustomers(new Set())}
                  className="px-3 py-1.5 text-xs font-medium border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  Collapse All
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-secondary-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-semibold text-secondary-500 uppercase w-8"></th>
                    <SortableHeader label="Customer" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Total ARR" sortKey="currentARR" currentSort={sortConfig} onSort={handleSort} />
                    <th className="px-4 py-3 text-center text-xs font-semibold text-secondary-500 uppercase">SOWs</th>
                    <SortableHeader label="Region" sortKey="region" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Vertical" sortKey="vertical" currentSort={sortConfig} onSort={handleSort} />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Earliest Renewal</th>
                    {show2026RenewalsOnly && (
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Risk</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {displayedSummary.slice(0, 100).map((customer) => {
                    const isExpanded = expandedCustomers.has(customer.customerName);
                    const sowsToShow = show2026RenewalsOnly
                      ? customer.sows.filter(s => s.contractEndDate?.startsWith('2026'))
                      : customer.sows;

                    return (
                      <React.Fragment key={customer.customerName}>
                        {/* Customer summary row */}
                        <tr
                          className={`hover:bg-secondary-50 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleCustomerExpand(customer.customerName)}
                        >
                          <td className="px-2 py-3 text-center">
                            <span className="text-secondary-400 font-mono text-sm">
                              {isExpanded ? '−' : '+'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-secondary-900">{customer.customerName}</td>
                          <td className="px-4 py-3 text-right font-bold text-secondary-900">{formatCurrency(customer.totalARR)}</td>
                          <td className="px-4 py-3 text-center text-secondary-600">{customer.sowCount}</td>
                          <td className="px-4 py-3 text-secondary-600">{customer.region}</td>
                          <td className="px-4 py-3 text-secondary-600">{customer.vertical}</td>
                          <td className="px-4 py-3 text-secondary-600">{fmtDate(customer.earliestRenewalDate)}</td>
                          {show2026RenewalsOnly && (
                            <td className="px-4 py-3">{riskBadge(customer.highestRisk)}</td>
                          )}
                        </tr>

                        {/* Expanded SOW detail rows */}
                        {isExpanded && sowsToShow.map((sow) => (
                          <tr key={`${customer.customerName}-${sow.sowId}`} className="bg-secondary-50/50">
                            <td className="px-2 py-2"></td>
                            <td className="px-4 py-2 pl-8" colSpan={2}>
                              <div className="flex items-center gap-2">
                                <span className="text-secondary-400 text-xs">&#x251C;</span>
                                <span className="text-sm text-secondary-700">{sow.sowName}</span>
                                <span className="text-xs text-secondary-400">(SOW {sow.sowId})</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right text-sm text-secondary-700">{formatCurrency(sow.endingARR)}</td>
                            <td className="px-4 py-2 text-xs text-secondary-500">{sow.quantumSmart || '—'}</td>
                            <td className="px-4 py-2 text-xs text-secondary-500">{fmtDate(sow.contractStartDate)}</td>
                            <td className="px-4 py-2 text-xs text-secondary-500">{fmtDate(sow.contractEndDate)}</td>
                            {show2026RenewalsOnly && (
                              <td className="px-4 py-2">{riskBadge(sow.renewalRisk)}</td>
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Fallback to mock customer data when real data not loaded */
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900">All Customers ({sortedCustomersList.length})</h2>
            </div>
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-secondary-50 sticky top-0">
                  <tr>
                    <SortableHeader label="Customer" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Current ARR" sortKey="currentARR" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Region" sortKey="region" currentSort={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Vertical" sortKey="vertical" currentSort={sortConfig} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {sortedCustomersList.slice(0, 50).map((customer) => (
                    <tr key={customer.id} className="hover:bg-secondary-50">
                      <td className="px-4 py-3 font-medium text-secondary-900">{customer.name}</td>
                      <td className="px-4 py-3 text-right font-medium text-secondary-900">{formatCurrency(customer.currentARR)}</td>
                      <td className="px-4 py-3 text-secondary-600">{customer.region}</td>
                      <td className="px-4 py-3 text-secondary-600">{customer.vertical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ARR Concentration */}
        <ChartWrapper
          title="Top 10 Customers by ARR"
          data={(useRealSummary
            ? customerSummaryWithSOWs.slice(0, 10).map(c => ({ name: c.customerName, arr: c.totalARR }))
            : filteredCustomers
                .filter(c => c.currentARR > 0)
                .sort((a, b) => b.currentARR - a.currentARR)
                .slice(0, 10)
                .map(c => ({ name: c.name, arr: c.currentARR }))
          )}
          filename="top_customers"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={useRealSummary
                  ? customerSummaryWithSOWs.slice(0, 10).map(c => ({ name: c.customerName, arr: c.totalARR }))
                  : filteredCustomers
                      .filter(c => c.currentARR > 0)
                      .sort((a, b) => b.currentARR - a.currentARR)
                      .slice(0, 10)
                      .map(c => ({ name: c.name, arr: c.currentARR }))
                }
                margin={{ top: 0, right: 30, left: 120, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={115} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="arr" fill={COLORS.purple} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>
      </div>
    );
  };

  // Filtered and sorted products - moved outside render for proper reactivity
  const filteredProducts = useMemo(() => {
    let data = products.filter(p => {
      if (productCategoryFilter !== 'All' && p.category !== productCategoryFilter) return false;
      if (productSubCategoryFilter !== 'All' && p.subCategory !== productSubCategoryFilter) return false;
      return true;
    });

    // Apply sorting if set
    if (sortConfig) {
      data = [...data].sort((a: any, b: any) => {
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

    return data;
  }, [products, productCategoryFilter, productSubCategoryFilter, sortConfig]);

  // Category-grouped products for the "By Category" drill-down table
  // Uses distinct customer counts per category (not sum of sub-category counts)
  const categoryGroupedProducts = useMemo(() => {
    // Build distinct customer sets per category from actual customer data
    const categoryCustomers = new Map<string, Set<string>>();
    filteredCustomers.forEach(c => {
      Object.keys(c.productARR).forEach(subCat => {
        const cat = realData.productCategoryIndex[subCat] || 'Other';
        if (!categoryCustomers.has(cat)) categoryCustomers.set(cat, new Set());
        categoryCustomers.get(cat)!.add(c.name);
      });
    });

    const catMap = new Map<string, { totalARR: number; subCategories: typeof filteredProducts }>();
    filteredProducts.forEach(p => {
      const cat = p.category || 'Other';
      if (!catMap.has(cat)) {
        catMap.set(cat, { totalARR: 0, subCategories: [] });
      }
      const entry = catMap.get(cat)!;
      entry.totalARR += p.totalARR;
      entry.subCategories.push(p);
    });
    // Compute averages using distinct customer count & sort
    return Array.from(catMap.entries())
      .map(([name, data]) => {
        const distinctCount = categoryCustomers.get(name)?.size || 0;
        return {
          name,
          totalARR: data.totalARR,
          customerCount: distinctCount,
          avgARRPerCustomer: distinctCount > 0 ? Math.round(data.totalARR / distinctCount) : 0,
          growthPercent: data.subCategories.length > 0
            ? Math.round(data.subCategories.reduce((sum, sc) => sum + sc.growthPercent, 0) / data.subCategories.length)
            : 0,
          subCategories: data.subCategories.sort((a, b) => b.totalARR - a.totalARR),
        };
      })
      .sort((a, b) => b.totalARR - a.totalARR);
  }, [filteredProducts, filteredCustomers, realData.productCategoryIndex]);

  // Sorted customers list for Customers tab
  const sortedCustomersList = useMemo(() => {
    let data = filteredCustomers.filter(c => c.currentARR > 0);

    // Apply sorting if set
    if (sortConfig) {
      data = [...data].sort((a: any, b: any) => {
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
    } else {
      // Default sort by ARR
      data = data.sort((a, b) => b.currentARR - a.currentARR);
    }

    return data;
  }, [filteredCustomers, sortConfig]);

  // Render Products Tab
  const renderProductsTab = () => {

    // Customer product matrix - uses filteredCustomersForProducts for Revenue Type filter
    const customerProductMatrix: Array<{
      name: string;
      region: string;
      vertical: string;
      totalARR: number;
      productCount: number;
      [key: string]: string | number;
    }> = filteredCustomersForProducts
      .filter(c => c.currentARR > 0)
      .map(c => ({
        name: c.name,
        region: c.region,
        vertical: c.vertical,
        totalARR: c.currentARR,
        productCount: c.products.length,
        ...c.productARR,
      }))
      .sort((a, b) => b.totalARR - a.totalARR)
      .slice(0, 30);

    // Cross-sell analysis - uses filteredCustomersForProducts for Revenue Type filter
    const crossSellData = [
      { name: '1 Sub-Category', count: filteredCustomersForProducts.filter(c => c.products.length === 1 && c.currentARR > 0).length },
      { name: '2 Sub-Categories', count: filteredCustomersForProducts.filter(c => c.products.length === 2 && c.currentARR > 0).length },
      { name: '3+ Sub-Categories', count: filteredCustomersForProducts.filter(c => c.products.length >= 3 && c.currentARR > 0).length },
    ];

    const allProductNames = [...new Set(products.map(p => p.name))];

    const toggleProductCategory = (cat: string) => {
      setExpandedProductCategories(prev => {
        const next = new Set(prev);
        if (next.has(cat)) next.delete(cat); else next.add(cat);
        return next;
      });
    };

    const allCategoryNames = categoryGroupedProducts.map(c => c.name);

    return (
      <div className="space-y-6">
        {/* View Mode Toggle */}
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-secondary-700">View Mode:</span>
            <div className="flex rounded-lg border border-secondary-200 overflow-hidden">
              <button
                onClick={() => setProductViewMode('product')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  productViewMode === 'product' ? 'bg-primary-500 text-white' : 'bg-white text-secondary-600'
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setProductViewMode('customer')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  productViewMode === 'customer' ? 'bg-primary-500 text-white' : 'bg-white text-secondary-600'
                }`}
              >
                By Customer
              </button>
            </div>
          </div>
        </div>

        {productViewMode === 'product' ? (
          <>
            {/* Category Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-5">
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Total Categories</p>
                <p className="text-3xl font-bold text-secondary-900">{categoryGroupedProducts.length}</p>
                <p className="text-xs text-secondary-400 mt-1">{filteredProducts.length} sub-categories</p>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Top Category</p>
                <p className="text-xl font-bold text-secondary-900">{categoryGroupedProducts[0]?.name || '-'}</p>
                <p className="text-sm text-secondary-500">{formatCurrency(categoryGroupedProducts[0]?.totalARR || 0)}</p>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Total Sub-Categories</p>
                <p className="text-3xl font-bold text-secondary-900">{filteredProducts.length}</p>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Most Adopted</p>
                <p className="text-xl font-bold text-secondary-900">
                  {categoryGroupedProducts.sort((a, b) => b.customerCount - a.customerCount)[0]?.name || '-'}
                </p>
                <p className="text-sm text-secondary-500">
                  {categoryGroupedProducts.sort((a, b) => b.customerCount - a.customerCount)[0]?.customerCount || 0} customers
                </p>
              </div>
            </div>

            {/* Category → Sub-Category Drill-Down Table */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-secondary-900">Category Performance</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedProductCategories(new Set(allCategoryNames))}
                    className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50 font-medium"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={() => setExpandedProductCategories(new Set())}
                    className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50 font-medium"
                  >
                    Collapse All
                  </button>
                  <button
                    onClick={() => exportToCSV(filteredProducts, 'category_performance')}
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
                      <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Category / Sub-Category</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Total ARR</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase"># Customers</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Avg ARR/Customer</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase"># Sub-Categories</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {categoryGroupedProducts.map((cat) => (
                      <React.Fragment key={cat.name}>
                        {/* Category row */}
                        <tr
                          className="bg-secondary-50/50 hover:bg-secondary-100 cursor-pointer"
                          onClick={() => toggleProductCategory(cat.name)}
                        >
                          <td className="px-4 py-3 font-semibold text-secondary-900">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold bg-primary-100 text-primary-700">
                                {expandedProductCategories.has(cat.name) ? '−' : '+'}
                              </span>
                              {cat.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-secondary-900">{formatCurrency(cat.totalARR)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-secondary-600">{cat.customerCount}</td>
                          <td className="px-4 py-3 text-right font-semibold text-secondary-600">{formatCurrency(cat.avgARRPerCustomer)}</td>
                          <td className="px-4 py-3 text-right text-secondary-600">{cat.subCategories.length}</td>
                        </tr>
                        {/* Sub-category rows (expanded) */}
                        {expandedProductCategories.has(cat.name) && cat.subCategories.map((sc) => (
                          <tr key={sc.id} className="hover:bg-secondary-50">
                            <td className="px-4 py-2 text-secondary-700 pl-12">{sc.name}</td>
                            <td className="px-4 py-2 text-right text-secondary-900">{formatCurrency(sc.totalARR)}</td>
                            <td className="px-4 py-2 text-right text-secondary-600">{sc.customerCount}</td>
                            <td className="px-4 py-2 text-right text-secondary-600">{formatCurrency(sc.avgARRPerCustomer)}</td>
                            <td className="px-4 py-2 text-right text-secondary-400">—</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category ARR Comparison Chart */}
            <ChartWrapper
              title="Category ARR Comparison"
              data={categoryGroupedProducts}
              filename="category_arr_comparison"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryGroupedProducts}
                    margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalARR" name="Total ARR" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartWrapper>
          </>
        ) : (() => {
          // Build category names from products
          const allCategoryNamesForMatrix = [...new Set(products.map(p => p.category))].sort();

          // Group customers by name, aggregate category-level ARR, keep SOW-level detail
          const customerCategoryMatrix = (() => {
            const custMap = new Map<string, {
              name: string; region: string; vertical: string; totalARR: number; sowCount: number;
              categoryARR: Record<string, number>;
              sows: Array<{ sowId: string; sowName: string; arr: number; categoryARR: Record<string, number> }>;
            }>();
            filteredCustomersForProducts.filter(c => c.currentARR > 0).forEach(c => {
              if (!custMap.has(c.name)) {
                custMap.set(c.name, { name: c.name, region: c.region, vertical: c.vertical, totalARR: 0, sowCount: 0, categoryARR: {}, sows: [] });
              }
              const entry = custMap.get(c.name)!;
              entry.totalARR += c.currentARR;
              entry.sowCount += 1;
              // Build category ARR for this SOW
              const sowCatARR: Record<string, number> = {};
              Object.entries(c.productARR).forEach(([subCat, arr]) => {
                const cat = realData.productCategoryIndex[subCat] || 'Other';
                sowCatARR[cat] = (sowCatARR[cat] || 0) + arr;
                entry.categoryARR[cat] = (entry.categoryARR[cat] || 0) + arr;
              });
              const sowMapping = realData.sowMappingIndex[c.sowId];
              entry.sows.push({ sowId: c.sowId, sowName: sowMapping?.SOW_Name || `SOW ${c.sowId}`, arr: c.currentARR, categoryARR: sowCatARR });
            });
            return Array.from(custMap.values()).sort((a, b) => b.totalARR - a.totalARR);
          })();

          // Apply customer name filter
          const filteredMatrix = customerNameFilter
            ? customerCategoryMatrix.filter(c => c.name.toLowerCase().includes(customerNameFilter.toLowerCase()))
            : customerCategoryMatrix;

          const allMatrixCustomerNames = filteredMatrix.map(c => c.name);

          const toggleMatrixCustomer = (name: string) => {
            setExpandedMatrixCustomers(prev => {
              const next = new Set(prev);
              if (next.has(name)) next.delete(name); else next.add(name);
              return next;
            });
          };

          return (
          <>
            {/* Customer Category Matrix */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-secondary-200">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold text-secondary-900">Customer Category Matrix</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedMatrixCustomers(new Set(allMatrixCustomerNames))}
                      className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50 font-medium"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={() => setExpandedMatrixCustomers(new Set())}
                      className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50 font-medium"
                    >
                      Collapse All
                    </button>
                    <button
                      onClick={() => exportToCSV(filteredMatrix.map(c => ({ Customer: c.name, Region: c.region, Vertical: c.vertical, ...c.categoryARR, 'Total ARR': c.totalARR })), 'customer_category_matrix')}
                      className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
                    >
                      Export
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-secondary-600">Customer:</label>
                  <input
                    type="text"
                    value={customerNameFilter}
                    onChange={(e) => setCustomerNameFilter(e.target.value)}
                    placeholder="Search customer name..."
                    className="px-3 py-1.5 text-sm border border-secondary-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
                  />
                  {customerNameFilter && (
                    <button onClick={() => setCustomerNameFilter('')} className="text-xs text-secondary-400 hover:text-secondary-600">&times; Clear</button>
                  )}
                  <span className="text-xs text-secondary-400 ml-2">{filteredMatrix.length} customers</span>
                </div>
              </div>
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full">
                  <thead className="bg-secondary-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-secondary-500 uppercase sticky left-0 bg-secondary-50 z-10">Customer / SOW</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Region</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Vertical</th>
                      {allCategoryNamesForMatrix.map(cat => (
                        <th key={cat} className="px-2 py-3 text-right text-[10px] font-semibold text-secondary-500 uppercase whitespace-nowrap">
                          {cat}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Total ARR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {filteredMatrix.slice(0, 50).map((cust) => (
                      <React.Fragment key={cust.name}>
                        {/* Customer summary row */}
                        <tr className="bg-secondary-50/50 hover:bg-secondary-100 cursor-pointer" onClick={() => toggleMatrixCustomer(cust.name)}>
                          <td className="px-3 py-2 font-semibold text-secondary-900 sticky left-0 bg-secondary-50/50 z-10">
                            <span className="inline-flex items-center gap-2">
                              <span className="w-5 h-5 flex items-center justify-center rounded text-xs font-bold bg-primary-100 text-primary-700">
                                {expandedMatrixCustomers.has(cust.name) ? '−' : '+'}
                              </span>
                              {cust.name}
                              <span className="text-xs font-normal text-secondary-400">({cust.sowCount} SOW{cust.sowCount !== 1 ? 's' : ''})</span>
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-secondary-600">{cust.region}</td>
                          <td className="px-3 py-2 text-xs text-secondary-600">{cust.vertical}</td>
                          {allCategoryNamesForMatrix.map(cat => (
                            <td key={cat} className="px-2 py-2 text-right">
                              {cust.categoryARR[cat] ? (
                                <span className="text-xs font-semibold text-secondary-900">{formatCurrency(cust.categoryARR[cat])}</span>
                              ) : (
                                <span className="text-xs text-secondary-300">-</span>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right font-semibold text-secondary-900">{formatCurrency(cust.totalARR)}</td>
                        </tr>
                        {/* SOW-level rows */}
                        {expandedMatrixCustomers.has(cust.name) && cust.sows.map((sow) => (
                          <tr key={`${cust.name}-${sow.sowId}`} className="hover:bg-secondary-50">
                            <td className="px-3 py-1.5 pl-12 text-secondary-700 sticky left-0 bg-white z-10">
                              <span className="text-sm">{sow.sowName}</span>
                              <span className="text-xs text-secondary-400 ml-1">(SOW {sow.sowId})</span>
                            </td>
                            <td className="px-3 py-1.5 text-xs text-secondary-400">—</td>
                            <td className="px-3 py-1.5 text-xs text-secondary-400">—</td>
                            {allCategoryNamesForMatrix.map(cat => (
                              <td key={cat} className="px-2 py-1.5 text-right">
                                {sow.categoryARR[cat] ? (
                                  <span className="text-xs text-secondary-700">{formatCurrency(sow.categoryARR[cat])}</span>
                                ) : (
                                  <span className="text-xs text-secondary-300">-</span>
                                )}
                              </td>
                            ))}
                            <td className="px-3 py-1.5 text-right text-sm text-secondary-700">{formatCurrency(sow.arr)}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cross-Sell Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartWrapper
                title="Cross-Sell Analysis"
                data={crossSellData}
                filename="cross_sell_analysis"
              >
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crossSellData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Customers" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-secondary-500 mt-4 text-center">
                  Cross-sell rate: {((crossSellData[1].count + crossSellData[2].count) / (crossSellData[0].count + crossSellData[1].count + crossSellData[2].count) * 100).toFixed(0)}%
                </p>
              </ChartWrapper>

              <ChartWrapper
                title="Category Performance Matrix"
                data={categoryGroupedProducts}
                filename="category_performance_matrix"
              >
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        type="number"
                        dataKey="customerCount"
                        name="Customers"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        label={{ value: 'Customer Count', position: 'bottom', fontSize: 11 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="avgARRPerCustomer"
                        name="Avg ARR"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(v) => formatCurrency(v)}
                        label={{ value: 'Avg ARR/Customer', angle: -90, position: 'left', fontSize: 11 }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === 'Avg ARR' ? formatCurrency(value) : value,
                          name
                        ]}
                      />
                      <Scatter name="Categories" data={categoryGroupedProducts} fill={COLORS.primary} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </div>
          </>
          );
        })()}
      </div>
    );
  };



  return (
    <div className="space-y-6">
      {/* Header - RENAMED to ARR Analytics */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">ARR Analytics</h1>
          <p className="text-secondary-500">Track ARR, retention, and customer metrics</p>
        </div>
        <button
          onClick={() => exportToCSV([
            { Metric: 'Current ARR', Value: metrics.currentARR },
            { Metric: isFilteredYearPast ? `Year End ARR (Dec ${filteredYear})` : `Year End Forecasted ARR (Dec ${filteredYear})`, Value: metrics.yearEndARR },
            { Metric: `Forecasted ARR (${formatMonthLabel(selectedARRMonth)})`, Value: metrics.monthForecast },
            { Metric: 'NRR', Value: metrics.nrr },
            { Metric: 'GRR', Value: metrics.grr },
            { Metric: 'Customer Count', Value: metrics.customerCount },
          ], 'arr_summary')}
          className="btn-primary"
        >
          Export Report
        </button>
      </div>

      {/* Global Filters - Multi-Select (Standard filters per requirements) */}
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
            selected={yearFilterMulti}
            onChange={setYearFilterMulti}
            placeholder="All Years"
          />

          <MultiSelectDropdown
            label="Months"
            options={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
            selected={monthFilterMulti}
            onChange={setMonthFilterMulti}
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
            label="Platforms"
            options={PLATFORMS}
            selected={platformFilter}
            onChange={setPlatformFilter}
            placeholder="All Platforms"
          />

          {/* Quantum/SMART Platform Filter (Change 5) - All ARR Analytics tabs */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-secondary-600">Quantum/SMART:</label>
            <select
              value={quantumSmartFilter}
              onChange={(e) => setQuantumSmartFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-secondary-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {PLATFORM_FILTER_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Revenue Type Filter - Only for ARR by Sub-Category tab */}
          {activeTab === 'products' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-secondary-600">Revenue Type:</label>
              <select
                value={revenueTypeFilter}
                onChange={(e) => setRevenueTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-secondary-200 rounded-lg bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {REVENUE_TYPES.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear All Filters Button - resets year/month to prior month defaults */}
          {(regionFilter.length > 0 || verticalFilter.length > 0 || segmentFilter.length > 0 || platformFilter.length !== DEFAULT_PLATFORMS.length || quantumSmartFilter !== 'All' || revenueTypeFilter !== 'Fees' || yearFilterMulti[0] !== priorMonthDefaults.year || monthFilterMulti[0] !== priorMonthDefaults.month) && (
            <button
              onClick={() => {
                setYearFilterMulti([priorMonthDefaults.year]);
                setMonthFilterMulti([priorMonthDefaults.month]);
                setRegionFilter([]);
                setVerticalFilter([]);
                setSegmentFilter([]);
                setPlatformFilter([...DEFAULT_PLATFORMS]);
                setQuantumSmartFilter('All');
                setRevenueTypeFilter('Fees');
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
            { id: 'movement', label: 'ARR Movement' },
            { id: 'customers', label: 'Customers' },
            { id: 'products', label: 'ARR by Category' },
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
      {activeTab === 'movement' && renderMovementTab()}
      {activeTab === 'customers' && renderCustomersTab()}
      {activeTab === 'products' && renderProductsTab()}
    </div>
  );
}
