import React from 'react';
import { Database, CheckCircle, AlertCircle, Share2, Server } from 'lucide-react';
import { SYSTEM_NODES } from '../../constants';

const DataFabricView: React.FC = () => {
  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white">Unified Data Fabric</h2>
        <p className="text-slate-400 mt-1">Live Integration Status & Data Lineage</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Node Status */}
        <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <Server className="mr-2 text-blue-400" />
                Connected Source Systems
            </h3>
            <div className="space-y-4">
                {SYSTEM_NODES.map(node => (
                    <div key={node.id} className="flex items-center justify-between p-4 bg-aether-900/50 rounded-lg border border-aether-700">
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${node.status === 'healthy' ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
                                <Database size={20} className={node.status === 'healthy' ? 'text-emerald-400' : 'text-orange-400'} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium">{node.name}</h4>
                                <span className="text-xs text-slate-500">{node.type} • Last sync: {node.lastSync}</span>
                            </div>
                        </div>
                        <div>
                             {node.status === 'healthy' ? (
                                 <span className="flex items-center text-emerald-400 text-sm bg-emerald-500/10 px-2 py-1 rounded">
                                     <CheckCircle size={14} className="mr-1" /> Active
                                 </span>
                             ) : (
                                <span className="flex items-center text-orange-400 text-sm bg-orange-500/10 px-2 py-1 rounded">
                                    <AlertCircle size={14} className="mr-1" /> Latency
                                </span>
                             )}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-aether-700">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-slate-400 text-sm">Data Quality Score</p>
                        <p className="text-2xl font-bold text-white">98.2%</p>
                    </div>
                    <div className="h-2 w-32 bg-aether-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[98%]"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Digital Twin Representation (Abstract) */}
        <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            
            <div className="relative z-10 text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">Digital Twin of Organization</h3>
                <p className="text-slate-400 text-sm">Real-time Signal Processing</p>
            </div>

            {/* Central Node */}
            <div className="relative">
                <div className="w-32 h-32 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-400/50 shadow-[0_0_50px_rgba(59,130,246,0.3)] animate-pulse">
                    <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-400/80">
                         <Share2 size={40} className="text-blue-100" />
                    </div>
                </div>

                {/* Satellite Nodes (CSS Animation) */}
                <div className="absolute top-0 left-0 w-full h-full animate-[spin_10s_linear_infinite]">
                     <div className="absolute -top-8 left-1/2 w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                     <div className="absolute top-1/2 -right-12 w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_#a855f7]"></div>
                     <div className="absolute -bottom-6 left-1/4 w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]"></div>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-4 w-full text-center">
                 <div className="p-3 bg-aether-900/50 rounded-lg border border-aether-700">
                    <p className="text-xs text-slate-500">Signals Processed</p>
                    <p className="text-lg font-mono text-white">1.2M/s</p>
                 </div>
                 <div className="p-3 bg-aether-900/50 rounded-lg border border-aether-700">
                    <p className="text-xs text-slate-500">Active Agents</p>
                    <p className="text-lg font-mono text-white">14</p>
                 </div>
                 <div className="p-3 bg-aether-900/50 rounded-lg border border-aether-700">
                    <p className="text-xs text-slate-500">Auto-Corrections</p>
                    <p className="text-lg font-mono text-white">23</p>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DataFabricView;
