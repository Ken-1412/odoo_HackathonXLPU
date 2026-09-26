import React, { useState } from 'react';
import { StockSenseSidebar } from './StockSenseSidebar';
import type { StockSenseTab } from './StockSenseSidebar';
import { StockSenseHeader } from './StockSenseHeader';
import { StockSenseCommandPalette } from './StockSenseCommandPalette';

interface StockSenseLayoutProps {
  activeTab: StockSenseTab;
  onTabChange: (tab: StockSenseTab) => void;
  onLogout: () => void;
  username?: string | null;
  userRole?: string | null;
  children: React.ReactNode;
  onOpenQuickAction: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product') => void;
  selectedWarehouse: string;
  onSelectWarehouse: (whId: string) => void;
}

export const StockSenseLayout: React.FC<StockSenseLayoutProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  username,
  userRole,
  children,
  onOpenQuickAction,
  selectedWarehouse,
  onSelectWarehouse,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);


  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] font-sans relative overflow-x-hidden">
      {/* ─── Panoramic Ethereal Azure Warehouse Environmental Banner (Matching Target Mockup) ─── */}
      <div 
        className="pointer-events-none fixed inset-x-0 top-0 h-[480px] lg:h-[500px] select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="relative w-full h-full">
          <img
            src="/stocksense-dashboard-theme.jpg"
            alt="StockSense Azure Warehouse Theme"
            className="w-full h-full object-cover object-[center_28%] opacity-80 filter saturate-[1.10] contrast-[1.02]"
          />
          {/* Seamless multi-stage gradient: dissolves naturally into clean light canvas (#F8FAFC) */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-[#F8FAFC]" />
        </div>
      </div>

      {/* Sidebar - Clean White matching mockup */}
      <StockSenseSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        username={username}
        userRole={userRole}
      />

      {/* Main Content Area */}
      <div className="flex flex-col min-h-screen relative z-10 transition-all duration-300 ease-in-out lg:pl-[240px]">
        {/* Top Header */}
        <StockSenseHeader
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenQuickAction={onOpenQuickAction}
          onOpenSearch={() => setCommandPaletteOpen(true)}
          selectedWarehouse={selectedWarehouse}
          onSelectWarehouse={onSelectWarehouse}
          onOpenNotifications={() => onTabChange('ledger')}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-7 pb-16 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <StockSenseCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tab) => onTabChange(tab)}
      />
    </div>
  );
};

