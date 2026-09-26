import { useState } from 'react';
import { 
  Laptop, Server, Car, Calendar, Wrench, ClipboardCheck, Search, 
  Clock, MapPin, ArrowRight, ShieldCheck, RotateCcw, Eye, Play
} from 'lucide-react';

// Types for Mock Data
interface Asset {
  id: string;
  name: string;
  category: 'Electronics' | 'Vehicles' | 'Meeting Rooms' | 'Labs';
  tag: string;
  status: 'Available' | 'Allocated' | 'Maintenance';
  holder: string;
  location: string;
}

interface MaintenanceTicket {
  id: string;
  title: string;
  asset: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Approved' | 'Assigned' | 'In Progress' | 'Resolved';
  assignedTo: string;
}

interface BookingSlot {
  id: string;
  resource: string;
  time: string;
  status: 'Booked' | 'Conflict' | 'Available';
  user: string;
}

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<'assets' | 'bookings' | 'maintenance' | 'audits'>('assets');
  
  // Asset state & category filters
  const [assetFilter, setAssetFilter] = useState<string>('All');
  const [assetSearch, setAssetSearch] = useState<string>('');
  
  const initialAssets: Asset[] = [
    { id: '1', name: 'MacBook Pro 16"', category: 'Electronics', tag: 'AST-2026-0041', status: 'Allocated', holder: 'Sarah Jenkins (Eng)', location: 'HQ - Floor 3' },
    { id: '2', name: 'Database Server Rack 4', category: 'Electronics', tag: 'AST-2026-0112', status: 'Maintenance', holder: 'SysOps Team', location: 'Austin Data Center' },
    { id: '3', name: 'Tesla Model 3 (Fleet A)', category: 'Vehicles', tag: 'AST-2026-0881', status: 'Available', holder: 'None (Shared)', location: 'Garage Row 2' },
    { id: '4', name: 'Executive Boardroom B', category: 'Meeting Rooms', tag: 'AST-2026-1024', status: 'Allocated', holder: 'Marketing Team', location: 'HQ - Floor 5' },
    { id: '5', name: 'Dell Precision Workstation', category: 'Electronics', tag: 'AST-2026-0099', status: 'Available', holder: 'None', location: 'IT Inventory Room' },
    { id: '6', name: 'Hardware Testing Lab 2', category: 'Labs', tag: 'AST-2026-1405', status: 'Available', holder: 'None (Shared)', location: 'R&D Wing' },
  ];

  // Bookings state
  const [bookings, setBookings] = useState<BookingSlot[]>([
    { id: 'b1', resource: 'Executive Boardroom B', time: '09:00 - 10:00', status: 'Booked', user: 'HR Department' },
    { id: 'b2', resource: 'Executive Boardroom B', time: '09:30 - 10:30', status: 'Conflict', user: 'Finance Review' },
    { id: 'b3', resource: 'Executive Boardroom B', time: '10:00 - 11:00', status: 'Available', user: 'None' },
    { id: 'b4', resource: 'Tesla Model 3 (Fleet A)', time: '09:00 - 12:00', status: 'Booked', user: 'Operations Admin' },
    { id: 'b5', resource: 'Tesla Model 3 (Fleet A)', time: '12:00 - 13:00', status: 'Available', user: 'None' },
    { id: 'b6', resource: 'Hardware Testing Lab 2', time: '13:00 - 15:00', status: 'Booked', user: 'QA Testing' },
  ]);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);

  // Maintenance tickets state
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([
    { id: 't1', title: 'HVAC Temperature Calibration', asset: 'Executive Boardroom B', priority: 'Medium', status: 'Pending', assignedTo: 'Unassigned' },
    { id: 't2', title: 'DB Server Power Supply Replacement', asset: 'Database Server Rack 4', priority: 'High', status: 'Assigned', assignedTo: 'Marcus K. (Technician)' },
    { id: 't3', title: 'Fleet Car Windshield Crack Repair', asset: 'Tesla Model 3 (Fleet A)', priority: 'Low', status: 'Resolved', assignedTo: 'Robert L. (Auto)' },
  ]);

  // Audits logs simulation state
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'System: Audit cycle "Q3 Electronics Verification" initialized.',
    'System: Total assets in scope: 142 items.',
  ]);
  const [isAuditing, setIsAuditing] = useState(false);

  // Helpers
  const handleBookingClick = (slot: BookingSlot) => {
    if (slot.status === 'Booked') {
      setBookingMessage(`❌ Room is occupied. AssetFlow's booking rules block scheduling double allocations.`);
    } else if (slot.status === 'Conflict') {
      setBookingMessage(`⚠️ Conflict Detected! Slot overlaps with 'HR Department' (09:00 - 10:00). Auto-rejected by validation engine.`);
    } else {
      // Book slot
      const updated = bookings.map(b => b.id === slot.id ? { ...b, status: 'Booked' as const, user: 'You (Demo User)' } : b);
      setBookings(updated);
      setBookingMessage(`✅ Slot successfully reserved! Confirmed with zero overlaps. Notification sent to Asset Manager.`);
    }
  };

  const advanceTicketStatus = (ticketId: string) => {
    setTickets(prev => prev.map(ticket => {
      if (ticket.id === ticketId) {
        let nextStatus: MaintenanceTicket['status'];
        let assigned = ticket.assignedTo;
        switch (ticket.status) {
          case 'Pending': 
            nextStatus = 'Approved'; 
            break;
          case 'Approved': 
            nextStatus = 'Assigned'; 
            assigned = 'David V. (Senior Tech)';
            break;
          case 'Assigned': 
            nextStatus = 'In Progress'; 
            break;
          case 'In Progress': 
            nextStatus = 'Resolved'; 
            break;
          default: 
            nextStatus = 'Pending';
            assigned = 'Unassigned';
        }
        return { ...ticket, status: nextStatus, assignedTo: assigned };
      }
      return ticket;
    }));
  };

  const runAuditSimulation = () => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditProgress(10);
    setAuditLogs([
      'Scan Engine: Initializing laser/RFID tag scanner...',
      'Scanner: Handheld scanner AST-SCAN-09 active.',
    ]);

    const steps = [
      { progress: 30, log: 'Scan: Barcode [AST-2026-0041] scanned. Result: MacBook Pro 16" - Matches Record. Status: [VERIFIED]' },
      { progress: 55, log: 'Scan: Barcode [AST-2026-0099] scanned. Result: Dell Workstation - Matches Record. Status: [VERIFIED]' },
      { progress: 80, log: 'Scan: Barcode [AST-2026-0112] scanner ping. Warning: Asset in Server Rack 4 moved without Transfer Slip. Status: [DISCREPANCY REPORTED]' },
      { progress: 100, log: 'Audit complete. 2 verified, 1 discrepancies logged. Audit Trail signed cryptographically.' }
    ];

    steps.forEach((step, i) => {
      setTimeout(() => {
        setAuditProgress(step.progress);
        setAuditLogs(prev => [...prev, step.log]);
        if (i === steps.length - 1) {
          setIsAuditing(false);
        }
      }, (i + 1) * 900);
    });
  };

  // Filtered Assets list
  const filteredAssets = initialAssets.filter(asset => {
    const matchesCategory = assetFilter === 'All' || asset.category === assetFilter;
    const matchesSearch = asset.name.toLowerCase().includes(assetSearch.toLowerCase()) || 
                          asset.tag.toLowerCase().includes(assetSearch.toLowerCase()) ||
                          asset.holder.toLowerCase().includes(assetSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative w-full rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-200/60 overflow-hidden flex flex-col md:flex-row h-[580px] text-left">
      
      {/* Mock App Browser Title Bar Header */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 z-20">
        <div className="flex space-x-1.5 mr-4">
          <div className="w-3 h-3 rounded-full bg-rose-400"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
        </div>
        <div className="bg-white border border-slate-200 px-3 py-1 rounded text-xs text-slate-600 font-mono flex items-center space-x-1.5 w-64 md:w-80 truncate">
          <span className="text-purple-650">https://</span>
          <span>app.assetflow.com/dashboard</span>
        </div>
        <div className="ml-auto flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
          <span className="hidden sm:inline">User: Admin (Operations)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      {/* Mock Sidebar Navigation */}
      <div className="w-full md:w-52 bg-slate-50 pt-14 pb-4 px-3 flex md:flex-col border-b md:border-b-0 md:border-r border-slate-250/70 shrink-0 space-y-0 md:space-y-1 overflow-x-auto md:overflow-x-visible">
        <div className="hidden md:block px-3 py-2 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
          Modules
        </div>
        
        <button 
          onClick={() => setActiveTab('assets')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 whitespace-nowrap w-full ${
            activeTab === 'assets' 
              ? 'bg-purple-100 text-purple-700 border border-purple-200/50' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>Asset Inventory</span>
        </button>

        <button 
          onClick={() => { setActiveTab('bookings'); setBookingMessage(null); }}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 whitespace-nowrap w-full ${
            activeTab === 'bookings' 
              ? 'bg-purple-100 text-purple-700 border border-purple-200/50' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Conflict-Free Booking</span>
        </button>

        <button 
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 whitespace-nowrap w-full ${
            activeTab === 'maintenance' 
              ? 'bg-purple-100 text-purple-700 border border-purple-200/50' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Maintenance Pipeline</span>
        </button>

        <button 
          onClick={() => setActiveTab('audits')}
          className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-150 whitespace-nowrap w-full ${
            activeTab === 'audits' 
              ? 'bg-purple-100 text-purple-700 border border-purple-200/50' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Compliance Audit</span>
        </button>

        <div className="hidden md:block pt-6 mt-auto border-t border-slate-200">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-1 text-slate-800 text-xs font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>SOC2 Certified</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Enterprise grade encryption active.
            </p>
          </div>
        </div>
      </div>

      {/* Mock Workspace Content Area */}
      <div className="flex-1 pt-14 px-4 sm:px-6 pb-6 overflow-y-auto bg-white flex flex-col">
        
        {/* Module Title / Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              {activeTab === 'assets' && <span>Asset Inventory & Directory</span>}
              {activeTab === 'bookings' && <span>Resource Booking & Conflict Prevention</span>}
              {activeTab === 'maintenance' && <span>Maintenance Workflows & Lifecycle status</span>}
              {activeTab === 'audits' && <span>Automated Audit Verification Cycles</span>}
              <span className="text-[9px] bg-purple-100 px-2 py-0.5 rounded text-purple-700 font-mono font-bold uppercase tracking-wide border border-purple-200/30">
                Live Demo Card
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {activeTab === 'assets' && 'Filter and audit organizational assets with full QR code trails.'}
              {activeTab === 'bookings' && 'Try clicking available and conflict slots below to trigger validations.'}
              {activeTab === 'maintenance' && 'Click the status action badge to advance tickets along the approval pipe.'}
              {activeTab === 'audits' && 'Start a verification scan sweep to test handheld matching.'}
            </p>
          </div>
        </div>

        {/* Tab Panel 1: ASSETS */}
        {activeTab === 'assets' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search assets by tag, custodian, brand..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-800 pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/25"
                />
              </div>
              <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto">
                {['All', 'Electronics', 'Vehicles', 'Meeting Rooms', 'Labs'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAssetFilter(cat)}
                    className={`px-3 py-1 rounded text-[10px] font-bold transition-all duration-150 ${
                      assetFilter === cat
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Assets Table */}
            <div className="flex-1 overflow-x-auto border border-slate-200 rounded-lg bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="p-3">Asset Description</th>
                    <th className="p-3">Unique Tag</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Custodian</th>
                    <th className="p-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-slate-50/50 text-slate-700">
                      <td className="p-3 flex items-center space-x-2.5">
                        {asset.category === 'Electronics' && <Laptop className="w-4 h-4 text-purple-650" />}
                        {asset.category === 'Vehicles' && <Car className="w-4 h-4 text-amber-550" />}
                        {asset.category === 'Meeting Rooms' && <Calendar className="w-4 h-4 text-purple-500" />}
                        {asset.category === 'Labs' && <Server className="w-4 h-4 text-emerald-600" />}
                        <span className="font-semibold text-slate-900">{asset.name}</span>
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-100/50 rounded px-1.5 py-0.5">{asset.tag}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          asset.status === 'Available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/30' :
                          asset.status === 'Allocated' ? 'bg-purple-100 text-purple-800 border border-purple-200/30' :
                          'bg-amber-100 text-amber-855 border border-amber-200/30'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{asset.holder}</td>
                      <td className="p-3 text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{asset.location}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredAssets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        No assets match search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Panel 2: BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Alert Feedback message */}
              {bookingMessage ? (
                <div className={`p-3 rounded-lg text-xs font-semibold mb-4 border transition-all duration-200 ${
                  bookingMessage.startsWith('❌') ? 'bg-rose-50 border-rose-100 text-rose-700' :
                  bookingMessage.startsWith('⚠️') ? 'bg-amber-50 border-amber-100 text-amber-800' :
                  'bg-emerald-50 border-emerald-100 text-emerald-800'
                }`}>
                  {bookingMessage}
                </div>
              ) : (
                <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100 text-xs text-purple-850 mb-4 flex items-start space-x-2">
                  <Play className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Interactive Challenge:</strong> Try clicking the red <strong>Finance Review (Conflict)</strong> slot to see validation in action, or click the green <strong>Available</strong> slot to book it conflict-free!
                  </span>
                </div>
              )}

              {/* Resource Slots list */}
              <div className="space-y-3">
                {bookings.map((slot) => (
                  <div 
                    key={slot.id}
                    onClick={() => handleBookingClick(slot)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
                      slot.status === 'Booked' 
                        ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-70 text-slate-400' 
                        : slot.status === 'Conflict'
                        ? 'bg-rose-50 border-rose-100 hover:bg-rose-100/50 text-rose-800' 
                        : 'bg-emerald-50 border-emerald-100/80 hover:border-emerald-350 hover:bg-emerald-100/30 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        slot.status === 'Booked' ? 'bg-slate-200 text-slate-500' :
                        slot.status === 'Conflict' ? 'bg-rose-100 text-rose-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {slot.resource.includes('Boardroom') ? <Laptop className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className={`text-xs font-bold ${slot.status === 'Booked' ? 'text-slate-500' : 'text-slate-900'}`}>{slot.resource}</h4>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <Clock className="w-3 h-3 text-slate-450" />
                          <span>{slot.time}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          slot.status === 'Booked' ? 'bg-slate-200 text-slate-500' :
                          slot.status === 'Conflict' ? 'bg-rose-100 text-rose-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {slot.status === 'Booked' ? `Reserved: ${slot.user}` :
                           slot.status === 'Conflict' ? 'Overlapping Conflict' :
                           'Select to Reserve'}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-slate-450 text-center mt-2 italic">
              *Scheduling engine blocks overlaps automatically based on asset configuration rules.
            </p>
          </div>
        )}

        {/* Tab Panel 3: MAINTENANCE */}
        {activeTab === 'maintenance' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${
                        ticket.priority === 'High' ? 'bg-rose-500' :
                        ticket.priority === 'Medium' ? 'bg-amber-500' :
                        'bg-slate-400'
                      }`}></span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">{ticket.priority} Priority</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{ticket.title}</h4>
                    <p className="text-[10px] text-slate-550 mt-0.5 flex items-center space-x-1.5">
                      <span>Asset: <strong className="text-slate-700">{ticket.asset}</strong></span>
                      <span className="text-slate-300">•</span>
                      <span>Tech: <strong className="text-slate-700">{ticket.assignedTo}</strong></span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {/* Status Step indicators */}
                    <div className="flex space-x-1 mr-2">
                      {['Pending', 'Approved', 'Assigned', 'In Progress', 'Resolved'].map((step, idx) => (
                        <div 
                          key={step} 
                          className={`w-1.5 h-1.5 rounded-full ${
                            ticket.status === step ? 'bg-purple-650 scale-125' : 
                            // check if completed
                            ['Pending', 'Approved', 'Assigned', 'In Progress', 'Resolved'].indexOf(ticket.status) >= idx
                              ? 'bg-emerald-500' 
                              : 'bg-slate-200'
                          }`}
                          title={step}
                        />
                      ))}
                    </div>

                    <button 
                      onClick={() => advanceTicketStatus(ticket.id)}
                      className="px-3 py-1.5 bg-white hover:bg-purple-600 hover:text-white border border-slate-250 hover:border-purple-600 rounded-lg text-[10px] font-bold text-slate-700 flex items-center space-x-1 transition-all duration-150 active:scale-95 shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400 hover:text-current" />
                      <span>{ticket.status === 'Resolved' ? 'Reset Flow' : 'Advance Ticket'}</span>
                    </button>

                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                      ticket.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      ticket.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
                      'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {ticket.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-4 text-[10px] text-slate-500 leading-normal">
              <strong>Workflow Automation:</strong> Changing status triggers real-time status transitions on assets. Setting a ticket to &ldquo;Resolved&rdquo; automatically flips the respective Asset Registry status back from &ldquo;Under Maintenance&rdquo; to &ldquo;Available&rdquo;.
            </div>
          </div>
        )}

        {/* Tab Panel 4: AUDITS */}
        {activeTab === 'audits' && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Scan controller */}
              <div className="md:col-span-2 space-y-4">
                <button
                  onClick={runAuditSimulation}
                  disabled={isAuditing}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all active:scale-98 ${
                    isAuditing 
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/10'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>{isAuditing ? 'Auditing Sweeps...' : 'Simulate Scan Sweep'}</span>
                </button>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left">
                  <h4 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Scan Coverage</span>
                  </h4>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-300 ease-out" 
                      style={{ width: `${auditProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>PROGRESS: {auditProgress}%</span>
                    <span>142 TOTAL</span>
                  </div>
                </div>
              </div>

              {/* Console log outputs */}
              <div className="md:col-span-3 bg-slate-950 rounded-xl p-3.5 border border-slate-900 flex flex-col h-[280px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">
                  Logs Output
                </span>
                <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] text-slate-350 leading-normal scrollbar-thin">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start space-x-1.5">
                      <span className="text-slate-650 shrink-0">&gt;</span>
                      <span className={
                        log.includes('VERIFIED') ? 'text-emerald-400' :
                        log.includes('DISCREPANCY') ? 'text-rose-455 font-semibold' :
                        log.includes('complete') ? 'text-white font-bold' :
                        'text-slate-300'
                      }>
                        {log}
                      </span>
                    </div>
                  ))}
                  {isAuditing && (
                    <div className="text-[10px] text-purple-400 animate-pulse flex items-center space-x-1.5 mt-1 font-mono">
                      <span>_</span>
                      <span className="animate-ping bg-purple-400 h-1.5 w-1.5 rounded-full inline-block"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 text-center mt-2 italic">
              Discrepancy reports sync automatically to generate ISO/IEC compliance audit trails.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
