import React from 'react';

export type StatusVariant = 'done' | 'in_stock' | 'pending' | 'waiting' | 'ready' | 'draft' | 'low_stock' | 'out_of_stock' | 'alert' | 'neutral';

interface TechnicalBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
  dotOnly?: boolean;
}

export const TechnicalBadge: React.FC<TechnicalBadgeProps> = ({
  status,
  variant,
  className = '',
  dotOnly = false,
}) => {
  let computedVariant: StatusVariant = variant || 'neutral';
  const s = status.toUpperCase();

  if (s.includes('DONE') || s.includes('IN_STOCK') || s.includes('COMPLETED') || s.includes('ACTIVE')) {
    computedVariant = 'done';
  } else if (s.includes('PENDING') || s.includes('WAITING') || s.includes('PICKING') || s.includes('PACKING')) {
    computedVariant = 'pending';
  } else if (s.includes('READY')) {
    computedVariant = 'ready';
  } else if (s.includes('LOW')) {
    computedVariant = 'low_stock';
  } else if (s.includes('OUT') || s.includes('CRITICAL') || s.includes('CANCEL')) {
    computedVariant = 'out_of_stock';
  } else if (s.includes('DRAFT')) {
    computedVariant = 'draft';
  }

  const styles: Record<StatusVariant, { dot: string; text: string; bg: string; border: string }> = {
    done: {
      dot: 'bg-emerald-600',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    in_stock: {
      dot: 'bg-emerald-600',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    pending: {
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    waiting: {
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    ready: {
      dot: 'bg-blue-600',
      text: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    draft: {
      dot: 'bg-slate-400',
      text: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
    low_stock: {
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    out_of_stock: {
      dot: 'bg-red-500',
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    alert: {
      dot: 'bg-red-500',
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
    neutral: {
      dot: 'bg-slate-400',
      text: 'text-slate-600',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
    },
  };

  const current = styles[computedVariant];

  if (dotOnly) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${current.text} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap ${current.bg} ${current.border} ${current.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot}`} />
      <span>{status}</span>
    </span>
  );
};
