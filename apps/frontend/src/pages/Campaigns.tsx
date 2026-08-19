import React from 'react';
import { Send, Pause, Play, XCircle, RefreshCw } from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';

export const Campaigns: React.FC = () => {
  const { data, isLoading, pauseCampaign, resumeCampaign, cancelCampaign } = useCampaigns();
  const campaigns = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Email Campaigns</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Campaign progress, throttling rules, and status controls
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-2" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading campaigns...</p>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <Send className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-white">No campaigns scheduled yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-4">
            Click "New Campaign" in the sidebar to schedule your first batch.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map((c) => {
            const sent = c.sentCount || 0;
            const total = c.totalRecipients || 1;
            const failed = c.failedCount || 0;

            return (
              <Card key={c.id} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">{c.subject}</h3>
                      <Badge status={c.status} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Sender:{' '}
                      <span className="text-slate-700 dark:text-slate-200 font-medium">
                        {c.sender?.displayName || 'SMTP Sender'}
                      </span>{' '}
                      &bull; Delay:{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{c.delayBetweenEmails / 1000}s</span>{' '}
                      &bull; Hourly Limit:{' '}
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{c.hourlyLimit}/hr</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {c.status === 'running' || c.status === 'scheduled' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => pauseCampaign(c.id)}
                        leftIcon={<Pause className="w-3.5 h-3.5 text-amber-500" />}
                      >
                        Pause
                      </Button>
                    ) : c.status === 'paused' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => resumeCampaign(c.id)}
                        leftIcon={<Play className="w-3.5 h-3.5 text-emerald-500" />}
                      >
                        Resume
                      </Button>
                    ) : null}

                    {c.status !== 'completed' && c.status !== 'cancelled' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => cancelCampaign(c.id)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar value={sent} total={total} />

                {/* Status Pills */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-100 dark:bg-slate-800/40 p-2 rounded-lg">
                    <span className="text-slate-500 dark:text-slate-400 block">Total</span>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{c.totalRecipients}</span>
                  </div>
                  <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <span className="text-emerald-600 dark:text-emerald-400 block font-medium">Sent</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-300 text-sm">{sent}</span>
                  </div>
                  <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    <span className="text-rose-600 dark:text-rose-400 block font-medium">Failed</span>
                    <span className="font-bold text-rose-600 dark:text-rose-300 text-sm">{failed}</span>
                  </div>
                  <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <span className="text-amber-600 dark:text-amber-400 block font-medium">Queued</span>
                    <span className="font-bold text-amber-600 dark:text-amber-300 text-sm">{c.scheduledCount || 0}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
