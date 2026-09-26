import React from 'react';
import { SlidersHorizontal, AlertTriangle, Truck } from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';
import { TechnicalBadge } from '../ui/TechnicalBadge';

interface StockSenseReorderRulesProps {
  onOpenQuickAction: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product', prefill?: any) => void;
}

export const StockSenseReorderRules: React.FC<StockSenseReorderRulesProps> = ({
  onOpenQuickAction,
}) => {
  const { products } = useStockSense();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <SlidersHorizontal className="w-4 h-4" />
            <span>CATALOG // AUTOMATED INVENTORY RULES</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Reordering Rules & Thresholds
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure autonomous minimum stock thresholds, batch replenishment targets, and lead-time buffers.
          </p>
        </div>
      </div>

      <ArchivePanel
        title="PRODUCT REORDER RULES"
        subtitle="AUTOMATED PURCHASE TRIGGER MATRIX"
        archiveId="RULES::MATRIX"
      >
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left font-sans text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3 font-medium">SKU / SPECIMEN</th>
                <th className="py-2.5 px-3 font-medium text-right">CURRENT STOCK</th>
                <th className="py-2.5 px-3 font-medium text-right">MIN THRESHOLD</th>
                <th className="py-2.5 px-3 font-medium text-right">BATCH REPLENISH</th>
                <th className="py-2.5 px-3 font-medium">LEAD TIME</th>
                <th className="py-2.5 px-3 font-medium text-center">TRIGGER STATUS</th>
                <th className="py-2.5 px-3 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {products.map((p) => {
                const isBreached = p.currentStock <= p.reorderThreshold;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-blue-600">{p.sku}</div>
                      <div className="font-sans text-xs text-slate-900 font-medium">{p.name}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-sm">
                      <span className={isBreached ? 'text-amber-600 font-bold' : 'text-slate-900'}>
                        {p.currentStock} {p.uom}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-600">
                      {p.reorderThreshold} {p.uom}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-700 font-medium">
                      {p.reorderThreshold * 2} {p.uom}
                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      3 - 5 Days
                    </td>

                    <td className="py-3 px-3 text-center">
                      {isBreached ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>BREACHED</span>
                        </span>
                      ) : (
                        <TechnicalBadge status="OPTIMAL" variant="in_stock" dotOnly />
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenQuickAction('receipt', {
                            productId: p.id,
                            productName: p.name,
                            sku: p.sku,
                            quantity: p.reorderThreshold * 2,
                          })
                        }
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ml-auto font-mono"
                      >
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Order Restock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ArchivePanel>
    </div>
  );
};
