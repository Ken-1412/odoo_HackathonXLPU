/**
 * StockSense — Core Domain Types
 * Industrial Archive & Warehouse Control Room
 */

export type UOM = 'KG' | 'PCS' | 'MTR' | 'BOX' | 'LTR' | 'TONS' | 'PALLET';

export type ProductStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface LocationQuantity {
  warehouseId: string;
  warehouseName: string;
  zone: string;
  rack: string;
  bin: string;
  quantity: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  uom: UOM;
  initialStock: number;
  currentStock: number;
  reorderThreshold: number;
  status: ProductStatus;
  locations: LocationQuantity[];
  costPerUnit: number;
  lastMovement: string;
  description?: string;
  barcode?: string;
}

export type OperationStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface ReceiptItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  uom: UOM;
}

export interface ReceiptOrder {
  id: string; // e.g. "RCP-042"
  reference: string;
  supplier: string;
  destinationWarehouseId: string;
  destinationLocation: string;
  scheduledDate: string;
  items: ReceiptItem[];
  status: OperationStatus;
  operator: string;
  createdAt: string;
  validatedAt?: string;
  notes?: string;
}

export type DeliveryStage = 'DRAFT' | 'PICKING' | 'PACKING' | 'READY' | 'DONE' | 'CANCELED';

export interface DeliveryItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  uom: UOM;
  availableStock: number;
}

export interface DeliveryOrder {
  id: string; // e.g. "DLV-091"
  reference: string;
  customer: string;
  sourceWarehouseId: string;
  sourceLocation: string;
  scheduledDate: string;
  items: DeliveryItem[];
  stage: DeliveryStage;
  status: OperationStatus;
  operator: string;
  createdAt: string;
  validatedAt?: string;
  notes?: string;
}

export interface InternalTransfer {
  id: string; // e.g. "TRF-018"
  reference: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  uom: UOM;
  sourceWarehouseId: string;
  sourceLocation: string;
  destinationWarehouseId: string;
  destinationLocation: string;
  status: OperationStatus;
  timestamp: string;
  operator: string;
  notes?: string;
}

export interface InventoryAdjustment {
  id: string; // e.g. "ADJ-007"
  reference: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  location: string;
  systemQuantity: number;
  physicalCount: number;
  variance: number; // physicalCount - systemQuantity
  uom: UOM;
  reason: 'Cycle Count' | 'Damage / Spoilage' | 'Misplaced Goods Found' | 'Audited Mismatch' | 'Theft / Loss' | 'Other';
  status: 'DRAFT' | 'DONE';
  operator: string;
  timestamp: string;
  notes?: string;
}

export type LedgerEventType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT';

export interface LedgerEntry {
  id: string;
  eventId: string; // e.g. "RCP-042", "TRF-018", "DLV-091", "ADJ-007"
  type: LedgerEventType;
  timestamp: string;
  productId: string;
  productName: string;
  sku: string;
  from: string;
  to: string;
  quantity: number; // positive (+) for incoming, negative (-) for outgoing, unsigned for internal transfer
  uom: UOM;
  user: string;
  status: 'DONE' | 'PENDING' | 'CANCELED';
  balanceAfter?: number;
}

export interface WarehouseBin {
  id: string;
  name: string;
  capacity?: number;
}

export interface WarehouseRack {
  id: string;
  name: string;
  bins: WarehouseBin[];
}

export interface WarehouseZone {
  id: string;
  name: string;
  racks: WarehouseRack[];
}

export interface Warehouse {
  id: string;
  code: string; // e.g. "WH-01"
  name: string;
  address: string;
  zones: WarehouseZone[];
  totalProducts: number;
  totalUnits: number;
  capacityPercentage: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  internalMovements: number;
  lowStockCount: number;
  manager: string;
}

export interface StockSenseStats {
  totalUnits: number;
  totalProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceiptsCount: number;
  pendingDeliveriesCount: number;
  scheduledTransfersCount: number;
  recentMovements: LedgerEntry[];
}
