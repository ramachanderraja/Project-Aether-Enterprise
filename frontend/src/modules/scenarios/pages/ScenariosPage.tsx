import { useState } from 'react';
import {
  AreaChart,
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'budget' | 'forecast' | 'what_if' | 'sensitivity';
  status: 'draft' | 'active' | 'approved' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  results?: {
    revenue: number;
    costs: number;
    ebitda: number;
    margin: number;
  };
}

interface Assumption {
  variable: string;
  baseValue: number;
  unit: string;
  category: string;
}

interface ForecastDataPoint {
  month: string;
  actual?: number;
  forecast?: number;
  confidenceUpper?: number;
  confidenceLower?: number;
}

interface AIAnalysis {
  mitigation: string[];
  growth: string[];
}

const mockScenarios: Scenario[] = [
  {
    id: 'scn_001',
    name: 'FY2024 Base Budget',
    description: 'Baseline budget scenario for fiscal year 2024',
    type: 'budget',
    status: 'approved',
    createdBy: 'John Smith',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    results: { revenue: 125000000, costs: 95000000, ebitda: 30000000, margin: 24 },
  },
  {
    id: 'scn_002',
    name: 'Aggressive Growth Scenario',
    description: 'What-if scenario with aggressive growth assumptions',
    type: 'what_if',
    status: 'active',
    createdBy: 'Sarah Johnson',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-10',
    results: { revenue: 145000000, costs: 115000000, ebitda: 30000000, margin: 20.7 },
  },
  {
    id: 'scn_003',
    name: 'Conservative Outlook',
    description: 'Conservative scenario with lower growth expectations',
    type: 'forecast',
    status: 'draft',
    createdBy: 'Mike Wilson',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
    results: { revenue: 108000000, costs: 88000000, ebitda: 20000000, margin: 18.5 },
  },
  {
    id: 'scn_004',
    name: 'Market Sensitivity Analysis',
    description: 'Sensitivity analysis on key market variables',
    type: 'sensitivity',
    status: 'active',
    createdBy: 'John Smith',
    createdAt: '2024-02-20',
    updatedAt: '2024-02-22',
  },
];

const mockAssumptions: Assumption[] = [
  { variable: 'Revenue Growth', baseValue: 15, unit: '%', category: 'Revenue' },
  { variable: 'Cost Inflation', baseValue: 3, unit: '%', category: 'Cost' },
  { variable: 'Headcount Growth', baseValue: 10, unit: '%', category: 'HR' },
  { variable: 'Marketing Spend', baseValue: 2500000, unit: 'USD', category: 'Cost' },
  { variable: 'Win Rate', baseValue: 32, unit: '%', category: 'Sales' },
  { variable: 'Churn Rate', baseValue: 5, unit: '%', category: 'Revenue' },
];

const MOCK_REVENUE_DATA: ForecastDataPoint[] = [
  { month: 'Jan', actual: 4500 },
  { month: 'Feb', actual: 4800 },
  { month: 'Mar', actual: 5100 },
  { month: 'Apr', actual: 4900 },
  { month: 'May', actual: 5300 },
  { month: 'Jun', actual: 5600 },
  { month: 'Jul', forecast: 5800, confidenceUpper: 6200, confidenceLower: 5400 },
  { month: 'Aug', forecast: 6000, confidenceUpper: 6500, confidenceLower: 5500 },
  { month: 'Sep', forecast: 6200, confidenceUpper: 6800, confidenceLower: 5600 },
  { month: 'Oct', forecast: 6400, confidenceUpper: 7100, confidenceLower: 5700 },
  { month: 'Nov', forecast: 6600, confidenceUpper: 7400, confidenceLower: 5800 },
  { month: 'Dec', forecast: 6800, confidenceUpper: 7800, confidenceLower: 5800 },
];

// Generate normal distribution for Monte Carlo visualization
const generateDistribution = (mean: number, stdDev: number) => {
  const data = [];
  for (let x = mean - 4 * stdDev; x <= mean + 4 * stdDev; x += stdDev / 2) {
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
    data.push({ value: Math.round(x), probability: y });
  }
  return data;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value);
};

// Mock AI analysis responses
const getMockAnalysis = (investment: number, headcount: number, price: number): AIAnalysis => {
  const analyses: Record<string, AIAnalysis> = {
    aggressive: {
      mitigation: [
        'Monitor customer acquisition cost (CAC) closely as marketing spend increases - current trajectory suggests CAC may rise 15-20%',
        'Implement staged hiring to manage operational capacity - recommend 60/40 split between Q3/Q4',
        'Price elasticity analysis indicates 2.5% increase is within acceptable bounds, but monitor churn weekly',
        'Consider hedging strategies for currency exposure given expansion plans',
      ],
      growth: [
        'Increased marketing investment positions well for Q4 enterprise sales cycle - expect 8-12 additional enterprise leads',
        'Headcount expansion enables faster product development - estimate 2 major feature releases ahead of competitors',
        'Premium pricing strategy can improve unit economics by 12% while maintaining market share',
        'Cross-sell opportunities increase with expanded sales team capacity',
      ],
    },
    conservative: {
      mitigation: [
        'Reduced marketing may impact brand awareness - maintain minimum threshold for brand campaigns',
        'Headcount reduction should prioritize non-revenue generating roles',
        'Price reduction risk: competitor response may trigger price war in mid-market segment',
        'Monitor pipeline velocity closely - reduced investment typically shows 60-90 day lag in impact',
      ],
      growth: [
        'Cost optimization improves EBITDA margin by estimated 3-4 percentage points',
        'Lean operations enable faster decision-making and reduced overhead',
        'Lower pricing may accelerate SMB segment growth and market penetration',
        'Focus on existing customer expansion - higher ROI than new acquisition in conservative scenario',
      ],
    },
    balanced: {
      mitigation: [
        'Current parameters suggest moderate risk profile - continue standard monitoring protocols',
        'Watch for early warning signs in customer satisfaction metrics',
        'Maintain cash reserves at 6-month operational runway minimum',
        'Review vendor contracts for optimization opportunities',
      ],
      growth: [
        'Balanced approach allows for opportunistic market moves while maintaining stability',
        'Investment in sales enablement can improve win rates by 5-8%',
        'Product-led growth initiatives can supplement marketing investment',
        'Strategic pricing flexibility enables competitive responses without margin erosion',
      ],
    },
  };

  // Determine which analysis to return based on parameters
  const combinedScore = investment + headcount + price;
  if (combinedScore > 15) return analyses.aggressive;
  if (combinedScore < -10) return analyses.conservative;
  return analyses.balanced;
};

export default function ScenariosPage() {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['scn_001', 'scn_002']);
  const [activeTab, setActiveTab] = useState<'list' | 'compare' | 'simulate' | 'create'>('list');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Monte Carlo simulation state
  const [investment, setInvestment] = useState(10.0);
  const [headcount, setHeadcount] = useState(5.0);
  const [price, setPrice] = useState(2.5);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedData, setSimulatedData] = useState<ForecastDataPoint[]>(MOCK_REVENUE_DATA);
  const [distributionData, setDistributionData] = useState(generateDistribution(6750, 250));
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  const filteredScenarios = typeFilter === 'all'
    ? mockScenarios
    : mockScenarios.filter(s => s.type === typeFilter);

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-secondary-100 text-secondary-800',
      active: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      archived: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles];
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      budget: 'bg-purple-100 text-purple-800',
      forecast: 'bg-blue-100 text-blue-800',
      what_if: 'bg-orange-100 text-orange-800',
      sensitivity: 'bg-pink-100 text-pink-800',
    };
    return styles[type as keyof typeof styles];
  };

  const toggleScenarioSelection = (id: string) => {
    setSelectedScenarios(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    setAnalysis(null);

    // Simulation Logic
    const newData = MOCK_REVENUE_DATA.map(item => {
      if (!item.forecast) return item;

      // Impact Logic:
      // Investment: Medium impact, lagged (0.5 weight)
      // Headcount: Low immediate impact (0.3 weight)
      // Price: High immediate impact (0.8 weight)
      const combinedImpact = (investment * 0.5) + (headcount * 0.3) + (price * 0.8);
      const multiplier = 1 + (combinedImpact / 100);

      const newForecast = Math.round(item.forecast * multiplier);
      // Uncertainty increases significantly with Price changes and major Investment shifts
      const uncertainty = Math.round(newForecast * (0.15 + (Math.abs(price) * 0.01) + (Math.abs(investment) * 0.005)));

      return {
        ...item,
        forecast: newForecast,
        confidenceUpper: newForecast + uncertainty,
        confidenceLower: newForecast - uncertainty,
      };
    });

    // Calculate distribution mean/stdDev based on final forecast month
    const baseVal = 6500;
    const combinedImpact = (investment * 0.5) + (headcount * 0.3) + (price * 0.8);
    const newMean = baseVal * (1 + (combinedImpact / 100));
    const newStdDev = 200 + (Math.abs(investment) * 5) + (Math.abs(price) * 15);

    // Simulate network delay
    setTimeout(() => {
      setSimulatedData(newData);
      setDistributionData(generateDistribution(newMean, newStdDev));
      setAnalysis(getMockAnalysis(investment, headcount, price));
      setIsSimulating(false);
    }, 1500);
  };

  const comparisonScenarios = mockScenarios.filter(s => selectedScenarios.includes(s.id) && s.results);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Scenario Planning</h1>
          <p className="text-secondary-500">Model and compare financial scenarios with Monte Carlo simulation</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('create')}>
          + New Scenario
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {(['list', 'compare', 'simulate', 'create'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab === 'list' ? 'All Scenarios' : tab === 'simulate' ? 'Monte Carlo Simulator' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="budget">Budget</option>
              <option value="forecast">Forecast</option>
              <option value="what_if">What-If</option>
              <option value="sensitivity">Sensitivity</option>
            </select>
            <p className="text-sm text-secondary-500">
              Select up to 3 scenarios to compare
            </p>
          </div>

          {/* Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className={`card p-4 cursor-pointer transition-colors ${
                  selectedScenarios.includes(scenario.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'hover:border-secondary-300'
                }`}
                onClick={() => toggleScenarioSelection(scenario.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedScenarios.includes(scenario.id)}
                      onChange={() => toggleScenarioSelection(scenario.id)}
                      className="w-4 h-4 text-primary-600 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <h3 className="font-medium text-secondary-900">{scenario.name}</h3>
                      <p className="text-sm text-secondary-500">{scenario.description}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(scenario.status)}`}>
                    {scenario.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTypeBadge(scenario.type)}`}>
                    {scenario.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-secondary-400">by {scenario.createdBy}</span>
                </div>

                {scenario.results && (
                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-secondary-200">
                    <div>
                      <p className="text-xs text-secondary-500">Revenue</p>
                      <p className="font-medium text-secondary-900">{formatCurrency(scenario.results.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500">Costs</p>
                      <p className="font-medium text-secondary-900">{formatCurrency(scenario.results.costs)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500">EBITDA</p>
                      <p className="font-medium text-secondary-900">{formatCurrency(scenario.results.ebitda)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-secondary-500">Margin</p>
                      <p className="font-medium text-secondary-900">{scenario.results.margin}%</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <button className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
                  <button className="text-sm text-primary-600 hover:text-primary-700">Clone</button>
                  <button
                    className="text-sm text-primary-600 hover:text-primary-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab('simulate');
                    }}
                  >
                    Run Simulation
                  </button>
                </div>
              </div>
            ))}
          </div>

          {selectedScenarios.length >= 2 && (
            <div className="flex justify-center">
              <button
                onClick={() => setActiveTab('compare')}
                className="btn-primary"
              >
                Compare Selected Scenarios ({selectedScenarios.length})
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <div className="space-y-6">
          {comparisonScenarios.length < 2 ? (
            <div className="card p-8 text-center">
              <p className="text-secondary-500">Select at least 2 scenarios with results to compare</p>
              <button
                onClick={() => setActiveTab('list')}
                className="mt-4 text-primary-600 hover:text-primary-700"
              >
                Go to scenario list
              </button>
            </div>
          ) : (
            <>
              {/* Comparison Table */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-secondary-200">
                  <h2 className="text-lg font-semibold text-secondary-900">Scenario Comparison</h2>
                </div>
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Metric</th>
                      {comparisonScenarios.map((scenario) => (
                        <th key={scenario.id} className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                          {scenario.name}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    <tr>
                      <td className="px-4 py-3 font-medium text-secondary-900">Revenue</td>
                      {comparisonScenarios.map((scenario) => (
                        <td key={scenario.id} className="px-4 py-3">{formatCurrency(scenario.results!.revenue)}</td>
                      ))}
                      <td className="px-4 py-3 text-green-600">
                        +{formatCurrency(Math.abs(comparisonScenarios[1].results!.revenue - comparisonScenarios[0].results!.revenue))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-secondary-900">Costs</td>
                      {comparisonScenarios.map((scenario) => (
                        <td key={scenario.id} className="px-4 py-3">{formatCurrency(scenario.results!.costs)}</td>
                      ))}
                      <td className="px-4 py-3 text-red-600">
                        +{formatCurrency(Math.abs(comparisonScenarios[1].results!.costs - comparisonScenarios[0].results!.costs))}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-secondary-900">EBITDA</td>
                      {comparisonScenarios.map((scenario) => (
                        <td key={scenario.id} className="px-4 py-3">{formatCurrency(scenario.results!.ebitda)}</td>
                      ))}
                      <td className="px-4 py-3 text-secondary-600">
                        {formatCurrency(comparisonScenarios[1].results!.ebitda - comparisonScenarios[0].results!.ebitda)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-secondary-900">EBITDA Margin</td>
                      {comparisonScenarios.map((scenario) => (
                        <td key={scenario.id} className="px-4 py-3">{scenario.results!.margin}%</td>
                      ))}
                      <td className="px-4 py-3 text-yellow-600">
                        {(comparisonScenarios[1].results!.margin - comparisonScenarios[0].results!.margin).toFixed(1)}%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Visual Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Revenue Comparison</h3>
                  <div className="space-y-4">
                    {comparisonScenarios.map((scenario, index) => {
                      const maxRevenue = Math.max(...comparisonScenarios.map(s => s.results!.revenue));
                      const width = (scenario.results!.revenue / maxRevenue) * 100;
                      const colors = ['bg-primary-500', 'bg-green-500', 'bg-orange-500'];

                      return (
                        <div key={scenario.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-secondary-600">{scenario.name}</span>
                            <span className="font-medium">{formatCurrency(scenario.results!.revenue)}</span>
                          </div>
                          <div className="h-8 bg-secondary-100 rounded overflow-hidden">
                            <div
                              className={`h-full ${colors[index]} rounded flex items-center justify-end pr-2`}
                              style={{ width: `${width}%` }}
                            >
                              <span className="text-white text-xs font-medium">{formatCurrency(scenario.results!.revenue)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">EBITDA Margin Comparison</h3>
                  <div className="flex items-end justify-around h-48">
                    {comparisonScenarios.map((scenario, index) => {
                      const colors = ['bg-primary-500', 'bg-green-500', 'bg-orange-500'];
                      const height = (scenario.results!.margin / 30) * 100;

                      return (
                        <div key={scenario.id} className="flex flex-col items-center">
                          <span className="text-lg font-bold text-secondary-900 mb-2">{scenario.results!.margin}%</span>
                          <div
                            className={`w-16 ${colors[index]} rounded-t`}
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-xs text-secondary-500 mt-2 text-center max-w-20">{scenario.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'simulate' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-secondary-900">Monte Carlo Simulation Engine</h2>
              <p className="text-sm text-secondary-500">Real-time "What-If" analysis with 10,000 iteration simulation</p>
            </div>
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="btn-primary flex items-center gap-2"
            >
              {isSimulating ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Running Simulation...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run Simulation
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Strategic Drivers Panel */}
            <div className="card p-6 space-y-6">
              <div className="flex items-center gap-2 text-primary-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h3 className="font-semibold">Strategic Drivers</h3>
              </div>

              {/* Sales & Marketing Investment */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-secondary-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    Sales & Marketing
                  </label>
                  <span className={`text-sm font-mono ${investment >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {investment > 0 ? '+' : ''}{investment}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="50"
                  step="1"
                  value={investment}
                  onChange={(e) => setInvestment(parseFloat(e.target.value))}
                  className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Headcount Adjustment */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-secondary-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Headcount Adj.
                  </label>
                  <span className={`text-sm font-mono ${headcount >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    {headcount > 0 ? '+' : ''}{headcount}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="30"
                  step="1"
                  value={headcount}
                  onChange={(e) => setHeadcount(parseInt(e.target.value))}
                  className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Price Change */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-secondary-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Price Change
                  </label>
                  <span className={`text-sm font-mono ${price >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {price > 0 ? '+' : ''}{price}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="25"
                  step="0.5"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value))}
                  className="w-full h-2 bg-secondary-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>

              {/* Monte Carlo Distribution */}
              <div className="pt-4 border-t border-secondary-200">
                <h4 className="text-sm font-medium text-secondary-700 mb-3">Outcome Probability Distribution</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={distributionData}>
                      <defs>
                        <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="probability"
                        stroke="#8b5cf6"
                        fill="url(#colorProb)"
                      />
                      <XAxis
                        dataKey="value"
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [(value * 100).toFixed(2) + '%', 'Probability']}
                        labelFormatter={(label) => `Revenue: $${(label/1000).toFixed(0)}K`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs text-secondary-400 mt-2">FY24 Revenue Outcome Distribution</p>
              </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-3 space-y-6">
              {/* Forecast Chart */}
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-secondary-900">Projected Financial Impact</h3>
                  <span className="text-xs text-secondary-500 flex items-center gap-1 bg-secondary-100 px-3 py-1 rounded-full">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    10,000 Iterations Simulated
                  </span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={simulatedData}>
                      <defs>
                        <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        axisLine={{ stroke: '#e2e8f0' }}
                        tickFormatter={(value) => `$${value}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value: number, name: string) => [
                          `$${value.toLocaleString()}K`,
                          name === 'confidenceUpper' ? 'Upper Bound (95%)' :
                          name === 'confidenceLower' ? 'Lower Bound (5%)' :
                          name === 'actual' ? 'Actual' : 'Forecast'
                        ]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="confidenceUpper"
                        stroke="none"
                        fill="url(#confidenceGradient)"
                        name="95% Confidence"
                      />
                      <Area
                        type="monotone"
                        dataKey="confidenceLower"
                        stroke="none"
                        fill="#ffffff"
                        name="5% Confidence"
                      />
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2 }}
                        name="Actual"
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                        name="Forecast"
                      />
                      <ReferenceLine
                        y={6000}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        label={{ value: 'Target', fill: '#f59e0b', fontSize: 12 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Analysis */}
              {analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mitigation Strategies */}
                  <div className="card p-6 border-l-4 border-l-red-500">
                    <h4 className="text-red-600 font-semibold mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Risk Mitigation Strategies
                    </h4>
                    <div className="space-y-3">
                      {analysis.mitigation.map((point, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0"></span>
                          <p className="text-sm text-secondary-700 leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Growth Opportunities */}
                  <div className="card p-6 border-l-4 border-l-green-500">
                    <h4 className="text-green-600 font-semibold mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Growth Opportunities
                    </h4>
                    <div className="space-y-3">
                      {analysis.growth.map((point, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0"></span>
                          <p className="text-sm text-secondary-700 leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!analysis && !isSimulating && (
                <div className="card p-8 text-center">
                  <svg className="h-12 w-12 text-secondary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-secondary-500 mb-2">Adjust the strategic drivers and click "Run Simulation"</p>
                  <p className="text-sm text-secondary-400">AI-powered analysis will identify risks and opportunities based on your scenario</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-6">Create New Scenario</h2>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Scenario Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Q2 2024 Forecast"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Type</label>
                <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="budget">Budget</option>
                  <option value="forecast">Forecast</option>
                  <option value="what_if">What-If</option>
                  <option value="sensitivity">Sensitivity Analysis</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
              <textarea
                className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Describe the scenario and its purpose..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Base Scenario (Optional)</label>
              <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Start from scratch</option>
                {mockScenarios.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Assumptions */}
            <div>
              <h3 className="text-md font-semibold text-secondary-900 mb-4">Key Assumptions</h3>
              <div className="space-y-3">
                {mockAssumptions.map((assumption) => (
                  <div key={assumption.variable} className="flex items-center gap-4 p-3 bg-secondary-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900">{assumption.variable}</p>
                      <p className="text-xs text-secondary-500">{assumption.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        defaultValue={assumption.baseValue}
                        className="w-24 px-3 py-1 border border-secondary-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-sm text-secondary-500">{assumption.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-secondary-200">
              <button
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 text-secondary-600 hover:text-secondary-700"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200">
                Save as Draft
              </button>
              <button
                className="btn-primary"
                onClick={() => setActiveTab('simulate')}
              >
                Create & Run Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
