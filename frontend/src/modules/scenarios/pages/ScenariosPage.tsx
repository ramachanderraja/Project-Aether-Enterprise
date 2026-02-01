import { useState } from 'react';

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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
  }).format(value);
};

export default function ScenariosPage() {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['scn_001', 'scn_002']);
  const [activeTab, setActiveTab] = useState<'list' | 'compare' | 'create'>('list');
  const [typeFilter, setTypeFilter] = useState<string>('all');

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

  const comparisonScenarios = mockScenarios.filter(s => selectedScenarios.includes(s.id) && s.results);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Scenario Planning</h1>
          <p className="text-secondary-500">Model and compare financial scenarios</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('create')}>
          + New Scenario
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {(['list', 'compare', 'create'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab === 'list' ? 'All Scenarios' : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                  <button className="text-sm text-primary-600 hover:text-primary-700">Run Simulation</button>
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
              <button className="btn-primary">
                Create & Run Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
