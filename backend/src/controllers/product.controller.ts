import { Request, Response, NextFunction } from 'express';
import { Product, Inventory, Category } from '../models';

export class ProductController {
  /**
   * List products with search, category, low-stock filter, and pagination
   * GET /api/products
   */
  public async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, category, lowStock, active, page = 1, limit = 50 } = req.query;

      const filter: any = {};

      if (active !== undefined) {
        filter.active = active === 'true';
      }

      if (category && category !== 'All' && category !== 'ALL') {
        filter.category = category;
      }

      if (search) {
        const searchRegex = new RegExp(String(search).trim(), 'i');
        filter.$or = [{ name: searchRegex }, { sku: searchRegex }, { description: searchRegex }];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [products, total] = await Promise.all([
        Product.find(filter).sort({ name: 1 }).skip(skip).limit(Number(limit)),
        Product.countDocuments(filter),
      ]);

      // Enrich products with location-aware stock quantities from Inventory collection
      const enrichedProducts = await Promise.all(
        products.map(async (prod) => {
          const inventories = await Inventory.find({ productId: prod._id })
            .populate('warehouseId', 'name shortCode')
            .populate('locationId', 'name shortCode zone rack bin');

          const currentStock = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);
          const reservedStock = inventories.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0);
          const freeToUseStock = Math.max(0, currentStock - reservedStock);

          let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
          if (currentStock <= 0) {
            status = 'OUT_OF_STOCK';
          } else if (currentStock <= prod.reorderLevel) {
            status = 'LOW_STOCK';
          }

          const locations = inventories.map((inv: any) => ({
            warehouseId: inv.warehouseId?._id || inv.warehouseId,
            warehouseName: inv.warehouseId?.name || 'Main Warehouse',
            zone: inv.locationId?.zone || 'Zone A',
            rack: inv.locationId?.rack || 'Rack 01',
            bin: inv.locationId?.bin || 'Bin 01',
            quantity: inv.onHandQuantity || 0,
          }));

          return {
            id: prod._id,
            sku: prod.sku,
            name: prod.name,
            category: prod.category,
            categoryId: prod.categoryId,
            uom: prod.unitOfMeasure,
            unitOfMeasure: prod.unitOfMeasure,
            reorderLevel: prod.reorderLevel,
            reorderThreshold: prod.reorderLevel,
            preferredReorderQuantity: prod.preferredReorderQuantity,
            costPerUnit: prod.costPerUnit,
            initialStock: prod.initialStock,
            currentStock,
            reservedStock,
            freeToUseStock,
            status,
            locations,
            description: prod.description,
            barcode: prod.barcode,
            active: prod.active,
            createdAt: prod.createdAt,
            updatedAt: prod.updatedAt,
          };
        })
      );

      // Low stock filtering in-memory if requested
      let result = enrichedProducts;
      if (lowStock === 'true') {
        result = enrichedProducts.filter((p) => p.status === 'LOW_STOCK' || p.status === 'OUT_OF_STOCK');
      }

      res.json({
        success: true,
        data: result,
        total,
        page: Number(page),
        limit: Number(limit),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single product by ID
   * GET /api/products/:id
   */
  public async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const prod = await Product.findById(id);
      if (!prod) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      const inventories = await Inventory.find({ productId: prod._id })
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode zone rack bin');

      const currentStock = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);
      const reservedStock = inventories.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0);
      const freeToUseStock = Math.max(0, currentStock - reservedStock);

      let status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
      if (currentStock <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (currentStock <= prod.reorderLevel) {
        status = 'LOW_STOCK';
      }

      const locations = inventories.map((inv: any) => ({
        warehouseId: inv.warehouseId?._id || inv.warehouseId,
        warehouseName: inv.warehouseId?.name || 'Main Warehouse',
        zone: inv.locationId?.zone || 'Zone A',
        rack: inv.locationId?.rack || 'Rack 01',
        bin: inv.locationId?.bin || 'Bin 01',
        quantity: inv.onHandQuantity || 0,
      }));

      res.json({
        success: true,
        data: {
          id: prod._id,
          sku: prod.sku,
          name: prod.name,
          category: prod.category,
          categoryId: prod.categoryId,
          uom: prod.unitOfMeasure,
          unitOfMeasure: prod.unitOfMeasure,
          reorderLevel: prod.reorderLevel,
          reorderThreshold: prod.reorderLevel,
          preferredReorderQuantity: prod.preferredReorderQuantity,
          costPerUnit: prod.costPerUnit,
          initialStock: prod.initialStock,
          currentStock,
          reservedStock,
          freeToUseStock,
          status,
          locations,
          description: prod.description,
          barcode: prod.barcode,
          active: prod.active,
          createdAt: prod.createdAt,
          updatedAt: prod.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new product
   * POST /api/products
   */
  public async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        name,
        sku,
        category = 'General',
        categoryId,
        unitOfMeasure = 'PCS',
        uom,
        reorderLevel = 10,
        reorderThreshold,
        preferredReorderQuantity = 50,
        costPerUnit = 0,
        initialStock = 0,
        description,
        barcode,
      } = req.body;

      if (!name || !sku) {
        res.status(400).json({ success: false, message: 'Product name and SKU are required' });
        return;
      }

      const normalizedSku = String(sku).trim().toUpperCase();
      const existing = await Product.findOne({ sku: normalizedSku });
      if (existing) {
        res.status(409).json({ success: false, message: `Product with SKU "${normalizedSku}" already exists` });
        return;
      }

      // Check category
      let resolvedCategory = category;
      if (categoryId) {
        const cat = await Category.findById(categoryId);
        if (cat) resolvedCategory = cat.name;
      }

      const prod = new Product({
        name: String(name).trim(),
        sku: normalizedSku,
        category: resolvedCategory,
        categoryId: categoryId || undefined,
        unitOfMeasure: uom || unitOfMeasure,
        reorderLevel: reorderThreshold !== undefined ? Number(reorderThreshold) : Number(reorderLevel),
        preferredReorderQuantity: Number(preferredReorderQuantity),
        costPerUnit: Number(costPerUnit),
        initialStock: Number(initialStock),
        description,
        barcode,
      });

      await prod.save();

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: prod,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update product
   * PUT /api/products/:id
   */
  public async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const {
        name,
        sku,
        category,
        categoryId,
        unitOfMeasure,
        uom,
        reorderLevel,
        reorderThreshold,
        preferredReorderQuantity,
        costPerUnit,
        description,
        barcode,
        active,
      } = req.body;

      const prod = await Product.findById(id);
      if (!prod) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      if (sku && String(sku).trim().toUpperCase() !== prod.sku) {
        const newSku = String(sku).trim().toUpperCase();
        const duplicate = await Product.findOne({ sku: newSku });
        if (duplicate) {
          res.status(409).json({ success: false, message: `SKU "${newSku}" is already taken` });
          return;
        }
        prod.sku = newSku;
      }

      if (name) prod.name = String(name).trim();
      if (category) prod.category = category;
      if (categoryId) prod.categoryId = categoryId;
      if (unitOfMeasure || uom) prod.unitOfMeasure = uom || unitOfMeasure;
      if (reorderLevel !== undefined || reorderThreshold !== undefined) {
        prod.reorderLevel = reorderThreshold !== undefined ? Number(reorderThreshold) : Number(reorderLevel);
      }
      if (preferredReorderQuantity !== undefined) {
        prod.preferredReorderQuantity = Number(preferredReorderQuantity);
      }
      if (costPerUnit !== undefined) prod.costPerUnit = Number(costPerUnit);
      if (description !== undefined) prod.description = description;
      if (barcode !== undefined) prod.barcode = barcode;
      if (active !== undefined) prod.active = Boolean(active);

      await prod.save();

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: prod,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete or deactivate product
   * DELETE /api/products/:id
   */
  public async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const prod = await Product.findById(id);
      if (!prod) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      // Check if product has active inventory
      const inventories = await Inventory.find({ productId: prod._id });
      const totalStock = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);

      if (totalStock > 0) {
        // Soft delete / deactivate
        prod.active = false;
        await prod.save();
        res.json({
          success: true,
          message: `Product has ${totalStock} units on hand. Product has been deactivated rather than deleted.`,
        });
        return;
      }

      await Product.findByIdAndDelete(id);
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const productController = new ProductController();
