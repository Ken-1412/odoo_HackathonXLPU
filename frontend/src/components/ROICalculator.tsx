import { useState } from 'react';
import { Clock, Coins, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

export default function ROICalculator() {
  const [assetCount, setAssetCount] = useState<number>(350);
  const [manualHours, setManualHours] = useState<number>(12);
  const [laborRate, setLaborRate] = useState<number>(500); // Admin rate in INR/hour

  // Calculations in INR (₹)
  const averageAssetValue = 80000; // Average cost of an enterprise asset in INR (₹80,000)
  const spreadsheetLossRate = 0.035; // 3.5% average asset loss rate on manual spreadsheets
  const assetFlowLossRate = 0.005; // 0.5% loss rate with barcode scanning & strict allocation trails

  // 1. Labor Cost Savings: AssetFlow automates allocation, booking, and auditing by 80%
  const laborHoursSavedPerYear = manualHours * 52 * 0.8;
  const annualLaborSavings = laborHoursSavedPerYear * laborRate;

  // 2. Asset Recovery Savings: Preventing lost assets
  const assetsPreventedFromLoss = Math.round(assetCount * (spreadsheetLossRate - assetFlowLossRate));
  const annualAssetLossSavings = assetsPreventedFromLoss * averageAssetValue;

  // 3. Total Savings
  const totalAnnualSavings = annualLaborSavings + annualAssetLossSavings;

  return (
    <section id="roi-calculator" className="py-20 bg-white border-b border-surface-200 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-brand-50 text-brand-900 border border-brand-100 mb-4 font-mono">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>ROI Analysis & Calculator</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-surface-900 mb-4">
            Calculate Your Spreadsheet Cost
          </h2>
          <p className="text-base text-surface-650 font-medium">
            Manual resource tracking leads to hidden administrative overhead and asset loss. Slide the controls below to discover how much you stand to reclaim.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Sliders Control Panel */}
          <div className="lg:col-span-7 bg-white border border-surface-200 rounded-md p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <h3 className="text-base font-bold text-surface-900 mb-6 flex items-center space-x-2 border-b border-surface-200 pb-3">
              <Sparkles className="w-5 h-5 text-brand-900" />
              <span>Operational Metrics</span>
            </h3>

            <div className="space-y-8">
              {/* Slider 1: Total Assets */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm font-semibold text-surface-700 flex items-center space-x-1">
                    <span>Total Managed Assets</span>
                    <span className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-surface-400 hover:text-surface-600 cursor-pointer" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-surface-900 border border-surface-800 text-[10px] text-surface-200 leading-normal pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xl z-20 font-sans font-normal">
                        Physical assets such as laptops, monitors, tools, lab equipment, and vehicles.
                      </span>
                    </span>
                  </label>
                  <span className="text-xs sm:text-sm font-bold text-surface-800 bg-surface-50 px-2.5 py-1 rounded-sm border border-surface-200 font-mono">
                    {assetCount.toLocaleString()} assets
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="5000"
                  step="50"
                  value={assetCount}
                  onChange={(e) => setAssetCount(Number(e.target.value))}
                  className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-brand-900"
                />
                <div className="flex justify-between text-[10px] text-surface-450 mt-1 font-mono">
                  <span>50</span>
                  <span>2,500</span>
                  <span>5,000+</span>
                </div>
              </div>

              {/* Slider 2: Weekly Admin Hours */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm font-semibold text-surface-700 flex items-center space-x-1">
                    <span>Spreadsheet Admin Time / Wk</span>
                    <span className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-surface-400 hover:text-surface-600 cursor-pointer" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-surface-900 border border-surface-800 text-[10px] text-surface-200 leading-normal pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xl z-20 font-sans font-normal">
                        Hours per week staff spend checking logs, emailing statuses, solving conflicts, or compiling reports.
                      </span>
                    </span>
                  </label>
                  <span className="text-xs sm:text-sm font-bold text-surface-800 bg-surface-50 px-2.5 py-1 rounded-sm border border-surface-200 font-mono">
                    {manualHours} hrs/wk
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="40"
                  step="1"
                  value={manualHours}
                  onChange={(e) => setManualHours(Number(e.target.value))}
                  className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-brand-900"
                />
                <div className="flex justify-between text-[10px] text-surface-450 mt-1 font-mono">
                  <span>2 hrs</span>
                  <span>20 hrs</span>
                  <span>40 hrs</span>
                </div>
              </div>

              {/* Slider 3: Labor Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs sm:text-sm font-semibold text-surface-700 flex items-center space-x-1">
                    <span>Average Staff Hourly Rate</span>
                    <span className="group relative">
                      <HelpCircle className="w-3.5 h-3.5 text-surface-400 hover:text-surface-600 cursor-pointer" />
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 rounded bg-surface-900 border border-surface-800 text-[10px] text-surface-200 leading-normal pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-xl z-20 font-sans font-normal">
                        Average hourly loaded cost of employees carrying out asset booking and admin duties.
                      </span>
                    </span>
                  </label>
                  <span className="text-xs sm:text-sm font-bold text-surface-800 bg-surface-50 px-2.5 py-1 rounded-sm border border-surface-200 font-mono">
                    ₹{laborRate}/hr
                  </span>
                </div>
                <input
                  type="range"
                  min="250"
                  max="2500"
                  step="50"
                  value={laborRate}
                  onChange={(e) => setLaborRate(Number(e.target.value))}
                  className="w-full h-2 bg-surface-100 rounded-lg appearance-none cursor-pointer accent-brand-900"
                />
                <div className="flex justify-between text-[10px] text-surface-450 mt-1 font-mono">
                  <span>₹250/hr</span>
                  <span>₹1,375/hr</span>
                  <span>₹2,500/hr</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-surface-200 text-xs text-surface-500 leading-normal">
              Note: Calculations assume an average asset cost of ₹{averageAssetValue.toLocaleString('en-IN')} and a baseline manual spreadsheet loss rate of {spreadsheetLossRate * 100}%, reduced to {assetFlowLossRate * 100}% by implementing QR scanning, assignment logs, and strict sign-offs.
            </div>
          </div>

          {/* Savings Display Card */}
          <div className="lg:col-span-5 bg-brand-900 text-white rounded-md p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden border border-brand-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300 font-mono">
                Estimated Annual Savings
              </span>
              <div className="mt-2 flex items-baseline">
                <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">₹</span>
                <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white font-mono">
                  {Math.round(totalAnnualSavings).toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-brand-200 mt-1 flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-brand-300 mr-1 animate-pulse" />
                Guaranteed workflow consolidation
              </p>
            </div>

            <div className="my-8 space-y-6">
              {/* Metric 1: Hours Reclaimed */}
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-brand-200" />
                </div>
                <div>
                  <div className="text-xs text-brand-200 font-mono">Admin Hours Reclaimed</div>
                  <div className="text-lg font-bold text-white font-mono">{Math.round(laborHoursSavedPerYear)} hrs/year</div>
                </div>
              </div>

              {/* Metric 2: Lost Assets Saved */}
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-md bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Coins className="w-5 h-5 text-brand-200" />
                </div>
                <div>
                  <div className="text-xs text-brand-200 font-mono">Physical Assets Saved from Loss</div>
                  <div className="text-lg font-bold text-white font-mono">{assetsPreventedFromLoss} units/year</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-brand-800 flex flex-col space-y-3.5">
              <div className="bg-brand-950/60 p-3 rounded-md border border-brand-950 flex items-center justify-between text-xs font-mono">
                <span className="text-brand-200">AssetFlow Software Cost:</span>
                <span className="text-emerald-450 font-bold">~10% of Reclaimed ROI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
