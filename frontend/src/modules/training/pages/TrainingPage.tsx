import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  TrendingUp,
  Banknote,
  BrainCircuit,
  LineChart,
  ShieldCheck,
  ChevronRight,
  Lightbulb,
  Zap,
  Search,
  Database,
  Users,
  Briefcase,
  Layers,
  ArrowDown,
  Activity,
  DollarSign,
  PieChart,
  GitBranch,
  Lock,
  Network,
  FileBarChart,
  Rocket,
  Megaphone,
  CheckCircle2,
  Clock,
  Award,
  Trophy,
  Loader2,
  AlertCircle,
  Flame
} from 'lucide-react';
import { useTrainingStore } from '../store/trainingStore';

// Architecture Diagram Component
const ArchitectureDiagram: React.FC = () => (
  <div className="relative p-8 bg-white rounded-xl border border-secondary-200 overflow-hidden my-6 shadow-lg">
    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 pointer-events-none" />
    <div className="relative z-10 flex flex-col items-center">

      {/* Top Layer: Experience */}
      <div className="w-full max-w-3xl p-4 border border-primary-200 bg-primary-50 rounded-xl text-center relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-3 text-primary-600 text-[10px] font-bold uppercase tracking-widest border border-primary-200 rounded-full">
          Executive Experience Layer
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-white rounded border border-secondary-200 flex flex-col items-center shadow-sm">
            <Activity size={16} className="text-primary-600 mb-2" />
            <span className="text-xs font-semibold text-secondary-900">Command Center</span>
          </div>
          <div className="p-3 bg-white rounded border border-secondary-200 flex flex-col items-center shadow-sm">
            <Zap size={16} className="text-yellow-500 mb-2" />
            <span className="text-xs font-semibold text-secondary-900">Aether Agent</span>
          </div>
          <div className="p-3 bg-white rounded border border-secondary-200 flex flex-col items-center shadow-sm">
            <LineChart size={16} className="text-green-500 mb-2" />
            <span className="text-xs font-semibold text-secondary-900">Scenario Engine</span>
          </div>
        </div>
      </div>

      {/* Connector */}
      <div className="h-8 w-px bg-gradient-to-b from-primary-400 to-purple-400 my-1" />
      <ArrowDown size={16} className="text-purple-400 -mt-2" />

      {/* Middle Layer: Intelligence */}
      <div className="w-full max-w-4xl flex space-x-6">
        {/* Agents */}
        <div className="flex-1 p-4 border border-green-200 bg-green-50 rounded-xl text-center relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-3 text-green-600 text-[10px] font-bold uppercase tracking-widest border border-green-200 rounded-full">
            Agent Orchestration
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white p-2 rounded text-[10px] text-secondary-700 border border-secondary-200 shadow-sm">Root Cause Analysis</div>
            <div className="bg-white p-2 rounded text-[10px] text-secondary-700 border border-secondary-200 shadow-sm">Plan Generation</div>
            <div className="bg-white p-2 rounded text-[10px] text-secondary-700 border border-secondary-200 shadow-sm">Budget Seeding</div>
            <div className="bg-white p-2 rounded text-[10px] text-secondary-700 border border-secondary-200 shadow-sm">Audit Sentinel</div>
          </div>
        </div>

        {/* Core Models */}
        <div className="flex-1 p-4 border border-purple-200 bg-purple-50 rounded-xl text-center relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-3 text-purple-600 text-[10px] font-bold uppercase tracking-widest border border-purple-200 rounded-full">
            The Intelligent Core
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white p-2 rounded text-[10px] text-secondary-700 border border-secondary-200 shadow-sm">Predictive Forecasting</div>
            <div className="bg-white p-2 rounded text-[10px] text-secondary-700 border border-secondary-200 shadow-sm">Anomaly Detection</div>
            <div className="bg-white p-2 rounded text-[10px] text-secondary-700 border border-secondary-200 shadow-sm">Monte Carlo Sim</div>
            <div className="bg-white p-2 rounded text-[10px] text-secondary-700 border border-secondary-200 shadow-sm">Driver Analysis (SHAP)</div>
          </div>
        </div>
      </div>

      {/* Connector */}
      <div className="h-8 w-px bg-gradient-to-b from-purple-400 to-secondary-400 my-1" />
      <ArrowDown size={16} className="text-secondary-400 -mt-2" />

      {/* Bottom Layer: Data */}
      <div className="w-full max-w-3xl p-4 border border-secondary-300 bg-secondary-50 rounded-xl text-center relative">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-3 text-secondary-600 text-[10px] font-bold uppercase tracking-widest border border-secondary-300 rounded-full">
          Unified Data Fabric (Snowflake / dbt)
        </div>
        <div className="flex justify-center space-x-12 pt-4">
          <div className="flex flex-col items-center text-secondary-500">
            <div className="p-2 bg-white rounded-full border border-secondary-200 mb-2 shadow-sm"><Database size={16} /></div>
            <span className="text-[10px] font-bold">ERP (SAP S/4)</span>
          </div>
          <div className="flex flex-col items-center text-secondary-500">
            <div className="p-2 bg-white rounded-full border border-secondary-200 mb-2 shadow-sm"><Users size={16} /></div>
            <span className="text-[10px] font-bold">CRM (Salesforce)</span>
          </div>
          <div className="flex flex-col items-center text-secondary-500">
            <div className="p-2 bg-white rounded-full border border-secondary-200 mb-2 shadow-sm"><Briefcase size={16} /></div>
            <span className="text-[10px] font-bold">HRIS (Workday)</span>
          </div>
          <div className="flex flex-col items-center text-secondary-500">
            <div className="p-2 bg-white rounded-full border border-secondary-200 mb-2 shadow-sm"><Layers size={16} /></div>
            <span className="text-[10px] font-bold">Market Data</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Feature Bullet Component
const FeatureBullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start">
    <CheckCircle2 className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
    <span>{children}</span>
  </li>
);

// Section definitions
interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  color: string;
  duration: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'overview',
    title: 'System Architecture',
    icon: BookOpen,
    color: 'text-primary-600',
    duration: '10 min',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Project Aether Overview</h3>
          <p className="text-secondary-600 leading-relaxed mb-6">
            Aether is not just a reporting tool; it is an <strong className="text-secondary-900">Autonomous Financial Operating System</strong>.
            It moves beyond static "rear-view mirror" reporting to provide forward-looking intelligence,
            automating the analysis that usually consumes 70% of FP&A capacity.
          </p>
          <ArchitectureDiagram />
          <div className="card p-6 mt-6">
            <h4 className="font-bold text-secondary-900 mb-4">Core Capabilities</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-600">
              <FeatureBullet>
                <strong className="text-secondary-900">Digital Twin:</strong> Real-time replication of financial processes.
              </FeatureBullet>
              <FeatureBullet>
                <strong className="text-secondary-900">Generative Reasoning:</strong> LLMs that explain "Why" numbers changed.
              </FeatureBullet>
              <FeatureBullet>
                <strong className="text-secondary-900">Auto-Correction:</strong> Agents that can fix data errors or re-forecast.
              </FeatureBullet>
              <FeatureBullet>
                <strong className="text-secondary-900">Explainable AI:</strong> Every prediction is backed by driver analysis (SHAP).
              </FeatureBullet>
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
    color: 'text-green-500',
    duration: '8 min',
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-4">The Revenue Engine</h3>
          <p className="text-secondary-500 mb-6">
            The Sales Performance module provides a granular view of the organization's revenue generation capability,
            bridging the gap between CRM data and financial outcomes.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-5 card">
            <h4 className="font-bold text-secondary-900 flex items-center mb-3">
              <Layers size={18} className="mr-2 text-green-500" />
              Filtering & Segmentation
            </h4>
            <p className="text-sm text-secondary-600 mb-3">
              Users can slice data across three distinct dimensions to isolate performance drivers:
            </p>
            <ul className="list-disc list-inside text-sm text-secondary-500 space-y-1 ml-2">
              <li><strong className="text-secondary-700">Region:</strong> North America, Europe, Asia Pacific, Middle East, Latin America.</li>
              <li><strong className="text-secondary-700">Line of Business (LOB):</strong> Software (High Margin) vs. Services (Low Margin).</li>
              <li><strong className="text-secondary-700">Vertical:</strong> CPG, TMT, Life Sciences, Energy & Utilities, etc.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-secondary-50 rounded-xl border border-secondary-200">
              <h4 className="font-bold text-secondary-900 mb-2">Sales Funnel Analysis</h4>
              <p className="text-sm text-secondary-500">
                Tracks the conversion volume at every stage from "Prospecting" to "Closed Won".
                Includes a channel breakdown (e.g., Organic vs. Paid) to identify the most effective lead sources.
              </p>
            </div>
            <div className="p-5 bg-secondary-50 rounded-xl border border-secondary-200">
              <h4 className="font-bold text-secondary-900 mb-2">Stalled Opportunities</h4>
              <p className="text-sm text-secondary-500">
                Proactively alerts on deals stuck in a stage for too long (&gt;90 days).
                <span className="text-yellow-600 font-bold"> Amber</span> alerts for &gt;120 days,
                <span className="text-red-600 font-bold"> Red</span> alerts for &gt;150 days.
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
    color: 'text-primary-600',
    duration: '7 min',
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Strategic Profitability Analysis</h3>
          <p className="text-secondary-500">
            Deep dive into margin performance across the customer base.
          </p>
        </div>
        <div className="card p-6">
          <h4 className="font-bold text-secondary-900 mb-4">Key Features</h4>
          <ul className="space-y-3 text-sm text-secondary-600">
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 mr-3 flex-shrink-0" />
              <p><strong className="text-secondary-900">License vs. Implementation Toggle:</strong> Switch views to analyze high-margin software deals vs low-margin service projects.</p>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 mr-3 flex-shrink-0" />
              <p><strong className="text-secondary-900">Margin by Segment:</strong> Compare gross margins between Enterprise and Mid-Market segments.</p>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 mr-3 flex-shrink-0" />
              <p><strong className="text-secondary-900">Account Distribution:</strong> Scatter plot showing Revenue vs Margin for all accounts.</p>
            </li>
            <li className="flex items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-1.5 mr-3 flex-shrink-0" />
              <p><strong className="text-secondary-900">Net Margin Trend:</strong> Visualize profitability over time with optional regional filtering.</p>
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
    color: 'text-purple-500',
    duration: '6 min',
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Acquisition Engine</h3>
          <p className="text-secondary-500">
            Understand where leads come from and how much they cost.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h4 className="font-bold text-secondary-900 mb-2">Marketing Funnel</h4>
            <p className="text-sm text-secondary-600">
              Visualize the complete journey from Leads &rarr; MQLs &rarr; SQLs &rarr; Opportunities &rarr; Customers with conversion rates at each stage.
            </p>
          </div>
          <div className="card p-6">
            <h4 className="font-bold text-secondary-900 mb-2">Lead Distribution</h4>
            <p className="text-sm text-secondary-600">
              Pie chart visualization of incoming volume by channel (Organic, Paid Search, Events, Referrals, etc.).
            </p>
          </div>
          <div className="card p-6">
            <h4 className="font-bold text-secondary-900 mb-2">Channel Efficiency</h4>
            <p className="text-sm text-secondary-600">
              Table comparing Revenue Generated vs CAC. Identifies channels with the highest ROI multiplier.
            </p>
          </div>
          <div className="card p-6">
            <h4 className="font-bold text-secondary-900 mb-2">Campaign Performance</h4>
            <p className="text-sm text-secondary-600">
              Track individual campaigns with spend, leads generated, conversions, and ROI metrics.
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
    color: 'text-orange-500',
    duration: '5 min',
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Unit Economics</h3>
          <p className="text-secondary-500">
            High-level health check of the business model with SaaS-focused metrics.
          </p>
        </div>
        <div className="card p-6">
          <h4 className="font-bold text-secondary-900 mb-4">Key Metrics Tracked</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-secondary-600">
            <li className="flex items-center p-3 bg-secondary-50 rounded border border-secondary-200">
              <Activity size={16} className="text-orange-500 mr-3" />
              <div>
                <strong className="text-secondary-900 block">CAC Payback Period</strong>
                <span className="text-secondary-400 text-xs">Months to recover acquisition cost</span>
              </div>
            </li>
            <li className="flex items-center p-3 bg-secondary-50 rounded border border-secondary-200">
              <Activity size={16} className="text-orange-500 mr-3" />
              <div>
                <strong className="text-secondary-900 block">LTV : CAC Ratio</strong>
                <span className="text-secondary-400 text-xs">Lifetime value vs acquisition cost</span>
              </div>
            </li>
            <li className="flex items-center p-3 bg-secondary-50 rounded border border-secondary-200">
              <Activity size={16} className="text-orange-500 mr-3" />
              <div>
                <strong className="text-secondary-900 block">Net Revenue Retention</strong>
                <span className="text-secondary-400 text-xs">Expansion minus churn</span>
              </div>
            </li>
            <li className="flex items-center p-3 bg-secondary-50 rounded border border-secondary-200">
              <Activity size={16} className="text-orange-500 mr-3" />
              <div>
                <strong className="text-secondary-900 block">Magic Number</strong>
                <span className="text-secondary-400 text-xs">Sales efficiency indicator</span>
              </div>
            </li>
            <li className="flex items-center p-3 bg-secondary-50 rounded border border-secondary-200">
              <Activity size={16} className="text-orange-500 mr-3" />
              <div>
                <strong className="text-secondary-900 block">Rule of 40</strong>
                <span className="text-secondary-400 text-xs">Growth rate + profit margin</span>
              </div>
            </li>
            <li className="flex items-center p-3 bg-secondary-50 rounded border border-secondary-200">
              <Activity size={16} className="text-orange-500 mr-3" />
              <div>
                <strong className="text-secondary-900 block">Cost Per Lead (CPL)</strong>
                <span className="text-secondary-400 text-xs">Marketing efficiency</span>
              </div>
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
    color: 'text-primary-600',
    duration: '8 min',
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-4">Profitability & SaaS Metrics</h3>
          <p className="text-secondary-500 mb-6">
            A dedicated view for understanding quality of revenue, product margins, and subscription health.
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-5 card">
            <h4 className="font-bold text-secondary-900 flex items-center mb-3">
              <Layers size={18} className="mr-2 text-primary-600" />
              Revenue Waterfall
            </h4>
            <p className="text-sm text-secondary-600 mb-4">
              The visual bridge between your starting ARR and ending Forecast.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-secondary-50 p-3 rounded border border-secondary-200">
                <span className="text-primary-600 font-bold block">Base Contracted</span>
                <span className="text-secondary-500">Existing recurring revenue secured at start of period.</span>
              </div>
              <div className="bg-secondary-50 p-3 rounded border border-secondary-200">
                <span className="text-green-600 font-bold block">New Pipeline</span>
                <span className="text-secondary-500">Weighted probability of new deals closing.</span>
              </div>
              <div className="bg-secondary-50 p-3 rounded border border-secondary-200">
                <span className="text-red-600 font-bold block">Churn</span>
                <span className="text-secondary-500">Predicted contraction or loss of customers.</span>
              </div>
              <div className="bg-secondary-50 p-3 rounded border border-secondary-200">
                <span className="text-secondary-900 font-bold block">Final Forecast</span>
                <span className="text-secondary-500">The resulting GAAP revenue prediction.</span>
              </div>
            </div>
          </div>

          <div className="p-5 card">
            <h4 className="font-bold text-secondary-900 flex items-center mb-3">
              <DollarSign size={18} className="mr-2 text-primary-600" />
              Product Profitability
            </h4>
            <p className="text-sm text-secondary-600">
              Analyzes <strong className="text-secondary-900">Contribution Margin</strong> (Revenue - COGS) by product line.
              Essential for deciding which products to scale and which to sunset.
              The system highlights low-margin products in <span className="text-yellow-600">amber</span> and high-margin in <span className="text-green-600">green</span>.
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
    color: 'text-red-500',
    duration: '7 min',
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">The Efficiency Engine</h3>
          <p className="text-secondary-500">Proactive cost control and anomaly detection across the organization.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="card p-6">
            <h4 className="font-bold text-secondary-900 flex items-center mb-3">
              <Search className="mr-2 text-red-500" size={18} />
              Phantom Cost Hunter
            </h4>
            <p className="text-sm text-secondary-600 leading-relaxed">
              A specialized AI agent that audits GL entries for waste. It detects:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-secondary-500 space-y-1 ml-4">
              <li>Duplicate SaaS licenses (e.g., Zoom + Webex for same user).</li>
              <li>Unused seats (Software assigned but not logged into for 30+ days).</li>
              <li>T&E Policy Violations (e.g., First Class flights without approval).</li>
            </ul>
          </div>

          <div className="card p-6">
            <h4 className="font-bold text-secondary-900 flex items-center mb-3">
              <TrendingUp className="mr-2 text-primary-600" size={18} />
              Vendor Spend Analysis
            </h4>
            <p className="text-sm text-secondary-600 leading-relaxed">
              A Treemap visualization that maps spend size to box area, and YoY growth to color.
              <span className="text-red-600 font-bold"> Red</span> indicates rapidly increasing costs that may need renegotiation.
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
    color: 'text-purple-500',
    duration: '9 min',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Central Neural Engine</h3>
          <p className="text-secondary-500">
            The brain of Aether. This view monitors the health, accuracy, and latency of the machine learning models powering the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 card">
            <h4 className="font-bold text-secondary-900 flex items-center mb-2">
              <GitBranch size={18} className="mr-2 text-purple-500" />
              Model Drift Detection
            </h4>
            <p className="text-sm text-secondary-600">
              Models degrade over time as business conditions change. The Core monitors <strong className="text-secondary-900">Accuracy</strong> vs. Baseline.
              If drift is detected, the system can trigger an auto-retraining pipeline.
            </p>
          </div>
          <div className="p-5 card">
            <h4 className="font-bold text-secondary-900 flex items-center mb-2">
              <Zap size={18} className="mr-2 text-yellow-500" />
              Autonomous Decisions
            </h4>
            <p className="text-sm text-secondary-600">
              A log of actions taken by the AI without human intervention, such as scaling compute resources during heavy reporting loads or adjusting forecast baselines based on new actuals.
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-bold text-secondary-900 mb-4">Active Model Registry</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-secondary-50 p-3 rounded border border-secondary-200">
              <span className="text-purple-600 font-medium text-sm">Revenue Forecasting</span>
              <span className="block text-secondary-400 text-xs mt-1">94.3% accuracy</span>
            </div>
            <div className="bg-secondary-50 p-3 rounded border border-secondary-200">
              <span className="text-purple-600 font-medium text-sm">Anomaly Detection</span>
              <span className="block text-secondary-400 text-xs mt-1">96.7% accuracy</span>
            </div>
            <div className="bg-secondary-50 p-3 rounded border border-secondary-200">
              <span className="text-purple-600 font-medium text-sm">Churn Prediction</span>
              <span className="block text-secondary-400 text-xs mt-1">89.1% accuracy</span>
            </div>
            <div className="bg-secondary-50 p-3 rounded border border-secondary-200">
              <span className="text-purple-600 font-medium text-sm">Driver Analysis</span>
              <span className="block text-secondary-400 text-xs mt-1">91.2% accuracy</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'scenarios',
    title: 'Scenario Planning',
    icon: LineChart,
    color: 'text-indigo-500',
    duration: '8 min',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Monte Carlo Simulation</h3>
          <p className="text-secondary-500">Advanced stochastic modeling to quantify risk and probability.</p>
        </div>
        <div className="card p-6">
          <p className="text-secondary-600 mb-4">
            Instead of static "Best/Worst" cases, Aether runs <strong className="text-secondary-900">10,000 simulations</strong> to generate a probability distribution of outcomes.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mt-1 p-1 bg-indigo-500 rounded-full mr-3" />
              <div>
                <h5 className="text-secondary-900 font-bold text-sm">Inputs (Drivers)</h5>
                <p className="text-secondary-500 text-sm">Adjust Inflation, Growth Targets, and Headcount to see dynamic impact.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="mt-1 p-1 bg-indigo-500 rounded-full mr-3" />
              <div>
                <h5 className="text-secondary-900 font-bold text-sm">GenAI Analysis</h5>
                <p className="text-secondary-500 text-sm">
                  Once the simulation completes, a Large Language Model analyzes the data to produce
                  <strong className="text-secondary-900"> Mitigation Strategies</strong> (if risk is high) or <strong className="text-secondary-900">Growth Opportunities</strong> (if results are positive).
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
    color: 'text-yellow-500',
    duration: '6 min',
    content: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Trust & Compliance</h3>
          <p className="text-secondary-500">
            For AI to be used in Finance, it must be explainable and auditable.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 card">
            <h4 className="font-bold text-secondary-900 mb-2 flex items-center">
              <Network size={18} className="mr-2 text-yellow-500" />
              Data Lineage Explorer
            </h4>
            <p className="text-sm text-secondary-600">
              Interactive map tracing financial figures back to their source.
              Click on any node (e.g., "Snowflake Raw") to inspect upstream dependencies (Salesforce) and downstream consumers (Dashboard).
              Critical for SOX audits.
            </p>
          </div>
          <div className="p-4 card">
            <h4 className="font-bold text-secondary-900 mb-2 flex items-center">
              <Lock size={18} className="mr-2 text-orange-500" />
              Audit Trail
            </h4>
            <p className="text-sm text-secondary-600">
              Immutable log of every action taken by both Human users and AI Agents, tagged with a Risk Level.
            </p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'data-import',
    title: 'Data Import & Templates',
    icon: Database,
    color: 'text-blue-500',
    duration: '10 min',
    content: (
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-secondary-900 mb-2">Data Import Guide</h3>
          <p className="text-secondary-500">
            Learn how to import your data into Aether using our standardized CSV templates.
            Navigate to <strong className="text-secondary-900">Settings &rarr; Data Import</strong> to access the import functionality.
          </p>
        </div>

        <div className="card p-6">
          <h4 className="font-bold text-secondary-900 mb-4">Available Templates</h4>
          <div className="space-y-4">
            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <h5 className="font-bold text-secondary-900 mb-2">1. Financial Metrics</h5>
              <p className="text-sm text-secondary-600 mb-2">Revenue, expenses, EBITDA, margins by region and segment.</p>
              <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs text-secondary-500 overflow-x-auto">
                Date, Region, Segment, Vertical, Revenue, Expenses, EBITDA, Gross_Margin_Pct, Net_Margin_Pct, Cash_Flow
              </div>
            </div>

            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <h5 className="font-bold text-secondary-900 mb-2">2. Profitability Data</h5>
              <p className="text-sm text-secondary-600 mb-2">Account-level profitability with costs and margins. Supports both License and Implementation report types.</p>
              <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs text-secondary-500 overflow-x-auto">
                Account_ID, Account_Name, Region, Segment, Vertical, Revenue, Cloud_Infra_Cost, Resource_Cost, TSO_Cost, Engineering_Cost, Gross_Margin_Value, Gross_Margin_Pct, Contribution_Margin_Pct, Health_Score, Renewal_Date, Report_Type
              </div>
              <div className="mt-2 text-xs text-secondary-400">
                <strong>Filters:</strong> Region (NA, EU, APAC, ME, LATAM) | Segment (Enterprise, Mid-Market) | Vertical (CPG, AIM, TMT, E&U, LS, Others)
              </div>
            </div>

            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <h5 className="font-bold text-secondary-900 mb-2">3. Sales Performance</h5>
              <p className="text-sm text-secondary-600 mb-2">Sales pipeline, opportunities, and forecast data by channel and stage.</p>
              <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs text-secondary-500 overflow-x-auto">
                Opportunity_ID, Account_Name, Region, LOB, Vertical, Channel, Stage, Probability_Pct, Deal_Value, Weighted_Value, Expected_Close_Date, Days_In_Stage, Owner, Status, Loss_Reason
              </div>
              <div className="mt-2 text-xs text-secondary-400">
                <strong>Filters:</strong> Region | LOB (Software, Services) | Vertical | Channel (Direct, Partner, Reseller)
              </div>
            </div>

            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <h5 className="font-bold text-secondary-900 mb-2">4. Revenue Analytics</h5>
              <p className="text-sm text-secondary-600 mb-2">ARR movements, bookings, churn, and expansion metrics for SaaS reporting.</p>
              <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs text-secondary-500 overflow-x-auto">
                Date, Region, Segment, Product_Line, Beginning_ARR, New_Bookings, Expansion, Contraction, Churn, Ending_ARR, Net_New_ARR, NRR_Pct, GRR_Pct
              </div>
            </div>

            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <h5 className="font-bold text-secondary-900 mb-2">5. Cost Data</h5>
              <p className="text-sm text-secondary-600 mb-2">Cost line items with categories, vendors, and budget variance.</p>
              <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs text-secondary-500 overflow-x-auto">
                Date, Cost_Center_ID, Cost_Center_Name, Category, Sub_Category, Vendor, Amount, Budget, Variance, Region, Department
              </div>
            </div>

            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <h5 className="font-bold text-secondary-900 mb-2">6. Vendors</h5>
              <p className="text-sm text-secondary-600 mb-2">Vendor master data with contracts and spend information.</p>
              <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs text-secondary-500 overflow-x-auto">
                Vendor_ID, Vendor_Name, Category, Contact_Name, Contact_Email, Contract_Start, Contract_End, Annual_Spend, Payment_Terms, Status, Risk_Rating
              </div>
            </div>

            <div className="p-4 bg-secondary-50 rounded-lg border border-secondary-200">
              <h5 className="font-bold text-secondary-900 mb-2">7. Cost Centers</h5>
              <p className="text-sm text-secondary-600 mb-2">Hierarchical cost center structure with budgets.</p>
              <div className="bg-white p-3 rounded border border-secondary-200 font-mono text-xs text-secondary-500 overflow-x-auto">
                Cost_Center_ID, Name, Parent_ID, Level, Manager, Annual_Budget, YTD_Actual, YTD_Variance, Department, Region, Status
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-bold text-secondary-900 mb-4">Filter Dimensions Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h5 className="font-bold text-blue-900 mb-2">Regions</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>- North America (NA)</li>
                <li>- Europe (EU)</li>
                <li>- Asia Pacific (APAC)</li>
                <li>- Middle East (ME)</li>
                <li>- Latin America (LATAM)</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h5 className="font-bold text-green-900 mb-2">Segments</h5>
              <ul className="text-sm text-green-700 space-y-1">
                <li>- Enterprise (High-value accounts)</li>
                <li>- Mid-Market (Growth accounts)</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h5 className="font-bold text-purple-900 mb-2">Verticals</h5>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>- CPG (Consumer Packaged Goods)</li>
                <li>- AIM (Automotive, Industrial, Manufacturing)</li>
                <li>- TMT (Technology, Media, Telecom)</li>
                <li>- E&U (Energy & Utilities)</li>
                <li>- LS (Life Sciences)</li>
                <li>- Others</li>
              </ul>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h5 className="font-bold text-orange-900 mb-2">Channels (Sales)</h5>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>- Direct (In-house sales)</li>
                <li>- Partner (Channel partners)</li>
                <li>- Reseller (Third-party)</li>
                <li>- Organic (Inbound)</li>
                <li>- Referral (Customer referrals)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-bold text-secondary-900 mb-4">Import Best Practices</h4>
          <ul className="space-y-3 text-sm text-secondary-600">
            <li className="flex items-start">
              <CheckCircle2 className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
              <span><strong className="text-secondary-900">Download templates first:</strong> Always start by downloading the template to ensure correct column headers and formats.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
              <span><strong className="text-secondary-900">Use consistent naming:</strong> Ensure Region, Segment, Vertical, and Channel values match the standard values listed above.</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
              <span><strong className="text-secondary-900">Date format:</strong> Use YYYY-MM-DD format for all date fields (e.g., 2025-01-15).</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
              <span><strong className="text-secondary-900">Numeric values:</strong> Use plain numbers without currency symbols or commas. Percentages should be decimals (e.g., 0.72 for 72%).</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="text-green-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
              <span><strong className="text-secondary-900">Maximum file size:</strong> Keep imports under 50MB. For larger datasets, split into multiple files.</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }
];

// Map section IDs to content lookup
const SECTION_CONTENT_MAP = new Map(SECTIONS.map(s => [s.id, s]));

// Icon map for server-driven module list
const ICON_MAP: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  'overview': BookOpen,
  'sales': TrendingUp,
  'reports': FileBarChart,
  'marketing': Megaphone,
  'gtm': Rocket,
  'revenue': PieChart,
  'cost': Banknote,
  'intelligence': BrainCircuit,
  'scenarios': LineChart,
  'governance': ShieldCheck,
  'data-import': Database,
};

const COLOR_MAP: Record<string, string> = {
  'overview': 'text-primary-600',
  'sales': 'text-green-500',
  'reports': 'text-primary-600',
  'marketing': 'text-purple-500',
  'gtm': 'text-orange-500',
  'revenue': 'text-primary-600',
  'cost': 'text-red-500',
  'intelligence': 'text-purple-500',
  'scenarios': 'text-indigo-500',
  'governance': 'text-yellow-500',
  'data-import': 'text-blue-500',
};

// Certificate toast notification
const CertificateToast: React.FC<{ titles: string[]; onClose: () => void }> = ({ titles, onClose }) => (
  <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
    <div className="bg-white rounded-xl shadow-2xl border border-yellow-200 p-6 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-yellow-50 rounded-lg">
          <Trophy size={24} className="text-yellow-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-secondary-900">Certificate Earned!</h4>
          {titles.map((title) => (
            <p key={title} className="text-sm text-secondary-600 mt-1">{title}</p>
          ))}
        </div>
        <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">&times;</button>
      </div>
    </div>
  </div>
);

const TrainingPage: React.FC = () => {
  const {
    modules,
    progress,
    certificates,
    isLoadingModules,
    isLoadingProgress,
    error,
    fetchModules,
    fetchProgress,
    fetchCertificates,
    completeModule,
    uncompleteModule,
  } = useTrainingStore();

  const [activeSectionId, setActiveSectionId] = useState(SECTIONS[0].id);
  const [certToast, setCertToast] = useState<string[] | null>(null);
  const [showCerts, setShowCerts] = useState(false);

  useEffect(() => {
    fetchModules();
    fetchProgress();
    fetchCertificates();
  }, [fetchModules, fetchProgress, fetchCertificates]);

  // Build completion set from server data
  const completedSlugs = new Set(
    modules.filter((m) => m.isCompleted).map((m) => m.slug),
  );

  // Use server modules for sidebar order, fall back to static SECTIONS for content
  const sidebarModules = modules.length > 0 ? modules : SECTIONS.map((s) => ({
    id: s.id,
    slug: s.id,
    title: s.title,
    description: null,
    category: '',
    duration: s.duration,
    sortOrder: 0,
    isCompleted: false,
  }));

  const activeSection = SECTION_CONTENT_MAP.get(activeSectionId) || SECTIONS[0];
  const progressPercent = progress?.percentComplete ?? (modules.length > 0
    ? Math.round((completedSlugs.size / modules.length) * 100)
    : 0);
  const completedCount = progress?.completedModules.length ?? completedSlugs.size;
  const totalCount = progress?.totalModules ?? sidebarModules.length;

  const handleMarkComplete = useCallback(async () => {
    const newCerts = await completeModule(activeSectionId);
    if (newCerts.length > 0) {
      setCertToast(newCerts);
      setTimeout(() => setCertToast(null), 5000);
    }
    // Auto-advance to next section
    const currentIndex = sidebarModules.findIndex((s) => s.slug === activeSectionId);
    if (currentIndex < sidebarModules.length - 1) {
      setActiveSectionId(sidebarModules[currentIndex + 1].slug);
    }
  }, [activeSectionId, completeModule, sidebarModules]);

  const handleUncomplete = useCallback(async () => {
    await uncompleteModule(activeSectionId);
  }, [activeSectionId, uncompleteModule]);

  if (error && modules.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-secondary-900 mb-2">Failed to load training</h2>
          <p className="text-secondary-500 mb-4">{error}</p>
          <button onClick={() => fetchModules()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Certificate Toast */}
      {certToast && <CertificateToast titles={certToast} onClose={() => setCertToast(null)} />}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center">
              <Lightbulb className="mr-3 text-yellow-500" size={28} />
              Training Center
            </h1>
            <p className="text-secondary-500 mt-1">System documentation, feature guides, and architectural overview.</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Streak */}
            {progress && progress.streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
                <Flame size={16} className="text-orange-500" />
                <span className="text-sm font-semibold text-orange-700">{progress.streak} day streak</span>
              </div>
            )}
            {/* Certificates button */}
            <button
              onClick={() => setShowCerts(!showCerts)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
            >
              <Trophy size={16} className="text-yellow-500" />
              <span className="text-sm font-semibold text-yellow-700">
                {certificates.filter((c) => c.status === 'earned').length} Certificates
              </span>
            </button>
            {/* Progress */}
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Award size={18} className="text-yellow-500" />
                <span className="text-sm text-secondary-500">
                  {isLoadingProgress ? '...' : `${completedCount} of ${totalCount} modules completed`}
                </span>
              </div>
              <div className="w-48 h-2 bg-secondary-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Panel */}
      {showCerts && (
        <div className="mb-6 card p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-secondary-900 flex items-center gap-2">
              <Trophy size={20} className="text-yellow-500" />
              Certificates
            </h3>
            <button onClick={() => setShowCerts(false)} className="text-secondary-400 hover:text-secondary-600">&times;</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className={`p-4 rounded-xl border ${
                  cert.status === 'earned'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-secondary-50 border-secondary-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {cert.status === 'earned' ? (
                    <CheckCircle2 size={18} className="text-green-500" />
                  ) : (
                    <Award size={18} className="text-secondary-400" />
                  )}
                  <h4 className="font-bold text-secondary-900 text-sm">{cert.title}</h4>
                </div>
                {cert.description && (
                  <p className="text-xs text-secondary-500 mb-2">{cert.description}</p>
                )}
                {cert.status === 'earned' ? (
                  <p className="text-xs text-green-600 font-medium">
                    Earned {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : ''}
                  </p>
                ) : (
                  <div>
                    <div className="w-full h-1.5 bg-secondary-200 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${cert.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-secondary-400">
                      {cert.completedModules.length}/{cert.requiredModules.length} modules ({cert.progress}%)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden card shadow-lg">
        {/* Sidebar Navigation */}
        <div className="w-72 bg-secondary-50 border-r border-secondary-200 flex flex-col overflow-y-auto">
          <div className="p-4 bg-white border-b border-secondary-200">
            <span className="text-xs font-bold text-secondary-400 uppercase tracking-wider">Modules</span>
          </div>
          {isLoadingModules && modules.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="px-2 space-y-1 py-4 flex-1">
              {sidebarModules.map((mod) => {
                const Icon = ICON_MAP[mod.slug] || BookOpen;
                const color = COLOR_MAP[mod.slug] || 'text-secondary-500';
                const isActive = activeSectionId === mod.slug;
                const isCompleted = completedSlugs.has(mod.slug);

                return (
                  <button
                    key={mod.slug}
                    onClick={() => setActiveSectionId(mod.slug)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border border-primary-200 shadow-sm'
                        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                    }`}
                  >
                    <div className="flex items-center">
                      {isCompleted ? (
                        <CheckCircle2 size={18} className="mr-3 text-green-500" />
                      ) : (
                        <Icon size={18} className={`mr-3 ${isActive ? color : 'text-secondary-400'}`} />
                      )}
                      <div className="text-left">
                        <span className="block">{mod.title}</span>
                        <span className="text-[10px] text-secondary-400 flex items-center mt-0.5">
                          <Clock size={10} className="mr-1" />
                          {mod.duration}
                        </span>
                      </div>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-primary-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto relative bg-white">
          <div className="p-10">
            <div className="max-w-5xl mx-auto">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-secondary-200">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-secondary-50 rounded-xl border border-secondary-200 shadow-sm">
                    {React.createElement(
                      ICON_MAP[activeSectionId] || activeSection.icon,
                      { size: 32, className: COLOR_MAP[activeSectionId] || activeSection.color },
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-secondary-900 tracking-tight">{activeSection.title}</h2>
                    <p className="text-secondary-500 text-sm mt-1 flex items-center">
                      <Clock size={14} className="mr-1" />
                      {activeSection.duration} read
                    </p>
                  </div>
                </div>

                {!completedSlugs.has(activeSectionId) ? (
                  <button
                    onClick={handleMarkComplete}
                    className="btn-primary flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Mark Complete
                  </button>
                ) : (
                  <button
                    onClick={handleUncomplete}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle2 size={18} />
                    Completed
                  </button>
                )}
              </div>

              {/* Section Content */}
              <div className="animate-fade-in">
                {activeSection.content}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-10 pt-6 border-t border-secondary-200">
                <button
                  onClick={() => {
                    const idx = sidebarModules.findIndex((s) => s.slug === activeSectionId);
                    if (idx > 0) setActiveSectionId(sidebarModules[idx - 1].slug);
                  }}
                  disabled={sidebarModules.findIndex((s) => s.slug === activeSectionId) === 0}
                  className="flex items-center gap-2 px-4 py-2 text-secondary-500 hover:text-secondary-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" />
                  Previous
                </button>
                <button
                  onClick={() => {
                    const idx = sidebarModules.findIndex((s) => s.slug === activeSectionId);
                    if (idx < sidebarModules.length - 1) setActiveSectionId(sidebarModules[idx + 1].slug);
                  }}
                  disabled={sidebarModules.findIndex((s) => s.slug === activeSectionId) === sidebarModules.length - 1}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Module
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
