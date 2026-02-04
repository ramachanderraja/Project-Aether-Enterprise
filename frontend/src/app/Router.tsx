import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { AuthLayout } from '@/shared/components/layout/AuthLayout';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';

// Lazy-loaded pages
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/pages/DashboardPage'));
const AIAgentPage = lazy(() => import('@/modules/ai-agent/pages/AIAgentPage'));
const SalesPage = lazy(() => import('@/modules/sales/pages/SalesPage'));
const MarketingPage = lazy(() => import('@/modules/marketing/pages/MarketingPage'));
const GTMPage = lazy(() => import('@/modules/gtm/pages/GTMPage'));
const CostPage = lazy(() => import('@/modules/cost/pages/CostPage'));
const RevenuePage = lazy(() => import('@/modules/revenue/pages/RevenuePage'));
const ReportsPage = lazy(() => import('@/modules/reports/pages/ReportsPage'));
const ScenariosPage = lazy(() => import('@/modules/scenarios/pages/ScenariosPage'));
const IntelligentCorePage = lazy(() => import('@/modules/intelligence/pages/IntelligentCorePage'));
const GovernancePage = lazy(() => import('@/modules/governance/pages/GovernancePage'));
const TrainingPage = lazy(() => import('@/modules/training/pages/TrainingPage'));
const DataFabricPage = lazy(() => import('@/modules/data-fabric/pages/DataFabricPage'));
const IntegrationsPage = lazy(() => import('@/modules/integrations/pages/IntegrationsPage'));
const SettingsPage = lazy(() => import('@/modules/settings/pages/SettingsPage'));
const NotFoundPage = lazy(() => import('@/shared/components/layout/NotFoundPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

export function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ai" element={<AIAgentPage />} />
            <Route path="/sales/*" element={<SalesPage />} />
            <Route path="/marketing/*" element={<MarketingPage />} />
            <Route path="/gtm/*" element={<GTMPage />} />
            <Route path="/cost/*" element={<CostPage />} />
            <Route path="/revenue/*" element={<RevenuePage />} />
            <Route path="/reports/*" element={<ReportsPage />} />
            <Route path="/scenarios/*" element={<ScenariosPage />} />
            <Route path="/intelligence/*" element={<IntelligentCorePage />} />
            <Route path="/governance/*" element={<GovernancePage />} />
            <Route path="/training/*" element={<TrainingPage />} />
            <Route path="/data-fabric/*" element={<DataFabricPage />} />
            <Route path="/integrations/*" element={<IntegrationsPage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
