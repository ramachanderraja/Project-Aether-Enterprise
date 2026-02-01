import { useState } from 'react';

interface Deal {
  id: string;
  name: string;
  account: string;
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  owner: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface PipelineStage {
  name: string;
  value: number;
  count: number;
  color: string;
}

const mockDeals: Deal[] = [
  { id: '1', name: 'Enterprise Platform Deal', account: 'Acme Corp', amount: 450000, stage: 'Negotiation', probability: 0.7, closeDate: '2024-02-15', owner: 'John Smith', riskLevel: 'high' },
  { id: '2', name: 'Cloud Migration Project', account: 'TechStart Inc', amount: 320000, stage: 'Proposal', probability: 0.45, closeDate: '2024-02-28', owner: 'Sarah Johnson', riskLevel: 'medium' },
  { id: '3', name: 'Analytics Suite Expansion', account: 'Global Retail', amount: 580000, stage: 'Negotiation', probability: 0.65, closeDate: '2024-03-10', owner: 'Mike Wilson', riskLevel: 'high' },
  { id: '4', name: 'Security Enhancement', account: 'FinServ Partners', amount: 290000, stage: 'Qualified', probability: 0.25, closeDate: '2024-03-30', owner: 'Emily Davis', riskLevel: 'low' },
  { id: '5', name: 'Digital Transformation', account: 'MedTech Solutions', amount: 410000, stage: 'Proposal', probability: 0.5, closeDate: '2024-02-20', owner: 'John Smith', riskLevel: 'medium' },
  { id: '6', name: 'Infrastructure Upgrade', account: 'Manufacturing Co', amount: 185000, stage: 'Qualified', probability: 0.3, closeDate: '2024-04-15', owner: 'Sarah Johnson', riskLevel: 'low' },
  { id: '7', name: 'Data Platform License', account: 'Logistics Pro', amount: 675000, stage: 'Proposal', probability: 0.55, closeDate: '2024-03-05', owner: 'Mike Wilson', riskLevel: 'medium' },
  { id: '8', name: 'AI Integration Package', account: 'Retail Giant', amount: 520000, stage: 'Negotiation', probability: 0.75, closeDate: '2024-02-10', owner: 'Emily Davis', riskLevel: 'low' },
];

const pipelineStages: PipelineStage[] = [
  { name: 'Lead', value: 2100000, count: 45, color: 'bg-secondary-400' },
  { name: 'Qualified', value: 4500000, count: 32, color: 'bg-blue-400' },
  { name: 'Proposal', value: 6200000, count: 18, color: 'bg-yellow-400' },
  { name: 'Negotiation', value: 8300000, count: 12, color: 'bg-orange-400' },
  { name: 'Closed Won', value: 3200000, count: 8, color: 'bg-green-500' },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function SalesPage() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  const totalPipeline = pipelineStages.reduce((sum, stage) => sum + stage.value, 0);
  const totalDeals = pipelineStages.reduce((sum, stage) => sum + stage.count, 0);
  const weightedPipeline = mockDeals.reduce((sum, deal) => sum + deal.amount * deal.probability, 0);

  const filteredDeals = selectedStage
    ? mockDeals.filter(deal => deal.stage === selectedStage)
    : mockDeals;

  const getRiskBadge = (risk: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return styles[risk as keyof typeof styles] || styles.low;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Sales Pipeline</h1>
          <p className="text-secondary-500">Manage and track your sales opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-secondary-200 overflow-hidden">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-4 py-2 text-sm font-medium ${viewMode === 'pipeline' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-600 hover:bg-secondary-50'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-600 hover:bg-secondary-50'}`}
            >
              List
            </button>
          </div>
          <button className="btn-primary">
            + New Deal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Total Pipeline</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(totalPipeline)}</p>
          <p className="text-xs text-green-600 mt-1">+15% vs last quarter</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Weighted Pipeline</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(weightedPipeline)}</p>
          <p className="text-xs text-secondary-400 mt-1">Based on probability</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Active Deals</p>
          <p className="text-2xl font-bold text-secondary-900">{totalDeals}</p>
          <p className="text-xs text-blue-600 mt-1">12 closing this month</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Win Rate (QTD)</p>
          <p className="text-2xl font-bold text-secondary-900">32%</p>
          <p className="text-xs text-yellow-600 mt-1">-3% vs target</p>
        </div>
      </div>

      {viewMode === 'pipeline' ? (
        <>
          {/* Pipeline Visualization */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Pipeline by Stage</h2>
            <div className="flex h-12 rounded-lg overflow-hidden mb-4">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.name}
                  className={`${stage.color} cursor-pointer hover:opacity-80 transition-opacity relative group`}
                  style={{ width: `${(stage.value / totalPipeline) * 100}%` }}
                  onClick={() => setSelectedStage(selectedStage === stage.name ? null : stage.name)}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm">
                    {stage.value >= totalPipeline * 0.15 && formatCurrency(stage.value)}
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-secondary-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {stage.name}: {formatCurrency(stage.value)} ({stage.count} deals)
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {pipelineStages.map((stage) => (
                <button
                  key={stage.name}
                  onClick={() => setSelectedStage(selectedStage === stage.name ? null : stage.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
                    selectedStage === stage.name
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${stage.color}`}></span>
                  <span className="text-sm font-medium text-secondary-700">{stage.name}</span>
                  <span className="text-sm text-secondary-400">({stage.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Forecast vs Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quarterly Forecast</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary-600">Q1 Target</span>
                    <span className="font-medium">$12.5M</span>
                  </div>
                  <div className="h-3 bg-secondary-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <p className="text-xs text-secondary-400 mt-1">$10.6M committed (85%)</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary-600">Best Case</span>
                    <span className="font-medium text-green-600">$14.2M</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-secondary-600">Worst Case</span>
                    <span className="font-medium text-red-600">$9.8M</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Top Opportunities</h2>
              <div className="space-y-3">
                {mockDeals
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 4)
                  .map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between py-2 border-b border-secondary-100 last:border-0">
                      <div>
                        <p className="font-medium text-secondary-900">{deal.account}</p>
                        <p className="text-sm text-secondary-500">{deal.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-secondary-900">{formatCurrency(deal.amount)}</p>
                        <p className="text-xs text-secondary-400">{deal.stage}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Deal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Probability</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Close Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-secondary-50 cursor-pointer">
                    <td className="px-4 py-4">
                      <p className="font-medium text-secondary-900">{deal.name}</p>
                    </td>
                    <td className="px-4 py-4 text-secondary-600">{deal.account}</td>
                    <td className="px-4 py-4 font-medium text-secondary-900">{formatCurrency(deal.amount)}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-secondary-600">{Math.round(deal.probability * 100)}%</td>
                    <td className="px-4 py-4 text-secondary-600">{new Date(deal.closeDate).toLocaleDateString()}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(deal.riskLevel)}`}>
                        {deal.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-secondary-600">{deal.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deals at Risk Alert */}
      <div className="card p-4 border-l-4 border-red-500 bg-red-50">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="font-medium text-red-800">3 Deals at High Risk</h3>
            <p className="text-sm text-red-700 mt-1">
              Total value of $1.35M at risk. Review Acme Corp, Global Retail, and TechStart deals for immediate action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
