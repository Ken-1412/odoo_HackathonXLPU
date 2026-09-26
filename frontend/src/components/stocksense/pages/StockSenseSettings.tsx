import React, { useState } from 'react';
import { Settings, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';

export const StockSenseSettings: React.FC = () => {
  const { resetToDefaults } = useStockSense();

  const [companyName, setCompanyName] = useState('StockSense Industrial Archives');
  const [currency, setCurrency] = useState('USD ($)');
  const [preventNegativeStock, setPreventNegativeStock] = useState(true);
  const [autoLedgerAudit, setAutoLedgerAudit] = useState(true);
  const [defaultUom, setDefaultUom] = useState('KG');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <Settings className="w-4 h-4" />
            <span>SYSTEM // ENTERPRISE CONFIGURATION</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            System & Operational Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system rules, negative stock safeguards, barcode parsing, and archive parameters.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs font-mono text-emerald-800 shadow-xs animate-pulse">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>System configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Panel 1: Enterprise Profile */}
        <ArchivePanel
          title="ORGANIZATION & CURRENCY"
          subtitle="CORE IDENTITY"
          archiveId="CFG::01"
        >
          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-[10.5px] uppercase text-slate-600 mb-1 font-medium">
                FACILITY / ENTERPRISE NAME
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 py-2 px-3 text-slate-900 rounded-lg outline-none font-sans"
              />
            </div>

            <div>
              <label className="block text-[10.5px] uppercase text-slate-600 mb-1 font-medium">
                OPERATIONAL CURRENCY
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-lg outline-none focus:border-blue-600 font-sans"
              >
                <option value="USD ($)">USD ($) — United States Dollar</option>
                <option value="EUR (€)">EUR (€) — Euro</option>
                <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                <option value="GBP (£)">GBP (£) — British Pound</option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] uppercase text-slate-600 mb-1 font-medium">
                DEFAULT UNIT OF MEASURE (UOM)
              </label>
              <select
                value={defaultUom}
                onChange={(e) => setDefaultUom(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 py-2 px-3 rounded-lg outline-none focus:border-blue-600 font-sans"
              >
                <option value="KG">KG — Kilograms</option>
                <option value="PCS">PCS — Pieces / Units</option>
                <option value="MTR">MTR — Meters</option>
                <option value="BOX">BOX — Packaging Boxes</option>
                <option value="LTR">LTR — Liters</option>
              </select>
            </div>
          </div>
        </ArchivePanel>

        {/* Panel 2: Operational Safeguards */}
        <ArchivePanel
          title="OPERATIONAL SAFEGUARDS"
          subtitle="LEDGER & DISPATCH RULES"
          archiveId="CFG::POLICY"
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-start justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <strong className="text-slate-900 block font-sans">Strict Negative Stock Protection</strong>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5 font-sans">
                  Prohibits delivery dispatch or transfers when recorded physical quantity is insufficient.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preventNegativeStock}
                onChange={(e) => setPreventNegativeStock(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded mt-1 cursor-pointer"
              />
            </div>

            <div className="flex items-start justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <strong className="text-slate-900 block font-sans">Automatic Ledger Event Ingestion</strong>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5 font-sans">
                  Automatically generates immutable ledger records upon validating receipts or delivery dispatch.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoLedgerAudit}
                onChange={(e) => setAutoLedgerAudit(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded mt-1 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-all cursor-pointer font-sans"
            >
              Save Configuration
            </button>
          </div>
        </ArchivePanel>

        {/* Panel 3: Factory Defaults Reset */}
        <ArchivePanel
          title="DEMO RECOVERY & FACTORY RESET"
          subtitle="LOCAL STORE CONTROLS"
          archiveId="CFG::RESET"
          className="md:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div>
              <span className="text-slate-900 font-bold block font-sans">Reset Inventory Database to Factory Demo State</span>
              <span className="text-slate-500 text-[11px] font-sans">
                Restores original sample products (Steel, Aluminum, Polymer Resin), receipts, deliveries, and ledger trail.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset all inventory records to default sample data?')) {
                  resetToDefaults();
                  alert('StockSense restored to factory sample records.');
                }
              }}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-xs font-sans font-medium"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              <span>Restore Factory Sample Data</span>
            </button>
          </div>
        </ArchivePanel>
      </form>
    </div>
  );
};
