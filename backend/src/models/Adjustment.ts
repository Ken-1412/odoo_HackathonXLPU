import mongoose, { Schema, Document, Types } from 'mongoose';
import { OperationSource } from './StockLedger';

export type AdjustmentStatus = 'DRAFT' | 'DONE' | 'CANCELED';

export interface IAdjustment extends Document {
  reference: string;
  productId: Types.ObjectId;
  productName: string;
  sku: string;
  warehouseId: Types.ObjectId;
  locationId: Types.ObjectId;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  reason: string;
  status: AdjustmentStatus;
  responsibleUserId?: Types.ObjectId | string;
  responsibleName?: string;
  notes?: string;
  source: OperationSource;
  validatedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdjustmentSchema = new Schema<IAdjustment>(
  {
    reference: { type: String, required: true, unique: true, uppercase: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    systemQuantity: { type: Number, required: true },
    countedQuantity: { type: Number, required: true },
    difference: { type: Number, required: true }, // countedQuantity - systemQuantity
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['DRAFT', 'DONE', 'CANCELED'],
      default: 'DRAFT',
      index: true,
    },
    responsibleUserId: { type: Schema.Types.Mixed },
    responsibleName: { type: String, default: 'Inventory Manager' },
    notes: { type: String },
    source: {
      type: String,
      enum: ['MANUAL', 'VOICE_AI', 'SYSTEM'],
      default: 'MANUAL',
    },
    validatedAt: { type: Date },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export const Adjustment = mongoose.models.Adjustment || mongoose.model<IAdjustment>('Adjustment', AdjustmentSchema);
