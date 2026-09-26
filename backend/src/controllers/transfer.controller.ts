import { Request, Response, NextFunction } from 'express';
import { Transfer, Product, Warehouse, Location } from '../models';
import { inventoryService } from '../services/inventory.service';

export class TransferController {
  public async getTransfers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, search } = req.query;
      const filter: any = {};

      if (status && status !== 'ALL') filter.status = status;
      if (search) {
        filter.reference = new RegExp(String(search).trim(), 'i');
      }

      const transfers = await Transfer.find(filter)
        .populate('fromWarehouseId', 'name shortCode')
        .populate('fromLocationId', 'name shortCode')
        .populate('toWarehouseId', 'name shortCode')
        .populate('toLocationId', 'name shortCode')
        .sort({ createdAt: -1 });

      const mapped = transfers.map((t: any) => {
        const item = t.lines?.[0] || {};
        return {
          id: t._id,
          reference: t.reference,
          productId: item.productId,
          productName: item.productName || 'Unknown Product',
          sku: item.sku || '',
          quantity: item.quantity || 0,
          uom: item.unitOfMeasure || 'PCS',
          sourceWarehouseId: t.fromWarehouseId?._id,
          sourceWarehouseName: t.fromWarehouseId?.name,
          sourceLocationId: t.fromLocationId?._id,
          sourceLocation: t.fromLocationId?.name || 'Main Rack',
          destinationWarehouseId: t.toWarehouseId?._id,
          destinationWarehouseName: t.toWarehouseId?.name,
          destinationLocationId: t.toLocationId?._id,
          destinationLocation: t.toLocationId?.name || 'Rack A',
          status: t.status,
          operator: t.responsibleName || 'Inventory Manager',
          timestamp: t.scheduledDate ? t.scheduledDate.toISOString().split('T')[0] : '',
          source: t.source,
          notes: t.notes,
          createdAt: t.createdAt,
          validatedAt: t.validatedAt,
        };
      });

      res.json({ success: true, data: mapped });
    } catch (err) {
      next(err);
    }
  }

  public async getTransferById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const t: any = await Transfer.findById(id)
        .populate('fromWarehouseId', 'name shortCode')
        .populate('fromLocationId', 'name shortCode')
        .populate('toWarehouseId', 'name shortCode')
        .populate('toLocationId', 'name shortCode');

      if (!t) {
        res.status(404).json({ success: false, message: 'Transfer not found' });
        return;
      }

      const item = t.lines?.[0] || {};
      res.json({
        success: true,
        data: {
          id: t._id,
          reference: t.reference,
          productId: item.productId,
          productName: item.productName || 'Unknown Product',
          sku: item.sku || '',
          quantity: item.quantity || 0,
          uom: item.unitOfMeasure || 'PCS',
          sourceWarehouseId: t.fromWarehouseId?._id,
          sourceWarehouseName: t.fromWarehouseId?.name,
          sourceLocationId: t.fromLocationId?._id,
          sourceLocation: t.fromLocationId?.name || 'Main Rack',
          destinationWarehouseId: t.toWarehouseId?._id,
          destinationWarehouseName: t.toWarehouseId?.name,
          destinationLocationId: t.toLocationId?._id,
          destinationLocation: t.toLocationId?.name || 'Rack A',
          status: t.status,
          operator: t.responsibleName || 'Inventory Manager',
          timestamp: t.scheduledDate ? t.scheduledDate.toISOString().split('T')[0] : '',
          source: t.source,
          notes: t.notes,
          createdAt: t.createdAt,
          validatedAt: t.validatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async createTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        reference,
        productId,
        sku,
        productName,
        quantity,
        uom,
        unitOfMeasure,
        sourceWarehouseId,
        fromWarehouseId,
        sourceLocationId,
        sourceLocation,
        fromLocationId,
        destinationWarehouseId,
        toWarehouseId,
        destinationLocationId,
        destinationLocation,
        toLocationId,
        notes,
        source = 'MANUAL',
        responsibleName,
      } = req.body;

      if (!quantity || Number(quantity) <= 0) {
        res.status(400).json({ success: false, message: 'Transfer quantity must be greater than zero' });
        return;
      }

      // Resolve product
      let prod = productId ? await Product.findById(productId) : null;
      if (!prod && sku) prod = await Product.findOne({ sku: String(sku).trim().toUpperCase() });
      if (!prod && productName) prod = await Product.findOne({ name: new RegExp(String(productName).trim(), 'i') });

      if (!prod) {
        res.status(400).json({ success: false, message: 'Product not found for transfer' });
        return;
      }

      // Resolve warehouses
      const srcWhId = fromWarehouseId || sourceWarehouseId;
      const dstWhId = toWarehouseId || destinationWarehouseId;
      let srcWh = srcWhId ? await Warehouse.findById(srcWhId) : await Warehouse.findOne();
      let dstWh = dstWhId ? await Warehouse.findById(dstWhId) : srcWh;

      // Resolve locations
      const srcLocId = fromLocationId || sourceLocationId;
      const dstLocId = toLocationId || destinationLocationId;

      let srcLoc = srcLocId ? await Location.findById(srcLocId) : null;
      if (!srcLoc && srcWh) {
        srcLoc = await Location.findOne({ warehouseId: srcWh._id });
        if (!srcLoc) {
          srcLoc = await Location.create({ name: sourceLocation || 'Main Rack', warehouseId: srcWh._id });
        }
      }

      let dstLoc = dstLocId ? await Location.findById(dstLocId) : null;
      if (!dstLoc && dstWh) {
        dstLoc = await Location.findOne({ warehouseId: dstWh._id, _id: { $ne: srcLoc?._id } });
        if (!dstLoc) {
          dstLoc = await Location.create({ name: destinationLocation || 'Rack A', warehouseId: dstWh._id });
        }
      }

      if (!srcLoc || !dstLoc || String(srcLoc._id) === String(dstLoc._id)) {
        res.status(400).json({ success: false, message: 'Source location and destination location must be distinct' });
        return;
      }

      let finalRef = reference ? String(reference).trim().toUpperCase() : '';
      if (!finalRef) {
        const count = await Transfer.countDocuments();
        finalRef = `TRF-${String(count + 1).padStart(3, '0')}`;
      }

      const transfer = new Transfer({
        reference: finalRef,
        fromWarehouseId: srcWh?._id,
        fromLocationId: srcLoc._id,
        toWarehouseId: dstWh?._id,
        toLocationId: dstLoc._id,
        lines: [
          {
            productId: prod._id,
            productName: prod.name,
            sku: prod.sku,
            quantity: Number(quantity),
            unitOfMeasure: prod.unitOfMeasure || uom || unitOfMeasure || 'PCS',
          },
        ],
        status: 'READY',
        notes,
        source: ['MANUAL', 'VOICE_AI', 'SYSTEM'].includes(source) ? source : 'MANUAL',
        responsibleName: responsibleName || req.user?.email || 'Inventory Manager',
      });

      await transfer.save();

      res.status(201).json({
        success: true,
        message: `Transfer ${transfer.reference} created successfully`,
        data: transfer,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validate Transfer (IDEMPOTENT!)
   * Deducts from source location and adds to destination location via central inventoryService
   * Total stock across warehouses remains unchanged!
   * POST /api/transfers/:id/validate
   */
  public async validateTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transfer = await Transfer.findById(id);

      if (!transfer) {
        res.status(404).json({ success: false, message: 'Transfer not found' });
        return;
      }

      if (transfer.status === 'DONE') {
        res.json({
          success: true,
          message: `Transfer ${transfer.reference} is already completed (no change applied).`,
          data: transfer,
          alreadyValidated: true,
        });
        return;
      }

      if (transfer.status === 'CANCELED') {
        res.status(400).json({ success: false, message: 'Cannot validate a canceled transfer' });
        return;
      }

      const operator = req.body?.performedBy || req.user?.email || transfer.responsibleName || 'Inventory Manager';
      const source = req.body?.source || transfer.source || 'MANUAL';

      for (const line of transfer.lines) {
        await inventoryService.transferStock({
          productId: line.productId,
          fromWarehouseId: transfer.fromWarehouseId,
          fromLocationId: transfer.fromLocationId,
          toWarehouseId: transfer.toWarehouseId,
          toLocationId: transfer.toLocationId,
          quantity: line.quantity,
          reference: transfer.reference,
          performedBy: operator,
          source,
          reason: `Validated Transfer ${transfer.reference}`,
        });
      }

      transfer.status = 'DONE';
      transfer.validatedAt = new Date();
      await transfer.save();

      res.json({
        success: true,
        message: `Transfer ${transfer.reference} completed successfully. Stock relocated without changing company total.`,
        data: transfer,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel Transfer
   * POST /api/transfers/:id/cancel
   */
  public async cancelTransfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transfer = await Transfer.findById(id);

      if (!transfer) {
        res.status(404).json({ success: false, message: 'Transfer not found' });
        return;
      }

      if (transfer.status === 'DONE') {
        res.status(400).json({ success: false, message: 'Cannot cancel an already completed transfer' });
        return;
      }

      transfer.status = 'CANCELED';
      await transfer.save();

      res.json({ success: true, message: `Transfer ${transfer.reference} canceled`, data: transfer });
    } catch (err) {
      next(err);
    }
  }
}

export const transferController = new TransferController();
