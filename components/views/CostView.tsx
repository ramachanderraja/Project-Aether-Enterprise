
import React, { useState } from 'react';
import { Banknote, AlertOctagon, TrendingDown, TrendingUp, Users, Search, AlertTriangle, CheckCircle, Flame, Plane, Cpu, BarChart2 } from 'lucide-react';
import { CORE_DATA, MOCK_COST_TRENDS, MOCK_DEPT_COSTS, VENDOR_SPEND } from '../../constants';
import { ResponsiveContainer, Treemap, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend, ComposedChart, Line, PieChart, Pie, Cell } from 'recharts';

// Extended Vendor Data for better visualization
const MOCK_EXTENDED_VENDORS = [
    { name: "AWS", value: 1200000, category: "Cloud Infra", change: 0.15, risk: 'low' },
    { name: "Azure", value: 850000, category: "Cloud Infra", change: 0.22, risk: 'low' },
    { name: "Salesforce", value: 450000, category: "SaaS", change: 0.05, risk: 'low' },
    { name: "Oracle", value: 410000, category: "ERP", change: 0.03, risk: 'low' },
    { name: "Datadog", value: 320000, category: "SaaS", change: 0.35, risk: 'high' },
    { name: "LinkedIn Ads", value: 290000, category: "Marketing", change: 0.45, risk: 'high' },
    { name: "Snowflake", value: 280000, category: "Data", change: 0.18, risk: 'low' },
    { name: "GlobalTours", value: 210000, category: "Travel", change: 0.40, risk: 'high' },
    { name: "Google Cloud", value: 190000, category: "Cloud Infra", change: 0.12, risk: 'low' },
    { name: "WeWork", value: 180000, category: "Facilities", change: -0.10, risk: 'low' },
    { name: "Zoom", value: 150000, category: "SaaS", change: 0.02, risk: 'low' },
    { name: "Slack", value: 120000, category: "SaaS", change: 0.08, risk: 'low' },
    { name: "HubSpot", value: 95000, category: "Marketing", change: 0.15, risk: 'low' },
    { name: "Figma", value: 65000, category: "SaaS", change: 0.28, risk: 'high' },
    { name: "Notion", value: 45000, category: "SaaS", change: 0.12, risk: 'low' },
];

const BLUE_PALETTE = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#60a5fa', '#93c5fd'];

// Custom content for Treemap cells
const CustomizedContent = (props: any) => {
  const { root, depth, x, y, width, height, index, name, value, change, risk } = props;
  const isHighGrowth = change > 0.2; 
  const isHighRisk = risk === 'high' || isHighGrowth;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: isHighRisk ? '#7f1d1d' : BLUE_PALETTE[index % BLUE_PALETTE.length], // Dark Red for high risk
          stroke: isHighRisk ? '#ef4444' : '#18181b', // Bright Red border for high risk vs Zinc border
          strokeWidth: isHighRisk ? 3 : 1,
          opacity: 1,
        }}
        rx={6}
        ry={6}
      />
      {width > 60 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - 6}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
          style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
        >
          {name}
        </text>
      )}
      {width > 60 && height > 50 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize={10}
          style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
        >
          ${(value / 1000).toFixed(0)}k ({change > 0 ? '+' : ''}{(change * 100).toFixed(0)}%)
        </text>
      )}
      {isHighRisk && width > 40 && height > 40 && (
          // Warning Icon for high risk
          <circle cx={x + width - 12} cy={y + 12} r="4" fill="#ef4444" stroke="#fff" strokeWidth={1} />
      )}
    </g>
  );
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'];

const CostView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'payroll' | 'travel'>('overview');
    const kpis = CORE_DATA.CostInsights.SummaryKPIs;
    const opex = CORE_DATA.CostInsights.OperatingExpense;
    
    // Use extended mock data
    const vendorData = MOCK_EXTENDED_VENDORS.sort((a,b) => b.value - a.value);

    const renderOverview = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* OpEx Variance Analysis */}
                <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">OpEx Variance (Q4)</h3>
                        <div className={`px-3 py-1 rounded text-xs font-bold border ${opex.Variance > 0 ? 'bg-[#FFC300]/10 text-[#FFC300] border-[#FFC300]/20' : 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'}`}>
                            {opex.Variance > 0 ? 'Over Budget' : 'Under Budget'}
                        </div>
                    </div>
                    
                    <div className="flex items-end justify-between mb-8">
                         <div>
                             <p className="text-sm text-slate-400 mb-1">Actuals</p>
                             <p className="text-2xl font-bold text-white font-mono">${(opex.Actual_Q4 / 1000000).toFixed(2)}M</p>
                         </div>
                         <div className="text-right">
                             <p className="text-sm text-slate-400 mb-1">Budget</p>
                             <p className="text-2xl font-bold text-slate-400 font-mono">${(opex.Budget_Q4 / 1000000).toFixed(2)}M</p>
                         </div>
                    </div>

                    <div className="relative pt-6">
                        <div className="w-full bg-aether-900 h-4 rounded-full overflow-hidden flex">
                            <div className="h-full bg-blue-600" style={{ width: `${(opex.Budget_Q4 / opex.Actual_Q4) * 100}%` }}></div>
                            <div className="h-full bg-[#FFC300] striped-bg" style={{ width: `${(opex.Variance / opex.Actual_Q4) * 100}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                            <span>0%</span>
                            <span className="text-[#FFC300] font-bold">Variance: ${(opex.Variance / 1000000).toFixed(2)}M</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>

                {/* OpEx Ratio Trend */}
                <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-4">OpEx % of Revenue</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_COST_TRENDS}>
                                <defs>
                                    <linearGradient id="colorOpex" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="month" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} domain={[0.5, 0.8]} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                                <Area type="monotone" dataKey="opexRatio" stroke="#f59e0b" fillOpacity={1} fill="url(#colorOpex)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Departmental Burn Down */}
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                 <h3 className="text-lg font-bold text-white mb-6">Departmental Budget "Burn Down"</h3>
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_DEPT_COSTS} layout="vertical" margin={{ left: 40, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val/1000}k`} />
                            <YAxis type="category" dataKey="department" width={100} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                            <Legend />
                            <Bar dataKey="payroll" stackId="a" name="Actual Spend" fill="#3b82f6" barSize={20} />
                            <Bar dataKey="budgetAllocated" stackId="b" name="Total Budget" fill="transparent" stroke="#10b981" strokeDasharray="5 5" barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            </div>

            {/* Vendor Spend Treemap */}
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Top Vendor Spend</h3>
                    <div className="text-xs text-slate-400 flex items-center space-x-3">
                        <span className="flex items-center"><span className="w-2 h-2 rounded bg-[#7f1d1d] border border-red-500 mr-1"></span> High Growth/Risk</span>
                        <span className="flex items-center"><span className="w-2 h-2 rounded bg-blue-600 mr-1"></span> Standard</span>
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            data={vendorData}
                            dataKey="value"
                            aspectRatio={4/3}
                            stroke="#18181b"
                            fill="#8884d8"
                            content={<CustomizedContent />}
                        >
                            <Tooltip content={({ payload }) => {
                                if (payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-aether-900 border border-aether-700 p-3 rounded shadow-xl">
                                            <p className="text-white font-bold">{d.name}</p>
                                            <p className="text-slate-300 text-sm">Category: {d.category}</p>
                                            <p className="text-slate-300 text-sm">Spend MTD: ${(d.value / 1000).toFixed(0)}k</p>
                                            <p className={`${d.change > 0.1 ? 'text-rose-400' : 'text-emerald-400'} text-sm font-mono`}>
                                                YoY: {(d.change * 100).toFixed(0)}%
                                            </p>
                                            {d.risk === 'high' && <p className="text-rose-500 text-xs font-bold mt-1 uppercase">High Risk</p>}
                                        </div>
                                    )
                                }
                                return null;
                            }} />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderPayroll = () => (
        <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                     <h3 className="text-lg font-bold text-white mb-4">Headcount vs Payroll Trend</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={MOCK_COST_TRENDS}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}M`} label={{ value: 'Spend ($M)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fontSize: 12 }} label={{ value: 'FTE', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="payroll" name="Payroll Spend ($M)" fill="#3b82f6" barSize={30} radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="headcount" name="Headcount (FTE)" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                     </div>
                 </div>

                 <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                     <h3 className="text-lg font-bold text-white mb-4">Departmental Spend Distribution</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={MOCK_DEPT_COSTS}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="payroll"
                                    nameKey="department"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {MOCK_DEPT_COSTS.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} formatter={(val: number) => `$${(val/1000000).toFixed(1)}M`} />
                            </PieChart>
                        </ResponsiveContainer>
                     </div>
                 </div>
             </div>

             <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Detailed Payroll & Benefits Analysis</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-slate-500 border-b border-aether-700 bg-aether-900/50 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="px-4 py-3 font-semibold">Department</th>
                                <th className="px-4 py-3 font-semibold text-right">Headcount</th>
                                <th className="px-4 py-3 font-semibold text-right">Payroll Spend (Mo)</th>
                                <th className="px-4 py-3 font-semibold text-right">Avg Cost / FTE</th>
                                <th className="px-4 py-3 font-semibold text-right">Benefits Load</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-aether-700">
                            {MOCK_DEPT_COSTS.map((dept) => (
                                <tr key={dept.department} className="hover:bg-aether-700/30 transition-colors">
                                    <td className="px-4 py-4 font-bold text-white">{dept.department}</td>
                                    <td className="px-4 py-4 text-right">{dept.headcount}</td>
                                    <td className="px-4 py-4 text-right font-mono text-white">${(dept.payroll).toLocaleString()}</td>
                                    <td className="px-4 py-4 text-right font-mono text-slate-400">${Math.round(dept.payroll / dept.headcount).toLocaleString()}</td>
                                    <td className="px-4 py-4 text-right font-mono text-slate-400">22.5%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
    );

    const renderTravel = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 col-span-2">
                     <h3 className="text-lg font-bold text-white mb-4">Travel Spend vs Budget</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MOCK_COST_TRENDS}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val*100}k`} />
                                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} formatter={(val: number) => `$${(val*100).toFixed(0)}k`} />
                                <Legend />
                                <Bar dataKey="travel" name="Actual Spend" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                {/* Simulated Budget Line */}
                                <Line type="monotone" dataKey={() => 0.5} name="Travel Budget Limit" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>

                 <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                     <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-rose-500/20 rounded-lg">
                            <AlertOctagon className="text-rose-400" size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Policy Violations</h3>
                     </div>
                     <div className="space-y-4">
                        <div className="p-3 bg-aether-900/50 rounded-lg border border-aether-700">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-bold text-white">Booking Class</span>
                                <span className="text-xs text-rose-400 font-bold">High Severity</span>
                            </div>
                            <p className="text-xs text-slate-400">3 Executives booked First Class on domestic routes (NYC > SFO).</p>
                        </div>
                        <div className="p-3 bg-aether-900/50 rounded-lg border border-aether-700">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-bold text-white">Advance Booking</span>
                                <span className="text-xs text-orange-400 font-bold">Medium Severity</span>
                            </div>
                            <p className="text-xs text-slate-400">45% of flights booked less than 7 days in advance, increasing cost by 22%.</p>
                        </div>
                        <div className="p-3 bg-aether-900/50 rounded-lg border border-aether-700">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-bold text-white">Meal Expense</span>
                                <span className="text-xs text-yellow-400 font-bold">Low Severity</span>
                            </div>
                            <p className="text-xs text-slate-400">Sales team "Client Dinner" average exceeds policy limit by $15 per head.</p>
                        </div>
                     </div>
                 </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden bg-aether-900 font-sans">
            
            {/* --- Heads-Up Display (Fixed Top Section) --- */}
            <div className="bg-aether-900 border-b border-aether-700 p-6 shadow-2xl z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Cost Insights</h2>
                        <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs">The Efficiency Engine</p>
                    </div>
                    {/* Navigation Tabs */}
                    <div className="flex bg-aether-800 p-1 rounded-lg border border-aether-700">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <BarChart2 size={16} className="mr-2" /> Overview
                        </button>
                        <button 
                            onClick={() => setActiveTab('payroll')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'payroll' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Users size={16} className="mr-2" /> Payroll & Headcount
                        </button>
                        <button 
                            onClick={() => setActiveTab('travel')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'travel' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Plane size={16} className="mr-2" /> Travel & Expense
                        </button>
                    </div>
                </div>

                {/* KPI Ticker / Gauges (Global Context) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Burn Rate */}
                    <div className="bg-aether-800/50 border border-aether-700 rounded-xl p-4 flex items-center justify-between group hover:border-rose-500/30 transition-all">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Monthly Burn Rate</p>
                            <div className="text-3xl font-bold text-rose-500 tabular-nums">
                                ${(kpis.MonthlyBurnRate / 1000000).toFixed(1)}M
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                            <Flame size={20} />
                        </div>
                    </div>

                    {/* Runway */}
                    <div className="bg-aether-800/50 border border-aether-700 rounded-xl p-4 flex items-center justify-between group hover:border-[#10b981]/30 transition-all">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Cash Runway</p>
                            <div className="text-3xl font-bold text-[#10b981] tabular-nums">
                                {kpis.OperatingCashRunway_Months} Mo
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                            <Banknote size={20} />
                        </div>
                    </div>

                    {/* Rev Per Employee */}
                    <div className="bg-aether-800/50 border border-aether-700 rounded-xl p-4 flex items-center justify-between group hover:border-[#00FFFF]/30 transition-all">
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">Rev / Employee</p>
                            <div className="text-3xl font-bold text-white tabular-nums">
                                ${(kpis.RevenuePerEmployee_Global / 1000).toFixed(0)}k
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Users size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Main Scrollable Content --- */}
            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'payroll' && renderPayroll()}
                {activeTab === 'travel' && renderTravel()}
            </div>
        </div>
    );
};

export default CostView;
