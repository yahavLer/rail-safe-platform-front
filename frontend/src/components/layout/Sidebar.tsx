import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  AlertTriangle,
  Plus,
  Settings,
  Shield,
  Users,
  FileText,
  Train,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'לוח בקרה' },
  { to: '/risks', icon: AlertTriangle, label: 'ניהול סיכונים' },
  { to: '/risks/new', icon: Plus, label: 'סיכון חדש' },
  { to: '/controls', icon: Shield, label: 'ספריית בקרות' },
  { to: '/reports', icon: FileText, label: 'דוחות' },
  { to: '/users', icon: Users, label: 'משתמשים' },
  { to: '/settings', icon: Settings, label: 'הגדרות' },
];

export function Sidebar() {
  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 sidebar-gradient">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center justify-center border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
              <Train className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Rail-Safe AI</h1>
              <p className="text-xs text-sidebar-foreground/60">ניהול סיכוני בטיחות</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
              יכ
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">יוסי כהן</p>
              <p className="text-xs text-sidebar-foreground/60">מנהל מערכת</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
