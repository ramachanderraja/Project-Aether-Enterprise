import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/modules/auth/store/authStore';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
