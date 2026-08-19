import React from 'react';
import { Card } from '../components/ui/Card';
import { ExternalLink, Database, Server, Cpu, Lock } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings & Architecture</h1>
        <p className="text-sm text-slate-400 mt-1">
          ReachInbox distributed architecture parameters and API documentation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Core Technology Stack" subtitle="Production container layout">
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
              <span className="flex items-center space-x-2">
                <Server className="w-4 h-4 text-sky-400" />
                <span>Express Backend & Workers</span>
              </span>
              <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">Node.js 20+</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
              <span className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Primary Relational DB</span>
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">PostgreSQL 16 + Prisma</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
              <span className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>Distributed Queue & Limiter</span>
              </span>
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Redis 7 + BullMQ</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
              <span className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Idempotency Guarantee</span>
              </span>
              <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">Status + Job ID Check</span>
            </div>
          </div>
        </Card>

        <Card title="Swagger API Documentation" subtitle="Interactive OpenAPI 3.0 Spec">
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore and test public REST endpoints directly using the built-in Swagger UI.
            </p>

            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sky-600/20 space-x-2 text-sm"
            >
              <span>Open Swagger API UI (/api/docs)</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};
