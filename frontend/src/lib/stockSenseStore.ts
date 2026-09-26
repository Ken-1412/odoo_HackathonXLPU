/**
 * StockSense — Core Operational Store & Event-Driven Inventory Engine
 * 
 * Provides unified state management for:
 * - Products & Catalog
 * - Receipts (Incoming Goods)
 * - Deliveries (Outgoing Goods & Insufficient Stock Protection)
 * - Internal Transfers (Location movements)
 * - Inventory Adjustments (Physical vs System count variance)
 * - Permanent Stock Ledger Audit Trail
 * - Warehouses & Spatial Hierarchy
 * 
 * Synchronizes with backend APIs when available while maintaining
 * resilient local persistence so workflows are always 100% functional.
 */

import type {
  Product,
  ReceiptOrder,
  DeliveryOrder,
  InternalTransfer,
  InventoryAdjustment,
  LedgerEntry,
  Warehouse,
  StockSenseStats,
} from '../types/stockSense';

const STORAGE_KEY = 'stocksense_inventory_v1';

// ─── Initial Seed Data Matching Image 1 & Wireframe ─────────────────────────

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-01',
    code: 'WH-01',
    name: 'Central Logistics & Archive Hub',
    address: 'Bay 14, Industrial Corridor, Sector 4',
    manager: 'Marcus Vance',
    totalProducts: 42,
    totalUnits: 7850,
    capacityPercentage: 74,
    pendingReceipts: 8,
    pendingDeliveries: 5,
    internalMovements: 4,
    lowStockCount: 18,
    zones: [
      {
        id: 'Z-MAIN',
        name: 'Main Storage Hall',
        racks: [
          { id: 'RACK-A', name: 'Rack A (Heavy Metals)', bins: [{ id: 'BIN-01', name: 'A-01' }, { id: 'BIN-02', name: 'A-02' }, { id: 'BIN-03', name: 'A-03' }] },
          { id: 'RACK-B', name: 'Rack B (Sheet Materials)', bins: [{ id: 'BIN-01', name: 'B-01' }, { id: 'BIN-02', name: 'B-02' }, { id: 'BIN-03', name: 'B-03' }] },
        ]
      },
      {
        id: 'Z-TEMP',
        name: 'Climate Controlled Chamber',
        racks: [
          { id: 'RACK-C', name: 'Rack C (Polymers & Resins)', bins: [{ id: 'BIN-01', name: 'C-01' }, { id: 'BIN-02', name: 'C-02' }] }
        ]
      }
    ]
  },
  {
    id: 'WH-02',
    code: 'WH-02',
    name: 'Production Assembly Depot',
    address: 'East Wing Facility, Gate 2',
    manager: 'Elena Rostova',
    totalProducts: 28,
    totalUnits: 3410,
    capacityPercentage: 62,
    pendingReceipts: 4,
    pendingDeliveries: 3,
    internalMovements: 7,
    lowStockCount: 12,
    zones: [
      {
        id: 'Z-LINE1',
        name: 'Fabrication Feed Line',
        racks: [
          { id: 'RACK-D', name: 'Staging Rack D', bins: [{ id: 'BIN-01', name: 'D-01' }, { id: 'BIN-02', name: 'D-02' }] },
          { id: 'RACK-E', name: 'Sub-assembly Rack E', bins: [{ id: 'BIN-01', name: 'E-01' }, { id: 'BIN-02', name: 'E-02' }] }
        ]
      }
    ]
  },
  {
    id: 'WH-03',
    code: 'WH-03',
    name: 'Deep Transit & Reserve Vault',
    address: 'Sub-level Pier 9',
    manager: 'Aiden Chen',
    totalProducts: 16,
    totalUnits: 1222,
    capacityPercentage: 45,
    pendingReceipts: 2,
    pendingDeliveries: 1,
    internalMovements: 1,
    lowStockCount: 7,
    zones: [
      {
        id: 'Z-SECURE',
        name: 'Secure Vault A',
        racks: [
          { id: 'RACK-V1', name: 'High-Value Enclosure 1', bins: [{ id: 'BIN-01', name: 'V-01' }] }
        ]
      }
    ]
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    sku: 'SR-00192',
    name: 'Industrial Steel Rod 12mm',
    category: 'Raw Materials',
    uom: 'KG',
    initialStock: 1400,
    currentStock: 1482,
    reorderThreshold: 500,
    status: 'IN_STOCK',
    costPerUnit: 4.85,
    lastMovement: '26 Sep 2026, 09:42',
    description: 'High tensile structural carbon steel rod for frame fabrication.',
    barcode: '890124800192',
    locations: [
      { warehouseId: 'WH-01', warehouseName: 'Central Logistics', zone: 'Main Hall', rack: 'Rack A', bin: 'A-01', quantity: 920 },
      { warehouseId: 'WH-02', warehouseName: 'Production Depot', zone: 'Line 1', rack: 'Rack D', bin: 'D-01', quantity: 410 },
      { warehouseId: 'WH-01', warehouseName: 'Central Logistics', zone: 'Main Hall', rack: 'Rack B', bin: 'B-02', quantity: 152 },
    ]
  },
  {
    id: 'prod-002',
    sku: 'ALU-1049',
    name: 'Anodized Aluminum Sheets 4x8',
    category: 'Raw Materials',
    uom: 'KG',
    initialStock: 3500,
    currentStock: 3240,
    reorderThreshold: 1200,
    status: 'IN_STOCK',
    costPerUnit: 9.20,
    lastMovement: '26 Sep 2026, 08:15',
    description: 'Corrosion resistant aerospace-grade 6061-T6 sheets.',
    barcode: '890124801049',
    locations: [
      { warehouseId: 'WH-01', warehouseName: 'Central Logistics', zone: 'Main Hall', rack: 'Rack B', bin: 'B-01', quantity: 2400 },
      { warehouseId: 'WH-02', warehouseName: 'Production Depot', zone: 'Line 1', rack: 'Rack E', bin: 'E-01', quantity: 840 },
    ]
  },
  {
    id: 'prod-003',
    sku: 'RES-8821',
    name: 'Industrial Polymer Resin EP-4',
    category: 'Chemicals & Polymers',
    uom: 'LTR',
    initialStock: 800,
    currentStock: 185,
    reorderThreshold: 250,
    status: 'LOW_STOCK',
    costPerUnit: 18.50,
    lastMovement: '25 Sep 2026, 17:30',
    description: 'Two-part structural epoxy matrix for high-durability bonding.',
    barcode: '890124808821',
    locations: [
      { warehouseId: 'WH-01', warehouseName: 'Central Logistics', zone: 'Climate Chamber', rack: 'Rack C', bin: 'C-01', quantity: 185 },
    ]
  },
  {
    id: 'prod-004',
    sku: 'BRG-5510',
    name: 'Precision Ball Bearings 6205-2RS',
    category: 'Components',
    uom: 'PCS',
    initialStock: 2500,
    currentStock: 48,
    reorderThreshold: 200,
    status: 'LOW_STOCK',
    costPerUnit: 3.40,
    lastMovement: '26 Sep 2026, 07:11',
    description: 'Dual rubber sealed deep groove chrome steel ball bearing.',
    barcode: '890124805510',
    locations: [
      { warehouseId: 'WH-02', warehouseName: 'Production Depot', zone: 'Line 1', rack: 'Rack D', bin: 'D-02', quantity: 48 },
    ]
  },
  {
    id: 'prod-005',
    sku: 'HYD-0412',
    name: 'Hydraulic Directional Control Valve',
    category: 'Hardware',
    uom: 'PCS',
    initialStock: 120,
    currentStock: 0,
    reorderThreshold: 15,
    status: 'OUT_OF_STOCK',
    costPerUnit: 145.00,
    lastMovement: '24 Sep 2026, 14:02',
    description: 'Solenoid actuated monoblock hydraulic valve 315 bar.',
    barcode: '890124800412',
    locations: []
  },
  {
    id: 'prod-006',
    sku: 'COP-9901',
    name: 'Braided Copper Busbar Cable',
    category: 'Electrical',
    uom: 'MTR',
    initialStock: 4000,
    currentStock: 3820,
    reorderThreshold: 1000,
    status: 'IN_STOCK',
    costPerUnit: 7.60,
    lastMovement: '25 Sep 2026, 11:20',
    description: 'Electrolytic tinned copper braid with high ampacity flex.',
    barcode: '890124809901',
    locations: [
      { warehouseId: 'WH-01', warehouseName: 'Central Logistics', zone: 'Main Hall', rack: 'Rack A', bin: 'A-02', quantity: 2800 },
      { warehouseId: 'WH-03', warehouseName: 'Deep Transit Vault', zone: 'Secure Vault A', rack: 'High-Value Enclosure 1', bin: 'V-01', quantity: 1020 },
    ]
  },
  {
    id: 'prod-007',
    sku: 'FAS-7740',
    name: 'Hex Flange Bolts Grade 8.8 M10',
    category: 'Fasteners',
    uom: 'BOX',
    initialStock: 600,
    currentStock: 580,
    reorderThreshold: 100,
    status: 'IN_STOCK',
    costPerUnit: 22.00,
    lastMovement: '26 Sep 2026, 06:45',
    description: 'Pack of 100 zinc-plated structural hex bolts.',
    barcode: '890124807740',
    locations: [
      { warehouseId: 'WH-01', warehouseName: 'Central Logistics', zone: 'Main Hall', rack: 'Rack B', bin: 'B-03', quantity: 380 },
      { warehouseId: 'WH-02', warehouseName: 'Production Depot', zone: 'Line 1', rack: 'Rack E', bin: 'E-02', quantity: 200 },
    ]
  },
  {
    id: 'prod-008',
    sku: 'CHR-3001',
    name: 'Ergonomic Warehouse Command Chair',
    category: 'Furnishings',
    uom: 'PCS',
    initialStock: 150,
    currentStock: 127,
    reorderThreshold: 30,
    status: 'IN_STOCK',
    costPerUnit: 180.00,
    lastMovement: '26 Sep 2026, 09:12',
    description: 'Heavy duty lumbar support swivel chair for control operators.',
    barcode: '890124803001',
    locations: [
      { warehouseId: 'WH-01', warehouseName: 'Central Logistics', zone: 'Main Hall', rack: 'Rack B', bin: 'B-02', quantity: 127 },
    ]
  }
];

export const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: 'LED-001',
    eventId: 'RCP-042',
    type: 'RECEIPT',
    timestamp: '26 Sep 2026, 09:42',
    productId: 'prod-001',
    productName: 'Industrial Steel Rod 12mm',
    sku: 'SR-00192',
    from: 'Vendor: Apex Steel Corp',
    to: 'WH-01 / Rack A / A-01',
    quantity: 100,
    uom: 'KG',
    user: 'M. Vance (Logistics)',
    status: 'DONE',
    balanceAfter: 1482
  },
  {
    id: 'LED-002',
    eventId: 'TRF-018',
    type: 'TRANSFER',
    timestamp: '26 Sep 2026, 09:15',
    productId: 'prod-001',
    productName: 'Industrial Steel Rod 12mm',
    sku: 'SR-00192',
    from: 'WH-01 / Rack A',
    to: 'WH-02 / Production Rack D',
    quantity: 100,
    uom: 'KG',
    user: 'E. Rostova (Assembly)',
    status: 'DONE',
    balanceAfter: 1382
  },
  {
    id: 'LED-003',
    eventId: 'DLV-091',
    type: 'DELIVERY',
    timestamp: '26 Sep 2026, 08:50',
    productId: 'prod-008',
    productName: 'Ergonomic Command Chair',
    sku: 'CHR-3001',
    from: 'WH-01 / Rack B',
    to: 'Customer: Vertex Industries',
    quantity: -20,
    uom: 'PCS',
    user: 'D. Miller (Fulfillment)',
    status: 'PENDING',
    balanceAfter: 127
  },
  {
    id: 'LED-004',
    eventId: 'ADJ-007',
    type: 'ADJUSTMENT',
    timestamp: '26 Sep 2026, 08:20',
    productId: 'prod-002',
    productName: 'Anodized Aluminum Sheets',
    sku: 'ALU-1049',
    from: 'WH-01 / Physical Count',
    to: 'Stock Variance Calibration',
    quantity: -3,
    uom: 'KG',
    user: 'A. Chen (Auditor)',
    status: 'DONE',
    balanceAfter: 3240
  },
  {
    id: 'LED-005',
    eventId: 'RCP-041',
    type: 'RECEIPT',
    timestamp: '25 Sep 2026, 16:30',
    productId: 'prod-006',
    productName: 'Braided Copper Busbar Cable',
    sku: 'COP-9901',
    from: 'Vendor: ElectroCore Ltd',
    to: 'WH-03 / Secure Vault A',
    quantity: 500,
    uom: 'MTR',
    user: 'A. Chen (Auditor)',
    status: 'DONE',
    balanceAfter: 3820
  }
];

export const INITIAL_RECEIPTS: ReceiptOrder[] = [
  {
    id: 'RCP-042',
    reference: 'PO-2026-0891',
    supplier: 'Apex Steel Corp',
    destinationWarehouseId: 'WH-01',
    destinationLocation: 'WH-01 / Rack A / Bin A-01',
    scheduledDate: '2026-09-26',
    items: [
      { productId: 'prod-001', productName: 'Industrial Steel Rod 12mm', sku: 'SR-00192', quantity: 100, uom: 'KG' }
    ],
    status: 'DONE',
    operator: 'M. Vance',
    createdAt: '2026-09-25 14:00',
    validatedAt: '2026-09-26 09:42',
    notes: 'Incoming raw alloy consignment inspected and verified.'
  },
  {
    id: 'RCP-043',
    reference: 'PO-2026-0904',
    supplier: 'NovaTech Bearings AG',
    destinationWarehouseId: 'WH-02',
    destinationLocation: 'WH-02 / Line 1 / Staging Rack D',
    scheduledDate: '2026-09-27',
    items: [
      { productId: 'prod-004', productName: 'Precision Ball Bearings 6205-2RS', sku: 'BRG-5510', quantity: 500, uom: 'PCS' }
    ],
    status: 'READY',
    operator: 'E. Rostova',
    createdAt: '2026-09-26 08:30',
    notes: 'Urgent replenishment for production line.'
  },
  {
    id: 'RCP-044',
    reference: 'PO-2026-0918',
    supplier: 'HydroTech Dynamics',
    destinationWarehouseId: 'WH-01',
    destinationLocation: 'WH-01 / Main Storage / Rack B',
    scheduledDate: '2026-09-28',
    items: [
      { productId: 'prod-005', productName: 'Hydraulic Directional Control Valve', sku: 'HYD-0412', quantity: 25, uom: 'PCS' }
    ],
    status: 'WAITING',
    operator: 'M. Vance',
    createdAt: '2026-09-26 09:00',
    notes: 'Awaiting customs port clearance.'
  },
  {
    id: 'RCP-045',
    reference: 'PO-2026-0925',
    supplier: 'PolyMerix Specialty Chemicals',
    destinationWarehouseId: 'WH-01',
    destinationLocation: 'WH-01 / Climate Chamber / Rack C',
    scheduledDate: '2026-09-29',
    items: [
      { productId: 'prod-003', productName: 'Industrial Polymer Resin EP-4', sku: 'RES-8821', quantity: 200, uom: 'LTR' }
    ],
    status: 'DRAFT',
    operator: 'M. Vance',
    createdAt: '2026-09-26 10:15',
    notes: 'Draft requisition awaiting purchase approval.'
  }
];

export const INITIAL_DELIVERIES: DeliveryOrder[] = [
  {
    id: 'DLV-091',
    reference: 'SO-2026-1102',
    customer: 'Vertex Industries Ltd',
    sourceWarehouseId: 'WH-01',
    sourceLocation: 'WH-01 / Rack B / Bin B-02',
    scheduledDate: '2026-09-26',
    items: [
      { productId: 'prod-008', productName: 'Ergonomic Command Chair', sku: 'CHR-3001', quantity: 20, uom: 'PCS', availableStock: 127 }
    ],
    stage: 'PACKING',
    status: 'WAITING',
    operator: 'D. Miller',
    createdAt: '2026-09-25 16:00',
    notes: 'Priority dispatch for new site setup.'
  },
  {
    id: 'DLV-092',
    reference: 'SO-2026-1115',
    customer: 'Aerospace Dynamics Corp',
    sourceWarehouseId: 'WH-01',
    sourceLocation: 'WH-01 / Rack B / Bin B-01',
    scheduledDate: '2026-09-27',
    items: [
      { productId: 'prod-002', productName: 'Anodized Aluminum Sheets 4x8', sku: 'ALU-1049', quantity: 200, uom: 'KG', availableStock: 3240 }
    ],
    stage: 'PICKING',
    status: 'READY',
    operator: 'D. Miller',
    createdAt: '2026-09-26 07:45',
    notes: 'Certificate of conformance required on delivery.'
  },
  {
    id: 'DLV-093',
    reference: 'SO-2026-1120',
    customer: 'Titan Heavy Manufacturing',
    sourceWarehouseId: 'WH-01',
    sourceLocation: 'WH-01 / Rack A / Bin A-01',
    scheduledDate: '2026-09-28',
    items: [
      { productId: 'prod-001', productName: 'Industrial Steel Rod 12mm', sku: 'SR-00192', quantity: 150, uom: 'KG', availableStock: 1482 }
    ],
    stage: 'DRAFT',
    status: 'DRAFT',
    operator: 'D. Miller',
    createdAt: '2026-09-26 09:30',
    notes: 'Draft dispatch schedule.'
  }
];

export const INITIAL_TRANSFERS: InternalTransfer[] = [
  {
    id: 'TRF-018',
    reference: 'IT-2026-0418',
    productId: 'prod-001',
    productName: 'Industrial Steel Rod 12mm',
    sku: 'SR-00192',
    quantity: 100,
    uom: 'KG',
    sourceWarehouseId: 'WH-01',
    sourceLocation: 'WH-01 / Rack A (Main Hall)',
    destinationWarehouseId: 'WH-02',
    destinationLocation: 'WH-02 / Line 1 (Staging Rack D)',
    status: 'DONE',
    timestamp: '26 Sep 2026, 09:15',
    operator: 'E. Rostova',
    notes: 'Material transfer for scheduled batch 404.'
  },
  {
    id: 'TRF-019',
    reference: 'IT-2026-0422',
    productId: 'prod-007',
    productName: 'Hex Flange Bolts Grade 8.8',
    sku: 'FAS-7740',
    quantity: 50,
    uom: 'BOX',
    sourceWarehouseId: 'WH-01',
    sourceLocation: 'WH-01 / Rack B',
    destinationWarehouseId: 'WH-02',
    destinationLocation: 'WH-02 / Line 1 / Sub-assembly Rack E',
    status: 'READY',
    timestamp: '26 Sep 2026, 10:00',
    operator: 'M. Vance',
    notes: 'Replenishing production line fasteners.'
  }
];

export const INITIAL_ADJUSTMENTS: InventoryAdjustment[] = [
  {
    id: 'ADJ-007',
    reference: 'ADJ-2026-0007',
    productId: 'prod-002',
    productName: 'Anodized Aluminum Sheets 4x8',
    sku: 'ALU-1049',
    warehouseId: 'WH-01',
    location: 'WH-01 / Rack B / Bin B-01',
    systemQuantity: 3243,
    physicalCount: 3240,
    variance: -3,
    uom: 'KG',
    reason: 'Damage / Spoilage',
    status: 'DONE',
    operator: 'A. Chen',
    timestamp: '26 Sep 2026, 08:20',
    notes: 'Edge damage during handling; quarantined for scrap evaluation.'
  }
];

// ─── Store Class & Singleton ────────────────────────────────────────────────

interface StoreState {
  products: Product[];
  receipts: ReceiptOrder[];
  deliveries: DeliveryOrder[];
  transfers: InternalTransfer[];
  adjustments: InventoryAdjustment[];
  ledger: LedgerEntry[];
  warehouses: Warehouse[];
}

type Listener = () => void;

class StockSenseStore {
  private state: StoreState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.loadState();
    this.syncWithBackend();
  }

  public async syncWithBackend(): Promise<void> {
    try {
      const [prodsRes, whRes, rcpRes, dlvRes, trfRes, adjRes, ledgerRes] = await Promise.allSettled([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/warehouses').then((r) => r.json()),
        fetch('/api/receipts').then((r) => r.json()),
        fetch('/api/deliveries').then((r) => r.json()),
        fetch('/api/transfers').then((r) => r.json()),
        fetch('/api/adjustments').then((r) => r.json()),
        fetch('/api/move-history').then((r) => r.json()),
      ]);

      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value?.data) && prodsRes.value.data.length > 0) {
        this.state.products = prodsRes.value.data;
      }
      if (whRes.status === 'fulfilled' && Array.isArray(whRes.value?.data) && whRes.value.data.length > 0) {
        this.state.warehouses = whRes.value.data;
      }
      if (rcpRes.status === 'fulfilled' && Array.isArray(rcpRes.value?.data) && rcpRes.value.data.length > 0) {
        this.state.receipts = rcpRes.value.data;
      }
      if (dlvRes.status === 'fulfilled' && Array.isArray(dlvRes.value?.data) && dlvRes.value.data.length > 0) {
        this.state.deliveries = dlvRes.value.data;
      }
      if (trfRes.status === 'fulfilled' && Array.isArray(trfRes.value?.data) && trfRes.value.data.length > 0) {
        this.state.transfers = trfRes.value.data;
      }
      if (adjRes.status === 'fulfilled' && Array.isArray(adjRes.value?.data) && adjRes.value.data.length > 0) {
        this.state.adjustments = adjRes.value.data;
      }
      if (ledgerRes.status === 'fulfilled' && Array.isArray(ledgerRes.value?.data) && ledgerRes.value.data.length > 0) {
        this.state.ledger = ledgerRes.value.data;
      }

      this.saveState();
      this.notify();
    } catch (err) {
      console.warn('[StockSenseStore] Backend sync fallback to cache:', err);
    }
  }

  private loadState(): StoreState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.products) && parsed.products.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[StockSense] Error loading state from storage, falling back to defaults:', e);
    }

    return {
      products: INITIAL_PRODUCTS,
      receipts: INITIAL_RECEIPTS,
      deliveries: INITIAL_DELIVERIES,
      transfers: INITIAL_TRANSFERS,
      adjustments: INITIAL_ADJUSTMENTS,
      ledger: INITIAL_LEDGER,
      warehouses: INITIAL_WAREHOUSES,
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('[StockSense] Error saving state:', e);
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  public getProducts(): Product[] {
    return this.state.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.state.products.find((p) => p.id === id || p.sku === id);
  }

  public getReceipts(): ReceiptOrder[] {
    return this.state.receipts;
  }

  public getDeliveries(): DeliveryOrder[] {
    return this.state.deliveries;
  }

  public getTransfers(): InternalTransfer[] {
    return this.state.transfers;
  }

  public getAdjustments(): InventoryAdjustment[] {
    return this.state.adjustments;
  }

  public getLedger(): LedgerEntry[] {
    return this.state.ledger;
  }

  public getWarehouses(): Warehouse[] {
    return this.state.warehouses;
  }

  public getStats(): StockSenseStats {
    const totalUnits = this.state.products.reduce((sum, p) => sum + p.currentStock, 0);
    const lowStockCount = this.state.products.filter((p) => p.status === 'LOW_STOCK').length;
    const outOfStockCount = this.state.products.filter((p) => p.status === 'OUT_OF_STOCK').length;
    const pendingReceiptsCount = this.state.receipts.filter((r) => r.status === 'WAITING' || r.status === 'READY' || r.status === 'DRAFT').length;
    const pendingDeliveriesCount = this.state.deliveries.filter((d) => d.status === 'WAITING' || d.status === 'READY' || d.status === 'DRAFT').length;
    const scheduledTransfersCount = this.state.transfers.filter((t) => t.status === 'READY' || t.status === 'DRAFT').length;

    return {
      totalUnits,
      totalProductsCount: this.state.products.length,
      lowStockCount,
      outOfStockCount,
      pendingReceiptsCount,
      pendingDeliveriesCount,
      scheduledTransfersCount,
      recentMovements: this.state.ledger.slice(0, 10),
    };
  }

  // ─── Mutations: Products ──────────────────────────────────────────────────

  public createProduct(data: Omit<Product, 'id' | 'currentStock' | 'status' | 'lastMovement'> & { initialStock: number }): Product {
    const id = 'prod-' + Date.now().toString(36);
    const currentStock = data.initialStock;
    const status = currentStock <= 0 ? 'OUT_OF_STOCK' : currentStock <= data.reorderThreshold ? 'LOW_STOCK' : 'IN_STOCK';
    const nowStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newProduct: Product = {
      ...data,
      id,
      currentStock,
      status,
      lastMovement: nowStr,
    };

    this.state.products = [newProduct, ...this.state.products];

    // Initial stock ledger entry
    if (currentStock > 0) {
      const ledgerEntry: LedgerEntry = {
        id: 'LED-' + Math.floor(1000 + Math.random() * 9000),
        eventId: 'INIT-' + newProduct.sku,
        type: 'RECEIPT',
        timestamp: nowStr,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        from: 'System Initial Stock',
        to: newProduct.locations[0]?.warehouseName || 'WH-01 Storage',
        quantity: currentStock,
        uom: newProduct.uom,
        user: 'Administrator',
        status: 'DONE',
        balanceAfter: currentStock,
      };
      this.state.ledger = [ledgerEntry, ...this.state.ledger];
    }

    this.saveState();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product {
    const idx = this.state.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Product not found: ${id}`);

    const existing = this.state.products[idx];
    const updated = { ...existing, ...updates };

    // recalculate status
    if (updated.currentStock <= 0) {
      updated.status = 'OUT_OF_STOCK';
    } else if (updated.currentStock <= updated.reorderThreshold) {
      updated.status = 'LOW_STOCK';
    } else {
      updated.status = 'IN_STOCK';
    }

    this.state.products[idx] = updated;
    this.saveState();
    return updated;
  }

  // ─── Mutations: Receipts (Incoming Goods) ──────────────────────────────────

  public createReceipt(data: Omit<ReceiptOrder, 'id' | 'createdAt'>): ReceiptOrder {
    const id = 'RCP-' + String(this.state.receipts.length + 42).padStart(3, '0');
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newReceipt: ReceiptOrder = {
      ...data,
      id,
      createdAt: nowStr,
    };

    this.state.receipts = [newReceipt, ...this.state.receipts];
    this.saveState();
    return newReceipt;
  }

  public validateReceipt(id: string): { success: boolean; message: string; receipt: ReceiptOrder } {
    const rIdx = this.state.receipts.findIndex((r) => r.id === id);
    if (rIdx === -1) throw new Error(`Receipt ${id} not found`);

    const receipt = this.state.receipts[rIdx];
    if (receipt.status === 'DONE') {
      return { success: false, message: 'Receipt has already been validated and added to stock.', receipt };
    }

    const nowStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Increase product stock for all items
    for (const item of receipt.items) {
      const pIdx = this.state.products.findIndex((p) => p.id === item.productId || p.sku === item.sku);
      if (pIdx !== -1) {
        const prod = this.state.products[pIdx];
        const newStock = prod.currentStock + item.quantity;
        prod.currentStock = newStock;
        prod.lastMovement = nowStr;
        prod.status = newStock <= 0 ? 'OUT_OF_STOCK' : newStock <= prod.reorderThreshold ? 'LOW_STOCK' : 'IN_STOCK';

        // Add to location
        const loc = prod.locations.find((l) => l.warehouseId === receipt.destinationWarehouseId);
        if (loc) {
          loc.quantity += item.quantity;
        } else {
          prod.locations.push({
            warehouseId: receipt.destinationWarehouseId,
            warehouseName: receipt.destinationWarehouseId,
            zone: 'Receipt Staging',
            rack: 'Dock Bay',
            bin: '01',
            quantity: item.quantity,
          });
        }

        // Create permanent ledger entry
        const ledgerEntry: LedgerEntry = {
          id: 'LED-' + Math.floor(1000 + Math.random() * 9000),
          eventId: receipt.id,
          type: 'RECEIPT',
          timestamp: nowStr,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          from: `Vendor: ${receipt.supplier}`,
          to: receipt.destinationLocation,
          quantity: item.quantity,
          uom: item.uom,
          user: receipt.operator || 'Inventory Manager',
          status: 'DONE',
          balanceAfter: newStock,
        };

        this.state.ledger = [ledgerEntry, ...this.state.ledger];
      }
    }

    receipt.status = 'DONE';
    receipt.validatedAt = nowStr;
    this.state.receipts[rIdx] = receipt;

    this.saveState();
    return { success: true, message: `Receipt ${receipt.id} successfully validated. Stock increased.`, receipt };
  }

  // ─── Mutations: Delivery Orders (Outgoing Goods) ───────────────────────────

  public createDelivery(data: Omit<DeliveryOrder, 'id' | 'createdAt'>): DeliveryOrder {
    const id = 'DLV-' + String(this.state.deliveries.length + 91).padStart(3, '0');
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newDelivery: DeliveryOrder = {
      ...data,
      id,
      createdAt: nowStr,
    };

    this.state.deliveries = [newDelivery, ...this.state.deliveries];
    this.saveState();
    return newDelivery;
  }

  public validateDelivery(id: string): { success: boolean; message: string; delivery: DeliveryOrder } {
    const dIdx = this.state.deliveries.findIndex((d) => d.id === id);
    if (dIdx === -1) throw new Error(`Delivery ${id} not found`);

    const delivery = this.state.deliveries[dIdx];
    if (delivery.status === 'DONE') {
      return { success: false, message: 'Delivery has already been validated and stock deducted.', delivery };
    }

    // Pre-flight check: verify sufficient stock for ALL items
    for (const item of delivery.items) {
      const prod = this.state.products.find((p) => p.id === item.productId || p.sku === item.sku);
      if (!prod) {
        return { success: false, message: `Product ${item.productName} (${item.sku}) does not exist in catalog.`, delivery };
      }
      if (prod.currentStock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for ${prod.name} (${prod.sku}). Required: ${item.quantity} ${item.uom}, Available: ${prod.currentStock} ${item.uom}. Operation prevented.`,
          delivery,
        };
      }
    }

    const nowStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // Deduct stock for all items
    for (const item of delivery.items) {
      const pIdx = this.state.products.findIndex((p) => p.id === item.productId || p.sku === item.sku);
      const prod = this.state.products[pIdx];
      const newStock = prod.currentStock - item.quantity;
      prod.currentStock = newStock;
      prod.lastMovement = nowStr;
      prod.status = newStock <= 0 ? 'OUT_OF_STOCK' : newStock <= prod.reorderThreshold ? 'LOW_STOCK' : 'IN_STOCK';

      // Deduct from location
      const loc = prod.locations.find((l) => l.warehouseId === delivery.sourceWarehouseId) || prod.locations[0];
      if (loc) {
        loc.quantity = Math.max(0, loc.quantity - item.quantity);
      }

      // Create permanent ledger entry
      const ledgerEntry: LedgerEntry = {
        id: 'LED-' + Math.floor(1000 + Math.random() * 9000),
        eventId: delivery.id,
        type: 'DELIVERY',
        timestamp: nowStr,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        from: delivery.sourceLocation,
        to: `Customer: ${delivery.customer}`,
        quantity: -item.quantity,
        uom: item.uom,
        user: delivery.operator || 'Fulfillment Officer',
        status: 'DONE',
        balanceAfter: newStock,
      };

      this.state.ledger = [ledgerEntry, ...this.state.ledger];
    }

    delivery.stage = 'DONE';
    delivery.status = 'DONE';
    delivery.validatedAt = nowStr;
    this.state.deliveries[dIdx] = delivery;

    this.saveState();
    return { success: true, message: `Delivery Order ${delivery.id} successfully completed. Stock deducted.`, delivery };
  }

  // ─── Mutations: Internal Transfers ────────────────────────────────────────

  public createTransfer(data: Omit<InternalTransfer, 'id' | 'timestamp' | 'status'> & { executeImmediately?: boolean }): { success: boolean; message: string; transfer: InternalTransfer } {
    const prod = this.state.products.find((p) => p.id === data.productId || p.sku === data.sku);
    if (!prod) throw new Error(`Product ${data.sku} not found`);

    if (prod.currentStock < data.quantity) {
      throw new Error(`Insufficient stock for transfer: required ${data.quantity} ${data.uom}, available ${prod.currentStock} ${data.uom}.`);
    }

    const id = 'TRF-' + String(this.state.transfers.length + 18).padStart(3, '0');
    const nowStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newTransfer: InternalTransfer = {
      ...data,
      id,
      timestamp: nowStr,
      status: data.executeImmediately ? 'DONE' : 'READY',
    };

    if (data.executeImmediately) {
      // Internal transfer preserves total stock, updates location distribution
      prod.lastMovement = nowStr;

      // Deduct from source location
      const srcLoc = prod.locations.find((l) => l.warehouseId === data.sourceWarehouseId);
      if (srcLoc) {
        srcLoc.quantity = Math.max(0, srcLoc.quantity - data.quantity);
      }

      // Add to destination location
      const dstLoc = prod.locations.find((l) => l.warehouseId === data.destinationWarehouseId);
      if (dstLoc) {
        dstLoc.quantity += data.quantity;
      } else {
        prod.locations.push({
          warehouseId: data.destinationWarehouseId,
          warehouseName: data.destinationWarehouseId,
          zone: 'Transferred Zone',
          rack: 'Target Rack',
          bin: '01',
          quantity: data.quantity,
        });
      }

      // Permanent ledger entry
      const ledgerEntry: LedgerEntry = {
        id: 'LED-' + Math.floor(1000 + Math.random() * 9000),
        eventId: newTransfer.id,
        type: 'TRANSFER',
        timestamp: nowStr,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        from: data.sourceLocation,
        to: data.destinationLocation,
        quantity: data.quantity,
        uom: data.uom,
        user: data.operator,
        status: 'DONE',
        balanceAfter: prod.currentStock,
      };

      this.state.ledger = [ledgerEntry, ...this.state.ledger];
    }

    this.state.transfers = [newTransfer, ...this.state.transfers];
    this.saveState();

    return {
      success: true,
      message: `Internal Transfer ${newTransfer.id} created successfully.`,
      transfer: newTransfer,
    };
  }

  // ─── Mutations: Inventory Adjustments ─────────────────────────────────────

  public createAdjustment(data: Omit<InventoryAdjustment, 'id' | 'timestamp' | 'status' | 'variance'>): { success: boolean; message: string; adjustment: InventoryAdjustment } {
    const prod = this.state.products.find((p) => p.id === data.productId || p.sku === data.sku);
    if (!prod) throw new Error(`Product ${data.sku} not found`);

    const variance = data.physicalCount - data.systemQuantity;
    const id = 'ADJ-' + String(this.state.adjustments.length + 7).padStart(3, '0');
    const nowStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newAdjustment: InventoryAdjustment = {
      ...data,
      id,
      variance,
      status: 'DONE',
      timestamp: nowStr,
    };

    // Apply new physical count to product stock
    prod.currentStock = data.physicalCount;
    prod.lastMovement = nowStr;
    prod.status = prod.currentStock <= 0 ? 'OUT_OF_STOCK' : prod.currentStock <= prod.reorderThreshold ? 'LOW_STOCK' : 'IN_STOCK';

    // Permanent ledger entry
    const ledgerEntry: LedgerEntry = {
      id: 'LED-' + Math.floor(1000 + Math.random() * 9000),
      eventId: newAdjustment.id,
      type: 'ADJUSTMENT',
      timestamp: nowStr,
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      from: `${data.location} (Physical Count: ${data.physicalCount} ${data.uom})`,
      to: `Variance: ${variance >= 0 ? '+' : ''}${variance} ${data.uom} (${data.reason})`,
      quantity: variance,
      uom: data.uom,
      user: data.operator,
      status: 'DONE',
      balanceAfter: prod.currentStock,
    };

    this.state.ledger = [ledgerEntry, ...this.state.ledger];
    this.state.adjustments = [newAdjustment, ...this.state.adjustments];
    this.saveState();

    return {
      success: true,
      message: `Inventory Adjustment ${newAdjustment.id} applied: Stock updated to ${data.physicalCount} ${data.uom} (variance: ${variance > 0 ? '+' : ''}${variance}).`,
      adjustment: newAdjustment,
    };
  }

  // ─── Reset to Factory Defaults ────────────────────────────────────────────

  public resetToDefaults(): void {
    this.state = {
      products: INITIAL_PRODUCTS,
      receipts: INITIAL_RECEIPTS,
      deliveries: INITIAL_DELIVERIES,
      transfers: INITIAL_TRANSFERS,
      adjustments: INITIAL_ADJUSTMENTS,
      ledger: INITIAL_LEDGER,
      warehouses: INITIAL_WAREHOUSES,
    };
    this.saveState();
  }
}

// Global Singleton Instance
export const stockSenseStore = new StockSenseStore();
