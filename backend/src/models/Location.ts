import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  shortCode?: string;
  warehouseId: Types.ObjectId;
  zone?: string;
  rack?: string;
  bin?: string;
  locationType?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true, trim: true },
    shortCode: { type: String, trim: true, uppercase: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    zone: { type: String, trim: true },
    rack: { type: String, trim: true },
    bin: { type: String, trim: true },
    locationType: { type: String, default: 'INTERNAL', trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LocationSchema.index({ warehouseId: 1, name: 1 });

export const Location = mongoose.models.Location || mongoose.model<ILocation>('Location', LocationSchema);
