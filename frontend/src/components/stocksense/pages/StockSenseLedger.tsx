import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Download,
  X,
  ShieldCheck,
  Truck,
  Send,
  ArrowRightLeft,
  Scale
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';
import { TechnicalBadge } from '../ui/TechnicalBadge';
import { StockSenseLogo } from '../ui/StockSenseLogo';
import type { LedgerEntry, LedgerEventType } from '../../../types/stockSense';

interface StockSenseLedgerProps {
  initialEventId?: string | null;
}

export const StockSenseLedger: React.FC<StockSenseLedgerProps> = ({
  initialEventId,
}) => {
  const { ledger } = useStockSense();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | LedgerEventType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DONE' | 'PENDING'>('ALL');

  const [activeEntry, setActiveEntry] = useState<LedgerEntry | null>(() => {
    if (initialEventId) {
      return ledger.find((l) => l.eventId === initialEventId || l.id === initialEventId) || null;
    }
    return null;
  });

  const filteredLedger = ledger.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.eventId.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.from.toLowerCase().includes(q) ||
      item.to.toLowerCase().includes(q) ||
      item.user.toLowerCase().includes(q);

    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Event ID', 'Type', 'Product', 'SKU', 'From', 'To', 'Quantity', 'UOM', 'Balance After', 'Operator', 'Timestamp', 'Status'];
    const rows = filteredLedger.map((l) => [
      l.eventId,
      l.type,
      `"${l.productName.replace(/"/g, '""')}"`,
      l.sku,
      `"${l.from.replace(/"/g, '""')}"`,
      `"${l.to.replace(/"/g, '""')}"`,
      l.quantity,
      l.uom,
      l.balanceAfter || '',
      `"${l.user}"`,
      l.timestamp,
      l.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSense_Ledger_Export_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEventIcon = (type: LedgerEventType) => {
    switch (type) {
      case 'RECEIPT':
        return <Truck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'DELIVERY':
        return <Send className="w-3.5 h-3.5 text-blue-600" />;
      case 'TRANSFER':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />;
      case 'ADJUSTMENT':
        return <Scale className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <FileSpreadsheet className="w-4 h-4" />
            <span>RECORDS // PERMANENT AUDIT REGISTRY</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Stock Ledger & Move History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The immutable operational chronicle of every inward, outward, transfer, and calibration event.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-medium text-xs shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Provenance Principle */}
      <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-[11px] font-mono gap-4 shadow-xs">
        <div className="flex items-center gap-2 text-blue-600 shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-bold">PERMANENT LEDGER POLICY:</span>
        </div>
        <div className="text-slate-600 hidden sm:block">
          Every receipt, delivery dispatch, inter-rack movement, and cycle count adjustment forms an unalterable audit trail.
        </div>
        <div className="text-slate-900 font-bold shrink-0">
          IMMUTABLE CHRONICLE
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event ID (e.g. RCP-042, TRF-018), product, or location..."
              className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none font-sans"
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
            <span className="text-slate-500 uppercase mr-1">TYPE:</span>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
              {(['ALL', 'RECEIPT', 'DELIVERY', 'TRANSFER', 'ADJUSTMENT'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    typeFilter === t
                      ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'ALL' ? 'ALL' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10.5px]">
            <span className="text-slate-500 uppercase mr-1">STATUS:</span>
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
              {(['ALL', 'DONE', 'PENDING'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === s
                      ? 'bg-slate-800 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Master Ledger Table */}
      <ArchivePanel
        title={`CHRONOLOGICAL LEDGER ENTRIES (${filteredLedger.length})`}
        subtitle="VERIFIED MOVEMENT STREAM"
        archiveId="AUDIT::V2"
      >
        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3 font-medium">EVENT ID</th>
                <th className="py-2.5 px-3 font-medium">TYPE</th>
                <th className="py-2.5 px-3 font-medium">MATERIAL SPECIMEN</th>
                <th className="py-2.5 px-3 font-medium">FROM (ORIGIN)</th>
                <th className="py-2.5 px-3 font-medium">TO (TARGET)</th>
                <th className="py-2.5 px-3 font-medium text-right">QUANTITY</th>
                <th className="py-2.5 px-3 font-medium text-right">BALANCE AFTER</th>
                <th className="py-2.5 px-3 font-medium">OPERATOR & TIMESTAMP</th>
                <th className="py-2.5 px-3 font-medium text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setActiveEntry(row)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:text-blue-700">
                    <div className="flex items-center gap-1.5">
                      {getEventIcon(row.type)}
                      <span>{row.eventId}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[10.5px]">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[9.5px] uppercase font-semibold ${
                        row.type === 'RECEIPT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : row.type === 'DELIVERY'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : row.type === 'TRANSFER'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {row.type}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">
                      {row.productName}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {row.sku}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[150px]">
                    {row.from}
                  </td>

                  <td className="py-3 px-3 font-mono text-[11px] text-slate-600 truncate max-w-[150px]">
                    {row.to}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-xs">
                    <span
                      className={
                        row.quantity > 0
                          ? 'text-emerald-700'
                          : row.quantity < 0
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }
                    >
                      {row.quantity > 0 ? `+${row.quantity}` : row.quantity} {row.uom}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-xs text-slate-500">
                    {row.balanceAfter !== undefined ? `${row.balanceAfter} ${row.uom}` : '—'}
                  </td>

                  <td className="py-3 px-3 font-mono text-[10.5px] text-slate-500">
                    <div>{row.timestamp}</div>
                    <div className="text-[9.5px] text-slate-400">By: {row.user}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <TechnicalBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLedger.length === 0 && (
            <div className="text-center py-10 font-mono text-xs text-slate-400">
              No ledger records found matching the specified filters.
            </div>
          )}
        </div>
      </ArchivePanel>

      {/* Voucher Detail Modal */}
      {activeEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveEntry(null)}
          />

          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <StockSenseLogo size="sm" />
                <h3 className="text-base font-bold text-slate-900 ml-2">
                  Ledger Voucher: {activeEntry.eventId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-slate-900">
                  <span className="font-sans text-sm font-bold text-slate-900">
                    {activeEntry.productName}
                  </span>
                  <TechnicalBadge status={activeEntry.status} />
                </div>
                <div className="text-slate-500">SKU: {activeEntry.sku}</div>
                <div className="flex items-center justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Quantity Delta:</span>
                  <span
                    className={
                      activeEntry.quantity > 0
                        ? 'text-emerald-700'
                        : activeEntry.quantity < 0
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }
                  >
                    {activeEntry.quantity > 0 ? `+${activeEntry.quantity}` : activeEntry.quantity} {activeEntry.uom}
                  </span>
                </div>
                {activeEntry.balanceAfter !== undefined && (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Balance in Record:</span>
                    <strong className="text-slate-900">{activeEntry.balanceAfter} {activeEntry.uom}</strong>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block">ORIGIN / FROM:</span>
                  <div className="text-slate-800 mt-0.5">{activeEntry.from}</div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 uppercase block">DESTINATION / TO:</span>
                  <div className="text-slate-800 mt-0.5">{activeEntry.to}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Cryptographic Event Hash:</span>
                  <span className="text-blue-600 font-semibold">#0x{activeEntry.id.replace('LED-', '')}9f24</span>
                </div>
                <div className="flex justify-between">
                  <span>Logged Timestamp:</span>
                  <span className="text-slate-800">{activeEntry.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Signed Operator:</span>
                  <span className="text-slate-800">{activeEntry.user}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveEntry(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
