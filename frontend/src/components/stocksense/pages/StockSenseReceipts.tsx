import React, { useState } from 'react';
import {
  Truck,
  Search,
  Plus,
  CheckCircle2,
  Calendar,
  Warehouse,
  ExternalLink,
  X,
  FileCheck
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';
import { TechnicalBadge } from '../ui/TechnicalBadge';
import type { ReceiptOrder, OperationStatus, ReceiptItem } from '../../../types/stockSense';

interface StockSenseReceiptsProps {
  onOpenQuickAction?: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product', prefill?: any) => void;
  initialSelectedId?: string | null;
}

export const StockSenseReceipts: React.FC<StockSenseReceiptsProps> = ({
  initialSelectedId,
}) => {
  const { receipts, products, validateReceipt, createReceipt } = useStockSense();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OperationStatus>('ALL');
  const [activeReceipt, setActiveReceipt] = useState<ReceiptOrder | null>(() => {
    if (initialSelectedId) {
      return receipts.find((r) => r.id === initialSelectedId) || null;
    }
    return null;
  });

  const [validationSuccessMsg, setValidationSuccessMsg] = useState<string | null>(null);

  // New Receipt Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState('');
  const [newRef, setNewRef] = useState(`PO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newWh, setNewWh] = useState('WH-01');
  const [newLocation, setNewLocation] = useState('WH-01 / Dock Bay 01');
  const [newDate, setNewDate] = useState(new Date().toISOString().substring(0, 10));
  const [newProductId, setNewProductId] = useState(products[0]?.id || '');
  const [newQuantity, setNewQuantity] = useState<number>(100);
  const [newNotes, setNewNotes] = useState('');

  const filteredReceipts = receipts.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.reference.toLowerCase().includes(q) ||
      r.supplier.toLowerCase().includes(q) ||
      r.items.some((item) => item.productName.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleValidate = (id: string) => {
    try {
      const res = validateReceipt(id);
      if (res.success) {
        setValidationSuccessMsg(res.message);
        if (activeReceipt && activeReceipt.id === id) {
          setActiveReceipt(res.receipt);
        }
        setTimeout(() => setValidationSuccessMsg(null), 5000);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === newProductId);
    if (!prod || !newSupplier.trim()) return;

    const receipt = createReceipt({
      reference: newRef,
      supplier: newSupplier.trim(),
      destinationWarehouseId: newWh,
      destinationLocation: newLocation,
      scheduledDate: newDate,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: Number(newQuantity) || 1,
          uom: prod.uom,
        },
      ],
      status: 'READY',
      operator: 'Marcus Vance',
      notes: newNotes.trim(),
    });

    setIsCreateModalOpen(false);
    setActiveReceipt(receipt);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <Truck className="w-4 h-4" />
            <span>OPERATIONS // INCOMING SHIPMENTS</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Receipts & Ingestion Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log vendor consignments, inspect goods, and validate incoming stock into the ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Receipt</span>
          </button>
        </div>
      </div>

      {/* Validation Toast */}
      {validationSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs font-mono text-emerald-800 shadow-xs animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{validationSuccessMsg}</span>
        </div>
      )}

      {/* Process Flow Indicator Banner */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between text-[11px] font-mono overflow-x-auto scrollbar-none gap-4">
        <div className="flex items-center gap-2 text-blue-600 shrink-0">
          <span className="w-2 h-2 bg-blue-600 rounded-full" />
          <span className="font-bold">INGESTION LIFECYCLE:</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 shrink-0">
          <span className="text-slate-800 font-medium">1. CREATE DRAFT</span>
          <span>→</span>
          <span className="text-slate-800 font-medium">2. SELECT SUPPLIER</span>
          <span>→</span>
          <span className="text-slate-800 font-medium">3. ADD PRODUCTS</span>
          <span>→</span>
          <span className="text-blue-600 font-bold">4. VALIDATE & INGEST</span>
          <span>→</span>
          <span className="text-emerald-700 font-bold">5. STOCK INCREASES & LEDGER LOGGED</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by receipt ID (e.g. RCP-042), supplier, or product name..."
            className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
          <span className="text-slate-500 uppercase mr-1">STATUS:</span>
          {(['ALL', 'WAITING', 'READY', 'DONE', 'DRAFT'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white font-semibold border-blue-600'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Table Panel */}
      <ArchivePanel
        title={`RECEIPT REGISTRY (${filteredReceipts.length})`}
        subtitle="INCOMING CONSIGNMENTS"
        archiveId="RCP::LOG"
      >
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3 font-medium">RECEIPT ID</th>
                <th className="py-2.5 px-3 font-medium">SUPPLIER & REF</th>
                <th className="py-2.5 px-3 font-medium">DESTINATION</th>
                <th className="py-2.5 px-3 font-medium">CONSIGNED PRODUCTS</th>
                <th className="py-2.5 px-3 font-medium">SCHEDULED DATE</th>
                <th className="py-2.5 px-3 font-medium text-center">STATUS</th>
                <th className="py-2.5 px-3 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredReceipts.map((r) => {
                const isDone = r.status === 'DONE';

                return (
                  <tr
                    key={r.id}
                    onClick={() => setActiveReceipt(r)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Receipt ID */}
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:text-blue-700">
                      {r.id}
                    </td>

                    {/* Supplier & Ref */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {r.supplier}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        Ref: {r.reference}
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.destinationLocation}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Operator: {r.operator}</div>
                    </td>

                    {/* Consigned Products */}
                    <td className="py-3 px-3">
                      {r.items.map((item, idx) => (
                        <div key={idx} className="font-mono text-xs text-slate-800">
                          <strong className="text-emerald-700">+{item.quantity} {item.uom}</strong>{' '}
                          <span className="text-slate-500">{item.productName} ({item.sku})</span>
                        </div>
                      ))}
                    </td>

                    {/* Scheduled Date */}
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{r.scheduledDate}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <TechnicalBadge status={r.status} />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right">
                      <div
                        className="inline-flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isDone ? (
                          <button
                            type="button"
                            onClick={() => handleValidate(r.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold font-mono text-[10.5px] rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Validate</span>
                          </button>
                        ) : (
                          <span className="font-mono text-[10.5px] text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ingested</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(r)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-10 font-mono text-xs text-slate-400">
              No receipt records matching the specified filters.
            </div>
          )}
        </div>
      </ArchivePanel>

      {/* Receipt Detail Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveReceipt(null)}
          />

          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Consignment Sheet: {activeReceipt.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">SUPPLIER</span>
                  <strong className="text-slate-900">{activeReceipt.supplier}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">REFERENCE</span>
                  <span className="text-blue-600 font-semibold">{activeReceipt.reference}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">STATUS</span>
                  <TechnicalBadge status={activeReceipt.status} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">DESTINATION</span>
                  <span className="text-slate-800">{activeReceipt.destinationLocation}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">SCHEDULED DATE</span>
                  <span className="text-slate-800">{activeReceipt.scheduledDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">OPERATOR</span>
                  <span className="text-slate-800">{activeReceipt.operator}</span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500 block mb-2">
                  CONSIGNED MATERIAL ITEMS
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">PRODUCT NAME</th>
                        <th className="p-3 text-right">QUANTITY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeReceipt.items.map((item: ReceiptItem, idx: number) => (
                        <tr key={idx} className="bg-white">
                          <td className="p-3 text-blue-600 font-bold">{item.sku}</td>
                          <td className="p-3 text-slate-900 font-sans">{item.productName}</td>
                          <td className="p-3 text-right font-bold text-emerald-700">
                            +{item.quantity} {item.uom}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {activeReceipt.notes && (
                <div className="text-xs font-sans text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-mono text-[10px] text-slate-400 uppercase block mb-0.5">
                    CONSIGNMENT NOTES:
                  </span>
                  {activeReceipt.notes}
                </div>
              )}

              {/* Validation Action */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="font-mono text-[10px] text-slate-500">
                  {activeReceipt.status === 'DONE' ? (
                    <span className="text-emerald-700 font-semibold">
                      Validated at: {activeReceipt.validatedAt || 'Active'}
                    </span>
                  ) : (
                    <span>Awaiting warehouse verification</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveReceipt(null)}
                    className="px-4 py-2 text-xs font-mono text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  {activeReceipt.status !== 'DONE' && (
                    <button
                      type="button"
                      onClick={() => handleValidate(activeReceipt.id)}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold font-mono text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-2 transition-all"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Validate & Update Stock</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Receipt Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Create Inbound Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    VENDOR / SUPPLIER *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    placeholder="e.g. Apex Steel Corp"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    PURCHASE ORDER REF *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    SELECT PRODUCT CATALOG ITEM *
                  </label>
                  <select
                    value={newProductId}
                    onChange={(e) => setNewProductId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-mono text-slate-800 py-2 px-3 rounded-lg outline-none focus:border-blue-600"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} ({p.currentStock} {p.uom} on hand)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    RECEIVED QUANTITY *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    SCHEDULED DATE
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    DESTINATION FACILITY
                  </label>
                  <select
                    value={newWh}
                    onChange={(e) => setNewWh(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-mono text-slate-800 py-2 px-3 rounded-lg outline-none focus:border-blue-600"
                  >
                    <option value="WH-01">WH-01 Central Logistics</option>
                    <option value="WH-02">WH-02 Production Depot</option>
                    <option value="WH-03">WH-03 Deep Transit Vault</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    SPECIFIC LOCATION / RACK
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="WH-01 / Rack A / A-01"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    INSPECTION / CONSIGNMENT NOTES
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Enter transport invoice numbers, quality seal status, or delivery notes..."
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-mono rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer transition-all"
                >
                  Create & Stage Inbound
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
