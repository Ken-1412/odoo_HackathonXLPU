import { QrCode, UserCheck, ClipboardCheck, TrendingUp, ArrowRight } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      step: '01',
      icon: QrCode,
      title: 'Register',
      description: 'Upload spreadsheet inventories or scan barcode/QR asset labels to register items, departments, and specs.'
    },
    {
      step: '02',
      icon: UserCheck,
      title: 'Allocate',
      description: 'Assign asset custody to staff or departments with automated conflict check-ins and hand-over logs.'
    },
    {
      step: '03',
      icon: ClipboardCheck,
      title: 'Audit',
      description: 'Run routine physical compliance checks with scanner logs to detect discrepancies and locate items.'
    },
    {
      step: '04',
      icon: TrendingUp,
      title: 'Optimize',
      description: 'Compile depreciation schedules, dispatch maintenance tickets, and track physical item lifespans.'
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-surface-50 border-b border-surface-200 relative">
      <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-900 font-mono">
            System Workflow
          </span>
          <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight mt-2 mb-4">
            Unified Process Flow
          </h2>
          <p className="text-base text-surface-650 leading-relaxed font-medium">
            How AssetFlow manages physical resource custody from initial onboarding to compliance optimization.
          </p>
        </div>

        {/* 4-Step Horizontal Process Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {steps.map((step, idx) => {
            return (
              <div key={idx} className="relative flex flex-col justify-between bg-white border border-surface-200 p-6 rounded-md shadow-sm">
                {/* Arrow Connector (only on desktop and not for the last item) */}
                {idx < 3 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3.5 transform -translate-y-1/2 z-20 items-center justify-center bg-white border border-surface-200 rounded-full w-7 h-7 shadow-sm text-brand-900">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-900">
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono text-brand-900 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-sm">
                      STEP {step.step}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-surface-900 mb-2 text-left">
                    {step.title}
                  </h3>
                  <p className="text-xs text-surface-600 leading-relaxed text-left">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
