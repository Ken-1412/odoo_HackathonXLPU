import React, { useState } from 'react';
import { Layers, Plus, X } from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';

export const StockSenseCategories: React.FC = () => {
  const { products } = useStockSense();

  const [categories, setCategories] = useState([
    { name: 'Raw Materials', description: 'Metals, alloys, sheets, billets, and basic fabrication inputs', icon: 'Layers' },
    { name: 'Components', description: 'Machined parts, bearings, seals, gears, and subassemblies', icon: 'Boxes' },
    { name: 'Hardware', description: 'Pumps, actuators, control valves, and mechanical hardware', icon: 'Sliders' },
    { name: 'Electrical', description: 'Busbars, wiring harnesses, connectors, and power systems', icon: 'Zap' },
    { name: 'Chemicals & Polymers', description: 'Resins, adhesives, solvents, lubricants, and epoxies', icon: 'FlaskConical' },
    { name: 'Fasteners', description: 'Hex bolts, rivets, dowels, nuts, and washers', icon: 'Tool' },
    { name: 'Furnishings', description: 'Control room seating, consoles, workstations, and fixtures', icon: 'Armchair' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCategories([...categories, { name: newCatName.trim(), description: newCatDesc.trim(), icon: 'Layers' }]);
    setIsModalOpen(false);
    setNewCatName('');
    setNewCatDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <Layers className="w-4 h-4" />
            <span>CATALOG // MATERIAL TAXONOMY</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Product Categories
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize catalog inventory items by metallurgical classification and usage domain.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const matchingProds = products.filter((p) => p.category === cat.name);
          const totalUnits = matchingProds.reduce((sum, p) => sum + p.currentStock, 0);

          return (
            <ArchivePanel
              key={cat.name}
              title={cat.name}
              archiveId={`${matchingProds.length} SKUs`}
            >
              <p className="text-xs text-slate-600 leading-relaxed mb-4 min-h-[36px]">
                {cat.description}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-mono">
                <span className="text-slate-500">Inventory Units:</span>
                <strong className="text-blue-600 font-bold">{totalUnits.toLocaleString()}</strong>
              </div>
            </ArchivePanel>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 z-50 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Add Material Category</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-[10.5px] font-mono text-slate-600 uppercase mb-1 font-medium">
                  CATEGORY NAME *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Composites & Fibers"
                  className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 py-2 px-3 text-xs text-slate-900 rounded-lg outline-none"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-mono text-slate-600 uppercase mb-1 font-medium">
                  DESCRIPTION
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Scope and characteristics of materials in this category..."
                  className="w-full bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 py-2 px-3 text-xs text-slate-900 rounded-lg outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all cursor-pointer">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
