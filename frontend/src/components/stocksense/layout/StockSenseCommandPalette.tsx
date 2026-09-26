import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Boxes,
  Truck,
  Send,
  FileSpreadsheet,
  X,
  ArrowRightLeft,
  Scale
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import type { StockSenseTab } from './StockSenseSidebar';

interface StockSenseCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: StockSenseTab, itemId?: string) => void;
}

export const StockSenseCommandPalette: React.FC<StockSenseCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { products, receipts, deliveries, ledger } = useStockSense();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchedProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
  ).slice(0, 5);

  const matchedReceipts = receipts.filter(
    (r) =>
      r.id.toLowerCase().includes(q) ||
      r.supplier.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchedDeliveries = deliveries.filter(
    (d) =>
      d.id.toLowerCase().includes(q) ||
      d.customer.toLowerCase().includes(q) ||
      d.reference.toLowerCase().includes(q)
  ).slice(0, 4);

  const matchedLedger = ledger.filter(
    (l) =>
      l.eventId.toLowerCase().includes(q) ||
      l.productName.toLowerCase().includes(q) ||
      l.sku.toLowerCase().includes(q)
  ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-surface-card border border-border rounded-md shadow-modal overflow-hidden z-50">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, receipts, deliveries, ledger..."
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] bg-surface-secondary text-text-muted px-1.5 py-0.5 rounded border border-border-light">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3">
          {/* Quick Navigation */}
          {!query && (
            <div>
              <div className="px-1 pb-1.5 text-[11px] font-medium uppercase text-text-muted">
                Quick Navigation
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { label: 'Products', tab: 'products' as const, icon: Boxes },
                  { label: 'Receipts', tab: 'receipts' as const, icon: Truck },
                  { label: 'Deliveries', tab: 'deliveries' as const, icon: Send },
                  { label: 'Transfers', tab: 'transfers' as const, icon: ArrowRightLeft },
                  { label: 'Adjustments', tab: 'adjustments' as const, icon: Scale },
                  { label: 'Stock Ledger', tab: 'ledger' as const, icon: FileSpreadsheet },
                ].map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.tab}
                      type="button"
                      onClick={() => {
                        onNavigate(cmd.tab);
                        onClose();
                      }}
                      className="flex items-center gap-2 p-2 bg-surface-secondary hover:bg-surface-hover border border-border-light hover:border-border rounded text-sm text-text-secondary hover:text-text-primary text-left cursor-pointer"
                    >
                      <Icon className="w-4 h-4 text-text-muted shrink-0" />
                      <span>{cmd.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Products */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="px-1 pb-1 text-[11px] font-medium uppercase text-text-muted">
                Products ({matchedProducts.length})
              </div>
              <div className="space-y-0.5">
                {matchedProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onNavigate('products', p.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-surface-hover text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Boxes className="w-4 h-4 text-text-muted shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {p.sku} · {p.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium text-text-primary">
                        {p.currentStock.toLocaleString()} {p.uom}
                      </div>
                      <div className="text-xs text-text-muted">
                        ${p.costPerUnit.toFixed(2)}/u
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Receipts */}
          {matchedReceipts.length > 0 && (
            <div>
              <div className="px-1 pb-1 text-[11px] font-medium uppercase text-text-muted">
                Receipts ({matchedReceipts.length})
              </div>
              <div className="space-y-0.5">
                {matchedReceipts.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      onNavigate('receipts', r.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-surface-hover text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-text-muted shrink-0" />
                      <div>
                        <span className="font-mono text-sm font-medium text-accent mr-2">{r.id}</span>
                        <span className="text-sm text-text-primary">{r.supplier}</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted uppercase">{r.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Deliveries */}
          {matchedDeliveries.length > 0 && (
            <div>
              <div className="px-1 pb-1 text-[11px] font-medium uppercase text-text-muted">
                Deliveries ({matchedDeliveries.length})
              </div>
              <div className="space-y-0.5">
                {matchedDeliveries.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onNavigate('deliveries', d.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-surface-hover text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Send className="w-4 h-4 text-text-muted shrink-0" />
                      <div>
                        <span className="font-mono text-sm font-medium text-status-warning mr-2">{d.id}</span>
                        <span className="text-sm text-text-primary">{d.customer}</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted uppercase">{d.stage}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Ledger */}
          {matchedLedger.length > 0 && (
            <div>
              <div className="px-1 pb-1 text-[11px] font-medium uppercase text-text-muted">
                Ledger Entries ({matchedLedger.length})
              </div>
              <div className="space-y-0.5">
                {matchedLedger.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      onNavigate('ledger', l.eventId);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-surface-hover text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-text-muted shrink-0" />
                      <div>
                        <span className="font-mono text-sm font-medium text-accent mr-2">{l.eventId}</span>
                        <span className="text-sm text-text-primary">{l.productName}</span>
                        <span className="text-xs text-text-muted ml-1">({l.type})</span>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-medium text-text-primary">
                      {l.quantity > 0 ? `+${l.quantity}` : l.quantity} {l.uom}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {query && matchedProducts.length === 0 && matchedReceipts.length === 0 && matchedDeliveries.length === 0 && matchedLedger.length === 0 && (
            <div className="text-center py-8">
              <div className="text-sm font-medium text-text-secondary">No results found</div>
              <p className="text-xs text-text-muted mt-1">
                No items matching &ldquo;{query}&rdquo; in current records.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-border-light bg-surface-secondary flex items-center justify-between text-[11px] text-text-muted">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
        </div>
      </div>
    </div>
  );
};
