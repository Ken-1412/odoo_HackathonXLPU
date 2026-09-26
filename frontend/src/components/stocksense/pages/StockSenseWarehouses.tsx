import React, { useState } from 'react';
import {
  Warehouse as WarehouseIcon,
  Layers,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { useStockSense } from '../../../lib/useStockSense';
import { ArchivePanel } from '../ui/ArchivePanel';
import { TechnicalBadge } from '../ui/TechnicalBadge';
import type { WarehouseZone, WarehouseRack } from '../../../types/stockSense';

interface StockSenseWarehousesProps {
  selectedWhId: string;
  onSelectWarehouse: (whId: string) => void;
  onNavigateToProduct: (prodId: string) => void;
}

export const StockSenseWarehouses: React.FC<StockSenseWarehousesProps> = ({
  selectedWhId,
  onSelectWarehouse,
  onNavigateToProduct,
}) => {
  const { warehouses, products } = useStockSense();

  const fallbackZones: WarehouseZone[] = [
    {
      id: 'z-01',
      name: 'Zone A - Primary Staging',
      racks: [
        {
          id: 'rk-01',
          name: 'Rack 01',
          bins: [
            { id: 'bn-01', name: 'A-01', capacity: 100 },
            { id: 'bn-02', name: 'A-02', capacity: 100 },
            { id: 'bn-03', name: 'A-03', capacity: 100 },
          ],
        },
        {
          id: 'rk-02',
          name: 'Rack 02',
          bins: [
            { id: 'bn-04', name: 'B-01', capacity: 100 },
            { id: 'bn-05', name: 'B-02', capacity: 100 },
          ],
        },
      ],
    },
    {
      id: 'z-02',
      name: 'Zone B - High-Bay Bulk Storage',
      racks: [
        {
          id: 'rk-03',
          name: 'Rack 03',
          bins: [
            { id: 'bn-06', name: 'C-01', capacity: 200 },
            { id: 'bn-07', name: 'C-02', capacity: 200 },
          ],
        },
      ],
    },
  ];

  const activeWh = warehouses.find((w) => w.id === selectedWhId) || warehouses[0] || {
    id: 'WH-01',
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    address: 'Bay 4, Central Logistics Park',
    totalCapacity: 10000,
    usedCapacity: 4500,
    capacityPercentage: 45,
    totalUnits: 4500,
    pendingReceipts: 3,
    pendingDeliveries: 2,
    internalMovements: 4,
    lowStockCount: 1,
    manager: 'Site Supervisor',
    zones: fallbackZones,
  };

  const zones: WarehouseZone[] = (activeWh.zones && activeWh.zones.length > 0) ? activeWh.zones : fallbackZones;

  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || 'z-01');
  const [selectedRackId, setSelectedRackId] = useState<string>(zones[0]?.racks?.[0]?.id || 'rk-01');
  const [selectedBinId, setSelectedBinId] = useState<string>(zones[0]?.racks?.[0]?.bins?.[0]?.id || 'bn-01');

  // Sync state if selected warehouse or its zones change
  React.useEffect(() => {
    if (zones && zones.length > 0) {
      const firstZone = zones[0];
      setSelectedZoneId(firstZone.id);
      if (firstZone.racks && firstZone.racks.length > 0) {
        setSelectedRackId(firstZone.racks[0].id);
        if (firstZone.racks[0].bins && firstZone.racks[0].bins.length > 0) {
          setSelectedBinId(firstZone.racks[0].bins[0].id);
        }
      }
    }
  }, [activeWh.id]);

  const activeZone = zones.find((z) => z.id === selectedZoneId) || zones[0];
  const activeRack = activeZone?.racks?.find((r) => r.id === selectedRackId) || activeZone?.racks?.[0];

  // Products located in this warehouse
  const whProducts = products.filter((p) =>
    p.locations?.some((loc) => loc.warehouseId === activeWh.id)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-blue-600 font-semibold">
            <WarehouseIcon className="w-4 h-4" />
            <span>SYSTEM // MULTI-FACILITY SPATIAL TOPOLOGY</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Warehouses & Storage Hierarchy
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Navigate through Facility → Zone → Rack → Bin coordinates to inspect physical inventory distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>{warehouses.length} ACTIVE LOGISTICS HUBS</span>
        </div>
      </div>

      {/* Warehouse Facility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((wh) => {
          const isSelected = wh.id === activeWh.id;

          return (
            <div
              key={wh.id}
              onClick={() => {
                onSelectWarehouse(wh.id);
                if (wh.zones[0]) {
                  setSelectedZoneId(wh.zones[0].id);
                  if (wh.zones[0].racks[0]) {
                    setSelectedRackId(wh.zones[0].racks[0].id);
                    if (wh.zones[0].racks[0].bins[0]) {
                      setSelectedBinId(wh.zones[0].racks[0].bins[0].id);
                    }
                  }
                }
              }}
              className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs ${
                isSelected
                  ? 'bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-sm text-blue-600">{wh.code}</span>
                <span className="font-mono text-[10px] text-slate-400 uppercase">
                  MANAGER: {wh.manager}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 mb-1">
                {wh.name}
              </h3>

              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 mb-3">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{wh.address}</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-500">UTILIZATION CAPACITY</span>
                  <span className="text-slate-800 font-bold">{wh.capacityPercentage ?? 45}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (wh.capacityPercentage ?? 45) > 80
                        ? 'bg-rose-500'
                        : (wh.capacityPercentage ?? 45) > 60
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${wh.capacityPercentage ?? 45}%` }}
                  />
                </div>
              </div>

              {/* Quick Telemetry */}
              <div className="grid grid-cols-3 gap-2 pt-3 text-center font-mono text-[10px] text-slate-500">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-slate-900 font-bold">{wh.totalUnits ? wh.totalUnits.toLocaleString() : '0'}</div>
                  <div className="text-[9px] text-slate-400">UNITS</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-emerald-700 font-bold">{wh.pendingReceipts ?? 0}</div>
                  <div className="text-[9px] text-slate-400">RECEIPTS</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <div className="text-blue-600 font-bold">{wh.pendingDeliveries ?? 0}</div>
                  <div className="text-[9px] text-slate-400">DELIVERIES</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Spatial Navigation Hierarchy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Spatial Coordinates Navigator (Zone -> Rack -> Bin) */}
        <div className="lg:col-span-1 space-y-4">
          <ArchivePanel
            title="SPATIAL HIERARCHY"
            subtitle={`${activeWh.code} TOPOLOGY`}
            archiveId="HIERARCHY::01"
          >
            <div className="space-y-4">
              {/* Zones Selection */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-medium">
                  1. SELECT STORAGE ZONE:
                </span>
                <div className="space-y-1">
                  {zones.map((zone: WarehouseZone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        setSelectedZoneId(zone.id);
                        if (zone.racks[0]) {
                          setSelectedRackId(zone.racks[0].id);
                          if (zone.racks[0].bins[0]) {
                            setSelectedBinId(zone.racks[0].bins[0].id);
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg font-mono text-xs text-left transition-colors cursor-pointer border ${
                        selectedZoneId === zone.id
                          ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>{zone.name}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Racks Selection */}
              {activeZone && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-medium">
                    2. SELECT RACK / BAY:
                  </span>
                  <div className="space-y-1">
                    {activeZone.racks.map((rack: WarehouseRack) => (
                      <button
                        key={rack.id}
                        type="button"
                        onClick={() => {
                          setSelectedRackId(rack.id);
                          if (rack.bins[0]) {
                            setSelectedBinId(rack.bins[0].id);
                          }
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg font-mono text-xs text-left transition-colors cursor-pointer border ${
                          selectedRackId === rack.id
                            ? 'bg-blue-50 border-blue-600 text-blue-700 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{rack.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {rack.bins.length} Bins
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bins Selection */}
              {activeRack && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-medium">
                    3. SELECT BIN / CELL:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {activeRack.bins.map((bin) => (
                      <button
                        key={bin.id}
                        type="button"
                        onClick={() => setSelectedBinId(bin.id)}
                        className={`p-2.5 rounded-lg font-mono text-xs text-center transition-colors cursor-pointer border ${
                          selectedBinId === bin.id
                            ? 'bg-blue-600 text-white font-semibold border-blue-600 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        BIN {bin.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ArchivePanel>
        </div>

        {/* Right Column: Physical Contents in Active Spatial Coordinates */}
        <div className="lg:col-span-2 space-y-4">
          <ArchivePanel
            title={`STORED MATERIAL CONTENTS // ${activeWh.code}`}
            subtitle={`ZONE: ${activeZone?.name || 'ALL'} • ${activeRack?.name || 'RACK'}`}
            archiveId="SPECIMEN::LOC"
          >
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    <th className="py-2.5 px-3 font-medium">SKU / CODE</th>
                    <th className="py-2.5 px-3 font-medium">PRODUCT SPECIMEN</th>
                    <th className="py-2.5 px-3 font-medium">EXACT COORDINATES</th>
                    <th className="py-2.5 px-3 font-medium text-right">STORED UNITS</th>
                    <th className="py-2.5 px-3 font-medium text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {whProducts.map((p) => {
                    const matchedLoc = p.locations.find((l) => l.warehouseId === activeWh.id);
                    if (!matchedLoc) return null;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => onNavigateToProduct(p.id)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-blue-600 group-hover:text-blue-700">
                          {p.sku}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">
                            {p.name}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {p.category}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {matchedLoc.zone} / {matchedLoc.rack} / Bin {matchedLoc.bin}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-xs text-slate-900">
                          {matchedLoc.quantity} {p.uom}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <TechnicalBadge status={p.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {whProducts.length === 0 && (
                <div className="text-center py-10 font-mono text-xs text-slate-400">
                  No materials currently logged in {activeWh.code}.
                </div>
              )}
            </div>
          </ArchivePanel>
        </div>
      </div>
    </div>
  );
};
