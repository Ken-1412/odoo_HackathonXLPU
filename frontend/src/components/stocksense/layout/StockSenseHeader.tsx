import React from 'react';
import {
  Menu,
  Search,
  Bell
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';

interface StockSenseHeaderProps {
  onToggleMobileMenu: () => void;
  onOpenQuickAction: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product') => void;
  onOpenSearch: () => void;
  selectedWarehouse: string;
  onSelectWarehouse: (whId: string) => void;
  onOpenNotifications?: () => void;
}

export const StockSenseHeader: React.FC<StockSenseHeaderProps> = ({
  onToggleMobileMenu,
  onOpenQuickAction: _onOpenQuickAction,
  onOpenSearch,
  selectedWarehouse: _selectedWarehouse,
  onSelectWarehouse: _onSelectWarehouse,
  onOpenNotifications,
}) => {
  const { stats } = useStockSense();
  const pendingTotal = stats.pendingReceiptsCount + stats.pendingDeliveriesCount;

  return (
    <header className="h-16 bg-white/70 backdrop-blur-md border-b border-white/60 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-7">
      {/* Left: Mobile Toggle & Desktop Search Bar */}
      <div className="flex items-center gap-4 flex-1">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Pill - Left-aligned as in target mockup */}
        <div
          onClick={onOpenSearch}
          className="w-full max-w-md hidden sm:flex items-center justify-between px-4 py-2 bg-white/95 border border-slate-200/80 rounded-xl shadow-xs hover:border-slate-300 transition cursor-pointer text-xs text-slate-400"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">Search products, SKU, warehouses, or operations...</span>
          </div>
          <kbd className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80 shrink-0 ml-2">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right: Notification Bell & User Profile (Matching Mockup) */}
      <div className="flex items-center gap-4">
        {/* Notifications Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs cursor-pointer transition"
          title={`${pendingTotal} pending operations`}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* User Profile matching mockup */}
        <div className="flex items-center gap-2.5 pl-1 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center text-xs font-bold shadow-2xs">
            JD
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">
              John Doe
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Inventory Manager
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

