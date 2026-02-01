
import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart2, Target, Filter, ArrowUpDown, Clock, Star, Layers, Calendar, Users, List, BrainCircuit, X, CheckCircle, AlertOctagon, AlertTriangle, ArrowUp, ArrowDown, DollarSign, Flame, ThumbsDown, Info, AlertCircle } from 'lucide-react';
import { CORE_DATA, REGIONS, LOBS, VERTICALS, SEGMENTS, REVENUE_TYPES, MOCK_SALES_REPS } from '../../constants';
import { Deal } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, FunnelChart, Funnel, LabelList, Cell, ComposedChart, Line, LineChart } from 'recharts';

const SalesView: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<'overview' | 'forecast' | 'movement' | 'quota'>('overview');
    
    // Filters
    const [filterRegion, setFilterRegion] = useState('All');
    const [filterLOB, setFilterLOB] = useState('All');
    const [filterVertical, setFilterVertical] = useState('All');

    // Sorting State for Closed Lost
    const [closedLostSort, setClosedLostSort] = useState<{ key: 'Value' | 'CloseDate'; direction: 'asc' | 'desc' }>({ key: 'CloseDate', direction: 'desc' });

    // Filtering Logic
    const filteredDeals = useMemo(() => {
        return CORE_DATA.SalesInsights.PipelineDeals.filter(deal => {
            const matchesRegion = filterRegion === 'All' || deal.Region === filterRegion;
            const matchesLOB = filterLOB === 'All' || deal.Type === filterLOB;
            const matchesVertical = filterVertical === 'All' || deal.Vertical === filterVertical;
            return matchesRegion && matchesLOB && matchesVertical;
        });
    }, [filterRegion, filterLOB, filterVertical]);

    // --- OVERVIEW METRICS ---
    const overviewKPIs = useMemo(() => {
        const totalValue = filteredDeals.reduce((sum, d) => sum + d.Value, 0);
        const wonDeals = filteredDeals.filter(d => d.Stage === 'Closed Won');
        const lostDeals = filteredDeals.filter(d => d.Stage === 'Closed Lost');
        const count = filteredDeals.length;
        const avgDealSize = count > 0 ? totalValue / count : 0;
        
        const conversionRatio = count > 0 ? (wonDeals.length / count) * 100 : 0;
        const salesCycle = 45 + Math.random() * 15; // Days
        const velocity = totalValue * (conversionRatio/100) / salesCycle; 

        const weightedForecast = filteredDeals.reduce((sum, d) => sum + (d.Value * d.Probability), 0);
        const closedARR = wonDeals.reduce((sum, d) => sum + d.Value, 0);
        const closedLostValue = lostDeals.reduce((sum, d) => sum + d.Value, 0);
        const closedLostCount = lostDeals.length;

        return {
            avgDealSize,
            conversionRatio,
            salesCycle,
            opportunityCount: count,
            velocity,
            weightedForecast,
            closedARR,
            closedLostValue,
            closedLostCount
        };
    }, [filteredDeals]);

    // --- CHART DATA GENERATORS ---

    const funnelData = useMemo(() => {
        const stages = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Legal Review', 'Closed Won'];
        const channels = ['Outbound Sales', 'Paid Search (SEM)', 'Organic/Content', 'Events & Trade', 'Partner/Reseller'];
        
        return stages.map(stage => {
            const deals = filteredDeals.filter(d => d.Stage === stage);
            const channelCounts: any = { stage };
            channels.forEach(ch => {
                channelCounts[ch] = deals.filter(d => d.Channel === ch).length;
            });
            return channelCounts;
        });
    }, [filteredDeals]);

    const forecastChartData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const scale = filterRegion === 'All' ? 1 : 0.3;
        return months.map(m => ({
            period: m,
            forecast: Math.round((Math.random() * 3000000 + 2000000) * scale),
            closed: Math.round((Math.random() * 1000000 + 1000000) * scale),
        }));
    }, [filterRegion]);

    const stalledDeals = useMemo(() => {
        return filteredDeals
            .filter(d => d.Stage !== 'Closed Won' && d.Stage !== 'Closed Lost' && d.DaysInPipeline > 90)
            .sort((a,b) => b.DaysInPipeline - a.DaysInPipeline)
            .slice(0, 10);
    }, [filteredDeals]);

    const closedLostDeals = useMemo(() => {
        const deals = filteredDeals.filter(d => d.Stage === 'Closed Lost');
        return deals.sort((a, b) => {
            if (closedLostSort.key === 'Value') {
                return closedLostSort.direction === 'asc' ? a.Value - b.Value : b.Value - a.Value;
            } else {
                return closedLostSort.direction === 'asc' 
                    ? new Date(a.CloseDate).getTime() - new Date(b.CloseDate).getTime()
                    : new Date(b.CloseDate).getTime() - new Date(a.CloseDate).getTime();
            }
        }).slice(0, 10);
    }, [filteredDeals, closedLostSort]);

    const handleClosedLostSort = (key: 'Value' | 'CloseDate') => {
        setClosedLostSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const CHANNEL_COLORS: any = {
        'Outbound Sales': '#3b82f6',
        'Paid Search (SEM)': '#8b5cf6',
        'Organic/Content': '#10b981',
        'Events & Trade': '#f59e0b',
        'Partner/Reseller': '#ec4899',
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-aether-900 font-sans">
            <div className="bg-aether-900 border-b border-aether-700 p-6 shadow-2xl z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Sales Performance</h2>
                        <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs">Pipeline Velocity & Forecast Accuracy</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 p-4 bg-aether-800/50 rounded-xl border border-aether-700">
                    <div className="flex items-center space-x-2">
                        <Filter className="text-slate-400" size={16} />
                        <span className="text-sm font-semibold text-slate-300">Filters:</span>
                    </div>
                    <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="bg-aether-900 border border-aether-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="All">All Regions</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={filterLOB} onChange={(e) => setFilterLOB(e.target.value)} className="bg-aether-900 border border-aether-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="All">All LOBs</option>
                        {LOBS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select value={filterVertical} onChange={(e) => setFilterVertical(e.target.value)} className="bg-aether-900 border border-aether-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="All">All Verticals</option>
                        {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="bg-aether-800 border border-aether-700 rounded-xl p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Weighted Forecast</p>
                        <p className="text-2xl font-bold text-white">${(overviewKPIs.weightedForecast / 1000000).toFixed(2)}M</p>
                    </div>
                    <div className="bg-aether-800 border border-aether-700 rounded-xl p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Closed ARR (YTD)</p>
                        <p className="text-2xl font-bold text-emerald-400">${(overviewKPIs.closedARR / 1000000).toFixed(2)}M</p>
                    </div>
                     <div className="bg-aether-800 border border-aether-700 rounded-xl p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Win Rate</p>
                        <p className="text-2xl font-bold text-blue-400">{overviewKPIs.conversionRatio.toFixed(1)}%</p>
                    </div>
                    <div className="bg-aether-800 border border-aether-700 rounded-xl p-4">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Avg Deal Size</p>
                        <p className="text-2xl font-bold text-white">${(overviewKPIs.avgDealSize / 1000).toFixed(0)}k</p>
                    </div>
                    {/* New KPI: Closed Lost */}
                    <div className="bg-aether-800 border border-aether-700 rounded-xl p-4 group relative cursor-help">
                        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Closed Lost Value</p>
                        <p className="text-2xl font-bold text-rose-400">${(overviewKPIs.closedLostValue / 1000000).toFixed(2)}M</p>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                            {overviewKPIs.closedLostCount} deals lost
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pipeline Funnel with Channels */}
                    <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-2">Pipeline Funnel by Channel</h3>
                        <p className="text-sm text-slate-400 mb-6">Distribution of open opportunities across stages, segmented by acquisition source.</p>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={funnelData}
                                    margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" />
                                    <YAxis dataKey="stage" type="category" stroke="#94a3b8" width={100} fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} cursor={{fill: 'transparent'}} />
                                    <Legend />
                                    {Object.keys(CHANNEL_COLORS).map((channel) => (
                                        <Bar key={channel} dataKey={channel} stackId="a" fill={CHANNEL_COLORS[channel]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Forecast Trend */}
                    <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-2">Forecast vs Actuals</h3>
                        <p className="text-sm text-slate-400 mb-6">6-Month Trend Analysis</p>
                        <div className="h-[350px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={forecastChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="period" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v/1000000}M`} />
                                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                                    <Legend />
                                    <Bar dataKey="closed" name="Closed Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="forecast" name="Projected Pipeline" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.6} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     {/* Stalled Deals Table */}
                     <div className="bg-aether-800 border border-aether-700 rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="p-6 border-b border-aether-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-white">Stalled Opportunities</h3>
                                <p className="text-sm text-slate-400">Deals in current stage &gt; 90 days</p>
                            </div>
                            <div className="flex items-center space-x-2 text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded border border-orange-500/20">
                                <AlertCircle size={12} />
                                <span>Action Required</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-aether-900/50 text-xs uppercase font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Deal Name</th>
                                        <th className="px-6 py-3">Stage</th>
                                        <th className="px-6 py-3 text-right">Value</th>
                                        <th className="px-6 py-3 text-right">Days Stalled</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-aether-700">
                                    {stalledDeals.map((deal) => (
                                        <tr key={deal.DealID} className="hover:bg-aether-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-200">{deal.Vertical} Deal - {deal.DealID}</td>
                                            <td className="px-6 py-4">{deal.Stage}</td>
                                            <td className="px-6 py-4 text-right font-mono">${(deal.Value / 1000).toFixed(0)}k</td>
                                            <td className="px-6 py-4 text-right flex items-center justify-end">
                                                <span className={`font-bold ${deal.DaysInPipeline > 150 ? 'text-rose-500' : deal.DaysInPipeline > 120 ? 'text-orange-500' : 'text-yellow-500'}`}>
                                                    {deal.DaysInPipeline}
                                                </span>
                                                {deal.DaysInPipeline > 150 && <AlertTriangle size={14} className="ml-2 text-rose-500" />}
                                                {deal.DaysInPipeline > 120 && deal.DaysInPipeline <= 150 && <Clock size={14} className="ml-2 text-orange-500" />}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>

                     {/* Closed Lost Analysis */}
                     <div className="bg-aether-800 border border-aether-700 rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="p-6 border-b border-aether-700">
                             <h3 className="text-lg font-bold text-white">Closed Lost Analysis</h3>
                             <p className="text-sm text-slate-400">Review largest losses to identify patterns.</p>
                        </div>
                        <div className="overflow-x-auto flex-1">
                             <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-aether-900/50 text-xs uppercase font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Deal</th>
                                        <th className="px-6 py-3">Owner</th>
                                        <th 
                                            className="px-6 py-3 text-right cursor-pointer hover:text-white flex items-center justify-end"
                                            onClick={() => handleClosedLostSort('Value')}
                                        >
                                            Value <ArrowUpDown size={12} className="ml-1" />
                                        </th>
                                        <th 
                                            className="px-6 py-3 text-right cursor-pointer hover:text-white flex items-center justify-end"
                                            onClick={() => handleClosedLostSort('CloseDate')}
                                        >
                                            Loss Date <ArrowUpDown size={12} className="ml-1" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-aether-700">
                                    {closedLostDeals.map((deal) => (
                                        <tr key={deal.DealID} className="hover:bg-aether-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-200">
                                                {deal.Vertical} - {deal.DealID}
                                                <div className="text-xs text-slate-500">{deal.Channel}</div>
                                            </td>
                                            <td className="px-6 py-4">{deal.Owner}</td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-300">${(deal.Value / 1000).toFixed(0)}k</td>
                                            <td className="px-6 py-4 text-right text-xs">{deal.CloseDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default SalesView;
