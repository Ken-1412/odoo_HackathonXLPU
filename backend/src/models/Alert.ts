import mongoose, { Schema, Document, Types } from 'mongoose';

export type AlertType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'NEGATIVE_STOCK_ATTEMPT'
  | 'RECEIPT_PENDING'
  | 'DELIVERY_PENDING';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface IAlert extends Document {
  type: AlertType;
  title: string;
  message: string;
  productId?: Types.ObjectId;
  productName?: string;
  sku?: string;
  warehouseId?: Types.ObjectId;
  locationId?: Types.ObjectId;
  referenceId?: string;
  severity: AlertSeverity;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    type: {
      type: String,
      enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'NEGATIVE_STOCK_ATTEMPT', 'RECEIPT_PENDING', 'DELIVERY_PENDING'],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String },
    sku: { type: String },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    referenceId: { type: String },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning',
    },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AlertSchema.index({ type: 1, productId: 1, isRead: 1 });

export const Alert = mongoose.models.Alert || mongoose.model<IAlert>('Alert', AlertSchema);
