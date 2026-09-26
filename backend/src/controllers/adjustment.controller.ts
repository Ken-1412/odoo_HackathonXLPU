import { Request, Response, NextFunction } from 'express';
import { Adjustment, Product, Warehouse, Location, Inventory } from '../models';
import { inventoryService } from '../services/inventory.service';

export class AdjustmentController {
  public async getAdjustments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adjustments = await Adjustment.find()
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode')
        .populate('productId', 'name sku unitOfMeasure')
        .sort({ createdAt: -1 });

      const mapped = adjustments.map((a: any) => ({
        id: a._id,
        reference: a.reference,
        productId: a.productId?._id,
        productName: a.productId?.name || a.productName,
        sku: a.productId?.sku || a.sku,
        warehouseId: a.warehouseId?._id,
        warehouseName: a.warehouseId?.name,
        locationId: a.locationId?._id,
        location: a.locationId?.name || 'Main Rack',
        systemQuantity: a.systemQuantity,
        physicalCount: a.countedQuantity,
        variance: a.difference,
        uom: a.productId?.unitOfMeasure || 'PCS',
        reason: a.reason,
        status: a.status,
        operator: a.responsibleName || 'Inventory Manager',
        timestamp: a.createdAt ? a.createdAt.toISOString().split('T')[0] : '',
        source: a.source,
        notes: a.notes,
        createdAt: a.createdAt,
        validatedAt: a.validatedAt,
      }));

      res.json({ success: true, data: mapped });
    } catch (err) {
      next(err);
    }
  }

  public async getAdjustmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const a: any = await Adjustment.findById(id)
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode')
        .populate('productId', 'name sku unitOfMeasure');

      if (!a) {
        res.status(404).json({ success: false, message: 'Adjustment not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          id: a._id,
          reference: a.reference,
          productId: a.productId?._id,
          productName: a.productId?.name || a.productName,
          sku: a.productId?.sku || a.sku,
          warehouseId: a.warehouseId?._id,
          warehouseName: a.warehouseId?.name,
          locationId: a.locationId?._id,
          location: a.locationId?.name || 'Main Rack',
          systemQuantity: a.systemQuantity,
          physicalCount: a.countedQuantity,
          variance: a.difference,
          uom: a.productId?.unitOfMeasure || 'PCS',
          reason: a.reason,
          status: a.status,
          operator: a.responsibleName || 'Inventory Manager',
          timestamp: a.createdAt ? a.createdAt.toISOString().split('T')[0] : '',
          source: a.source,
          notes: a.notes,
          createdAt: a.createdAt,
          validatedAt: a.validatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async createAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        reference,
        productId,
        sku,
        productName,
        warehouseId,
        locationId,
        location,
        countedQuantity,
        physicalCount,
        reason = 'Cycle Count',
        notes,
        source = 'MANUAL',
        responsibleName,
      } = req.body;

      const finalCounted = countedQuantity !== undefined ? Number(countedQuantity) : Number(physicalCount);
      if (isNaN(finalCounted) || finalCounted < 0) {
        res.status(400).json({ success: false, message: 'Counted physical quantity must be a non-negative number' });
        return;
      }

      // Resolve product
      let prod = productId ? await Product.findById(productId) : null;
      if (!prod && sku) prod = await Product.findOne({ sku: String(sku).trim().toUpperCase() });
      if (!prod && productName) prod = await Product.findOne({ name: new RegExp(String(productName).trim(), 'i') });

      if (!prod) {
        res.status(400).json({ success: false, message: 'Product not found for adjustment' });
        return;
      }

      // Resolve warehouse and location
      let wh = warehouseId ? await Warehouse.findById(warehouseId) : await Warehouse.findOne();
      let loc = locationId ? await Location.findById(locationId) : null;
      if (!loc && wh) {
        loc = await Location.findOne({ warehouseId: wh._id });
        if (!loc) {
          loc = await Location.create({ name: location || 'Main Rack', warehouseId: wh._id });
        }
      }

      // Query current system stock
      const currentInv = await Inventory.findOne({ productId: prod._id, locationId: loc?._id });
      const systemQuantity = currentInv ? currentInv.onHandQuantity : 0;
      const difference = finalCounted - systemQuantity;

      let finalRef = reference ? String(reference).trim().toUpperCase() : '';
      if (!finalRef) {
        const count = await Adjustment.countDocuments();
        finalRef = `ADJ-${String(count + 1).padStart(3, '0')}`;
      }

      const adjustment = new Adjustment({
        reference: finalRef,
        productId: prod._id,
        productName: prod.name,
        sku: prod.sku,
        warehouseId: wh?._id,
        locationId: loc?._id,
        systemQuantity,
        countedQuantity: finalCounted,
        difference,
        reason,
        status: 'DRAFT',
        notes,
        source: ['MANUAL', 'VOICE_AI', 'SYSTEM'].includes(source) ? source : 'MANUAL',
        responsibleName: responsibleName || req.user?.email || 'Inventory Manager',
      });

      await adjustment.save();

      res.status(201).json({
        success: true,
        message: `Adjustment ${adjustment.reference} created: system ${systemQuantity}, counted ${finalCounted}, variance ${difference}`,
        data: adjustment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validate Adjustment (IDEMPOTENT!)
   * Applies difference to inventory via central inventoryService, creates ADJUSTMENT ledger
   * POST /api/adjustments/:id/validate
   */
  public async validateAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adjustment = await Adjustment.findById(id);

      if (!adjustment) {
        res.status(404).json({ success: false, message: 'Adjustment not found' });
        return;
      }

      if (adjustment.status === 'DONE') {
        res.json({
          success: true,
          message: `Adjustment ${adjustment.reference} is already completed (no change applied).`,
          data: adjustment,
          alreadyValidated: true,
        });
        return;
      }

      if (adjustment.status === 'CANCELED') {
        res.status(400).json({ success: false, message: 'Cannot validate a canceled adjustment' });
        return;
      }

      const operator = req.body?.performedBy || req.user?.email || adjustment.responsibleName || 'Inventory Manager';
      const source = req.body?.source || adjustment.source || 'MANUAL';

      await inventoryService.adjustStock({
        productId: adjustment.productId,
        warehouseId: adjustment.warehouseId,
        locationId: adjustment.locationId,
        countedQuantity: adjustment.countedQuantity,
        reason: adjustment.reason,
        reference: adjustment.reference,
        performedBy: operator,
        source,
      });

      adjustment.status = 'DONE';
      adjustment.validatedAt = new Date();
      await adjustment.save();

      res.json({
        success: true,
        message: `Adjustment ${adjustment.reference} validated. Stock reconciled to ${adjustment.countedQuantity} units.`,
        data: adjustment,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel Adjustment
   * POST /api/adjustments/:id/cancel
   */
  public async cancelAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adjustment = await Adjustment.findById(id);

      if (!adjustment) {
        res.status(404).json({ success: false, message: 'Adjustment not found' });
        return;
      }

      if (adjustment.status === 'DONE') {
        res.status(400).json({ success: false, message: 'Cannot cancel an already completed adjustment' });
        return;
      }

      adjustment.status = 'CANCELED';
      await adjustment.save();

      res.json({ success: true, message: `Adjustment ${adjustment.reference} canceled`, data: adjustment });
    } catch (err) {
      next(err);
    }
  }
}

export const adjustmentController = new AdjustmentController();
