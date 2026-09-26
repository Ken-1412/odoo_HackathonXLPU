import mongoose, { Schema, Document, Types } from 'mongoose';

export type UOM = 'KG' | 'PCS' | 'MTR' | 'BOX' | 'LTR' | 'TONS' | 'PALLET';

export interface IProduct extends Document {
  name: string;
  sku: string;
  categoryId?: Types.ObjectId;
  category: string;
  unitOfMeasure: UOM;
  reorderLevel: number;
  preferredReorderQuantity: number;
  costPerUnit: number;
  initialStock: number;
  description?: string;
  barcode?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    category: { type: String, required: true, default: 'General', index: true },
    unitOfMeasure: {
      type: String,
      enum: ['KG', 'PCS', 'MTR', 'BOX', 'LTR', 'TONS', 'PALLET'],
      default: 'PCS',
    },
    reorderLevel: { type: Number, default: 10, min: 0 },
    preferredReorderQuantity: { type: Number, default: 50, min: 0 },
    costPerUnit: { type: Number, default: 0, min: 0 },
    initialStock: { type: Number, default: 0, min: 0 },
    description: { type: String, trim: true },
    barcode: { type: String, trim: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', sku: 'text', description: 'text' });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
