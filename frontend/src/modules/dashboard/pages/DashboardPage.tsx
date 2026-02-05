import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Target,
  Calendar,
  Activity,
  X,
  Maximize2,
  ExternalLink,
  Zap,
  CheckCircle2,
  Compass
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ZAxis
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Mock revenue data for charts - with actual values for past months
const MOCK_REVENUE_DATA = [
  { date: 'Jul', actual: 4200, forecast: 4100, confidenceLower: 3900, confidenceUpper: 4300 },
  { date: 'Aug', actual: 4500, forecast: 4400, confidenceLower: 4100, confidenceUpper: 4700 },
  { date: 'Sep', actual: 4800, forecast: 4700, confidenceLower: 4400, confidenceUpper: 5000 },
  { date: 'Oct', actual: 5100, forecast: 5000, confidenceLower: 4700, confidenceUpper: 5300 },
  { date: 'Nov', actual: 5300, forecast: 5200, confidenceLower: 4900, confidenceUpper: 5500 },
  { date: 'Dec', actual: 5600, forecast: 5500, confidenceLower: 5100, confidenceUpper: 5900 },
  { date: 'Jan', forecast: 5800, confidenceLower: 5300, confidenceUpper: 6300 },
  { date: 'Feb', forecast: 6100, confidenceLower: 5500, confidenceUpper: 6700 },
  { date: 'Mar', forecast: 6400, confidenceLower: 5700, confidenceUpper: 7100 },
  { date: 'Apr', forecast: 6700, confidenceLower: 5900, confidenceUpper: 7500 },
  { date: 'May', forecast: 7000, confidenceLower: 6100, confidenceUpper: 7900 },
  { date: 'Jun', forecast: 7300, confidenceLower: 6300, confidenceUpper: 8300 },
];

// SaaS metrics trend data
const SAAS_METRICS_TREND = [
  { date: 'Jul', ruleOf40: 42 },
  { date: 'Aug', ruleOf40: 44 },
  { date: 'Sep', ruleOf40: 46 },
  { date: 'Oct', ruleOf40: 48 },
  { date: 'Nov', ruleOf40: 49 },
  { date: 'Dec', ruleOf40: 51 },
];

interface Anomaly {
  id: number;
  severity: 'high' | 'medium' | 'low';
  metric: string;
  title: string;
  description: string;
  driver: string;
  impact: string;
  impactValue: number;
}

const anomalies: Anomaly[] = [
  {
    id: 1,
    severity: 'high',
    metric: 'Operating Expenses',
    title: 'Cloud Infrastructure Spike',
    description: 'Q3 Operating Expenses rose unexpectedly by 12% due to Cloud Infrastructure overspend',
    driver: 'Cloud Infrastructure',
    impact: '$150,000',
    impactValue: 150000,
  },
  {
    id: 2,
    severity: 'medium',
    metric: 'EMEA Revenue',
    title: 'Revenue Below Forecast',
    description: 'EMEA region 8% below Q1 target primarily due to delayed enterprise deals',
    driver: 'Sales Cycle Extension',
    impact: '$450,000',
    impactValue: 450000,
  },
  {
    id: 3,
    severity: 'medium',
    metric: 'Marketing Spend',
    title: 'Marketing Budget Overrun',
    description: 'Unplanned conference sponsorship and event costs exceeded quarterly allocation',
    driver: 'Event Sponsorship',
    impact: '$45,000',
    impactValue: 45000,
  },
];

const kpis = [
  {
    label: 'Total YTD Revenue',
    value: '$28.5M',
    change: '+24%',
    trend: 'up' as const,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: DollarSign,
    type: 'revenue',
    subValue: 'vs Previous YTD',
  },
  {
    label: 'In-Year Closed ACV',
    value: '$12.4M',
    change: '+18%',
    trend: 'up' as const,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    icon: Calendar,
    type: 'acv',
  },
  {
    label: 'EBITDA Margin',
    value: '21%',
    change: '+2.5%',
    trend: 'up' as const,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: Target,
    type: 'margin',
  },
  {
    label: 'Rule of 40',
    value: '51',
    change: '+3',
    trend: 'up' as const,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    icon: TrendingUp,
    type: 'rule40',
  },
];

// AI Insights - simulated strategic guidance
const aiInsight = "Strong momentum detected in Q4. Rule of 40 score of 51 positions you in the 'elite' SaaS category. However, Cloud Infrastructure costs are trending 47% above forecast — recommend immediate review of auto-scaling policies to protect EBITDA margin.";

// Mock RCA responses
const mockRCAResponses: Record<string, string> = {
  'Operating Expenses': `Q3 Operating Expenses rose unexpectedly by 12% due to Cloud Infrastructure overspend. The root cause was unoptimized auto-scaling scripts in non-production Kubernetes clusters, leading to excessive compute consumption. This negatively impacts Q3 profitability and budget adherence. Recommend immediate revision of non-production auto-scaling policies, right-sizing of environments, and enhanced cloud cost governance to prevent future overspend.`,
  'EMEA Revenue': `Analysis of EMEA sales pipeline data reveals the following root causes for the revenue shortfall:

Extended procurement cycles - Average deal cycle increased from 45 to 72 days in Q4. Budget freeze at 3 enterprise accounts with combined pipeline value of $890K pushed to Q1. Two strategic accounts delayed decisions pending competitive evaluation.

Recovery probability remains high for Q1 with focused executive engagement.`,
  'Marketing Spend': `Marketing budget variance analysis indicates unplanned conference sponsorship required quick decision ($35K), event production costs exceeded estimates by 15%, and strong demand gen results led to additional spend allocation.

The ROI on incremental spend shows 2.8x positive return with $420K in new pipeline generated.`,
};

// Mock Action Plans
const mockActionPlans: Record<string, string> = {
  'Operating Expenses': `**1. Granular Cost Analysis (Engineering & Finance)**
   **Action:** Conduct an immediate deep dive into cloud provider billing data to pinpoint specific services, instances, projects, or departments driving the -$150,000 variance. Determine if it's due to increased usage, new service adoption, or inefficient configurations.
   **Timeline:** Within 3 business days.

**2. Immediate Resource Optimization (Engineering)**
   **Action:** Audit current auto-scaling policies in AWS Console. Implement scheduled scaling for known peak periods. Review and terminate unused EC2 instances and EBS volumes.
   **Timeline:** Within 5 business days.

**3. Enhanced Governance Framework**
   **Action:** Implement CloudWatch cost anomaly detection alerts. Establish weekly cost review meetings with Engineering and Finance. Set up budget alerts at 75% and 90% thresholds.
   **Timeline:** Within 14 days.

**Owner:** VP Engineering & FinOps Lead
**Expected Savings:** $40-50K/month`,
  'EMEA Revenue': `**1. Executive Sponsor Outreach**
   **Action:** CEO/CRO direct outreach to 3 key accounts with budget freezes to understand timing and unlock deals.
   **Timeline:** This week.

**2. Accelerated POC Program**
   **Action:** Offer expedited proof-of-concept with success-based pricing for delayed deals. Deploy customer success resources for risk mitigation.
   **Timeline:** Within 10 days.

**3. Competitive Response**
   **Action:** Prepare competitive displacement materials and case studies. Offer flexible payment terms to address budget timing concerns.
   **Timeline:** Ongoing.

**Owner:** VP Sales, EMEA
**Target Recovery:** 75% of delayed pipeline in Q1`,
  'Marketing Spend': `**1. Budget Reconciliation**
   **Action:** Reconcile Q4 actuals with finance team. Document ROI on unplanned conference spend for future reference.
   **Timeline:** Within 5 days.

**2. Process Improvement**
   **Action:** Establish emergency spend approval workflow with CMO sign-off for unplanned events > $10K. Create event sponsorship evaluation framework.
   **Timeline:** By Feb 15.

**3. Q1 Rebalancing**
   **Action:** Reallocate Q1 budget to absorb overrun while protecting high-ROI demand gen programs.
   **Timeline:** Within 7 days.

**Owner:** CMO & Finance Partner
**Budget Impact:** Neutral to Q1 with reallocation`,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [expandedKPI, setExpandedKPI] = useState<{ label: string; type: string } | null>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [rcaNarrative, setRcaNarrative] = useState<string>('');
  const [isLoadingRca, setIsLoadingRca] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const handleAnomalyClick = async (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    setActionPlan(null);
    setRcaNarrative('');
    setIsLoadingRca(true);

    // Simulate AI analysis delay
    setTimeout(() => {
      setRcaNarrative(mockRCAResponses[anomaly.metric] || 'Analysis not available for this metric.');
      setIsLoadingRca(false);
    }, 1500);
  };

  const handleCreateActionPlan = async () => {
    if (!selectedAnomaly) return;
    setIsGeneratingPlan(true);

    setTimeout(() => {
      setActionPlan(mockActionPlans[selectedAnomaly.metric] || 'Action plan generation not available.');
      setIsGeneratingPlan(false);
    }, 1200);
  };

  const navigateToDetail = (type: string) => {
    const routes: Record<string, string> = {
      revenue: '/revenue',
      acv: '/sales',
      margin: '/cost',
      rule40: '/revenue',
    };
    navigate(routes[type] || '/revenue');
  };

  const renderKPIDetailChart = (type: string) => {
    const commonTooltipStyle = { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' };

    switch (type) {
      case 'margin':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_REVENUE_DATA.slice(0, 6).map((d, i) => ({ ...d, margin: 18 + i * 0.5 + Math.random() * 2 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" unit="%" domain={[15, 25]} />
              <Tooltip contentStyle={commonTooltipStyle} />
              <Area type="monotone" dataKey="margin" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="EBITDA Margin %" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'rule40':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SAAS_METRICS_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[35, 55]} />
              <Tooltip contentStyle={commonTooltipStyle} />
              <Line type="monotone" dataKey="ruleOf40" stroke="#3b82f6" strokeWidth={3} name="Rule of 40" dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_REVENUE_DATA.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={commonTooltipStyle} />
              <Bar dataKey="actual" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_REVENUE_DATA.slice(0, 6).map(d => ({ ...d, acv: ((d.actual || 4000) * 0.2) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={commonTooltipStyle} />
              <Line type="monotone" dataKey="acv" stroke="#10b981" strokeWidth={3} name="Closed ACV" dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Strategic Command Center</h1>
          <p className="text-secondary-500">CFO Integrated Financial View</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs rounded-lg border border-primary-200 flex items-center">
            <Compass className="mr-2" size={14} />
            Rolling Forecast: Active
          </span>
          <select className="input text-sm">
            <option>This Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <button
            onClick={() => {
              // Export dashboard summary as CSV
              const data = [
                { Metric: 'Total YTD Revenue', Value: '$28.5M', Change: '+24%' },
                { Metric: 'In-Year Closed ACV', Value: '$12.4M', Change: '+18%' },
                { Metric: 'EBITDA Margin', Value: '21%', Change: '+2.5%' },
                { Metric: 'Rule of 40', Value: '51', Change: '+3' },
              ];
              const csvContent = [
                Object.keys(data[0]).join(','),
                ...data.map(row => Object.values(row).join(','))
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`;
              link.click();
            }}
            className="btn-primary whitespace-nowrap"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="card p-5 bg-gradient-to-r from-primary-50 to-primary-100/50 border-primary-200">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-primary-600 rounded-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-secondary-900 font-semibold text-sm mb-1">AI Strategic Guidance</h4>
            <p className="text-secondary-600 text-sm leading-relaxed">{aiInsight}</p>
          </div>
        </div>
      </div>

      {/* KPI Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <button
            key={kpi.label}
            onClick={() => setExpandedKPI({ label: kpi.label, type: kpi.type })}
            className="card p-5 text-left hover:shadow-md transition-all group relative"
          >
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={14} className="text-secondary-400" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <span className={`flex items-center gap-1 text-sm font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {kpi.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {kpi.change}
              </span>
            </div>
            <p className="text-secondary-500 text-xs uppercase tracking-wider font-medium mb-1">{kpi.label}</p>
            <p className="text-2xl font-bold text-secondary-900">{kpi.value}</p>
            {kpi.subValue && <p className="text-xs text-secondary-400 mt-1">{kpi.subValue}</p>}
          </button>
        ))}
      </div>

      {/* KPI Detail Modal */}
      {expandedKPI && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl flex flex-col shadow-2xl">
            <div className="p-6 border-b border-secondary-200 flex justify-between items-center bg-secondary-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-secondary-900">{expandedKPI.label} Trend Analysis</h3>
              <button onClick={() => setExpandedKPI(null)} className="text-secondary-400 hover:text-secondary-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 h-[400px] bg-white relative">
              {renderKPIDetailChart(expandedKPI.type)}
            </div>
            <div className="p-6 border-t border-secondary-200 bg-secondary-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => {
                  navigateToDetail(expandedKPI.type);
                  setExpandedKPI(null);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <ExternalLink size={16} />
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anomaly Modal - Matching the design from image */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl flex flex-col shadow-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-secondary-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 rounded-lg">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-secondary-900">Strategic Anomaly Detected</h3>
                  <p className="text-sm text-secondary-500">Impact Assessment & Remediation</p>
                </div>
              </div>
              <button onClick={() => setSelectedAnomaly(null)} className="text-secondary-400 hover:text-secondary-900 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Col: Anomaly Profile + RCA */}
              <div className="space-y-6">
                {/* Anomaly Profile Card */}
                <div className="p-5 bg-secondary-100 rounded-xl">
                  <h4 className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-4">Anomaly Profile</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500">Metric</span>
                      <span className="text-secondary-900 font-medium">{selectedAnomaly.metric}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500">Primary Driver</span>
                      <span className="text-primary-600 font-medium">{selectedAnomaly.driver}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500">Financial Impact</span>
                      <span className="text-red-600 font-mono font-bold">-${selectedAnomaly.impactValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-secondary-500">Severity</span>
                      <span className={`font-bold uppercase text-xs px-3 py-1 rounded-full ${
                        selectedAnomaly.severity === 'high'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>{selectedAnomaly.severity}</span>
                    </div>
                  </div>
                </div>

                {/* AI Root Cause Analysis Card */}
                <div className="p-5 bg-primary-50 border-l-4 border-primary-500 rounded-r-xl">
                  <h4 className="text-primary-700 font-bold mb-3 flex items-center">
                    <Zap size={18} className="mr-2 text-primary-600" />
                    AI Root Cause Analysis
                  </h4>
                  {isLoadingRca ? (
                    <div className="flex items-center gap-3 text-secondary-500 text-sm py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent"></div>
                      <span>Analyzing root causes...</span>
                    </div>
                  ) : (
                    <div className="text-secondary-700 text-sm leading-relaxed">
                      {rcaNarrative}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Recommended Action Plan */}
              <div className="space-y-4">
                <div className="p-5 bg-white border border-secondary-200 rounded-xl h-full">
                  <h4 className="text-lg font-bold text-secondary-900 mb-4">Recommended Action Plan</h4>

                  {!actionPlan && !isGeneratingPlan && (
                    <div className="text-secondary-600 text-sm mb-4">
                      Here is a step-by-step executive action plan to address the {selectedAnomaly.driver} operating expense anomaly:
                    </div>
                  )}

                  {isGeneratingPlan ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent"></div>
                      <span className="text-secondary-500 text-sm">Generating action plan...</span>
                    </div>
                  ) : actionPlan ? (
                    <div className="text-secondary-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {actionPlan}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-secondary-500 text-sm">
                        Click the button below to generate a detailed action plan based on the AI analysis.
                      </p>
                      <button
                        onClick={handleCreateActionPlan}
                        disabled={isLoadingRca}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-secondary-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Zap size={16} />
                        Generate Action Plan
                      </button>
                    </div>
                  )}

                  {actionPlan && (
                    <div className="mt-6 pt-4 border-t border-secondary-200 flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                        <CheckCircle2 size={14} />
                        Assign to Owner
                      </button>
                      <button className="px-4 py-2 border border-secondary-200 text-secondary-600 text-sm font-medium rounded-lg hover:bg-secondary-50 transition-colors">
                        Export
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rolling Forecast Chart */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">Rolling 12-Month Forecast</h3>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MOCK_REVENUE_DATA}>
                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                  formatter={(value: any, name: string) => {
                    if (value === undefined || value === null) return ['-', name];
                    return [`$${value.toLocaleString()}`, name];
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="confidenceUpper" stroke="transparent" fill="url(#confidenceGradient)" name="Confidence Interval" />
                <Area type="monotone" dataKey="confidenceLower" stroke="transparent" fill="#ffffff" />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Actual"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3b82f6', r: 3 }}
                  name="Forecast"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cash Flow Projection */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-secondary-900">Cash Flow Projection</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 font-medium">Runway: 18 Months</span>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MOCK_REVENUE_DATA.slice(0, 6).map(d => ({ ...d, cash: ((d.actual || 0) * 0.15), burn: -150 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} />
                <Legend />
                <Bar dataKey="cash" name="Net Cash Flow" fill="#10b981" barSize={30} radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="burn" name="Burn Rate Threshold" stroke="#ef4444" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rule of 40 Analysis */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">The "Rule of 40" Trajectory</h3>
          <p className="text-sm text-secondary-500 mb-6">Balancing Growth Rate vs. Profit Margin (Target &gt; 40%)</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="growth" name="Growth %" unit="%" stroke="#94a3b8" domain={[0, 60]} />
                <YAxis type="number" dataKey="margin" name="Margin %" unit="%" stroke="#94a3b8" domain={[-20, 40]} />
                <ZAxis type="number" range={[100, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }} />
                <Legend />
                <Scatter name="Competitors" data={[
                  { name: 'SAP Ariba', growth: 18, margin: 22 },
                  { name: 'Accenture', growth: 12, margin: 15 },
                  { name: 'IBM', growth: 5, margin: 18 },
                  { name: 'FTI Consulting', growth: 8, margin: 12 },
                  { name: 'Oracle', growth: 10, margin: 28 },
                  { name: 'Manhattan Associates', growth: 22, margin: 14 },
                  { name: 'WNS', growth: 15, margin: 8 },
                  { name: 'Genpact', growth: 14, margin: 11 },
                  { name: 'Kinaxis', growth: 25, margin: 5 },
                  { name: 'Blue Yonder', growth: 20, margin: -2 }
                ]} fill="#94a3b8" />
                <Scatter name="Aether (Current)" data={[{ growth: 24, margin: 27 }]} fill="#3b82f6" shape="star" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategic Anomalies */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-secondary-900">Strategic Risks</h3>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
              {anomalies.length} Active
            </span>
          </div>
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <button
                key={anomaly.id}
                onClick={() => handleAnomalyClick(anomaly)}
                className="w-full p-4 rounded-lg border border-secondary-200 hover:border-primary-300 hover:shadow-sm transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-full ${anomaly.severity === 'high' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                    <AlertTriangle size={16} className={anomaly.severity === 'high' ? 'text-red-600' : 'text-yellow-600'} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-secondary-900">{anomaly.title}</h4>
                    </div>
                    <p className="text-xs text-secondary-500 mt-1 line-clamp-2">{anomaly.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs font-medium text-red-600">Impact: {anomaly.impact}</span>
                      <span className="text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        Analyze →
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/reports?tab=risks')}
            className="w-full mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium py-2"
          >
            View All Risks
          </button>
        </div>
      </div>
    </div>
  );
}
