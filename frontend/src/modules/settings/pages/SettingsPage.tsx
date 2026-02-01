import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
}

interface Notification {
  id: string;
  type: string;
  description: string;
  enabled: boolean;
  channels: ('email' | 'slack' | 'in_app')[];
}

const mockUsers: User[] = [
  { id: '1', name: 'John Smith', email: 'john.smith@company.com', role: 'Administrator', status: 'active', lastLogin: '2024-01-31T10:30:00Z' },
  { id: '2', name: 'Jane Doe', email: 'jane.doe@company.com', role: 'FP&A Manager', status: 'active', lastLogin: '2024-01-31T09:15:00Z' },
  { id: '3', name: 'Mike Wilson', email: 'mike.wilson@company.com', role: 'Sales Manager', status: 'active', lastLogin: '2024-01-30T16:20:00Z' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', role: 'Analyst', status: 'active', lastLogin: '2024-01-30T14:00:00Z' },
  { id: '5', name: 'Bob Williams', email: 'bob.williams@company.com', role: 'Analyst', status: 'inactive', lastLogin: '2024-01-15T11:30:00Z' },
  { id: '6', name: 'Emily Davis', email: 'emily.davis@company.com', role: 'Executive', status: 'pending', lastLogin: '' },
];

const mockNotifications: Notification[] = [
  { id: '1', type: 'Anomaly Alerts', description: 'Get notified when anomalies are detected in financial data', enabled: true, channels: ['email', 'slack', 'in_app'] },
  { id: '2', type: 'Deal Updates', description: 'Notifications for deal stage changes and updates', enabled: true, channels: ['in_app'] },
  { id: '3', type: 'Budget Alerts', description: 'Alerts when spending approaches or exceeds budget thresholds', enabled: true, channels: ['email', 'in_app'] },
  { id: '4', type: 'Approval Requests', description: 'Notifications for pending approvals requiring your action', enabled: true, channels: ['email', 'slack', 'in_app'] },
  { id: '5', type: 'Weekly Summary', description: 'Weekly digest of key financial metrics and insights', enabled: false, channels: ['email'] },
  { id: '6', type: 'AI Insights', description: 'AI-generated insights and recommendations', enabled: true, channels: ['in_app'] },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'notifications' | 'security' | 'billing'>('general');
  const [notifications, setNotifications] = useState(mockNotifications);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-secondary-100 text-secondary-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles];
  };

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n)
    );
  };

  const toggleChannel = (notificationId: string, channel: 'email' | 'slack' | 'in_app') => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === notificationId) {
          const channels = n.channels.includes(channel)
            ? n.channels.filter(c => c !== channel)
            : [...n.channels, channel];
          return { ...n, channels };
        }
        return n;
      })
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
        <p className="text-secondary-500">Manage your account and application settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'General', icon: '⚙️' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'billing', label: 'Billing', icon: '💳' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Organization Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Organization Name</label>
                    <input
                      type="text"
                      defaultValue="Acme Corporation"
                      className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Fiscal Year Start</label>
                      <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option>January</option>
                        <option>April</option>
                        <option>July</option>
                        <option>October</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-1">Default Currency</label>
                      <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option>USD - US Dollar</option>
                        <option>EUR - Euro</option>
                        <option>GBP - British Pound</option>
                        <option>JPY - Japanese Yen</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Timezone</label>
                    <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>America/New_York (EST)</option>
                      <option>America/Los_Angeles (PST)</option>
                      <option>Europe/London (GMT)</option>
                      <option>Asia/Tokyo (JST)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Display Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900">Dark Mode</p>
                      <p className="text-sm text-secondary-500">Use dark theme for the interface</p>
                    </div>
                    <button className="w-12 h-6 bg-secondary-200 rounded-full relative">
                      <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900">Compact View</p>
                      <p className="text-sm text-secondary-500">Show more data in less space</p>
                    </div>
                    <button className="w-12 h-6 bg-primary-500 rounded-full relative">
                      <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Number Format</label>
                    <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>1,234.56 (US)</option>
                      <option>1.234,56 (EU)</option>
                      <option>1 234.56 (Space)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900">User Management</h2>
                  <p className="text-sm text-secondary-500">{mockUsers.length} users in your organization</p>
                </div>
                <button className="btn-primary">+ Invite User</button>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-100">
                    {mockUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-secondary-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary-700">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-secondary-900">{user.name}</p>
                              <p className="text-sm text-secondary-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-secondary-600">{user.role}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-secondary-600">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
                            <button className="text-sm text-red-600 hover:text-red-700">Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-secondary-900">Notification Preferences</h2>
                <p className="text-sm text-secondary-500">Manage how and when you receive notifications</p>
              </div>

              <div className="card divide-y divide-secondary-100">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-secondary-900">{notification.type}</h3>
                          <button
                            onClick={() => toggleNotification(notification.id)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${
                              notification.enabled ? 'bg-primary-500' : 'bg-secondary-200'
                            }`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                              notification.enabled ? 'right-0.5' : 'left-0.5'
                            }`}></span>
                          </button>
                        </div>
                        <p className="text-sm text-secondary-500 mt-1">{notification.description}</p>

                        {notification.enabled && (
                          <div className="flex gap-3 mt-3">
                            {(['email', 'slack', 'in_app'] as const).map((channel) => (
                              <button
                                key={channel}
                                onClick={() => toggleChannel(notification.id, channel)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                  notification.channels.includes(channel)
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-secondary-100 text-secondary-500'
                                }`}
                              >
                                {channel === 'in_app' ? 'In-App' : channel.charAt(0).toUpperCase() + channel.slice(1)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button className="btn-primary">Save Preferences</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Authentication</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">Two-Factor Authentication</p>
                      <p className="text-sm text-secondary-500">Add an extra layer of security to your account</p>
                    </div>
                    <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                      Enabled
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                    <div>
                      <p className="font-medium text-secondary-900">Single Sign-On (SSO)</p>
                      <p className="text-sm text-secondary-500">Configure SAML or OIDC for enterprise login</p>
                    </div>
                    <button className="px-4 py-2 border border-secondary-200 text-secondary-600 rounded-lg text-sm font-medium hover:bg-secondary-100">
                      Configure
                    </button>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Session Management</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Session Timeout</label>
                    <select className="w-full px-4 py-2 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                      <option>8 hours</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-secondary-900">Active Sessions</p>
                      <p className="text-sm text-secondary-500">You have 2 active sessions</p>
                    </div>
                    <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                      Revoke All Sessions
                    </button>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Password Policy</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary-600">Minimum 12 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary-600">Require uppercase and lowercase letters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary-600">Require at least one number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-secondary-600">Require special characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-secondary-900">Current Plan</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                    Enterprise
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-secondary-500">Monthly Cost</p>
                    <p className="text-2xl font-bold text-secondary-900">$2,499</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Users</p>
                    <p className="text-2xl font-bold text-secondary-900">42 / 50</p>
                  </div>
                  <div>
                    <p className="text-sm text-secondary-500">Next Billing</p>
                    <p className="text-2xl font-bold text-secondary-900">Feb 15</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Usage This Month</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-secondary-600">API Calls</span>
                      <span className="font-medium">124,500 / 500,000</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-secondary-600">AI Queries</span>
                      <span className="font-medium">8,234 / 10,000</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-secondary-600">Data Storage</span>
                      <span className="font-medium">45 GB / 100 GB</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Payment Method</h2>
                <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">•••• •••• •••• 4242</p>
                      <p className="text-sm text-secondary-500">Expires 12/2025</p>
                    </div>
                  </div>
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    Update
                  </button>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Billing History</h2>
                <div className="space-y-2">
                  {[
                    { date: 'Jan 15, 2024', amount: '$2,499.00', status: 'Paid' },
                    { date: 'Dec 15, 2023', amount: '$2,499.00', status: 'Paid' },
                    { date: 'Nov 15, 2023', amount: '$2,499.00', status: 'Paid' },
                  ].map((invoice, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-4">
                        <span className="text-secondary-600">{invoice.date}</span>
                        <span className="font-medium text-secondary-900">{invoice.amount}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {invoice.status}
                        </span>
                      </div>
                      <button className="text-sm text-primary-600 hover:text-primary-700">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
