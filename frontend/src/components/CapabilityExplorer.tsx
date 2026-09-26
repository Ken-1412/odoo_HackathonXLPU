import { 
  Laptop, UserCheck, CalendarDays, Wrench, Shield, BarChart3, Car, Clock
} from 'lucide-react';

export default function CapabilityExplorer() {
  const modules = [
    {
      id: 'lifecycle',
      position: 1,
      icon: Laptop,
      title: 'Asset Lifecycle',
      description: 'Track physical assets from initial acquisition and procurement through value depreciation, custody assignments, and final decommissioning/disposal.',
      badge: 'Procurement to Disposal',
      visual: (
        <div className="mt-4 p-3 bg-surface-50 border border-surface-200 rounded-md font-mono text-[10px] space-y-2 text-left">
          <div className="flex justify-between items-center border-b border-surface-200 pb-1.5 mb-1">
            <span className="font-bold text-surface-900 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-brand-900" />
              <span>AST-9402 MacBook Pro</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#D4EDDA] text-[#155724]">
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px] text-surface-650">
            <div>Cost: ₹1,80,000</div>
            <div>Dept: IT Operations</div>
          </div>
        </div>
      )
    },
    {
      id: 'allocation',
      position: 2,
      icon: UserCheck,
      title: 'Allocation Engine',
      description: 'Assign physical items to departments or specific employees. Integrated custody transfer validation eliminates scheduling overlaps and handles double-allocations.',
      badge: 'Conflict-Free Handover',
      visual: (
        <div className="mt-4 p-3 bg-surface-50 border border-surface-200 rounded-md font-mono text-[10px] space-y-2 text-left">
          <div className="flex justify-between items-center border-b border-surface-200 pb-1.5 mb-1">
            <span className="font-bold text-surface-900 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-brand-900" />
              <span>Custody Handover</span>
            </span>
            <span className="text-[8px] text-surface-500">TRF-102</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-surface-700">
            <span>From: Operations</span>
            <span className="text-brand-900">➔</span>
            <span>To: Sarah Singh</span>
          </div>
        </div>
      )
    },
    {
      id: 'booking',
      position: 3,
      icon: CalendarDays,
      title: 'Resource Booking',
      description: 'Interactive calendar-based reservation for shared physical spaces, fleet vehicles, and diagnostic tools, with automated double-booking prevention.',
      badge: 'Calendar scheduler',
      visual: (
        <div className="mt-4 p-3 bg-surface-50 border border-surface-200 rounded-md font-mono text-[10px] space-y-2 text-left">
          <div className="flex justify-between items-center border-b border-surface-200 pb-1.5 mb-1">
            <span className="font-bold text-surface-900 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-brand-900" />
              <span>Fleet Vehicle 04</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#D4EDDA] text-[#155724]">
              Booked
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-surface-650">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-surface-500" />
              <span>14:00 - 18:00</span>
            </div>
            <span>Ketan Singh</span>
          </div>
        </div>
      )
    },
    {
      id: 'maintenance',
      position: 4,
      icon: Wrench,
      title: 'Maintenance & Audits',
      description: 'Schedule routine hardware maintenance and physical inventory audits. Instantly detect record discrepancies via barcode/RFID scanning integrations.',
      badge: 'Inspections & Audits',
      visual: (
        <div className="mt-4 p-3 bg-surface-50 border border-surface-200 rounded-md font-mono text-[10px] space-y-2 text-left">
          <div className="flex justify-between items-center border-b border-surface-200 pb-1.5 mb-1">
            <span className="font-bold text-surface-900 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-brand-900" />
              <span>Hardware Service</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-[#FFF3CD] text-[#856404]">
              Pending
            </span>
          </div>
          <div className="text-[9px] text-surface-650 truncate">Server Rack Overheating Check</div>
        </div>
      )
    },
    {
      id: 'security',
      position: 5,
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Enforce security compliance with separate workspace controls and data write permissions for Administrators, Managers, and general Staff.',
      badge: 'Granular Permissions',
      visual: (
        <div className="mt-4 p-3 bg-surface-50 border border-surface-200 rounded-md font-mono text-[10px] space-y-1.5 text-left">
          <div className="flex justify-between text-[8px] text-surface-500 font-bold border-b border-surface-200 pb-1">
            <span>ROLE LEVEL</span>
            <span>PERMISSIONS</span>
          </div>
          <div className="flex justify-between text-[9px] text-surface-700">
            <span>Administrator</span>
            <span className="text-brand-900 font-bold">Full Access</span>
          </div>
          <div className="flex justify-between text-[9px] text-surface-700">
            <span>Staff Member</span>
            <span className="text-surface-500">Read / Request</span>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      position: 6,
      icon: BarChart3,
      title: 'KPI Dashboard',
      description: 'Gain complete visibility into asset utilization metrics, lifetime amortization status, repair backlogs, and overdue checkouts.',
      badge: 'Real-time Analytics',
      visual: (
        <div className="mt-4 p-3 bg-surface-50 border border-surface-200 rounded-md font-mono text-[10px] space-y-2 text-left">
          <div className="flex justify-between items-center border-b border-surface-200 pb-1.5">
            <span className="font-bold text-surface-900 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-brand-900" />
              <span>Utilization Summary</span>
            </span>
            <span className="text-brand-900 font-bold text-[9px]">84%</span>
          </div>
          <div className="flex gap-1.5 h-6 items-end pt-1">
            <div className="bg-brand-900 w-full h-[40%] rounded-sm"></div>
            <div className="bg-brand-900 w-full h-[70%] rounded-sm"></div>
            <div className="bg-brand-950 w-full h-[95%] rounded-sm"></div>
            <div className="bg-brand-500 w-full h-[60%] rounded-sm"></div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="features" className="py-20 bg-white border-b border-surface-200 relative select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-900 font-mono">
            System Modules
          </span>
          <h2 className="text-3xl font-extrabold text-surface-900 tracking-tight mt-2 mb-4 font-sans">
            Unified ERP Controls for Physical Resources
          </h2>
          <p className="text-base text-surface-650 leading-relaxed font-medium">
            AssetFlow delivers structured, code-enforced workflows replacing error-prone manual spreadsheets. Here is the operational engine running behind the scenes.
          </p>
        </div>

        {/* 3D Carousel Rotating Slider */}
        <div className="slider-3d-container">
          <div className="slider-3d" style={{ '--quantity': 6 } as React.CSSProperties}>
            {modules.map((mod) => (
              <div 
                key={mod.id} 
                className="item-3d group" 
                style={{ '--position': mod.position } as React.CSSProperties}
              >
                {/* Capability Card */}
                <div className="bg-white border border-surface-200 p-6 rounded-md shadow-sm flex flex-col justify-between h-full select-none">
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-md bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-900">
                        <mod.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-mono font-bold tracking-wider text-brand-900 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-sm uppercase">
                        {mod.badge}
                      </span>
                    </div>

                    {/* Card Title & Desc */}
                    <h3 className="text-base font-bold text-surface-900 mb-2 text-left">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-surface-600 leading-relaxed text-left">
                      {mod.description}
                    </p>
                  </div>

                  {/* Visual Sandbox Mockup inside Card */}
                  <div className="mt-4">
                    {mod.visual}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
