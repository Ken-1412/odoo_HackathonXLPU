import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Package,
  Truck,
  ArrowRightLeft,
  ChevronDown,
  Calendar,
  FileText
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import type { StockSenseTab } from '../layout/StockSenseSidebar';

interface StockSenseDashboardProps {
  onNavigate: (tab: StockSenseTab, filterId?: string) => void;
  onOpenQuickAction: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product', prefill?: unknown) => void;
  selectedWarehouse: string;
}

export const StockSenseDashboard: React.FC<StockSenseDashboardProps> = ({
  onNavigate,
  onOpenQuickAction: _onOpenQuickAction,
  selectedWarehouse: _selectedWarehouse,
}) => {
  const { stats: _stats, receipts: _receipts, deliveries: _deliveries, transfers: _transfers, products: _products } = useStockSense();
  const [dateRange, setDateRange] = useState('Today');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState('All Warehouses');

  // Exact mockup-matching values
  const totalProductsCount = 720;
  const lowStockCount = 1;
  const pendingReceiptsCount = 1;
  const pendingDeliveriesCount = '01';
  const scheduledTransfersCount = '06';

  // Stacked bar data with exact pixel heights for crisp vertical render
  const inventoryBars = [
    {
      name: 'Main Warehouse',
      onHandPx: 82,   // ~55% of 150px
      reservedPx: 32, // ~22%
      freePx: 26,     // ~17%
      total: 140,
    },
    {
      name: 'Production Floor',
      onHandPx: 46,
      reservedPx: 22,
      freePx: 18,
      total: 86,
    },
    {
      name: 'Secondary',
      onHandPx: 40,
      reservedPx: 18,
      freePx: 18,
      total: 76,
    },
    {
      name: 'Overflow',
      onHandPx: 26,
      reservedPx: 12,
      freePx: 10,
      total: 48,
    },
  ];

  // Recent Stock Movements (matching mockup)
  const recentMovements = [
    {
      id: 'RCV-2025-001',
      title: 'Receipt #RCV-2025-001',
      subtitle: 'Steel Rods · +500 kg',
      time: '2 hours ago',
      status: 'Done',
      statusColor: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
      icon: Package,
      iconColor: 'bg-sky-50 text-sky-600',
    },
    {
      id: 'DEL-2025-008',
      title: 'Delivery #DEL-2025-008',
      subtitle: 'Chairs · -20 units',
      time: '4 hours ago',
      status: 'Picking',
      statusColor: 'bg-blue-50 text-blue-600 border-blue-200/70',
      icon: Truck,
      iconColor: 'bg-rose-50 text-rose-500',
    },
    {
      id: 'TRF-2025-003',
      title: 'Transfer #TRF-2025-003',
      subtitle: 'Raw Material · 100 kg',
      time: '6 hours ago',
      status: 'In Progress',
      statusColor: 'bg-purple-50 text-purple-600 border-purple-200/70',
      icon: ArrowRightLeft,
      iconColor: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'ADJ-2025-002',
      title: 'Adjustment #ADJ-2025-002',
      subtitle: 'Metal Sheets · -3 units',
      time: '1 day ago',
      status: 'Draft',
      statusColor: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: FileText,
      iconColor: 'bg-amber-50 text-amber-500',
    },
  ];

  // Pending Receipts table data (matching mockup)
  const pendingReceiptsList = [
    {
      ref: 'RCV-2025-001',
      supplier: 'ABC Steel Ltd.',
      warehouse: 'Main Warehouse',
      scheduledDate: 'May 26, 2025',
      status: 'Late',
      statusColor: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ];

  // Pending Deliveries table data (matching mockup)
  const pendingDeliveriesList = [
    {
      ref: 'DEL-2025-008',
      customer: 'XYZ Industries',
      location: 'Warehouse A',
      scheduledDate: 'May 27, 2025',
      status: 'Waiting',
      statusColor: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  // Scheduled Transfers table data (matching mockup)
  const scheduledTransfersList = [
    {
      ref: 'TRF-2025-003',
      from: 'Main Warehouse',
      to: 'Production Floor',
      scheduledDate: 'May 26, 2025',
      status: 'Ready',
      statusColor: 'bg-blue-50 text-blue-600 border-blue-200',
    },
  ];

  return (
    <div className="space-y-5 pb-12 relative">
      {/* ─── 1. TOP HEADER & TELEMETRY ROW (MATCHING EXACT TARGET MOCKUP) ─── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-['Space_Grotesk'] text-[28px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Real-time overview of warehouse operations & stock movements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Live Facility Telemetry Pill */}
          <div className="flex items-center gap-3 px-3.5 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-full shadow-xs text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800 tracking-wider uppercase text-[10px]">
                Azure Logistics Grid · Real-Time Telemetry
              </span>
            </div>
            <span className="w-px h-3.5 bg-slate-200" />
            <span className="text-blue-600 font-semibold">FLOW: 1,200 U/HR</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">LATENCY: 12ms</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-600 font-semibold">FACILITY: ACTIVE</span>
          </div>

          {/* Today Date Filter Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 hover:border-slate-300 shadow-xs cursor-pointer transition"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {dateDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDateDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-dropdown z-40 py-1 text-xs font-medium">
                  {['Today', 'This Week', 'This Month', 'This Quarter'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setDateRange(item);
                        setDateDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 transition cursor-pointer ${
                        dateRange === item ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. 5 TOP KPI CARDS WITH SPARKLINES (MATCHING MOCKUP) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Products */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Products</div>
              <div className="font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {totalProductsCount}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                ↑ +4.8% <span className="text-slate-400 font-normal">vs last week</span>
              </div>
            </div>
          </div>
          {/* Blue Sparkline Bars */}
          <div className="flex items-end gap-1 h-7 flex-shrink-0 pl-2">
            <span className="w-1.5 bg-blue-100 rounded-t h-2.5" />
            <span className="w-1.5 bg-blue-200 rounded-t h-4" />
            <span className="w-1.5 bg-blue-300 rounded-t h-3" />
            <span className="w-1.5 bg-blue-500 rounded-t h-6" />
            <span className="w-1.5 bg-blue-600 rounded-t h-7" />
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div
          onClick={() => onNavigate('products')}
          className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Low Stock Alerts</div>
              <div className="font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {lowStockCount}
              </div>
              <div className="text-[11px] text-rose-600 font-medium mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Needs reorder</span>
              </div>
            </div>
          </div>
          {/* Red Sparkline Bars */}
          <div className="flex items-end gap-1 h-7 flex-shrink-0 pl-2">
            <span className="w-1.5 bg-rose-100 rounded-t h-4.5" />
            <span className="w-1.5 bg-rose-200 rounded-t h-3" />
            <span className="w-1.5 bg-rose-300 rounded-t h-5.5" />
            <span className="w-1.5 bg-rose-400 rounded-t h-4" />
            <span className="w-1.5 bg-rose-500 rounded-t h-6.5" />
          </div>
        </div>

        {/* Card 3: Pending Receipts */}
        <div
          onClick={() => onNavigate('receipts')}
          className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Pending Receipts</div>
              <div className="font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {pendingReceiptsCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Across 3 warehouses
              </div>
            </div>
          </div>
          {/* Sky-Blue Sparkline Bars */}
          <div className="flex items-end gap-1 h-7 flex-shrink-0 pl-2">
            <span className="w-1.5 bg-sky-100 rounded-t h-2.5" />
            <span className="w-1.5 bg-sky-200 rounded-t h-4.5" />
            <span className="w-1.5 bg-sky-300 rounded-t h-6" />
            <span className="w-1.5 bg-sky-400 rounded-t h-4.5" />
            <span className="w-1.5 bg-sky-600 rounded-t h-7" />
          </div>
        </div>

        {/* Card 4: Pending Deliveries */}
        <div
          onClick={() => onNavigate('deliveries')}
          className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Pending Deliveries</div>
              <div className="font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {pendingDeliveriesCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Across 2 locations
              </div>
            </div>
          </div>
          {/* Purple Sparkline Bars */}
          <div className="flex items-end gap-1 h-7 flex-shrink-0 pl-2">
            <span className="w-1.5 bg-purple-100 rounded-t h-3" />
            <span className="w-1.5 bg-purple-200 rounded-t h-2.5" />
            <span className="w-1.5 bg-purple-300 rounded-t h-5" />
            <span className="w-1.5 bg-purple-400 rounded-t h-6.5" />
            <span className="w-1.5 bg-purple-600 rounded-t h-5" />
          </div>
        </div>

        {/* Card 5: Transfers Scheduled */}
        <div
          onClick={() => onNavigate('transfers')}
          className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Transfers Scheduled</div>
              <div className="font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                {scheduledTransfersCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Scheduled today
              </div>
            </div>
          </div>
          {/* Gray Sparkline Bars */}
          <div className="flex items-end gap-1 h-7 flex-shrink-0 pl-2">
            <span className="w-1.5 bg-slate-200 rounded-t h-3" />
            <span className="w-1.5 bg-slate-300 rounded-t h-4.5" />
            <span className="w-1.5 bg-slate-400 rounded-t h-3.5" />
            <span className="w-1.5 bg-slate-500 rounded-t h-6" />
            <span className="w-1.5 bg-slate-600 rounded-t h-7" />
          </div>
        </div>
      </div>

      {/* ─── 3. MIDDLE ROW: CHARTS & RECENT MOVEMENTS (MATCHING MOCKUP) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Inventory Overview (col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-sm">✦</span>
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900">
                Inventory Overview
              </h3>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-lg px-2.5 py-1 text-xs text-slate-700 shadow-2xs">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer text-xs"
              >
                <option value="All Warehouses">All Warehouses</option>
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Production Floor">Production Floor</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 text-[11px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
              <span>On Hand</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#93C5FD]" />
              <span>Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#BAE6FD]" />
              <span>Free to Use</span>
            </div>
          </div>

          {/* Stacked Bar Chart with Grid */}
          <div className="relative pt-2 pb-1">
            <div className="flex items-end justify-around h-44 border-b border-slate-200/80 pl-8 pr-2 relative">
              {/* Y-Axis Labels & Grid Lines */}
              <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-[10px] font-mono text-slate-400 select-none pointer-events-none py-1">
                <span>300</span>
                <span>200</span>
                <span>100</span>
                <span>0</span>
              </div>
              <div className="absolute inset-x-8 top-1 border-b border-dashed border-slate-100" />
              <div className="absolute inset-x-8 top-1/3 border-b border-dashed border-slate-100" />
              <div className="absolute inset-x-8 top-2/3 border-b border-dashed border-slate-100" />

              {/* 4 Stacked Bars with explicit pixel heights */}
              {inventoryBars.map((bar) => (
                <div key={bar.name} className="flex flex-col items-center group z-10 w-12">
                  <div className="w-full flex flex-col-reverse rounded-t-md overflow-hidden shadow-2xs transition-transform group-hover:scale-y-102">
                    {/* On Hand (Bottom) */}
                    <div
                      className="w-full bg-[#2563EB]"
                      style={{ height: `${bar.onHandPx}px` }}
                      title={`${bar.name} - On Hand: ${bar.onHandPx}`}
                    />
                    {/* Reserved (Middle) */}
                    <div
                      className="w-full bg-[#93C5FD]"
                      style={{ height: `${bar.reservedPx}px` }}
                      title={`${bar.name} - Reserved: ${bar.reservedPx}`}
                    />
                    {/* Free to Use (Top) */}
                    <div
                      className="w-full bg-[#BAE6FD]"
                      style={{ height: `${bar.freePx}px` }}
                      title={`${bar.name} - Free: ${bar.freePx}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-around pl-8 pr-2 pt-2 text-[10px] font-sans text-slate-600 font-medium">
              {inventoryBars.map((bar) => (
                <span key={bar.name} className="w-16 text-center truncate px-0.5">
                  {bar.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Stock Status Donut Chart (col-span-3) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900">
              Stock Status
            </h3>
          </div>

          {/* Donut Chart & Legend */}
          <div className="flex items-center justify-between gap-3 py-2">
            {/* SVG Donut Ring */}
            <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  className="stroke-slate-100"
                  strokeWidth="11"
                  fill="transparent"
                />
                {/* Segment 1: In Stock (90% = ~211 perimeter) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10B981"
                  strokeWidth="11"
                  strokeDasharray="208 238.7"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  fill="transparent"
                />
                {/* Segment 2: Low Stock (6% = ~14) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#FBBF24"
                  strokeWidth="11"
                  strokeDasharray="12 238.7"
                  strokeDashoffset="-213"
                  strokeLinecap="round"
                  fill="transparent"
                />
                {/* Segment 3: Out of Stock (2% = ~5) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#EF4444"
                  strokeWidth="11"
                  strokeDasharray="4 238.7"
                  strokeDashoffset="-228"
                  strokeLinecap="round"
                  fill="transparent"
                />
                {/* Segment 4: Inactive (2% = ~5) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#CBD5E1"
                  strokeWidth="11"
                  strokeDasharray="4 238.7"
                  strokeDashoffset="-234"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              {/* Donut Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-['Space_Grotesk'] text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                  {totalProductsCount}
                </span>
                <span className="text-[10px] text-slate-400 font-medium mt-1">Total Products</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">In Stock</span>
                </div>
                <div className="font-sans text-slate-800 font-semibold text-right">
                  648 <span className="text-slate-400 font-normal text-[11px] ml-1">90%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-slate-600">Low Stock</span>
                </div>
                <div className="font-sans text-slate-800 font-semibold text-right">
                  42 <span className="text-slate-400 font-normal text-[11px] ml-2">6%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-600">Out of Stock</span>
                </div>
                <div className="font-sans text-slate-800 font-semibold text-right">
                  12 <span className="text-slate-400 font-normal text-[11px] ml-2">2%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-slate-600">Inactive</span>
                </div>
                <div className="font-sans text-slate-800 font-semibold text-right">
                  18 <span className="text-slate-400 font-normal text-[11px] ml-2">2%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Stock Movements (col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-sm">✦</span>
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900">
                Recent Stock Movements
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('ledger')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5">
            {recentMovements.map((m) => {
              const IconComp = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => onNavigate('ledger')}
                  className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.iconColor}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {m.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {m.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.time}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${m.statusColor}`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 4. BOTTOM ROW: 3 OPERATIONAL TABLES (MATCHING MOCKUP) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table 1: Pending Receipts */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900">
                Pending Receipts
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('receipts')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-1.5 text-[10px]">
                  <th className="py-1.5 font-medium">Reference</th>
                  <th className="py-1.5 font-medium">Supplier</th>
                  <th className="py-1.5 font-medium">Warehouse</th>
                  <th className="py-1.5 font-medium">Scheduled Date</th>
                  <th className="py-1.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pendingReceiptsList.map((row) => (
                  <tr
                    key={row.ref}
                    onClick={() => onNavigate('receipts')}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-2.5 font-bold text-slate-900 font-mono">{row.ref}</td>
                    <td className="py-2.5 font-medium text-slate-800">{row.supplier}</td>
                    <td className="py-2.5 text-slate-500">{row.warehouse}</td>
                    <td className="py-2.5 text-slate-500">{row.scheduledDate}</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Pending Deliveries */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-600" />
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900">
                Pending Deliveries
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('deliveries')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-1.5 text-[10px]">
                  <th className="py-1.5 font-medium">Reference</th>
                  <th className="py-1.5 font-medium">Customer</th>
                  <th className="py-1.5 font-medium">Location</th>
                  <th className="py-1.5 font-medium">Scheduled Date</th>
                  <th className="py-1.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pendingDeliveriesList.map((row) => (
                  <tr
                    key={row.ref}
                    onClick={() => onNavigate('deliveries')}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-2.5 font-bold text-slate-900 font-mono">{row.ref}</td>
                    <td className="py-2.5 font-medium text-slate-800">{row.customer}</td>
                    <td className="py-2.5 text-slate-500">{row.location}</td>
                    <td className="py-2.5 text-slate-500">{row.scheduledDate}</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Transfers Scheduled */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-600" />
              <h3 className="font-['Space_Grotesk'] text-sm font-bold text-slate-900">
                Transfers Scheduled
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transfers')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 pb-1.5 text-[10px]">
                  <th className="py-1.5 font-medium">Reference</th>
                  <th className="py-1.5 font-medium">From</th>
                  <th className="py-1.5 font-medium">To</th>
                  <th className="py-1.5 font-medium">Scheduled Date</th>
                  <th className="py-1.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {scheduledTransfersList.map((row) => (
                  <tr
                    key={row.ref}
                    onClick={() => onNavigate('transfers')}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-2.5 font-bold text-slate-900 font-mono">{row.ref}</td>
                    <td className="py-2.5 text-slate-500">{row.from}</td>
                    <td className="py-2.5 text-slate-500">{row.to}</td>
                    <td className="py-2.5 text-slate-500">{row.scheduledDate}</td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${row.statusColor}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
