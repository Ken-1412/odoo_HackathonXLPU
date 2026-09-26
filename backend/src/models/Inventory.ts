import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInventory extends Document {
  productId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  locationId: Types.ObjectId;
  onHandQuantity: number;
  reservedQuantity: number;
  freeToUseQuantity: number;
  reorderLevel: number;
  updatedAt: Date;
  createdAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true, index: true },
    onHandQuantity: { type: Number, required: true, default: 0, min: 0 },
    reservedQuantity: { type: Number, required: true, default: 0, min: 0 },
    freeToUseQuantity: { type: Number, required: true, default: 0 },
    reorderLevel: { type: Number, default: 10 },
  },
  { timestamps: true }
);

// Prevent duplicate inventory rows for the same product in the same location
InventorySchema.index({ productId: 1, locationId: 1 }, { unique: true });
InventorySchema.index({ warehouseId: 1, productId: 1 });

// Ensure freeToUseQuantity is computed on save
InventorySchema.pre('save', function () {
  this.freeToUseQuantity = Math.max(0, (this.onHandQuantity || 0) - (this.reservedQuantity || 0));
});

export const Inventory = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
