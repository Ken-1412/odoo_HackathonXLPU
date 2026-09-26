import React, { useMemo } from 'react';
import { FileBarChart } from 'lucide-react';
import { ArchivePanel } from '../ui/ArchivePanel';
import { useStockSense } from '../../../lib/useStockSense';

export const StockSenseReports: React.FC = () => {
  const { products, ledger, stats } = useStockSense();
  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    products.forEach((p) => m.set(p.category, (m.get(p.category) || 0) + p.currentStock));
    return Array.from(m.entries());
  }, [products]);
  const maxCat = Math.max(1, ...byCategory.map(([, v]) => v));

  const exportCSV = () => {
    const rows = [['SKU', 'Product', 'Category', 'Stock', 'UOM', 'Status'],
      ...products.map((p) => [p.sku, `"${p.name}"`, `"${p.category}"`, String(p.currentStock), p.uom, p.status])];
    const uri = 'data:text/csv;charset=utf-8,' + encodeURI(rows.map((r) => r.join(',')).join('\n'));
    const a = document.createElement('a');
    a.href = uri;
    a.download = 'StockSense_Inventory_Report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <FileBarChart className="w-4 h-4" /><span>SYSTEM // ANALYTICS & EXPORT</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Reports & Stock Intelligence</h2>
          <p className="text-xs text-slate-500 mt-0.5">Live aggregates computed from current inventory state.</p>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer transition-colors"
        >
          Export CSV
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ArchivePanel title="STOCK BY CATEGORY" archiveId="RPT::CAT">
          <div className="space-y-3">
            {byCategory.map(([cat, qty]) => (
              <div key={cat}>
                <div className="flex justify-between font-mono text-[11px] text-slate-600 mb-1">
                  <span className="text-slate-900 font-medium">{cat}</span><span>{qty.toLocaleString()} units</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(qty / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ArchivePanel>
        <ArchivePanel title="MOVEMENT MIX" subtitle="LEDGER TYPE DISTRIBUTION" archiveId="RPT::MIX">
          <div className="space-y-3">
            {(['RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT'] as const).map((t) => {
              const n = ledger.filter((l) => l.type === t).length;
              const pct = ledger.length ? (n / ledger.length) * 100 : 0;
              return (
                <div key={t}>
                  <div className="flex justify-between font-mono text-[11px] text-slate-600 mb-1">
                    <span className="text-slate-900 font-medium">{t}</span><span>{n} events • {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        t === 'RECEIPT'
                          ? 'bg-emerald-600'
                          : t === 'DELIVERY'
                          ? 'bg-blue-600'
                          : t === 'TRANSFER'
                          ? 'bg-purple-600'
                          : 'bg-slate-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="font-mono text-[11px] text-slate-500 pt-3 border-t border-slate-100">
              {stats.totalUnits.toLocaleString()} units • {stats.totalProductsCount} SKUs • {stats.lowStockCount + stats.outOfStockCount} alerts
            </div>
          </div>
        </ArchivePanel>
      </div>
    </div>
  );
};
