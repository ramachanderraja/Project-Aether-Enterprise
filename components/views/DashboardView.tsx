
import React, { useEffect, useState } from 'react';
import { MOCK_REVENUE_DATA, MOCK_ANOMALIES, SAAS_METRICS_TREND, MOCK_DRIVERS_ANALYSIS, MOCK_HYPOTHESES, CORE_DATA } from '../../constants';
import RevenueChart from '../charts/RevenueChart';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, ArrowRight, Target, LineChart as IconLineChart, Compass, Search, BarChart2, ListChecks, Loader2, FileText, X, Maximize2, DollarSign, Calendar, Zap, CheckCircle2, ExternalLink } from 'lucide-react';
import { generateFinancialInsight, generateRootCauseNarrative, generateActionPlan } from '../../services/geminiService';
import { Anomaly } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ComposedChart, Line, ScatterChart, Scatter, ZAxis, Cell, ReferenceLine, Area, AreaChart, LineChart } from 'recharts';

interface DashboardViewProps {
    onNavigate: (tab: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [insight, setInsight] = useState<string>("Analyzing strategic financial positioning...");
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  
  // KPI Modal State
  const [expandedKPI, setExpandedKPI] = useState<{ label: string, type: string } | null>(null);

  // RCA State
  const [rcaNarrative, setRcaNarrative] = useState<string>("");
  const [isLoadingRca, setIsLoadingRca] = useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
        const prompt = `Analyze this strategic financial data: 
        Rule of 40 Score: 51. In-Year Revenue Growth: 24%.
        Forecast Variance: -3% vs Budget.
        Provide a 1-sentence strategic guidance for the CFO.`;
        
        const result = await generateFinancialInsight(prompt);
        setInsight(result);
    };
    fetchInsight();
  }, []);

  const handleAnomalyClick = async (anomaly: Anomaly) => {
    setSelectedAnomaly(anomaly);
    setActionPlan(null); // Reset previous plan
    setRcaNarrative("");
    setIsLoadingRca(true);
    
    // Find the confirmed hypothesis to pass as context to the AI
    const confirmedHypothesis = MOCK_HYPOTHESES.find(h => h.anomalyId === anomaly.id && h.status === 'confirmed');
    const context = confirmedHypothesis ? confirmedHypothesis.statement : undefined;

    const narrative = await generateRootCauseNarrative(anomaly.description, anomaly.driver, context);
    setRcaNarrative(narrative);
    setIsLoadingRca(false);
  };

  const handleCreateActionPlan = async () => {
      if (!selectedAnomaly) return;
      setIsGeneratingPlan(true);
      try {
        const plan = await generateActionPlan(selectedAnomaly.metric, selectedAnomaly.driver, selectedAnomaly.impactValue);
        setActionPlan(plan);
      } catch (error) {
        console.error("Failed to generate plan:", error);
        setActionPlan("Unable to generate action plan. Please try again.");
      } finally {
        setIsGeneratingPlan(false);
      }
  };

  const navigateToDetail = (type: string) => {
      let targetTab = 'revenue';
      if (type === 'acv') targetTab = 'sales';
      if (type === 'margin') targetTab = 'cost';
      if (type === 'rule40') targetTab = 'revenue'; // or reports
      
      onNavigate(targetTab);
  };

  const kpis = [
    { 
        label: 'Total YTD Revenue', 
        value: `$${(CORE_DATA.Metadata.GlobalRevenue_YTD / 1000000).toFixed(1)}M`, 
        change: '+24%', 
        trend: 'up', 
        color: 'text-emerald-500', 
        icon: DollarSign, 
        type: 'revenue' 
    },
    { 
        label: 'In-Year Closed ACV', 
        value: '$12.4M', 
        change: '+18%', 
        trend: 'up', 
        color: 'text-blue-500', 
        icon: Calendar, 
        type: 'acv' 
    },
    { 
        label: 'EBITDA Margin', 
        value: '21%', 
        change: '+2.5%', 
        trend: 'up', 
        color: 'text-emerald-500', 
        icon: Target, 
        type: 'margin' 
    },
    { 
        label: 'Rule of 40', 
        value: '51', 
        change: '+3', 
        trend: 'up', 
        color: 'text-blue-500', 
        icon: TrendingUp, 
        type: 'rule40' 
    },
  ];

  const renderKPIDetailChart = (type: string) => {
      switch(type) {
          case 'margin':
              return (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_REVENUE_DATA.slice(0,6).map(d => ({...d, margin: 20 + Math.random() * 5}))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" unit="%" domain={[15, 30]} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                        <Area type="monotone" dataKey="margin" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="EBITDA Margin %" />
                    </AreaChart>
                </ResponsiveContainer>
              );
          case 'rule40':
              return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={SAAS_METRICS_TREND}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" domain={[30, 60]} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                        <Line type="monotone" dataKey="ruleOf40" stroke="#3b82f6" strokeWidth={3} name="Rule of 40" />
                    </LineChart>
                </ResponsiveContainer>
              );
          case 'revenue':
              return (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_REVENUE_DATA.slice(0,6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                        <Bar dataKey="actual" fill="#3b82f6" name="Revenue" />
                    </BarChart>
                </ResponsiveContainer>
              );
          default:
               return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_REVENUE_DATA.slice(0,6).map(d => ({...d, acv: (d.actual || 4000) * 0.2}))}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                        <Line type="monotone" dataKey="acv" stroke="#10b981" strokeWidth={3} name="Closed ACV" />
                    </LineChart>
                </ResponsiveContainer>
               );
      }
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full relative font-sans">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Strategic Command Center</h2>
          <p className="text-slate-400 mt-1">CFO Integrated Financial View</p>
        </div>
        <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-aether-800 text-slate-300 text-xs rounded-md border border-aether-700 flex items-center h-8">
                <Compass className="mr-2 text-blue-500" size={14} />
                Rolling Forecast: Active
            </span>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-aether-800 border border-aether-700 rounded-lg p-5 flex items-start space-x-4 shadow-sm">
        <div className="p-2 bg-blue-600/10 rounded-md">
            <Activity className="text-blue-500" size={20} />
        </div>
        <div>
            <h4 className="text-slate-100 font-semibold text-sm mb-1">AI Strategic Guidance</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
                {insight}
            </p>
        </div>
      </div>

      {/* CFO Financial Summary (Interactive) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <button 
            key={idx} 
            onClick={() => setExpandedKPI({ label: kpi.label, type: kpi.type })}
            className="bg-aether-800 border border-aether-700 p-5 rounded-xl text-left hover:bg-aether-700/50 transition-all group relative overflow-hidden shadow-sm"
          >
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 size={14} className="text-slate-500" />
            </div>
            <div className="flex justify-between items-start mb-2">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{kpi.label}</p>
                <kpi.icon size={16} className="text-slate-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{kpi.value}</span>
              <span className={`flex items-center text-sm font-medium ${kpi.color}`}>
                {kpi.trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : kpi.trend === 'down' ? <TrendingDown size={14} className="mr-1" /> : null}
                {kpi.change}
              </span>
            </div>
            {/* Context for YTD Revenue */}
            {kpi.type === 'revenue' && <p className="text-[10px] text-slate-500 mt-2">vs Previous YTD</p>}
          </button>
        ))}
      </div>

      {/* KPI Detail Modal */}
      {expandedKPI && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-aether-900 border border-aether-700 rounded-xl w-full max-w-3xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                   <div className="p-6 border-b border-aether-700 flex justify-between items-center bg-aether-800 rounded-t-xl">
                        <h3 className="text-xl font-bold text-white">{expandedKPI.label} Trend Analysis</h3>
                        <button onClick={() => setExpandedKPI(null)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                   </div>
                   <div className="p-8 h-[400px] bg-aether-900 relative">
                       {renderKPIDetailChart(expandedKPI.type)}
                   </div>
                   <div className="p-6 border-t border-aether-700 bg-aether-800 rounded-b-xl flex justify-end">
                       <button 
                         onClick={() => {
                             navigateToDetail(expandedKPI.type);
                             setExpandedKPI(null);
                         }}
                         className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                       >
                           <ExternalLink size={16} />
                           <span>View Detailed Report</span>
                       </button>
                   </div>
              </div>
          </div>
      )}

      {/* Strategic Risk / Anomaly Modal */}
      {selectedAnomaly && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="bg-aether-900 border border-aether-700 rounded-xl w-full max-w-4xl flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
                   
                   {/* Modal Header */}
                   <div className="p-6 border-b border-aether-700 flex justify-between items-center bg-aether-800">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-rose-500/20 rounded-lg">
                                <AlertTriangle className="text-rose-600" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Strategic Anomaly Detected</h3>
                                <p className="text-sm text-slate-400">Impact Assessment & Remediation</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedAnomaly(null)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                   </div>

                   <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                       {/* Left Col: Analysis */}
                       <div className="space-y-6">
                           {/* Details Card */}
                           <div className="p-5 bg-aether-800/50 border border-aether-700 rounded-xl">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Anomaly Profile</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Metric</span>
                                        <span className="text-white font-medium">{selectedAnomaly.metric}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Primary Driver</span>
                                        <span className="text-blue-600 font-medium">{selectedAnomaly.driver}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Financial Impact</span>
                                        <span className="text-rose-600 font-mono font-bold">-${Math.abs(selectedAnomaly.impactValue).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Severity</span>
                                        <span className="text-rose-600 font-bold uppercase text-xs border border-rose-200 px-2 py-0.5 rounded bg-rose-50">{selectedAnomaly.severity}</span>
                                    </div>
                                </div>
                           </div>

                           {/* RCA Section */}
                           <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl relative overflow-hidden shadow-sm">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                <h4 className="text-blue-700 font-bold mb-3 flex items-center">
                                    <Zap size={16} className="mr-2 text-blue-600" />
                                    AI Root Cause Analysis
                                </h4>
                                {isLoadingRca ? (
                                    <div className="flex items-center space-x-2 text-slate-500 text-sm">
                                        <Loader2 size={16} className="animate-spin text-blue-600" />
                                        <span>Consulting Knowledge Graph...</span>
                                    </div>
                                ) : (
                                    <p className="text-slate-700 text-sm leading-relaxed">
                                        {rcaNarrative}
                                    </p>
                                )}
                           </div>
                       </div>

                       {/* Right Col: Action */}
                       <div className="space-y-6 flex flex-col">
                           <div className="flex-1 bg-aether-800 border border-aether-700 rounded-xl p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-lg font-bold text-white">Recommended Action Plan</h4>
                                    {!actionPlan && !isGeneratingPlan && (
                                        <button 
                                            onClick={handleCreateActionPlan}
                                            disabled={isLoadingRca}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center shadow-lg"
                                        >
                                            <Zap size={12} className="mr-1" /> Generate Plan
                                        </button>
                                    )}
                                </div>

                                {isGeneratingPlan ? (
                                    <div className="flex flex-col items-center justify-center h-40 space-y-3">
                                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                                        <span className="text-slate-400 text-sm">Synthesizing remediation steps...</span>
                                    </div>
                                ) : actionPlan ? (
                                    <div className="prose prose-slate prose-sm max-w-none">
                                        <div className="text-slate-700 whitespace-pre-wrap leading-relaxed animate-fade-in">
                                            {actionPlan}
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-aether-700 flex justify-end">
                                            <button className="text-emerald-600 text-xs font-bold flex items-center hover:underline">
                                                <CheckCircle2 size={14} className="mr-1" /> Assign to Owner
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center">
                                        <ListChecks size={40} className="mb-2 opacity-50" />
                                        <p className="text-sm">Review the Root Cause Analysis, then generate a step-by-step action plan to mitigate this risk.</p>
                                    </div>
                                )}
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rolling Forecast */}
        <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Rolling 12-Month Forecast</h3>
          </div>
          <RevenueChart data={MOCK_REVENUE_DATA} />
        </div>

        {/* Cash Flow Forecast & Runway */}
        <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Cash Flow Projection</h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded border border-emerald-500/20 font-medium">Runway: 18 Months</span>
            </div>
            <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={MOCK_REVENUE_DATA.slice(0,6).map(d => ({...d, cash: (d.actual || 0) * 0.15, burn: -150 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                        <Legend />
                        <Bar dataKey="cash" name="Net Cash Flow" fill="#10b981" barSize={20} />
                        <Line type="monotone" dataKey="burn" name="Burn Rate Threshold" stroke="#ef4444" strokeDasharray="5 5" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rule of 40 Analysis */}
          <div className="lg:col-span-2 bg-aether-800 border border-aether-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-white mb-2">The "Rule of 40" Trajectory</h3>
              <p className="text-sm text-slate-400 mb-6">Balancing Growth Rate vs. Profit Margin (Target &gt; 40%)</p>
              <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" dataKey="growth" name="Growth %" unit="%" stroke="#94a3b8" domain={[0, 60]} />
                        <YAxis type="number" dataKey="margin" name="Margin %" unit="%" stroke="#94a3b8" domain={[-20, 40]} />
                        <ZAxis type="number" range={[100, 100]} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }} />
                        <Legend />
                        <Scatter name="Competitors" data={[
                            { growth: 20, margin: 10 }, { growth: 40, margin: -10 }, { growth: 10, margin: 25 }
                        ]} fill="#71717a" />
                        <Scatter name="Us (Current)" data={[{ growth: 21, margin: 30 }]} fill="#3b82f6" shape="star" />
                      </ScatterChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Strategic Anomalies */}
          <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 flex flex-col shadow-sm">
            <h3 className="text-lg font-bold text-white mb-4">Strategic Risks</h3>
            <div className="space-y-4 flex-1">
                {MOCK_ANOMALIES.map((anomaly) => (
                <div 
                    key={anomaly.id} 
                    onClick={() => handleAnomalyClick(anomaly)}
                    className="p-4 rounded-lg bg-aether-900 border border-aether-700 hover:border-aether-600 cursor-pointer transition-all group"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle size={16} className={anomaly.severity === 'high' ? 'text-rose-500' : 'text-yellow-500'} />
                            <span className="font-medium text-slate-200 text-sm">{anomaly.metric}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{anomaly.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                        <span className="text-rose-600 font-mono text-xs font-bold">Impact: ${Math.abs(anomaly.impactValue).toLocaleString()}</span>
                        <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center font-medium">
                            Analyze <ArrowRight size={12} className="ml-1" />
                        </span>
                    </div>
                </div>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default DashboardView;
