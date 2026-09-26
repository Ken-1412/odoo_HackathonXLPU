import React, { useState } from 'react';
import { Mail, Check, ShieldCheck } from 'lucide-react';

export default function CTASection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <section id="trial" className="py-20 bg-navy-950 border-t border-navy-900 relative">
      <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
      <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-electric-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 rounded-3xl border border-navy-800/80 p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-electric-500/5 rounded-full blur-[60px] pointer-events-none"></div>

          <div className="max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-electric-400 font-mono">
              GET STARTED TODAY
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2 mb-4">
              Ready to Eliminate Spreadsheet Chaos?
            </h2>
            <p className="text-base text-slate-400 mb-8 max-w-xl mx-auto">
              Start tracking, allocating, and maintaining your organizational resources inside a SOC2-compliant system. Setup takes less than 15 minutes.
            </p>

            {submitted ? (
              <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-6 max-w-md mx-auto text-left flex items-start space-x-3.5 animate-pulse-slow">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Trial Request Received!</h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    We&apos;ve sent an onboarding link to <strong className="text-slate-200">{email}</strong>. Check your inbox to configure your workspace parameters.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="Enter work email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-navy-950 border border-navy-800 text-slate-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-electric-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="py-3 px-6 bg-gradient-to-r from-electric-600 to-electric-500 hover:from-electric-500 hover:to-electric-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-electric-600/10 hover:shadow-electric-500/25 transition-all duration-200 shrink-0"
                  >
                    Start 14-Day Trial
                  </button>
                </div>
                
                <p className="text-[10px] text-slate-500 text-left mt-3 leading-normal">
                  No credit card required. Trial includes full access to Asset Registry, Calendar Reservation engine, and Maintenance Kanban board.
                </p>
              </form>
            )}

            {/* Compliance trust footers */}
            <div className="mt-10 pt-8 border-t border-navy-850 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1.5" />
                No installation required (SaaS Web App)
              </span>
              <span className="hidden sm:inline text-slate-800">•</span>
              <span className="flex items-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1.5" />
                GDPR & CCPA Compliant encryption
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
