import React from 'react';
import { ArchivePanel } from './ArchivePanel';
import { TechnicalBadge } from './TechnicalBadge';
import type { LedgerEntry } from '../../../types/stockSense';

export const RecentMovements: React.FC<{
  entries: LedgerEntry[];
  onViewAll: () => void;
  onSelect: (eventId: string) => void;
}> = ({ entries, onViewAll, onSelect }) => (
  <ArchivePanel
    title="Recent Movements"
    action={
      <button
        type="button"
        onClick={onViewAll}
        className="stocksense-focus text-xs text-accent hover:text-accent-dark font-medium cursor-pointer"
      >
        View all →
      </button>
    }
  >
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[560px]">
        <thead>
          <tr className="border-b border-border-light text-xs text-text-muted">
            <th className="pb-2 pr-3 font-medium">ID</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 pr-3 font-medium">Product</th>
            <th className="pb-2 pr-3 font-medium text-right">Qty</th>
            <th className="pb-2 pr-3 font-medium">Location</th>
            <th className="pb-2 font-medium text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {entries.slice(0, 7).map((r) => (
            <tr
              key={r.id}
              onClick={() => onSelect(r.eventId)}
              className="hover:bg-surface-hover cursor-pointer"
            >
              <td className="py-2.5 pr-3 font-mono text-xs font-medium text-accent">
                {r.eventId}
              </td>
              <td className="py-2.5 pr-3 text-text-primary capitalize">
                {r.type.toLowerCase()}
              </td>
              <td className="py-2.5 pr-3 text-text-primary">{r.productName}</td>
              <td
                className={`py-2.5 pr-3 text-right font-mono font-medium ${
                  r.quantity > 0
                    ? 'text-status-success'
                    : r.quantity < 0
                    ? 'text-status-warning'
                    : 'text-text-primary'
                }`}
              >
                {r.quantity > 0 ? `+${r.quantity}` : r.quantity} {r.uom}
              </td>
              <td className="py-2.5 pr-3 text-xs text-text-muted">
                {r.from} → {r.to}
              </td>
              <td className="py-2.5 text-right">
                <TechnicalBadge status={r.status} dotOnly />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 && (
        <div className="text-center py-8 text-sm text-text-muted">
          No movement records.
        </div>
      )}
    </div>
  </ArchivePanel>
);
