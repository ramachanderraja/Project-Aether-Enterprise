
import React, { useState } from 'react';
import { ShieldCheck, History, Eye, Lock, FileCheck, AlertOctagon, CheckCircle, Database, Server, Cpu, ArrowRight, X, Workflow } from 'lucide-react';
import { GOVERNANCE_LOGS, MODEL_METRICS, LINEAGE_NODES } from '../../constants';
import { LineageNode } from '../../types';

const GovernanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compliance' | 'lineage'>('compliance');
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);

  const handleNodeClick = (node: LineageNode) => {
      setSelectedNode(node);
  }

  // Calculate dependencies on the fly
  const getDependencies = (node: LineageNode) => {
      const upstream = LINEAGE_NODES.filter(n => node.upstreamIds.includes(n.id));
      const downstream = LINEAGE_NODES.filter(n => n.upstreamIds.includes(node.id));
      return { upstream, downstream };
  };

  return (
    <div className="p-8 h-full overflow-y-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h2 className="text-3xl font-bold text-white">Governance & Transformation</h2>
            <p className="text-slate-400 mt-1">AI Oversight, Regulatory Compliance (SOX), and Audit Trails</p>
        </div>
        <div className="flex bg-aether-800 p-1 rounded-lg border border-aether-700">
            <button 
                onClick={() => setActiveTab('compliance')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'compliance' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                Risk & Compliance
            </button>
            <button 
                onClick={() => setActiveTab('lineage')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'lineage' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                Data Lineage Explorer
            </button>
        </div>
      </div>

      {activeTab === 'compliance' ? (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl flex items-center space-x-4">
                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                        <ShieldCheck className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Overall Risk Score</p>
                        <p className="text-2xl font-bold text-white">Low</p>
                    </div>
                </div>
                <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl flex items-center space-x-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                        <FileCheck className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">SOX Compliance</p>
                        <p className="text-2xl font-bold text-white">Verified</p>
                    </div>
                </div>
                <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl flex items-center space-x-4">
                    <div className="p-3 bg-purple-500/20 rounded-lg">
                        <Lock className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Data Privacy</p>
                        <p className="text-2xl font-bold text-white">Encrypted</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Audit Trail */}
                <div className="bg-aether-800 border border-aether-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-aether-700 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <History className="mr-2" size={18} />
                            Intelligent Audit Trail
                        </h3>
                        <button className="text-xs text-blue-400 hover:text-blue-300">Export Report</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-aether-900/50 text-xs uppercase font-medium text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-aether-700">
                                {GOVERNANCE_LOGS.map((log) => (
                                    <tr key={log.id} className="hover:bg-aether-700/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{log.timestamp.split(' ')[1]}</td>
                                        <td className="px-6 py-4 flex items-center">
                                            <span className={`w-2 h-2 rounded-full mr-2 ${log.type === 'AI_AGENT' ? 'bg-purple-500' : log.type === 'HUMAN' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                                            {log.actor}
                                        </td>
                                        <td className="px-6 py-4 text-slate-200">
                                            <div className="font-medium">{log.action}</div>
                                            <div className="text-xs text-slate-500">{log.details}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                log.riskLevel === 'high' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                log.riskLevel === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                                {log.riskLevel}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* AI Model Health */}
                <div className="bg-aether-800 border border-aether-700 rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-aether-700">
                        <h3 className="text-lg font-semibold text-white flex items-center">
                            <Eye className="mr-2" size={18} />
                            AI Model Monitoring
                        </h3>
                    </div>
                    <div className="p-6 space-y-6">
                        {MODEL_METRICS.map((model, idx) => (
                            <div key={idx} className="bg-aether-900/50 border border-aether-700 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-white">{model.modelName}</h4>
                                    {model.driftDetected ? (
                                        <span className="flex items-center text-xs text-rose-400 font-bold">
                                            <AlertOctagon size={12} className="mr-1" /> Drift Detected
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-xs text-emerald-400">
                                            <CheckCircle size={12} className="mr-1" /> Stable
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Accuracy</span>
                                            <span>{(model.accuracy * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-aether-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${model.accuracy * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Fairness Score (Bias)</span>
                                            <span>{model.biasScore}</span>
                                        </div>
                                        <div className="h-1.5 bg-aether-900 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${model.biasScore > 0.1 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                                                style={{ width: `${(1 - model.biasScore) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 mt-3">Last Retrained: {model.lastRetrained}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
      ) : (
        /* Data Lineage Tab */
        <div className="h-full">
             <div className="bg-aether-800 border border-aether-700 rounded-xl p-8 overflow-x-auto min-h-[600px] flex items-center relative">
                 {/* Background Grid */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] opacity-10 pointer-events-none"></div>

                 <div className="flex space-x-12 min-w-max mx-auto items-center">
                    {/* Source Layer */}
                    <div className="flex flex-col space-y-8">
                        {LINEAGE_NODES.filter(n => n.type === 'source').map(node => (
                            <LineageCard key={node.id} node={node} icon={<Database className="text-blue-400" size={20} />} onClick={handleNodeClick} />
                        ))}
                    </div>

                    <Arrow />

                    {/* Ingestion Layer */}
                    <div className="flex flex-col space-y-8">
                        {LINEAGE_NODES.filter(n => n.id === 'pipe_1').map(node => (
                             <LineageCard key={node.id} node={node} icon={<Server className="text-purple-400" size={20} />} onClick={handleNodeClick} />
                        ))}
                    </div>

                    <Arrow />

                    {/* Storage Layer */}
                    <div className="flex flex-col space-y-8">
                        {LINEAGE_NODES.filter(n => n.type === 'storage').map(node => (
                             <LineageCard key={node.id} node={node} icon={<Database className="text-emerald-400" size={20} />} onClick={handleNodeClick} />
                        ))}
                    </div>

                     <Arrow />
                     
                    {/* Process Layer */}
                    <div className="flex flex-col space-y-8">
                         {LINEAGE_NODES.filter(n => n.id === 'process_dbt' || n.id === 'ai_engine').map(node => (
                             <LineageCard key={node.id} node={node} icon={<Cpu className="text-orange-400" size={20} />} onClick={handleNodeClick} />
                        ))}
                    </div>

                    <Arrow />

                    {/* Consumption Layer */}
                    <div className="flex flex-col space-y-8">
                         {LINEAGE_NODES.filter(n => n.type === 'output').map(node => (
                             <LineageCard key={node.id} node={node} icon={<Eye className="text-blue-400" size={20} />} onClick={handleNodeClick} />
                        ))}
                    </div>
                 </div>
             </div>
             
             {/* Node Details Panel */}
             {selectedNode && (
                 <div className="absolute right-0 top-0 h-full w-80 bg-aether-900/95 border-l border-aether-700 p-6 backdrop-blur-md shadow-2xl animate-in slide-in-from-right duration-200">
                     <div className="flex justify-between items-start mb-6">
                         <h3 className="text-xl font-bold text-white">{selectedNode.label}</h3>
                         <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                             <X size={20} />
                         </button>
                     </div>
                     <div className="space-y-6">
                         <div>
                             <h4 className="text-xs uppercase text-slate-500 font-bold mb-2">Node Type</h4>
                             <span className="px-2 py-1 rounded-md bg-aether-800 border border-aether-700 text-sm capitalize">{selectedNode.type}</span>
                         </div>
                         <div>
                             <h4 className="text-xs uppercase text-slate-500 font-bold mb-2">Description</h4>
                             <p className="text-sm text-slate-300 leading-relaxed">{selectedNode.description}</p>
                         </div>
                         
                         {/* Dependency Visualization */}
                         <div>
                             <h4 className="text-xs uppercase text-slate-500 font-bold mb-2 flex items-center">
                                 <Workflow size={12} className="mr-1" /> Dependencies
                             </h4>
                             <div className="bg-aether-800 rounded-lg p-3 space-y-3">
                                 <div>
                                     <span className="text-xs text-slate-500 block mb-1">Upstream (Inputs)</span>
                                     <div className="flex flex-wrap gap-2">
                                         {getDependencies(selectedNode).upstream.length > 0 ? getDependencies(selectedNode).upstream.map(u => (
                                             <span key={u.id} className="text-xs px-2 py-1 bg-aether-700 rounded text-slate-200">{u.label}</span>
                                         )) : <span className="text-xs text-slate-600 italic">None</span>}
                                     </div>
                                 </div>
                                 <div className="border-t border-aether-700 pt-2">
                                     <span className="text-xs text-slate-500 block mb-1">Downstream (Outputs)</span>
                                     <div className="flex flex-wrap gap-2">
                                        {getDependencies(selectedNode).downstream.length > 0 ? getDependencies(selectedNode).downstream.map(d => (
                                             <span key={d.id} className="text-xs px-2 py-1 bg-aether-700 rounded text-slate-200">{d.label}</span>
                                         )) : <span className="text-xs text-slate-600 italic">None</span>}
                                     </div>
                                 </div>
                             </div>
                         </div>

                         <div>
                             <h4 className="text-xs uppercase text-slate-500 font-bold mb-2">Status</h4>
                             <span className="flex items-center text-sm text-emerald-400">
                                 <CheckCircle size={16} className="mr-2" /> Active
                             </span>
                         </div>
                         <div className="pt-6 border-t border-aether-800">
                             <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                                 View Schema & Logs
                             </button>
                         </div>
                     </div>
                 </div>
             )}
             
             {!selectedNode && (
                <p className="text-center text-slate-500 mt-4 text-sm">
                    End-to-end traceability ensures trust. Click any node to inspect schema and transformation logic.
                </p>
             )}
        </div>
      )}
    </div>
  );
};

const Arrow = () => (
    <div className="text-slate-600">
        <ArrowRight size={24} />
    </div>
);

interface LineageCardProps {
    node: LineageNode;
    icon: React.ReactNode;
    onClick: (node: LineageNode) => void;
}

const LineageCard: React.FC<LineageCardProps> = ({ node, icon, onClick }) => (
    <div 
        onClick={() => onClick(node)}
        className="w-64 p-4 bg-aether-900 border border-aether-700 rounded-lg hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer group"
    >
        <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-aether-800 rounded-md border border-aether-700 group-hover:bg-aether-700">
                {icon}
            </div>
            <div>
                <h4 className="text-slate-200 font-medium text-sm">{node.label}</h4>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{node.type}</span>
            </div>
        </div>
        <p className="text-xs text-slate-400">{node.description}</p>
        <div className="mt-3 flex items-center justify-between border-t border-aether-800 pt-2">
             <span className="text-[10px] text-emerald-500 flex items-center">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1"></div>
                Active
             </span>
             <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">Inspect</span>
        </div>
    </div>
);

export default GovernanceView;
