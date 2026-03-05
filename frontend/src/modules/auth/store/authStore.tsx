import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createContext, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  tenant_id: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissionsVerified: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setPermissionsVerified: (verified: boolean) => void;
  updateUserFromServer: (serverUser: { roles: string[]; permissions: string[] }) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      permissionsVerified: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          permissionsVerified: true,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          permissionsVerified: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setPermissionsVerified: (verified) => set({ permissionsVerified: verified }),

      updateUserFromServer: (serverUser) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              roles: serverUser.roles,
              permissions: serverUser.permissions,
            },
            permissionsVerified: true,
          });
        }
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user?.permissions) return false;
        return user.permissions.includes('*') || user.permissions.includes(permission);
      },

      hasRole: (role) => {
        const { user } = get();
        return user?.roles.includes(role) ?? false;
      },
    }),
    {
      name: 'aether-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // NOTE: permissionsVerified is intentionally NOT persisted.
        // On refresh, it defaults to false, forcing server re-validation.
      }),
      onRehydrateStorage: () => (state) => {
        state?.setLoading(false);
      },
    }
  )
);

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore();

  return (
    <AuthContext.Provider value={store}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
