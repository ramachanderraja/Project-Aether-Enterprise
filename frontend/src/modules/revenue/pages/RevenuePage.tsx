import { useState, useMemo, useRef, useEffect } from 'react';
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

const PRODUCT_CATEGORIES = ['Platform', 'Analytics', 'Integration', 'Services', 'Add-ons'];
const PRODUCT_SUB_CATEGORIES: Record<string, string[]> = {
  'Platform': ['Core Platform', 'Enterprise Edition', 'Cloud Suite'],
  'Analytics': ['Business Intelligence', 'Predictive Analytics', 'Real-time Dashboards'],
  'Integration': ['API Gateway', 'Data Connectors', 'ETL Tools'],
  'Services': ['Professional Services', 'Managed Services', 'Training'],
  'Add-ons': ['Security Pack', 'Compliance Module', 'Advanced Reporting'],
};
const MOVEMENT_REASONS = {
  New: ['New Logo', 'Referral', 'Marketing Campaign', 'Partner Deal'],
  Expansion: ['Upsell', 'Cross-sell', 'Additional Users', 'New Module'],
  ScheduleChange: ['Contract Schedule', 'Post Go-Live Rate', 'Milestone Rate Change', 'Volume Tier Change'],  // Added (Change 8)
  Contraction: ['Reduced Users', 'Downgrade', 'Partial Churn', 'Budget Cut'],
  Churn: ['Competitor', 'Budget Constraints', 'Poor Fit', 'Acquisition', 'Bankruptcy'],
};

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

// Get current date info for mock data
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-indexed

// ==================== SAMPLE DATA GENERATION ====================
const generateCustomers = (): Customer[] => {
  const customers: Customer[] = [];
  const companyNames = [
    'Acme Corp', 'TechGiant Inc', 'Global Finance', 'Retail Leaders', 'HealthTech Pro',
    'Manufacturing Co', 'Digital Solutions', 'Cloud Dynamics', 'Data Insights', 'Smart Systems',
    'Innovation Labs', 'Future Tech', 'Prime Industries', 'Alpha Group', 'Beta Solutions',
    'Gamma Corp', 'Delta Enterprises', 'Epsilon Holdings', 'Zeta Technologies', 'Eta Global',
    'Theta Systems', 'Iota Digital', 'Kappa Solutions', 'Lambda Tech', 'Mu Industries',
    'Nu Corporation', 'Xi Partners', 'Omicron Group', 'Pi Holdings', 'Rho Technologies',
    'Sigma Corp', 'Tau Enterprises', 'Upsilon Systems', 'Phi Digital', 'Chi Solutions',
    'Psi Technologies', 'Omega Group', 'Apex Corp', 'Summit Industries', 'Peak Solutions',
    'Zenith Holdings', 'Pinnacle Tech', 'Vertex Systems', 'Quantum Corp', 'Nexus Digital',
    'Synergy Solutions', 'Momentum Tech', 'Velocity Group', 'Catalyst Corp', 'Fusion Industries',
    // Add more to reach 100+
    ...Array.from({ length: 60 }, (_, i) => `Enterprise ${i + 1}`)
  ];

  const products = generateProducts();
  const productNames = products.map(p => p.name);

  companyNames.forEach((name, idx) => {
    const currentARR = Math.floor(Math.random() * 4990000) + 10000; // $10K - $5M
    const previousARR = currentARR * (0.7 + Math.random() * 0.6); // -30% to +30%
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const vertical = VERTICALS[Math.floor(Math.random() * VERTICALS.length)];
    const segment = SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)] as 'Enterprise' | 'SMB';
    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];

    // Assign 1-4 products to each customer
    const numProducts = Math.floor(Math.random() * 4) + 1;
    const customerProducts = productNames.sort(() => Math.random() - 0.5).slice(0, numProducts);
    const productARR: Record<string, number> = {};
    let remainingARR = currentARR;
    customerProducts.forEach((prod, i) => {
      if (i === customerProducts.length - 1) {
        productARR[prod] = remainingARR;
      } else {
        const portion = Math.floor(remainingARR * (0.2 + Math.random() * 0.5));
        productARR[prod] = portion;
        remainingARR -= portion;
      }
    });

    // Generate contract dates
    const contractStartYear = 2021 + Math.floor(Math.random() * 3);
    const contractStartMonth = Math.floor(Math.random() * 12) + 1;
    const contractStartDate = `${contractStartYear}-${String(contractStartMonth).padStart(2, '0')}-01`;

    // Generate renewal date (some in 2026)
    const renewalYear = Math.random() > 0.5 ? 2026 : currentYear;
    const renewalMonth = Math.floor(Math.random() * 12) + 1;
    const renewalDate = `${renewalYear}-${String(renewalMonth).padStart(2, '0')}-15`;
    const contractEndDate = renewalDate;

    // Product sub-category
    const productSubCategory = customerProducts[0] || 'Core Platform';

    // Determine movement type (added ScheduleChange - Change 8)
    let movementType: Customer['movementType'] = 'Flat';
    if (idx < 15) movementType = 'New';
    else if (currentARR > previousARR * 1.1) {
      // 20% of expansions are actually schedule changes
      movementType = Math.random() < 0.2 ? 'ScheduleChange' : 'Expansion';
    }
    else if (currentARR < previousARR * 0.9) movementType = 'Contraction';
    else if (currentARR === 0 || Math.random() < 0.05) movementType = 'Churn';
    else if (Math.random() < 0.1) movementType = 'ScheduleChange';  // Some flat changes are schedule-related

    const movementReason = movementType !== 'Flat'
      ? MOVEMENT_REASONS[movementType][Math.floor(Math.random() * MOVEMENT_REASONS[movementType].length)]
      : undefined;

    // Renewal risk for 2026 renewals
    let renewalRiskLevel: Customer['renewalRiskLevel'];
    if (renewalYear === 2026) {
      const riskRandom = Math.random();
      if (riskRandom < 0.6) renewalRiskLevel = 'Low';
      else if (riskRandom < 0.85) renewalRiskLevel = 'Medium';
      else if (riskRandom < 0.95) renewalRiskLevel = 'High';
      else renewalRiskLevel = 'Critical';
    }

    // Quantum/SMART classification (Change 5/6)
    // ~60% on Quantum, ~40% on SMART, with ~20% having a Go-Live date
    const quantumSmart: 'Quantum' | 'SMART' = Math.random() > 0.4 ? 'Quantum' : 'SMART';
    // Some customers have a Go-Live date indicating migration
    const hasGoLiveDate = Math.random() < 0.2;
    const quantumGoLiveDate = hasGoLiveDate
      ? `${2024 + Math.floor(Math.random() * 2)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-01`
      : undefined;

    // Fees Type from SOW Mapping (Change 4) - ~85% Fees, ~15% Travel
    const feesType: 'Fees' | 'Travel' = Math.random() > 0.15 ? 'Fees' : 'Travel';

    customers.push({
      id: `CUST-${String(idx + 1).padStart(4, '0')}`,
      sowId: `SOW-${String(idx + 1).padStart(5, '0')}`,
      name,
      currentARR: movementType === 'Churn' ? 0 : currentARR,
      previousARR: Math.round(previousARR),
      region,
      vertical,
      segment,
      platform,
      quantumSmart,
      quantumGoLiveDate,
      feesType,
      products: customerProducts,
      productARR,
      productSubCategory,
      contractStartDate,
      contractEndDate,
      renewalDate,
      renewalRiskLevel,
      movementType,
      movementReason,
    });
  });

  return customers;
};

const generateProducts = (): Product[] => {
  const products: Product[] = [];
  let productId = 1;

  Object.entries(PRODUCT_SUB_CATEGORIES).forEach(([category, subCategories]) => {
    subCategories.forEach(subCategory => {
      const totalARR = Math.floor(Math.random() * 15000000) + 1000000;
      const customerCount = Math.floor(Math.random() * 50) + 5;
      products.push({
        id: `PROD-${String(productId++).padStart(3, '0')}`,
        name: subCategory,
        category,
        subCategory,
        totalARR,
        customerCount,
        avgARRPerCustomer: Math.round(totalARR / customerCount),
        growthPercent: Math.floor(Math.random() * 60) - 10,
      });
    });
  });

  return products;
};

const generateMonthlyARRData = (): MonthlyARR[] => {
  const data: MonthlyARR[] = [];
  let baseARR = 85000000;

  // Historical data (24 months) - actuals only until previous month
  for (let i = 0; i < 24; i++) {
    const date = new Date(currentYear - 2, i, 1);
    const monthName = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const growth = baseARR * (0.01 + Math.random() * 0.03);
    baseARR += growth;

    // Check if this month is before current month
    const isActual = date < new Date(currentYear, currentMonth, 1);

    data.push({
      month: monthName,
      currentARR: isActual ? Math.round(baseARR) : 0,
      forecastedARR: 0,
    });
  }

  // Forecast data (through end of 2026)
  const monthsToForecast = (2026 - currentYear) * 12 + (12 - currentMonth);
  for (let i = 0; i < monthsToForecast; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const monthName = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const growth = baseARR * (0.015 + Math.random() * 0.025);
    baseARR += growth;

    data.push({
      month: monthName,
      currentARR: 0,
      forecastedARR: Math.round(baseARR),
    });
  }

  return data;
};

const generateARRMovementHistory = (): ARRMovementRecord[] => {
  const data: ARRMovementRecord[] = [];

  for (let i = 0; i < 24; i++) {
    const date = new Date(currentYear - 2, i, 1);
    const newBusiness = Math.floor(Math.random() * 3000000) + 500000;
    const expansion = Math.floor(Math.random() * 2000000) + 300000;
    const scheduleChange = Math.floor(Math.random() * 400000) + 50000;  // Added (Change 8)
    const contraction = -(Math.floor(Math.random() * 500000) + 100000);
    const churn = -(Math.floor(Math.random() * 800000) + 200000);

    data.push({
      date: date.toISOString().split('T')[0],
      newBusiness,
      expansion,
      scheduleChange,
      contraction,
      churn,
      netChange: newBusiness + expansion + scheduleChange + contraction + churn,
    });
  }

  return data;
};

// Utility function to classify platform based on Quantum/SMART rules (Change 5/6)
const classifyPlatform = (quantumSmart: string | undefined, quantumGoLiveDate: string | undefined, snapshotMonth: string): 'Quantum' | 'SMART' => {
  if (quantumGoLiveDate) {
    // Go-Live date takes precedence
    return snapshotMonth >= quantumGoLiveDate ? 'Quantum' : 'SMART';
  }
  // Fall back to column value, default to SMART if undefined
  return (quantumSmart as 'Quantum' | 'SMART') || 'SMART';
};

// Initialize data
const customers = generateCustomers();
const products = generateProducts();
const monthlyARRData = generateMonthlyARRData();
const arrMovementHistory = generateARRMovementHistory();

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

  // Filters - Multi-select support (standard filters per requirements)
  const [yearFilterMulti, setYearFilterMulti] = useState<string[]>([]);
  const [monthFilterMulti, setMonthFilterMulti] = useState<string[]>([]);
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

  // Customers
  const [show2026RenewalsOnly, setShow2026RenewalsOnly] = useState(false);

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
  }, [sowMappingStore.mappings]);

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
      // This filter affects the overall customer set for calculations

      // Year filter on renewal date (multi-select)
      if (yearFilterMulti.length > 0) {
        const renewalYear = new Date(c.renewalDate).getFullYear().toString();
        if (!yearFilterMulti.includes(renewalYear)) return false;
      }

      // Month filter on renewal date (multi-select)
      if (monthFilterMulti.length > 0) {
        const renewalMonth = new Date(c.renewalDate).getMonth();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        if (!monthFilterMulti.includes(monthNames[renewalMonth])) return false;
      }

      return true;
    });
  }, [enrichedCustomers, regionFilter, verticalFilter, segmentFilter, platformFilter, quantumSmartFilter, yearFilterMulti, monthFilterMulti]);

  // Filtered customers for Products tab with Revenue Type filter (Change 4)
  const filteredCustomersForProducts = useMemo(() => {
    if (revenueTypeFilter === 'All') return filteredCustomers;

    return filteredCustomers.filter(c => {
      // Use feesType from customer or look up from SOW Mapping
      const feesType = c.feesType || 'Fees';
      return feesType === revenueTypeFilter;
    });
  }, [filteredCustomers, revenueTypeFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeCustomers = filteredCustomers.filter(c => c.currentARR > 0);
    const currentARR = activeCustomers.reduce((sum, c) => sum + c.currentARR, 0);
    const previousARR = filteredCustomers.reduce((sum, c) => sum + c.previousARR, 0);
    const ytdGrowth = previousARR > 0 ? ((currentARR - previousARR) / previousARR) * 100 : 0;

    // Forecasted ARR (simple projection)
    const forecastedARR = currentARR * 1.15;
    const forecastedGrowth = ((forecastedARR - currentARR) / currentARR) * 100;

    // NRR and GRR
    const expansion = filteredCustomers
      .filter(c => c.movementType === 'Expansion')
      .reduce((sum, c) => sum + (c.currentARR - c.previousARR), 0);
    const contraction = filteredCustomers
      .filter(c => c.movementType === 'Contraction')
      .reduce((sum, c) => sum + (c.previousARR - c.currentARR), 0);
    const churn = filteredCustomers
      .filter(c => c.movementType === 'Churn')
      .reduce((sum, c) => sum + c.previousARR, 0);

    const nrr = previousARR > 0 ? ((previousARR + expansion - contraction - churn) / previousARR) * 100 : 0;
    const grr = previousARR > 0 ? ((previousARR - contraction - churn) / previousARR) * 100 : 0;

    return {
      currentARR,
      forecastedARR,
      ytdGrowth,
      forecastedGrowth,
      nrr,
      grr,
      customerCount: activeCustomers.length,
    };
  }, [filteredCustomers]);

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

  // ARR by Product
  const arrByProduct = useMemo(() => {
    const productData: Record<string, number> = {};
    filteredCustomers.forEach(c => {
      Object.entries(c.productARR).forEach(([product, arr]) => {
        productData[product] = (productData[product] || 0) + arr;
      });
    });
    return Object.entries(productData)
      .map(([name, arr]) => ({ name, arr }))
      .sort((a, b) => b.arr - a.arr);
  }, [filteredCustomers]);

  // ARR Movement Data based on lookback - TRUE FLOATING WATERFALL
  const arrMovementData = useMemo(() => {
    const months = parseInt(lookbackPeriod);
    const recentData = arrMovementHistory.slice(-months);

    const totals = recentData.reduce(
      (acc, record) => ({
        newBusiness: acc.newBusiness + record.newBusiness,
        expansion: acc.expansion + record.expansion,
        scheduleChange: acc.scheduleChange + record.scheduleChange,  // Added (Change 8)
        contraction: acc.contraction + record.contraction,
        churn: acc.churn + record.churn,
        netChange: acc.netChange + record.netChange,
      }),
      { newBusiness: 0, expansion: 0, scheduleChange: 0, contraction: 0, churn: 0, netChange: 0 }
    );

    // Starting ARR (go back X months)
    const currentARR = metrics.currentARR;
    const startingARR = currentARR - totals.netChange;

    // Build floating waterfall data with proper structure for stacked bars
    // Each bar has: bottom (invisible spacer), value (visible bar)
    let runningTotal = startingARR;

    const waterfallData: Array<{
      name: string;
      bottom: number;       // Invisible spacer height (where bar starts)
      value: number;        // Visible bar height (always positive for rendering)
      displayValue: number; // Value to display (can be negative)
      fill: string;
      type: 'initial' | 'increase' | 'decrease' | 'final';
      connectTo?: number;   // Y value to connect to next bar
    }> = [];

    // Starting ARR - anchored to axis (bottom = 0)
    waterfallData.push({
      name: 'Starting\nARR',
      bottom: 0,
      value: startingARR,
      displayValue: startingARR,
      fill: COLORS.gray,
      type: 'initial',
      connectTo: startingARR
    });

    // New Business - positive, floats from running total
    waterfallData.push({
      name: 'New\nBusiness',
      bottom: runningTotal,
      value: totals.newBusiness,
      displayValue: totals.newBusiness,
      fill: COLORS.success,
      type: 'increase',
      connectTo: runningTotal + totals.newBusiness
    });
    runningTotal += totals.newBusiness;

    // Expansion - positive, floats from running total
    waterfallData.push({
      name: 'Expansion',
      bottom: runningTotal,
      value: totals.expansion,
      displayValue: totals.expansion,
      fill: COLORS.primary,
      type: 'increase',
      connectTo: runningTotal + totals.expansion
    });
    runningTotal += totals.expansion;

    // Schedule Change - can be positive or negative (Change 8)
    if (totals.scheduleChange >= 0) {
      // Positive schedule change - floats from running total
      waterfallData.push({
        name: 'Schedule\nChange',
        bottom: runningTotal,
        value: totals.scheduleChange,
        displayValue: totals.scheduleChange,
        fill: COLORS.purple,
        type: 'increase',
        connectTo: runningTotal + totals.scheduleChange
      });
      runningTotal += totals.scheduleChange;
    } else {
      // Negative schedule change - bar hangs down
      const scheduleChangeAbs = Math.abs(totals.scheduleChange);
      waterfallData.push({
        name: 'Schedule\nChange',
        bottom: runningTotal - scheduleChangeAbs,
        value: scheduleChangeAbs,
        displayValue: totals.scheduleChange,
        fill: COLORS.purple,
        type: 'decrease',
        connectTo: runningTotal - scheduleChangeAbs
      });
      runningTotal -= scheduleChangeAbs;
    }

    // Contraction - negative, bar hangs down from running total
    const contractionAbs = Math.abs(totals.contraction);
    waterfallData.push({
      name: 'Contraction',
      bottom: runningTotal - contractionAbs,  // Bar bottom is at lower level
      value: contractionAbs,                   // Bar height
      displayValue: totals.contraction,        // Display as negative
      fill: COLORS.warning,
      type: 'decrease',
      connectTo: runningTotal - contractionAbs
    });
    runningTotal -= contractionAbs;

    // Churn - negative, bar hangs down from running total
    const churnAbs = Math.abs(totals.churn);
    waterfallData.push({
      name: 'Churn',
      bottom: runningTotal - churnAbs,
      value: churnAbs,
      displayValue: totals.churn,
      fill: COLORS.danger,
      type: 'decrease',
      connectTo: runningTotal - churnAbs
    });
    runningTotal -= churnAbs;

    // Ending ARR - anchored to axis (bottom = 0)
    waterfallData.push({
      name: 'Ending\nARR',
      bottom: 0,
      value: runningTotal,
      displayValue: runningTotal,
      fill: COLORS.primary,
      type: 'final'
    });

    return {
      startingARR,
      endingARR: currentARR,
      ...totals,
      waterfallData,
    };
  }, [lookbackPeriod, metrics.currentARR]);

  // Customers with movement - with sorting support
  const customersWithMovement = useMemo(() => {
    let data = filteredCustomers
      .filter(c => c.movementType && c.movementType !== 'Flat')
      .map(c => ({
        ...c,
        change: c.currentARR - c.previousARR,
        changePercent: c.previousARR > 0 ? ((c.currentARR - c.previousARR) / c.previousARR) * 100 : 100,
      }));

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
      // Default sort by absolute change
      data = data.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    }

    return data;
  }, [filteredCustomers, sortConfig]);

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

  // Render Overview Tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Current ARR</p>
          <p className="text-3xl font-bold text-secondary-900">{formatCurrency(metrics.currentARR)}</p>
          <p className={`text-sm mt-1 ${metrics.ytdGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(metrics.ytdGrowth)} YTD Growth
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Forecasted ARR</p>
          <p className="text-3xl font-bold text-primary-600">{formatCurrency(metrics.forecastedARR)}</p>
          <p className="text-sm text-primary-500 mt-1">{formatPercent(metrics.forecastedGrowth)} projected</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Net Revenue Retention</p>
          <p className={`text-3xl font-bold ${metrics.nrr >= 100 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.nrr.toFixed(1)}%
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Gross Retention</p>
          <p className={`text-3xl font-bold ${metrics.grr >= 90 ? 'text-green-600' : metrics.grr >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
            {metrics.grr.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* ARR Trend */}
      <ChartWrapper
        title="ARR Trend"
        data={monthlyARRData.slice(-24)}
        filename="arr_trend"
      >
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyARRData.slice(-24)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="currentARR"
                name="Current ARR"
                stroke={COLORS.primary}
                fill={COLORS.primary}
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="forecastedARR"
                name="Forecasted ARR"
                stroke={COLORS.purple}
                fill={COLORS.purple}
                fillOpacity={0.2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ARR by Product */}
        <ChartWrapper
          title="ARR by Product"
          data={arrByProduct}
          filename="arr_by_product"
        >
          <div className="flex items-center justify-end mb-4">
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="px-3 py-1 border border-secondary-200 rounded text-sm"
            >
              <option value="All">All Categories</option>
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={arrByProduct.slice(0, 8)}
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={95} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="arr" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>

        {/* ARR by Region */}
        <ChartWrapper
          title="ARR by Region"
          data={arrByRegion}
          filename="arr_by_region"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={arrByRegion}
                margin={{ top: 0, right: 30, left: 100, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                <YAxis dataKey="region" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={95} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="arr" fill={COLORS.teal} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartWrapper>

        {/* ARR by Vertical */}
        <ChartWrapper
          title="ARR by Vertical"
          data={arrByVertical}
          filename="arr_by_vertical"
        >
          <div className="h-64 lg:col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={arrByVertical}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {arrByVertical.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
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

      {/* Movement Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Net ARR Change</p>
          <p className={`text-2xl font-bold ${arrMovementData.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {arrMovementData.netChange >= 0 ? '+' : ''}{formatCurrency(arrMovementData.netChange)}
          </p>
        </div>
        <div className="card p-5 border-l-4 border-green-500">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">New Business</p>
          <p className="text-2xl font-bold text-green-600">+{formatCurrency(arrMovementData.newBusiness)}</p>
        </div>
        <div className="card p-5 border-l-4 border-blue-500">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Expansion</p>
          <p className="text-2xl font-bold text-blue-600">+{formatCurrency(arrMovementData.expansion)}</p>
        </div>
        <div className="card p-5 border-l-4 border-purple-500">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Schedule Change</p>
          <p className={`text-2xl font-bold ${arrMovementData.scheduleChange >= 0 ? 'text-purple-600' : 'text-purple-600'}`}>
            {arrMovementData.scheduleChange >= 0 ? '+' : ''}{formatCurrency(arrMovementData.scheduleChange)}
          </p>
        </div>
        <div className="card p-5 border-l-4 border-yellow-500">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Contraction</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(arrMovementData.contraction)}</p>
        </div>
        <div className="card p-5 border-l-4 border-red-500">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Churn</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(arrMovementData.churn)}</p>
        </div>
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

              {/* Visible value bar - stacked on top of spacer */}
              <Bar
                dataKey="value"
                stackId="waterfall"
                radius={[4, 4, 4, 4]}
              >
                {arrMovementData.waterfallData.map((entry, index) => (
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
        <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-secondary-900">ARR Movement Details</h2>
          <button
            onClick={() => exportToCSV(customersWithMovement, 'arr_movement_details')}
            className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
          >
            Export
          </button>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full">
            <thead className="bg-secondary-50 sticky top-0">
              <tr>
                <SortableHeader label="Customer" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Previous ARR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Current ARR</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Change ($)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Change (%)</th>
                <SortableHeader label="Type" sortKey="movementType" currentSort={sortConfig} onSort={handleSort} filterOptions={['New', 'Expansion', 'ScheduleChange', 'Contraction', 'Churn']} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {customersWithMovement.slice(0, 20).map((customer) => (
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
                  <td className="px-4 py-3 text-right font-medium text-secondary-900">{formatCurrency(customer.currentARR)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${customer.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {customer.change >= 0 ? '+' : ''}{formatCurrency(customer.change)}
                  </td>
                  <td className={`px-4 py-3 text-right ${customer.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(customer.changePercent)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      customer.movementType === 'New' ? 'bg-green-100 text-green-800' :
                      customer.movementType === 'Expansion' ? 'bg-blue-100 text-blue-800' :
                      customer.movementType === 'Contraction' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {customer.movementType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-secondary-600">{customer.movementReason || '-'}</td>
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
                customersWithMovement.filter(c => c.movementType === 'Expansion' || c.movementType === 'New').slice(0, 5),
                'top_expansions'
              )}
              className="px-2 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
          <div className="space-y-3">
            {customersWithMovement
              .filter(c => c.movementType === 'Expansion' || c.movementType === 'New')
              .slice(0, 5)
              .map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary-900">{customer.name}</p>
                    <p className="text-xs text-secondary-500">{customer.movementReason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+{formatCurrency(customer.change)}</p>
                    <p className="text-xs text-green-500">{formatPercent(customer.changePercent)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Top Contractions/Churns */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Top Contractions & Churns</h2>
            <button
              onClick={() => exportToCSV(
                customersWithMovement.filter(c => c.movementType === 'Contraction' || c.movementType === 'Churn').slice(0, 5),
                'top_contractions'
              )}
              className="px-2 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
          <div className="space-y-3">
            {customersWithMovement
              .filter(c => c.movementType === 'Contraction' || c.movementType === 'Churn')
              .slice(0, 5)
              .map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary-900">{customer.name}</p>
                    <p className="text-xs text-secondary-500">{customer.movementReason}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{formatCurrency(customer.change)}</p>
                    <p className="text-xs text-red-500">{formatPercent(customer.changePercent)}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Movement Trend */}
      <ChartWrapper
        title="Monthly Movement Trend"
        data={arrMovementHistory.slice(-12)}
        filename="movement_trend"
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={arrMovementHistory.slice(-12)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short' })}
              />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Area type="monotone" dataKey="newBusiness" name="New Business" stackId="1" stroke={COLORS.success} fill={COLORS.success} fillOpacity={0.6} />
              <Area type="monotone" dataKey="expansion" name="Expansion" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartWrapper>
    </div>
  );

  // Render Customers Tab
  const renderCustomersTab = () => {
    // Use sortedCustomersList for proper sorting support
    const displayedCustomers = show2026RenewalsOnly
      ? renewals2026
      : sortedCustomersList;

    return (
      <div className="space-y-6">
        {/* 2026 Renewals Toggle */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={show2026RenewalsOnly}
                  onChange={(e) => setShow2026RenewalsOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700">Show 2026 Renewals Only</span>
              </label>
            </div>
            <button
              onClick={() => exportToCSV(displayedCustomers, 'customers')}
              className="px-4 py-2 border border-secondary-200 rounded-lg text-sm font-medium text-secondary-600 hover:bg-secondary-50"
            >
              Export
            </button>
          </div>
        </div>

        {/* 2026 Renewal Risk Distribution */}
        {show2026RenewalsOnly && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ChartWrapper
              title="2026 Renewal Risk Distribution"
              data={renewalRiskDistribution}
              filename="renewal_risk_distribution"
            >
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={renewalRiskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill={COLORS.success} />
                      <Cell fill={COLORS.warning} />
                      <Cell fill="#f97316" />
                      <Cell fill={COLORS.danger} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartWrapper>

            <div className="card p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">2026 Renewal Calendar</h2>
              <div className="grid grid-cols-12 gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const monthRenewals = renewals2026.filter(c => {
                    const month = new Date(c.renewalDate).getMonth();
                    return month === i;
                  });
                  const totalARR = monthRenewals.reduce((sum, c) => sum + c.currentARR, 0);
                  const hasHighRisk = monthRenewals.some(c => c.renewalRiskLevel === 'High' || c.renewalRiskLevel === 'Critical');

                  return (
                    <div
                      key={i}
                      className={`p-2 rounded text-center ${
                        hasHighRisk ? 'bg-red-100' : monthRenewals.length > 0 ? 'bg-blue-100' : 'bg-secondary-100'
                      }`}
                    >
                      <p className="text-xs font-medium text-secondary-600">
                        {new Date(2026, i, 1).toLocaleString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-sm font-bold text-secondary-900">{monthRenewals.length}</p>
                      <p className="text-[10px] text-secondary-500">{formatCurrency(totalARR)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Customer Table */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">
              {show2026RenewalsOnly ? '2026 Renewals' : 'All Customers'} ({displayedCustomers.length})
            </h2>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full">
              <thead className="bg-secondary-50 sticky top-0">
                <tr>
                  <SortableHeader label="Customer" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                  <SortableHeader label="Current ARR" sortKey="currentARR" currentSort={sortConfig} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Products</th>
                  <SortableHeader label="Region" sortKey="region" currentSort={sortConfig} onSort={handleSort} filterOptions={REGIONS} />
                  <SortableHeader label="Vertical" sortKey="vertical" currentSort={sortConfig} onSort={handleSort} filterOptions={VERTICALS} />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Contract Start</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Renewal Date</th>
                  {show2026RenewalsOnly && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Renewal Risk</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {displayedCustomers.slice(0, 50).map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 font-medium text-secondary-900">{customer.name}</td>
                    <td className="px-4 py-3 text-right font-medium text-secondary-900">{formatCurrency(customer.currentARR)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {customer.products.slice(0, 2).map((p, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary-100 text-secondary-700">
                            {p}
                          </span>
                        ))}
                        {customer.products.length > 2 && (
                          <span className="text-xs text-secondary-400">+{customer.products.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary-600">{customer.region}</td>
                    <td className="px-4 py-3 text-secondary-600">{customer.vertical}</td>
                    <td className="px-4 py-3 text-secondary-600">
                      {new Date(customer.contractStartDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-secondary-600">
                      {new Date(customer.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    {show2026RenewalsOnly && (
                      <td className="px-4 py-3">
                        {customer.renewalRiskLevel && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            customer.renewalRiskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                            customer.renewalRiskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            customer.renewalRiskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {customer.renewalRiskLevel}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ARR Concentration */}
        <ChartWrapper
          title="Top 10 Customers by ARR"
          data={filteredCustomers
            .filter(c => c.currentARR > 0)
            .sort((a, b) => b.currentARR - a.currentARR)
            .slice(0, 10)
            .map(c => ({ name: c.name, arr: c.currentARR }))
          }
          filename="top_customers"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={filteredCustomers
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
  }, [productCategoryFilter, productSubCategoryFilter, sortConfig]);

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
      { name: '1 Product', count: filteredCustomersForProducts.filter(c => c.products.length === 1 && c.currentARR > 0).length },
      { name: '2 Products', count: filteredCustomersForProducts.filter(c => c.products.length === 2 && c.currentARR > 0).length },
      { name: '3+ Products', count: filteredCustomersForProducts.filter(c => c.products.length >= 3 && c.currentARR > 0).length },
    ];

    const allProductNames = [...new Set(products.map(p => p.name))];

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
                By Product
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

            <select
              value={productCategoryFilter}
              onChange={(e) => {
                setProductCategoryFilter(e.target.value);
                setProductSubCategoryFilter('All');
              }}
              className="px-4 py-2 border border-secondary-200 rounded-lg text-sm ml-auto"
            >
              <option value="All">All Categories</option>
              {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {productCategoryFilter !== 'All' && (
              <select
                value={productSubCategoryFilter}
                onChange={(e) => setProductSubCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-secondary-200 rounded-lg text-sm"
              >
                <option value="All">All Sub-Categories</option>
                {PRODUCT_SUB_CATEGORIES[productCategoryFilter]?.map(sc => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {productViewMode === 'product' ? (
          <>
            {/* Product Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-5">
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Total Products</p>
                <p className="text-3xl font-bold text-secondary-900">{filteredProducts.length}</p>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Top Product</p>
                <p className="text-xl font-bold text-secondary-900">{filteredProducts[0]?.name || '-'}</p>
                <p className="text-sm text-secondary-500">{formatCurrency(filteredProducts[0]?.totalARR || 0)}</p>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Fastest Growing</p>
                <p className="text-xl font-bold text-secondary-900">
                  {filteredProducts.sort((a, b) => b.growthPercent - a.growthPercent)[0]?.name || '-'}
                </p>
                <p className="text-sm text-green-600">
                  +{filteredProducts.sort((a, b) => b.growthPercent - a.growthPercent)[0]?.growthPercent || 0}%
                </p>
              </div>
              <div className="card p-5">
                <p className="text-xs font-semibold text-secondary-500 uppercase mb-2">Most Customers</p>
                <p className="text-xl font-bold text-secondary-900">
                  {filteredProducts.sort((a, b) => b.customerCount - a.customerCount)[0]?.name || '-'}
                </p>
                <p className="text-sm text-secondary-500">
                  {filteredProducts.sort((a, b) => b.customerCount - a.customerCount)[0]?.customerCount || 0} customers
                </p>
              </div>
            </div>

            {/* Product Table */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-secondary-900">Product Performance</h2>
                <button
                  onClick={() => exportToCSV(filteredProducts, 'product_performance')}
                  className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
                >
                  Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <SortableHeader label="Product" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                      <SortableHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} filterOptions={PRODUCT_CATEGORIES} />
                      <SortableHeader label="Total ARR" sortKey="totalARR" currentSort={sortConfig} onSort={handleSort} />
                      <SortableHeader label="# Customers" sortKey="customerCount" currentSort={sortConfig} onSort={handleSort} />
                      <th className="px-4 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Avg ARR/Customer</th>
                      <SortableHeader label="Growth %" sortKey="growthPercent" currentSort={sortConfig} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-secondary-50">
                        <td className="px-4 py-3 font-medium text-secondary-900">{product.name}</td>
                        <td className="px-4 py-3 text-secondary-600">{product.category}</td>
                        <td className="px-4 py-3 text-right font-medium text-secondary-900">{formatCurrency(product.totalARR)}</td>
                        <td className="px-4 py-3 text-right text-secondary-600">{product.customerCount}</td>
                        <td className="px-4 py-3 text-right text-secondary-600">{formatCurrency(product.avgARRPerCustomer)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${product.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.growthPercent >= 0 ? '+' : ''}{product.growthPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Trend */}
            <ChartWrapper
              title="Product ARR Comparison"
              data={filteredProducts.slice(0, 10)}
              filename="product_arr_comparison"
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredProducts.slice(0, 10)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalARR" name="Total ARR" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartWrapper>
          </>
        ) : (
          <>
            {/* Customer-Product Matrix */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-secondary-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-secondary-900">Customer-Product Matrix</h2>
                <button
                  onClick={() => exportToCSV(customerProductMatrix, 'customer_product_matrix')}
                  className="px-3 py-1 text-xs border border-secondary-200 rounded hover:bg-secondary-50"
                >
                  Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-secondary-500 uppercase sticky left-0 bg-secondary-50">Customer</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Region</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-secondary-500 uppercase">Vertical</th>
                      {allProductNames.slice(0, 8).map(p => (
                        <th key={p} className="px-2 py-3 text-right text-[10px] font-semibold text-secondary-500 uppercase whitespace-nowrap">
                          {p.split(' ').slice(0, 2).join(' ')}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-right text-xs font-semibold text-secondary-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {customerProductMatrix.slice(0, 20).map((row) => (
                      <tr key={row.name} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 font-medium text-secondary-900 sticky left-0 bg-white">{row.name}</td>
                        <td className="px-3 py-2 text-xs text-secondary-600">{row.region}</td>
                        <td className="px-3 py-2 text-xs text-secondary-600">{row.vertical}</td>
                        {allProductNames.slice(0, 8).map(p => (
                          <td key={p} className="px-2 py-2 text-right">
                            {row[p] ? (
                              <span className="text-xs font-medium text-secondary-900">{formatCurrency(row[p] as number)}</span>
                            ) : (
                              <span className="text-xs text-secondary-300">-</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-medium text-secondary-900">{formatCurrency(row.totalARR)}</td>
                      </tr>
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
                title="Product Performance Matrix"
                data={filteredProducts}
                filename="product_performance_matrix"
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
                      <Scatter name="Products" data={filteredProducts} fill={COLORS.primary} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </div>
          </>
        )}
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
            { Metric: 'Forecasted ARR', Value: metrics.forecastedARR },
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

          {/* Revenue Type Filter - Only for ARR by Products tab */}
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

          {/* Clear All Filters Button */}
          {(yearFilterMulti.length > 0 || monthFilterMulti.length > 0 || regionFilter.length > 0 || verticalFilter.length > 0 || segmentFilter.length > 0 || platformFilter.length !== DEFAULT_PLATFORMS.length || quantumSmartFilter !== 'All' || revenueTypeFilter !== 'Fees') && (
            <button
              onClick={() => {
                setYearFilterMulti([]);
                setMonthFilterMulti([]);
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
            { id: 'products', label: 'ARR by Products' },
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
