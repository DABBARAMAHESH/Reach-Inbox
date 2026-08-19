import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const lower = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  if (lower === 'sent' || lower === 'completed') {
    styles = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-500/20';
  } else if (lower === 'scheduled' || lower === 'waiting' || lower === 'delayed') {
    styles = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/20';
  } else if (lower === 'processing' || lower === 'running' || lower === 'active') {
    styles = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 dark:border-indigo-500/20 animate-pulse';
  } else if (lower === 'failed') {
    styles = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/20';
  } else if (lower === 'cancelled' || lower === 'paused') {
    styles = 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${styles} ${className}`}
    >
      {status}
    </span>
  );
};
