import { useState } from 'react';
import {
  Megaphone,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  BarChart3,
  PieChart,
  Download,
  ArrowRight,
  Zap,
  UserPlus,
  ShoppingCart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

interface AcquisitionChannel {
  id: string;
  channel: string;
  leads: number;
  mqls: number;
  sqls: number;
  opportunities: number;
  customers: number;
  conversionRate: number;
  cac: number;
  spend: number;
  revenueGenerated: number;
  roi: number;
  trend: number;
  color: string;
}

const MOCK_CHANNELS: AcquisitionChannel[] = [
  { id: '1', channel: 'Organic Search', leads: 4500, mqls: 1800, sqls: 720, opportunities: 216, customers: 65, conversionRate: 1.44, cac: 2100, spend: 136500, revenueGenerated: 1950000, roi: 14.3, trend: 12, color: '#22c55e' },
  { id: '2', channel: 'Paid Search (SEM)', leads: 3200, mqls: 1280, sqls: 384, opportunities: 115, customers: 35, conversionRate: 1.09, cac: 3800, spend: 133000, revenueGenerated: 1050000, roi: 7.9, trend: -3, color: '#3b82f6' },
  { id: '3', channel: 'Social Media', leads: 2800, mqls: 840, sqls: 252, opportunities: 76, customers: 23, conversionRate: 0.82, cac: 4200, spend: 96600, revenueGenerated: 690000, roi: 7.1, trend: 8, color: '#8b5cf6' },
  { id: '4', channel: 'Email Marketing', leads: 2100, mqls: 1050, sqls: 420, opportunities: 126, customers: 38, conversionRate: 1.81, cac: 1500, spend: 57000, revenueGenerated: 1140000, roi: 20.0, trend: 5, color: '#f59e0b' },
  { id: '5', channel: 'Events & Webinars', leads: 1200, mqls: 720, sqls: 360, opportunities: 144, customers: 43, conversionRate: 3.58, cac: 2800, spend: 120400, revenueGenerated: 1290000, roi: 10.7, trend: 15, color: '#ec4899' },
  { id: '6', channel: 'Partner/Referral', leads: 800, mqls: 560, sqls: 336, opportunities: 168, customers: 67, conversionRate: 8.38, cac: 1200, spend: 80400, revenueGenerated: 2010000, roi: 25.0, trend: 22, color: '#14b8a6' },
];

const FUNNEL_DATA = [
  { stage: 'Visitors', value: 125000, fill: '#94a3b8' },
  { stage: 'Leads', value: 14600, fill: '#64748b' },
  { stage: 'MQLs', value: 6250, fill: '#3b82f6' },
  { stage: 'SQLs', value: 2472, fill: '#8b5cf6' },
  { stage: 'Opportunities', value: 845, fill: '#f59e0b' },
  { stage: 'Customers', value: 271, fill: '#22c55e' },
];

const TREND_DATA = [
  { month: 'Jul', leads: 12800, mqls: 5400, customers: 220 },
  { month: 'Aug', leads: 13200, mqls: 5600, customers: 235 },
  { month: 'Sep', leads: 13800, mqls: 5900, customers: 248 },
  { month: 'Oct', leads: 14100, mqls: 6000, customers: 255 },
  { month: 'Nov', leads: 14400, mqls: 6150, customers: 263 },
  { month: 'Dec', leads: 14600, mqls: 6250, customers: 271 },
];

const CAMPAIGN_DATA = [
  { id: '1', name: 'Q4 Enterprise Push', channel: 'Multi-channel', status: 'active', budget: 150000, spend: 98500, conversions: 145, cpa: 679, roas: 8.2 },
  { id: '2', name: 'Product Launch 2024', channel: 'Paid Search', status: 'active', budget: 80000, spend: 62000, conversions: 89, cpa: 697, roas: 6.5 },
  { id: '3', name: 'Webinar Series', channel: 'Events', status: 'active', budget: 45000, spend: 38000, conversions: 67, cpa: 567, roas: 9.8 },
  { id: '4', name: 'Content Syndication', channel: 'Organic', status: 'completed', budget: 35000, spend: 35000, conversions: 112, cpa: 313, roas: 15.2 },
];

export default function MarketingPage() {
  const [selectedView, setSelectedView] = useState<'overview' | 'channels' | 'campaigns'>('overview');
  const [dateRange, setDateRange] = useState('quarter');

  const totalLeads = MOCK_CHANNELS.reduce((sum, c) => sum + c.leads, 0);
  const totalSpend = MOCK_CHANNELS.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = MOCK_CHANNELS.reduce((sum, c) => sum + c.revenueGenerated, 0);
  const totalCustomers = MOCK_CHANNELS.reduce((sum, c) => sum + c.customers, 0);
  const avgCac = totalSpend / totalCustomers;
  const overallRoi = totalRevenue / totalSpend;

  const pieData = MOCK_CHANNELS.map(c => ({
    name: c.channel,
    value: c.leads,
    color: c.color,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-purple-600" />
            Marketing Analytics
          </h1>
          <p className="text-secondary-500 mt-1">Customer acquisition, channel performance, and campaign ROI</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-secondary-200 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'channels', label: 'Channel Analysis', icon: PieChart },
          { id: 'campaigns', label: 'Campaigns', icon: Target },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedView(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
              selectedView === tab.id
                ? 'bg-primary-50 text-primary-700 border-b-2 border-primary-600'
                : 'text-secondary-500 hover:text-secondary-700 hover:bg-secondary-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-secondary-500 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Total Leads</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{totalLeads.toLocaleString()}</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +8.2% vs last quarter
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-secondary-500 mb-2">
            <UserPlus className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">New Customers</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{totalCustomers}</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +12.5% vs last quarter
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-secondary-500 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Total Spend</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">${(totalSpend / 1000).toFixed(0)}K</p>
          <p className="text-xs text-secondary-500 mt-1">Marketing budget</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-secondary-500 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Avg CAC</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">${avgCac.toFixed(0)}</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingDown className="w-3 h-3" /> -5.3% vs last quarter
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-secondary-500 mb-2">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Revenue Generated</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">${(totalRevenue / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +15.8% vs last quarter
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-secondary-500 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Overall ROI</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{overallRoi.toFixed(1)}x</p>
          <p className="text-xs text-secondary-500 mt-1">Return on marketing</p>
        </div>
      </div>

      {selectedView === 'overview' && (
        <>
          {/* Funnel and Lead Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Marketing Funnel */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary-600" />
                Marketing Funnel
              </h3>
              <div className="space-y-3">
                {FUNNEL_DATA.map((stage, idx) => {
                  const nextStage = FUNNEL_DATA[idx + 1];
                  const conversionRate = nextStage ? ((nextStage.value / stage.value) * 100).toFixed(1) : null;

                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-secondary-700">{stage.stage}</span>
                        <span className="text-sm font-bold text-secondary-900">{stage.value.toLocaleString()}</span>
                      </div>
                      <div className="h-8 bg-secondary-100 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all flex items-center justify-end pr-3"
                          style={{
                            width: `${(stage.value / FUNNEL_DATA[0].value) * 100}%`,
                            backgroundColor: stage.fill,
                          }}
                        >
                          {(stage.value / FUNNEL_DATA[0].value) > 0.15 && (
                            <span className="text-xs font-semibold text-white">
                              {((stage.value / FUNNEL_DATA[0].value) * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {conversionRate && (
                        <div className="flex justify-center mt-1">
                          <span className="text-xs text-secondary-500">↓ {conversionRate}% conversion</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lead Distribution by Channel */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" />
                Lead Distribution by Channel
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value.toLocaleString(), 'Leads']}
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Lead Generation Trend
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="mqls" name="MQLs" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="customers" name="Customers" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {selectedView === 'channels' && (
        <>
          {/* Channel Performance Comparison */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">Channel Performance Comparison</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CHANNELS} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}x`} />
                  <YAxis type="category" dataKey="channel" width={120} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value.toFixed(1)}x`, 'ROI']}
                  />
                  <Bar dataKey="roi" radius={[0, 4, 4, 0]}>
                    {MOCK_CHANNELS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Details Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-secondary-100">
              <h3 className="text-lg font-semibold text-secondary-900">Channel Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Channel</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Leads</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">MQLs</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Customers</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Conv. Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Spend</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">CAC</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">ROI</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {MOCK_CHANNELS.map((channel) => (
                    <tr key={channel.id} className="hover:bg-secondary-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                          <span className="font-medium text-secondary-900">{channel.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-secondary-600">{channel.leads.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-secondary-600">{channel.mqls.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-secondary-900">{channel.customers}</td>
                      <td className="px-4 py-3 text-right text-secondary-600">{channel.conversionRate.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right text-secondary-600">${(channel.spend / 1000).toFixed(0)}K</td>
                      <td className="px-4 py-3 text-right text-secondary-600">${channel.cac.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-secondary-900">${(channel.revenueGenerated / 1000000).toFixed(2)}M</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600">{channel.roi.toFixed(1)}x</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`flex items-center justify-end gap-1 ${channel.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {channel.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {channel.trend > 0 ? '+' : ''}{channel.trend}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {selectedView === 'campaigns' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-secondary-900">Active Campaigns</h3>
            <button className="btn-primary text-sm">+ New Campaign</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Campaign</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Channel</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Budget</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Spend</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">Conversions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">CPA</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {CAMPAIGN_DATA.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 font-medium text-secondary-900">{campaign.name}</td>
                    <td className="px-4 py-3 text-secondary-600">{campaign.channel}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        campaign.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-secondary-100 text-secondary-600'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-secondary-600">${campaign.budget.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div>
                        <span className="text-secondary-900">${campaign.spend.toLocaleString()}</span>
                        <div className="w-full h-1.5 bg-secondary-100 rounded-full mt-1">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${(campaign.spend / campaign.budget) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-secondary-900">{campaign.conversions}</td>
                    <td className="px-4 py-3 text-right text-secondary-600">${campaign.cpa}</td>
                    <td className="px-4 py-3 text-right font-bold text-green-600">{campaign.roas}x</td>
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
