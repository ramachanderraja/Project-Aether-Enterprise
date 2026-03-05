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
import { useAuthStore } from '@/modules/auth/store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'view:dashboard' },
  { to: '/ai', label: 'AI Agent', icon: MessageSquare, permission: 'view:ai' },
  { to: '/sales', label: 'Sales Performance', icon: TrendingUp, permission: 'view:sales' },
  { to: '/marketing', label: 'Marketing', icon: Megaphone, permission: 'view:marketing' },
  { to: '/gtm', label: 'GTM Metrics', icon: Rocket, permission: 'view:gtm' },
  { to: '/cost', label: 'Cost Intelligence', icon: DollarSign, permission: 'view:cost' },
  { to: '/revenue', label: 'ARR Analytics', icon: BarChart3, permission: 'view:arr' },
  { to: '/reports', label: 'Profitability', icon: FileBarChart, permission: 'view:reports' },
  { to: '/scenarios', label: 'Scenarios', icon: GitBranch, permission: 'view:scenarios' },
  { to: '/intelligence', label: 'Intelligent Core', icon: Brain, permission: 'view:intelligence' },
  { to: '/governance', label: 'Governance', icon: Shield, permission: 'view:governance' },
];

const bottomNavItems: NavItem[] = [
  { to: '/training', label: 'Training Center', icon: BookOpen, permission: 'view:training' },
  { to: '/data-fabric', label: 'Data Fabric', icon: Database, permission: 'view:data-fabric' },
  { to: '/integrations', label: 'Integrations', icon: Plug, permission: 'view:integrations' },
  { to: '/settings', label: 'Settings', icon: Settings, permission: 'view:settings' },
];

function filterByPermissions(items: NavItem[], permissions: string[]): NavItem[] {
  if (permissions.includes('*')) return items;
  return items.filter((item) => permissions.includes(item.permission));
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions || [];

  const visibleNavItems = filterByPermissions(navItems, permissions);
  const visibleBottomItems = filterByPermissions(bottomNavItems, permissions);

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
            <span className="font-semibold text-lg">Aether_456</span>
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
          {visibleNavItems.map((item) => (
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
          {visibleBottomItems.map((item) => (
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
