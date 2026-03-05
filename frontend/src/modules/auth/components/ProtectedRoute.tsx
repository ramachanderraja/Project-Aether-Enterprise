import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/authApi';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

// Permission-to-route mapping
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'view:dashboard',
  '/ai': 'view:ai',
  '/sales': 'view:sales',
  '/marketing': 'view:marketing',
  '/gtm': 'view:gtm',
  '/cost': 'view:cost',
  '/revenue': 'view:arr',
  '/reports': 'view:reports',
  '/scenarios': 'view:scenarios',
  '/intelligence': 'view:intelligence',
  '/governance': 'view:governance',
  '/training': 'view:training',
  '/data-fabric': 'view:data-fabric',
  '/integrations': 'view:integrations',
  '/settings': 'view:settings',
};

// First allowed route for a user (used as default redirect)
const TAB_PRIORITY = [
  '/dashboard', '/sales', '/revenue', '/ai', '/settings',
];

function getFirstAllowedRoute(permissions: string[]): string {
  if (permissions.includes('*')) return '/dashboard';
  for (const route of TAB_PRIORITY) {
    const perm = ROUTE_PERMISSIONS[route];
    if (perm && permissions.includes(perm)) return route;
  }
  return '/settings';
}

function hasRouteAccess(pathname: string, permissions: string[]): boolean {
  if (permissions.includes('*')) return true;
  // Match the base route (e.g. /sales/something -> /sales)
  const baseRoute = '/' + pathname.split('/').filter(Boolean)[0];
  const requiredPerm = ROUTE_PERMISSIONS[baseRoute];
  if (!requiredPerm) return false;
  return permissions.includes(requiredPerm);
}

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, user, permissionsVerified, updateUserFromServer, clearAuth } = useAuthStore();
  const location = useLocation();
  const revalidating = useRef(false);

  // On mount (page refresh), re-validate permissions from the server
  useEffect(() => {
    if (!isAuthenticated || permissionsVerified || isLoading || revalidating.current) return;
    revalidating.current = true;

    authApi
      .getMe()
      .then((serverUser) => {
        updateUserFromServer({
          roles: serverUser.roles,
          permissions: serverUser.permissions,
        });
      })
      .catch(() => {
        // Token is invalid or expired — force re-login
        clearAuth();
      })
      .finally(() => {
        revalidating.current = false;
      });
  }, [isAuthenticated, permissionsVerified, isLoading, updateUserFromServer, clearAuth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Wait for server-side permission verification before rendering any route
  if (!permissionsVerified) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const permissions = user?.permissions || [];

  // Redirect root to first allowed route
  if (location.pathname === '/') {
    return <Navigate to={getFirstAllowedRoute(permissions)} replace />;
  }

  // Check if user has access to this route
  if (!hasRouteAccess(location.pathname, permissions)) {
    return <Navigate to={getFirstAllowedRoute(permissions)} replace />;
  }

  return <Outlet />;
}
