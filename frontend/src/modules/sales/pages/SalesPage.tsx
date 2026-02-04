import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StalledDeal {
  id: string;
  name: string;
  stage: string;
  value: number;
  daysStalled: number;
}

interface ClosedLostDeal {
  id: string;
  deal: string;
  owner: string;
  value: number;
  lossDate: string;
  reason: string;
}

interface FunnelStage {
  stage: string;
  eventsAndTrade: number;
  organicContent: number;
  outboundSales: number;
  paidSearchSEM: number;
  partnerReseller: number;
}

interface ForecastData {
  month: string;
  closedRevenue: number;
  projectedPipeline: number;
}

const funnelData: FunnelStage[] = [
  { stage: 'Prospecting', eventsAndTrade: 12, organicContent: 15, outboundSales: 18, paidSearchSEM: 10, partnerReseller: 8 },
  { stage: 'Discovery', eventsAndTrade: 8, organicContent: 10, outboundSales: 12, paidSearchSEM: 7, partnerReseller: 5 },
  { stage: 'Proposal', eventsAndTrade: 6, organicContent: 8, outboundSales: 10, paidSearchSEM: 6, partnerReseller: 4 },
  { stage: 'Negotiation', eventsAndTrade: 4, organicContent: 6, outboundSales: 8, paidSearchSEM: 5, partnerReseller: 3 },
];

const forecastData: ForecastData[] = [
  { month: 'Jan', closedRevenue: 0.8, projectedPipeline: 0.5 },
  { month: 'Feb', closedRevenue: 3.2, projectedPipeline: 0 },
  { month: 'Mar', closedRevenue: 1.5, projectedPipeline: 2.8 },
  { month: 'Apr', closedRevenue: 0, projectedPipeline: 2.5 },
  { month: 'May', closedRevenue: 1.2, projectedPipeline: 2.3 },
  { month: 'Jun', closedRevenue: 1.3, projectedPipeline: 4.8 },
];

const stalledDeals: StalledDeal[] = [
  { id: '1', name: 'TMT Deal - D1293', stage: 'Legal Review', value: 256000, daysStalled: 178 },
  { id: '2', name: 'Enterprise Platform - D1456', stage: 'Procurement', value: 485000, daysStalled: 145 },
  { id: '3', name: 'Cloud Migration - D1589', stage: 'Security Review', value: 312000, daysStalled: 132 },
  { id: '4', name: 'Analytics Suite - D1672', stage: 'Budget Approval', value: 198000, daysStalled: 118 },
  { id: '5', name: 'Data Platform - D1734', stage: 'Legal Review', value: 425000, daysStalled: 105 },
];

const closedLostDeals: ClosedLostDeal[] = [
  { id: '1', deal: 'Global Retail Expansion', owner: 'Sarah Johnson', value: 1250000, lossDate: '2024-01-15', reason: 'Budget constraints' },
  { id: '2', deal: 'FinTech Integration', owner: 'Mike Wilson', value: 890000, lossDate: '2024-01-22', reason: 'Competitor selected' },
  { id: '3', deal: 'Healthcare Platform', owner: 'John Smith', value: 756000, lossDate: '2024-02-01', reason: 'Project cancelled' },
  { id: '4', deal: 'Manufacturing IoT', owner: 'Emily Davis', value: 534000, lossDate: '2024-02-08', reason: 'Timing - delayed to next FY' },
  { id: '5', deal: 'Logistics Optimization', owner: 'Sarah Johnson', value: 445000, lossDate: '2024-02-12', reason: 'Price sensitivity' },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value}`;
};

const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return `$${(value / 1000).toFixed(0)}k`;
};

const CHANNEL_COLORS = {
  eventsAndTrade: '#f97316',
  organicContent: '#10b981',
  outboundSales: '#3b82f6',
  paidSearchSEM: '#8b5cf6',
  partnerReseller: '#ec4899',
};

export default function SalesPage() {
  const [regionFilter, setRegionFilter] = useState('all');
  const [lobFilter, setLobFilter] = useState('all');
  const [verticalFilter, setVerticalFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Sales Performance</h1>
        <p className="text-secondary-500 uppercase text-sm tracking-wide">Pipeline Velocity & Forecast Accuracy</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-secondary-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-medium">Filters:</span>
          </div>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Regions</option>
            <option value="na">North America</option>
            <option value="emea">EMEA</option>
            <option value="apac">APAC</option>
            <option value="latam">LATAM</option>
          </select>
          <select
            value={lobFilter}
            onChange={(e) => setLobFilter(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="all">All LOBs</option>
            <option value="enterprise">Enterprise</option>
            <option value="mid-market">Mid-Market</option>
            <option value="smb">SMB</option>
          </select>
          <select
            value={verticalFilter}
            onChange={(e) => setVerticalFilter(e.target.value)}
            className="px-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Verticals</option>
            <option value="technology">Technology</option>
            <option value="financial">Financial Services</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Weighted Forecast</p>
          <p className="text-3xl font-bold text-secondary-900">$26.81M</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Closed ARR (YTD)</p>
          <p className="text-3xl font-bold text-green-500">$7.96M</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Win Rate</p>
          <p className="text-3xl font-bold text-blue-500">13.7%</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Avg Deal Size</p>
          <p className="text-3xl font-bold text-secondary-900">$179k</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">Closed Lost Value</p>
          <p className="text-3xl font-bold text-red-500">$7.14M</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel by Channel */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-1">Pipeline Funnel by Channel</h2>
          <p className="text-sm text-secondary-500 mb-6">Distribution of open opportunities across stages, segmented by acquisition source.</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={funnelData}
                margin={{ top: 0, right: 20, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="outboundSales" stackId="a" fill={CHANNEL_COLORS.outboundSales} name="Outbound Sales" />
                <Bar dataKey="organicContent" stackId="a" fill={CHANNEL_COLORS.organicContent} name="Organic/Content" />
                <Bar dataKey="eventsAndTrade" stackId="a" fill={CHANNEL_COLORS.eventsAndTrade} name="Events & Trade" />
                <Bar dataKey="paidSearchSEM" stackId="a" fill={CHANNEL_COLORS.paidSearchSEM} name="Paid Search (SEM)" />
                <Bar dataKey="partnerReseller" stackId="a" fill={CHANNEL_COLORS.partnerReseller} name="Partner/Reseller" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: CHANNEL_COLORS.eventsAndTrade }}></span>
              <span className="text-xs text-orange-500">Events & Trade</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: CHANNEL_COLORS.organicContent }}></span>
              <span className="text-xs text-green-500">Organic/Content</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: CHANNEL_COLORS.outboundSales }}></span>
              <span className="text-xs text-blue-500">Outbound Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: CHANNEL_COLORS.paidSearchSEM }}></span>
              <span className="text-xs text-purple-500">Paid Search (SEM)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: CHANNEL_COLORS.partnerReseller }}></span>
              <span className="text-xs text-pink-500">Partner/Reseller</span>
            </div>
          </div>
        </div>

        {/* Forecast vs Actuals */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-1">Forecast vs Actuals</h2>
          <p className="text-sm text-secondary-500 mb-6">6-Month Trend Analysis</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={forecastData}
                margin={{ top: 0, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(value) => `$${value}M`}
                  domain={[0, 6]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(1)}M`, '']}
                />
                <Bar dataKey="closedRevenue" fill="#10b981" name="Closed Revenue" radius={[2, 2, 0, 0]} />
                <Bar dataKey="projectedPipeline" fill="#3b82f6" name="Projected Pipeline" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              <span className="text-sm text-green-500">Closed Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-500"></span>
              <span className="text-sm text-blue-500">Projected Pipeline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stalled Opportunities */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-secondary-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Stalled Opportunities</h2>
              <p className="text-sm text-secondary-500">Deals in current stage &gt; 90 days</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-600 border border-red-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Action Required
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Deal Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Stage</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Value</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Days Stalled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {stalledDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-secondary-50 cursor-pointer">
                    <td className="px-5 py-4 font-medium text-secondary-900">{deal.name}</td>
                    <td className="px-5 py-4 text-secondary-600">{deal.stage}</td>
                    <td className="px-5 py-4 text-secondary-600">{formatCurrencyShort(deal.value)}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-red-600 font-semibold">
                        {deal.daysStalled}
                        {deal.daysStalled > 150 && (
                          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Closed Lost Analysis */}
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">Closed Lost Analysis</h2>
            <p className="text-sm text-secondary-500">Review largest losses to identify patterns.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Deal</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">Owner</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Value
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      Loss Date
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {closedLostDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-secondary-50 cursor-pointer group">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-secondary-900">{deal.deal}</p>
                        <p className="text-xs text-secondary-400 mt-0.5">{deal.reason}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-secondary-600">{deal.owner}</td>
                    <td className="px-5 py-4 text-red-600 font-medium">{formatCurrency(deal.value)}</td>
                    <td className="px-5 py-4 text-secondary-600">{new Date(deal.lossDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="card p-4 bg-secondary-50 border-secondary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-secondary-600">
                <strong className="text-secondary-900">{stalledDeals.length}</strong> deals stalled &gt; 90 days
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary-600">
                Total at-risk value: <strong className="text-red-600">{formatCurrency(stalledDeals.reduce((sum, d) => sum + d.value, 0))}</strong>
              </span>
            </div>
          </div>
          <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
            View All Opportunities
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
