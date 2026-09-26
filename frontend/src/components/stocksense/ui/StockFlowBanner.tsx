import React from 'react';
import { Truck, Warehouse, Box, ClipboardCheck, ArrowRight, Send } from 'lucide-react';

interface StockFlowBannerProps {
  activeStep?: string;
  onSelectStep?: (step: 'receipts' | 'warehouses' | 'transfers' | 'deliveries') => void;
  className?: string;
}

export const StockFlowBanner: React.FC<StockFlowBannerProps> = ({
  activeStep,
  onSelectStep,
  className = '',
}) => {
  const steps = [
    {
      id: 'receipts',
      name: 'RECEIVE',
      subtext: 'INCOMING GOODS',
      icon: Truck,
      targetTab: 'receipts' as const,
    },
    {
      id: 'warehouses',
      name: 'STORE',
      subtext: 'MULTI-LOCATION',
      icon: Warehouse,
      targetTab: 'warehouses' as const,
    },
    {
      id: 'transfers',
      name: 'TRANSFER',
      subtext: 'INTERNAL MOVE',
      icon: Box,
      targetTab: 'transfers' as const,
    },
    {
      id: 'pick',
      name: 'PICK',
      subtext: 'ORDER PROCESSING',
      icon: ClipboardCheck,
      targetTab: 'deliveries' as const,
    },
    {
      id: 'deliveries',
      name: 'DELIVER',
      subtext: 'OUTGOING GOODS',
      icon: Send,
      targetTab: 'deliveries' as const,
    },
  ];

  return (
    <div className={`w-full overflow-x-auto pb-2 scrollbar-none ${className}`}>
      <div className="flex items-center gap-2 min-w-[620px] lg:min-w-0 justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id || (step.id === 'pick' && activeStep === 'deliveries');

          return (
            <React.Fragment key={step.id}>
              {/* Step Card */}
              <button
                type="button"
                onClick={() => onSelectStep?.(step.targetTab)}
                className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group text-center cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/70 text-blue-900 border-blue-300 shadow-2xs ring-1 ring-blue-500/20'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className={`w-full flex justify-between items-center text-[9px] font-mono mb-1 px-1 ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  <span className="font-bold">0{idx + 1}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`} />
                </div>

                <div className={`my-1 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-800'
                }`}>
                  <Icon className="w-4.5 h-4.5 stroke-[1.75]" />
                </div>

                <span className={`font-sans font-bold text-xs tracking-wider uppercase mt-0.5 ${
                  isActive ? 'text-blue-900' : 'text-slate-800'
                }`}>
                  {step.name}
                </span>

                <span className={`font-mono text-[8.5px] uppercase tracking-wider mt-0.5 ${
                  isActive ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  {step.subtext}
                </span>
              </button>

              {/* Connecting Neutral Arrow */}
              {idx < steps.length - 1 && (
                <div className="flex items-center px-0.5 text-slate-300 shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
