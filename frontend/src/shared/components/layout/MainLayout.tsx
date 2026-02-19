import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BackendStatusGuard } from '../BackendStatusGuard';

export function MainLayout() {
  return (
    <div className="flex h-screen bg-secondary-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <BackendStatusGuard>
            <Outlet />
          </BackendStatusGuard>
        </main>
      </div>
    </div>
  );
}
