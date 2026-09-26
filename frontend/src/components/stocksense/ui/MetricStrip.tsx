import React from 'react';

interface Metric {
  label: string;
  value: string | number;
  sub: string;
  status: string;
  accent: 'green' | 'orange' | 'gold';
  onClick?: () => void;
}

export const MetricStrip: React.FC<{ metrics: Metric[] }> = ({ metrics }) => {
  const accentColor: Record<string, string> = {
    green: 'text-status-success',
    orange: 'text-status-warning',
    gold: 'text-accent',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((m) => (
        <button
          key={m.label}
          type="button"
          onClick={m.onClick}
          className="stocksense-focus stocksense-card p-4 text-left cursor-pointer group"
        >
          <div className="text-xs text-text-muted font-medium mb-1">{m.label}</div>
          <div className={`text-2xl font-semibold ${accentColor[m.accent]} leading-tight`}>
            {m.value}
          </div>
          <div className="text-[11px] text-text-muted mt-1">{m.sub}</div>
        </button>
      ))}
    </div>
  );
};
