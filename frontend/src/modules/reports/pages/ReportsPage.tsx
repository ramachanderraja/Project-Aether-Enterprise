import React, { useState, useMemo } from 'react';
import {
  FileBarChart,
  Filter,
  Download,
  Layers,
  TrendingUp,
  Building2,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Constants
const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Middle East', 'Latin America'] as const;
const SEGMENTS = ['Enterprise', 'Mid-Market'] as const;
const VERTICALS = ['CPG', 'AIM', 'TMT', 'E&U', 'LS', 'Others'] as const;

type Region = typeof REGIONS[number];
type Segment = typeof SEGMENTS[number];
type Vertical = typeof VERTICALS[number];

// Local interfaces for this module
interface AccountProfitabilityLocal {
  id: string;
  accountName: string;
  region: Region;
  segment: Segment;
  vertical: Vertical;
  revenue: number;
  cost1: number;
  cost2: number;
  grossMarginValue: number;
  grossMarginPercent: number;
  contributionMarginPercent: number;
  healthScore: number;
  renewalDate: string;
}

interface ProfitabilityByDimensionLocal {
  dimension: string;
  revenue: number;
  grossMargin: number;
  marginPercent: number;
}

interface MarginTrendLocal {
  month: string;
  netMarginPercent: number;
  revenue: number;
}

// Mock data generator for enterprise profitability data
const generateReportData = (type: 'License' | 'Implementation'): AccountProfitabilityLocal[] => {
  return Array.from({ length: 50 }, (_, i) => {
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    const segment = SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)];
    const vertical = VERTICALS[Math.floor(Math.random() * VERTICALS.length)];
    const revenue = Math.floor(Math.random() * 2000000) + 500000;

    let cost1: number, cost2: number;
    if (type === 'License') {
      cost1 = Math.round(revenue * (0.12 + Math.random() * 0.06)); // Cloud/Infra 12-18%
      cost2 = Math.round(revenue * (0.08 + Math.random() * 0.04)); // Resource 8-12%
    } else {
      cost1 = Math.round(revenue * (0.35 + Math.random() * 0.10)); // TSO Cost 35-45%
      cost2 = Math.round(revenue * (0.20 + Math.random() * 0.10)); // Engg Cost 20-30%
    }

    const grossMarginValue = revenue - cost1 - cost2;
    const grossMarginPercent = grossMarginValue / revenue;
    const contributionMarginPercent = grossMarginPercent - 0.15; // Mock overhead

    return {
      id: `ACC-${1000 + i}`,
      accountName: `${['Acme', 'Global', 'Tech', 'Alpha', 'Beta', 'Omega', 'Delta', 'Prime'][Math.floor(Math.random() * 8)]} ${['Corp', 'Inc', 'Ltd', 'Solutions', 'Industries', 'Group'][Math.floor(Math.random() * 6)]}`,
      region,
      segment,
      vertical,
      revenue,
      cost1,
      cost2,
      grossMarginValue,
      grossMarginPercent,
      contributionMarginPercent,
      healthScore: Math.floor(Math.random() * 40) + 60,
      renewalDate: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    };
  });
};

// Generate margin trend data
const generateMarginTrend = (viewMode: 'License' | 'Implementation', regionFilter: string): MarginTrendLocal[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseMargin = viewMode === 'License' ? 0.72 : 0.35;
  const volatility = 0.03;

  let cumulativeChange = 0;
  return months.map((month, idx) => {
    const randomVar = (Math.random() - 0.4) * volatility; // Slight upward bias
    const regionMod = regionFilter === 'North America' ? 0.05 : regionFilter === 'Europe' ? 0.02 : regionFilter === 'Asia Pacific' ? -0.02 : 0;
    cumulativeChange += randomVar;

    return {
      month,
      netMarginPercent: Math.max(0.15, Math.min(0.90, baseMargin + cumulativeChange + regionMod)),
      revenue: (1000 + Math.random() * 200) * (1 + idx * 0.02) // Gradual growth
    };
  });
};

// Stat Card Component
const StatCard: React.FC<{
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ReactNode;
  color?: string;
}> = ({ label, value, subValue, trend, icon, color = 'text-primary-600' }) => (
  <div className="card p-5 hover:shadow-md transition-all">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2 rounded-lg bg-secondary-100 ${color}`}>
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <p className="text-secondary-500 text-xs uppercase tracking-wider mb-1 font-medium">{label}</p>
    <p className="text-2xl font-bold text-secondary-900">{value}</p>
    {subValue && <p className="text-secondary-400 text-xs mt-1">{subValue}</p>}
  </div>
);

const ReportsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'License' | 'Implementation'>('License');
  const [filterRegion, setFilterRegion] = useState<string>('All');
  const [filterSegment, setFilterSegment] = useState<string>('All');
  const [filterVertical, setFilterVertical] = useState<string>('All');
  const [trendFilter, setTrendFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Generate and memoize data
  const rawData = useMemo(() => generateReportData(viewMode), [viewMode]);

  const filteredData = useMemo(() => {
    return rawData.filter(d => {
      const matchesRegion = filterRegion === 'All' || d.region === filterRegion;
      const matchesSegment = filterSegment === 'All' || d.segment === filterSegment;
      const matchesVertical = filterVertical === 'All' || d.vertical === filterVertical;
      return matchesRegion && matchesSegment && matchesVertical;
    });
  }, [rawData, filterRegion, filterSegment, filterVertical]);

  // Aggregate by region
  const regionAgg = useMemo((): ProfitabilityByDimensionLocal[] => {
    const groups: Record<string, { name: string; revenue: number; margin: number }> = {};
    filteredData.forEach(d => {
      if (!groups[d.region]) groups[d.region] = { name: d.region, revenue: 0, margin: 0 };
      groups[d.region].revenue += d.revenue;
      groups[d.region].margin += d.grossMarginValue;
    });
    return Object.values(groups).map(g => ({
      dimension: g.name,
      revenue: g.revenue,
      grossMargin: g.margin,
      marginPercent: g.margin / g.revenue
    })).sort((a, b) => b.marginPercent - a.marginPercent);
  }, [filteredData]);

  // Aggregate by segment
  const segmentAgg = useMemo((): ProfitabilityByDimensionLocal[] => {
    const groups: Record<string, { name: string; revenue: number; margin: number }> = {};
    filteredData.forEach(d => {
      if (!groups[d.segment]) groups[d.segment] = { name: d.segment, revenue: 0, margin: 0 };
      groups[d.segment].revenue += d.revenue;
      groups[d.segment].margin += d.grossMarginValue;
    });
    return Object.values(groups).map(g => ({
      dimension: g.name,
      revenue: g.revenue,
      grossMargin: g.margin,
      marginPercent: g.margin / g.revenue
    }));
  }, [filteredData]);

  // Segment breakdown for table
  const segmentBreakdown = useMemo(() => {
    const groups: Record<string, { name: string; revenue: number; grossMargin: number; contribMargin: number; count: number }> = {};
    filteredData.forEach(d => {
      if (!groups[d.segment]) groups[d.segment] = { name: d.segment, revenue: 0, grossMargin: 0, contribMargin: 0, count: 0 };
      groups[d.segment].revenue += d.revenue;
      groups[d.segment].grossMargin += d.grossMarginValue;
      groups[d.segment].contribMargin += (d.revenue * d.contributionMarginPercent);
      groups[d.segment].count += 1;
    });
    return Object.values(groups).map(g => ({
      segment: g.name,
      revenue: g.revenue,
      gmPct: g.grossMargin / g.revenue,
      cmPct: g.contribMargin / g.revenue,
      accounts: g.count
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Margin trend data
  const netMarginTrend = useMemo(() => generateMarginTrend(viewMode, trendFilter), [viewMode, trendFilter]);

  // Calculate summary stats
  const totalRevenue = filteredData.reduce((a, b) => a + b.revenue, 0);
  const totalCost1 = filteredData.reduce((a, b) => a + b.cost1, 0);
  const totalCost2 = filteredData.reduce((a, b) => a + b.cost2, 0);
  const totalMargin = filteredData.reduce((a, b) => a + b.grossMarginValue, 0);
  const avgMarginPct = totalMargin / totalRevenue;

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-2">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
              <FileBarChart className="mr-3 text-primary-600" size={28} />
              Profitability Reports
            </h1>
            <p className="text-secondary-500 mt-1">Margin Analysis by Segment & Region</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex bg-secondary-100 p-1 rounded-lg border border-secondary-200">
              <button
                onClick={() => setViewMode('License')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'License'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-200'
                }`}
              >
                License Profitability
              </button>
              <button
                onClick={() => setViewMode('Implementation')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'Implementation'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-secondary-600 hover:text-secondary-900 hover:bg-secondary-200'
                }`}
              >
                Implementation Profitability
              </button>
            </div>

            <button className="btn-outline flex items-center gap-2">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 card">
          <div className="flex items-center space-x-2">
            <Filter className="text-secondary-400" size={16} />
            <span className="text-sm font-medium text-secondary-500">Filters:</span>
          </div>

          <select
            value={filterRegion}
            onChange={(e) => { setFilterRegion(e.target.value); setCurrentPage(1); }}
            className="input text-sm"
          >
            <option value="All">All Regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={filterSegment}
            onChange={(e) => { setFilterSegment(e.target.value); setCurrentPage(1); }}
            className="input text-sm"
          >
            <option value="All">All Segments</option>
            {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filterVertical}
            onChange={(e) => { setFilterVertical(e.target.value); setCurrentPage(1); }}
            className="input text-sm"
          >
            <option value="All">All Verticals</option>
            {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <button
            onClick={() => { setFilterRegion('All'); setFilterSegment('All'); setFilterVertical('All'); setCurrentPage(1); }}
            className="flex items-center gap-1 text-sm text-secondary-500 hover:text-secondary-900 transition-colors"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`$${(totalRevenue / 1000000).toFixed(1)}M`}
          subValue={`${filteredData.length} accounts`}
          trend={8.3}
          icon={<DollarSign size={20} />}
          color="text-primary-600"
        />
        <StatCard
          label={viewMode === 'License' ? 'Cloud/Infra Cost' : 'TSO Cost'}
          value={`$${(totalCost1 / 1000000).toFixed(1)}M`}
          subValue={`${((totalCost1 / totalRevenue) * 100).toFixed(1)}% of revenue`}
          trend={-2.1}
          icon={<Building2 size={20} />}
          color="text-red-500"
        />
        <StatCard
          label={viewMode === 'License' ? 'Resource Cost' : 'Engineering Cost'}
          value={`$${(totalCost2 / 1000000).toFixed(1)}M`}
          subValue={`${((totalCost2 / totalRevenue) * 100).toFixed(1)}% of revenue`}
          trend={1.5}
          icon={<Building2 size={20} />}
          color="text-yellow-500"
        />
        <StatCard
          label={viewMode === 'License' ? 'Gross Margin' : 'Net Margin'}
          value={`${(avgMarginPct * 100).toFixed(1)}%`}
          subValue={`$${(totalMargin / 1000000).toFixed(1)}M total`}
          trend={3.2}
          icon={<Percent size={20} />}
          color="text-green-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Margin by Region */}
        <div className="card p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Margin by Region</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionAgg} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  domain={[0, 1]}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="dimension"
                  width={100}
                  stroke="#94a3b8"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                  formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Margin']}
                />
                <Bar dataKey="marginPercent" fill="#10b981" barSize={18} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Margin by Segment */}
        <div className="card p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Margin by Segment</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentAgg}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="dimension" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                  formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Margin']}
                />
                <Bar dataKey="marginPercent" barSize={50} radius={[4, 4, 0, 0]}>
                  {segmentAgg.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#8b5cf6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Account Distribution Scatter */}
        <div className="card p-6">
          <h3 className="font-semibold text-secondary-900 mb-4">Account Distribution</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#94a3b8"
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="grossMarginPercent"
                  name="Margin %"
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fontSize: 10 }}
                  domain={[0, 1]}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Revenue') return [`$${(value / 1000).toFixed(0)}k`, name];
                    return [`${(value * 100).toFixed(1)}%`, 'Margin'];
                  }}
                />
                <Scatter name="Accounts" data={filteredData} fill="#f59e0b" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Account Details Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-secondary-200 flex justify-between items-center">
          <h3 className="font-semibold text-secondary-900">Account Profitability Details</h3>
          <span className="text-sm text-secondary-500">
            Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary-50 text-xs uppercase font-medium text-secondary-500">
              <tr>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Segment</th>
                <th className="px-6 py-4">Vertical</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 text-right">{viewMode === 'License' ? 'Cloud/Infra' : 'TSO Cost'}</th>
                <th className="px-6 py-4 text-right">{viewMode === 'License' ? 'Resource' : 'Engg Cost'}</th>
                <th className="px-6 py-4 text-right">Margin $</th>
                <th className="px-6 py-4 text-right">{viewMode === 'License' ? 'Gross' : 'Net'} Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200">
              {paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-secondary-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-medium text-secondary-900">{row.accountName}</span>
                      <span className="block text-xs text-secondary-400">{row.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-secondary-700">{row.region}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.segment === 'Enterprise' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {row.segment}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-secondary-500 text-xs">{row.vertical}</td>
                  <td className="px-6 py-4 text-right font-mono text-secondary-900">${(row.revenue / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 text-right font-mono text-red-600">${(row.cost1 / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 text-right font-mono text-red-600">${(row.cost2 / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 text-right font-mono text-green-600">${(row.grossMarginValue / 1000).toFixed(0)}k</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${row.grossMarginPercent >= 0.5 ? 'text-green-600' : row.grossMarginPercent >= 0.3 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {(row.grossMarginPercent * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-secondary-200 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-secondary-100 text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-200"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${currentPage === page ? 'bg-primary-600 text-white' : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-secondary-100 text-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-200"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Bottom Section: Segment Breakdown & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Segment Profitability Breakdown */}
        <div className="card p-6">
          <h3 className="font-semibold text-secondary-900 mb-4 flex items-center">
            <Layers size={20} className="mr-2 text-indigo-500" />
            Segment Profitability Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-secondary-500 border-b border-secondary-200">
                  <th className="pb-3 font-medium">Segment</th>
                  <th className="pb-3 font-medium text-right">Accounts</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                  <th className="pb-3 font-medium text-right">Gross Margin</th>
                  <th className="pb-3 font-medium text-right">Contrib. Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {segmentBreakdown.map((seg) => (
                  <tr key={seg.segment} className="hover:bg-secondary-50">
                    <td className="py-4 font-medium text-secondary-900">{seg.segment}</td>
                    <td className="py-4 text-right text-secondary-500">{seg.accounts}</td>
                    <td className="py-4">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-secondary-900">${(seg.revenue / 1000000).toFixed(1)}M</span>
                        <div className="w-24 h-1.5 bg-secondary-200 rounded-full mt-1">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${(seg.revenue / Math.max(...segmentBreakdown.map(s => s.revenue))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-green-600">{(seg.gmPct * 100).toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-secondary-200 rounded-full mt-1">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${seg.gmPct * 100}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-indigo-600">{(seg.cmPct * 100).toFixed(1)}%</span>
                        <div className="w-16 h-1.5 bg-secondary-200 rounded-full mt-1">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max(0, seg.cmPct) * 100}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Margin Trend Chart */}
        <div className="card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-secondary-900 flex items-center">
              <TrendingUp size={20} className="mr-2 text-green-500" />
              Net Margin Trend
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-secondary-500">Region:</span>
              <select
                value={trendFilter}
                onChange={(e) => setTrendFilter(e.target.value)}
                className="input text-xs px-2 py-1"
              >
                <option value="All">Global</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netMarginTrend}>
                <defs>
                  <linearGradient id="colorNetMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fontSize: 11 }}
                  domain={[0, 1]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                  formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Net Margin']}
                />
                <Area
                  type="monotone"
                  dataKey="netMarginPercent"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNetMargin)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
