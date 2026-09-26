import mongoose, { Schema, Document, Types } from 'mongoose';
import { OperationSource } from './StockLedger';

export type DeliveryStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';
export type DeliveryStage = 'DRAFT' | 'PICKING' | 'PACKING' | 'READY' | 'DONE' | 'CANCELED';

export interface IDeliveryItem {
  productId: Types.ObjectId;
  productName: string;
  sku: string;
  quantity: number;
  unitOfMeasure: string;
}

export interface IDelivery extends Document {
  reference: string;
  customer: string;
  deliveryAddress?: string;
  warehouseId: Types.ObjectId;
  locationId?: Types.ObjectId;
  scheduledDate?: Date;
  status: DeliveryStatus;
  stage: DeliveryStage;
  lines: IDeliveryItem[];
  responsibleUserId?: Types.ObjectId | string;
  responsibleName?: string;
  notes?: string;
  source: OperationSource;
  validatedAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryItemSchema = new Schema<IDeliveryItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitOfMeasure: { type: String, default: 'PCS' },
  },
  { _id: false }
);

const DeliverySchema = new Schema<IDelivery>(
  {
    reference: { type: String, required: true, unique: true, uppercase: true, index: true },
    customer: { type: String, required: true, trim: true },
    deliveryAddress: { type: String, trim: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
    scheduledDate: { type: Date, default: () => new Date() },
    status: {
      type: String,
      enum: ['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED'],
      default: 'DRAFT',
      index: true,
    },
    stage: {
      type: String,
      enum: ['DRAFT', 'PICKING', 'PACKING', 'READY', 'DONE', 'CANCELED'],
      default: 'DRAFT',
      index: true,
    },
    lines: [DeliveryItemSchema],
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

export const Delivery = mongoose.models.Delivery || mongoose.model<IDelivery>('Delivery', DeliverySchema);
