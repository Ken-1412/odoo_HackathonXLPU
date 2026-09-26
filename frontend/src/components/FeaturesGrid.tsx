import { Database, UserCheck, CalendarClock, ShieldAlert, ArrowRight } from 'lucide-react';

export default function FeaturesGrid() {
  const pillars = [
    {
      icon: Database,
      title: 'Complete Lifecycle Tracking',
      description: 'Record acquisitions, track live locations, monitor depreciating asset values, and manage final disposals from a single registry.',
      color: 'text-electric-400 bg-electric-500/10 border-electric-500/20',
      badge: 'Acquisition to Disposal'
    },
    {
      icon: UserCheck,
      title: 'Conflict-Free Allocation',
      description: 'Prevent double allocations with automated system blocks. Reassign custody via structured multi-level approval transfer chains.',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badge: 'Anti-Double-Booking'
    },
    {
      icon: CalendarClock,
      title: 'Shared Resource Booking',
      description: 'Reserve meeting rooms, vehicles, and specialized lab equipment via calendar grids that enforce slot isolation and auto-alerts.',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      badge: 'Time-Slot Booking'
    },
    {
      icon: ShieldAlert,
      title: 'Maintenance & Audit Trails',
      description: 'File maintenance tickets, assign technicians, track downtime, and execute routine scan audits with immediate discrepancy reports.',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: 'SOC2 & ISO Ready'
    }
  ];

  return (
    <section id="features" className="py-20 bg-navy-950 border-t border-navy-900 relative">
      <div className="absolute inset-0 bg-dot-pattern opacity-40"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-electric-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-electric-400 font-mono">
            Enterprise Pillars
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2 mb-4">
            Designed for Rigorous Operations
          </h2>
          <p className="text-lg text-slate-400">
            Ditch messy spreadsheets. AssetFlow introduces rigid workflows, role-based controls, and automatic conflict detection for zero operational gaps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, idx) => (
            <div 
              key={idx}
              className="p-6 sm:p-8 rounded-2xl bg-navy-900/30 border border-navy-800/80 hover:border-navy-750 hover:bg-navy-900/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${pillar.color} group-hover:scale-105 transition-transform`}>
                    <pillar.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 bg-navy-900 px-2.5 py-1 rounded-full uppercase border border-navy-850">
                    {pillar.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {pillar.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-4 border-t border-navy-850 flex items-center text-xs font-bold text-slate-400 group-hover:text-electric-400 transition-colors">
                <span>Learn how it integrates</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
