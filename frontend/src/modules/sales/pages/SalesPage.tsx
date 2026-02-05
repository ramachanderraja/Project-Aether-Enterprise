import { useState, useMemo, useRef, useEffect } from 'react';
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

// ==================== TYPE DEFINITIONS ====================
interface Opportunity {
  id: string;
  name: string;
  accountName: string;
  region: string;
  vertical: string;
  channel: string;
  stage: string;
  probability: number;
  dealValue: number;
  weightedValue: number;
  expectedCloseDate: string;
  daysInStage: number;
  owner: string;
  status: 'Active' | 'Won' | 'Lost' | 'Stalled';
  lossReason?: string;
  revenueType: 'License' | 'Implementation';
  salesCycleDays: number;
  createdDate: string;
  previousValue?: number;
  movementReason?: string;
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
  actual: number;
  variance: number;
  percentToTarget: number;
}

type SortDirection = 'asc' | 'desc';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

// ==================== SAMPLE DATA GENERATION ====================
const REGIONS = ['North America', 'Europe', 'Middle East', 'APAC', 'LATAM'];
const VERTICALS = ['Technology', 'Healthcare', 'Financial Services', 'Retail', 'Manufacturing', 'Education'];
const CHANNELS = ['Direct', 'Partner', 'Reseller', 'Organic', 'Referral'];
const STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const LOSS_REASONS = ['Budget Constraints', 'Competitor Selected', 'Project Cancelled', 'Timeline Delayed', 'Price Sensitivity', 'No Decision'];
const MOVEMENT_REASONS = ['Expanded Scope', 'Reduced Scope', 'Lost to Competitor', 'Budget Cuts', 'Timeline Change', 'New Opportunity'];

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
    const revenueType = Math.random() > 0.3 ? 'License' : 'Implementation';

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

    opportunities.push({
      id: `OPP-${String(i).padStart(4, '0')}`,
      name: `${['Enterprise', 'Platform', 'Cloud', 'Analytics', 'Integration'][Math.floor(Math.random() * 5)]} Deal ${i}`,
      accountName: `${['Acme', 'Global', 'Tech', 'Prime', 'Alpha'][Math.floor(Math.random() * 5)]} ${['Corp', 'Inc', 'Solutions', 'Industries', 'Group'][Math.floor(Math.random() * 5)]}`,
      region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      vertical: VERTICALS[Math.floor(Math.random() * VERTICALS.length)],
      channel: CHANNELS[Math.floor(Math.random() * CHANNELS.length)],
      stage,
      probability,
      dealValue,
      weightedValue: Math.round(dealValue * (probability / 100)),
      expectedCloseDate: closeDate.toISOString().split('T')[0],
      daysInStage: Math.floor(Math.random() * 120) + 5,
      owner: SALESPERSON_NAMES[Math.floor(Math.random() * SALESPERSON_NAMES.length)],
      status: isWon ? 'Won' : isLost ? 'Lost' : Math.random() > 0.9 ? 'Stalled' : 'Active',
      lossReason: isLost ? LOSS_REASONS[Math.floor(Math.random() * LOSS_REASONS.length)] : undefined,
      revenueType,
      salesCycleDays: Math.floor(Math.random() * 120) + 30,
      createdDate: createdDate.toISOString().split('T')[0],
      previousValue: previousValue ? Math.round(previousValue) : undefined,
      movementReason: previousValue ? MOVEMENT_REASONS[Math.floor(Math.random() * MOVEMENT_REASONS.length)] : undefined,
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

const opportunities = generateOpportunities();
const salespeople = generateSalespeople();

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

const quarterlyForecastData = getQuarterlyForecastData();

// Regional forecast data
const regionalForecastData: RegionalForecast[] = REGIONS.map(region => {
  const target = Math.floor(Math.random() * 3000000) + 2000000;
  const actual = Math.floor(Math.random() * target * 0.8);
  const forecast = actual + Math.floor(Math.random() * 1000000);
  return {
    region,
    forecast,
    target,
    actual,
    variance: forecast - target,
    percentToTarget: Math.round((forecast / target) * 100),
  };
});

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
  // Filters - now with multi-select support
  const [revenueType, setRevenueType] = useState<string[]>(['License']);
  const [yearFilter, setYearFilter] = useState<string[]>([String(currentYear)]);
  const [quarterFilter, setQuarterFilter] = useState<string[]>([]);
  const [monthFilter, setMonthFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [verticalFilter, setVerticalFilter] = useState<string[]>([]);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);

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

  // Filter opportunities based on selected filters (multi-select)
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      // Revenue type filter (multi-select)
      if (revenueType.length > 0 && !revenueType.includes(opp.revenueType)) return false;

      // Region filter (multi-select)
      if (regionFilter.length > 0 && !regionFilter.includes(opp.region)) return false;

      // Vertical filter (multi-select)
      if (verticalFilter.length > 0 && !verticalFilter.includes(opp.vertical)) return false;

      // Channel filter (multi-select)
      if (channelFilter.length > 0 && !channelFilter.includes(opp.channel)) return false;

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

      return true;
    });
  }, [revenueType, yearFilter, quarterFilter, monthFilter, regionFilter, verticalFilter, channelFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const closedWon = filteredOpportunities.filter(o => o.status === 'Won');
    const closedLost = filteredOpportunities.filter(o => o.status === 'Lost');
    const allClosed = [...closedWon, ...closedLost];
    const activeDeals = filteredOpportunities.filter(o => o.status === 'Active' || o.status === 'Stalled');

    const totalClosedACV = closedWon.reduce((sum, o) => sum + o.dealValue, 0);
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
                  <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase tracking-wider">Actual</th>
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
                    <td className="px-4 py-4 text-right text-secondary-600">{formatCurrency(region.actual)}</td>
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

        {/* Forecast Trend */}
        <ChartWrapper
          title="Forecast Trend"
          data={[
            { month: 'Jan', forecast: 35000000, target: 40000000 },
            { month: 'Feb', forecast: 36500000, target: 40000000 },
            { month: 'Mar', forecast: 37200000, target: 40000000 },
            { month: 'Apr', forecast: 38100000, target: 40000000 },
            { month: 'May', forecast: 38800000, target: 40000000 },
            { month: 'Jun', forecast: 39500000, target: 40000000 },
          ]}
          filename="forecast_trend"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { month: 'Jan', forecast: 35000000, target: 40000000 },
                  { month: 'Feb', forecast: 36500000, target: 40000000 },
                  { month: 'Mar', forecast: 37200000, target: 40000000 },
                  { month: 'Apr', forecast: 38100000, target: 40000000 },
                  { month: 'May', forecast: 38800000, target: 40000000 },
                  { month: 'Jun', forecast: 39500000, target: 40000000 },
                ]}
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
                fill="transparent"
                radius={0}
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
    </div>
  );

  const renderQuotaTab = () => {
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
        const teamTarget = teamMembers.reduce((sum, s) => sum + s.annualTarget, 0) + sp.annualTarget;
        return { ...sp, teamClosed, teamForecast, teamPipeline, teamTarget, pipelineCoverage, forecastAttainment, ytdAttainment };
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

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

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
            label="Revenue Types"
            options={['License', 'Implementation']}
            selected={revenueType}
            onChange={setRevenueType}
            placeholder="All Revenue Types"
          />

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
            label="Channels"
            options={CHANNELS}
            selected={channelFilter}
            onChange={setChannelFilter}
            placeholder="All Channels"
          />

          {/* Clear All Filters Button */}
          {(revenueType.length > 0 || yearFilter.length > 0 || quarterFilter.length > 0 || monthFilter.length > 0 || regionFilter.length > 0 || verticalFilter.length > 0 || channelFilter.length > 0) && (
            <button
              onClick={() => {
                setRevenueType([]);
                setYearFilter([]);
                setQuarterFilter([]);
                setMonthFilter([]);
                setRegionFilter([]);
                setVerticalFilter([]);
                setChannelFilter([]);
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
