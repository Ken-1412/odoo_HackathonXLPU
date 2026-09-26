import { Types } from 'mongoose';
import {
  Inventory,
  StockLedger,
  Product,
  Location,
  Alert,
  MovementType,
  OperationSource,
} from '../models';

export interface ReceiveStockInput {
  productId: Types.ObjectId | string;
  warehouseId: Types.ObjectId | string;
  locationId: Types.ObjectId | string;
  quantity: number;
  reference: string;
  performedBy?: string;
  source?: OperationSource;
  reason?: string;
}

export interface DeliverStockInput {
  productId: Types.ObjectId | string;
  warehouseId: Types.ObjectId | string;
  locationId: Types.ObjectId | string;
  quantity: number;
  reference: string;
  performedBy?: string;
  source?: OperationSource;
  reason?: string;
}

export interface TransferStockInput {
  productId: Types.ObjectId | string;
  fromWarehouseId: Types.ObjectId | string;
  fromLocationId: Types.ObjectId | string;
  toWarehouseId: Types.ObjectId | string;
  toLocationId: Types.ObjectId | string;
  quantity: number;
  reference: string;
  performedBy?: string;
  source?: OperationSource;
  reason?: string;
}

export interface AdjustStockInput {
  productId: Types.ObjectId | string;
  warehouseId: Types.ObjectId | string;
  locationId: Types.ObjectId | string;
  countedQuantity: number;
  reason: string;
  reference: string;
  performedBy?: string;
  source?: OperationSource;
}

class InventoryService {
  /**
   * Helper to check and maintain stock alerts (LOW_STOCK, OUT_OF_STOCK)
   */
  public async checkAndSyncAlerts(productId: Types.ObjectId | string) {
    try {
      const product = await Product.findById(productId);
      if (!product) return;

      const inventories = await Inventory.find({ productId });
      const totalOnHand = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);

      const threshold = product.reorderLevel || 10;

      if (totalOnHand <= 0) {
        // Out of Stock alert
        await Alert.findOneAndUpdate(
          { type: 'OUT_OF_STOCK', productId: product._id, isRead: false },
          {
            type: 'OUT_OF_STOCK',
            title: `Out of Stock: ${product.name}`,
            message: `${product.name} (SKU: ${product.sku}) is completely depleted across all warehouses. Immediate replenishment required.`,
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            severity: 'critical',
            isRead: false,
          },
          { upsert: true, new: true }
        );
      } else if (totalOnHand <= threshold) {
        // Low Stock alert
        await Alert.findOneAndUpdate(
          { type: 'LOW_STOCK', productId: product._id, isRead: false },
          {
            type: 'LOW_STOCK',
            title: `Low Stock Alert: ${product.name}`,
            message: `${product.name} (SKU: ${product.sku}) has reached ${totalOnHand} ${product.unitOfMeasure}, which is at or below the reorder threshold (${threshold}).`,
            productId: product._id,
            productName: product.name,
            sku: product.sku,
            severity: 'warning',
            isRead: false,
          },
          { upsert: true, new: true }
        );
      } else {
        // Healthy stock - mark low stock alerts as read/resolved
        await Alert.updateMany(
          { productId: product._id, type: { $in: ['LOW_STOCK', 'OUT_OF_STOCK'] }, isRead: false },
          { isRead: true }
        );
      }
    } catch (err: any) {
      console.warn('[InventoryService] Alert sync warning:', err.message);
    }
  }

  /**
   * Receive stock into a specific warehouse and location
   * Increases on-hand stock and generates RECEIPT ledger entry
   */
  public async receiveStock(input: ReceiveStockInput) {
    const {
      productId,
      warehouseId,
      locationId,
      quantity,
      reference,
      performedBy = 'Inventory Manager',
      source = 'MANUAL',
      reason = 'Incoming Goods Receipt',
    } = input;

    if (quantity <= 0) {
      throw new Error('Received quantity must be greater than zero');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Find or create location-specific inventory record
    let inventory = await Inventory.findOne({ productId, locationId });
    const quantityBefore = inventory ? inventory.onHandQuantity : 0;

    if (!inventory) {
      inventory = new Inventory({
        productId,
        warehouseId,
        locationId,
        onHandQuantity: quantity,
        reservedQuantity: 0,
        freeToUseQuantity: quantity,
        reorderLevel: product.reorderLevel || 10,
      });
    } else {
      inventory.onHandQuantity += quantity;
      inventory.freeToUseQuantity = Math.max(0, inventory.onHandQuantity - (inventory.reservedQuantity || 0));
      inventory.warehouseId = new Types.ObjectId(warehouseId as string);
    }

    await inventory.save();
    const quantityAfter = inventory.onHandQuantity;

    // Create Stock Ledger Entry
    const ledger = new StockLedger({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      warehouseId,
      locationId,
      movementType: 'RECEIPT',
      quantity: quantity,
      quantityBefore,
      quantityAfter,
      referenceType: 'RECEIPT',
      referenceId: reference,
      reason,
      performedBy,
      source,
    });
    await ledger.save();

    // Check alerts
    await this.checkAndSyncAlerts(product._id);

    return { inventory, ledger };
  }

  /**
   * Deliver stock out of a specific warehouse and location
   * Decreases on-hand stock and generates DELIVERY ledger entry
   */
  public async deliverStock(input: DeliverStockInput) {
    const {
      productId,
      warehouseId,
      locationId,
      quantity,
      reference,
      performedBy = 'Inventory Manager',
      source = 'MANUAL',
      reason = 'Outgoing Delivery Order',
    } = input;

    if (quantity <= 0) {
      throw new Error('Delivery quantity must be greater than zero');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const inventory = await Inventory.findOne({ productId, locationId });
    const availableStock = inventory ? inventory.onHandQuantity : 0;

    if (!inventory || availableStock < quantity) {
      // Record negative stock attempt alert
      await Alert.create({
        type: 'NEGATIVE_STOCK_ATTEMPT',
        title: `Insufficient Stock for Delivery: ${product.name}`,
        message: `Attempted to deliver ${quantity} ${product.unitOfMeasure} of ${product.name} (SKU: ${product.sku}), but only ${availableStock} units are on hand.`,
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        warehouseId: new Types.ObjectId(warehouseId as string),
        locationId: new Types.ObjectId(locationId as string),
        referenceId: reference,
        severity: 'critical',
      });

      throw new Error(
        `Insufficient stock for ${product.name} (SKU: ${product.sku}): only ${availableStock} on hand, required ${quantity}`
      );
    }

    const quantityBefore = inventory.onHandQuantity;
    inventory.onHandQuantity -= quantity;
    if (inventory.reservedQuantity > 0) {
      inventory.reservedQuantity = Math.max(0, inventory.reservedQuantity - quantity);
    }
    inventory.freeToUseQuantity = Math.max(0, inventory.onHandQuantity - inventory.reservedQuantity);
    await inventory.save();
    const quantityAfter = inventory.onHandQuantity;

    // Create Stock Ledger Entry
    const ledger = new StockLedger({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      warehouseId,
      locationId,
      movementType: 'DELIVERY',
      quantity: -quantity,
      quantityBefore,
      quantityAfter,
      referenceType: 'DELIVERY',
      referenceId: reference,
      reason,
      performedBy,
      source,
    });
    await ledger.save();

    // Check alerts
    await this.checkAndSyncAlerts(product._id);

    return { inventory, ledger };
  }

  /**
   * Internal transfer between two warehouse locations
   * Source decreases, destination increases, total company stock is unchanged!
   */
  public async transferStock(input: TransferStockInput) {
    const {
      productId,
      fromWarehouseId,
      fromLocationId,
      toWarehouseId,
      toLocationId,
      quantity,
      reference,
      performedBy = 'Inventory Manager',
      source = 'MANUAL',
      reason = 'Internal Warehouse Transfer',
    } = input;

    if (quantity <= 0) {
      throw new Error('Transfer quantity must be greater than zero');
    }

    if (String(fromLocationId) === String(toLocationId)) {
      throw new Error('Source location and destination location cannot be the same');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Check source inventory
    const sourceInventory = await Inventory.findOne({ productId, locationId: fromLocationId });
    const sourceAvailable = sourceInventory ? sourceInventory.onHandQuantity : 0;

    if (!sourceInventory || sourceAvailable < quantity) {
      throw new Error(
        `Insufficient stock at source location: only ${sourceAvailable} on hand, requested transfer of ${quantity}`
      );
    }

    // Decrement source inventory
    const sourceBefore = sourceInventory.onHandQuantity;
    sourceInventory.onHandQuantity -= quantity;
    sourceInventory.freeToUseQuantity = Math.max(
      0,
      sourceInventory.onHandQuantity - (sourceInventory.reservedQuantity || 0)
    );
    await sourceInventory.save();
    const sourceAfter = sourceInventory.onHandQuantity;

    // Increment destination inventory
    let destInventory = await Inventory.findOne({ productId, locationId: toLocationId });
    const destBefore = destInventory ? destInventory.onHandQuantity : 0;

    if (!destInventory) {
      destInventory = new Inventory({
        productId,
        warehouseId: toWarehouseId,
        locationId: toLocationId,
        onHandQuantity: quantity,
        reservedQuantity: 0,
        freeToUseQuantity: quantity,
        reorderLevel: product.reorderLevel || 10,
      });
    } else {
      destInventory.onHandQuantity += quantity;
      destInventory.freeToUseQuantity = Math.max(
        0,
        destInventory.onHandQuantity - (destInventory.reservedQuantity || 0)
      );
      destInventory.warehouseId = new Types.ObjectId(toWarehouseId as string);
    }
    await destInventory.save();
    const destAfter = destInventory.onHandQuantity;

    // Resolve location names for audit clarity
    const [fromLoc, toLoc] = await Promise.all([
      Location.findById(fromLocationId),
      Location.findById(toLocationId),
    ]);

    // Create single ledger entry describing the transfer
    const ledger = new StockLedger({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      movementType: 'INTERNAL_TRANSFER',
      quantity: quantity,
      quantityBefore: sourceBefore,
      quantityAfter: sourceAfter,
      fromWarehouseId,
      fromLocationId,
      fromLocationName: fromLoc ? fromLoc.name : String(fromLocationId),
      toWarehouseId,
      toLocationId,
      toLocationName: toLoc ? toLoc.name : String(toLocationId),
      referenceType: 'INTERNAL_TRANSFER',
      referenceId: reference,
      reason,
      performedBy,
      source,
    });
    await ledger.save();

    await this.checkAndSyncAlerts(product._id);

    return { sourceInventory, destInventory, ledger };
  }

  /**
   * Inventory Adjustment (Cycle Count / Physical reconciliation)
   * Reconciles physical count with system count and generates ADJUSTMENT ledger
   */
  public async adjustStock(input: AdjustStockInput) {
    const {
      productId,
      warehouseId,
      locationId,
      countedQuantity,
      reason,
      reference,
      performedBy = 'Inventory Manager',
      source = 'MANUAL',
    } = input;

    if (countedQuantity < 0) {
      throw new Error('Counted physical stock cannot be negative');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    let inventory = await Inventory.findOne({ productId, locationId });
    const systemQuantity = inventory ? inventory.onHandQuantity : 0;
    const difference = countedQuantity - systemQuantity;

    if (!inventory) {
      inventory = new Inventory({
        productId,
        warehouseId,
        locationId,
        onHandQuantity: countedQuantity,
        reservedQuantity: 0,
        freeToUseQuantity: countedQuantity,
        reorderLevel: product.reorderLevel || 10,
      });
    } else {
      inventory.onHandQuantity = countedQuantity;
      inventory.freeToUseQuantity = Math.max(
        0,
        inventory.onHandQuantity - (inventory.reservedQuantity || 0)
      );
      inventory.warehouseId = new Types.ObjectId(warehouseId as string);
    }
    await inventory.save();

    // Create Stock Ledger Entry for the difference
    const ledger = new StockLedger({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      warehouseId,
      locationId,
      movementType: 'ADJUSTMENT',
      quantity: difference,
      quantityBefore: systemQuantity,
      quantityAfter: countedQuantity,
      referenceType: 'ADJUSTMENT',
      referenceId: reference,
      reason: reason || 'Inventory Physical Count Adjustment',
      performedBy,
      source,
    });
    await ledger.save();

    await this.checkAndSyncAlerts(product._id);

    return { inventory, difference, systemQuantity, countedQuantity, ledger };
  }

  /**
   * Get location-aware stock summary for a specific product
   */
  public async getProductStockSummary(productId: Types.ObjectId | string) {
    const inventories = await Inventory.find({ productId })
      .populate('warehouseId', 'name shortCode')
      .populate('locationId', 'name shortCode zone rack bin');

    const totalOnHand = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);
    const totalReserved = inventories.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0);
    const totalFreeToUse = inventories.reduce((sum, inv) => sum + (inv.freeToUseQuantity || 0), 0);

    return {
      productId,
      totalOnHand,
      totalReserved,
      totalFreeToUse,
      breakdown: inventories.map((inv) => ({
        warehouseId: inv.warehouseId,
        locationId: inv.locationId,
        onHandQuantity: inv.onHandQuantity,
        reservedQuantity: inv.reservedQuantity,
        freeToUseQuantity: inv.freeToUseQuantity,
      })),
    };
  }
}

export const inventoryService = new InventoryService();
