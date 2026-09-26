import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Search,
  Plus,
  Warehouse,
  CheckCircle2,
  X,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';
import { TechnicalBadge } from '../ui/TechnicalBadge';
import type { InternalTransfer } from '../../../types/stockSense';

interface StockSenseTransfersProps {
  onOpenQuickAction?: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product', prefill?: any) => void;
  initialSelectedId?: string | null;
}

export const StockSenseTransfers: React.FC<StockSenseTransfersProps> = ({
  initialSelectedId,
}) => {
  const { transfers, products, warehouses, createTransfer } = useStockSense();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTransfer, setActiveTransfer] = useState<InternalTransfer | null>(() => {
    if (initialSelectedId) {
      return transfers.find((t) => t.id === initialSelectedId) || null;
    }
    return null;
  });

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // New Transfer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProdId, setSelectedProdId] = useState(products[0]?.id || '');
  const [sourceWh, setSourceWh] = useState('WH-01');
  const [sourceLocation, setSourceLocation] = useState('WH-01 / Main Store / Rack A');
  const [destWh, setDestWh] = useState('WH-02');
  const [destLocation, setDestLocation] = useState('WH-02 / Line 1 / Staging Rack D');
  const [transferQty, setTransferQty] = useState<number>(50);
  const [notes, setNotes] = useState('');

  const selectedProd = products.find((p) => p.id === selectedProdId);

  const filteredTransfers = transfers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      t.id.toLowerCase().includes(q) ||
      t.productName.toLowerCase().includes(q) ||
      t.sku.toLowerCase().includes(q) ||
      t.sourceLocation.toLowerCase().includes(q) ||
      t.destinationLocation.toLowerCase().includes(q) ||
      t.operator.toLowerCase().includes(q)
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;

    if (transferQty > selectedProd.currentStock) {
      alert(`Cannot transfer: Requested ${transferQty} ${selectedProd.uom}, but total stock is ${selectedProd.currentStock} ${selectedProd.uom}.`);
      return;
    }

    try {
      const res = createTransfer({
        reference: `IT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        productId: selectedProd.id,
        productName: selectedProd.name,
        sku: selectedProd.sku,
        quantity: Number(transferQty) || 1,
        uom: selectedProd.uom,
        sourceWarehouseId: sourceWh,
        sourceLocation: sourceLocation.trim(),
        destinationWarehouseId: destWh,
        destinationLocation: destLocation.trim(),
        operator: 'Elena Rostova',
        notes: notes.trim(),
        executeImmediately: true,
      });

      setFeedbackMsg(res.message);
      setIsModalOpen(false);
      setActiveTransfer(res.transfer);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <ArrowRightLeft className="w-4 h-4" />
            <span>OPERATIONS // RELOCATION & REBALANCING</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Internal Stock Transfers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Relocate stock across facilities, zones, racks, and production lines with strict quantity conservation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Transfer</span>
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

      {/* Conservation Principle Banner */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between text-[11px] font-mono gap-4">
        <div className="flex items-center gap-2 text-blue-600 shrink-0">
          <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600" />
          <span className="font-bold">INVENTORY CONSERVATION PRINCIPLE:</span>
        </div>
        <div className="text-slate-600 hidden sm:block">
          Total company-wide inventory remains unchanged. Location balances update instantly in the Ledger audit trail.
        </div>
        <div className="text-emerald-700 font-bold shrink-0">
          DELTA = 0 NET UNITS
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
            placeholder="Search by transfer ID (e.g. TRF-018), product name, or location..."
            className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>
        <div className="font-mono text-xs text-slate-500">
          {filteredTransfers.length} Movement Records
        </div>
      </div>

      {/* Transfers Table */}
      <ArchivePanel
        title={`INTERNAL TRANSFER LEDGER (${filteredTransfers.length})`}
        subtitle="SPATIAL MOVEMENTS"
        archiveId="TRF::STREAM"
      >
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3 font-medium">EVENT ID</th>
                <th className="py-2.5 px-3 font-medium">PRODUCT SPECIMEN</th>
                <th className="py-2.5 px-3 font-medium">ORIGIN (SOURCE)</th>
                <th className="py-2.5 px-3 font-medium">DESTINATION (TARGET)</th>
                <th className="py-2.5 px-3 font-medium text-right">QUANTITY</th>
                <th className="py-2.5 px-3 font-medium">TIMESTAMP & OPERATOR</th>
                <th className="py-2.5 px-3 font-medium text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTransfers.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setActiveTransfer(t)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:text-blue-700">
                    {t.id}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">
                      {t.productName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {t.sku}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.sourceLocation}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="w-3 h-3 text-blue-600" />
                      <span>{t.destinationLocation}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-xs text-slate-900">
                    {t.quantity} {t.uom}
                  </td>
                  <td className="py-3 px-3 font-mono text-[10.5px] text-slate-500">
                    <div>{t.timestamp}</div>
                    <div className="text-[9.5px] text-slate-400">By: {t.operator}</div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <TechnicalBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransfers.length === 0 && (
            <div className="text-center py-10 font-mono text-xs text-slate-400">
              No internal transfer records found.
            </div>
          )}
        </div>
      </ArchivePanel>

      {/* Transfer Detail Modal */}
      {activeTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveTransfer(null)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Transfer Voucher: {activeTransfer.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTransfer(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-slate-900">
                  <span className="font-sans text-sm font-bold text-slate-900">
                    {activeTransfer.productName}
                  </span>
                  <TechnicalBadge status={activeTransfer.status} />
                </div>
                <div className="text-slate-500">SKU: {activeTransfer.sku}</div>
                <div className="text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
                  Transferred: {activeTransfer.quantity} {activeTransfer.uom}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block">ORIGIN FACILITY:</span>
                  <div className="text-slate-800 mt-0.5">{activeTransfer.sourceLocation}</div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block">DESTINATION FACILITY:</span>
                  <div className="text-slate-800 mt-0.5">{activeTransfer.destinationLocation}</div>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span>Executed: {activeTransfer.timestamp}</span>
                <span>Operator: {activeTransfer.operator}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Initiate Stock Transfer
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
                  SELECT PRODUCT TO RELOCATE *
                </label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs font-mono text-slate-900 py-2 px-3 rounded-lg outline-none focus:border-blue-600"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.name} ({p.currentStock} {p.uom} available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    SOURCE FACILITY
                  </label>
                  <select
                    value={sourceWh}
                    onChange={(e) => setSourceWh(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-mono text-slate-800 py-2 px-3 rounded-lg outline-none focus:border-blue-600"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.code} ({wh.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    TARGET FACILITY
                  </label>
                  <select
                    value={destWh}
                    onChange={(e) => setDestWh(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-mono text-slate-800 py-2 px-3 rounded-lg outline-none focus:border-blue-600"
                  >
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.code} ({wh.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    ORIGIN RACK / LOCATION
                  </label>
                  <input
                    type="text"
                    value={sourceLocation}
                    onChange={(e) => setSourceLocation(e.target.value)}
                    placeholder="WH-01 / Main Store / Rack A"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    TARGET RACK / LOCATION
                  </label>
                  <input
                    type="text"
                    value={destLocation}
                    onChange={(e) => setDestLocation(e.target.value)}
                    placeholder="WH-02 / Line 1 / Staging Rack D"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    TRANSFER QUANTITY *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={transferQty}
                    onChange={(e) => setTransferQty(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                  {selectedProd && (
                    <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                      Current available stock: {selectedProd.currentStock} {selectedProd.uom}
                    </span>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    OPERATOR PURPOSE / NOTES
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Specify batch work order, maintenance transfer, or staging purpose..."
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 outline-none resize-none"
                  />
                </div>
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
                  Confirm & Transfer Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
