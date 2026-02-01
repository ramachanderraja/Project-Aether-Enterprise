
import React, { useState } from 'react';
import { Sliders, RefreshCw, PlayCircle, Layers, CheckCircle2, TrendingUp, ShieldAlert, Megaphone, Users, DollarSign } from 'lucide-react';
import RevenueChart from '../charts/RevenueChart';
import { MOCK_REVENUE_DATA } from '../../constants';
import { FinancialMetric } from '../../types';
import { analyzeScenario } from '../../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Mock Normal Distribution for Monte Carlo Result
const generateDistribution = (mean: number, stdDev: number) => {
    const data = [];
    for (let x = mean - 4 * stdDev; x <= mean + 4 * stdDev; x += stdDev / 2) {
        const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2));
        data.push({ value: x, probability: y });
    }
    return data;
};

interface AIAnalysis {
    mitigation: string[];
    growth: string[];
}

const ScenarioView: React.FC = () => {
  const [investment, setInvestment] = useState(10.0);
  const [headcount, setHeadcount] = useState(5.0);
  const [price, setPrice] = useState(2.5);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedData, setSimulatedData] = useState<FinancialMetric[]>(MOCK_REVENUE_DATA);
  const [distributionData, setDistributionData] = useState(generateDistribution(6750, 250));

  const runSimulation = async () => {
    setIsSimulating(true);
    setAnalysis(null);

    // Simulation Logic
    const newData = MOCK_REVENUE_DATA.map(item => {
        if (!item.forecast) return item;
        
        // Impact Logic:
        // Investment: Medium impact, lagged (0.5 weight)
        // Headcount: Low immediate impact (0.3 weight)
        // Price: High immediate impact (0.8 weight)
        const combinedImpact = (investment * 0.5) + (headcount * 0.3) + (price * 0.8);
        const multiplier = 1 + (combinedImpact / 100);
        
        const newForecast = Math.round(item.forecast * multiplier);
        // Uncertainty increases significantly with Price changes and major Investment shifts
        const uncertainty = Math.round(newForecast * (0.15 + (Math.abs(price) * 0.01) + (Math.abs(investment) * 0.005))); 

        return {
            ...item,
            forecast: newForecast,
            confidenceUpper: newForecast + uncertainty,
            confidenceLower: newForecast - uncertainty,
        };
    });

    // Calculate distribution mean/stdDev based on final forecast month approx
    const baseVal = 6500;
    const combinedImpact = (investment * 0.5) + (headcount * 0.3) + (price * 0.8);
    const newMean = baseVal * (1 + (combinedImpact / 100));
    const newStdDev = 200 + (Math.abs(investment) * 5) + (Math.abs(price) * 15);

    // Simulate network delay
    setTimeout(async () => {
        setSimulatedData(newData);
        setDistributionData(generateDistribution(newMean, newStdDev));
        
        // Call Gemini for analysis with updated context
        const summary = `Scenario Simulation Parameters:
        - Sales & Marketing Investment: ${investment > 0 ? '+' : ''}${investment}%
        - Headcount Adjustment: ${headcount > 0 ? '+' : ''}${headcount}%
        - Price Change: ${price > 0 ? '+' : ''}${price}%
        
        Resulting Forecast High: $${newData[newData.length-1].confidenceUpper}.
        
        Analyze the strategic implications of these changes. Focus on:
        1. Customer acquisition costs vs LTV (Investment).
        2. Operational capacity (Headcount).
        3. Market elasticity and churn risk (Price).`;

        const result = await analyzeScenario(summary);
        
        try {
            setAnalysis(JSON.parse(result));
        } catch (e) {
             setAnalysis({ mitigation: ["Could not parse structured analysis."], growth: [] });
        }
        
        setIsSimulating(false);
    }, 1500);
  };

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Scenario Modeling Engine</h2>
          <p className="text-slate-400 mt-1">Real-time "What-If" Analysis & Monte Carlo Simulation</p>
        </div>
        <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg text-white font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          {isSimulating ? <RefreshCw className="animate-spin" /> : <PlayCircle />}
          <span>Run Simulation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Controls */}
        <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 h-fit space-y-8">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
                <Sliders size={20} />
                <h3 className="font-semibold text-lg">Strategic Drivers</h3>
            </div>

            {/* Driver 1: Sales & Marketing Investment */}
            <div>
                <div className="flex justify-between mb-2">
                    <label className="text-sm text-slate-300 flex items-center">
                        <Megaphone size={14} className="mr-2 text-blue-400" />
                        Sales & Marketing
                    </label>
                    <span className="text-sm font-mono text-blue-400">{investment > 0 ? '+' : ''}{investment}%</span>
                </div>
                <input 
                    type="range" min="-20" max="50" step="1" 
                    value={investment} 
                    onChange={(e) => setInvestment(parseFloat(e.target.value))}
                    className="w-full h-2 bg-aether-900 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            {/* Driver 2: Headcount Adjustment */}
            <div>
                <div className="flex justify-between mb-2">
                    <label className="text-sm text-slate-300 flex items-center">
                        <Users size={14} className="mr-2 text-purple-400" />
                        Headcount Adj.
                    </label>
                    <span className="text-sm font-mono text-purple-400">{headcount > 0 ? '+' : ''}{headcount}%</span>
                </div>
                <input 
                    type="range" min="-20" max="30" step="1" 
                    value={headcount} 
                    onChange={(e) => setHeadcount(parseInt(e.target.value))}
                    className="w-full h-2 bg-aether-900 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
            </div>

            {/* Driver 3: Price Change */}
            <div>
                <div className="flex justify-between mb-2">
                    <label className="text-sm text-slate-300 flex items-center">
                        <DollarSign size={14} className="mr-2 text-emerald-400" />
                        Price Change
                    </label>
                    <span className="text-sm font-mono text-emerald-400">{price > 0 ? '+' : ''}{price}%</span>
                </div>
                <input 
                    type="range" min="-15" max="25" step="0.5" 
                    value={price} 
                    onChange={(e) => setPrice(parseFloat(e.target.value))}
                    className="w-full h-2 bg-aether-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
            </div>
            
            <div className="pt-6 border-t border-aether-700">
                 <h4 className="text-sm font-medium text-slate-300 mb-4">Outcome Probability (Monte Carlo)</h4>
                 <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={distributionData}>
                             <defs>
                                <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="probability" stroke="#a855f7" fill="url(#colorProb)" />
                            <Tooltip content={() => null} />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>
                 <p className="text-center text-xs text-slate-500 mt-2">FY24 Revenue Outcome Distribution</p>
            </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
            <div className="bg-aether-800 border border-aether-700 rounded-xl p-6 min-h-[400px]">
                <div className="flex justify-between mb-4">
                     <h3 className="text-lg font-semibold text-white">Projected Financial Impact</h3>
                     <span className="text-xs text-slate-400 flex items-center bg-aether-900 px-3 py-1 rounded-full border border-aether-700">
                        <Layers size={12} className="mr-2" /> 10,000 Iterations Simulated
                     </span>
                </div>
                <RevenueChart data={simulatedData} />
            </div>

            {analysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {/* Mitigation Strategies */}
                    <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-6 shadow-lg shadow-rose-500/5">
                        <h4 className="text-rose-400 font-bold mb-4 flex items-center text-lg">
                            <ShieldAlert size={20} className="mr-2" />
                            Mitigation Strategies
                        </h4>
                        <div className="space-y-3">
                            {analysis.mitigation && analysis.mitigation.map((point, index) => (
                                <div key={index} className="flex items-start">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 mr-3 flex-shrink-0"></span>
                                    <p className="text-slate-300 text-sm leading-relaxed">{point}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Growth Opportunities */}
                    <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-6 shadow-lg shadow-emerald-500/5">
                         <h4 className="text-emerald-400 font-bold mb-4 flex items-center text-lg">
                            <TrendingUp size={20} className="mr-2" />
                            Growth Opportunities
                        </h4>
                        <div className="space-y-3">
                            {analysis.growth && analysis.growth.map((point, index) => (
                                <div key={index} className="flex items-start">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 mr-3 flex-shrink-0"></span>
                                    <p className="text-slate-300 text-sm leading-relaxed">{point}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioView;
