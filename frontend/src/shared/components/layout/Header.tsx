import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store/authStore';
import { authApi } from '@/modules/auth/services/authApi';

export function Header() {
  const navigate = useNavigate();
  const { user, clearAuth, refreshToken } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout(refreshToken || undefined);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
          <input
            type="text"
            placeholder="Search metrics, deals, scenarios..."
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary-100 transition-colors">
          <Bell size={20} className="text-secondary-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <User size={18} className="text-primary-600" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-secondary-900">{user?.name || 'User'}</p>
              <p className="text-xs text-secondary-500">{user?.roles?.[0] || 'Analyst'}</p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-secondary-100">
                <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                <p className="text-xs text-secondary-500">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
              >
                <Settings size={16} />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-600 hover:bg-error-50"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
