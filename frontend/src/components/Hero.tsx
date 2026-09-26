import { ArrowRight, Laptop, Car, Building2, Wrench } from 'lucide-react';
import DashboardPreview from './DashboardPreview';

export default function Hero() {
  return (
    <section 
      className="relative pt-24 pb-20 bg-[#F8FAFC] overflow-hidden border-b border-slate-200"
    >
      {/* Decorative clean line pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Compliance and Release badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-white border border-surface-200 text-[11px] text-surface-650 mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-900"></span>
          <span>AssetFlow ERP v2.4</span>
          <span className="text-surface-300">|</span>
          <span className="font-semibold text-brand-900">SOC2 Type II Compliant</span>
        </div>

        {/* Headlines */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-surface-900 max-w-4xl mx-auto leading-tight font-sans">
          AssetFlow: Enterprise Asset & Resource Management
        </h1>
        <p className="mt-4 text-base sm:text-lg text-surface-650 max-w-3xl mx-auto leading-relaxed font-medium">
          Eliminate manual tracking. Digitise your asset lifecycle, resource booking, and audit workflows in one centralized platform.
        </p>

        {/* Categories Chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-surface-200 text-xs text-surface-700 font-semibold shadow-sm">
            <Laptop className="w-4 h-4 text-brand-900" />
            <span>IT Hardware</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-surface-200 text-xs text-surface-700 font-semibold shadow-sm">
            <Car className="w-4 h-4 text-brand-900" />
            <span>Fleet Vehicles</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-surface-200 text-xs text-surface-700 font-semibold shadow-sm">
            <Building2 className="w-4 h-4 text-brand-900" />
            <span>Meeting Rooms</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-surface-200 text-xs text-surface-700 font-semibold shadow-sm">
            <Wrench className="w-4 h-4 text-brand-900" />
            <span>Tools & Machinery</span>
          </div>
        </div>

        {/* Action button */}
        <div className="mt-8 flex items-center justify-center">
          <a
            href="#features"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md text-sm font-bold bg-brand-900 hover:bg-brand-800 text-white shadow-sm transition-all"
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>

        {/* Showcase Frame Mockup */}
        <div className="mt-12 max-w-5xl mx-auto relative">
          <div className="relative bg-white border border-surface-200 rounded-md shadow-sm overflow-hidden">
            {/* Odoo style tab header bar */}
            <div className="h-9 bg-surface-100 border-b border-surface-200 flex items-center px-4 space-x-2">
              <div className="w-3 h-3 rounded-full bg-surface-300"></div>
              <div className="w-3 h-3 rounded-full bg-surface-300"></div>
              <div className="w-3 h-3 rounded-full bg-surface-300"></div>
              <span className="text-[10px] text-surface-500 font-mono pl-4">assetflow.internal/dashboard</span>
            </div>
            
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
