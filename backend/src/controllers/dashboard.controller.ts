import { Request, Response, NextFunction } from 'express';
import { Product, Inventory, Receipt, Delivery, Transfer, StockLedger } from '../models';

export class DashboardController {
  public async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, category } = req.query;

      const productFilter: any = { active: true };
      if (category && category !== 'ALL') {
        productFilter.category = category;
      }

      const products = await Product.find(productFilter);

      let totalProductsCount = products.length;
      let totalUnits = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      for (const prod of products) {
        const invFilter: any = { productId: prod._id };
        if (warehouseId) invFilter.warehouseId = warehouseId;

        const inventories = await Inventory.find(invFilter);
        const onHand = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);
        totalUnits += onHand;

        const threshold = prod.reorderLevel || 10;
        if (onHand <= 0) {
          outOfStockCount++;
        } else if (onHand <= threshold) {
          lowStockCount++;
        }
      }

      const receiptFilter: any = { status: { $in: ['WAITING', 'READY'] } };
      if (warehouseId) receiptFilter.warehouseId = warehouseId;
      const pendingReceiptsCount = await Receipt.countDocuments(receiptFilter);

      const deliveryFilter: any = {
        $or: [
          { status: { $in: ['WAITING', 'READY'] } },
          { stage: { $in: ['PICKING', 'PACKING', 'READY'] } },
        ],
      };
      if (warehouseId) deliveryFilter.warehouseId = warehouseId;
      const pendingDeliveriesCount = await Delivery.countDocuments(deliveryFilter);

      const transferFilter: any = { status: { $in: ['WAITING', 'READY'] } };
      if (warehouseId) {
        transferFilter.$or = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }];
      }
      const scheduledTransfersCount = await Transfer.countDocuments(transferFilter);

      // Fetch 10 most recent ledger entries
      const recentLedger = await StockLedger.find()
        .populate('productId', 'name sku unitOfMeasure')
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode')
        .sort({ createdAt: -1 })
        .limit(10);

      const recentMovements = recentLedger.map((m: any) => ({
        id: m._id,
        eventId: m.referenceId,
        reference: m.referenceId,
        type: m.movementType,
        timestamp: m.createdAt ? m.createdAt.toISOString() : '',
        productId: m.productId?._id,
        productName: m.productId?.name || m.productName,
        sku: m.productId?.sku || m.sku,
        from: m.fromLocationName || 'Warehouse',
        to: m.toLocationName || 'Warehouse',
        quantity: m.quantity,
        uom: m.productId?.unitOfMeasure || 'PCS',
        user: m.performedBy,
        status: 'DONE',
        source: m.source,
      }));

      res.json({
        success: true,
        data: {
          totalUnits,
          totalProductsCount,
          lowStockCount,
          outOfStockCount,
          pendingReceiptsCount,
          pendingDeliveriesCount,
          scheduledTransfersCount,
          recentMovements,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // Legacy route handlers
  public getStats = this.getDashboard.bind(this);
  public getAdminStats = this.getDashboard.bind(this);
  public getUtilization = (_req: Request, res: Response) => res.json({ success: true, data: [] });
  public getMaintenanceFrequency = (_req: Request, res: Response) => res.json({ success: true, data: [] });
  public getMostUsed = (_req: Request, res: Response) => res.json({ success: true, data: [] });
  public getRecentActivity = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const recent = await StockLedger.find().sort({ createdAt: -1 }).limit(10);
      res.json({ success: true, data: recent });
    } catch (e) {
      next(e);
    }
  };
  public getEmployeePersonalStats = this.getDashboard.bind(this);
  public getEmployeePersonalActivity = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const recent = await StockLedger.find().sort({ createdAt: -1 }).limit(5);
      res.json({ success: true, data: recent });
    } catch (e) {
      next(e);
    }
  };
}

export const dashboardController = new DashboardController();
export default dashboardController;
