import React from 'react';
import { Users } from 'lucide-react';
import { ArchivePanel } from '../ui/ArchivePanel';
import { TechnicalBadge } from '../ui/TechnicalBadge';
import { useStockSense } from '../../../lib/useStockSense';

const TEAM = [
  { name: 'Marcus Vance', role: 'Administrator', scope: 'WH-01 // WH-02 // WH-03', status: 'ACTIVE', ops: 128 },
  { name: 'Elena Rostova', role: 'Asset Manager', scope: 'WH-02 // Production', status: 'ACTIVE', ops: 86 },
  { name: 'Aiden Chen', role: 'Auditor', scope: 'WH-01 // WH-03', status: 'ACTIVE', ops: 54 },
  { name: 'Priya Nair', role: 'Department Head', scope: 'WH-01 // Receiving', status: 'ACTIVE', ops: 41 },
  { name: 'Tunde Bakare', role: 'Employee', scope: 'WH-02 // Packing', status: 'ACTIVE', ops: 22 },
];

export const StockSensePeople: React.FC = () => {
  const { ledger } = useStockSense();
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
          <Users className="w-4 h-4" /><span>SYSTEM // OPERATORS & CUSTODY</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-1">People & Operational Custody</h2>
        <p className="text-xs text-slate-500 mt-0.5">Every movement is signed. Operators, roles, and recent ledger signatures.</p>
      </div>

      <ArchivePanel title={`OPERATOR ROSTER (${TEAM.length})`} archiveId="HR::OPS">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-100 font-mono text-[10px] uppercase text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Scope</th>
                <th className="py-2.5 px-3 text-right">Signed Ops</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TEAM.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-slate-900 font-semibold">{p.name}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{p.role}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-blue-600 font-medium">{p.scope}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{p.ops}</td>
                  <td className="py-2.5 px-3 text-right"><TechnicalBadge status={p.status} dotOnly /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ArchivePanel>

      <ArchivePanel title="LATEST OPERATOR SIGNATURES" subtitle="LEDGER PROVENANCE" archiveId="HR::SIG">
        <div className="space-y-2 font-mono text-[11px]">
          {ledger.slice(0, 6).map((l) => (
            <div key={l.id} className="flex flex-wrap justify-between gap-2 border border-slate-200 bg-slate-50/50 rounded-lg px-3.5 py-2 text-slate-600">
              <span><span className="text-blue-600 font-bold">{l.eventId}</span> • {l.productName}</span>
              <span>SIGNED: <span className="text-slate-900 font-semibold">{l.user}</span> • {l.timestamp}</span>
            </div>
          ))}
        </div>
      </ArchivePanel>
    </div>
  );
};
