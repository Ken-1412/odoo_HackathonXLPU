import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Truck,
  ArrowRightLeft,
  Scale,
  Building2,
  FileCheck,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Eye,
  Search,
  PackageCheck,
  Play,
  LogIn
} from 'lucide-react';
import { StockSenseLogo } from '../ui/StockSenseLogo';

interface StockSenseLandingProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onEnterDemo: () => void;
}

export const StockSenseLanding: React.FC<StockSenseLandingProps> = ({
  onOpenLogin,
  onOpenRegister,
  onEnterDemo,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Live Demo Filter States
  const [demoTypeFilter, setDemoTypeFilter] = useState<string>('ALL');
  const [demoStatusFilter, setDemoStatusFilter] = useState<string>('ALL');
  const [demoSearch, setDemoSearch] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Live movements demo dataset
  const demoMovements = [
    { id: 'RCP-042', type: 'Receipt', product: 'Steel Rod 20mm', warehouse: 'WH-01 (Main Depot)', qty: '+100 KG', status: 'DONE', time: '10:42 AM', category: 'Raw Materials' },
    { id: 'TRF-018', type: 'Transfer', product: 'Steel Rod 20mm', warehouse: 'WH-01 → PROD-RACK', qty: '100 KG', status: 'DONE', time: '11:15 AM', category: 'Raw Materials' },
    { id: 'DLV-091', type: 'Delivery', product: 'Ergonomic Office Chairs', warehouse: 'WH-02 (Fulfillment)', qty: '-20 PCS', status: 'PENDING', time: '11:30 AM', category: 'Finished Goods' },
    { id: 'ADJ-007', type: 'Adjustment', product: 'Aluminum Sheets 4x8', warehouse: 'WH-01 (Main Depot)', qty: '-3 KG', status: 'DONE', time: '11:58 AM', category: 'Raw Materials' },
    { id: 'RCP-043', type: 'Receipt', product: 'Industrial Bearings SKF', warehouse: 'WH-01 (Main Depot)', qty: '+250 PCS', status: 'DONE', time: '12:05 PM', category: 'Components' },
    { id: 'DLV-092', type: 'Delivery', product: 'Heavy Pallet Jack 2.5T', warehouse: 'WH-03 (West Transit)', qty: '-2 PCS', status: 'DONE', time: '12:20 PM', category: 'Equipment' },
  ];

  const filteredMovements = demoMovements.filter((m) => {
    const matchesType = demoTypeFilter === 'ALL' || m.type.toUpperCase() === demoTypeFilter;
    const matchesStatus = demoStatusFilter === 'ALL' || m.status === demoStatusFilter;
    const matchesSearch =
      demoSearch === '' ||
      m.id.toLowerCase().includes(demoSearch.toLowerCase()) ||
      m.product.toLowerCase().includes(demoSearch.toLowerCase()) ||
      m.warehouse.toLowerCase().includes(demoSearch.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const faqs = [
    {
      q: 'Who is StockSense designed for?',
      a: 'StockSense is built for warehouse directors, operations managers, supply chain controllers, and growing businesses that have outgrown error-prone spreadsheets. It unifies physical movements with an unalterable accounting ledger.',
    },
    {
      q: 'Do I need multiple warehouses to use StockSense?',
      a: 'No. StockSense excels in single-location facilities, stockrooms, and production racks just as easily as multi-facility global hubs with dedicated transit locations, aisle coordinates, and inter-company transfers.',
    },
    {
      q: 'Is there secure authentication and password reset?',
      a: 'Yes. StockSense features cryptographically secure token-based sessions, automated email password reset flows, granular role-based authorization (Admin, Operator, Auditor), and complete operator audit stamps.',
    },
    {
      q: 'What happens when stock reaches the minimum threshold?',
      a: 'Automated reorder triggers detect depletion in real-time, displaying high-visibility alerts on your command center and auto-calculating optimal replenishment quantities based on safety levels and lead times.',
    },
    {
      q: 'Can I track every individual stock movement?',
      a: 'Yes. Every incoming receipt, internal movement, customer dispatch, and physical count adjustment generates an immutable ledger voucher with timestamp, operator ID, and location coordinate.',
    },
    {
      q: 'How does StockSense handle damaged or adjusted inventory?',
      a: 'Stock adjustments require mandatory reason codes (damage, scrap, discrepancy, cycle count) and notes. The variance adjusts on-hand balances immediately while preserving complete historical proof.',
    },
  ];

  return (
    <div className="stocksense-landing-root min-h-screen text-[#1F2421] bg-[#F8FAFC] flex flex-col relative selection:bg-[#2563EB] selection:text-white">
      {/* ========================================================================= */}
      {/* GLOBAL SURREAL AZURE WAREHOUSE BACKDROP */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#F8FAFC]">
        <div className="relative w-full h-full">
          <img
            src="/stocksense-dashboard-theme.jpg"
            alt="StockSense Azure Warehouse Theme"
            className="w-full h-full object-cover object-top opacity-30 sm:opacity-35 filter saturate-[1.15] contrast-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/65 to-[#F8FAFC]" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40" />
          <div className="absolute inset-0 landing-blueprint-grid opacity-10" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. STICKY NAVIGATION */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs py-3'
            : 'bg-white/70 backdrop-blur-sm border-b border-slate-200/60 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="#hero" className="flex items-center gap-2.5">
              <StockSenseLogo size="md" />
            </a>

            {/* Technical Status Indicator */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-[11px] font-mono text-slate-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="tracking-wider text-emerald-700 font-medium">● SYSTEM ONLINE</span>
            </div>
          </div>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs tracking-wider text-slate-600">
            <button
              onClick={() => scrollToSection('problem')}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              PRODUCT
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              FEATURES
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              HOW IT WORKS
            </button>
            <button
              onClick={() => scrollToSection('demo')}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              DEMO
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-[#2563EB] transition-colors cursor-pointer"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-mono text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Book a Demo</span>
            </button>

            <button
              onClick={onEnterDemo}
              className="flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 rounded bg-[#2563EB] hover:bg-[#b55b1c] text-white font-mono text-xs font-semibold tracking-wide shadow-sm transition cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. DRAMATIC HERO SECTION (WHITE THEME WITH WATERCOLOR ATMOSPHERE) */}
      {/* ========================================================================= */}
      <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden pt-8 pb-20 border-b border-slate-200/80">
        {/* Delicate Blueprint Overlay and Coordinates */}
        <div className="absolute top-6 left-8 text-[10px] font-mono text-slate-400 hidden xl:block z-10 space-y-1">
          <div>COORDINATES: 41.8781° N, 87.6298° W</div>
          <div>FACILITY: MAIN LOGISTICS HUB // WH-01</div>
          <div>CONVEYOR: AUTOMATED SORTATION LINE A</div>
        </div>
        <div className="absolute top-6 right-8 text-[10px] font-mono text-slate-400 hidden xl:block z-10 text-right space-y-1">
          <div>GRID: SEC-04 // SPATIAL ARCHIVE</div>
          <div>STATUS: 100% AUDIT RECONCILED</div>
          <div className="text-[#2563EB] font-semibold">BURNT AMBER CONTINUITY</div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12">
          {/* Hero Copy */}
          <div className="max-w-3xl space-y-6 pt-4">
            {/* Trust/Status Line */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#2563EB] font-mono text-[11px] font-semibold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-ping" />
              <span>REAL-TIME INVENTORY • CENTRALIZED CONTROL • ZERO GUESSWORK</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-['Space_Grotesk'] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111827] leading-[1.08]">
              Replace registers and spreadsheets with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-amber-600 to-[#2563EB]">
                real-time inventory control.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-2xl">
              StockSense centralizes every receipt, transfer, adjustment and delivery into one operational view — giving inventory teams complete control over stock, movement and availability.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onOpenRegister}
                className="px-7 py-3.5 rounded bg-[#2563EB] hover:bg-[#b55b1c] text-white font-mono text-xs font-bold uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center gap-2.5 hover:shadow-md hover:scale-[1.02]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => scrollToSection('demo')}
                className="px-6 py-3.5 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 font-mono text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <span>See it in action</span>
                <span className="text-[#2563EB]">→</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* HERO PRODUCT VISUAL: Sophisticated Floating Operations Dashboard Mockup */}
          {/* ========================================================================= */}
          <div className="relative pt-2">
            {/* Ambient Warm Golden Rim Glow */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#2563EB]/15 via-amber-200/20 to-[#2563EB]/10 blur-xl opacity-75" />

            <div className="relative rounded-xl border border-slate-200/90 bg-white/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Window Chrome Bar */}
              <div className="border-b border-slate-200 px-4 py-3 bg-[#F8FAFC]/90 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 font-mono text-xs text-slate-600 font-medium">
                    STOCKSENSE // COMMAND COCKPIT // WAREHOUSE WH-01
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-slate-500">
                  <span className="text-[#2563EB] font-semibold">FEED: 30 FPS</span>
                  <span>SYNC: REAL-TIME</span>
                </div>
              </div>

              {/* Dashboard Content Container */}
              <div className="p-4 sm:p-6 space-y-6">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Metric 1 */}
                  <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
                    <div className="text-[11px] font-mono text-slate-500 tracking-wider uppercase font-medium">
                      TOTAL PRODUCTS
                    </div>
                    <div className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      12,482
                    </div>
                    <div className="text-[10px] font-mono text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                      <span>↑ 14 added this week</span>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="p-4 rounded-lg bg-white border border-[#2563EB]/50 shadow-xs relative overflow-hidden group hover:border-[#2563EB] transition">
                    <div className="text-[11px] font-mono text-[#2563EB] tracking-wider uppercase flex items-center justify-between font-semibold">
                      <span>LOW STOCK</span>
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-ping" />
                    </div>
                    <div className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-[#2563EB] mt-1">
                      37
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Requires replenishment
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
                    <div className="text-[11px] font-mono text-slate-500 tracking-wider uppercase font-medium">
                      PENDING RECEIPTS
                    </div>
                    <div className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      14
                    </div>
                    <div className="text-[10px] font-mono text-sky-600 mt-1 font-medium">
                      Dock bays 1 & 3 active
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-xs relative overflow-hidden group hover:border-slate-300 transition">
                    <div className="text-[11px] font-mono text-slate-500 tracking-wider uppercase font-medium">
                      PENDING DELIVERIES
                    </div>
                    <div className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      09
                    </div>
                    <div className="text-[10px] font-mono text-amber-600 mt-1 font-medium">
                      Scheduled for outbound
                    </div>
                  </div>
                </div>

                {/* Split Row: Recent Movements Table + Integrated Watercolor Image Telemetry Viewport */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Movements Table */}
                  <div className="lg:col-span-8 rounded-lg bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-4 h-4 text-[#2563EB]" />
                        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-800">
                          Recent Movements
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        AUDITED TELEMETRY STREAM
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100 pb-2">
                            <th className="py-2">DOCUMENT</th>
                            <th className="py-2">TYPE</th>
                            <th className="py-2">PRODUCT</th>
                            <th className="py-2">QUANTITY</th>
                            <th className="py-2 text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          <tr className="hover:bg-slate-50 transition">
                            <td className="py-2.5 font-bold text-[#2563EB]">RCP-042</td>
                            <td className="py-2.5 text-slate-500">Receipt</td>
                            <td className="py-2.5 text-slate-900 font-sans font-medium">Steel Rod</td>
                            <td className="py-2.5 text-emerald-700 font-semibold">+100 KG</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                DONE
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition">
                            <td className="py-2.5 font-bold text-[#2563EB]">TRF-018</td>
                            <td className="py-2.5 text-slate-500">Transfer</td>
                            <td className="py-2.5 text-slate-900 font-sans font-medium">Steel Rod</td>
                            <td className="py-2.5 text-sky-700 font-semibold">100 KG</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                DONE
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition">
                            <td className="py-2.5 font-bold text-[#2563EB]">DLV-091</td>
                            <td className="py-2.5 text-slate-500">Delivery</td>
                            <td className="py-2.5 text-slate-900 font-sans font-medium">Chairs</td>
                            <td className="py-2.5 text-amber-700 font-semibold">-20 PCS</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                                PENDING
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition">
                            <td className="py-2.5 font-bold text-[#2563EB]">ADJ-007</td>
                            <td className="py-2.5 text-slate-500">Adjustment</td>
                            <td className="py-2.5 text-slate-900 font-sans font-medium">Aluminum</td>
                            <td className="py-2.5 text-rose-700 font-semibold">-3 KG</td>
                            <td className="py-2.5 text-right">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                                DONE
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Architectural Image Crop with Blueprint Frame & Scanner lines */}
                  <div className="lg:col-span-4 rounded-lg bg-white border border-slate-200 p-3 flex flex-col justify-between relative overflow-hidden group shadow-xs">
                    <div className="text-[11px] font-mono text-slate-600 flex items-center justify-between pb-2">
                      <span className="flex items-center gap-1.5 text-[#2563EB] font-semibold">
                        <Eye className="w-3.5 h-3.5" />
                        <span>DOCK-04 TELEMETRY</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-mono font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        LIVE FEED
                      </span>
                    </div>

                    {/* Masked Crop of Provided Watercolor Warehouse Image */}
                    <div className="relative h-40 sm:h-48 rounded overflow-hidden border border-slate-200">
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center"><div className="text-center font-mono text-[10px] text-blue-400"><div className="text-emerald-400 font-bold mb-1">SYSTEM CAMERA FEED ACTIVE</div>RACK A-01-04 • OPTICAL SCANNER 200 FPS</div></div>
                      {/* Blueprint Grid & Delicate Scan Lines inside Image */}
                      <div className="absolute inset-0 landing-blueprint-grid-dense opacity-40" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent opacity-80" />

                      {/* Crosshairs & Coordinate Tags */}
                      <div className="absolute top-2 left-2 font-mono text-[9px] text-[#2563EB] bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded border border-[#2563EB]/40 font-semibold shadow-xs">
                        CONVEYOR-01 // RACK-B
                      </div>
                      <div className="absolute bottom-2 right-2 font-mono text-[9px] text-slate-700 bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded border border-slate-300 shadow-xs">
                        LATENCY: 8ms
                      </div>

                      {/* Moving laser scan line */}
                      <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2563EB] to-transparent animate-laser-scan pointer-events-none" />
                    </div>

                    <div className="pt-2 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>ZONE: RECEIVING DOCK A</span>
                      <span className="text-slate-700 font-medium">AUTO-LOGGED TO LEDGER</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PROBLEM / ABOUT SECTION (WHITE THEME CONVEYOR FLOW) */}
      {/* ========================================================================= */}
      <section id="problem" className="relative py-24 border-b border-slate-200/80 bg-white/70">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="font-mono text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
              01 // THE VISIBILITY BOTTLENECK
            </div>
            <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827] leading-tight">
              Inventory shouldn't live in five different places.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Manual registers, disconnected Excel sheets, delayed updates and scattered warehouse records make it difficult to know what is actually available, where it is located and what is moving.
            </p>
          </div>

          {/* Illustrated Operational Conveyor / Stock Movement Visualization */}
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 sm:p-10 space-y-8 backdrop-blur-md shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-slate-500 font-medium">
                  PHYSICAL TO DIGITAL LOGISTICS PIPELINE
                </span>
                <div className="font-['Space_Grotesk'] text-lg font-semibold text-slate-900 mt-0.5">
                  Continuous Stock State Machine
                </div>
              </div>
              <div className="inline-flex items-center gap-2 font-mono text-xs text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/30 px-3 py-1 rounded font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
                <span>TRACEABILITY: 100% UNBROKEN</span>
              </div>
            </div>

            {/* Conveyor Belt Track Flow */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {/* Step 1: RECEIVE */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200 hover:border-[#2563EB]/60 transition space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#2563EB] font-bold">01 // RECEIVE</span>
                  <Truck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                  Dock Acceptance
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Accept incoming vendor shipments and verify PO manifests against physical count.
                </p>
                <div className="pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-500 space-y-0.5">
                  <div className="text-emerald-700 font-semibold">RCP-042</div>
                  <div>WH-01 // BAY-02</div>
                  <div className="text-slate-900 font-medium">+100 KG STEEL</div>
                </div>
              </div>

              {/* Step 2: STORE */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200 hover:border-[#2563EB]/60 transition space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#2563EB] font-bold">02 // STORE</span>
                  <Boxes className="w-4 h-4 text-sky-600" />
                </div>
                <div className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                  Rack Placement
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Assigned into designated spatial bin coordinates and cataloged in the live product index.
                </p>
                <div className="pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-500 space-y-0.5">
                  <div className="text-sky-700 font-semibold">BIN-A04-R2</div>
                  <div>AISLE 4 // LEVEL 2</div>
                  <div className="text-slate-900 font-medium">ON-HAND: 1,420 UNITS</div>
                </div>
              </div>

              {/* Step 3: TRANSFER */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200 hover:border-[#2563EB]/60 transition space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#2563EB] font-bold">03 // TRANSFER</span>
                  <ArrowRightLeft className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                  Internal Transfer
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Shift units across warehouses, production racks, or staging zones without losing audit links.
                </p>
                <div className="pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-500 space-y-0.5">
                  <div className="text-[#2563EB] font-semibold">TRF-018</div>
                  <div>PRODUCTION-RACK</div>
                  <div className="text-slate-900 font-medium">100 KG ROUTED</div>
                </div>
              </div>

              {/* Step 4: DELIVER */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-slate-200 hover:border-[#2563EB]/60 transition space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#2563EB] font-bold">04 // DELIVER</span>
                  <PackageCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                  Customer Outbound
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Pick-pack validation with stock availability checks to prevent negative discrepancies.
                </p>
                <div className="pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-500 space-y-0.5">
                  <div className="text-amber-700 font-semibold">DLV-091</div>
                  <div>OUTBOUND BAY 04</div>
                  <div className="text-slate-900 font-medium">-20 PCS FULFILLED</div>
                </div>
              </div>

              {/* Step 5: LEDGER */}
              <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#2563EB]/50 hover:border-[#2563EB] transition space-y-3 relative group shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#2563EB] font-bold">05 // LEDGER</span>
                  <FileCheck className="w-4 h-4 text-[#2563EB]" />
                </div>
                <div className="font-['Space_Grotesk'] text-base font-bold text-slate-900">
                  Immutable Audit
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  Every delta is permanently recorded with timestamp, operator ID, and balance proof.
                </p>
                <div className="pt-2 border-t border-slate-200 font-mono text-[10px] text-slate-500 space-y-0.5">
                  <div className="text-[#2563EB] font-semibold">LED-2026-X8</div>
                  <div>HASH: #7F2B-9A</div>
                  <div className="text-emerald-700 font-semibold">100% RECONCILED</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CORE FEATURES (6-CARD FEATURE GRID IN WHITE THEME) */}
      {/* ========================================================================= */}
      <section id="features" className="relative py-24 border-b border-slate-200/80 bg-[#F8FAFC]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
                02 // ENTERPRISE CAPABILITIES
              </div>
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827] leading-tight">
                Industrial precision for every inventory event.
              </h2>
            </div>
            <p className="font-mono text-xs text-slate-500 max-w-xs leading-relaxed">
              Standardized modular workflows built to eliminate human error and provide end-to-end accountability.
            </p>
          </div>

          {/* 6-Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-7 rounded-xl bg-white border border-slate-200 hover:border-[#2563EB]/60 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#2563EB] font-bold">01 / PRODUCT</span>
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900 mt-5">
                PRODUCT MANAGEMENT
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Centralize products, categories, units and stock information.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>SKU MASTER // UOM</span>
                <span className="text-slate-700 font-medium">SAFETY THRESHOLDS</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-7 rounded-xl bg-white border border-slate-200 hover:border-[#2563EB]/60 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-700 font-bold">02 / RECEIPTS</span>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900 mt-5">
                RECEIPTS
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Record incoming goods and update inventory instantly.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>DOCK CHECK-IN</span>
                <span className="text-slate-700 font-medium">INSTANT ON-HAND UPDATE</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-7 rounded-xl bg-white border border-slate-200 hover:border-[#2563EB]/60 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-amber-700 font-bold">03 / DELIVERIES</span>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
                  <PackageCheck className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900 mt-5">
                DELIVERY ORDERS
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Track outgoing inventory from request to completion.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>PICK-PACK-VERIFY</span>
                <span className="text-slate-700 font-medium">GUARDED STOCKOUT PROOF</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="p-7 rounded-xl bg-white border border-slate-200 hover:border-[#2563EB]/60 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-sky-700 font-bold">04 / TRANSFERS</span>
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700 group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900 mt-5">
                INTERNAL TRANSFERS
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Move stock between warehouses, locations and racks with full traceability.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>RACK-TO-RACK</span>
                <span className="text-slate-700 font-medium">TOTAL CONSERVATION</span>
              </div>
            </div>

            {/* Card 5 */}
            <div className="p-7 rounded-xl bg-white border border-slate-200 hover:border-[#2563EB]/60 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-rose-700 font-bold">05 / AUDIT</span>
                <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-700 group-hover:scale-110 transition-transform">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900 mt-5">
                STOCK ADJUSTMENTS
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Record damaged, missing or corrected quantities without losing the audit trail.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>DAMAGE & CYCLE COUNT</span>
                <span className="text-slate-700 font-medium">REASON CODE ENFORCEMENT</span>
              </div>
            </div>

            {/* Card 6 */}
            <div className="p-7 rounded-xl bg-white border border-slate-200 hover:border-[#2563EB]/60 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#2563EB] font-bold">06 / MULTI-SITE</span>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900 mt-5">
                MULTI-WAREHOUSE
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Manage inventory across multiple warehouses and locations from one system.
              </p>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>FACILITY HIERARCHY</span>
                <span className="text-slate-700 font-medium">UNIFIED REAL-TIME VISIBILITY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HOW IT WORKS (VERTICAL TIMELINE) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="relative py-24 border-b border-slate-200/80 bg-white/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
              03 // TRACEABILITY TIMELINE
            </div>
            <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827]">
              Every movement leaves a trace.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              From physical arrival at loading dock to final cryptographic ledger stamp, every inventory mutation is captured with verifiable precision.
            </p>
          </div>

          {/* Vertical Timeline */}
          <div className="relative border-l-2 border-slate-300 pl-6 sm:pl-10 ml-4 sm:ml-8 space-y-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1 w-5 h-5 rounded-full bg-white border-2 border-[#2563EB] flex items-center justify-center shadow-xs">
                <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#2563EB] font-bold">01 // RECEIVE</span>
                  <span className="font-mono text-[10px] text-slate-400">STAGE 1</span>
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900">
                  Receive 100 KG Steel
                </h3>
                <div className="p-4 rounded-lg bg-white border border-slate-200 max-w-lg font-mono text-xs space-y-1 text-slate-700 shadow-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">DOCUMENT:</span>
                    <span className="text-[#2563EB] font-bold">RCP-042</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">WAREHOUSE:</span>
                    <span className="text-slate-900 font-semibold">WH-01 (Main Depot)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">STATUS:</span>
                    <span className="text-emerald-700 font-semibold">COMPLETED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1 w-5 h-5 rounded-full bg-white border-2 border-sky-500 flex items-center justify-center shadow-xs">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-sky-700 font-bold">02 // TRANSFER</span>
                  <span className="font-mono text-[10px] text-slate-400">STAGE 2</span>
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900">
                  Move to Production Rack
                </h3>
                <div className="p-4 rounded-lg bg-white border border-slate-200 max-w-lg font-mono text-xs space-y-1 text-slate-700 shadow-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">DOCUMENT:</span>
                    <span className="text-sky-700 font-bold">TRF-018</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">FROM:</span>
                    <span className="text-slate-900">WH-01 DOCK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TO:</span>
                    <span className="text-slate-900 font-semibold">PROD-RACK (Manufacturing Zone)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1 w-5 h-5 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center shadow-xs">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-amber-700 font-bold">03 // DELIVER</span>
                  <span className="font-mono text-[10px] text-slate-400">STAGE 3</span>
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900">
                  Deliver 20 units
                </h3>
                <div className="p-4 rounded-lg bg-white border border-slate-200 max-w-lg font-mono text-xs space-y-1 text-slate-700 shadow-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">DOCUMENT:</span>
                    <span className="text-amber-700 font-bold">DLV-091</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ROUTING:</span>
                    <span className="text-slate-900">OUTBOUND BAY 02</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NET CHANGE:</span>
                    <span className="text-amber-700 font-semibold">-20 PCS</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1 w-5 h-5 rounded-full bg-white border-2 border-rose-500 flex items-center justify-center shadow-xs">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-rose-700 font-bold">04 // ADJUST</span>
                  <span className="font-mono text-[10px] text-slate-400">STAGE 4</span>
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900">
                  Record 3 KG damaged
                </h3>
                <div className="p-4 rounded-lg bg-white border border-slate-200 max-w-lg font-mono text-xs space-y-1 text-slate-700 shadow-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">DOCUMENT:</span>
                    <span className="text-rose-700 font-bold">ADJ-007</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">REASON:</span>
                    <span className="text-slate-900">DAMAGE (Forklift dent)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DELTA:</span>
                    <span className="text-rose-700 font-semibold">-3 KG</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative group">
              <div className="absolute -left-[31px] sm:-left-[47px] top-1 w-5 h-5 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center shadow-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-emerald-700 font-bold">05 // LEDGER</span>
                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-semibold">FINAL CULMINATION</span>
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold text-slate-900">
                  Everything is automatically logged.
                </h3>
                <div className="p-5 rounded-xl bg-white border border-[#2563EB]/40 max-w-lg font-mono text-xs space-y-2 text-slate-700 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] pb-2 border-b border-slate-100">
                    <span className="text-[#2563EB] font-bold">CENTRAL AUDIT LEDGER ARCHIVE</span>
                    <span className="text-emerald-700 font-semibold">VERIFIED IMMUTABLE</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                    All document mutations generate a cryptographic balance state. Zero orphan numbers, zero missing discrepancies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. LIVE PRODUCT DEMO (INTERACTIVE BROWSER WINDOW MOCKUP) */}
      {/* ========================================================================= */}
      <section id="demo" className="relative py-24 border-b border-slate-200/80 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="font-mono text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
                04 // INTERACTIVE AUDIT EXPLORER
              </div>
              <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827] leading-tight">
                Live operational movement console.
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onEnterDemo}
                className="px-5 py-2.5 rounded bg-[#2563EB] hover:bg-[#b55b1c] text-white font-mono text-xs font-semibold tracking-wider transition cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch Full App</span>
              </button>
            </div>
          </div>

          {/* Browser Window Mockup */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden">
            {/* Browser Top Chrome */}
            <div className="bg-[#F8FAFC] px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="ml-4 px-3 py-1 rounded bg-white border border-slate-200 font-mono text-[11px] text-slate-600 flex items-center gap-2 shadow-2xs">
                  <ShieldCheck className="w-3 h-3 text-[#2563EB]" />
                  <span>stocksense.internal/app/inventory/movements</span>
                </div>
              </div>
              <div className="font-mono text-xs text-slate-500 hidden sm:block">
                LIVE PRODUCTION CLUSTER
              </div>
            </div>

            {/* Dashboard Inner Container */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Header Title & Filter Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-mono text-base font-bold text-slate-900 tracking-wide">
                    INVENTORY / ALL MOVEMENTS
                  </h3>
                  <div className="font-mono text-xs text-slate-500 mt-0.5">
                    Real-time transaction stream across active facilities
                  </div>
                </div>

                {/* Interactive Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200 text-xs font-mono">
                    <span className="text-slate-400 px-2">TYPE:</span>
                    {['ALL', 'RECEIPT', 'TRANSFER', 'DELIVERY', 'ADJUSTMENT'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setDemoTypeFilter(type)}
                        className={`px-2.5 py-1 rounded text-[11px] transition cursor-pointer ${
                          demoTypeFilter === type
                            ? 'bg-[#2563EB] text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200 text-xs font-mono">
                    <span className="text-slate-400 px-2">STATUS:</span>
                    {['ALL', 'DONE', 'PENDING'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setDemoStatusFilter(status)}
                        className={`px-2.5 py-1 rounded text-[11px] transition cursor-pointer ${
                          demoStatusFilter === status
                            ? 'bg-slate-800 text-white font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* KPI Strip & Search Input */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded bg-[#F8FAFC] border border-slate-200 font-mono shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase">DAILY THROUGHPUT</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">4.8 TONS</div>
                </div>
                <div className="p-3 rounded bg-[#F8FAFC] border border-slate-200 font-mono shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase">ACTIVE BAYS</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">8 / 8 OPERATIONAL</div>
                </div>
                <div className="p-3 rounded bg-[#F8FAFC] border border-slate-200 font-mono shadow-2xs">
                  <div className="text-[10px] text-slate-500 uppercase">FULFILLMENT RATE</div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">99.4%</div>
                </div>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={demoSearch}
                    onChange={(e) => setDemoSearch(e.target.value)}
                    placeholder="Search document, SKU, or warehouse..."
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded pl-9 pr-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                        <th className="py-3 px-4">DOCUMENT</th>
                        <th className="py-3 px-4">TYPE</th>
                        <th className="py-3 px-4">PRODUCT</th>
                        <th className="py-3 px-4">WAREHOUSE</th>
                        <th className="py-3 px-4">QUANTITY</th>
                        <th className="py-3 px-4 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredMovements.length > 0 ? (
                        filteredMovements.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-4 font-bold text-[#2563EB]">{row.id}</td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-medium">
                                {row.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-900 font-sans font-medium">
                              {row.product}
                              <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                                {row.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">{row.warehouse}</td>
                            <td className="py-3.5 px-4 font-semibold">
                              <span
                                className={
                                  row.qty.startsWith('+')
                                    ? 'text-emerald-700'
                                    : row.qty.startsWith('-')
                                    ? 'text-amber-700'
                                    : 'text-sky-700'
                                }
                              >
                                {row.qty}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.status === 'DONE'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-mono text-xs">
                            No movements match your selected filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. DIFFERENTIATOR SECTION (WHITE THEME EDITORIAL) */}
      {/* ========================================================================= */}
      <section className="relative py-24 border-b border-slate-200/80 bg-[#F8FAFC] overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="max-w-3xl space-y-4">
            <div className="font-mono text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
              05 // OPERATIONAL METAMORPHOSIS
            </div>
            <h2 className="font-['Space_Grotesk'] text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#111827] leading-tight">
              From stock data <br />
              <span className="text-[#2563EB]">to operational clarity.</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Transform passive records into high-velocity physical control through three unified architectural strata.
            </p>
          </div>

          {/* Three Layers: DATA -> MOVEMENT -> DECISION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Layer 1: DATA */}
            <div className="p-8 rounded-xl bg-white border border-slate-200 space-y-4 relative group hover:border-slate-300 transition shadow-xs">
              <div className="font-mono text-3xl font-black text-slate-300 group-hover:text-slate-400 transition">
                01
              </div>
              <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900 tracking-wide">
                DATA
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed font-medium">
                Every product, quantity and document.
              </p>
              <p className="text-xs text-slate-500 font-mono leading-relaxed pt-2 border-t border-slate-100">
                Centralized product master, multi-location quantities, units of measure, and continuous digital records.
              </p>
            </div>

            {/* Layer 2: MOVEMENT */}
            <div className="p-8 rounded-xl bg-white border border-slate-200 space-y-4 relative group hover:border-[#2563EB]/60 transition shadow-xs">
              <div className="font-mono text-3xl font-black text-[#2563EB]/50 group-hover:text-[#2563EB] transition">
                02
              </div>
              <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900 tracking-wide">
                MOVEMENT
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed font-medium">
                Every receipt, transfer and delivery.
              </p>
              <p className="text-xs text-slate-500 font-mono leading-relaxed pt-2 border-t border-slate-100">
                End-to-end physical tracking as raw materials enter dock bays, shift to racks, and ship to customers.
              </p>
            </div>

            {/* Layer 3: DECISION */}
            <div className="p-8 rounded-xl bg-white border border-[#2563EB]/50 space-y-4 relative group hover:border-[#2563EB] transition shadow-sm">
              <div className="font-mono text-3xl font-black text-[#2563EB]">
                03
              </div>
              <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-slate-900 tracking-wide">
                DECISION
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed font-medium">
                Know what needs attention now.
              </p>
              <p className="text-xs text-slate-500 font-mono leading-relaxed pt-2 border-t border-slate-100">
                Automated low-stock threshold triggers, replenishment orders, and real-time operational alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FAQ SECTION (ACCORDION IN WHITE THEME) */}
      {/* ========================================================================= */}
      <section id="faq" className="relative py-24 border-b border-slate-200/80 bg-white/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-widest text-[#2563EB] font-semibold">
              06 // FREQUENTLY ASKED QUESTIONS
            </div>
            <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#111827]">
              Operational inquiries, answered.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              Everything you need to know about migrating your warehouse operations to StockSense.
            </p>
          </div>

          {/* Accordion List */}
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 shadow-2xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition"
                >
                  <span className="font-['Space_Grotesk'] text-base sm:text-lg font-semibold text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#2563EB] transition-transform duration-200 flex-shrink-0 ${
                      activeFaq === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-600 font-sans leading-relaxed border-t border-slate-100 bg-[#F8FAFC]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. DRAMATIC FINAL CTA (WHITE THEME WITH WATERCOLOR GLOW) */}
      {/* ========================================================================= */}
      <section className="relative py-28 border-b border-slate-200/80 bg-white/80 overflow-hidden">
        {/* Subtle watercolor crop in background */}
        <div className="absolute inset-0 pointer-events-none bg-blue-50/30" />
      </section>

      {/* ========================================================================= */}
      {/* 10. MINIMAL PREMIUM FOOTER (WHITE THEME) */}
      {/* ========================================================================= */}
      <footer className="relative bg-[#F8FAFC] border-t border-slate-200 pt-16 pb-12 text-slate-500 font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Wordmark & Statement */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#2563EB]/40 bg-white flex-shrink-0 shadow-2xs">
                  <img
                    src="/stocksense-logo.jpg"
                    alt="StockSense Wordmark"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-['Space_Grotesk'] text-xl font-bold tracking-tight text-slate-900">
                  Stock<span className="text-[#2563EB]">Sense</span>
                </span>
              </div>
              <p className="text-slate-600 text-xs max-w-sm leading-relaxed font-sans">
                Modular Inventory Management System engineered for physical certainty, multi-warehouse logistics, and unalterable ledger traceability.
              </p>
              <div className="text-[11px] text-slate-400 pt-2 font-serif italic">
                "Built for Inventory Managers & Warehouse Staff."
              </div>
            </div>

            {/* Column 2: PRODUCT */}
            <div className="md:col-span-3 space-y-3">
              <div className="text-slate-900 font-bold tracking-wider uppercase text-[11px]">
                PRODUCT
              </div>
              <ul className="space-y-2 text-slate-500">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-slate-900 transition cursor-pointer">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="hover:text-slate-900 transition cursor-pointer">
                    How it works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('demo')} className="hover:text-slate-900 transition cursor-pointer">
                    Demo
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: COMPANY */}
            <div className="md:col-span-3 space-y-3">
              <div className="text-slate-900 font-bold tracking-wider uppercase text-[11px]">
                COMPANY
              </div>
              <ul className="space-y-2 text-slate-500">
                <li>
                  <button onClick={() => scrollToSection('problem')} className="hover:text-slate-900 transition cursor-pointer">
                    About
                  </button>
                </li>
                <li>
                  <button onClick={onOpenLogin} className="hover:text-slate-900 transition cursor-pointer">
                    Contact
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('faq')} className="hover:text-slate-900 transition cursor-pointer">
                    FAQ
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Telemetry */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>© 2026 StockSense. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>SYSTEM: SECURE // 256-BIT AUDIT</span>
              <span className="text-[#2563EB] font-semibold">● ONLINE</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
