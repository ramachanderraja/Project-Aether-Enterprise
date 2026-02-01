
import React from 'react';
import { MOCK_GTM_METRICS } from '../../constants';
import { Rocket, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const GTMView: React.FC = () => {
    return (
        <div className="flex flex-col h-full overflow-hidden bg-aether-900 font-sans">
            <div className="bg-aether-900 border-b border-aether-700 p-6 shadow-2xl z-10">
                 <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Go-to-Market Metrics</h2>
                    <p className="text-slate-400 mt-1 uppercase tracking-widest text-xs">Unit Economics & Growth Efficiency</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {MOCK_GTM_METRICS.map((item, idx) => (
                        <div key={idx} className="bg-aether-800 border border-aether-700 rounded-xl p-6 hover:border-blue-500/30 transition-all">
                             <div className="flex justify-between items-start mb-4">
                                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{item.metric}</h3>
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Rocket size={16} className="text-blue-400" />
                                </div>
                             </div>
                             <div className="flex items-baseline space-x-2">
                                 <span className="text-3xl font-bold text-white">
                                    {item.unit === '$' ? '$' : ''}{item.value}{item.unit !== '$' ? item.unit : ''}
                                 </span>
                             </div>
                             <div className="mt-4 flex items-center">
                                {item.trend > 0 ? (
                                    <span className="text-emerald-400 text-xs font-bold flex items-center">
                                        <TrendingUp size={12} className="mr-1" /> +{item.trend}%
                                    </span>
                                ) : item.trend < 0 ? (
                                    <span className="text-rose-400 text-xs font-bold flex items-center">
                                        <TrendingDown size={12} className="mr-1" /> {item.trend}%
                                    </span>
                                ) : (
                                    <span className="text-slate-400 text-xs font-bold flex items-center">
                                        <Minus size={12} className="mr-1" /> 0%
                                    </span>
                                )}
                                <span className="text-slate-500 text-xs ml-2">vs last quarter</span>
                             </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-aether-800 border border-aether-700 rounded-xl p-8 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Metrics Explanation</h3>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                        These metrics define the efficiency of our growth engine. 
                        An LTV:CAC ratio above 3x indicates a healthy business model. 
                        Payback period under 12 months allows for faster reinvestment of capital.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GTMView;
