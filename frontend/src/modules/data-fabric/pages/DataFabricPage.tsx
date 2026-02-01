import { useState } from 'react';

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'error' | 'syncing' | 'pending';
  lastSync: string | null;
  recordCount: number;
  entities: string[];
}

interface SyncJob {
  id: string;
  sourceName: string;
  type: 'full' | 'incremental';
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  recordsProcessed: number;
  recordsFailed: number;
}

interface DataQuality {
  entity: string;
  score: number;
  issues: number;
  lastChecked: string;
}

const mockDataSources: DataSource[] = [
  { id: 'ds_001', name: 'Salesforce CRM', type: 'salesforce', status: 'connected', lastSync: '2024-01-31T10:30:00Z', recordCount: 125000, entities: ['Opportunity', 'Account', 'Contact', 'Lead'] },
  { id: 'ds_002', name: 'NetSuite ERP', type: 'netsuite', status: 'connected', lastSync: '2024-01-31T08:00:00Z', recordCount: 450000, entities: ['Invoice', 'Customer', 'Vendor', 'Transaction'] },
  { id: 'ds_003', name: 'Workday HCM', type: 'workday', status: 'connected', lastSync: '2024-01-30T02:00:00Z', recordCount: 5000, entities: ['Worker', 'Organization', 'Position'] },
  { id: 'ds_004', name: 'Snowflake DW', type: 'snowflake', status: 'syncing', lastSync: '2024-01-31T09:45:00Z', recordCount: 10000000, entities: ['SALES_FACT', 'CUSTOMER_DIM', 'PRODUCT_DIM'] },
  { id: 'ds_005', name: 'HubSpot Marketing', type: 'hubspot', status: 'error', lastSync: '2024-01-28T14:30:00Z', recordCount: 85000, entities: ['Contact', 'Deal', 'Campaign'] },
];

const mockSyncJobs: SyncJob[] = [
  { id: 'sync_001', sourceName: 'Salesforce CRM', type: 'incremental', status: 'completed', startedAt: '2024-01-31T10:30:00Z', recordsProcessed: 1250, recordsFailed: 3 },
  { id: 'sync_002', sourceName: 'Snowflake DW', type: 'full', status: 'running', startedAt: '2024-01-31T09:45:00Z', recordsProcessed: 2500000, recordsFailed: 0 },
  { id: 'sync_003', sourceName: 'NetSuite ERP', type: 'full', status: 'completed', startedAt: '2024-01-31T02:00:00Z', recordsProcessed: 45000, recordsFailed: 12 },
  { id: 'sync_004', sourceName: 'HubSpot Marketing', type: 'incremental', status: 'failed', startedAt: '2024-01-28T14:30:00Z', recordsProcessed: 0, recordsFailed: 0 },
];

const mockDataQuality: DataQuality[] = [
  { entity: 'Deal', score: 94, issues: 23, lastChecked: '2024-01-31T06:00:00Z' },
  { entity: 'Customer', score: 88, issues: 156, lastChecked: '2024-01-31T06:00:00Z' },
  { entity: 'Revenue', score: 97, issues: 8, lastChecked: '2024-01-31T06:00:00Z' },
  { entity: 'Cost', score: 91, issues: 45, lastChecked: '2024-01-31T06:00:00Z' },
  { entity: 'Employee', score: 99, issues: 2, lastChecked: '2024-01-31T06:00:00Z' },
];

const getSourceIcon = (type: string) => {
  const icons: Record<string, string> = {
    salesforce: '☁️',
    netsuite: '📊',
    workday: '👥',
    snowflake: '❄️',
    hubspot: '🔶',
  };
  return icons[type] || '📁';
};

export default function DataFabricPage() {
  const [activeTab, setActiveTab] = useState<'sources' | 'sync' | 'quality' | 'catalog'>('sources');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const styles = {
      connected: 'bg-green-100 text-green-800',
      syncing: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Data Fabric</h1>
          <p className="text-secondary-500">Connect, transform, and manage your data sources</p>
        </div>
        <button className="btn-primary">+ Add Data Source</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Connected Sources</p>
          <p className="text-2xl font-bold text-secondary-900">{mockDataSources.filter(s => s.status === 'connected').length}</p>
          <p className="text-xs text-green-600 mt-1">All systems operational</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Total Records</p>
          <p className="text-2xl font-bold text-secondary-900">{formatNumber(mockDataSources.reduce((sum, s) => sum + s.recordCount, 0))}</p>
          <p className="text-xs text-secondary-400 mt-1">Across all sources</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Data Quality Score</p>
          <p className="text-2xl font-bold text-secondary-900">93%</p>
          <p className="text-xs text-green-600 mt-1">+2% from last week</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Active Syncs</p>
          <p className="text-2xl font-bold text-secondary-900">{mockSyncJobs.filter(j => j.status === 'running').length}</p>
          <p className="text-xs text-blue-600 mt-1">In progress</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {(['sources', 'sync', 'quality', 'catalog'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab === 'sources' ? 'Data Sources' :
               tab === 'sync' ? 'Sync History' :
               tab === 'quality' ? 'Data Quality' : 'Data Catalog'}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockDataSources.map((source) => (
            <div
              key={source.id}
              className={`card p-4 cursor-pointer transition-all ${
                selectedSource === source.id ? 'ring-2 ring-primary-500' : 'hover:border-secondary-300'
              }`}
              onClick={() => setSelectedSource(selectedSource === source.id ? null : source.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSourceIcon(source.type)}</span>
                  <div>
                    <h3 className="font-medium text-secondary-900">{source.name}</h3>
                    <p className="text-sm text-secondary-500">{source.type}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(source.status)}`}>
                  {source.status === 'syncing' && (
                    <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {source.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-secondary-500">Last Sync</p>
                  <p className="font-medium text-secondary-900">
                    {source.lastSync ? new Date(source.lastSync).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-secondary-500">Records</p>
                  <p className="font-medium text-secondary-900">{formatNumber(source.recordCount)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-secondary-200">
                <p className="text-sm text-secondary-500 mb-2">Entities</p>
                <div className="flex flex-wrap gap-1">
                  {source.entities.map((entity) => (
                    <span key={entity} className="px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded text-xs">
                      {entity}
                    </span>
                  ))}
                </div>
              </div>

              {selectedSource === source.id && (
                <div className="mt-4 pt-4 border-t border-secondary-200 flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                    Sync Now
                  </button>
                  <button className="flex-1 px-3 py-2 border border-secondary-200 text-secondary-600 rounded-lg text-sm hover:bg-secondary-50">
                    Configure
                  </button>
                  <button className="px-3 py-2 border border-secondary-200 text-secondary-600 rounded-lg text-sm hover:bg-secondary-50">
                    Test
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sync' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Sync History</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700">View All</button>
          </div>
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Started</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Records</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {mockSyncJobs.map((job) => (
                <tr key={job.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-4 font-medium text-secondary-900">{job.sourceName}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      job.type === 'full' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {job.type}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                      {job.status === 'running' && (
                        <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-secondary-600">{new Date(job.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-4 text-secondary-900">{formatNumber(job.recordsProcessed)}</td>
                  <td className="px-4 py-4">
                    {job.recordsFailed > 0 ? (
                      <span className="text-red-600">{job.recordsFailed}</span>
                    ) : (
                      <span className="text-secondary-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Data Quality by Entity</h2>
            <div className="space-y-4">
              {mockDataQuality.map((item) => (
                <div key={item.entity} className="flex items-center gap-4">
                  <div className="w-24 text-secondary-900 font-medium">{item.entity}</div>
                  <div className="flex-1">
                    <div className="h-4 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.score >= 95 ? 'bg-green-500' :
                          item.score >= 85 ? 'bg-blue-500' :
                          item.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-16 text-right font-medium text-secondary-900">{item.score}%</div>
                  <div className="w-24 text-right">
                    {item.issues > 0 ? (
                      <span className="text-yellow-600">{item.issues} issues</span>
                    ) : (
                      <span className="text-green-600">No issues</span>
                    )}
                  </div>
                  <button className="text-sm text-primary-600 hover:text-primary-700">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Quality Rules</h2>
              <div className="space-y-3">
                {[
                  { rule: 'Completeness', description: 'Required fields are populated', status: 'passing' },
                  { rule: 'Uniqueness', description: 'No duplicate records on key fields', status: 'passing' },
                  { rule: 'Validity', description: 'Data formats are correct', status: 'warning' },
                  { rule: 'Consistency', description: 'Cross-reference integrity maintained', status: 'passing' },
                  { rule: 'Timeliness', description: 'Data is current (<24h old)', status: 'passing' },
                ].map((rule) => (
                  <div key={rule.rule} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">{rule.rule}</p>
                      <p className="text-sm text-secondary-500">{rule.description}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      rule.status === 'passing' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rule.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-4">Recent Issues</h2>
              <div className="space-y-3">
                {[
                  { entity: 'Customer', issue: 'Missing email addresses', count: 45, severity: 'medium' },
                  { entity: 'Deal', issue: 'Invalid close dates', count: 12, severity: 'high' },
                  { entity: 'Revenue', issue: 'Currency mismatch', count: 8, severity: 'low' },
                ].map((issue, i) => (
                  <div key={i} className="flex items-start justify-between p-3 border border-secondary-200 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">{issue.issue}</p>
                      <p className="text-sm text-secondary-500">{issue.entity} • {issue.count} records</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      issue.severity === 'high' ? 'bg-red-100 text-red-800' :
                      issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-sm text-primary-600 hover:text-primary-700">
                View All Issues
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">Unified Data Model</h2>
          <div className="space-y-4">
            {[
              { name: 'Deal', source: 'Salesforce CRM', records: 15000, fields: 24, description: 'Sales opportunities and deals' },
              { name: 'Customer', source: 'NetSuite ERP', records: 8500, fields: 32, description: 'Customer and account information' },
              { name: 'Revenue', source: 'NetSuite ERP', records: 125000, fields: 18, description: 'Revenue transactions' },
              { name: 'Cost', source: 'NetSuite ERP', records: 85000, fields: 22, description: 'Cost and expense data' },
              { name: 'Employee', source: 'Workday HCM', records: 1200, fields: 45, description: 'Employee master data' },
            ].map((entity) => (
              <div key={entity.name} className="p-4 border border-secondary-200 rounded-lg hover:border-primary-300 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-secondary-900">{entity.name}</h3>
                  <span className="text-sm text-secondary-500">Source: {entity.source}</span>
                </div>
                <p className="text-sm text-secondary-500 mb-3">{entity.description}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-secondary-600">{formatNumber(entity.records)} records</span>
                  <span className="text-secondary-600">{entity.fields} fields</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
