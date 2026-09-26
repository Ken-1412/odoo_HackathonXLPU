import { Request, Response, NextFunction } from 'express';
import { Delivery, Product, Warehouse, Location, Inventory } from '../models';
import { inventoryService } from '../services/inventory.service';

export class DeliveryController {
  public async getDeliveries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, warehouseId, stage, search } = req.query;
      const filter: any = {};

      if (status && status !== 'ALL') filter.status = status;
      if (stage && stage !== 'ALL') filter.stage = stage;
      if (warehouseId) filter.warehouseId = warehouseId;
      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        filter.$or = [{ reference: searchRegex }, { customer: searchRegex }];
      }

      const deliveries = await Delivery.find(filter)
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode')
        .sort({ createdAt: -1 });

      const mapped = await Promise.all(
        deliveries.map(async (d: any) => {
          const itemsWithStock = await Promise.all(
            (d.lines || []).map(async (line: any) => {
              const inv = await Inventory.findOne({
                productId: line.productId,
                warehouseId: d.warehouseId?._id,
              });
              return {
                productId: line.productId,
                productName: line.productName,
                sku: line.sku,
                quantity: line.quantity,
                uom: line.unitOfMeasure,
                availableStock: inv ? inv.onHandQuantity : 0,
              };
            })
          );

          return {
            id: d._id,
            reference: d.reference,
            customer: d.customer,
            deliveryAddress: d.deliveryAddress,
            sourceWarehouseId: d.warehouseId?._id,
            sourceWarehouseName: d.warehouseId?.name,
            sourceLocationId: d.locationId?._id,
            sourceLocation: d.locationId?.name || 'Main Rack',
            scheduledDate: d.scheduledDate ? d.scheduledDate.toISOString().split('T')[0] : '',
            status: d.status,
            stage: d.stage,
            operator: d.responsibleName || 'Inventory Manager',
            items: itemsWithStock,
            source: d.source,
            notes: d.notes,
            createdAt: d.createdAt,
            validatedAt: d.validatedAt,
          };
        })
      );

      res.json({ success: true, data: mapped });
    } catch (err) {
      next(err);
    }
  }

  public async getDeliveryById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const d: any = await Delivery.findById(id)
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode');

      if (!d) {
        res.status(404).json({ success: false, message: 'Delivery order not found' });
        return;
      }

      const itemsWithStock = await Promise.all(
        (d.lines || []).map(async (line: any) => {
          const inv = await Inventory.findOne({
            productId: line.productId,
            warehouseId: d.warehouseId?._id,
          });
          return {
            productId: line.productId,
            productName: line.productName,
            sku: line.sku,
            quantity: line.quantity,
            uom: line.unitOfMeasure,
            availableStock: inv ? inv.onHandQuantity : 0,
          };
        })
      );

      res.json({
        success: true,
        data: {
          id: d._id,
          reference: d.reference,
          customer: d.customer,
          deliveryAddress: d.deliveryAddress,
          sourceWarehouseId: d.warehouseId?._id,
          sourceWarehouseName: d.warehouseId?.name,
          sourceLocationId: d.locationId?._id,
          sourceLocation: d.locationId?.name || 'Main Rack',
          scheduledDate: d.scheduledDate ? d.scheduledDate.toISOString().split('T')[0] : '',
          status: d.status,
          stage: d.stage,
          operator: d.responsibleName || 'Inventory Manager',
          items: itemsWithStock,
          source: d.source,
          notes: d.notes,
          createdAt: d.createdAt,
          validatedAt: d.validatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async createDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        reference,
        customer,
        deliveryAddress,
        warehouseId,
        sourceWarehouseId,
        locationId,
        sourceLocationId,
        sourceLocation,
        scheduledDate,
        items,
        notes,
        source = 'MANUAL',
        responsibleName,
      } = req.body;

      if (!customer || !items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ success: false, message: 'Customer and at least one item line are required' });
        return;
      }

      let finalRef = reference ? String(reference).trim().toUpperCase() : '';
      if (!finalRef) {
        const count = await Delivery.countDocuments();
        finalRef = `DLV-${String(count + 1).padStart(3, '0')}`;
      }

      const finalWarehouseId = warehouseId || sourceWarehouseId;
      let wh = finalWarehouseId ? await Warehouse.findById(finalWarehouseId) : null;
      if (!wh) {
        wh = await Warehouse.findOne();
      }

      const finalLocId = locationId || sourceLocationId;
      let loc = finalLocId ? await Location.findById(finalLocId) : null;
      if (!loc && wh) {
        loc = await Location.findOne({ warehouseId: wh._id });
        if (!loc) {
          loc = await Location.create({
            name: sourceLocation || 'Main Rack',
            warehouseId: wh._id,
          });
        }
      }

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
          unitOfMeasure: prod.unitOfMeasure || item.uom || 'PCS',
        });
      }

      const delivery = new Delivery({
        reference: finalRef,
        customer: String(customer).trim(),
        deliveryAddress,
        warehouseId: wh?._id,
        locationId: loc?._id,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
        status: 'READY',
        stage: 'PICKING',
        lines: resolvedLines,
        notes,
        source: ['MANUAL', 'VOICE_AI', 'SYSTEM'].includes(source) ? source : 'MANUAL',
        responsibleName: responsibleName || req.user?.email || 'Inventory Manager',
      });

      await delivery.save();

      res.status(201).json({
        success: true,
        message: `Delivery ${delivery.reference} created successfully`,
        data: delivery,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Advance Delivery to PICKING stage
   * POST /api/deliveries/:id/pick
   */
  public async pickDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const delivery = await Delivery.findById(id);
      if (!delivery) {
        res.status(404).json({ success: false, message: 'Delivery order not found' });
        return;
      }
      delivery.stage = 'PICKING';
      delivery.status = 'READY';
      await delivery.save();
      res.json({ success: true, message: 'Delivery moved to PICKING stage', data: delivery });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Advance Delivery to PACKING stage
   * POST /api/deliveries/:id/pack
   */
  public async packDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const delivery = await Delivery.findById(id);
      if (!delivery) {
        res.status(404).json({ success: false, message: 'Delivery order not found' });
        return;
      }
      delivery.stage = 'PACKING';
      delivery.status = 'READY';
      await delivery.save();
      res.json({ success: true, message: 'Delivery moved to PACKING stage', data: delivery });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Validate Delivery (IDEMPOTENT!)
   * Verifies free stock, decreases inventory via central inventoryService, creates DELIVERY ledger
   * POST /api/deliveries/:id/validate
   */
  public async validateDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const delivery = await Delivery.findById(id);

      if (!delivery) {
        res.status(404).json({ success: false, message: 'Delivery order not found' });
        return;
      }

      // Idempotency check: if already DONE, return success without double-decrementing stock
      if (delivery.status === 'DONE' && delivery.stage === 'DONE') {
        res.json({
          success: true,
          message: `Delivery ${delivery.reference} is already completed (no change applied).`,
          data: delivery,
          alreadyValidated: true,
        });
        return;
      }

      if (delivery.status === 'CANCELED') {
        res.status(400).json({ success: false, message: 'Cannot validate a canceled delivery order' });
        return;
      }

      const operator = req.body?.performedBy || req.user?.email || delivery.responsibleName || 'Inventory Manager';
      const source = req.body?.source || delivery.source || 'MANUAL';

      // Perform stock decrement for each line through centralized inventory service
      for (const line of delivery.lines) {
        await inventoryService.deliverStock({
          productId: line.productId,
          warehouseId: delivery.warehouseId,
          locationId: delivery.locationId || delivery.warehouseId,
          quantity: line.quantity,
          reference: delivery.reference,
          performedBy: operator,
          source,
          reason: `Delivered order ${delivery.reference} to ${delivery.customer}`,
        });
      }

      delivery.status = 'DONE';
      delivery.stage = 'DONE';
      delivery.validatedAt = new Date();
      await delivery.save();

      res.json({
        success: true,
        message: `Delivery ${delivery.reference} validated successfully. Stock decremented and Ledger posted.`,
        data: delivery,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel Delivery
   * POST /api/deliveries/:id/cancel
   */
  public async cancelDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const delivery = await Delivery.findById(id);

      if (!delivery) {
        res.status(404).json({ success: false, message: 'Delivery order not found' });
        return;
      }

      if (delivery.status === 'DONE') {
        res.status(400).json({
          success: false,
          message: 'Cannot cancel a delivery that has already been dispatched and deducted from inventory',
        });
        return;
      }

      delivery.status = 'CANCELED';
      delivery.stage = 'CANCELED';
      await delivery.save();

      res.json({ success: true, message: `Delivery ${delivery.reference} canceled`, data: delivery });
    } catch (err) {
      next(err);
    }
  }
}

export const deliveryController = new DeliveryController();
