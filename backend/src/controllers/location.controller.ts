import { Request, Response, NextFunction } from 'express';
import { Location, Inventory } from '../models';

export class LocationController {
  public async getLocations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { warehouseId, active } = req.query;
      const filter: any = {};

      if (warehouseId) filter.warehouseId = warehouseId;
      if (active !== undefined) filter.active = active === 'true';

      const locations = await Location.find(filter)
        .populate('warehouseId', 'name shortCode')
        .sort({ name: 1 });

      res.json({ success: true, data: locations });
    } catch (err) {
      next(err);
    }
  }

  public async getLocationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const loc = await Location.findById(id).populate('warehouseId', 'name shortCode');
      if (!loc) {
        res.status(404).json({ success: false, message: 'Location not found' });
        return;
      }
      res.json({ success: true, data: loc });
    } catch (err) {
      next(err);
    }
  }

  public async createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, shortCode, warehouseId, zone, rack, bin, locationType } = req.body;
      if (!name || !warehouseId) {
        res.status(400).json({ success: false, message: 'Location name and warehouseId are required' });
        return;
      }

      const loc = new Location({
        name: name.trim(),
        shortCode: shortCode ? shortCode.trim().toUpperCase() : undefined,
        warehouseId,
        zone: zone || 'Zone A',
        rack: rack || 'Rack 01',
        bin: bin || 'Bin 01',
        locationType: locationType || 'INTERNAL',
      });
      await loc.save();

      res.status(201).json({ success: true, message: 'Location created', data: loc });
    } catch (err) {
      next(err);
    }
  }

  public async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, shortCode, zone, rack, bin, locationType, active } = req.body;

      const loc = await Location.findById(id);
      if (!loc) {
        res.status(404).json({ success: false, message: 'Location not found' });
        return;
      }

      if (name) loc.name = name.trim();
      if (shortCode !== undefined) loc.shortCode = shortCode.trim().toUpperCase();
      if (zone !== undefined) loc.zone = zone;
      if (rack !== undefined) loc.rack = rack;
      if (bin !== undefined) loc.bin = bin;
      if (locationType !== undefined) loc.locationType = locationType;
      if (active !== undefined) loc.active = Boolean(active);

      await loc.save();
      res.json({ success: true, message: 'Location updated', data: loc });
    } catch (err) {
      next(err);
    }
  }

  public async deleteLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const inventories = await Inventory.find({ locationId: id });
      const totalStock = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);

      if (totalStock > 0) {
        res.status(400).json({
          success: false,
          message: `Location contains ${totalStock} units of stock. Relocate stock before deleting.`,
        });
        return;
      }

      await Location.findByIdAndDelete(id);
      res.json({ success: true, message: 'Location deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const locationController = new LocationController();
