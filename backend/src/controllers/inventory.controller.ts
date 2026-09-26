import { Request, Response, NextFunction } from 'express';
import { Inventory, Product } from '../models';
import { inventoryService } from '../services/inventory.service';

export class InventoryController {
  /**
   * Get all location-aware inventory records
   * GET /api/inventory
   */
  public async getInventory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, locationId, productId } = req.query;
      const filter: any = {};

      if (warehouseId) filter.warehouseId = warehouseId;
      if (locationId) filter.locationId = locationId;
      if (productId) filter.productId = productId;

      const records = await Inventory.find(filter)
        .populate('productId', 'name sku category unitOfMeasure reorderLevel')
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode zone rack bin')
        .sort({ updatedAt: -1 });

      const mapped = records.map((inv: any) => ({
        id: inv._id,
        productId: inv.productId?._id,
        productName: inv.productId?.name || 'Unknown Product',
        sku: inv.productId?.sku || '',
        category: inv.productId?.category || '',
        unitOfMeasure: inv.productId?.unitOfMeasure || 'PCS',
        warehouseId: inv.warehouseId?._id,
        warehouseName: inv.warehouseId?.name || '',
        warehouseCode: inv.warehouseId?.shortCode || '',
        locationId: inv.locationId?._id,
        locationName: inv.locationId?.name || '',
        zone: inv.locationId?.zone,
        rack: inv.locationId?.rack,
        bin: inv.locationId?.bin,
        onHandQuantity: inv.onHandQuantity,
        reservedQuantity: inv.reservedQuantity,
        freeToUseQuantity: inv.freeToUseQuantity,
        reorderLevel: inv.reorderLevel,
        updatedAt: inv.updatedAt,
      }));

      res.json({ success: true, data: mapped });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Low Stock products (stock <= reorderLevel and stock > 0)
   * GET /api/inventory/low-stock
   */
  public async getLowStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await Product.find({ active: true });
      const lowStockProducts = [];

      for (const prod of products) {
        const inventories = await Inventory.find({ productId: prod._id });
        const totalOnHand = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);
        const threshold = prod.reorderLevel || 10;

        if (totalOnHand > 0 && totalOnHand <= threshold) {
          lowStockProducts.push({
            id: prod._id,
            name: prod.name,
            sku: prod.sku,
            category: prod.category,
            unitOfMeasure: prod.unitOfMeasure,
            currentStock: totalOnHand,
            reorderLevel: threshold,
            preferredReorderQuantity: prod.preferredReorderQuantity,
            status: 'LOW_STOCK',
            difference: threshold - totalOnHand,
          });
        }
      }

      res.json({ success: true, data: lowStockProducts, count: lowStockProducts.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get Out of Stock products (stock <= 0)
   * GET /api/inventory/out-of-stock
   */
  public async getOutOfStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await Product.find({ active: true });
      const outOfStockProducts = [];

      for (const prod of products) {
        const inventories = await Inventory.find({ productId: prod._id });
        const totalOnHand = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);

        if (totalOnHand <= 0) {
          outOfStockProducts.push({
            id: prod._id,
            name: prod.name,
            sku: prod.sku,
            category: prod.category,
            unitOfMeasure: prod.unitOfMeasure,
            currentStock: 0,
            reorderLevel: prod.reorderLevel || 10,
            preferredReorderQuantity: prod.preferredReorderQuantity,
            status: 'OUT_OF_STOCK',
          });
        }
      }

      res.json({ success: true, data: outOfStockProducts, count: outOfStockProducts.length });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get location breakdown for a single product
   * GET /api/inventory/product/:id
   */
  public async getProductStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const summary = await inventoryService.getProductStockSummary(id);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
