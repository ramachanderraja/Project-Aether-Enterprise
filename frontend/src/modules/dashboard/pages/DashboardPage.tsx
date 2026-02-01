import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users, BarChart3 } from 'lucide-react';

// Placeholder KPI data
const kpis = [
  {
    title: 'Total Revenue',
    value: '$12.5M',
    change: '+5.9%',
    trend: 'up',
    icon: DollarSign,
    color: 'primary',
  },
  {
    title: 'Gross Margin',
    value: '42.5%',
    change: '+0.7%',
    trend: 'up',
    icon: BarChart3,
    color: 'success',
  },
  {
    title: 'Operating Expenses',
    value: '$3.2M',
    change: '+3.2%',
    trend: 'up',
    icon: TrendingUp,
    color: 'warning',
  },
  {
    title: 'EBITDA',
    value: '$2.05M',
    change: '+12.0%',
    trend: 'up',
    icon: TrendingUp,
    color: 'success',
  },
];

const anomalies = [
  {
    id: 1,
    severity: 'high',
    title: 'Cloud Infrastructure Spike',
    description: 'AWS spending 47% above forecast this month',
    impact: '$125,000',
  },
  {
    id: 2,
    severity: 'medium',
    title: 'Revenue Below Forecast',
    description: 'EMEA region 8% below Q1 target',
    impact: '$450,000',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Executive Dashboard</h1>
          <p className="text-secondary-500">Financial overview as of January 31, 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input">
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <button className="btn btn-primary">Export Report</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${kpi.color}-100`}>
                <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
              </div>
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-success-600' : 'text-error-600'
                }`}
              >
                {kpi.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {kpi.change}
              </span>
            </div>
            <h3 className="text-secondary-500 text-sm">{kpi.title}</h3>
            <p className="text-2xl font-bold text-secondary-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Revenue Trend</h2>
          <div className="h-64 bg-secondary-50 rounded-lg flex items-center justify-center">
            <p className="text-secondary-400">Revenue chart will render here</p>
          </div>
        </div>

        {/* Anomalies Panel */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-secondary-900">Active Anomalies</h2>
            <span className="px-2 py-1 bg-error-100 text-error-700 text-xs font-medium rounded-full">
              {anomalies.length} Active
            </span>
          </div>
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className="p-4 rounded-lg border border-secondary-200 hover:border-primary-300 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-full ${
                      anomaly.severity === 'high' ? 'bg-error-100' : 'bg-warning-100'
                    }`}
                  >
                    <AlertTriangle
                      size={16}
                      className={
                        anomaly.severity === 'high' ? 'text-error-600' : 'text-warning-600'
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-secondary-900">{anomaly.title}</h3>
                    <p className="text-xs text-secondary-500 mt-1">{anomaly.description}</p>
                    <p className="text-xs font-medium text-error-600 mt-2">
                      Impact: {anomaly.impact}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost w-full mt-4 text-primary-600">
            View All Anomalies
          </button>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-600 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-secondary-900">AI Insight</h3>
            <p className="text-secondary-600 mt-1">
              Pipeline analysis suggests 3 deals worth $2.1M could close early with targeted
              engagement. Consider prioritizing Enterprise Corp and TechStart Inc accounts this
              week.
            </p>
            <button className="btn btn-primary mt-4">View Pipeline Analysis</button>
          </div>
        </div>
      </div>
    </div>
  );
}
