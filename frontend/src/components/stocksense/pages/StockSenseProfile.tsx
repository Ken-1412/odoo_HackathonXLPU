import React, { useState } from 'react';
import { User, CheckCircle2 } from 'lucide-react';
import { ArchivePanel } from '../ui/ArchivePanel';
import { StockSenseLogo } from '../ui/StockSenseLogo';

interface StockSenseProfileProps {
  username?: string | null;
  userRole?: string | null;
}

export const StockSenseProfile: React.FC<StockSenseProfileProps> = ({
  username = 'Marcus Vance',
  userRole = 'Administrator',
}) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passUpdated, setPassUpdated] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass !== confirmPass) {
      alert('Passwords do not match or are empty.');
      return;
    }
    setPassUpdated(true);
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    setTimeout(() => setPassUpdated(false), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <User className="w-4 h-4" />
            <span>OPERATOR // CREDENTIALS & CLEARANCE</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Operator Profile
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified identity credentials, digital signatures, and security clearance for ledger validation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Operator Identity Badge */}
        <ArchivePanel
          title="OPERATOR CARD"
          subtitle="AUTHENTICATED PERSONNEL"
          archiveId="OP::V1"
          className="md:col-span-1"
        >
          <div className="text-center py-4 space-y-3">
            <div className="flex justify-center mb-2">
              <StockSenseLogo size="lg" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{username || 'Marcus Vance'}</h3>
              <span className="font-mono text-xs text-blue-600 font-semibold uppercase tracking-wider">{userRole || 'Lead Inventory Manager'}</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left font-mono text-[11px] space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">CLEARANCE:</span>
                <span className="text-emerald-700 font-bold">LEVEL-4 ARCHIVE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">STATION:</span>
                <span className="text-slate-800">WH-01 COMMAND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">LEDGER SIGNATURE:</span>
                <span className="text-blue-600 font-bold">#OP-9942</span>
              </div>
            </div>
          </div>
        </ArchivePanel>

        {/* Right Column: Passcode Update & Details */}
        <div className="md:col-span-2 space-y-6">
          <ArchivePanel
            title="SECURITY PASSCODE UPDATE"
            subtitle="ACCESS MANAGEMENT"
            archiveId="AUTH::CRED"
          >
            {passUpdated && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-mono text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Passcode updated successfully. Verified with security authority.</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10.5px] uppercase text-slate-600 mb-1 font-medium font-sans">
                  CURRENT PASSCODE
                </label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 py-2 px-3 text-slate-900 rounded-lg outline-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] uppercase text-slate-600 mb-1 font-medium font-sans">
                    NEW PASSCODE
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 py-2 px-3 text-slate-900 rounded-lg outline-none font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] uppercase text-slate-600 mb-1 font-medium font-sans">
                    CONFIRM NEW PASSCODE
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 py-2 px-3 text-slate-900 rounded-lg outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer transition-all font-sans"
                >
                  Update Passcode
                </button>
              </div>
            </form>
          </ArchivePanel>
        </div>
      </div>
    </div>
  );
};
