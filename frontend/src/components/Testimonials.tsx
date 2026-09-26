import { Star, BadgeCheck } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      name: 'Sarah Jenkins',
      role: 'Director of IT Operations',
      company: 'TechScale Solutions',
      industry: 'Software & Technology',
      quote: 'AssetFlow replaced a web of shared spreadsheets that was constantly out of sync. We reduced lost laptops and servers by 94% within the first three months of onboarding. The automated compliance trail is a game-changer.',
      rating: 5,
    },
    {
      name: 'Dr. Marcus Vance',
      role: 'Facilities Director',
      company: 'St. Jude General Hospital',
      industry: 'Healthcare Services',
      quote: 'Tracking medical equipment and maintenance rounds on paper logs was a liability. The conflict-free calendar booking and immediate discrepancy alerts saved our administration hundreds of audit hours.',
      rating: 5,
    },
    {
      name: 'Elena Rostova',
      role: 'Operations & Fleet Manager',
      company: 'Apex Logistics Group',
      industry: 'Manufacturing & Distribution',
      quote: 'We use AssetFlow to allocate utility vehicles and manage plant machinery maintenance. The live technician dispatcher board keeps our assembly lines moving with near-zero scheduling conflicts.',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-surface-50 border-b border-surface-200 relative">
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-900 font-mono">
            Social Proof
          </span>
          <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight mt-2 mb-4">
            Trusted in Regulated Industries
          </h2>
          <p className="text-base text-surface-650 font-medium">
            Operations managers, IT Admins, and Facility managers globally trust AssetFlow to digitize their physical resource allocation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <div 
              key={idx}
              className="p-6 sm:p-8 rounded-md bg-white border border-surface-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Rating stars */}
                <div className="flex items-center space-x-1 mb-5">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  ))}
                </div>
                
                <p className="text-surface-700 text-xs sm:text-sm leading-relaxed italic mb-6">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>

              <div className="pt-5 border-t border-surface-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-surface-900 flex items-center">
                    {review.name}
                    <BadgeCheck className="w-4 h-4 text-brand-900 ml-1" />
                  </h4>
                  <p className="text-[11px] text-surface-500 mt-0.5">
                    {review.role}, <strong className="text-surface-650">{review.company}</strong>
                  </p>
                </div>
                <span className="text-[9px] font-mono bg-brand-50 text-brand-900 px-2.5 py-0.5 rounded-sm uppercase border border-brand-100 font-bold">
                  {review.industry.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Scalability Banner Stats */}
        <div className="mt-16 bg-white rounded-md border border-surface-200 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-surface-900 mb-2 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-900 animate-pulse"></span>
              <span>Enterprise Scalability Built-In</span>
            </h3>
            <p className="text-xs text-surface-600 max-w-md">
              AssetFlow scales to accommodate millions of physical resources and operations, maintaining ISO 27001 compliance standards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            <div className="text-left">
              <span className="text-2xl sm:text-3xl font-extrabold text-surface-900 block font-mono">10k+</span>
              <span className="text-[10px] text-surface-500 font-bold uppercase font-mono tracking-wider">Assets Scanned/Day</span>
            </div>
            <div className="text-left">
              <span className="text-2xl sm:text-3xl font-extrabold text-surface-900 block font-mono">99.9%</span>
              <span className="text-[10px] text-surface-500 font-bold uppercase font-mono tracking-wider">Uptime SLA</span>
            </div>
            <div className="text-left">
              <span className="text-2xl sm:text-3xl font-extrabold text-surface-900 block font-mono">ISO</span>
              <span className="text-[10px] text-surface-500 font-bold uppercase font-mono tracking-wider">27001 Accredited</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
