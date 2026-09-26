import mongoose, { Schema, Document, Types } from 'mongoose';
import { OperationSource } from './StockLedger';

export type ReceiptStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface IReceiptItem {
  productId: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  receivedQuantity: number;
  unitOfMeasure: string;
}

export interface IReceipt extends Document {
  reference: string;
  supplier: string;
  warehouseId: Types.ObjectId;
  locationId?: Types.ObjectId;
  scheduledDate?: Date;
  status: ReceiptStatus;
  lines: IReceiptItem[];
  responsibleUserId?: Types.ObjectId | string;
  responsibleName?: string;
  notes?: string;
  source: OperationSource;
  validatedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptItemSchema = new Schema<IReceiptItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    receivedQuantity: { type: Number, default: 0 },
    unitOfMeasure: { type: String, default: 'PCS' },
  },
  { _id: false }
);

const ReceiptSchema = new Schema<IReceipt>(
  {
    reference: { type: String, required: true, unique: true, uppercase: true, index: true },
    supplier: { type: String, required: true, trim: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    scheduledDate: { type: Date, default: () => new Date() },
    status: {
      type: String,
      enum: ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'],
      default: 'DRAFT',
      index: true,
    },
    lines: [ReceiptItemSchema],
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

export const Receipt = mongoose.models.Receipt || mongoose.model<IReceipt>('Receipt', ReceiptSchema);
