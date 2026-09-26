import React, { useState } from 'react';
import {
  Scale,
  Search,
  Plus,
  CheckCircle2,
  X,
  TrendingDown,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';
import { TechnicalBadge } from '../ui/TechnicalBadge';
import type { InventoryAdjustment } from '../../../types/stockSense';

interface StockSenseAdjustmentsProps {
  onOpenQuickAction?: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product', prefill?: any) => void;
  initialSelectedId?: string | null;
}

export const StockSenseAdjustments: React.FC<StockSenseAdjustmentsProps> = ({
  initialSelectedId,
}) => {
  const { adjustments, products, createAdjustment } = useStockSense();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeAdjustment, setActiveAdjustment] = useState<InventoryAdjustment | null>(() => {
    if (initialSelectedId) {
      return adjustments.find((a) => a.id === initialSelectedId) || null;
    }
    return null;
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // New Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [location, setLocation] = useState('WH-01 / Main Store / Rack A');
  const [physicalCount, setPhysicalCount] = useState<number>(() => {
    return products[0]?.currentStock || 0;
  });
  const [reason, setReason] = useState<InventoryAdjustment['reason']>('Cycle Count');
  const [notes, setNotes] = useState('');

  const selectedProd = products.find((p) => p.id === selectedProdId);
  const systemQty = selectedProd ? selectedProd.currentStock : 0;
  const variance = physicalCount - systemQty;

  const handleProductChange = (prodId: string) => {
    setSelectedProdId(prodId);
    const p = products.find((pr) => pr.id === prodId);
    if (p) {
      setPhysicalCount(p.currentStock);
      if (p.locations[0]) {
        setLocation(`${p.locations[0].warehouseId} / ${p.locations[0].rack} / Bin ${p.locations[0].bin}`);
      }
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;

    try {
      const res = createAdjustment({
        reference: `ADJ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        productId: selectedProd.id,
        productName: selectedProd.name,
        sku: selectedProd.sku,
        warehouseId: location.split('/')[0]?.trim() || 'WH-01',
        location: location.trim(),
        systemQuantity: systemQty,
        physicalCount: Number(physicalCount),
        uom: selectedProd.uom,
        reason,
        operator: 'A. Chen (Auditor)',
        notes: notes.trim(),
      });

      setFeedbackMsg(res.message);
      setIsModalOpen(false);
      setActiveAdjustment(res.adjustment);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredAdjustments = adjustments.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      a.id.toLowerCase().includes(q) ||
      a.productName.toLowerCase().includes(q) ||
      a.sku.toLowerCase().includes(q) ||
      a.reason.toLowerCase().includes(q) ||
      a.operator.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <Scale className="w-4 h-4" />
            <span>OPERATIONS // PHYSICAL COUNT RECONCILIATION</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Inventory Adjustments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrate physical counts against system recorded quantities with mandatory variance auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (products[0]) {
                handleProductChange(products[0].id);
              }
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Calibrate Stock</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs font-mono text-emerald-800 shadow-xs animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedbackMsg}</span>
        </div>
      )}

      {/* Audit Safeguard Banner */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between text-[11px] font-mono gap-4">
        <div className="flex items-center gap-2 text-blue-600 shrink-0">
          <FileCheck className="w-4 h-4 shrink-0 text-blue-600" />
          <span className="font-bold">PERMANENT AUDIT SAFEGUARD:</span>
        </div>
        <div className="text-slate-600 hidden sm:block">
          Stock quantities are never silently mutated. Every calibration event generates a verified Stock Ledger record with operator identity.
        </div>
        <div className="text-slate-900 font-bold shrink-0">
          STRICT AUDIT POLICY
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by adjustment ID (e.g. ADJ-007), SKU, or reason..."
            className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>
        <div className="font-mono text-xs text-slate-500">
          {filteredAdjustments.length} Adjustments Recorded
        </div>
      </div>

      {/* Adjustments Table */}
      <ArchivePanel
        title={`ADJUSTMENT AUDIT LOG (${filteredAdjustments.length})`}
        subtitle="VARIANCE RECORDS"
        archiveId="ADJ::STREAM"
      >
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3 font-medium">EVENT ID</th>
                <th className="py-2.5 px-3 font-medium">PRODUCT SPECIMEN</th>
                <th className="py-2.5 px-3 font-medium text-right">SYSTEM QTY</th>
                <th className="py-2.5 px-3 font-medium text-right">PHYSICAL COUNT</th>
                <th className="py-2.5 px-3 font-medium text-right">RECORDED VARIANCE</th>
                <th className="py-2.5 px-3 font-medium">REASON FOR CALIBRATION</th>
                <th className="py-2.5 px-3 font-medium">TIMESTAMP & OPERATOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAdjustments.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setActiveAdjustment(a)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:text-blue-700">
                    {a.id}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">
                      {a.productName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {a.sku} • {a.location}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">
                    {a.systemQuantity} {a.uom}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    {a.physicalCount} {a.uom}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-xs">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        a.variance > 0
                          ? 'text-emerald-700'
                          : a.variance < 0
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {a.variance > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : a.variance < 0 ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : null}
                      <span>
                        {a.variance > 0 ? `+${a.variance}` : a.variance} {a.uom}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-700">
                    <span className="bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-800">
                      {a.reason}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[10.5px] text-slate-500">
                    <div>{a.timestamp}</div>
                    <div className="text-[9.5px] text-slate-400">By: {a.operator}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAdjustments.length === 0 && (
            <div className="text-center py-10 font-mono text-xs text-slate-400">
              No inventory adjustment records recorded.
            </div>
          )}
        </div>
      </ArchivePanel>

      {/* Detail Modal */}
      {activeAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveAdjustment(null)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Adjustment Sheet: {activeAdjustment.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveAdjustment(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-slate-900">
                  <span className="font-sans text-sm font-bold text-slate-900">
                    {activeAdjustment.productName}
                  </span>
                  <TechnicalBadge status="DONE" variant="done" />
                </div>
                <div className="text-slate-500">SKU: {activeAdjustment.sku}</div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block">SYSTEM RECORD</span>
                    <strong className="text-slate-900">{activeAdjustment.systemQuantity} {activeAdjustment.uom}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">PHYSICAL AUDIT</span>
                    <strong className="text-blue-600">{activeAdjustment.physicalCount} {activeAdjustment.uom}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">NET VARIANCE</span>
                    <strong className={activeAdjustment.variance < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                      {activeAdjustment.variance > 0 ? `+${activeAdjustment.variance}` : activeAdjustment.variance} {activeAdjustment.uom}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">AUDIT REASON & LOCATION:</span>
                <div className="text-slate-800 mt-0.5">
                  {activeAdjustment.reason} • {activeAdjustment.location}
                </div>
              </div>

              {activeAdjustment.notes && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600">
                  <span className="text-[10px] text-slate-400 uppercase block mb-0.5">NOTES:</span>
                  {activeAdjustment.notes}
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span>Audited: {activeAdjustment.timestamp}</span>
                <span>Auditor: {activeAdjustment.operator}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Calibration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Record Stock Count Calibration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                  PRODUCT TO RECONCILE *
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-mono text-slate-900 py-2 px-3 rounded-lg outline-none focus:border-blue-600"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({p.currentStock} {p.uom} on book)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">SYSTEM RECORDED</span>
                  <div className="font-bold text-base text-slate-900 mt-0.5">
                    {systemQty} {selectedProd?.uom}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-600 uppercase mb-0.5 font-semibold">
                    PHYSICAL AUDIT COUNT *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={physicalCount}
                    onChange={(e) => setPhysicalCount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-1.5 px-3 text-sm font-bold text-blue-600 outline-none"
                  />
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">CALCULATED VARIANCE:</span>
                  <strong
                    className={`font-bold font-mono text-sm ${
                      variance > 0
                        ? 'text-emerald-700'
                        : variance < 0
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {variance > 0 ? `+${variance}` : variance} {selectedProd?.uom}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                  CALIBRATION REASON *
                </label>
                <select
                  value={reason}
                  onChange={(e: any) => setReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-mono text-slate-900 py-2 px-3 rounded-lg outline-none focus:border-blue-600"
                >
                  <option value="Cycle Count">Cycle Count (Routine Verification)</option>
                  <option value="Damage / Spoilage">Damage / Spoilage (Quarantine Loss)</option>
                  <option value="Misplaced Goods Found">Misplaced Goods Found (Surplus Stock)</option>
                  <option value="Audited Mismatch">Audited Mismatch (Discrepancy Correction)</option>
                  <option value="Theft / Loss">Theft / Unaccounted Loss</option>
                  <option value="Other">Other Operational Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                  STORAGE LOCATION / RACK
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="WH-01 / Main Store / Rack B"
                  className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                  AUDITOR REMARKS / EVIDENCE
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specify inspection report number, scale calibration reference, or remarks..."
                  className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-mono rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer transition-all"
                >
                  Calibrate & Apply To Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
