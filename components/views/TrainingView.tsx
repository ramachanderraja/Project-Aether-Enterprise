
import React, { useState } from 'react';
import { BookOpen, TrendingUp, Banknote, BrainCircuit, LineChart, ShieldCheck, ChevronRight, Lightbulb, Zap, Search, Database, Users, Briefcase, Layers, ArrowDown, Activity, DollarSign, PieChart, GitBranch, Lock, Network, FileBarChart, Rocket, Megaphone } from 'lucide-react';

// Helper Icon for lists
const CheckCircleIcon = ({className, size}: {className?: string, size?: number}) => (
    <div className={className}><Activity size={size} /></div>
);

// Helper Icon for filters
const Filter = ({className, size}: {className?: string, size?: number}) => (
     <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);

const ArchitectureDiagram = () => (
  <div className="relative p-8 bg-aether-900 rounded-xl border border-aether-700 overflow-hidden my-6 shadow-2xl">
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
    <div className="relative z-10 flex flex-col items-center">
      
      {/* Top Layer: Experience */}
      <div className="w-full max-w-3xl p-4 border border-blue-500/30 bg-blue-900/10 rounded-xl text-center relative backdrop-blur-sm">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-aether-900 px-3 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/30 rounded-full">
            Executive Experience Layer
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2">
             <div className="p-3 bg-aether-800 rounded border border-aether-700 flex flex-col items-center">
                <Activity size={16} className="text-blue-400 mb-2"/>
                <span className="text-xs font-semibold text-slate-200">Command Center</span>
             </div>
             <div className="p-3 bg-aether-800 rounded border border-aether-700 flex flex-col items-center">
                <Zap size={16} className="text-yellow-400 mb-2"/>
                <span className="text-xs font-semibold text-slate-200">Aether Agent</span>
             </div>
             <div className="p-3 bg-aether-800 rounded border border-aether-700 flex flex-col items-center">
                <LineChart size={16} className="text-emerald-400 mb-2"/>
                <span className="text-xs font-semibold text-slate-200">Scenario Engine</span>
             </div>
        </div>
      </div>

      {/* Connector */}
      <div className="h-8 w-px bg-gradient-to-b from-blue-500/50 to-purple-500/50 my-1"></div>
      <ArrowDown size={16} className="text-purple-500/50 -mt-2" />

      {/* Middle Layer: Intelligence */}
      <div className="w-full max-w-4xl flex space-x-6">
         {/* Agents */}
         <div className="flex-1 p-4 border border-emerald-500/30 bg-emerald-900/10 rounded-xl text-center relative backdrop-blur-sm">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-aether-900 px-3 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30 rounded-full">
                Agent Orchestration
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-aether-800 p-2 rounded text-[10px] text-slate-300 border border-aether-700">Root Cause Analysis</div>
                <div className="bg-aether-800 p-2 rounded text-[10px] text-slate-300 border border-aether-700">Plan Generation</div>
                <div className="bg-aether-800 p-2 rounded text-[10px] text-slate-300 border border-aether-700">Budget Seeding</div>
                <div className="bg-aether-800 p-2 rounded text-[10px] text-slate-300 border border-aether-700">Audit Sentinel</div>
            </div>
         </div>

         {/* Core Models */}
         <div className="flex-1 p-4 border border-purple-500/30 bg-purple-900/10 rounded-xl text-center relative backdrop-blur-sm">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-aether-900 px-3 text-purple-400 text-[10px] font-bold uppercase tracking-widest border border-purple-500/30 rounded-full">
                The Intelligent Core
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-aether-800 p-2 rounded text-[10px] text-slate-300 border border-aether-700">Predictive Forecasting</div>
                <div className="bg-aether-800 p-2 rounded text-[10px] text-slate-300 border border-aether-700">Anomaly Detection</div>
                <div className="bg-aether-800 p-2 rounded text-[10px] text-slate-300 border border-aether-700">Monte Carlo Sim</div>
                <div className="bg-aether-800 p-2 rounded text-[10px] text-slate-300 border border-aether-700">Driver Analysis (SHAP)</div>
            </div>
         </div>
      </div>

      {/* Connector */}
      <div className="h-8 w-px bg-gradient-to-b from-purple-500/50 to-slate-500/50 my-1"></div>
      <ArrowDown size={16} className="text-slate-500/50 -mt-2" />

      {/* Bottom Layer: Data */}
       <div className="w-full max-w-3xl p-4 border border-slate-600/30 bg-slate-800/20 rounded-xl text-center relative backdrop-blur-sm">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-aether-900 px-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-slate-600/30 rounded-full">
            Unified Data Fabric (Snowflake / dbt)
        </div>
        <div className="flex justify-center space-x-12 pt-4">
            <div className="flex flex-col items-center text-slate-500">
                <div className="p-2 bg-aether-800 rounded-full border border-aether-700 mb-2"><Database size={16} /></div>
                <span className="text-[10px] font-bold">ERP (SAP S/4)</span>
            </div>
            <div className="flex flex-col items-center text-slate-500">
                <div className="p-2 bg-aether-800 rounded-full border border-aether-700 mb-2"><Users size={16} /></div>
                <span className="text-[10px] font-bold">CRM (Salesforce)</span>
            </div>
            <div className="flex flex-col items-center text-slate-500">
                 <div className="p-2 bg-aether-800 rounded-full border border-aether-700 mb-2"><Briefcase size={16} /></div>
                <span className="text-[10px] font-bold">HRIS (Workday)</span>
            </div>
             <div className="flex flex-col items-center text-slate-500">
                 <div className="p-2 bg-aether-800 rounded-full border border-aether-700 mb-2"><Layers size={16} /></div>
                <span className="text-[10px] font-bold">Market Data</span>
            </div>
        </div>
      </div>
    </div>
  </div>
);

const SECTIONS = [
    {
        id: 'overview',
        title: 'System Architecture',
        icon: BookOpen,
        color: 'text-blue-400',
        content: (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Project Aether Overview</h3>
                    <p className="text-slate-300 leading-relaxed mb-6">
                        Aether is not just a reporting tool; it is an <strong>Autonomous Financial Operating System</strong>. 
                        It moves beyond static "rear-view mirror" reporting to provide forward-looking intelligence, 
                        automating the analysis that usually consumes 70% of FP&A capacity.
                    </p>
                    <ArchitectureDiagram />
                    <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl mt-6">
                         <h4 className="font-bold text-white mb-3">Core Capabilities</h4>
                         <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                             <li className="flex items-start"><CheckCircleIcon className="text-emerald-400 mr-2 flex-shrink-0" size={16} /> <span><strong>Digital Twin:</strong> Real-time replication of financial processes.</span></li>
                             <li className="flex items-start"><CheckCircleIcon className="text-emerald-400 mr-2 flex-shrink-0" size={16} /> <span><strong>Generative Reasoning:</strong> LLMs that explain "Why" numbers changed.</span></li>
                             <li className="flex items-start"><CheckCircleIcon className="text-emerald-400 mr-2 flex-shrink-0" size={16} /> <span><strong>Auto-Correction:</strong> Agents that can fix data errors or re-forecast.</span></li>
                             <li className="flex items-start"><CheckCircleIcon className="text-emerald-400 mr-2 flex-shrink-0" size={16} /> <span><strong>Explainable AI:</strong> Every prediction is backed by driver analysis (SHAP).</span></li>
                         </ul>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'sales',
        title: 'Sales Performance',
        icon: TrendingUp,
        color: 'text-emerald-400',
        content: (
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">The Revenue Engine</h3>
                    <p className="text-slate-400 mb-6">
                        The Sales Performance module provides a granular view of the organization's revenue generation capability, 
                        bridging the gap between CRM data and financial outcomes.
                    </p>
                </div>

                <div className="space-y-6">
                     <div className="p-5 bg-aether-800 rounded-xl border border-aether-700">
                        <h4 className="font-bold text-white flex items-center mb-3">
                            <Filter size={18} className="mr-2 text-emerald-400" />
                            Filtering & Segmentation
                        </h4>
                        <p className="text-sm text-slate-300 mb-3">
                            Users can slice data across three distinct dimensions to isolate performance drivers:
                        </p>
                        <ul className="list-disc list-inside text-sm text-slate-400 space-y-1 ml-2">
                            <li><strong>Region:</strong> AMER, EMEA, APAC.</li>
                            <li><strong>Line of Business (LOB):</strong> Software (High Margin) vs. Services (Low Margin).</li>
                            <li><strong>Vertical:</strong> CPG, TMT, Manufacturing, etc.</li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 bg-aether-900/50 rounded-xl border border-aether-700">
                             <h4 className="font-bold text-white mb-2">Sales Funnel Analysis</h4>
                             <p className="text-sm text-slate-400">
                                Tracks the conversion volume at every stage from "Prospecting" to "Closed Won". 
                                Includes a channel breakdown (e.g., Organic vs. Paid) to identify the most effective lead sources.
                             </p>
                        </div>
                        <div className="p-5 bg-aether-900/50 rounded-xl border border-aether-700">
                             <h4 className="font-bold text-white mb-2">Stalled Opportunities</h4>
                             <p className="text-sm text-slate-400">
                                Proactively alerts on deals stuck in a stage for too long (>90 days). 
                                <span className="text-orange-400 font-bold"> Orange</span> alerts for >120 days, 
                                <span className="text-rose-400 font-bold"> Red</span> alerts for >150 days.
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'reports',
        title: 'Profitability Reports',
        icon: FileBarChart,
        color: 'text-blue-400',
        content: (
            <div className="space-y-8 animate-fade-in">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">Strategic Profitability Analysis</h3>
                    <p className="text-slate-400">
                        Deep dive into margin performance across the customer base.
                    </p>
                </div>
                <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                    <h4 className="font-bold text-white mb-3">Key Features</h4>
                    <ul className="space-y-3 text-sm text-slate-300">
                        <li className="flex items-start">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2 flex-shrink-0"></span>
                             <p><strong>License vs. Implementation Toggle:</strong> Switch views to analyze high-margin software deals vs low-margin service projects.</p>
                        </li>
                        <li className="flex items-start">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2 flex-shrink-0"></span>
                             <p><strong>Margin by Segment:</strong> Compare gross margins between Enterprise and Mid-Market segments.</p>
                        </li>
                        <li className="flex items-start">
                             <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2 flex-shrink-0"></span>
                             <p><strong>Net Margin Trend:</strong> Visualize profitability over time with optional regional filtering.</p>
                        </li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        id: 'marketing',
        title: 'Marketing Metrics',
        icon: Megaphone,
        color: 'text-purple-400',
        content: (
             <div className="space-y-8 animate-fade-in">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">Acquisition Engine</h3>
                    <p className="text-slate-400">
                        Understand where leads come from and how much they cost.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl">
                        <h4 className="font-bold text-white mb-2">Lead Distribution</h4>
                        <p className="text-sm text-slate-300">
                            Pie chart visualization of incoming volume by channel (Organic, Paid Search, Events, etc.).
                        </p>
                    </div>
                    <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl">
                         <h4 className="font-bold text-white mb-2">Channel Efficiency</h4>
                         <p className="text-sm text-slate-300">
                             Table comparing Revenue Generated vs CAC. Identifies channels with the highest ROI multiplier.
                         </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'gtm',
        title: 'Go-To-Market (GTM)',
        icon: Rocket,
        color: 'text-orange-400',
        content: (
             <div className="space-y-8 animate-fade-in">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">Unit Economics</h3>
                    <p className="text-slate-400">
                        High-level health check of the business model.
                    </p>
                </div>
                <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
                        <li className="flex items-center p-3 bg-aether-900/50 rounded border border-aether-700">
                            <Activity size={16} className="text-orange-400 mr-2" />
                            <strong>CAC Payback Period</strong>
                        </li>
                        <li className="flex items-center p-3 bg-aether-900/50 rounded border border-aether-700">
                            <Activity size={16} className="text-orange-400 mr-2" />
                            <strong>LTV : CAC Ratio</strong>
                        </li>
                        <li className="flex items-center p-3 bg-aether-900/50 rounded border border-aether-700">
                            <Activity size={16} className="text-orange-400 mr-2" />
                            <strong>Cost Per Lead (CPL)</strong>
                        </li>
                        <li className="flex items-center p-3 bg-aether-900/50 rounded border border-aether-700">
                            <Activity size={16} className="text-orange-400 mr-2" />
                            <strong>Return on Ad Spend (ROAS)</strong>
                        </li>
                    </ul>
                </div>
            </div>
        )
    },
    {
        id: 'revenue',
        title: 'Revenue & Profitability',
        icon: PieChart,
        color: 'text-blue-400',
        content: (
             <div className="space-y-8 animate-fade-in">
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">Profitability & SaaS Metrics</h3>
                    <p className="text-slate-400 mb-6">
                        A dedicated view for understanding quality of revenue, product margins, and subscription health.
                    </p>
                </div>

                <div className="space-y-6">
                     <div className="p-5 bg-aether-800 rounded-xl border border-aether-700">
                        <h4 className="font-bold text-white flex items-center mb-3">
                            <Layers size={18} className="mr-2 text-blue-400" />
                            Revenue Waterfall
                        </h4>
                        <p className="text-sm text-slate-300 mb-3">
                            The visual bridge between your starting ARR and ending Forecast.
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-aether-900 p-3 rounded">
                                <span className="text-blue-400 font-bold block">Base Contracted</span>
                                <span className="text-slate-500">Existing recurring revenue secured at start of period.</span>
                            </div>
                             <div className="bg-aether-900 p-3 rounded">
                                <span className="text-emerald-400 font-bold block">New Pipeline</span>
                                <span className="text-slate-500">Weighted probability of new deals closing.</span>
                            </div>
                             <div className="bg-aether-900 p-3 rounded">
                                <span className="text-rose-400 font-bold block">Churn</span>
                                <span className="text-slate-500">Predicted contraction or loss of customers.</span>
                            </div>
                             <div className="bg-aether-900 p-3 rounded">
                                <span className="text-white font-bold block">Final Forecast</span>
                                <span className="text-slate-500">The resulting GAAP revenue prediction.</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-aether-800 rounded-xl border border-aether-700">
                        <h4 className="font-bold text-white flex items-center mb-3">
                            <DollarSign size={18} className="mr-2 text-blue-400" />
                            Product Profitability
                        </h4>
                        <p className="text-sm text-slate-300">
                            Analyzes <strong>Contribution Margin</strong> (Revenue - COGS) by product line. 
                            Essential for deciding which products to scale and which to sunset. 
                            The system highlights low-margin products in <span className="text-yellow-400">yellow</span> and high-margin in <span className="text-emerald-400">green</span>.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'cost',
        title: 'Cost Intelligence',
        icon: Banknote,
        color: 'text-rose-400',
        content: (
            <div className="space-y-8 animate-fade-in">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">The Efficiency Engine</h3>
                    <p className="text-slate-400">Proactive cost control and anomaly detection across the organization.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl">
                        <h4 className="font-bold text-white flex items-center mb-3">
                            <Search className="mr-2 text-rose-400" size={18} />
                            Phantom Cost Hunter
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            A specialized AI agent that audits GL entries for waste. It detects:
                        </p>
                        <ul className="list-disc list-inside mt-2 text-sm text-slate-400 space-y-1 ml-4">
                            <li>Duplicate SaaS licenses (e.g., Zoom + Webex for same user).</li>
                            <li>Unused seats (Software assigned but not logged into for 30+ days).</li>
                            <li>T&E Policy Violations (e.g., First Class flights without approval).</li>
                        </ul>
                    </div>

                    <div className="bg-aether-800 border border-aether-700 p-6 rounded-xl">
                        <h4 className="font-bold text-white flex items-center mb-3">
                            <TrendingUp className="mr-2 text-blue-400" size={18} />
                            Vendor Spend Analysis
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            A Treemap visualization that maps spend size to box area, and YoY growth to color. 
                            <span className="text-rose-400 font-bold"> Red</span> indicates rapidly increasing costs that may need renegotiation.
                        </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'intelligence',
        title: 'The Intelligent Core',
        icon: BrainCircuit,
        color: 'text-purple-400',
        content: (
             <div className="space-y-6 animate-fade-in">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">Central Neural Engine</h3>
                    <p className="text-slate-400">
                        The brain of Aether. This view monitors the health, accuracy, and latency of the machine learning models powering the platform.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-aether-800 rounded-xl border border-aether-700">
                         <h4 className="font-bold text-white flex items-center mb-2">
                             <GitBranch size={18} className="mr-2 text-purple-400" />
                             Model Drift Detection
                         </h4>
                         <p className="text-sm text-slate-300">
                             Models degrade over time as business conditions change. The Core monitors <strong>Accuracy</strong> vs. Baseline. 
                             If drift is detected, the system can trigger an auto-retraining pipeline.
                         </p>
                    </div>
                    <div className="p-5 bg-aether-800 rounded-xl border border-aether-700">
                         <h4 className="font-bold text-white flex items-center mb-2">
                             <Zap size={18} className="mr-2 text-yellow-400" />
                             Autonomous Decisions
                         </h4>
                         <p className="text-sm text-slate-300">
                             A log of actions taken by the AI without human intervention, such as scaling compute resources during heavy reporting loads or adjusting forecast baselines based on new actuals.
                         </p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'scenarios',
        title: 'Scenario Planning',
        icon: LineChart,
        color: 'text-indigo-400',
        content: (
            <div className="space-y-6 animate-fade-in">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">Monte Carlo Simulation</h3>
                    <p className="text-slate-400">Advanced stochastic modeling to quantify risk and probability.</p>
                </div>
                <div className="bg-aether-800 border border-aether-700 rounded-xl p-6">
                    <p className="text-slate-300 mb-4">
                        Instead of static "Best/Worst" cases, Aether runs <strong>10,000 simulations</strong> to generate a probability distribution of outcomes.
                    </p>
                    <div className="space-y-4">
                         <div className="flex items-start">
                             <div className="mt-1 p-1 bg-indigo-500 rounded-full mr-3"></div>
                             <div>
                                 <h5 className="text-white font-bold text-sm">Inputs (Drivers)</h5>
                                 <p className="text-slate-400 text-sm">Adjust Inflation, Growth Targets, and Headcount to see dynamic impact.</p>
                             </div>
                         </div>
                         <div className="flex items-start">
                             <div className="mt-1 p-1 bg-indigo-500 rounded-full mr-3"></div>
                             <div>
                                 <h5 className="text-white font-bold text-sm">GenAI Analysis</h5>
                                 <p className="text-slate-400 text-sm">
                                     Once the simulation completes, a Large Language Model analyzes the data to produce 
                                     <strong> Mitigation Strategies</strong> (if risk is high) or <strong>Growth Opportunities</strong> (if results are positive).
                                 </p>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'governance',
        title: 'Governance & Lineage',
        icon: ShieldCheck,
        color: 'text-yellow-400',
        content: (
            <div className="space-y-6 animate-fade-in">
                 <div>
                    <h3 className="text-xl font-bold text-white mb-2">Trust & Compliance</h3>
                    <p className="text-slate-400">
                        For AI to be used in Finance, it must be explainable and auditable.
                    </p>
                </div>

                <div className="space-y-4">
                     <div className="p-4 bg-aether-800 rounded-xl border border-aether-700">
                         <h4 className="font-bold text-white mb-2 flex items-center">
                             <Network size={18} className="mr-2 text-yellow-400" />
                             Data Lineage Explorer
                         </h4>
                         <p className="text-sm text-slate-300">
                             Interactive map tracing financial figures back to their source. 
                             Click on any node (e.g., "Snowflake Raw") to inspect upstream dependencies (Salesforce) and downstream consumers (Dashboard). 
                             Critical for SOX audits.
                         </p>
                     </div>
                     <div className="p-4 bg-aether-800 rounded-xl border border-aether-700">
                         <h4 className="font-bold text-white mb-2 flex items-center">
                             <Lock size={18} className="mr-2 text-orange-400" />
                             Audit Trail
                         </h4>
                         <p className="text-sm text-slate-300">
                             Immutable log of every action taken by both Human users and AI Agents, tagged with a Risk Level.
                         </p>
                     </div>
                </div>
            </div>
        )
    }
];

const TrainingView: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);

  const activeSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white flex items-center">
            <Lightbulb className="mr-3 text-yellow-400" />
            Training Center
        </h2>
        <p className="text-slate-400 mt-1">System documentation, feature guides, and architectural overview.</p>
      </div>

      <div className="flex flex-1 overflow-hidden bg-aether-900/50 border border-aether-700 rounded-2xl shadow-2xl">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-aether-800 border-r border-aether-700 flex flex-col overflow-y-auto">
            <div className="p-4 bg-aether-900/50 border-b border-aether-700">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modules</span>
            </div>
            <div className="px-2 space-y-1 py-4">
                {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSectionId === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSectionId(section.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                                isActive 
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-sm' 
                                : 'text-slate-400 hover:bg-aether-700 hover:text-slate-200'
                            }`}
                        >
                            <div className="flex items-center">
                                <Icon size={18} className={`mr-3 ${isActive ? section.color : 'text-slate-500'}`} />
                                {section.title}
                            </div>
                            {isActive && <ChevronRight size={14} className="text-blue-400" />}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 relative bg-gradient-to-br from-aether-900 to-slate-900">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center space-x-4 mb-8 pb-6 border-b border-aether-700">
                    <div className={`p-4 bg-aether-800 rounded-xl border border-aether-700 shadow-lg`}>
                        {React.createElement(activeSection.icon, { size: 32, className: activeSection.color })}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">{activeSection.title}</h2>
                        <p className="text-slate-400 text-sm mt-1">Documentation & User Guide</p>
                    </div>
                </div>
                
                {activeSection.content}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingView;
