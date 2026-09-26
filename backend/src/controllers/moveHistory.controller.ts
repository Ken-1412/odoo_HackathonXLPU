import { Request, Response, NextFunction } from 'express';
import { StockLedger } from '../models';

export class MoveHistoryController {
  /**
   * Get Move History from Stock Ledger
   * GET /api/move-history
   */
  public async getMoveHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        reference,
        movementType,
        source,
        productId,
        warehouseId,
        locationId,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 100,
      } = req.query;

      const filter: any = {};

      if (reference) {
        filter.referenceId = new RegExp(String(reference).trim(), 'i');
      }

      if (movementType && movementType !== 'ALL') {
        filter.movementType = movementType;
      }

      if (source && source !== 'ALL') {
        filter.source = source;
      }

      if (productId) filter.productId = productId;
      if (warehouseId) filter.warehouseId = warehouseId;
      if (locationId) filter.locationId = locationId;

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(String(dateFrom));
        if (dateTo) filter.createdAt.$lte = new Date(String(dateTo));
      }

      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        filter.$or = [
          { referenceId: searchRegex },
          { productName: searchRegex },
          { sku: searchRegex },
          { performedBy: searchRegex },
        ];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [movements, total] = await Promise.all([
        StockLedger.find(filter)
          .populate('productId', 'name sku unitOfMeasure')
          .populate('warehouseId', 'name shortCode')
          .populate('locationId', 'name shortCode')
          .populate('fromWarehouseId', 'name shortCode')
          .populate('fromLocationId', 'name shortCode')
          .populate('toWarehouseId', 'name shortCode')
          .populate('toLocationId', 'name shortCode')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        StockLedger.countDocuments(filter),
      ]);

      const formatted = movements.map((m: any) => {
        let fromText = 'External / Supplier';
        let toText = 'Main Warehouse';

        if (m.movementType === 'RECEIPT') {
          fromText = 'Supplier / Vendor';
          toText = m.locationId?.name || m.warehouseId?.name || 'Main Warehouse';
        } else if (m.movementType === 'DELIVERY') {
          fromText = m.locationId?.name || m.warehouseId?.name || 'Main Warehouse';
          toText = 'Customer Destination';
        } else if (m.movementType === 'INTERNAL_TRANSFER') {
          fromText = m.fromLocationName || m.fromLocationId?.name || m.fromWarehouseId?.name || 'Source';
          toText = m.toLocationName || m.toLocationId?.name || m.toWarehouseId?.name || 'Destination';
        } else if (m.movementType === 'ADJUSTMENT') {
          fromText = 'Physical Count';
          toText = m.locationId?.name || m.warehouseId?.name || 'Location Stock';
        }

        return {
          id: m._id,
          eventId: m.referenceId,
          reference: m.referenceId,
          timestamp: m.createdAt ? m.createdAt.toISOString() : '',
          date: m.createdAt ? m.createdAt.toISOString().split('T')[0] : '',
          productId: m.productId?._id || m.productId,
          productName: m.productId?.name || m.productName,
          sku: m.productId?.sku || m.sku,
          from: fromText,
          to: toText,
          type: m.movementType,
          movementType: m.movementType,
          quantity: m.quantity,
          quantityBefore: m.quantityBefore,
          quantityAfter: m.quantityAfter,
          balanceAfter: m.quantityAfter,
          uom: m.productId?.unitOfMeasure || 'PCS',
          user: m.performedBy,
          performedBy: m.performedBy,
          status: 'DONE',
          source: m.source,
          reason: m.reason,
        };
      });

      res.json({
        success: true,
        data: formatted,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const moveHistoryController = new MoveHistoryController();
