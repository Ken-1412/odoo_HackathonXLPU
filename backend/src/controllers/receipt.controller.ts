import { Request, Response, NextFunction } from 'express';
import { Receipt, Product, Warehouse, Location } from '../models';
import { inventoryService } from '../services/inventory.service';

export class ReceiptController {
  public async getReceipts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, warehouseId, search } = req.query;
      const filter: any = {};

      if (status && status !== 'ALL') filter.status = status;
      if (warehouseId) filter.warehouseId = warehouseId;
      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        filter.$or = [{ reference: searchRegex }, { supplier: searchRegex }];
      }

      const receipts = await Receipt.find(filter)
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode')
        .sort({ createdAt: -1 });

      const mapped = receipts.map((r: any) => ({
        id: r._id,
        reference: r.reference,
        supplier: r.supplier,
        destinationWarehouseId: r.warehouseId?._id,
        destinationWarehouseName: r.warehouseId?.name,
        destinationLocationId: r.locationId?._id,
        destinationLocation: r.locationId?.name || 'Main Rack',
        scheduledDate: r.scheduledDate ? r.scheduledDate.toISOString().split('T')[0] : '',
        status: r.status,
        operator: r.responsibleName || 'Inventory Manager',
        items: (r.lines || []).map((line: any) => ({
          productId: line.productId,
          productName: line.productName,
          sku: line.sku,
          quantity: line.quantity,
          receivedQuantity: line.receivedQuantity,
          uom: line.unitOfMeasure,
        })),
        source: r.source,
        notes: r.notes,
        createdAt: r.createdAt,
        validatedAt: r.validatedAt,
      }));

      res.json({ success: true, data: mapped });
    } catch (err) {
      next(err);
    }
  }

  public async getReceiptById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const r: any = await Receipt.findById(id)
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode');

      if (!r) {
        res.status(404).json({ success: false, message: 'Receipt order not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: r._id,
          reference: r.reference,
          supplier: r.supplier,
          destinationWarehouseId: r.warehouseId?._id,
          destinationWarehouseName: r.warehouseId?.name,
          destinationLocationId: r.locationId?._id,
          destinationLocation: r.locationId?.name || 'Main Rack',
          scheduledDate: r.scheduledDate ? r.scheduledDate.toISOString().split('T')[0] : '',
          status: r.status,
          operator: r.responsibleName || 'Inventory Manager',
          items: (r.lines || []).map((line: any) => ({
            productId: line.productId,
            productName: line.productName,
            sku: line.sku,
            quantity: line.quantity,
            receivedQuantity: line.receivedQuantity,
            uom: line.unitOfMeasure,
          })),
          source: r.source,
          notes: r.notes,
          createdAt: r.createdAt,
          validatedAt: r.validatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async createReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        reference,
        supplier,
        warehouseId,
        destinationWarehouseId,
        locationId,
        destinationLocationId,
        destinationLocation,
        scheduledDate,
        items,
        notes,
        source = 'MANUAL',
        responsibleName,
      } = req.body;

      if (!supplier || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'Supplier and at least one item line are required' });
        return;
      }

      // Generate reference if missing
      let finalRef = reference ? String(reference).trim().toUpperCase() : '';
      if (!finalRef) {
        const count = await Receipt.countDocuments();
        finalRef = `RCP-${String(count + 1).padStart(3, '0')}`;
      }

      // Resolve warehouse
      const finalWarehouseId = warehouseId || destinationWarehouseId;
      let wh = finalWarehouseId ? await Warehouse.findById(finalWarehouseId) : null;
      if (!wh) {
        wh = await Warehouse.findOne();
      }

      // Resolve location
      const finalLocId = locationId || destinationLocationId;
      let loc = finalLocId ? await Location.findById(finalLocId) : null;
      if (!loc && wh) {
        loc = await Location.findOne({ warehouseId: wh._id });
        if (!loc) {
          loc = await Location.create({
            name: destinationLocation || 'Main Rack',
            warehouseId: wh._id,
          });
        }
      }

      // Resolve item details
      const resolvedLines = [];
      for (const item of items) {
        let prod = item.productId ? await Product.findById(item.productId) : null;
        if (!prod && item.sku) {
          prod = await Product.findOne({ sku: String(item.sku).trim().toUpperCase() });
        }
        if (!prod && item.productName) {
          prod = await Product.findOne({ name: new RegExp(String(item.productName).trim(), 'i') });
        }

        if (!prod) {
          res.status(400).json({
            success: false,
            message: `Product "${item.productName || item.sku || item.productId}" not found in system`,
          });
          return;
        }

        resolvedLines.push({
          productId: prod._id,
          productName: prod.name,
          sku: prod.sku,
          quantity: Number(item.quantity) || 1,
          receivedQuantity: 0,
          unitOfMeasure: prod.unitOfMeasure || item.uom || 'PCS',
        });
      }

      const receipt = new Receipt({
        reference: finalRef,
        supplier: String(supplier).trim(),
        warehouseId: wh?._id,
        locationId: loc?._id,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        status: 'READY',
        lines: resolvedLines,
        notes,
        source: ['MANUAL', 'VOICE_AI', 'SYSTEM'].includes(source) ? source : 'MANUAL',
        responsibleName: responsibleName || req.user?.email || 'Inventory Manager',
      });

      await receipt.save();

      res.status(201).json({
        success: true,
        message: `Receipt ${receipt.reference} created successfully`,
        data: receipt,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validate Receipt (IDEMPOTENT!)
   * Increases on-hand inventory via central inventoryService
   * POST /api/receipts/:id/validate
   */
  public async validateReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findById(id);

      if (!receipt) {
        res.status(404).json({ success: false, message: 'Receipt order not found' });
        return;
      }

      // Idempotency check: if already DONE, return success without double-mutating stock
      if (receipt.status === 'DONE') {
        res.json({
          success: true,
          message: `Receipt ${receipt.reference} is already validated (no change applied).`,
          data: receipt,
          alreadyValidated: true,
        });
        return;
      }

      if (receipt.status === 'CANCELED') {
        res.status(400).json({ success: false, message: 'Cannot validate a canceled receipt order' });
        return;
      }

      const operator = req.body?.performedBy || req.user?.email || receipt.responsibleName || 'Inventory Manager';
      const source = req.body?.source || receipt.source || 'MANUAL';

      // Perform stock mutation for each receipt item via central inventory service
      for (const line of receipt.lines) {
        await inventoryService.receiveStock({
          productId: line.productId,
          warehouseId: receipt.warehouseId,
          locationId: receipt.locationId || receipt.warehouseId,
          quantity: line.quantity,
          reference: receipt.reference,
          performedBy: operator,
          source,
          reason: `Validated Receipt ${receipt.reference} from ${receipt.supplier}`,
        });
        line.receivedQuantity = line.quantity;
      }

      receipt.status = 'DONE';
      receipt.validatedAt = new Date();
      await receipt.save();

      res.json({
        success: true,
        message: `Receipt ${receipt.reference} validated successfully. Inventory and Stock Ledger updated.`,
        data: receipt,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel Receipt
   * POST /api/receipts/:id/cancel
   */
  public async cancelReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findById(id);

      if (!receipt) {
        res.status(404).json({ success: false, message: 'Receipt order not found' });
        return;
      }

      if (receipt.status === 'DONE') {
        res.status(400).json({
          success: false,
          message: 'Cannot cancel a receipt order that has already been validated and posted to inventory',
        });
        return;
      }

      receipt.status = 'CANCELED';
      await receipt.save();

      res.json({
        success: true,
        message: `Receipt ${receipt.reference} canceled`,
        data: receipt,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const receiptController = new ReceiptController();
