import { useState, useRef } from 'react';

interface ImportTemplate {
  id: string;
  name: string;
  description: string;
  fileType: string;
  lastImport: string | null;
  recordCount: number | null;
}

interface ImportHistory {
  id: string;
  templateName: string;
  fileName: string;
  status: 'completed' | 'failed' | 'processing';
  recordsImported: number;
  errors: number;
  importedAt: string;
  importedBy: string;
}

const importTemplates: ImportTemplate[] = [
  { id: 'financial_metrics', name: 'Financial Metrics', description: 'Revenue, expenses, EBITDA, margins, and cash flow metrics by region/segment', fileType: 'CSV', lastImport: '2025-01-28T14:30:00Z', recordCount: 156 },
  { id: 'profitability', name: 'Profitability Data', description: 'Account-level profitability with region, segment, vertical, costs and margins', fileType: 'CSV', lastImport: '2025-01-28T14:30:00Z', recordCount: 250 },
  { id: 'sales_performance', name: 'Sales Performance', description: 'Sales pipeline, forecasts, opportunities by channel and region', fileType: 'CSV', lastImport: '2025-01-30T11:00:00Z', recordCount: 87 },
  { id: 'revenue_analytics', name: 'Revenue Analytics', description: 'ARR data, bookings, churn, expansion by segment and region', fileType: 'CSV', lastImport: '2025-01-25T09:15:00Z', recordCount: 423 },
  { id: 'cost_data', name: 'Cost Data', description: 'Cost line items with categories, vendors, and cost centers', fileType: 'CSV', lastImport: '2025-01-25T09:15:00Z', recordCount: 423 },
  { id: 'vendors', name: 'Vendors', description: 'Vendor master data with contacts, contracts, and spend info', fileType: 'CSV', lastImport: null, recordCount: null },
  { id: 'cost_centers', name: 'Cost Centers', description: 'Hierarchical cost center structure with budgets', fileType: 'CSV', lastImport: '2025-01-20T16:45:00Z', recordCount: 34 },
];

// CSV Template definitions with proper data structures for all reports
const templateCSVData: Record<string, { headers: string[]; sampleRows: string[][] }> = {
  'financial_metrics': {
    headers: ['Date', 'Region', 'Segment', 'Vertical', 'Revenue', 'Expenses', 'EBITDA', 'Gross_Margin_Pct', 'Net_Margin_Pct', 'Cash_Flow'],
    sampleRows: [
      ['2025-01-01', 'North America', 'Enterprise', 'CPG', '1500000', '1200000', '300000', '0.72', '0.20', '250000'],
      ['2025-01-01', 'Europe', 'Mid-Market', 'TMT', '850000', '680000', '170000', '0.68', '0.18', '140000'],
      ['2025-02-01', 'Asia Pacific', 'Enterprise', 'LS', '1200000', '950000', '250000', '0.70', '0.19', '200000'],
    ]
  },
  'profitability': {
    headers: ['Account_ID', 'Account_Name', 'Region', 'Segment', 'Vertical', 'Revenue', 'Cloud_Infra_Cost', 'Resource_Cost', 'TSO_Cost', 'Engineering_Cost', 'Gross_Margin_Value', 'Gross_Margin_Pct', 'Contribution_Margin_Pct', 'Health_Score', 'Renewal_Date', 'Report_Type'],
    sampleRows: [
      ['ACC-1001', 'Acme Corp', 'North America', 'Enterprise', 'CPG', '1500000', '225000', '150000', '0', '0', '1125000', '0.75', '0.60', '85', '2025-06-15', 'License'],
      ['ACC-1002', 'Global Solutions', 'Europe', 'Mid-Market', 'TMT', '850000', '0', '0', '340000', '170000', '340000', '0.40', '0.25', '72', '2025-09-20', 'Implementation'],
      ['ACC-1003', 'Tech Industries', 'Asia Pacific', 'Enterprise', 'AIM', '2200000', '330000', '220000', '0', '0', '1650000', '0.75', '0.58', '91', '2025-03-10', 'License'],
    ]
  },
  'sales_performance': {
    headers: ['Opportunity_ID', 'Account_Name', 'Region', 'LOB', 'Vertical', 'Channel', 'Stage', 'Probability_Pct', 'Deal_Value', 'Weighted_Value', 'Expected_Close_Date', 'Days_In_Stage', 'Owner', 'Status', 'Loss_Reason'],
    sampleRows: [
      ['OPP-001', 'Acme Corp', 'North America', 'Software', 'CPG', 'Direct', 'Qualified', '40', '500000', '200000', '2025-03-15', '12', 'John Smith', 'Active', ''],
      ['OPP-002', 'Global Tech', 'Europe', 'Services', 'TMT', 'Partner', 'Proposal', '60', '750000', '450000', '2025-02-28', '25', 'Jane Doe', 'Active', ''],
      ['OPP-003', 'Beta Industries', 'Asia Pacific', 'Software', 'LS', 'Direct', 'Closed Lost', '0', '320000', '0', '2025-01-20', '45', 'Mike Wilson', 'Lost', 'Budget Constraints'],
    ]
  },
  'revenue_analytics': {
    headers: ['Date', 'Region', 'Segment', 'Product_Line', 'Beginning_ARR', 'New_Bookings', 'Expansion', 'Contraction', 'Churn', 'Ending_ARR', 'Net_New_ARR', 'NRR_Pct', 'GRR_Pct'],
    sampleRows: [
      ['2025-01-01', 'North America', 'Enterprise', 'Platform', '45000000', '3500000', '2200000', '800000', '1200000', '48700000', '3700000', '0.103', '0.097'],
      ['2025-01-01', 'Europe', 'Mid-Market', 'Analytics', '28000000', '2100000', '1400000', '500000', '700000', '30300000', '2300000', '0.107', '0.096'],
      ['2025-01-01', 'Asia Pacific', 'Enterprise', 'Platform', '32000000', '2800000', '1800000', '600000', '900000', '35100000', '3100000', '0.109', '0.095'],
    ]
  },
  'cost_data': {
    headers: ['Date', 'Cost_Center_ID', 'Cost_Center_Name', 'Category', 'Sub_Category', 'Vendor', 'Amount', 'Budget', 'Variance', 'Region', 'Department'],
    sampleRows: [
      ['2025-01-15', 'CC-001', 'Engineering', 'Personnel', 'Salaries', 'Internal', '450000', '500000', '-50000', 'North America', 'R&D'],
      ['2025-01-15', 'CC-002', 'Infrastructure', 'Cloud', 'AWS', 'Amazon', '125000', '120000', '5000', 'Global', 'IT'],
      ['2025-01-15', 'CC-003', 'Marketing', 'Advertising', 'Digital', 'Google Ads', '85000', '90000', '-5000', 'North America', 'Marketing'],
    ]
  },
  'vendors': {
    headers: ['Vendor_ID', 'Vendor_Name', 'Category', 'Contact_Name', 'Contact_Email', 'Contract_Start', 'Contract_End', 'Annual_Spend', 'Payment_Terms', 'Status', 'Risk_Rating'],
    sampleRows: [
      ['VND-001', 'Amazon Web Services', 'Cloud Infrastructure', 'John AWS', 'support@aws.com', '2024-01-01', '2026-12-31', '1500000', 'Net 30', 'Active', 'Low'],
      ['VND-002', 'Salesforce', 'CRM', 'Jane SF', 'support@salesforce.com', '2024-06-01', '2025-05-31', '250000', 'Annual', 'Active', 'Low'],
      ['VND-003', 'Consulting Partners Inc', 'Professional Services', 'Mike Consult', 'mike@consultpartners.com', '2024-03-01', '2025-02-28', '500000', 'Net 45', 'Active', 'Medium'],
    ]
  },
  'cost_centers': {
    headers: ['Cost_Center_ID', 'Name', 'Parent_ID', 'Level', 'Manager', 'Annual_Budget', 'YTD_Actual', 'YTD_Variance', 'Department', 'Region', 'Status'],
    sampleRows: [
      ['CC-001', 'Engineering', '', '1', 'Sarah Johnson', '5000000', '4200000', '800000', 'R&D', 'Global', 'Active'],
      ['CC-001-A', 'Frontend Development', 'CC-001', '2', 'Tom Frontend', '1500000', '1350000', '150000', 'R&D', 'North America', 'Active'],
      ['CC-001-B', 'Backend Development', 'CC-001', '2', 'Lisa Backend', '2000000', '1800000', '200000', 'R&D', 'Global', 'Active'],
    ]
  }
};

const importHistory: ImportHistory[] = [
  { id: '1', templateName: 'Sales Performance', fileName: 'sales_q1_2025.csv', status: 'completed', recordsImported: 87, errors: 0, importedAt: '2025-01-30T11:00:00Z', importedBy: 'John Smith' },
  { id: '2', templateName: 'Profitability Data', fileName: 'profitability_jan_2025.csv', status: 'completed', recordsImported: 250, errors: 2, importedAt: '2025-01-28T14:30:00Z', importedBy: 'Jane Doe' },
  { id: '3', templateName: 'Revenue Analytics', fileName: 'revenue_2024_final.csv', status: 'completed', recordsImported: 423, errors: 5, importedAt: '2025-01-25T09:15:00Z', importedBy: 'John Smith' },
  { id: '4', templateName: 'Cost Centers', fileName: 'cost_centers_v2.csv', status: 'failed', recordsImported: 0, errors: 12, importedAt: '2025-01-22T10:30:00Z', importedBy: 'Mike Wilson' },
  { id: '5', templateName: 'Cost Centers', fileName: 'cost_centers_fixed.csv', status: 'completed', recordsImported: 34, errors: 0, importedAt: '2025-01-20T16:45:00Z', importedBy: 'Mike Wilson' },
];

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
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'notifications' | 'security' | 'billing' | 'data-import'>('general');
  const [notifications, setNotifications] = useState(mockNotifications);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'validating' | 'importing' | 'complete' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      setImportStatus('idle');
    }
  };

  const handleImport = async () => {
    if (!uploadingFile || !selectedTemplate) return;

    setImportStatus('validating');
    // Simulate validation
    await new Promise(resolve => setTimeout(resolve, 1500));

    setImportStatus('importing');
    // Simulate import
    await new Promise(resolve => setTimeout(resolve, 2000));

    setImportStatus('complete');
    // Reset after showing success
    setTimeout(() => {
      setUploadingFile(null);
      setSelectedTemplate(null);
      setImportStatus('idle');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 3000);
  };

  const downloadTemplate = (templateId: string) => {
    const templateData = templateCSVData[templateId];
    if (!templateData) {
      alert('Template not found');
      return;
    }

    // Generate CSV content with headers and sample rows
    const csvContent = [
      templateData.headers.join(','),
      ...templateData.sampleRows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templateId}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
              { id: 'data-import', label: 'Data Import', icon: '📥' },
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

          {activeTab === 'data-import' && (
            <div className="space-y-6">
              {/* Import Section */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Import Data</h2>
                <p className="text-sm text-secondary-500 mb-6">
                  Upload CSV files to import historical data into Aether. Select a template type and upload your file.
                </p>

                {/* Template Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Select Data Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {importTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          selectedTemplate === template.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-secondary-200 hover:border-secondary-300'
                        }`}
                      >
                        <p className="font-medium text-secondary-900">{template.name}</p>
                        <p className="text-xs text-secondary-500 mt-1">{template.description}</p>
                        {template.lastImport && (
                          <p className="text-xs text-primary-600 mt-2">
                            Last import: {new Date(template.lastImport).toLocaleDateString()}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                {selectedTemplate && (
                  <div className="border-2 border-dashed border-secondary-200 rounded-lg p-8 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    {!uploadingFile ? (
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="text-4xl mb-3">📄</div>
                        <p className="text-secondary-900 font-medium">Drop your CSV file here or click to browse</p>
                        <p className="text-sm text-secondary-500 mt-1">
                          Maximum file size: 50MB
                        </p>
                        <button
                          onClick={() => downloadTemplate(selectedTemplate)}
                          className="mt-4 text-sm text-primary-600 hover:text-primary-700 underline"
                        >
                          Download template for {importTemplates.find(t => t.id === selectedTemplate)?.name}
                        </button>
                      </label>
                    ) : (
                      <div>
                        <div className="text-4xl mb-3">
                          {importStatus === 'complete' ? '✅' : importStatus === 'error' ? '❌' : '📄'}
                        </div>
                        <p className="text-secondary-900 font-medium">{uploadingFile.name}</p>
                        <p className="text-sm text-secondary-500">
                          {(uploadingFile.size / 1024).toFixed(1)} KB
                        </p>

                        {importStatus === 'idle' && (
                          <div className="mt-4 flex justify-center gap-3">
                            <button
                              onClick={() => {
                                setUploadingFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                              className="px-4 py-2 border border-secondary-200 text-secondary-600 rounded-lg text-sm font-medium hover:bg-secondary-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleImport}
                              className="btn-primary"
                            >
                              Start Import
                            </button>
                          </div>
                        )}

                        {importStatus === 'validating' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-2 text-primary-600">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Validating file...</span>
                            </div>
                          </div>
                        )}

                        {importStatus === 'importing' && (
                          <div className="mt-4">
                            <div className="flex items-center justify-center gap-2 text-primary-600">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Importing data...</span>
                            </div>
                            <div className="mt-3 h-2 bg-secondary-100 rounded-full overflow-hidden max-w-xs mx-auto">
                              <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                          </div>
                        )}

                        {importStatus === 'complete' && (
                          <div className="mt-4 text-green-600">
                            <p className="font-medium">Import completed successfully!</p>
                          </div>
                        )}

                        {importStatus === 'error' && (
                          <div className="mt-4 text-red-600">
                            <p className="font-medium">Import failed. Please check your file and try again.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Import History */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Import History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Data Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">File Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Records</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Errors</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Imported</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-100">
                      {importHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary-50">
                          <td className="px-4 py-3 text-sm font-medium text-secondary-900">{item.templateName}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{item.fileName}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'completed' ? 'bg-green-100 text-green-800' :
                              item.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{item.recordsImported.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-secondary-600">
                            {item.errors > 0 ? (
                              <span className="text-red-600">{item.errors}</span>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">
                            {new Date(item.importedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-secondary-600">{item.importedBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Template Download Section */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-4">Download Templates</h2>
                <p className="text-sm text-secondary-500 mb-4">
                  Download CSV templates with the correct format for each data type.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {importTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => downloadTemplate(template.id)}
                      className="flex items-center gap-2 p-3 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                    >
                      <span className="text-xl">📥</span>
                      <span className="text-sm font-medium text-secondary-700">{template.name}</span>
                    </button>
                  ))}
                </div>
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
