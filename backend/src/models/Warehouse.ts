import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  shortCode: string;
  address?: string;
  manager?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true, trim: true },
    shortCode: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    address: { type: String, trim: true },
    manager: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Warehouse = mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
