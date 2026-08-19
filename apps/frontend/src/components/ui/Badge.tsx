import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const lower = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  if (lower === 'sent' || lower === 'completed') {
    styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (lower === 'scheduled' || lower === 'waiting' || lower === 'delayed') {
    styles = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (lower === 'processing' || lower === 'running' || lower === 'active') {
    styles = 'bg-sky-500/10 text-sky-400 border-sky-500/30 animate-pulse';
  } else if (lower === 'failed') {
    styles = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  } else if (lower === 'cancelled' || lower === 'paused') {
    styles = 'bg-slate-800 text-slate-400 border-slate-700';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${styles} ${className}`}
    >
      {status}
    </span>
  );
};
