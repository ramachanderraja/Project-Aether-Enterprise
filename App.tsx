
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import AIAgentView from './components/views/AIAgentView';
import ScenarioView from './components/views/ScenarioView';
import DataFabricView from './components/views/DataFabricView';
import GovernanceView from './components/views/GovernanceView';
import IntelligentCoreView from './components/views/IntelligentCoreView';
import SalesView from './components/views/SalesView';
import CostView from './components/views/CostView';
import RevenueView from './components/views/RevenueView';
import TrainingView from './components/views/TrainingView';
import ReportsView from './components/views/ReportsView';
import MarketingView from './components/views/MarketingView';
import GTMView from './components/views/GTMView';

const App: React.FC = () => {
  const activeTabFromStorage = localStorage.getItem('activeTab') || 'dashboard';
  const [activeTab, setActiveTabState] = useState(activeTabFromStorage);

  const setActiveTab = (tab: string) => {
      setActiveTabState(tab);
      localStorage.setItem('activeTab', tab);
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveTab} />;
      case 'reports':
        return <ReportsView />;
      case 'sales':
        return <SalesView />;
      case 'marketing':
        return <MarketingView />;
      case 'gtm':
        return <GTMView />;
      case 'revenue':
        return <RevenueView />;
      case 'cost':
        return <CostView />;
      case 'agent':
        return <AIAgentView />;
      case 'scenarios':
        return <ScenarioView />;
      case 'data-fabric':
        return <DataFabricView />;
      case 'governance':
        return <GovernanceView />;
      case 'intelligence':
        return <IntelligentCoreView />;
      case 'training':
        return <TrainingView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <h3 className="text-2xl font-bold mb-2 text-slate-300">Module Under Construction</h3>
            <p>This pillar of Project Aether is currently being architected.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-aether-900 text-slate-200 font-sans selection:bg-blue-500/30">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 ml-64 h-full relative overflow-hidden bg-aether-900">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
