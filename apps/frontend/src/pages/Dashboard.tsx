import React from 'react';
import {
  Mail,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Zap,
  Activity,
  Layers,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const { stats, queueStats, isLoadingStats, isLoadingQueue, refetch } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time analytics and distributed BullMQ queue monitor
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Stats
        </Button>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Emails</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                {isLoadingStats ? '...' : stats?.totalEmails || 0}
              </h2>
            </div>
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <Mail className="w-6 h-6 text-sky-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Success Rate</span>
            <span className="text-emerald-400 font-semibold">{stats?.successRate || 0}%</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">Scheduled</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                {isLoadingStats ? '...' : stats?.scheduled || 0}
              </h2>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Processing In Flight</span>
            <span className="text-sky-400 font-semibold">{stats?.processing || 0}</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wider">Sent Emails</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                {isLoadingStats ? '...' : stats?.sent || 0}
              </h2>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Ethereal Delivered</span>
            <span className="text-emerald-400 font-semibold">100% Verified</span>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-400/90 uppercase tracking-wider">Failed Emails</p>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                {isLoadingStats ? '...' : stats?.failed || 0}
              </h2>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertOctagon className="w-6 h-6 text-rose-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Idempotent Retries</span>
            <span className="text-rose-400 font-semibold">Available</span>
          </div>
        </Card>
      </div>

      {/* Hourly Rate Limit Capacity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Redis Hourly Sender Rate Limit" subtitle="sender-specific Redis counters (email-rate:{senderId}:{hourWindow})">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Emails Sent This Hour</div>
                  <div className="text-xs text-slate-400">Current window capacity limit</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  {stats?.sentThisHour || 0} / {stats?.hourlyLimit || 200}
                </div>
                <div className="text-xs text-slate-400">Hourly Limit</div>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-sky-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(((stats?.sentThisHour || 0) / (stats?.hourlyLimit || 200)) * 100)
                  )}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Remaining Hourly Capacity: <strong className="text-emerald-400">{stats?.remainingHourlyCapacity || 200}</strong> emails</span>
              <span className="text-sky-400">Reschedules jobs if cap hit</span>
            </div>
          </div>
        </Card>

        {/* BullMQ Queue Monitor */}
        <Card title="BullMQ Queue Monitor" subtitle="Queue: email-scheduler (Redis backed)">
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="bg-slate-800/60 border border-slate-700/60 p-2.5 rounded-xl">
                <span className="block text-xs font-semibold text-slate-400 uppercase">Waiting</span>
                <span className="text-lg font-bold text-slate-200">{isLoadingQueue ? '...' : queueStats?.waiting || 0}</span>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                <span className="block text-xs font-semibold text-amber-400 uppercase">Delayed</span>
                <span className="text-lg font-bold text-amber-300">{isLoadingQueue ? '...' : queueStats?.delayed || 0}</span>
              </div>
              <div className="bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl">
                <span className="block text-xs font-semibold text-sky-400 uppercase">Active</span>
                <span className="text-lg font-bold text-sky-300">{isLoadingQueue ? '...' : queueStats?.active || 0}</span>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                <span className="block text-xs font-semibold text-emerald-400 uppercase">Done</span>
                <span className="text-lg font-bold text-emerald-300">{isLoadingQueue ? '...' : queueStats?.completed || 0}</span>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                <span className="block text-xs font-semibold text-rose-400 uppercase">Failed</span>
                <span className="text-lg font-bold text-rose-300">{isLoadingQueue ? '...' : queueStats?.failed || 0}</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span>Deterministic Job ID: <code className="text-sky-300 bg-slate-800 px-1 py-0.5 rounded">email-&#123;id&#125;</code></span>
              </span>
              <span className="text-emerald-400 font-semibold">Restart Safe</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
