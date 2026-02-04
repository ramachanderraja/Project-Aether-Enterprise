import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Activity,
  Server,
  GitBranch,
  Database,
  Zap,
  Cpu,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Clock,
  TrendingUp,
  Gauge,
  Settings
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

// Local interfaces for this module
interface MLModelLocal {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'training' | 'inactive';
  accuracy: number;
  biasScore: number;
  driftDetected: boolean;
  lastRetrained: string;
  nextScheduledRetrain: string;
  inferenceCount: number;
  avgLatencyMs: number;
}

interface AutonomousDecisionLocal {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  status: 'executed' | 'pending_review' | 'rejected';
  confidence: number;
  impactScore: 'high' | 'medium' | 'low';
}

interface ComputeResourcesLocal {
  gpuUtilization: number;
  memoryAllocation: number;
  cpuUtilization: number;
  apiTokensUsed: number;
  apiTokensLimit: number;
  activeNodes: number;
  queuedJobs: number;
}

interface SystemLatencyLocal {
  timestamp: string;
  time: string;
  latencyMs: number;
  load: number;
}

// Mock data for ML models
const INITIAL_MODELS: MLModelLocal[] = [
  {
    id: 'model-001',
    name: 'Revenue Forecasting',
    version: '2.4.0',
    status: 'active',
    accuracy: 0.943,
    biasScore: 0.023,
    driftDetected: false,
    lastRetrained: '2025-01-15',
    nextScheduledRetrain: '2025-02-15',
    inferenceCount: 145230,
    avgLatencyMs: 45
  },
  {
    id: 'model-002',
    name: 'Anomaly Detection',
    version: '3.1.2',
    status: 'active',
    accuracy: 0.967,
    biasScore: 0.018,
    driftDetected: true,
    lastRetrained: '2025-01-08',
    nextScheduledRetrain: '2025-02-08',
    inferenceCount: 892450,
    avgLatencyMs: 12
  },
  {
    id: 'model-003',
    name: 'Churn Prediction',
    version: '1.8.0',
    status: 'active',
    accuracy: 0.891,
    biasScore: 0.045,
    driftDetected: false,
    lastRetrained: '2025-01-20',
    nextScheduledRetrain: '2025-02-20',
    inferenceCount: 67890,
    avgLatencyMs: 78
  },
  {
    id: 'model-004',
    name: 'Driver Analysis',
    version: '2.0.1',
    status: 'active',
    accuracy: 0.912,
    biasScore: 0.031,
    driftDetected: false,
    lastRetrained: '2025-01-18',
    nextScheduledRetrain: '2025-02-18',
    inferenceCount: 234567,
    avgLatencyMs: 56
  }
];

// Mock autonomous decisions log
const MOCK_DECISIONS: AutonomousDecisionLocal[] = [
  {
    id: 'dec-001',
    timestamp: new Date().toISOString(),
    action: 'Auto-scaled Inference Nodes',
    description: 'Increased from 2 to 4 nodes due to latency spike detected in Revenue Forecasting model.',
    status: 'executed',
    confidence: 0.95,
    impactScore: 'high'
  },
  {
    id: 'dec-002',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    action: 'Forecast Adjustment',
    description: 'Updated Q1 Revenue prediction based on new CRM pipeline data integration.',
    status: 'executed',
    confidence: 0.88,
    impactScore: 'medium'
  },
  {
    id: 'dec-003',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    action: 'Anomaly Alert',
    description: 'Flagged unusual OpEx transaction pattern in Marketing cost center for review.',
    status: 'pending_review',
    confidence: 0.72,
    impactScore: 'medium'
  },
  {
    id: 'dec-004',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    action: 'Daily Data Ingestion',
    description: 'Completed sync from Snowflake Data Warehouse. 2.4M records processed.',
    status: 'executed',
    confidence: 1.0,
    impactScore: 'low'
  },
  {
    id: 'dec-005',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    action: 'Model Drift Alert',
    description: 'Anomaly Detection model showing distribution shift. Scheduled automatic retraining.',
    status: 'executed',
    confidence: 0.89,
    impactScore: 'high'
  }
];

// Generate system latency time series
const generateLatencyData = (): SystemLatencyLocal[] => {
  const data: SystemLatencyLocal[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5 * 60000);
    const baseLatency = 120;
    const spike = i === 3 ? 50 : 0;
    data.push({
      timestamp: time.toISOString(),
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      latencyMs: baseLatency + Math.random() * 20 - 10 + spike,
      load: 40 + Math.random() * 20 + (spike > 0 ? 25 : 0)
    });
  }
  return data;
};

// Compute resource stats
const COMPUTE_RESOURCES: ComputeResourcesLocal = {
  gpuUtilization: 68,
  memoryAllocation: 42,
  cpuUtilization: 35,
  apiTokensUsed: 12500,
  apiTokensLimit: 50000,
  activeNodes: 4,
  queuedJobs: 2
};

// Resource Bar Component
const ResourceBar: React.FC<{
  label: string;
  value: number;
  maxValue?: number;
  unit?: string;
  colorClass: string;
}> = ({ label, value, maxValue = 100, unit = '%', colorClass }) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs text-secondary-500 mb-1.5">
      <span>{label}</span>
      <span className={`font-mono ${colorClass}`}>
        {unit === '%' ? `${value}%` : `${(value / 1000).toFixed(1)}k`}
        {maxValue !== 100 && unit !== '%' && <span className="text-secondary-400"> / {(maxValue / 1000).toFixed(0)}k</span>}
      </span>
    </div>
    <div className="h-2 bg-secondary-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass.replace('text-', 'bg-')}`}
        style={{ width: `${(value / maxValue) * 100}%` }}
      />
    </div>
  </div>
);

// Model Card Component
const ModelCard: React.FC<{
  model: MLModelLocal;
  isRetraining: boolean;
  retrainingProgress: number;
  onRetrain: () => void;
}> = ({ model, isRetraining, retrainingProgress, onRetrain }) => (
  <div className="card p-5 hover:shadow-lg transition-all relative overflow-hidden group">
    {/* Retrain Button */}
    <div className="absolute top-4 right-4">
      <button
        onClick={onRetrain}
        disabled={isRetraining}
        className="p-2 bg-secondary-50 hover:bg-secondary-100 text-secondary-500 hover:text-secondary-700 rounded-lg transition-colors border border-secondary-200"
        title="Retrain Model"
      >
        <RefreshCw size={14} className={isRetraining ? 'animate-spin text-primary-600' : ''} />
      </button>
    </div>

    {/* Model Info */}
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="font-medium text-secondary-900">{model.name}</h4>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-secondary-400 uppercase tracking-wider">v{model.version}</span>
        {isRetraining ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">Training...</span>
        ) : model.driftDetected ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium flex items-center gap-1">
            <AlertTriangle size={10} />
            Drift Detected
          </span>
        ) : (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Stable</span>
        )}
      </div>
    </div>

    {/* Metrics */}
    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
      <div>
        <p className="text-secondary-500 text-xs mb-0.5">Accuracy</p>
        <p className="text-secondary-900 font-mono font-medium">{(model.accuracy * 100).toFixed(1)}%</p>
      </div>
      <div>
        <p className="text-secondary-500 text-xs mb-0.5">Bias Score</p>
        <p className={`font-mono font-medium ${model.biasScore < 0.03 ? 'text-green-600' : model.biasScore < 0.05 ? 'text-yellow-600' : 'text-red-600'}`}>
          {model.biasScore.toFixed(3)}
        </p>
      </div>
      <div>
        <p className="text-secondary-500 text-xs mb-0.5">Latency</p>
        <p className="text-secondary-700 font-mono">{model.avgLatencyMs}ms</p>
      </div>
    </div>

    {/* Additional Stats */}
    <div className="flex items-center justify-between text-xs text-secondary-500 mb-3">
      <span className="flex items-center gap-1">
        <Clock size={12} />
        Retrained: {model.lastRetrained}
      </span>
      <span className="font-mono">{(model.inferenceCount / 1000).toFixed(0)}k inferences</span>
    </div>

    {/* Progress Bar */}
    <div className="w-full bg-secondary-100 h-1.5 rounded-full overflow-hidden">
      {isRetraining ? (
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${retrainingProgress}%` }}
        />
      ) : (
        <div
          className="h-full bg-green-500 rounded-full"
          style={{ width: `${model.accuracy * 100}%` }}
        />
      )}
    </div>
    {isRetraining && (
      <p className="text-[10px] text-primary-600 mt-1.5 text-right">Progress: {retrainingProgress.toFixed(0)}%</p>
    )}
  </div>
);

const IntelligentCorePage: React.FC = () => {
  const [models, setModels] = useState<MLModelLocal[]>(INITIAL_MODELS);
  const [retrainingState, setRetrainingState] = useState<Record<string, number>>({});
  const [latencyData, setLatencyData] = useState<SystemLatencyLocal[]>(() => generateLatencyData());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'30m' | '1h' | '6h' | '24h'>('30m');

  const startRetraining = (modelId: string) => {
    if (retrainingState[modelId] !== undefined && retrainingState[modelId] < 100) return;
    setRetrainingState(prev => ({ ...prev, [modelId]: 0 }));
  };

  const retrainAll = () => {
    models.forEach(m => startRetraining(m.id));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setRetrainingState(prev => {
        const nextState = { ...prev };
        let changed = false;
        Object.keys(nextState).forEach(key => {
          if (nextState[key] < 100) {
            nextState[key] = Math.min(100, nextState[key] + Math.random() * 8 + 2);
            changed = true;
          }
        });
        return changed ? nextState : prev;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Object.entries(retrainingState).forEach(([modelId, progress]) => {
      if (progress >= 100) {
        setModels(prev => prev.map(m =>
          m.id === modelId
            ? { ...m, driftDetected: false, lastRetrained: new Date().toISOString().split('T')[0], accuracy: Math.min(0.99, m.accuracy + 0.01) }
            : m
        ));
      }
    });
  }, [retrainingState]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyData(prev => {
        const newData = [...prev.slice(1)];
        const now = new Date();
        newData.push({
          timestamp: now.toISOString(),
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          latencyMs: 110 + Math.random() * 30,
          load: 45 + Math.random() * 15
        });
        return newData;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const aggregateStats = useMemo(() => ({
    totalInferences: models.reduce((a, m) => a + m.inferenceCount, 0),
    avgAccuracy: models.reduce((a, m) => a + m.accuracy, 0) / models.length,
    modelsWithDrift: models.filter(m => m.driftDetected).length,
    avgLatency: models.reduce((a, m) => a + m.avgLatencyMs, 0) / models.length
  }), [models]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
            <Brain className="mr-3 text-purple-600" size={28} />
            Intelligent Core
          </h1>
          <p className="text-secondary-500">Central Neural Engine Status & Model Registry</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
            <Activity size={14} className="mr-2 animate-pulse" />
            System Online
          </span>
          <button className="btn-outline flex items-center gap-2">
            <Settings size={16} />
            Configure
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Gauge size={18} className="text-primary-600" />
            <span className="text-xs text-green-600 font-medium">+12.3%</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{(aggregateStats.totalInferences / 1000000).toFixed(2)}M</p>
          <p className="text-xs text-secondary-500">Total Inferences</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={18} className="text-green-600" />
            <span className="text-xs text-green-600 font-medium">+0.8%</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{(aggregateStats.avgAccuracy * 100).toFixed(1)}%</p>
          <p className="text-xs text-secondary-500">Avg Model Accuracy</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={18} className={aggregateStats.modelsWithDrift > 0 ? 'text-yellow-600' : 'text-secondary-400'} />
            {aggregateStats.modelsWithDrift > 0 && <span className="text-xs text-yellow-600 font-medium">Needs attention</span>}
          </div>
          <p className="text-2xl font-bold text-secondary-900">{aggregateStats.modelsWithDrift}</p>
          <p className="text-xs text-secondary-500">Models with Drift</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap size={18} className="text-yellow-500" />
            <span className="text-xs text-green-600 font-medium">-5ms</span>
          </div>
          <p className="text-2xl font-bold text-secondary-900">{aggregateStats.avgLatency.toFixed(0)}ms</p>
          <p className="text-xs text-secondary-500">Avg Response Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: System Stats */}
        <div className="space-y-6">
          {/* Compute Resources */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-secondary-900 mb-5 flex items-center">
              <Server className="mr-2 text-primary-600" size={18} />
              Compute Resources
            </h3>
            <ResourceBar
              label="GPU Utilization (H100 Cluster)"
              value={COMPUTE_RESOURCES.gpuUtilization}
              colorClass="text-primary-600"
            />
            <ResourceBar
              label="Memory Allocation"
              value={COMPUTE_RESOURCES.memoryAllocation}
              colorClass="text-purple-600"
            />
            <ResourceBar
              label="CPU Utilization"
              value={COMPUTE_RESOURCES.cpuUtilization}
              colorClass="text-yellow-500"
            />
            <ResourceBar
              label="API Token Consumption (Hourly)"
              value={COMPUTE_RESOURCES.apiTokensUsed}
              maxValue={COMPUTE_RESOURCES.apiTokensLimit}
              unit="tokens"
              colorClass="text-green-600"
            />
            <div className="mt-4 pt-4 border-t border-secondary-200 flex justify-between text-sm">
              <div>
                <p className="text-secondary-500 text-xs">Active Nodes</p>
                <p className="text-secondary-900 font-medium">{COMPUTE_RESOURCES.activeNodes}</p>
              </div>
              <div>
                <p className="text-secondary-500 text-xs">Queued Jobs</p>
                <p className="text-secondary-900 font-medium">{COMPUTE_RESOURCES.queuedJobs}</p>
              </div>
            </div>
          </div>

          {/* System Latency Chart */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                <Zap className="mr-2 text-yellow-500" size={18} />
                System Latency
              </h3>
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as '30m' | '1h' | '6h' | '24h')}
                className="input text-xs py-1 px-2 w-auto"
              >
                <option value="30m">Last 30m</option>
                <option value="1h">Last 1h</option>
                <option value="6h">Last 6h</option>
                <option value="24h">Last 24h</option>
              </select>
            </div>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 200]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(v: number) => [`${v.toFixed(0)}ms`, 'Latency']}
                  />
                  <Area
                    type="monotone"
                    dataKey="latencyMs"
                    stroke="#eab308"
                    strokeWidth={2}
                    fill="url(#latencyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Center/Right: Active Models & Decisions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Model Registry */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                <GitBranch className="mr-2 text-green-600" size={18} />
                Active Model Registry
              </h3>
              <button
                onClick={retrainAll}
                className="btn-primary text-xs flex items-center"
              >
                <RefreshCw size={14} className="mr-2" />
                Retrain All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isRetraining={retrainingState[model.id] !== undefined && retrainingState[model.id] < 100}
                  retrainingProgress={retrainingState[model.id] || 0}
                  onRetrain={() => startRetraining(model.id)}
                />
              ))}

              {/* Deploy New Model Card */}
              <div className="border-2 border-dashed border-secondary-200 rounded-lg p-5 flex flex-col items-center justify-center text-secondary-400 hover:bg-secondary-50 hover:border-secondary-300 transition-colors cursor-pointer min-h-[200px]">
                <Database className="mb-2 opacity-50" size={24} />
                <span className="text-sm font-medium">Deploy New Model</span>
                <span className="text-xs text-secondary-400 mt-1">Click to configure</span>
              </div>
            </div>
          </div>

          {/* Autonomous Decisions Log */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                <Cpu className="mr-2 text-indigo-600" size={18} />
                Autonomous Decisions Log
              </h3>
              <span className="text-xs text-secondary-500">{MOCK_DECISIONS.length} recent actions</span>
            </div>
            <div className="space-y-0">
              {MOCK_DECISIONS.map((decision) => {
                const time = new Date(decision.timestamp);
                const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={decision.id}
                    className="flex items-start space-x-4 p-3 hover:bg-secondary-50 rounded-lg transition-colors border-b border-secondary-100 last:border-0"
                  >
                    <span className="text-xs text-secondary-400 font-mono w-16 mt-1 shrink-0">{timeStr}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-secondary-900">{decision.action}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          decision.impactScore === 'high' ? 'bg-red-100 text-red-700' :
                          decision.impactScore === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-secondary-100 text-secondary-600'
                        }`}>
                          {decision.impactScore}
                        </span>
                      </div>
                      <p className="text-xs text-secondary-500 truncate">{decision.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-secondary-400 font-mono">{(decision.confidence * 100).toFixed(0)}%</span>
                      {decision.status === 'executed' ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : decision.status === 'pending_review' ? (
                        <AlertTriangle size={16} className="text-yellow-500" />
                      ) : (
                        <Activity size={16} className="text-primary-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentCorePage;
