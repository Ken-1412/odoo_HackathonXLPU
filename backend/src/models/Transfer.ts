import mongoose, { Schema, Document, Types } from 'mongoose';
import { OperationSource } from './StockLedger';

export type TransferStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface ITransferItem {
  productId: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitOfMeasure: string;
}

export interface ITransfer extends Document {
  reference: string;
  fromWarehouseId: Types.ObjectId;
  fromLocationId: Types.ObjectId;
  toWarehouseId: Types.ObjectId;
  toLocationId: Types.ObjectId;
  lines: ITransferItem[];
  status: TransferStatus;
  scheduledDate?: Date;
  responsibleUserId?: Types.ObjectId | string;
  responsibleName?: string;
  notes?: string;
  source: OperationSource;
  validatedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferItemSchema = new Schema<ITransferItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitOfMeasure: { type: String, default: 'PCS' },
  },
  { _id: false }
);

const TransferSchema = new Schema<ITransfer>(
  {
    reference: { type: String, required: true, unique: true, uppercase: true, index: true },
    fromWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    fromLocationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    toLocationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
    lines: [TransferItemSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'],
      default: 'DRAFT',
      index: true,
    },
    scheduledDate: { type: Date, default: () => new Date() },
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

export const Transfer = mongoose.models.Transfer || mongoose.model<ITransfer>('Transfer', TransferSchema);
