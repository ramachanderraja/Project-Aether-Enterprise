
import React, { useState, useMemo } from 'react';
import { FileBarChart, Filter, Download, ArrowUpDown, MoreHorizontal, Clock, AlertCircle, Flag, Layers, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ZAxis, LineChart, Line, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';
import { REGIONS, SEGMENTS, VERTICALS } from '../../constants';

// Enhanced Mock Data Generator
const generateReportData = (type: 'License' | 'Implementation') => {
    return Array.from({ length: 50 }, (_, i) => {
        const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
        const segment = SEGMENTS[Math.floor(Math.random() * SEGMENTS.length)];
        const vertical = VERTICALS[Math.floor(Math.random() * VERTICALS.length)];
        const revenue = Math.floor(Math.random() * 2000000) + 500000;
        
        let cost1, cost2;
        if (type === 'License') {
            cost1 = Math.round(revenue * 0.15); // Cloud/Infra
            cost2 = Math.round(revenue * 0.10); // Resource (Support)
        } else {
            cost1 = Math.round(revenue * 0.40); // TSO Cost
            cost2 = Math.round(revenue * 0.25); // Engg Cost
        }

        const grossMarginVal = revenue - cost1 - cost2;
        const grossMarginPct = grossMarginVal / revenue;
        const contribMarginPct = grossMarginPct - 0.15; // Mock overhead

        return {
            id: `ACC-${1000+i}`,
            name: `Account ${1000+i}`,
            region,
            segment,
            vertical,
            revenue,
            cost1, // Infra or TSO
            cost2, // Resource or Engg
            grossMarginVal,
            grossMarginPct,
            contribMarginPct,
            healthScore: Math.floor(Math.random() * 100),
            renewalDate: '2024-12-31'
        };
    });
};

const ReportsView: React.FC = () => {
    const [viewMode, setViewMode] = useState<'License' | 'Implementation'>('License');
    const [filterRegion, setFilterRegion] = useState('All');
    const [filterSegment, setFilterSegment] = useState('All');
    const [filterVertical, setFilterVertical] = useState('All');
    const [trendFilter, setTrendFilter] = useState('All'); // For the trend chart

    const rawData = useMemo(() => generateReportData(viewMode), [viewMode]);

    const filteredData = useMemo(() => {
        return rawData.filter(d => {
            const matchesRegion = filterRegion === 'All' || d.region === filterRegion;
            const matchesSegment = filterSegment === 'All' || d.segment === filterSegment;
            const matchesVertical = filterVertical === 'All' || d.vertical === filterVertical;
            return matchesRegion && matchesSegment && matchesVertical;
        });
    }, [rawData, filterRegion, filterSegment, filterVertical]);

    // Aggregate Data for Graphs
    const regionAgg = useMemo(() => {
        const groups: any = {};
        filteredData.forEach(d => {
            if (!groups[d.region]) groups[d.region] = { name: d.region, revenue: 0, margin: 0 };
            groups[d.region].revenue += d.revenue;
            groups[d.region].margin += d.grossMarginVal;
        });
        return Object.values(groups).map((g: any) => ({ ...g, marginPct: g.margin / g.revenue }));
    }, [filteredData]);

    const segmentAgg = useMemo(() => {
        const groups: any = {};
        filteredData.forEach(d => {
            if (!groups[d.segment]) groups[d.segment] = { name: d.segment, revenue: 0, margin: 0 };
            groups[d.segment].revenue += d.revenue;
            groups[d.segment].margin += d.grossMarginVal;
        });
        return Object.values(groups).map((g: any) => ({ ...g, marginPct: g.margin / g.revenue }));
    }, [filteredData]);

    // Segment Breakdown Table Data
    const segmentBreakdown = useMemo(() => {
        const groups: any = {};
        filteredData.forEach(d => {
            if (!groups[d.segment]) groups[d.segment] = { name: d.segment, revenue: 0, grossMargin: 0, contribMargin: 0, count: 0 };
            groups[d.segment].revenue += d.revenue;
            groups[d.segment].grossMargin += d.grossMarginVal;
            groups[d.segment].contribMargin += (d.revenue * d.contribMarginPct);
            groups[d.segment].count += 1;
        });
        return Object.values(groups).map((g: any) => ({
            segment: g.name,
            revenue: g.revenue,
            gmPct: g.grossMargin / g.revenue,
            cmPct: g.contribMargin / g.revenue
        })).sort((a: any, b: any) => b.revenue - a.revenue);
    }, [filteredData]);

    // Trend Data Generation
    const netMarginTrend = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Base trend modified by filters
        const baseMargin = viewMode === 'License' ? 0.35 : 0.20;
        const volatility = 0.05;
        
        return months.map(m => {
            const randomVar = (Math.random() - 0.5) * volatility;
            const regionMod = trendFilter === 'North America' ? 0.05 : trendFilter === 'Europe' ? -0.02 : 0;
            return {
                month: m,
                netMarginPct: baseMargin + randomVar + regionMod,
                revenue: 1000 + Math.random() * 200 // scalable mock
            };
        });
    }, [viewMode, trendFilter]);

    return (
        <div className="p-8 h-full overflow-y-auto bg-transparent font-sans">
             <div className="mb-6">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white flex items-center">
                            <FileBarChart className="mr-3 text-blue-500" />
                            Profitability Reports
                        </h2>
                        <p className="text-slate-400 mt-1">Margin Analysis by Segment & Region</p>
                    </div>
                    {/* View Toggle */}
                    <div className="flex bg-aether-800 p-1 rounded-lg border border-aether-700">
                        <button onClick={() => setViewMode('License')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'License' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}>License Profitability</button>
                        <button onClick={() => setViewMode('Implementation')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'Implementation' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-200'}`}>Implementation Profitability</button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-aether-800 border border-aether-700 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-2">
                        <Filter className="text-slate-400" size={16} />
                        <span className="text-sm font-semibold text-slate-500">Filters:</span>
                    </div>
                    <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="bg-white border border-aether-700 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                        <option value="All">All Regions</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)} className="bg-white border border-aether-700 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                        <option value="All">All Segments</option>
                        {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={filterVertical} onChange={(e) => setFilterVertical(e.target.value)} className="bg-white border border-aether-700 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm">
                        <option value="All">All Verticals</option>
                        {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
            </div>

            {/* High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard label="Total Revenue" value={`$${(filteredData.reduce((a,b) => a+b.revenue, 0)/1000000).toFixed(1)}M`} />
                <StatCard label={`Total ${viewMode === 'License' ? 'Cloud' : 'TSO'} Cost`} value={`$${(filteredData.reduce((a,b) => a+b.cost1, 0)/1000000).toFixed(1)}M`} />
                <StatCard label={`Total ${viewMode === 'License' ? 'Resource' : 'Engg'} Cost`} value={`$${(filteredData.reduce((a,b) => a+b.cost2, 0)/1000000).toFixed(1)}M`} />
                <StatCard label={`Avg ${viewMode === 'License' ? 'Gross' : 'Net'} Margin %`} value={`${((filteredData.reduce((a,b) => a+b.grossMarginVal, 0) / filteredData.reduce((a,b) => a+b.revenue, 0)) * 100).toFixed(1)}%`} color="text-emerald-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                 {/* Margin by Region */}
                 <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                     <h3 className="font-bold text-white mb-4">Margin by Region</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={regionAgg} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `${(v*100).toFixed(0)}%`} domain={[0, 1]} />
                                <YAxis type="category" dataKey="name" width={100} stroke="#64748b" fontSize={11} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#cbd5e1', color: '#1e293b' }} formatter={(v: number) => `${(v*100).toFixed(1)}%`} />
                                <Bar dataKey="marginPct" fill="#10b981" barSize={20} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Margin by Segment */}
                 <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                     <h3 className="font-bold text-white mb-4">Margin by Segment</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={segmentAgg}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" />
                                <YAxis stroke="#64748b" tickFormatter={(v) => `${(v*100).toFixed(0)}%`} domain={[0, 1]} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#cbd5e1', color: '#1e293b' }} formatter={(v: number) => `${(v*100).toFixed(1)}%`} />
                                <Bar dataKey="marginPct" barSize={40}>
                                    {segmentAgg.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#8b5cf6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                 </div>

                 {/* Revenue vs Margin Scatter */}
                 <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                    <h3 className="font-bold text-white mb-4">Account Distribution</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                <XAxis type="number" dataKey="revenue" name="Revenue" stroke="#64748b" tickFormatter={(v) => `$${v/1000}k`} />
                                <YAxis type="number" dataKey="grossMarginPct" name="Margin %" stroke="#64748b" tickFormatter={(v) => `${(v*100).toFixed(0)}%`} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#cbd5e1', color: '#1e293b' }} />
                                <Scatter name="Accounts" data={filteredData} fill="#f59e0b" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-aether-800 border border-aether-700 rounded-xl overflow-hidden shadow-lg mb-8">
                <div className="p-4 border-b border-aether-700 bg-aether-900/50">
                    <h3 className="font-bold text-white">Account Profitability Details</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-slate-100 text-xs uppercase font-medium text-slate-600">
                            <tr>
                                <th className="px-6 py-4">Account</th>
                                <th className="px-6 py-4">Region</th>
                                <th className="px-6 py-4">Segment</th>
                                <th className="px-6 py-4">Vertical</th>
                                <th className="px-6 py-4 text-right">Revenue</th>
                                <th className="px-6 py-4 text-right">{viewMode === 'License' ? 'Cloud/Infra' : 'TSO Cost'}</th>
                                <th className="px-6 py-4 text-right">{viewMode === 'License' ? 'Resource' : 'Engg Cost'}</th>
                                <th className="px-6 py-4 text-right">Margin $</th>
                                <th className="px-6 py-4 text-right">{viewMode === 'License' ? 'Gross' : 'Net'} Margin %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredData.slice(0, 10).map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-800">{row.name}</td>
                                    <td className="px-6 py-4">{row.region}</td>
                                    <td className="px-6 py-4">{row.segment}</td>
                                    <td className="px-6 py-4 text-xs text-slate-500">{row.vertical}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-700">${(row.revenue/1000).toFixed(0)}k</td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-500">${(row.cost1/1000).toFixed(0)}k</td>
                                    <td className="px-6 py-4 text-right font-mono text-rose-500">${(row.cost2/1000).toFixed(0)}k</td>
                                    <td className="px-6 py-4 text-right font-mono text-emerald-600">${(row.grossMarginVal/1000).toFixed(0)}k</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">{(row.grossMarginPct * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Segment Breakdown & Trend Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Segment Profitability Breakdown */}
                <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                    <h3 className="font-bold text-white mb-4 flex items-center">
                        <Layers size={20} className="mr-2 text-indigo-500" />
                        Segment Profitability Breakdown
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-slate-500 border-b border-aether-700">
                                    <th className="pb-3 font-medium">Segment</th>
                                    <th className="pb-3 font-medium text-right">Revenue</th>
                                    <th className="pb-3 font-medium text-right">Gross Margin</th>
                                    <th className="pb-3 font-medium text-right">Contrib. Margin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-aether-700">
                                {segmentBreakdown.map((seg, idx) => (
                                    <tr key={seg.segment} className="hover:bg-slate-50">
                                        <td className="py-4 font-bold text-slate-800">{seg.segment}</td>
                                        <td className="py-4">
                                            <div className="flex flex-col items-end">
                                                <span className="font-mono text-slate-700">${(seg.revenue / 1000000).toFixed(1)}M</span>
                                                <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1">
                                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(seg.revenue / Math.max(...segmentBreakdown.map(s=>s.revenue))) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-emerald-600">{(seg.gmPct * 100).toFixed(1)}%</span>
                                                <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${seg.gmPct * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-indigo-600">{(seg.cmPct * 100).toFixed(1)}%</span>
                                                <div className="w-16 h-1.5 bg-slate-200 rounded-full mt-1">
                                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${seg.cmPct * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Net Margin Trend Chart */}
                <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white flex items-center">
                            <TrendingUp size={20} className="mr-2 text-emerald-500" />
                            Net Margin Trend
                        </h3>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-500">Filter by Region:</span>
                            <select 
                                value={trendFilter} 
                                onChange={(e) => setTrendFilter(e.target.value)}
                                className="bg-white border border-aether-700 text-xs rounded px-2 py-1 outline-none shadow-sm"
                            >
                                <option value="All">Global</option>
                                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={netMarginTrend}>
                                <defs>
                                    <linearGradient id="colorNetMargin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                                <XAxis dataKey="month" stroke="#64748b" tick={{fontSize: 12}} />
                                <YAxis stroke="#64748b" tickFormatter={(v) => `${(v*100).toFixed(0)}%`} tick={{fontSize: 12}} domain={[0, 0.6]} />
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#cbd5e1', color: '#1e293b' }} formatter={(v: number) => `${(v*100).toFixed(1)}%`} />
                                <Area type="monotone" dataKey="netMarginPct" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNetMargin)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color = "text-slate-800" }: any) => (
    <div className="bg-aether-800 border border-aether-700 rounded-xl p-4 shadow-sm backdrop-blur-md hover:shadow-md transition-shadow">
        <p className="text-slate-500 text-xs uppercase tracking-wider mb-1 font-semibold">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

export default ReportsView;
