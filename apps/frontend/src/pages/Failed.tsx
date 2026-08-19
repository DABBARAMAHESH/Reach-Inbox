import React, { useState } from 'react';
import { Search, AlertOctagon, RotateCcw, RefreshCw } from 'lucide-react';
import { useEmails } from '../hooks/useEmails';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Failed: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, retryEmail, isRetrying } = useEmails('failed', page, 10, search);

  const emails = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Failed Emails</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Emails that exhausted all retry attempts
          </p>
        </div>
      </div>

      <Card>
        {/* Search Bar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recipient or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Failure Reason</th>
                <th className="px-4 py-3">Last Attempt</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    Loading failed emails...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <AlertOctagon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">No failed emails</p>
                    <p className="text-xs mt-1">All deliveries are operating cleanly.</p>
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{email.recipient}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{email.subject}</td>
                    <td className="px-4 py-3 font-mono text-xs text-rose-600 dark:text-rose-400">{email.attempts} / 3</td>
                    <td className="px-4 py-3 max-w-xs truncate text-xs text-rose-600 dark:text-rose-300 font-mono">
                      {email.lastError || 'SMTP Error'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(email.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={isRetrying}
                        onClick={() => retryEmail(email.id)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                      >
                        Retry
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
