import React, { useState } from 'react';
import {
  Send,
  Search,
  Plus,
  CheckCircle2,
  Warehouse,
  ExternalLink,
  X,
  AlertTriangle,
  Truck
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';
import { TechnicalBadge } from '../ui/TechnicalBadge';
import type { DeliveryOrder, DeliveryStage, DeliveryItem } from '../../../types/stockSense';

interface StockSenseDeliveriesProps {
  onOpenQuickAction?: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product', prefill?: any) => void;
  initialSelectedId?: string | null;
}

export const StockSenseDeliveries: React.FC<StockSenseDeliveriesProps> = ({
  initialSelectedId,
}) => {
  const { deliveries, products, validateDelivery, createDelivery } = useStockSense();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | DeliveryStage>('ALL');
  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(() => {
    if (initialSelectedId) {
      return deliveries.find((d) => d.id === initialSelectedId) || null;
    }
    return null;
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Create Delivery Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newRef, setNewRef] = useState(`SO-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newWh, setNewWh] = useState('WH-01');
  const [newLocation, setNewLocation] = useState('WH-01 / Rack A / A-01');
  const [newDate, setNewDate] = useState(new Date().toISOString().substring(0, 10));
  const [newProductId, setNewProductId] = useState(products[0]?.id || '');
  const [newQuantity, setNewQuantity] = useState<number>(10);
  const [newNotes, setNewNotes] = useState('');

  const selectedProduct = products.find((p) => p.id === newProductId);

  const filteredDeliveries = deliveries.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.id.toLowerCase().includes(q) ||
      d.reference.toLowerCase().includes(q) ||
      d.customer.toLowerCase().includes(q) ||
      d.items.some((item) => item.productName.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));

    const matchesStage = stageFilter === 'ALL' || d.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleValidate = (id: string) => {
    const res = validateDelivery(id);
    if (res.success) {
      setFeedbackMsg({ text: res.message, type: 'success' });
      if (activeDelivery && activeDelivery.id === id) {
        setActiveDelivery(res.delivery);
      }
    } else {
      setFeedbackMsg({ text: res.message, type: 'error' });
    }
    setTimeout(() => setFeedbackMsg(null), 6000);
  };

  const handleAdvanceStage = (delivery: DeliveryOrder, nextStage: DeliveryStage) => {
    delivery.stage = nextStage;
    if (nextStage === 'READY') {
      delivery.status = 'READY';
    }
    setActiveDelivery({ ...delivery });
    setFeedbackMsg({ text: `Delivery ${delivery.id} advanced to ${nextStage}.`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !newCustomer.trim()) return;

    if (newQuantity > selectedProduct.currentStock) {
      setFeedbackMsg({
        text: `Cannot create delivery: Requested ${newQuantity} ${selectedProduct.uom}, but only ${selectedProduct.currentStock} ${selectedProduct.uom} available in stock.`,
        type: 'error',
      });
      return;
    }

    const delivery = createDelivery({
      reference: newRef,
      customer: newCustomer.trim(),
      sourceWarehouseId: newWh,
      sourceLocation: newLocation,
      scheduledDate: newDate,
      items: [
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          quantity: Number(newQuantity) || 1,
          uom: selectedProduct.uom,
          availableStock: selectedProduct.currentStock,
        },
      ],
      stage: 'PICKING',
      status: 'WAITING',
      operator: 'Marcus Vance',
      notes: newNotes.trim(),
    });

    setIsCreateModalOpen(false);
    setActiveDelivery(delivery);
    setFeedbackMsg({ text: `Delivery Order ${delivery.id} created and staged for picking.`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <Send className="w-4 h-4" />
            <span>OPERATIONS // OUTBOUND FULFILLMENT</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Delivery Orders & Dispatch
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Process customer orders through Pick, Pack, and Validate dispatch stages with stock protection.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Delivery</span>
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-mono transition-all shadow-xs ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Fulfillment Flow Stages Banner */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center justify-between text-[11px] font-mono overflow-x-auto scrollbar-none gap-4">
        <div className="flex items-center gap-2 text-blue-600 shrink-0">
          <span className="w-2 h-2 bg-blue-600 rounded-full" />
          <span className="font-bold">DISPATCH STAGES:</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 shrink-0">
          <span className="text-slate-800 font-medium">1. ORDER CREATION</span>
          <span>→</span>
          <span className="text-slate-800 font-medium">2. PICK FROM RACKS</span>
          <span>→</span>
          <span className="text-slate-800 font-medium">3. PACK & WEIGH</span>
          <span>→</span>
          <span className="text-blue-600 font-bold">4. VALIDATE & DISPATCH</span>
          <span>→</span>
          <span className="text-emerald-700 font-bold">5. STOCK DECREASES & AUDIT RECORDED</span>
        </div>
      </div>

      {/* Search & Stage Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by delivery ID (e.g. DLV-091), customer name, or product..."
            className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-10 pr-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px]">
          <span className="text-slate-500 uppercase mr-1">STAGE:</span>
          {(['ALL', 'PICKING', 'PACKING', 'READY', 'DONE', 'DRAFT'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStageFilter(st)}
              className={`px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                stageFilter === st
                  ? 'bg-blue-600 text-white font-semibold border-blue-600'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Table Panel */}
      <ArchivePanel
        title={`DELIVERY MANIFEST (${filteredDeliveries.length})`}
        subtitle="DISPATCH RECORDS"
        archiveId="DLV::LOG"
      >
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3 font-medium">DELIVERY ID</th>
                <th className="py-2.5 px-3 font-medium">CUSTOMER & REF</th>
                <th className="py-2.5 px-3 font-medium">SOURCE LOCATION</th>
                <th className="py-2.5 px-3 font-medium">DISPATCH ITEMS</th>
                <th className="py-2.5 px-3 font-medium">STOCK AVAILABILITY</th>
                <th className="py-2.5 px-3 font-medium text-center">STAGE</th>
                <th className="py-2.5 px-3 font-medium text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredDeliveries.map((d) => {
                const isDone = d.stage === 'DONE';

                // Check stock sufficiency for items
                const isStockSufficient = d.items.every((item) => {
                  const p = products.find((pr) => pr.id === item.productId || pr.sku === item.sku);
                  return p && p.currentStock >= item.quantity;
                });

                return (
                  <tr
                    key={d.id}
                    onClick={() => setActiveDelivery(d)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Delivery ID */}
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:text-blue-700">
                      {d.id}
                    </td>

                    {/* Customer & Ref */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        {d.customer}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        Ref: {d.reference}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.sourceLocation}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Date: {d.scheduledDate}</div>
                    </td>

                    {/* Dispatch Items */}
                    <td className="py-3 px-3 font-mono text-xs">
                      {d.items.map((item, idx) => (
                        <div key={idx} className="text-slate-800">
                          <strong className="text-blue-600">-{item.quantity} {item.uom}</strong>{' '}
                          <span className="text-slate-500">{item.productName}</span>
                        </div>
                      ))}
                    </td>

                    {/* Stock Availability Safeguard */}
                    <td className="py-3 px-3 font-mono text-xs">
                      {isDone ? (
                        <span className="text-slate-500">Fulfilled</span>
                      ) : isStockSufficient ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                          <span>Stock Reserved</span>
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1 font-bold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Insufficient Stock!</span>
                        </span>
                      )}
                    </td>

                    {/* Stage Badge */}
                    <td className="py-3 px-3 text-center">
                      <TechnicalBadge status={d.stage} />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div
                        className="inline-flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isDone && d.stage === 'READY' && (
                          <button
                            type="button"
                            onClick={() => handleValidate(d.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold font-mono text-[10.5px] rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Validate Dispatch</span>
                          </button>
                        )}

                        {!isDone && d.stage === 'PICKING' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStage(d, 'PACKING')}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-[10.5px] rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          >
                            Pack Order →
                          </button>
                        )}

                        {!isDone && d.stage === 'PACKING' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStage(d, 'READY')}
                            className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono text-[10.5px] rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          >
                            Mark Ready →
                          </button>
                        )}

                        {isDone && (
                          <span className="font-mono text-[10.5px] text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Dispatched</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveDelivery(d)}
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

          {filteredDeliveries.length === 0 && (
            <div className="text-center py-10 font-mono text-xs text-slate-400">
              No delivery orders matching the specified stage or search query.
            </div>
          )}
        </div>
      </ArchivePanel>

      {/* Delivery Detail Modal */}
      {activeDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveDelivery(null)}
          />

          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Delivery Manifest: {activeDelivery.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDelivery(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">CUSTOMER</span>
                  <strong className="text-slate-900">{activeDelivery.customer}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">SALES REF</span>
                  <span className="text-blue-600 font-semibold">{activeDelivery.reference}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">STAGE</span>
                  <TechnicalBadge status={activeDelivery.stage} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">SOURCE LOCATION</span>
                  <span className="text-slate-800">{activeDelivery.sourceLocation}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">SCHEDULED DATE</span>
                  <span className="text-slate-800">{activeDelivery.scheduledDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">OPERATOR</span>
                  <span className="text-slate-800">{activeDelivery.operator}</span>
                </div>
              </div>

              {/* Items with Live Stock Validation */}
              <div>
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-slate-500 block mb-2">
                  DISPATCH LINE ITEMS & STOCK LEVEL
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">PRODUCT NAME</th>
                        <th className="p-3 text-right">DISPATCH QTY</th>
                        <th className="p-3 text-right">ON HAND</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeDelivery.items.map((item: DeliveryItem, idx: number) => {
                        const prod = products.find((p) => p.id === item.productId || p.sku === item.sku);
                        const onHand = prod ? prod.currentStock : 0;
                        const isShort = onHand < item.quantity;

                        return (
                          <tr key={idx} className="bg-white">
                            <td className="p-3 text-blue-600 font-bold">{item.sku}</td>
                            <td className="p-3 text-slate-900 font-sans">{item.productName}</td>
                            <td className="p-3 text-right font-bold text-blue-600">
                              -{item.quantity} {item.uom}
                            </td>
                            <td className="p-3 text-right font-bold">
                              <span className={isShort ? 'text-rose-600' : 'text-emerald-700'}>
                                {onHand} {item.uom}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="font-mono text-[10px] text-slate-500">
                  {activeDelivery.stage === 'DONE' ? (
                    <span className="text-emerald-700 font-semibold">
                      Validated at: {activeDelivery.validatedAt || 'Dispatched'}
                    </span>
                  ) : (
                    <span>Follow Pick → Pack → Validate sequence</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveDelivery(null)}
                    className="px-4 py-2 text-xs font-mono text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  {activeDelivery.stage === 'PICKING' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage(activeDelivery, 'PACKING')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono rounded-lg border border-slate-200 cursor-pointer transition-colors"
                    >
                      Advance to Packing →
                    </button>
                  )}

                  {activeDelivery.stage === 'PACKING' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStage(activeDelivery, 'READY')}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-mono rounded-lg border border-blue-200 cursor-pointer transition-colors font-semibold"
                    >
                      Mark Ready for Dispatch →
                    </button>
                  )}

                  {activeDelivery.stage !== 'DONE' && (
                    <button
                      type="button"
                      onClick={() => handleValidate(activeDelivery.id)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold font-mono text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-2 transition-all"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Validate & Deduct Stock</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Create Outbound Delivery Order
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
                    CLIENT / CUSTOMER *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCustomer}
                    onChange={(e) => setNewCustomer(e.target.value)}
                    placeholder="e.g. Vertex Industries"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    SALES ORDER REF *
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
                    PRODUCT TO DISPATCH *
                  </label>
                  <select
                    value={newProductId}
                    onChange={(e) => setNewProductId(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs font-mono text-slate-800 py-2 px-3 rounded-lg outline-none focus:border-blue-600"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name} ({p.currentStock} {p.uom} available)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    DISPATCH QUANTITY *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                  {selectedProduct && newQuantity > selectedProduct.currentStock && (
                    <span className="text-[10px] font-mono text-rose-600 mt-1 block">
                      Exceeds available stock ({selectedProduct.currentStock} {selectedProduct.uom})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    SCHEDULED DISPATCH
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
                    SOURCE FACILITY
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
                    PICKING RACK / BAY
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="WH-01 / Rack B / B-02"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-xs font-mono text-slate-900 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10.5px] font-mono uppercase tracking-wider text-slate-600 mb-1">
                    SPECIAL HANDLING / DISPATCH NOTES
                  </label>
                  <textarea
                    rows={2}
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Packing specifications, carrier tracking, freight account notes..."
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
                  Create & Stage for Picking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
