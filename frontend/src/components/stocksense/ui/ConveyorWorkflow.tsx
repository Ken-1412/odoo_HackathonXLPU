import React from 'react';
import { Truck, Warehouse, Box, ClipboardCheck, Send, ArrowRight } from 'lucide-react';

const STAGES = [
  { id: 'RECEIVE', label: 'Receive', sub: 'Incoming goods', icon: Truck },
  { id: 'STORE', label: 'Store', sub: 'Warehouse locations', icon: Warehouse },
  { id: 'TRANSFER', label: 'Transfer', sub: 'Internal moves', icon: Box },
  { id: 'PICK', label: 'Pick & Pack', sub: 'Order processing', icon: ClipboardCheck },
  { id: 'DELIVER', label: 'Deliver', sub: 'Outgoing goods', icon: Send },
];

interface ConveyorProps {
  onSelectStage?: (stageId: string) => void;
  compact?: boolean;
}

export const ConveyorWorkflow: React.FC<ConveyorProps> = ({ onSelectStage }) => {
  return (
    <div className="bg-surface-card border border-border rounded-md shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <h3 className="text-sm font-semibold text-text-primary">Stock Flow Pipeline</h3>
        <span className="text-xs text-text-muted">Operational workflow</span>
      </div>
      <div className="flex items-center p-4 overflow-x-auto" role="list">
        {STAGES.map((s, i) => {
          const Icon = s.icon;
          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                role="listitem"
                onClick={() => onSelectStage?.(s.id)}
                className="stocksense-focus flex flex-col items-center text-center px-4 py-3 rounded-md border border-transparent hover:border-border hover:bg-surface-hover cursor-pointer min-w-[100px] group"
              >
                <div className="w-9 h-9 rounded-md bg-accent-bg border border-accent-border flex items-center justify-center mb-2 group-hover:bg-accent-100">
                  <Icon className="w-4 h-4 text-accent" strokeWidth={2} />
                </div>
                <span className="font-medium text-sm text-text-primary">{s.label}</span>
                <span className="text-[11px] text-text-muted mt-0.5">{s.sub}</span>
              </button>
              {i < STAGES.length - 1 && (
                <ArrowRight className="w-4 h-4 text-text-disabled shrink-0 mx-1" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const WorkflowNode = ConveyorWorkflow;
