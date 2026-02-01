
import React, { useState, useMemo } from 'react';
import { CORE_DATA, PRODUCT_PROFITABILITY, SAAS_METRICS_TREND, REGIONS, LOBS, VERTICALS } from '../../constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer, LineChart, Line, Cell, ReferenceLine, ComposedChart } from 'recharts';
import { TrendingUp, DollarSign, Layers, RefreshCw, Filter, ArrowRight, CornerDownRight, UserPlus, UserMinus, X, TrendingDown, AlertTriangle, ArrowDownRight } from 'lucide-react';

const RevenueView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'waterfall' | 'products' | 'saas'>('waterfall');
    const [filterRegion, setFilterRegion] = useState('All');
    const [filterLOB, setFilterLOB] = useState('All');
    const [filterVertical, setFilterVertical] = useState('All');
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

    // Helper to calculate a multiplier for simulated data filtering
    const getFilterMultiplier = () => {
        let m = 1;
        if (filterRegion !== 'All') m *= 0.35; // Rough estimate of region split
        if (filterLOB !== 'All') m *= 0.5;
        if (filterVertical !== 'All') m *= 0.2;
        return m;
    };

    // Derived Waterfall Data (ARR Bridge)
    const waterfallData = useMemo(() => {
        const multiplier = getFilterMultiplier();
        const base = 58000000 * multiplier; 
        const newSales = 4500000 * multiplier;
        const expansion = 1200000 * multiplier;
        const contraction = -800000 * multiplier;
        const churn = -1500000 * multiplier;
        const ending = base + newSales + expansion + contraction + churn;

        const scale = (val: number) => val / 1000000;

        return [
            { name: 'Opening ARR', start: 0, value: scale(base), type: 'base', raw: base },
            { name: 'New Sales', start: scale(base), value: scale(newSales), type: 'add', raw: newSales },
            { name: 'Expansion', start: scale(base + newSales), value: scale(expansion), type: 'add', raw: expansion },
            { name: 'Contraction', start: scale(base + newSales + expansion + contraction), value: scale(Math.abs(contraction)), type: 'minus', raw: contraction },
            { name: 'Churn', start: scale(ending), value: scale(Math.abs(churn)), type: 'minus', raw: churn },
            { name: 'Ending ARR', start: 0, value: scale(ending), type: 'final', raw: ending }
        ];
    }, [filterRegion, filterLOB, filterVertical]);

    // Derived Product Data
    const productData = useMemo(() => {
        let data = PRODUCT_PROFITABILITY;
        // Filter by LOB if selected
        if (filterLOB !== 'All') {
            data = data.filter(p => p.lob === filterLOB);
        }
        
        // Simulate Region/Vertical impact by scaling revenue numbers
        const multiplier = 1 * (filterRegion !== 'All' ? 0.35 : 1) * (filterVertical !== 'All' ? 0.2 : 1);
        
        return data.map(p => ({
            ...p,
            revenue: p.revenue * multiplier,
            cogs: p.cogs * multiplier
        }));
    }, [filterLOB, filterRegion, filterVertical]);

    // Drilldown Data generator
    const drilldownData = useMemo(() => {
        if (!selectedProduct) return { byRegion: [], byLOB: [] };
        const regions = ['AMER', 'EMEA', 'APAC'];
        const lobs = ['Software', 'Services'];

        const byRegion = regions.map(r => ({
            region: r,
            revenue: Math.random() * 1000000,
            cogs: Math.random() * 400000
        }));

        const byLOB = lobs.map(l => ({
            lob: l,
            revenue: Math.random() * 1500000,
            cogs: Math.random() * 600000
        }));
        
        return { byRegion, byLOB };
    }, [selectedProduct]);

    // Derived SaaS Trends
    const saasData = useMemo(() => {
        const multiplier = getFilterMultiplier();
        return SAAS_METRICS_TREND.map(d => ({
            ...d,
            arr: d.arr * multiplier,
            mrr: d.mrr * multiplier,
            // Rule of 40 might vary by segment, let's add some noise based on filter
            ruleOf40: d.ruleOf40 + (filterRegion === 'EMEA' ? -5 : 0)
        }));
    }, [filterRegion, filterLOB, filterVertical]);


    // Custom Y Axis Tick to show alerts
    const CustomYAxisTick = (props: any) => {
        const { x, y, payload } = props;
        const product = productData.find(p => p.productName === payload.value);
        const isLowMargin = product && product.contributionMargin < 0.3;

        return (
            <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={4} textAnchor="end" fill="#94a3b8" fontSize={12}>
                    {payload.value}
                </text>
                {isLowMargin && (
                    <text x={-10} y={-15} textAnchor="middle" fill="#f59e0b" fontSize={14}>⚠️</text>
                )}
            </g>
        );
    };

    const renderWaterfall = () => (
        <div className="grid grid-cols-1 gap-6 h-full">
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-2">ARR Growth Bridge</h3>
                <p className="text-sm text-slate-400 mb-6">Visualizing the components of revenue change for the period.</p>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={waterfallData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val.toFixed(1)}M`} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                                formatter={(val: number, name: string, props: any) => [`$${props.payload.raw.toLocaleString()}`, name]}
                            />
                            <ReferenceLine y={0} stroke="#64748b" />
                            <Bar dataKey="start" stackId="a" fill="transparent" />
                            <Bar dataKey="value" stackId="a">
                                {waterfallData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={
                                        entry.type === 'base' || entry.type === 'final' ? '#3b82f6' :
                                        entry.type === 'add' ? '#10b981' : '#ef4444'
                                    } />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6">
                <div className="bg-aether-900/50 border border-aether-700 p-4 rounded-xl text-center flex flex-col items-center">
                    <p className="text-slate-500 text-xs uppercase mb-2">New Business</p>
                    <div className="p-2 bg-emerald-500/10 rounded-full mb-2">
                        <UserPlus size={20} className="text-emerald-400" />
                    </div>
                    <p className="text-xl font-bold text-emerald-400">
                        ${waterfallData[1].raw.toLocaleString()}
                    </p>
                </div>
                <div className="bg-aether-900/50 border border-aether-700 p-4 rounded-xl text-center flex flex-col items-center">
                    <p className="text-slate-500 text-xs uppercase mb-2">Expansion</p>
                    <div className="p-2 bg-blue-500/10 rounded-full mb-2">
                        <TrendingUp size={20} className="text-blue-400" />
                    </div>
                    <p className="text-xl font-bold text-blue-400">
                         ${waterfallData[2].raw.toLocaleString()}
                    </p>
                </div>
                <div className="bg-aether-900/50 border border-aether-700 p-4 rounded-xl text-center flex flex-col items-center">
                    <p className="text-slate-500 text-xs uppercase mb-2">Contraction</p>
                    <div className="p-2 bg-orange-500/10 rounded-full mb-2">
                        <ArrowDownRight size={20} className="text-orange-400" />
                    </div>
                    <p className="text-xl font-bold text-orange-400">
                        ${Math.abs(waterfallData[3].raw).toLocaleString()}
                    </p>
                </div>
                 <div className="bg-aether-900/50 border border-aether-700 p-4 rounded-xl text-center flex flex-col items-center">
                    <p className="text-slate-500 text-xs uppercase mb-2">Churn Impact</p>
                    <div className="p-2 bg-rose-500/10 rounded-full mb-2">
                        <UserMinus size={20} className="text-rose-400" />
                    </div>
                    <p className="text-xl font-bold text-rose-400">
                        ${waterfallData[4].raw.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );

    const renderProducts = () => (
        <div className="grid grid-cols-1 gap-8 relative">
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-lg font-bold text-white">Product & Service Line Profitability</h3>
                        <p className="text-sm text-slate-400">Click on a product bar to see regional breakdown.</p>
                    </div>
                    <div className="flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                        <AlertTriangle size={12} className="mr-1" />
                        <span>Margin &lt; 30% Alert</span>
                    </div>
                </div>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                            data={productData} 
                            layout="vertical" 
                            margin={{ left: 20, right: 20 }}
                            onClick={(data) => {
                                if (data && data.activePayload) {
                                    setSelectedProduct(data.activePayload[0].payload.productName);
                                }
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                            <YAxis 
                                dataKey="productName" 
                                type="category" 
                                width={150} 
                                stroke="#94a3b8" 
                                tick={(props) => <CustomYAxisTick {...props} />} 
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} formatter={(val: number) => `$${val.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" barSize={20} cursor="pointer" />
                            <Bar dataKey="cogs" name="COGS" fill="#ef4444" barSize={20} cursor="pointer" />
                            <Line dataKey="grossMargin" name="Gross Margin %" stroke="#10b981" strokeWidth={3} type="monotone" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            {/* Drilldown Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-2xl w-full max-w-4xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                             <div className="flex items-center">
                                <CornerDownRight className="text-blue-400 mr-2" />
                                <h4 className="text-lg font-bold text-white">Drill-down: {selectedProduct}</h4>
                            </div>
                            <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-aether-900/50 p-4 rounded-xl border border-aether-700">
                                <h5 className="text-sm font-bold text-slate-300 mb-4">By Region</h5>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={drilldownData.byRegion}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="region" stroke="#94a3b8" fontSize={12} />
                                            <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v/1000}k`} fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} 
                                                formatter={(val: number) => `$${Math.round(val).toLocaleString()}`}
                                            />
                                            <Legend />
                                            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                                            <Bar dataKey="cogs" fill="#ef4444" name="COGS" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-aether-900/50 p-4 rounded-xl border border-aether-700">
                                <h5 className="text-sm font-bold text-slate-300 mb-4">By LOB</h5>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={drilldownData.byLOB}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="lob" stroke="#94a3b8" fontSize={12} />
                                            <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v/1000}k`} fontSize={12} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} 
                                                formatter={(val: number) => `$${Math.round(val).toLocaleString()}`}
                                            />
                                            <Legend />
                                            <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" />
                                            <Bar dataKey="cogs" fill="#ef4444" name="COGS" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productData.map(product => (
                    <div key={product.productName} className={`p-4 bg-aether-900/50 border rounded-lg ${product.contributionMargin < 0.3 ? 'border-yellow-500/40' : 'border-aether-700'}`}>
                        <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white mb-2">{product.productName}</h4>
                            {product.contributionMargin < 0.3 && (
                                <AlertTriangle size={16} className="text-yellow-500" />
                            )}
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Contribution Margin</span>
                            <span className={`font-mono font-bold ${product.contributionMargin > 0.5 ? 'text-emerald-400' : product.contributionMargin < 0.3 ? 'text-yellow-400' : 'text-blue-400'}`}>
                                {(product.contributionMargin * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-aether-900 h-2 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${product.contributionMargin < 0.3 ? 'bg-yellow-500' : 'bg-blue-500'}`} 
                                style={{ width: `${product.contributionMargin * 100}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Embedded SaaS Metrics Section */}
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                    <RefreshCw className="mr-2 text-blue-400" size={20} />
                    Key SaaS Metrics Context
                </h3>
                <div className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={saasData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val.toFixed(1)}M`} label={{ value: 'MRR', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `${(val * 100).toFixed(1)}%`} label={{ value: 'Churn Rate', angle: 90, position: 'insideRight', fill: '#94a3b8' }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} 
                                formatter={(val: number, name: string) => {
                                    if (name === 'Churn Rate') return `${(val * 100).toFixed(2)}%`;
                                    return `$${val.toFixed(2)}M`;
                                }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="mrr" name="MRR" fill="#3b82f6" barSize={30} />
                            <Line yAxisId="right" type="monotone" dataKey="churnRate" name="Churn Rate" stroke="#ef4444" strokeWidth={3} dot={{r:4}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="p-3 bg-aether-900 rounded border border-aether-700 text-center">
                        <span className="text-xs text-slate-500 uppercase">LTV : CAC</span>
                        <span className="block text-xl font-bold text-white mt-1">5.7x</span>
                    </div>
                    <div className="p-3 bg-aether-900 rounded border border-aether-700 text-center">
                         <span className="text-xs text-slate-500 uppercase">Magic Number</span>
                        <span className="block text-xl font-bold text-white mt-1">1.2</span>
                    </div>
                    <div className="p-3 bg-aether-900 rounded border border-aether-700 text-center">
                         <span className="text-xs text-slate-500 uppercase">Net Burn</span>
                        <span className="block text-xl font-bold text-rose-400 mt-1">$1.5M</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSaaS = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl">
                    <p className="text-slate-400 text-sm uppercase">Filtered ARR</p>
                    <p className="text-3xl font-bold text-white mt-1">
                        ${saasData[saasData.length-1].arr.toFixed(1)}M
                    </p>
                    <p className="text-emerald-400 text-sm mt-2 flex items-center"><TrendingUp size={14} className="mr-1" /> +21% YoY</p>
                </div>
                <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl">
                    <p className="text-slate-400 text-sm uppercase">Net Revenue Retention (NRR)</p>
                    <p className="text-3xl font-bold text-blue-400 mt-1">
                        {(saasData[saasData.length-1].nrr * 100).toFixed(0)}%
                    </p>
                    <p className="text-slate-500 text-sm mt-2">Best-in-class</p>
                </div>
                <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl">
                    <p className="text-slate-400 text-sm uppercase">LTV : CAC Ratio</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1">5.7x</p>
                    <p className="text-slate-500 text-sm mt-2">Efficient Growth</p>
                </div>
            </div>

            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-6">Recurring Revenue & Churn Trends</h3>
                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={saasData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val.toFixed(1)}M`} label={{ value: 'MRR ($M)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={(val) => `${(val * 100).toFixed(1)}%`} label={{ value: 'Churn Rate', angle: 90, position: 'insideRight', fill: '#94a3b8' }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} 
                                formatter={(val: number, name: string) => {
                                    if (name === 'Churn Rate') return `${(val * 100).toFixed(2)}%`;
                                    return `$${val.toFixed(2)}M`;
                                }}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="mrr" name="MRR" fill="#3b82f6" barSize={30} />
                            <Line yAxisId="right" type="monotone" dataKey="churnRate" name="Churn Rate" stroke="#ef4444" strokeWidth={3} dot={{r:4}} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden bg-aether-900 font-sans">
            <div className="bg-aether-900 border-b border-aether-700 p-6 shadow-2xl z-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Revenue & Profitability</h2>
                        <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs">Margin Analysis & Growth Metrics</p>
                    </div>
                    <div className="flex bg-aether-800 p-1 rounded-lg border border-aether-700">
                        <button onClick={() => setActiveTab('waterfall')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'waterfall' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            <Layers size={16} className="mr-2" /> Drivers
                        </button>
                        <button onClick={() => setActiveTab('products')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            <DollarSign size={16} className="mr-2" /> Products
                        </button>
                        <button onClick={() => setActiveTab('saas')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center ${activeTab === 'saas' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                            <RefreshCw size={16} className="mr-2" /> SaaS KPIs
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap gap-4 p-4 bg-aether-800/50 rounded-xl border border-aether-700">
                    <div className="flex items-center space-x-2">
                        <Filter className="text-slate-400" size={16} />
                        <span className="text-sm font-semibold text-slate-300">Filters:</span>
                    </div>
                    
                    <select 
                        value={filterRegion}
                        onChange={(e) => setFilterRegion(e.target.value)}
                        className="bg-aether-900 border border-aether-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="All">All Regions</option>
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>

                    <select 
                        value={filterLOB}
                        onChange={(e) => setFilterLOB(e.target.value)}
                        className="bg-aether-900 border border-aether-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="All">All Lines of Business</option>
                        {LOBS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>

                    <select 
                        value={filterVertical}
                        onChange={(e) => setFilterVertical(e.target.value)}
                        className="bg-aether-900 border border-aether-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="All">All Verticals</option>
                        {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'waterfall' && renderWaterfall()}
                {activeTab === 'products' && renderProducts()}
                {activeTab === 'saas' && renderSaaS()}
            </div>
        </div>
    );
};

export default RevenueView;
