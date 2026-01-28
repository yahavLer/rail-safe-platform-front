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
  UserPlus, 
  Sliders,
} from 'lucide-react';

import { useEffect, useState } from 'react';
import type { UserBoundary } from '@/api/types';

const SESSION_KEY = "railsafe.session";

const baseNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'לוח בקרה' },
  { to: '/risks', icon: AlertTriangle, label: 'ניהול סיכונים' },
  { to: '/risks/new', icon: Plus, label: 'סיכון חדש' },
  { to: '/signup/org', icon: UserPlus, label: 'הרשמה / יצירת ארגון' },
  { to: '/controls', icon: Shield, label: 'ספריית בקרות' },
  { to: '/reports', icon: FileText, label: 'דוחות' },
  { to: '/users', icon: Users, label: 'משתמשים' },
  { to: '/settings', icon: Settings, label: 'הגדרות' },
];

const chiefRiskManagerItem = {
  to: '/risk-definitions',
  icon: Sliders,
  label: 'הגדרות סיכונים',
  roleRequired: 'CHIEF_RISK_MANAGER'
};

export function Sidebar() {
  const [currentUser, setCurrentUser] = useState<UserBoundary | null>(null);
  const [navItems, setNavItems] = useState(baseNavItems );

  useEffect(() => {
    // Load user from session
    const sessionStr = localStorage.getItem(SESSION_KEY);
    if (sessionStr) {
      try {
        const user: UserBoundary = JSON.parse(sessionStr);
        setCurrentUser(user);

        // If user is CHIEF_RISK_MANAGER, add the risk definitions item
        if (user.role === 'CHIEF_RISK_MANAGER') {
          // Insert after "ניהול סיכונים" (index 2, after /, /risks, /risks/new)
          const updatedItems = [
            ...baseNavItems .slice(0, 3),
            chiefRiskManagerItem,
            ...baseNavItems .slice(3),
          ];
          setNavItems(updatedItems);
        }
      } catch (e) {
        console.error('Failed to parse user session:', e);
      }
    }
  }, []);
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
              {item.icon && <item.icon className="h-5 w-5" />}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
              {currentUser?.firstName?.[0] || currentUser?.lastName?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">
                {currentUser?.firstName && currentUser?.lastName 
                  ? `${currentUser.firstName} ${currentUser.lastName}`
                  : currentUser?.email || 'משתמש'}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {currentUser?.role === 'CHIEF_RISK_MANAGER' && 'מנהל סיכונים ראשי'}
                {currentUser?.role === 'DIVISION_RISK_MANAGER' && 'מנהל סיכונים מחלקתי'}
                {currentUser?.role === 'DEPARTMENT_RISK_MANAGER' && 'מנהל סיכונים מחלקתי'}
                {currentUser?.role === 'EMPLOYEE' && 'עובד'}
                {!currentUser?.role && 'משתמש'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
