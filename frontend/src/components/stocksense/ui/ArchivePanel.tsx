import React from 'react';

interface ArchivePanelProps {
  title?: string;
  archiveId?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  highlight?: 'gold' | 'orange' | 'green' | 'blue' | 'none';
  headerBorder?: boolean;
}

export const ArchivePanel: React.FC<ArchivePanelProps> = ({
  title,
  archiveId,
  subtitle,
  children,
  action,
  className = '',
  highlight = 'none',
  headerBorder = true,
}) => {
  const highlightStyles = {
    gold: 'border-blue-200 bg-blue-50/20',
    blue: 'border-blue-200 bg-blue-50/20',
    orange: 'border-amber-200 bg-amber-50/20',
    green: 'border-emerald-200 bg-emerald-50/20',
    none: 'border-slate-200',
  };

  return (
    <div
      className={`stocksense-card overflow-hidden ${highlightStyles[highlight]} ${className}`}
    >
      {/* Header */}
      {(title || archiveId || action) && (
        <div
          className={`flex items-center justify-between px-4 py-3 ${
            headerBorder ? 'border-b border-slate-100' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            {title && (
              <h3 className="text-sm font-semibold text-slate-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                {subtitle}
              </span>
            )}
            {archiveId && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                {archiveId}
              </span>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
};
