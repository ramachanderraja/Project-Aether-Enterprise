import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface RevenueSegment {
  name: string;
  current: number;
  previous: number;
  target: number;
}

interface Customer {
  id: string;
  name: string;
  arr: number;
  healthScore: number;
  lastContact: string;
  risk: 'low' | 'medium' | 'high';
  expansion: number;
}

interface WaterfallDataPoint {
  name: string;
  value: number;
  displayValue: number;
  start: number;
  end: number;
  fill: string;
  isTotal?: boolean;
}

const mockSegments: RevenueSegment[] = [
  { name: 'SaaS Subscriptions', current: 18500000, previous: 15200000, target: 20000000 },
  { name: 'Professional Services', current: 4200000, previous: 4500000, target: 5000000 },
  { name: 'Support & Maintenance', current: 3100000, previous: 2800000, target: 3200000 },
  { name: 'Training & Certifications', current: 1200000, previous: 1000000, target: 1500000 },
];

const mockCustomers: Customer[] = [
  { id: '1', name: 'Enterprise Corp', arr: 2400000, healthScore: 92, lastContact: '2024-01-28', risk: 'low', expansion: 350000 },
  { id: '2', name: 'TechGiant Inc', arr: 1800000, healthScore: 78, lastContact: '2024-01-25', risk: 'medium', expansion: 0 },
  { id: '3', name: 'Global Finance', arr: 1500000, healthScore: 45, lastContact: '2024-01-15', risk: 'high', expansion: -200000 },
  { id: '4', name: 'Retail Leaders', arr: 1200000, healthScore: 88, lastContact: '2024-01-27', risk: 'low', expansion: 180000 },
  { id: '5', name: 'HealthTech Pro', arr: 950000, healthScore: 82, lastContact: '2024-01-26', risk: 'low', expansion: 120000 },
  { id: '6', name: 'Manufacturing Co', arr: 780000, healthScore: 65, lastContact: '2024-01-20', risk: 'medium', expansion: 0 },
];

const arrMovement = {
  startingARR: 24500000,
  newBusiness: 3200000,
  expansion: 1800000,
  contraction: -450000,
  churn: -850000,
  endingARR: 28200000,
};

// Generate waterfall data for proper waterfall chart
const generateWaterfallData = (): WaterfallDataPoint[] => {
  const data: WaterfallDataPoint[] = [];
  let runningTotal = arrMovement.startingARR;

  // Starting ARR
  data.push({
    name: 'Starting ARR',
    value: arrMovement.startingARR,
    displayValue: arrMovement.startingARR,
    start: 0,
    end: arrMovement.startingARR,
    fill: '#64748b',
    isTotal: true,
  });

  // New Business
  data.push({
    name: 'New Business',
    value: arrMovement.newBusiness,
    displayValue: arrMovement.newBusiness,
    start: runningTotal,
    end: runningTotal + arrMovement.newBusiness,
    fill: '#10b981',
  });
  runningTotal += arrMovement.newBusiness;

  // Expansion
  data.push({
    name: 'Expansion',
    value: arrMovement.expansion,
    displayValue: arrMovement.expansion,
    start: runningTotal,
    end: runningTotal + arrMovement.expansion,
    fill: '#3b82f6',
  });
  runningTotal += arrMovement.expansion;

  // Contraction (negative)
  data.push({
    name: 'Contraction',
    value: arrMovement.contraction,
    displayValue: Math.abs(arrMovement.contraction),
    start: runningTotal + arrMovement.contraction,
    end: runningTotal,
    fill: '#f59e0b',
  });
  runningTotal += arrMovement.contraction;

  // Churn (negative)
  data.push({
    name: 'Churn',
    value: arrMovement.churn,
    displayValue: Math.abs(arrMovement.churn),
    start: runningTotal + arrMovement.churn,
    end: runningTotal,
    fill: '#ef4444',
  });
  runningTotal += arrMovement.churn;

  // Ending ARR
  data.push({
    name: 'Ending ARR',
    value: arrMovement.endingARR,
    displayValue: arrMovement.endingARR,
    start: 0,
    end: arrMovement.endingARR,
    fill: '#3b82f6',
    isTotal: true,
  });

  return data;
};

const waterfallData = generateWaterfallData();

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatCurrencyShort = (value: number) => {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${(value / 1000).toFixed(0)}K`;
};

// Custom tooltip for waterfall chart
const WaterfallTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-secondary-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-secondary-900">{data.name}</p>
        <p className={`text-sm ${data.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {data.value >= 0 ? '+' : ''}{formatCurrency(data.value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function RevenuePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'arr' | 'customers'>('overview');

  const totalRevenue = mockSegments.reduce((sum, seg) => sum + seg.current, 0);
  const totalTarget = mockSegments.reduce((sum, seg) => sum + seg.target, 0);
  const totalPrevious = mockSegments.reduce((sum, seg) => sum + seg.previous, 0);
  const growthRate = ((totalRevenue - totalPrevious) / totalPrevious) * 100;

  const getHealthBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskBadge = (risk: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return styles[risk as keyof typeof styles];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Revenue Analytics</h1>
          <p className="text-secondary-500">Track and analyze revenue performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>FY 2024</option>
            <option>FY 2023</option>
            <option>FY 2022</option>
          </select>
          <button className="btn-primary">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Total Revenue (YTD)</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-green-600 mt-1">+{growthRate.toFixed(1)}% YoY</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">ARR</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(arrMovement.endingARR)}</p>
          <p className="text-xs text-green-600 mt-1">+15.1% growth</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Net Revenue Retention</p>
          <p className="text-2xl font-bold text-secondary-900">115%</p>
          <p className="text-xs text-green-600 mt-1">+3% vs target</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Gross Retention</p>
          <p className="text-2xl font-bold text-secondary-900">94.5%</p>
          <p className="text-xs text-yellow-600 mt-1">-0.5% vs target</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {(['overview', 'arr', 'customers'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab === 'arr' ? 'ARR Movement' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Segment */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Revenue by Segment</h2>
            <div className="space-y-4">
              {mockSegments.map((segment) => {
                const achievement = (segment.current / segment.target) * 100;
                const growth = ((segment.current - segment.previous) / segment.previous) * 100;

                return (
                  <div key={segment.name} className="p-4 rounded-lg border border-secondary-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-secondary-900">{segment.name}</span>
                      <div className="text-right">
                        <span className="font-medium text-secondary-900">{formatCurrency(segment.current)}</span>
                        <span className={`text-sm ml-2 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${achievement >= 100 ? 'bg-green-500' : achievement >= 80 ? 'bg-primary-500' : 'bg-yellow-500'}`}
                        style={{ width: `${Math.min(achievement, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-secondary-400 mt-1">
                      <span>Target: {formatCurrency(segment.target)}</span>
                      <span>{achievement.toFixed(0)}% achieved</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue vs Target */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Target Progress</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#3b82f6"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${(totalRevenue / totalTarget) * 502} 502`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-secondary-900">
                    {((totalRevenue / totalTarget) * 100).toFixed(0)}%
                  </span>
                  <span className="text-sm text-secondary-500">of target</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-secondary-600">
                  {formatCurrency(totalRevenue)} / {formatCurrency(totalTarget)}
                </p>
                <p className="text-sm text-secondary-400">
                  {formatCurrency(totalTarget - totalRevenue)} to go
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-secondary-200">
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Monthly Trend</h3>
              <div className="flex items-end gap-1 h-20">
                {[65, 72, 68, 82, 75, 88, 92, 85, 78, 95, 89, 97].map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-primary-500 rounded-t"
                    style={{ height: `${value}%` }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-secondary-400 mt-1">
                <span>Jan</span>
                <span>Dec</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'arr' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-2">ARR Bridge</h2>
          <p className="text-sm text-secondary-500 mb-6">Waterfall analysis of ARR movement from Q4 2023 to Q4 2024</p>

          {/* Waterfall Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={waterfallData}
                margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => formatCurrencyShort(value)}
                  domain={[0, 32000000]}
                />
                <Tooltip content={<WaterfallTooltip />} />

                {/* Invisible bar for the "floating" effect */}
                <Bar dataKey="start" stackId="stack" fill="transparent" />

                {/* Visible bar showing the actual value */}
                <Bar dataKey="displayValue" stackId="stack" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-secondary-500"></span>
              <span className="text-xs text-secondary-600">Starting/Ending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              <span className="text-xs text-secondary-600">New Business</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-500"></span>
              <span className="text-xs text-secondary-600">Expansion</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-yellow-500"></span>
              <span className="text-xs text-secondary-600">Contraction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500"></span>
              <span className="text-xs text-secondary-600">Churn</span>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid grid-cols-4 gap-4 pt-6 border-t border-secondary-200">
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-500">Net New ARR</p>
              <p className="text-xl font-bold text-green-600">+{formatCurrency(arrMovement.endingARR - arrMovement.startingARR)}</p>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-500">Gross New</p>
              <p className="text-xl font-bold text-secondary-900">{formatCurrency(arrMovement.newBusiness + arrMovement.expansion)}</p>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-500">Gross Lost</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(Math.abs(arrMovement.contraction + arrMovement.churn))}</p>
            </div>
            <div className="text-center p-4 bg-secondary-50 rounded-lg">
              <p className="text-sm text-secondary-500">Logo Churn Rate</p>
              <p className="text-xl font-bold text-secondary-900">3.2%</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Customer Health Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Healthy</p>
                  <p className="text-2xl font-bold text-green-700">{mockCustomers.filter(c => c.healthScore >= 80).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="card p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Needs Attention</p>
                  <p className="text-2xl font-bold text-yellow-700">{mockCustomers.filter(c => c.healthScore >= 60 && c.healthScore < 80).length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="card p-4 bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">At Risk</p>
                  <p className="text-2xl font-bold text-red-700">{mockCustomers.filter(c => c.healthScore < 60).length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-secondary-200">
              <h2 className="text-lg font-semibold text-secondary-900">Top Customers by ARR</h2>
            </div>
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">ARR</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Health Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Risk Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Expansion</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Last Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {mockCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-4">
                      <p className="font-medium text-secondary-900">{customer.name}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-secondary-900">{formatCurrency(customer.arr)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-secondary-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${customer.healthScore >= 80 ? 'bg-green-500' : customer.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${customer.healthScore}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded ${getHealthBadge(customer.healthScore)}`}>
                          {customer.healthScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(customer.risk)}`}>
                        {customer.risk}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={customer.expansion > 0 ? 'text-green-600' : customer.expansion < 0 ? 'text-red-600' : 'text-secondary-400'}>
                        {customer.expansion > 0 ? '+' : ''}{formatCurrency(customer.expansion)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-secondary-600">{new Date(customer.lastContact).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
