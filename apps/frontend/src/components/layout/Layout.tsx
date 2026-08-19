import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Send,
  Mail,
  Settings,
  LogOut,
  PlusCircle,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

interface LayoutProps {
  onOpenCompose: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ onOpenCompose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Scheduled', icon: Clock, path: '/scheduled' },
    { label: 'Sent Emails', icon: CheckCircle2, path: '/sent' },
    { label: 'Failed Emails', icon: AlertOctagon, path: '/failed' },
    { label: 'Campaigns', icon: Send, path: '/campaigns' },
    { label: 'SMTP Senders', icon: Mail, path: '/senders' },
    { label: 'Settings', icon: Settings, path: '/settings' }
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2">
            <div className="p-2 bg-sky-600/20 border border-sky-500/30 rounded-xl">
              <Inbox className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">ReachInbox</h1>
              <span className="text-[10px] uppercase font-semibold text-sky-400 tracking-wider">
                Email Scheduler
              </span>
            </div>
          </div>

          {/* New Campaign Action */}
          <Button
            onClick={onOpenCompose}
            className="w-full justify-center bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/25"
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
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-500 px-2 space-y-1">
          <div className="flex items-center justify-between">
            <span>BullMQ Mode</span>
            <span className="text-emerald-400 font-semibold">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Rate Limiter</span>
            <span className="text-sky-400 font-semibold">Redis Atomic</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">Docker Network Online</span>
          </div>

          {/* Authenticated User Header Profile */}
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-slate-800/60 border border-slate-700/50 rounded-full py-1.5 px-3">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-sky-400/40"
                />
                <div className="text-left text-xs">
                  <div className="font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-slate-400 text-[11px] leading-tight">{user.email}</div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-slate-400 hover:text-rose-400"
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Logout
              </Button>
            </div>
          )}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
