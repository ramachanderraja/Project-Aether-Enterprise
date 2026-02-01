
import React, { useMemo } from 'react';
import { CORE_DATA, ACQUISITION_CHANNELS } from '../../constants';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Filter } from 'lucide-react';

const MarketingView: React.FC = () => {
    // Derived Acquisition Data (similar to SalesView logic but expanded)
    const acquisitionData = useMemo(() => {
        return ACQUISITION_CHANNELS.sort((a,b) => b.revenueGenerated - a.revenueGenerated);
    }, []);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

    return (
        <div className="flex flex-col h-full overflow-hidden bg-aether-900 font-sans">
            <div className="bg-aether-900 border-b border-aether-700 p-6 shadow-2xl z-10">
                 <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Marketing Metrics</h2>
                    <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs">Acquisition Efficiency & Channel Performance</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Channel Efficiency Chart */}
                    <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-6">Customer Acquisition by Channel</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={acquisitionData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val/1000}k`} />
                                    <YAxis type="category" dataKey="channel" width={140} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} formatter={(val: number) => `$${val.toLocaleString()}`} />
                                    <Legend />
                                    <Bar dataKey="revenueGenerated" name="Revenue Generated" fill="#10b981" barSize={20} radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="cac" name="CAC (Avg)" fill="#ef4444" barSize={20} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Lead Volume Pie Chart */}
                     <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-bold text-white mb-6">Lead Distribution</h3>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={acquisitionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="leads"
                                        nameKey="channel"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {acquisitionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                 </div>

                 <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Channel Performance Detail</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-aether-900/50 text-xs uppercase font-medium text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Channel</th>
                                    <th className="px-6 py-4 text-right">Leads</th>
                                    <th className="px-6 py-4 text-right">Conv. Rate</th>
                                    <th className="px-6 py-4 text-right">CAC</th>
                                    <th className="px-6 py-4 text-right">Revenue</th>
                                    <th className="px-6 py-4 text-right">Efficiency (Rev/CAC)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-aether-700">
                                {acquisitionData.map((d) => (
                                    <tr key={d.channel} className="hover:bg-aether-700/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{d.channel}</td>
                                        <td className="px-6 py-4 text-right">{d.leads}</td>
                                        <td className="px-6 py-4 text-right">{(d.conversionRate * 100).toFixed(1)}%</td>
                                        <td className="px-6 py-4 text-right text-rose-400">${d.cac.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-emerald-400 font-mono">${d.revenueGenerated.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-400">{(d.revenueGenerated / d.cac).toFixed(1)}x</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingView;
