import { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  type: string;
  description: string;
  status: 'connected' | 'error' | 'pending' | 'disconnected';
  lastSync: string | null;
  category: string;
}

interface AvailableIntegration {
  type: string;
  name: string;
  category: string;
  description: string;
  features: string[];
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsed: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

const mockIntegrations: Integration[] = [
  { id: 'int_001', name: 'Salesforce Production', type: 'salesforce', description: 'Main CRM integration', status: 'connected', lastSync: '2024-01-31T10:30:00Z', category: 'crm' },
  { id: 'int_002', name: 'NetSuite Finance', type: 'netsuite', description: 'ERP for financial data', status: 'connected', lastSync: '2024-01-31T08:00:00Z', category: 'erp' },
  { id: 'int_003', name: 'Slack Notifications', type: 'slack', description: 'Alert notifications', status: 'connected', lastSync: null, category: 'collaboration' },
  { id: 'int_004', name: 'HubSpot Marketing', type: 'hubspot', description: 'Marketing data integration', status: 'error', lastSync: '2024-01-28T14:30:00Z', category: 'crm' },
];

const availableIntegrations: AvailableIntegration[] = [
  { type: 'salesforce', name: 'Salesforce', category: 'CRM', description: 'Connect to Salesforce for sales pipeline data', features: ['Real-time sync', 'Bidirectional', 'Custom objects'] },
  { type: 'hubspot', name: 'HubSpot', category: 'CRM', description: 'Marketing and sales data integration', features: ['Contact sync', 'Deal tracking', 'Analytics'] },
  { type: 'netsuite', name: 'NetSuite', category: 'ERP', description: 'Financial and operational data', features: ['Financial data', 'Inventory', 'Custom scripts'] },
  { type: 'sap', name: 'SAP', category: 'ERP', description: 'Enterprise resource planning', features: ['Financial posting', 'Cost centers', 'Materials'] },
  { type: 'workday', name: 'Workday', category: 'HCM', description: 'Human capital management', features: ['Employee data', 'Compensation', 'Headcount'] },
  { type: 'slack', name: 'Slack', category: 'Collaboration', description: 'Notifications and alerts', features: ['Alerts', 'Approvals', 'AI assistant'] },
  { type: 'teams', name: 'Microsoft Teams', category: 'Collaboration', description: 'Team notifications', features: ['Notifications', 'Cards', 'Bot'] },
  { type: 'jira', name: 'Jira', category: 'Project Management', description: 'Project and task tracking', features: ['Issues', 'Sprints', 'Velocity'] },
];

const mockApiKeys: ApiKey[] = [
  { id: 'key_001', name: 'Dashboard API Key', prefix: 'ak_live_abc', permissions: ['read:dashboard', 'read:kpis'], lastUsed: '2024-01-31T10:30:00Z', expiresAt: null, isActive: true },
  { id: 'key_002', name: 'Mobile App Key', prefix: 'ak_live_def', permissions: ['read:dashboard', 'read:notifications'], lastUsed: '2024-01-30T14:00:00Z', expiresAt: '2024-04-30T00:00:00Z', isActive: true },
  { id: 'key_003', name: 'Deprecated Key', prefix: 'ak_live_xyz', permissions: ['read:all'], lastUsed: '2024-01-15T08:00:00Z', expiresAt: null, isActive: false },
];

const getIntegrationIcon = (type: string) => {
  const icons: Record<string, string> = {
    salesforce: '☁️',
    hubspot: '🔶',
    netsuite: '📊',
    sap: '💼',
    workday: '👥',
    slack: '💬',
    teams: '💻',
    jira: '📋',
  };
  return icons[type] || '🔗';
};

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'connected' | 'available' | 'webhooks' | 'api-keys'>('connected');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);

  const getStatusBadge = (status: string) => {
    const styles = {
      connected: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      disconnected: 'bg-secondary-100 text-secondary-800',
    };
    return styles[status as keyof typeof styles];
  };

  const categories = ['all', ...new Set(availableIntegrations.map(i => i.category))];
  const filteredAvailable = selectedCategory === 'all'
    ? availableIntegrations
    : availableIntegrations.filter(i => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Integrations</h1>
          <p className="text-secondary-500">Connect your tools and manage API access</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {[
            { id: 'connected', label: 'Connected' },
            { id: 'available', label: 'Available' },
            { id: 'webhooks', label: 'Webhooks' },
            { id: 'api-keys', label: 'API Keys' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab.label}
              {tab.id === 'connected' && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-secondary-100">
                  {mockIntegrations.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'connected' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockIntegrations.map((integration) => (
            <div key={integration.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
                  <div>
                    <h3 className="font-medium text-secondary-900">{integration.name}</h3>
                    <p className="text-sm text-secondary-500">{integration.description}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(integration.status)}`}>
                  {integration.status}
                </span>
              </div>

              <div className="text-sm text-secondary-600 mb-4">
                {integration.lastSync ? (
                  <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                ) : (
                  <span>No sync data</span>
                )}
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 border border-secondary-200 text-secondary-600 rounded-lg text-sm hover:bg-secondary-50">
                  Configure
                </button>
                <button className="flex-1 px-3 py-2 border border-secondary-200 text-secondary-600 rounded-lg text-sm hover:bg-secondary-50">
                  Test Connection
                </button>
                {integration.status === 'error' && (
                  <button className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'available' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                }`}
              >
                {category === 'all' ? 'All' : category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAvailable.map((integration) => {
              const isConnected = mockIntegrations.some(i => i.type === integration.type);
              return (
                <div key={integration.type} className="card p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
                    <div>
                      <h3 className="font-medium text-secondary-900">{integration.name}</h3>
                      <p className="text-xs text-secondary-500">{integration.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-600 mb-3">{integration.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {integration.features.map((feature) => (
                      <span key={feature} className="px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded text-xs">
                        {feature}
                      </span>
                    ))}
                  </div>
                  <button
                    className={`w-full py-2 rounded-lg text-sm font-medium ${
                      isConnected
                        ? 'bg-secondary-100 text-secondary-500 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                    disabled={isConnected}
                  >
                    {isConnected ? 'Already Connected' : 'Connect'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button className="btn-primary">+ Create Webhook</button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Webhook</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Integration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Events</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {[
                  { id: 'wh_001', name: 'Opportunity Updates', integration: 'Salesforce', events: ['created', 'updated', 'closed'], status: 'active' },
                  { id: 'wh_002', name: 'Invoice Events', integration: 'NetSuite', events: ['created', 'paid', 'overdue'], status: 'active' },
                  { id: 'wh_003', name: 'Alert Notifications', integration: 'Slack', events: ['anomaly', 'threshold', 'approval'], status: 'active' },
                ].map((webhook) => (
                  <tr key={webhook.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-4 font-medium text-secondary-900">{webhook.name}</td>
                    <td className="px-4 py-4 text-secondary-600">{webhook.integration}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <span key={event} className="px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded text-xs">
                            {event}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {webhook.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
                        <button className="text-sm text-primary-600 hover:text-primary-700">Logs</button>
                        <button className="text-sm text-red-600 hover:text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'api-keys' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-secondary-600">
              API keys allow external applications to access your data programmatically.
            </p>
            <button onClick={() => setShowNewKeyModal(true)} className="btn-primary">
              + Create API Key
            </button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Key</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Permissions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Last Used</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {mockApiKeys.map((key) => (
                  <tr key={key.id} className={`hover:bg-secondary-50 ${!key.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-4 font-medium text-secondary-900">{key.name}</td>
                    <td className="px-4 py-4">
                      <code className="px-2 py-1 bg-secondary-100 rounded text-sm">{key.prefix}•••</code>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.slice(0, 2).map((perm) => (
                          <span key={perm} className="px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded text-xs">
                            {perm}
                          </span>
                        ))}
                        {key.permissions.length > 2 && (
                          <span className="px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded text-xs">
                            +{key.permissions.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-secondary-600">
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-4 text-secondary-600">
                      {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        key.isActive ? 'bg-green-100 text-green-800' : 'bg-secondary-100 text-secondary-600'
                      }`}>
                        {key.isActive ? 'Active' : 'Revoked'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {key.isActive && (
                        <button className="text-sm text-red-600 hover:text-red-700">Revoke</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-yellow-800">API Key Security</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Keep your API keys secure. Never share them publicly or commit them to version control.
                  Use environment variables to store keys in your applications.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New API Key Modal (simplified) */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Create API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g., Production API Key"
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                <textarea
                  placeholder="What will this key be used for?"
                  className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Permissions</label>
                <div className="space-y-2">
                  {['read:dashboard', 'read:kpis', 'read:deals', 'write:deals', 'read:all'].map((perm) => (
                    <label key={perm} className="flex items-center gap-2">
                      <input type="checkbox" className="rounded text-primary-600" />
                      <span className="text-sm text-secondary-600">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="px-4 py-2 text-secondary-600 hover:text-secondary-700"
              >
                Cancel
              </button>
              <button className="btn-primary">
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
