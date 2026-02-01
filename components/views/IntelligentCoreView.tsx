
import React, { useState, useEffect } from 'react';
import { Activity, Brain, Server, GitBranch, Database, Zap, Cpu, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { MODEL_METRICS } from '../../constants';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const IntelligentCoreView: React.FC = () => {
  // Mock time-series data for system load
  const systemLoadData = [
    { time: '10:00', load: 45, latency: 120 },
    { time: '10:05', load: 48, latency: 125 },
    { time: '10:10', load: 52, latency: 130 },
    { time: '10:15', load: 65, latency: 150 }, // Spike
    { time: '10:20', load: 55, latency: 135 },
    { time: '10:25', load: 48, latency: 122 },
    { time: '10:30', load: 42, latency: 118 },
  ];

  const [retrainingState, setRetrainingState] = useState<{[key: string]: number}>({});

  const startRetraining = (modelName: string) => {
      if (retrainingState[modelName] !== undefined && retrainingState[modelName] < 100) return; // Already training
      setRetrainingState(prev => ({...prev, [modelName]: 0}));
  };

  useEffect(() => {
      const interval = setInterval(() => {
          setRetrainingState(prev => {
              const nextState = {...prev};
              let changed = false;
              Object.keys(nextState).forEach(key => {
                  if (nextState[key] < 100) {
                      nextState[key] = Math.min(100, nextState[key] + 5); // Increment progress
                      changed = true;
                  }
              });
              return changed ? nextState : prev;
          });
      }, 500);
      return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Brain className="mr-3 text-purple-400" />
            Intelligent Core
          </h2>
          <p className="text-slate-400 mt-1">Central Neural Engine Status & Model Registry</p>
        </div>
        <div className="flex items-center space-x-2">
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Activity size={14} className="mr-2 animate-pulse" />
                System Online
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: System Stats */}
        <div className="space-y-6">
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Server className="mr-2 text-blue-400" size={18} />
                    Compute Resources
                </h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>GPU Utilization (H100 Cluster)</span>
                            <span className="text-blue-400 font-mono">68%</span>
                        </div>
                        <div className="h-2 bg-aether-900 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[68%] relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Memory Allocation</span>
                            <span className="text-purple-400 font-mono">42%</span>
                        </div>
                        <div className="h-2 bg-aether-900 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 w-[42%]"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>API Token Consumption (Hourly)</span>
                            <span className="text-emerald-400 font-mono">12.5k</span>
                        </div>
                        <div className="h-2 bg-aether-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[25%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                 <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Zap className="mr-2 text-yellow-400" size={18} />
                    System Latency (ms)
                </h3>
                <div className="h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={systemLoadData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 10}} />
                            <YAxis stroke="#64748b" tick={{fontSize: 10}} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                                itemStyle={{ color: '#fbbf24' }}
                            />
                            <Line type="monotone" dataKey="latency" stroke="#fbbf24" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Center Column: Active Models */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                        <GitBranch className="mr-2 text-emerald-400" size={18} />
                        Active Model Registry
                    </h3>
                    <button 
                        onClick={() => MODEL_METRICS.forEach(m => startRetraining(m.modelName))}
                        className="text-xs flex items-center bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <RefreshCw size={12} className="mr-1" /> Retrain All
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MODEL_METRICS.map((model, idx) => {
                        const progress = retrainingState[model.modelName];
                        const isRetraining = progress !== undefined && progress < 100;

                        return (
                            <div key={idx} className="bg-aether-900/50 border border-aether-700 rounded-lg p-5 relative overflow-hidden group hover:border-blue-500/50 transition-all">
                                {/* Individual Retrain Action */}
                                <div className="absolute top-4 right-4 flex items-center space-x-2">
                                    <button 
                                        onClick={() => startRetraining(model.modelName)}
                                        disabled={isRetraining}
                                        className="p-1.5 bg-aether-800 hover:bg-aether-700 text-slate-400 hover:text-white rounded-md transition-colors border border-aether-700"
                                        title="Retrain Model"
                                    >
                                        <RefreshCw size={14} className={isRetraining ? "animate-spin text-blue-400" : ""} />
                                    </button>
                                </div>

                                <div className="flex justify-between items-start mb-3">
                                    <div className="pr-10">
                                        <h4 className="font-medium text-slate-200">{model.modelName.replace(/_/g, ' ')}</h4>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">v{2.0 + idx}.0</span>
                                            {isRetraining ? (
                                                <span className="text-[10px] text-blue-400 font-bold">Training...</span>
                                            ) : model.driftDetected ? (
                                                <span className="text-[10px] text-rose-400 font-bold">Drift</span>
                                            ) : (
                                                <span className="text-[10px] text-emerald-400 font-bold">Stable</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex space-x-6 text-sm mb-4">
                                    <div>
                                        <p className="text-slate-500 text-xs">Accuracy</p>
                                        <p className="text-white font-mono">{(model.accuracy * 100).toFixed(1)}%</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Bias Score</p>
                                        <p className={`${model.biasScore < 0.05 ? 'text-emerald-400' : 'text-orange-400'} font-mono`}>{model.biasScore}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-xs">Last Retrained</p>
                                        <p className="text-slate-300">{model.lastRetrained}</p>
                                    </div>
                                </div>

                                <div className="w-full bg-aether-900 h-1.5 rounded-full overflow-hidden relative">
                                    {/* Main accuracy bar or Retraining Progress */}
                                    {isRetraining ? (
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    ) : (
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${model.accuracy * 100}%` }}></div>
                                    )}
                                </div>
                                {isRetraining && (
                                    <p className="text-[10px] text-blue-400 mt-1 text-right">Progress: {progress}%</p>
                                )}
                            </div>
                        );
                    })}

                    {/* Placeholder for a new model being trained */}
                    <div className="bg-aether-900/30 border border-aether-700 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-slate-500 hover:bg-aether-800/50 transition-colors cursor-pointer">
                        <Database className="mb-2 opacity-50" />
                        <span className="text-sm font-medium">Deploy New Model</span>
                    </div>
                 </div>
            </div>

            {/* Recent Automated Actions */}
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Cpu className="mr-2 text-indigo-400" size={18} />
                    Autonomous Decisions Log
                </h3>
                <div className="space-y-0">
                    {[
                        { time: '10:42 AM', action: 'Auto-scaled Inference Nodes', detail: 'Increased from 2 to 4 nodes due to latency spike.', status: 'success' },
                        { time: '10:15 AM', action: 'Forecast Adjustment', detail: 'Updated Q3 Revenue prediction based on new CRM pipeline data.', status: 'success' },
                        { time: '09:30 AM', action: 'Anomaly Alert', detail: 'Flagged unusual OpEx transaction in Marketing cost center.', status: 'warning' },
                        { time: '08:00 AM', action: 'Daily Data Ingestion', detail: 'Completed sync from Snowflake Data Warehouse.', status: 'success' },
                    ].map((log, i) => (
                        <div key={i} className="flex items-start space-x-4 p-3 hover:bg-aether-900/50 rounded-lg transition-colors border-b border-aether-700/50 last:border-0">
                            <span className="text-xs text-slate-500 font-mono w-16 mt-1">{log.time}</span>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-200">{log.action}</p>
                                <p className="text-xs text-slate-400">{log.detail}</p>
                            </div>
                            {log.status === 'success' ? (
                                <CheckCircle size={16} className="text-emerald-500 mt-1" />
                            ) : (
                                <Activity size={16} className="text-orange-500 mt-1" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default IntelligentCoreView;
