import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
  DollarSign,
  BarChart3,
  GitBranch,
  Shield,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plug,
  FileBarChart,
  Megaphone,
  Rocket,
  Brain,
  BookOpen,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ai', label: 'AI Agent', icon: MessageSquare },
  { to: '/sales', label: 'Sales Performance', icon: TrendingUp },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/gtm', label: 'GTM Metrics', icon: Rocket },
  { to: '/cost', label: 'Cost Intelligence', icon: DollarSign },
  { to: '/revenue', label: 'ARR Analytics', icon: BarChart3 },
  { to: '/reports', label: 'Profitability', icon: FileBarChart },
  { to: '/scenarios', label: 'Scenarios', icon: GitBranch },
  { to: '/intelligence', label: 'Intelligent Core', icon: Brain },
  { to: '/governance', label: 'Governance', icon: Shield },
];

const bottomNavItems = [
  { to: '/training', label: 'Training Center', icon: BookOpen },
  { to: '/data-fabric', label: 'Data Fabric', icon: Database },
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={clsx(
        'bg-secondary-900 text-white transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-secondary-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Aether123</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                  )
                }
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-secondary-800 py-4">
        <ul className="space-y-1 px-2">
          {bottomNavItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
                  )
                }
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
