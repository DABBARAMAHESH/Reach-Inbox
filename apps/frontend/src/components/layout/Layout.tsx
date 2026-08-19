import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Send,
  Mail,
  LogOut,
  PlusCircle,
  Inbox,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface LayoutProps {
  onOpenCompose: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ onOpenCompose }) => {
  const { user, logout } = useAuth();

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark'; // default to dark
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Settings removed from navItems
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Scheduled', icon: Clock, path: '/scheduled' },
    { label: 'Sent Emails', icon: CheckCircle2, path: '/sent' },
    { label: 'Failed Emails', icon: AlertOctagon, path: '/failed' },
    { label: 'Campaigns', icon: Send, path: '/campaigns' },
    { label: 'SMTP Senders', icon: Mail, path: '/senders' }
  ];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between p-4 transition-colors duration-200">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl">
              <Inbox className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">ReachInbox</h1>
              <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider">
                Email Scheduler
              </span>
            </div>
          </div>

          {/* New Campaign Action */}
          <Button
            onClick={onOpenCompose}
            className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/15"
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            New Campaign
          </Button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info (Clean and premium) */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500 px-2 space-y-1">
          <div className="flex items-center justify-between">
            <span>Scheduler Core</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Rate Limiter</span>
            <span className="text-indigo-500 dark:text-indigo-400 font-semibold">Redis Atomic</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Network Service Online</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/65 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700/70 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500 animate-pulse" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Authenticated User Header Profile */}
            {user && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 rounded-full py-1.5 px-3">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-indigo-400/40"
                  />
                  <div className="text-left text-xs">
                    <div className="font-semibold text-slate-800 dark:text-white leading-tight">{user.name}</div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight">{user.email}</div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default Layout;
