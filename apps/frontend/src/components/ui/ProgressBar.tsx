import React from 'react';

interface ProgressBarProps {
  value: number;
  total: number;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  total,
  showPercentage = true,
  className = ''
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-medium">
        <span>
          {value} / {total} emails
        </span>
        {showPercentage && <span>{percentage}%</span>}
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700/50">
        <div
          className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
