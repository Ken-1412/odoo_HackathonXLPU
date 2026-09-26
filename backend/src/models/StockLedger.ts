import mongoose, { Schema, Document, Types } from 'mongoose';

export type MovementType =
  | 'RECEIPT'
  | 'DELIVERY'
  | 'INTERNAL_TRANSFER'
  | 'ADJUSTMENT'
  | 'RESERVATION'
  | 'RELEASE';

export type OperationSource = 'MANUAL' | 'VOICE_AI' | 'SYSTEM';

export interface IStockLedger extends Document {
  productId: Types.ObjectId;
  productName: string;
  sku: string;
  warehouseId?: Types.ObjectId;
  locationId?: Types.ObjectId;
  movementType: MovementType;
  quantity: number; // positive (+) for incoming, negative (-) for outgoing, unsigned for internal transfer
  quantityBefore: number;
  quantityAfter: number;
  fromWarehouseId?: Types.ObjectId;
  fromLocationId?: Types.ObjectId;
  fromLocationName?: string;
  toWarehouseId?: Types.ObjectId;
  toLocationId?: Types.ObjectId;
  toLocationName?: string;
  referenceType?: string;
  referenceId: string;
  reason?: string;
  performedBy: string;
  source: OperationSource;
  createdAt: Date;
}

const StockLedgerSchema = new Schema<IStockLedger>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    movementType: {
      type: String,
      enum: ['RECEIPT', 'DELIVERY', 'INTERNAL_TRANSFER', 'ADJUSTMENT', 'RESERVATION', 'RELEASE'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    quantityBefore: { type: Number, required: true, default: 0 },
    quantityAfter: { type: Number, required: true, default: 0 },
    fromWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    fromLocationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    fromLocationName: { type: String },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    toLocationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    toLocationName: { type: String },
    referenceType: { type: String },
    referenceId: { type: String, required: true, index: true },
    reason: { type: String },
    performedBy: { type: String, required: true, default: 'System' },
    source: {
      type: String,
      enum: ['MANUAL', 'VOICE_AI', 'SYSTEM'],
      default: 'MANUAL',
      index: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockLedgerSchema.index({ createdAt: -1 });

export const StockLedger = mongoose.models.StockLedger || mongoose.model<IStockLedger>('StockLedger', StockLedgerSchema);
