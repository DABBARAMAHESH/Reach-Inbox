import React, { useState } from 'react';
import { Mail, Plus, Trash2, Zap, ShieldCheck } from 'lucide-react';
import { useSenders } from '../hooks/useSenders';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';

export const Senders: React.FC = () => {
  const { senders, isLoading, createSender, isCreating, deleteSender, testSender, isTesting } =
    useSenders();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.ethereal.email');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSender({
      displayName,
      email,
      smtpHost,
      smtpPort,
      smtpUser: smtpUser || undefined,
      smtpPassword: smtpPassword || undefined
    });
    setIsModalOpen(false);
    setDisplayName('');
    setEmail('');
    setSmtpUser('');
    setSmtpPassword('');
  };

  const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">SMTP Senders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure sending identities with AES-256 encrypted credentials
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Sender
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      ) : senders.length === 0 ? (
        <Card className="text-center py-12">
          <Mail className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-700 dark:text-white">No senders configured</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Add a sender to start sending campaigns.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {senders.map((s) => (
            <Card key={s.id} className="space-y-4 relative overflow-hidden">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <Mail className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">{s.displayName}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.email}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>SMTP Host:</span>
                  <span className="text-slate-700 dark:text-slate-200 font-mono">{s.smtpHost}:{s.smtpPort}</span>
                </div>
                <div className="flex justify-between">
                  <span>SMTP User:</span>
                  <span className="text-slate-700 dark:text-slate-200 font-mono truncate max-w-[150px]">{s.smtpUser || s.etherealUser || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Encryption:</span>
                  <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" /> AES-256
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isTesting}
                  onClick={() => testSender(s.id)}
                  leftIcon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
                >
                  Test Connection
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSender(s.id)}
                  className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Sender Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New SMTP Sender"
        subtitle="Credentials are securely encrypted before storage"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Display Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sales Team"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Sender Email Address</label>
            <input
              type="email"
              required
              placeholder="sales@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>SMTP Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>SMTP Username</label>
              <input
                type="text"
                placeholder="user@example.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>SMTP Password</label>
              <input
                type="password"
                placeholder="password or app key"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-700 dark:text-indigo-300">
            💡 Leave SMTP Username & Password blank to auto-generate an Ethereal test account.
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create Sender
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
