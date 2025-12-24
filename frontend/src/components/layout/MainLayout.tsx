import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="mr-64 min-h-screen p-6">
        <Outlet />
      </main>
    </div>
  );
}
