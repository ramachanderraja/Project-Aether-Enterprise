
import React from 'react';
import { LayoutDashboard, BrainCircuit, LineChart, Network, MessageSquareText, ShieldCheck, Settings, Banknote, TrendingUp, BookOpen, PieChart, FileBarChart, Rocket, Megaphone } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'reports', label: 'Profitability Reports', icon: FileBarChart },
    { id: 'sales', label: 'Sales Performance', icon: TrendingUp },
    { id: 'marketing', label: 'Marketing Metrics', icon: Megaphone },
    { id: 'gtm', label: 'Go-to-Market Metrics', icon: Rocket },
    { id: 'revenue', label: 'Revenue & Profit', icon: PieChart },
    { id: 'cost', label: 'Cost & Efficiency', icon: Banknote },
    { id: 'intelligence', label: 'Intelligent Core', icon: BrainCircuit },
    { id: 'scenarios', label: 'Strategic Planning', icon: LineChart },
    { id: 'data-fabric', label: 'Data Fabric', icon: Network },
    { id: 'agent', label: 'Aether Agent', icon: MessageSquareText },
    { id: 'governance', label: 'Governance', icon: ShieldCheck },
    { id: 'training', label: 'Training Center', icon: BookOpen },
  ];

  return (
    <div className="w-64 bg-aether-900 border-r border-aether-700 h-screen flex flex-col fixed left-0 top-0 z-10">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          AETHER
        </h1>
        <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">Autonomous FP&A</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md transition-all duration-150 ${
                isActive
                  ? 'bg-aether-800 text-white font-medium border border-aether-700 shadow-sm'
                  : 'text-slate-400 hover:bg-aether-800/50 hover:text-slate-200'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-500' : 'text-slate-500'} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-aether-700">
        <button className="flex items-center space-x-3 px-3 py-2 text-slate-400 hover:text-slate-200 w-full rounded-md hover:bg-aether-800/50 transition-colors">
          <Settings size={18} />
          <span className="font-medium text-sm">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
