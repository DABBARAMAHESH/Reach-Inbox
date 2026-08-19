import React from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Settings: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-sky-500/10 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Profile</h2>
        </div>

        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-14 h-14 rounded-full ring-2 ring-sky-500/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <p className="text-white font-semibold text-base">{user?.name || 'User'}</p>
            <p className="text-slate-400 text-sm">{user?.email || ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Display Name</label>
            <input
              type="text"
              defaultValue={user?.name || ''}
              disabled
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              defaultValue={user?.email || ''}
              disabled
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Email delivery reports', desc: 'Get notified when campaigns complete' },
            { label: 'Failed delivery alerts', desc: 'Be alerted when emails fail to send' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <div className="w-10 h-6 bg-sky-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
            <div>
              <p className="text-sm text-white">Authentication Method</p>
              <p className="text-xs text-slate-400">
                {user?.googleId ? 'Google OAuth2 (passwordless)' : 'Email & OTP'}
              </p>
            </div>
            <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              Active
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white">Session Token</p>
              <p className="text-xs text-slate-400">JWT · Expires in 7 days</p>
            </div>
            <span className="text-xs px-2 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
              Secure
            </span>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">About</h2>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">ReachInbox</span>
          <span className="text-slate-300">v1.0.0</span>
        </div>
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-400">Distributed Email Campaign Scheduler</span>
          <span className="text-slate-300">Production Ready</span>
        </div>
      </div>
    </div>
  );
};
