import { useState } from 'react';

interface CostCategory {
  name: string;
  amount: number;
  budget: number;
  trend: number;
  subcategories: { name: string; amount: number }[];
}

interface VendorSpend {
  name: string;
  amount: number;
  contracts: number;
  savings: number;
}

interface Optimization {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  status: 'identified' | 'in_progress' | 'implemented';
}

const mockCategories: CostCategory[] = [
  {
    name: 'Personnel',
    amount: 4200000,
    budget: 4500000,
    trend: 15,
    subcategories: [
      { name: 'Engineering', amount: 1800000 },
      { name: 'Sales', amount: 1200000 },
      { name: 'G&A', amount: 1200000 },
    ],
  },
  {
    name: 'Cloud Infrastructure',
    amount: 1800000,
    budget: 1500000,
    trend: 22,
    subcategories: [
      { name: 'AWS', amount: 1200000 },
      { name: 'GCP', amount: 450000 },
      { name: 'Azure', amount: 150000 },
    ],
  },
  {
    name: 'Marketing',
    amount: 1500000,
    budget: 1600000,
    trend: 8,
    subcategories: [
      { name: 'Digital', amount: 800000 },
      { name: 'Events', amount: 400000 },
      { name: 'Content', amount: 300000 },
    ],
  },
  {
    name: 'Software & Tools',
    amount: 800000,
    budget: 750000,
    trend: 12,
    subcategories: [
      { name: 'SaaS Subscriptions', amount: 500000 },
      { name: 'Development Tools', amount: 200000 },
      { name: 'Security Tools', amount: 100000 },
    ],
  },
  {
    name: 'Professional Services',
    amount: 600000,
    budget: 700000,
    trend: -5,
    subcategories: [
      { name: 'Consulting', amount: 350000 },
      { name: 'Legal', amount: 150000 },
      { name: 'Audit', amount: 100000 },
    ],
  },
];

const mockVendors: VendorSpend[] = [
  { name: 'Amazon Web Services', amount: 1200000, contracts: 3, savings: 45000 },
  { name: 'Salesforce', amount: 450000, contracts: 2, savings: 22000 },
  { name: 'Google Cloud', amount: 450000, contracts: 2, savings: 18000 },
  { name: 'Microsoft', amount: 320000, contracts: 5, savings: 15000 },
  { name: 'Workday', amount: 280000, contracts: 1, savings: 0 },
];

const mockOptimizations: Optimization[] = [
  {
    id: '1',
    title: 'Right-size AWS instances',
    description: 'Identified 23 underutilized EC2 instances that can be downsized',
    potentialSavings: 85000,
    effort: 'low',
    status: 'identified',
  },
  {
    id: '2',
    title: 'Consolidate SaaS tools',
    description: 'Eliminate 5 redundant software subscriptions across departments',
    potentialSavings: 120000,
    effort: 'medium',
    status: 'in_progress',
  },
  {
    id: '3',
    title: 'Renegotiate Salesforce contract',
    description: 'Annual renewal coming up with opportunity to negotiate volume discount',
    potentialSavings: 45000,
    effort: 'low',
    status: 'identified',
  },
  {
    id: '4',
    title: 'Implement reserved instances',
    description: 'Convert on-demand cloud resources to reserved capacity',
    potentialSavings: 180000,
    effort: 'medium',
    status: 'identified',
  },
  {
    id: '5',
    title: 'Automate manual processes',
    description: 'RPA implementation for invoice processing and reporting',
    potentialSavings: 95000,
    effort: 'high',
    status: 'in_progress',
  },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CostPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'optimizations'>('overview');

  const totalCosts = mockCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const totalBudget = mockCategories.reduce((sum, cat) => sum + cat.budget, 0);
  const totalOptimizations = mockOptimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0);

  const getEffortBadge = (effort: string) => {
    const styles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };
    return styles[effort as keyof typeof styles];
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      identified: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      implemented: 'bg-green-100 text-green-800',
    };
    return styles[status as keyof typeof styles];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Cost Intelligence</h1>
          <p className="text-secondary-500">Analyze and optimize your spending</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="px-4 py-2 border border-secondary-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option>This Quarter</option>
            <option>Last Quarter</option>
            <option>This Year</option>
            <option>Custom Range</option>
          </select>
          <button className="btn-primary">
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Total Costs (QTD)</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(totalCosts)}</p>
          <p className="text-xs text-green-600 mt-1">6% under budget</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Budget Remaining</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(totalBudget - totalCosts)}</p>
          <p className="text-xs text-secondary-400 mt-1">of {formatCurrency(totalBudget)} budget</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Cost per Employee</p>
          <p className="text-2xl font-bold text-secondary-900">{formatCurrency(totalCosts / 150)}</p>
          <p className="text-xs text-yellow-600 mt-1">+8% vs industry avg</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-secondary-500">Savings Opportunities</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalOptimizations)}</p>
          <p className="text-xs text-secondary-400 mt-1">{mockOptimizations.length} identified</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-secondary-200">
        <nav className="flex gap-6">
          {(['overview', 'vendors', 'optimizations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-secondary-500 hover:text-secondary-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost by Category */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Cost by Category</h2>
            <div className="space-y-4">
              {mockCategories.map((category) => {
                const percentage = (category.amount / totalCosts) * 100;
                const budgetPercentage = (category.amount / category.budget) * 100;
                const isOverBudget = category.amount > category.budget;

                return (
                  <div
                    key={category.name}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCategory === category.name
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-200 hover:border-secondary-300'
                    }`}
                    onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-secondary-900">{category.name}</span>
                        <span className={`text-xs ${category.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {category.trend > 0 ? '+' : ''}{category.trend}% YoY
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium text-secondary-900">{formatCurrency(category.amount)}</span>
                        <span className="text-sm text-secondary-400 ml-2">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-primary-500'}`}
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-secondary-400 mt-1">
                      <span>Budget: {formatCurrency(category.budget)}</span>
                      <span className={isOverBudget ? 'text-red-600' : 'text-green-600'}>
                        {isOverBudget ? `${formatCurrency(category.amount - category.budget)} over` : `${formatCurrency(category.budget - category.amount)} remaining`}
                      </span>
                    </div>

                    {selectedCategory === category.name && (
                      <div className="mt-4 pt-4 border-t border-secondary-200">
                        <p className="text-sm font-medium text-secondary-700 mb-2">Breakdown</p>
                        <div className="space-y-2">
                          {category.subcategories.map((sub) => (
                            <div key={sub.name} className="flex justify-between text-sm">
                              <span className="text-secondary-600">{sub.name}</span>
                              <span className="font-medium text-secondary-900">{formatCurrency(sub.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Trends */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">Monthly Trend</h2>
            <div className="space-y-3">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month) => {
                const value = 2800000 + Math.random() * 400000;
                const budget = 3000000;
                const width = (value / budget) * 100;

                return (
                  <div key={month}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-secondary-600">{month}</span>
                      <span className="font-medium">{formatCurrency(value)}</span>
                    </div>
                    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${width > 100 ? 'bg-red-500' : 'bg-primary-500'}`}
                        style={{ width: `${Math.min(width, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-secondary-200">
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Top Alerts</h3>
              <div className="space-y-2">
                <div className="p-2 bg-red-50 rounded text-sm">
                  <p className="text-red-800 font-medium">Cloud costs +22% over budget</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded text-sm">
                  <p className="text-yellow-800 font-medium">Software spend +7% vs last month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900">Top Vendors by Spend</h2>
          </div>
          <table className="w-full">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Annual Spend</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Contracts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Negotiated Savings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-100">
              {mockVendors.map((vendor) => (
                <tr key={vendor.name} className="hover:bg-secondary-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-secondary-900">{vendor.name}</p>
                  </td>
                  <td className="px-4 py-4 font-medium text-secondary-900">{formatCurrency(vendor.amount)}</td>
                  <td className="px-4 py-4 text-secondary-600">{vendor.contracts}</td>
                  <td className="px-4 py-4">
                    {vendor.savings > 0 ? (
                      <span className="text-green-600">{formatCurrency(vendor.savings)}</span>
                    ) : (
                      <span className="text-secondary-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'optimizations' && (
        <div className="space-y-4">
          <div className="card p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-800">Total Savings Potential</h3>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(totalOptimizations)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">{mockOptimizations.filter(o => o.status === 'in_progress').length} in progress</p>
                <p className="text-sm text-green-600">{mockOptimizations.filter(o => o.status === 'identified').length} identified</p>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Optimization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Potential Savings</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Effort</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {mockOptimizations.map((opt) => (
                  <tr key={opt.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-4">
                      <p className="font-medium text-secondary-900">{opt.title}</p>
                      <p className="text-sm text-secondary-500">{opt.description}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-green-600">{formatCurrency(opt.potentialSavings)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffortBadge(opt.effort)}`}>
                        {opt.effort}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(opt.status)}`}>
                        {opt.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        {opt.status === 'identified' ? 'Start' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
