import React, { useState } from 'react';
import { Search, Clock, XCircle, RefreshCw } from 'lucide-react';
import { useEmails } from '../hooks/useEmails';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const Scheduled: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading, cancelEmail, isCancelling } = useEmails('scheduled', page, 10, search);

  const emails = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Scheduled Emails</h1>
          <p className="text-sm text-slate-400 mt-1">
            Emails queued in BullMQ waiting for delay execution or rate limit window
          </p>
        </div>
      </div>

      <Card>
        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search recipient or subject..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Sender</th>
                <th className="px-4 py-3">Scheduled Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400 mb-2" />
                    Loading scheduled emails...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    No scheduled emails found
                  </td>
                </tr>
              ) : (
                emails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{email.recipient}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{email.subject}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {email.sender?.displayName || email.senderId}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {new Date(email.scheduledAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={email.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{email.attempts} / 3</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={isCancelling}
                        onClick={() => cancelEmail(email.id)}
                        leftIcon={<XCircle className="w-3.5 h-3.5" />}
                      >
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="space-x-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
