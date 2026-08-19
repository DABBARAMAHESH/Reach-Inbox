import React from 'react';
import {
  Mail,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Dashboard: React.FC = () => {
  const { stats, isLoadingStats, refetch } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics and email scheduling statistics
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Emails */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Emails</p>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                {isLoadingStats ? '...' : stats?.totalEmails || 0}
              </h2>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Mail className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Success Rate</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">{stats?.successRate || 0}%</span>
          </div>
        </Card>

        {/* Scheduled */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scheduled</p>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                {isLoadingStats ? '...' : stats?.scheduled || 0}
              </h2>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Processing In Flight</span>
            <span className="text-indigo-500 dark:text-indigo-400 font-semibold">{stats?.processing || 0}</span>
          </div>
        </Card>

        {/* Sent Emails */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sent Emails</p>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                {isLoadingStats ? '...' : stats?.sent || 0}
              </h2>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Delivered Status</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">100% Verified</span>
          </div>
        </Card>

        {/* Failed Emails */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Failed Emails</p>
              <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                {isLoadingStats ? '...' : stats?.failed || 0}
              </h2>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <AlertOctagon className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Idempotent Retries</span>
            <span className="text-rose-500 dark:text-rose-400 font-semibold">Available</span>
          </div>
        </Card>
      </div>

      {/* Hourly Rate Limit Capacity Card */}
      <Card
        title="Redis Hourly Sender Rate Limit"
        subtitle="sender-specific Redis counters (email-rate:{senderId}:{hourWindow})"
        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-white">Emails Sent This Hour</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Current window capacity limit</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-slate-800 dark:text-white">
                {stats?.sentThisHour || 0} / {stats?.hourlyLimit || 200}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Hourly Limit</div>
            </div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="bg-gradient-to-r from-indigo-500 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((stats?.sentThisHour || 0) / (stats?.hourlyLimit || 200)) * 100)
                )}%`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>Remaining Hourly Capacity: <strong className="text-emerald-500 dark:text-emerald-400">{stats?.remainingHourlyCapacity || 200}</strong> emails</span>
            <span className="text-indigo-500 dark:text-indigo-400">Reschedules jobs if capacity hit</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
export default Dashboard;
