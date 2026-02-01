import { useState } from 'react';

interface AuditLog {
  id: string;
  timestamp: string;
  actorType: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceName: string;
  changes?: Record<string, any>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
  isSystem: boolean;
}

interface ApprovalRequest {
  id: string;
  resourceType: string;
  resourceName: string;
  requester: string;
  status: 'pending' | 'approved' | 'rejected';
  currentStep: number;
  totalSteps: number;
  createdAt: string;
}

const mockAuditLogs: AuditLog[] = [
  { id: '1', timestamp: '2024-01-31T10:30:00Z', actorType: 'user', actorName: 'John Smith', action: 'create', resourceType: 'scenario', resourceName: 'FY2024 Base Budget' },
  { id: '2', timestamp: '2024-01-31T09:15:00Z', actorType: 'user', actorName: 'Jane Doe', action: 'approve', resourceType: 'scenario', resourceName: 'FY2024 Base Budget', changes: { status: { from: 'active', to: 'approved' } } },
  { id: '3', timestamp: '2024-01-31T08:45:00Z', actorType: 'user', actorName: 'John Smith', action: 'update', resourceType: 'deal', resourceName: 'Acme Corp Enterprise Deal', changes: { amount: { from: 450000, to: 500000 } } },
  { id: '4', timestamp: '2024-01-30T16:20:00Z', actorType: 'ai', actorName: 'Aether AI', action: 'read', resourceType: 'report', resourceName: 'Monthly Financial Summary' },
  { id: '5', timestamp: '2024-01-30T14:00:00Z', actorType: 'system', actorName: 'System', action: 'export', resourceType: 'report', resourceName: 'Q1 Sales Analysis' },
  { id: '6', timestamp: '2024-01-30T11:30:00Z', actorType: 'user', actorName: 'Sarah Johnson', action: 'login', resourceType: 'auth', resourceName: 'Session started' },
  { id: '7', timestamp: '2024-01-29T15:45:00Z', actorType: 'user', actorName: 'Mike Wilson', action: 'delete', resourceType: 'scenario', resourceName: 'Draft Scenario v2' },
];

const mockRoles: Role[] = [
  { id: 'role_001', name: 'Administrator', description: 'Full system access', userCount: 2, permissionCount: 25, isSystem: true },
  { id: 'role_002', name: 'FP&A Manager', description: 'Financial planning and analysis manager', userCount: 5, permissionCount: 18, isSystem: true },
  { id: 'role_003', name: 'Sales Manager', description: 'Sales team manager', userCount: 8, permissionCount: 12, isSystem: true },
  { id: 'role_004', name: 'Analyst', description: 'Read-only access to analytics', userCount: 15, permissionCount: 8, isSystem: false },
  { id: 'role_005', name: 'Executive', description: 'Executive dashboard access', userCount: 4, permissionCount: 10, isSystem: false },
];

const mockApprovals: ApprovalRequest[] = [
  { id: 'req_001', resourceType: 'scenario', resourceName: 'Q2 Aggressive Growth Plan', requester: 'Sarah Johnson', status: 'pending', currentStep: 2, totalSteps: 3, createdAt: '2024-01-31T08:00:00Z' },
  { id: 'req_002', resourceType: 'budget', resourceName: 'Marketing Q2 Budget', requester: 'Mike Wilson', status: 'pending', currentStep: 1, totalSteps: 2, createdAt: '2024-01-30T14:30:00Z' },
  { id: 'req_003', resourceType: 'deal', resourceName: 'Enterprise Contract - TechCorp', requester: 'John Smith', status: 'approved', currentStep: 2, totalSteps: 2, createdAt: '2024-01-29T10:00:00Z' },
];

const complianceSummary = {
  overallScore: 87,
  controlsTested: 45,
  controlsPassed: 39,
  controlsFailed: 4,
  needsAttention: 2,
};

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<'audit' | 'roles' | 'approvals' | 'compliance'>('audit');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = actionFilter === 'all'
    ? mockAuditLogs
    : mockAuditLogs.filter(log => log.action === actionFilter);

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      read: 'bg-blue-100 text-blue-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      approve: 'bg-purple-100 text-purple-800',
      login: 'bg-secondary-100 text-secondary-800',
      export: 'bg-orange-100 text-orange-800',
    };
    return styles[action] || styles.read;
  };

  const getActorIcon = (type: string) => {
    switch (type) {
      case 'user':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'ai':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Governance & Compliance</h1>
          <p className="text-secondary-500">Manage access, audit trails, and compliance</p>
        </div>
        <button className="btn-primary">
          Generate Report
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Compliance Score</p>
          <p className="text-2xl font-bold text-secondary-900">{complianceSummary.overallScore}%</p>
          <p className="text-xs text-green-600 mt-1">+3% from last audit</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Active Users</p>
          <p className="text-2xl font-bold text-secondary-900">42</p>
          <p className="text-xs text-secondary-400 mt-1">3 inactive (90+ days)</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Pending Approvals</p>
          <p className="text-2xl font-bold text-secondary-900">{mockApprovals.filter(a => a.status === 'pending').length}</p>
          <p className="text-xs text-yellow-600 mt-1">2 require attention</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Audit Events (24h)</p>
          <p className="text-2xl font-bold text-secondary-900">156</p>
          <p className="text-xs text-secondary-400 mt-1">Normal activity</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {(['audit', 'roles', 'approvals', 'compliance'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab === 'audit' ? 'Audit Log' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'audit' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-secondary-900">Audit Trail</h2>
            <div className="flex items-center gap-3">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 border border-secondary-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="approve">Approve</option>
                <option value="export">Export</option>
              </select>
              <button className="text-sm text-primary-600 hover:text-primary-700">Export CSV</button>
            </div>
          </div>
          <div className="divide-y divide-secondary-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-secondary-50">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActorIcon(log.actorType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-secondary-900">{log.actorName}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-secondary-600">{log.resourceType}</span>
                      <span className="text-secondary-900 font-medium">"{log.resourceName}"</span>
                    </div>
                    {log.changes && (
                      <div className="mt-1 text-sm text-secondary-500">
                        Changes: {Object.entries(log.changes).map(([key, value]: [string, any]) => (
                          <span key={key} className="mr-2">
                            {key}: {value.from} → {value.to}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-secondary-400 mt-1">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button className="btn-primary">+ Create Role</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockRoles.map((role) => (
              <div key={role.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-secondary-900">{role.name}</h3>
                    <p className="text-sm text-secondary-500">{role.description}</p>
                  </div>
                  {role.isSystem && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-600">
                      System
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-secondary-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{role.userCount} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>{role.permissionCount} permissions</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-secondary-200">
                  <button className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
                  <button className="text-sm text-primary-600 hover:text-primary-700">View Permissions</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">Approval Requests</h2>
          </div>
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Requester</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {mockApprovals.map((request) => (
                <tr key={request.id} className="hover:bg-secondary-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-secondary-900">{request.resourceName}</p>
                    <p className="text-sm text-secondary-500">{request.resourceType}</p>
                  </td>
                  <td className="px-4 py-4 text-secondary-600">{request.requester}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-secondary-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${(request.currentStep / request.totalSteps) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-secondary-600">
                        {request.currentStep}/{request.totalSteps}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-secondary-600">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    {request.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button className="text-sm text-green-600 hover:text-green-700 font-medium">Approve</button>
                        <button className="text-sm text-red-600 hover:text-red-700 font-medium">Reject</button>
                      </div>
                    ) : (
                      <button className="text-sm text-primary-600 hover:text-primary-700">View Details</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* Compliance Summary */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Compliance Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="80" stroke="#e2e8f0" strokeWidth="16" fill="none" />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke={complianceSummary.overallScore >= 80 ? '#22c55e' : complianceSummary.overallScore >= 60 ? '#eab308' : '#ef4444'}
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${(complianceSummary.overallScore / 100) * 502} 502`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-secondary-900">{complianceSummary.overallScore}%</span>
                    <span className="text-sm text-secondary-500">Compliance Score</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-green-800">Controls Passed</span>
                  <span className="font-bold text-green-800">{complianceSummary.controlsPassed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-red-800">Controls Failed</span>
                  <span className="font-bold text-red-800">{complianceSummary.controlsFailed}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-800">Needs Attention</span>
                  <span className="font-bold text-yellow-800">{complianceSummary.needsAttention}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary-50 rounded-lg">
                  <span className="text-secondary-800">Total Controls Tested</span>
                  <span className="font-bold text-secondary-800">{complianceSummary.controlsTested}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Areas */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Compliance by Area</h2>
            <div className="space-y-4">
              {[
                { name: 'Access Controls', score: 92, status: 'compliant' },
                { name: 'Data Privacy (GDPR)', score: 88, status: 'compliant' },
                { name: 'Audit Trail', score: 95, status: 'compliant' },
                { name: 'Segregation of Duties', score: 75, status: 'attention' },
                { name: 'Change Management', score: 82, status: 'compliant' },
              ].map((area) => (
                <div key={area.name} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-secondary-900">{area.name}</span>
                      <span className={`text-sm font-medium ${area.score >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {area.score}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${area.score >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{ width: `${area.score}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    area.status === 'compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {area.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
