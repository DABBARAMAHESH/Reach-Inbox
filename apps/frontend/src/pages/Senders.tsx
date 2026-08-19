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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">SMTP Senders</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure Ethereal or custom SMTP sending identities with AES-256 encrypted passwords
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Sender
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {senders.map((s) => (
          <Card key={s.id} className="space-y-4 relative overflow-hidden">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl">
                <Mail className="w-6 h-6 text-sky-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white truncate">{s.displayName}</h3>
                <p className="text-xs text-slate-400 truncate">{s.email}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex justify-between">
                <span>SMTP Host:</span>
                <span className="text-slate-200 font-mono">{s.smtpHost}:{s.smtpPort}</span>
              </div>
              <div className="flex justify-between">
                <span>SMTP User:</span>
                <span className="text-slate-200 font-mono truncate max-w-[150px]">{s.smtpUser || s.etherealUser || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Encryption:</span>
                <span className="inline-flex items-center text-emerald-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> AES-256 Encrypted
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                isLoading={isTesting}
                onClick={() => testSender(s.id)}
                leftIcon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
              >
                Test Connection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSender(s.id)}
                className="text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Sender Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New SMTP Sender"
        subtitle="Credentials will be securely encrypted before database storage"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sales Team"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Sender Email Address
            </label>
            <input
              type="email"
              required
              placeholder="sales@company.test"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                SMTP Host
              </label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Port
              </label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                SMTP Username
              </label>
              <input
                type="text"
                placeholder="user@example.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                SMTP Password
              </label>
              <input
                type="password"
                placeholder="password or app key"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-xs text-sky-300">
            Leave SMTP Username & Password blank to auto-generate an Ethereal SMTP test account!
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
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
