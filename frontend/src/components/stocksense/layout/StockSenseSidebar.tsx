import React from 'react';
import {
  LayoutGrid,
  Boxes,
  Layers,
  Warehouse,
  MapPin,
  Download,
  Truck,
  ArrowRightLeft,
  Sliders,
  History,
  Sparkles,
  User,
  Settings,
  LogOut,
  Box,
  Bell
} from 'lucide-react';

export type StockSenseTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'reorder-rules'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'ledger'
  | 'stock'
  | 'move-history'
  | 'omnidim'
  | 'warehouses'
  | 'locations'
  | 'alerts'
  | 'people'
  | 'reports'
  | 'settings'
  | 'profile';

interface StockSenseSidebarProps {
  activeTab: StockSenseTab;
  onTabChange: (tab: StockSenseTab) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onCloseMobile?: () => void;
  username?: string | null;
  userRole?: string | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StockSenseSidebar: React.FC<StockSenseSidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  isOpen = false,
  onCloseMobile,
}) => {
  // Top primary navigation items matching mockup
  const primaryNav = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutGrid },
    { id: 'products' as const, label: 'Products', icon: Boxes },
    { id: 'stock' as const, label: 'Stock', icon: Layers },
    { id: 'warehouses' as const, label: 'Warehouses', icon: Warehouse },
    { id: 'locations' as const, label: 'Locations', icon: MapPin },
  ];

  // Operations group matching mockup
  const operationsNav = [
    { id: 'receipts' as const, label: 'Receipts', icon: Download },
    { id: 'deliveries' as const, label: 'Delivery Orders', icon: Truck },
    { id: 'transfers' as const, label: 'Internal Transfers', icon: ArrowRightLeft },
    { id: 'adjustments' as const, label: 'Inventory Adjustments', icon: Sliders },
    { id: 'move-history' as const, label: 'Move History', icon: History },
    { id: 'alerts' as const, label: 'Alerts', icon: Bell },
  ];

  // Intelligence group matching mockup
  const intelligenceNav = [
    { id: 'omnidim' as const, label: 'OmniDimension Agent', icon: Sparkles },
  ];

  // Settings group matching mockup
  const settingsNav = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar matching target mockup */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/80 shadow-xs flex flex-col justify-between transition-all duration-300 ease-in-out w-[240px] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto scrollbar-none py-5 px-3.5 space-y-6">
          {/* Logo & Brand matching target mockup */}
          <div className="flex items-center gap-2.5 px-2 pb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <Box className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-['Space_Grotesk'] font-bold text-lg text-slate-900 tracking-tight">
              StockSense
            </span>
          </div>

          {/* Primary Nav Items */}
          <div className="space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTab;

              return (
                <button
                  key={`${item.id}-${item.label}`}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Operations Nav */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 tracking-wide">
              Operations
            </div>
            {operationsNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTab && item.label !== 'Move History';

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Intelligence Nav */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 tracking-wide">
              Intelligence
            </div>
            {intelligenceNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Nav */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 tracking-wide">
              Settings
            </div>
            {settingsNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-[18px] h-[18px] shrink-0 ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Minimal Logout at bottom */}
        <div className="p-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

