import { useState } from 'react';
import {
  Rocket,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Users,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface GTMMetric {
  id: string;
  metric: string;
  value: number;
  previousValue: number;
  trend: number;
  unit: string;
  prefix?: string;
  suffix?: string;
  category: 'acquisition' | 'retention' | 'efficiency' | 'growth';
  benchmark?: number;
  target?: number;
  description: string;
}

const MOCK_GTM_METRICS: GTMMetric[] = [
  { id: '1', metric: 'Customer Acquisition Cost', value: 4250, previousValue: 4480, trend: -5.1, unit: '$', prefix: '$', category: 'acquisition', benchmark: 5000, target: 4000, description: 'Average cost to acquire a new customer' },
  { id: '2', metric: 'CAC Payback Period', value: 14, previousValue: 15, trend: -6.7, unit: 'months', suffix: ' mo', category: 'efficiency', benchmark: 18, target: 12, description: 'Time to recover customer acquisition cost' },
  { id: '3', metric: 'Lifetime Value (LTV)', value: 28500, previousValue: 26400, trend: 8.0, unit: '$', prefix: '$', category: 'retention', benchmark: 25000, target: 30000, description: 'Total revenue expected from a customer' },
  { id: '4', metric: 'LTV : CAC Ratio', value: 6.7, previousValue: 5.9, trend: 13.6, unit: 'x', suffix: 'x', category: 'efficiency', benchmark: 3.0, target: 5.0, description: 'Return on customer acquisition investment' },
  { id: '5', metric: 'Net Revenue Retention', value: 118, previousValue: 112, trend: 5.4, unit: '%', suffix: '%', category: 'retention', benchmark: 100, target: 120, description: 'Revenue retained + expansion from existing customers' },
  { id: '6', metric: 'Magic Number', value: 1.2, previousValue: 1.0, trend: 20.0, unit: 'x', suffix: 'x', category: 'growth', benchmark: 0.75, target: 1.0, description: 'Sales efficiency metric (ARR growth / S&M spend)' },
  { id: '7', metric: 'Rule of 40', value: 52, previousValue: 45, trend: 15.6, unit: '%', suffix: '%', category: 'growth', benchmark: 40, target: 50, description: 'Growth rate + profit margin' },
  { id: '8', metric: 'Gross Margin', value: 72, previousValue: 70, trend: 2.9, unit: '%', suffix: '%', category: 'efficiency', benchmark: 70, target: 75, description: 'Revenue minus cost of goods sold' },
];

const TREND_DATA = [
  { month: 'Jul', cac: 4800, ltv: 24000, ltvCacRatio: 5.0 },
  { month: 'Aug', cac: 4650, ltv: 25200, ltvCacRatio: 5.4 },
  { month: 'Sep', cac: 4500, ltv: 26100, ltvCacRatio: 5.8 },
  { month: 'Oct', cac: 4480, ltv: 26400, ltvCacRatio: 5.9 },
  { month: 'Nov', cac: 4350, ltv: 27500, ltvCacRatio: 6.3 },
  { month: 'Dec', cac: 4250, ltv: 28500, ltvCacRatio: 6.7 },
];

const COHORT_DATA = [
  { cohort: 'Q1 2024', month0: 100, month3: 92, month6: 85, month9: 80, month12: 76 },
  { cohort: 'Q2 2024', month0: 100, month3: 94, month6: 88, month9: 83, month12: null },
  { cohort: 'Q3 2024', month0: 100, month3: 95, month6: 90, month9: null, month12: null },
  { cohort: 'Q4 2024', month0: 100, month3: 96, month6: null, month9: null, month12: null },
];

const CATEGORY_COLORS = {
  acquisition: 'blue',
  retention: 'emerald',
  efficiency: 'purple',
  growth: 'orange',
};

const CATEGORY_ICONS = {
  acquisition: Users,
  retention: Target,
  efficiency: Zap,
  growth: Rocket,
};

export default function GTMPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const filteredMetrics = selectedCategory === 'all'
    ? MOCK_GTM_METRICS
    : MOCK_GTM_METRICS.filter(m => m.category === selectedCategory);

  const formatValue = (metric: GTMMetric) => {
    const formatted = metric.value >= 1000 && !metric.suffix
      ? `${(metric.value / 1000).toFixed(1)}k`
      : metric.value.toLocaleString();
    return `${metric.prefix || ''}${formatted}${metric.suffix || ''}`;
  };

  const getStatusColor = (metric: GTMMetric) => {
    if (!metric.target) return 'text-secondary-400';
    const isPositiveGood = !['CAC Payback Period', 'Customer Acquisition Cost'].includes(metric.metric);
    const isGood = isPositiveGood ? metric.value >= metric.target : metric.value <= metric.target;
    return isGood ? 'text-green-500' : 'text-yellow-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
            <Rocket className="w-7 h-7 text-primary-600" />
            Go-To-Market Metrics
          </h1>
          <p className="text-secondary-500 mt-1">Unit economics and growth efficiency KPIs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary-500 mr-2">Filter by:</span>
          {['all', 'acquisition', 'retention', 'efficiency', 'growth'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMetrics.map((metric) => {
          const CategoryIcon = CATEGORY_ICONS[metric.category];
          const color = CATEGORY_COLORS[metric.category];

          return (
            <div
              key={metric.id}
              className="card p-5 hover:shadow-lg transition-all cursor-pointer relative group"
              onMouseEnter={() => setHoveredMetric(metric.id)}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              {/* Category Badge */}
              <div className={`absolute top-3 right-3 p-1.5 rounded-lg bg-${color}-100`}>
                <CategoryIcon className={`w-4 h-4 text-${color}-600`} />
              </div>

              {/* Metric Name */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-medium text-secondary-500 uppercase tracking-wider">
                  {metric.metric}
                </h3>
                <div className="relative">
                  <Info className="w-3.5 h-3.5 text-secondary-400 cursor-help" />
                  {hoveredMetric === metric.id && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-secondary-900 text-white text-xs rounded-lg shadow-lg w-48 z-10">
                      {metric.description}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-secondary-900" />
                    </div>
                  )}
                </div>
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${getStatusColor(metric)}`}>
                  {formatValue(metric)}
                </span>
              </div>

              {/* Trend */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {metric.trend > 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : metric.trend < 0 ? (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-secondary-400" />
                  )}
                  <span className={`text-sm font-semibold ${
                    metric.trend > 0 ? 'text-green-600' : metric.trend < 0 ? 'text-red-600' : 'text-secondary-500'
                  }`}>
                    {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                  </span>
                  <span className="text-xs text-secondary-400 ml-1">vs last quarter</span>
                </div>
              </div>

              {/* Progress to Target */}
              {metric.target && (
                <div className="mt-3 pt-3 border-t border-secondary-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-secondary-500">Target: {metric.prefix || ''}{metric.target}{metric.suffix || ''}</span>
                    <span className={getStatusColor(metric)}>
                      {Math.round((metric.value / metric.target) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        metric.value >= metric.target ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LTV:CAC Trend */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Unit Economics Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}x`} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'ltvCacRatio') return [`${value}x`, 'LTV:CAC Ratio'];
                    return [`$${value.toLocaleString()}`, name === 'cac' ? 'CAC' : 'LTV'];
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="cac" name="CAC" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left" type="monotone" dataKey="ltv" name="LTV" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="ltvCacRatio" name="LTV:CAC Ratio" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cohort Retention */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            Cohort Retention Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-secondary-500 border-b border-secondary-100">
                  <th className="text-left py-3 font-medium">Cohort</th>
                  <th className="text-center py-3 font-medium">Month 0</th>
                  <th className="text-center py-3 font-medium">Month 3</th>
                  <th className="text-center py-3 font-medium">Month 6</th>
                  <th className="text-center py-3 font-medium">Month 9</th>
                  <th className="text-center py-3 font-medium">Month 12</th>
                </tr>
              </thead>
              <tbody>
                {COHORT_DATA.map((row) => (
                  <tr key={row.cohort} className="border-b border-secondary-50 hover:bg-secondary-50">
                    <td className="py-3 font-medium text-secondary-900">{row.cohort}</td>
                    {[row.month0, row.month3, row.month6, row.month9, row.month12].map((val, i) => (
                      <td key={i} className="text-center py-3">
                        {val !== null ? (
                          <span
                            className="inline-block px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: `rgba(34, 197, 94, ${val / 100})`,
                              color: val > 50 ? 'white' : '#166534'
                            }}
                          >
                            {val}%
                          </span>
                        ) : (
                          <span className="text-secondary-300">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-secondary-500 mt-4">
            Cohort retention shows the percentage of customers still active at each milestone.
          </p>
        </div>
      </div>

      {/* Benchmark Comparison */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Industry Benchmark Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MOCK_GTM_METRICS.filter(m => m.benchmark).slice(0, 4).map((metric) => {
            const vsIndustry = ((metric.value - (metric.benchmark || 0)) / (metric.benchmark || 1)) * 100;
            const isAbove = vsIndustry > 0;

            return (
              <div key={metric.id} className="bg-secondary-50 rounded-lg p-4">
                <p className="text-xs text-secondary-500 uppercase tracking-wider mb-2">{metric.metric}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-secondary-900">{formatValue(metric)}</p>
                    <p className="text-xs text-secondary-500">
                      Benchmark: {metric.prefix || ''}{metric.benchmark}{metric.suffix || ''}
                    </p>
                  </div>
                  <div className={`text-right ${isAbove ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center gap-1">
                      {isAbove ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-semibold">{isAbove ? '+' : ''}{vsIndustry.toFixed(0)}%</span>
                    </div>
                    <p className="text-xs">vs industry</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights Panel */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-purple-50 border-primary-100">
        <h3 className="text-lg font-semibold text-secondary-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-600" />
          GTM Health Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700 mb-1">Strengths</p>
            <ul className="text-sm text-secondary-600 space-y-1">
              <li>• LTV:CAC ratio of 6.7x exceeds best-in-class threshold (5x)</li>
              <li>• NRR of 118% indicates strong expansion revenue</li>
              <li>• Magic Number &gt; 1.0 shows efficient growth</li>
            </ul>
          </div>
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-700 mb-1">Watch Areas</p>
            <ul className="text-sm text-secondary-600 space-y-1">
              <li>• CAC payback of 14 months is above 12-month target</li>
              <li>• Q4 cohort retention to be monitored closely</li>
            </ul>
          </div>
          <div className="bg-white/80 rounded-lg p-4">
            <p className="text-sm font-medium text-primary-700 mb-1">Recommendations</p>
            <ul className="text-sm text-secondary-600 space-y-1">
              <li>• Focus on reducing CAC through channel optimization</li>
              <li>• Invest in customer success to maintain NRR trajectory</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
