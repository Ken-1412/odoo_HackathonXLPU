import { Request, Response, NextFunction } from 'express';
import { Category, Product } from '../models';

export class CategoryController {
  public async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await Category.find().sort({ name: 1 });
      const enriched = await Promise.all(
        categories.map(async (cat) => {
          const productCount = await Product.countDocuments({
            $or: [{ categoryId: cat._id }, { category: cat.name }],
          });
          return {
            id: cat._id,
            name: cat.name,
            code: cat.code,
            description: cat.description,
            active: cat.active,
            productCount,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
          };
        })
      );
      res.json({ success: true, data: enriched });
    } catch (err) {
      next(err);
    }
  }

  public async createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, code, description } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Category name is required' });
        return;
      }

      const existing = await Category.findOne({ name: name.trim() });
      if (existing) {
        res.status(409).json({ success: false, message: 'Category already exists' });
        return;
      }

      const cat = new Category({
        name: name.trim(),
        code: code ? code.trim().toUpperCase() : undefined,
        description,
      });
      await cat.save();

      res.status(201).json({ success: true, message: 'Category created', data: cat });
    } catch (err) {
      next(err);
    }
  }

  public async updateCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, code, description, active } = req.body;

      const cat = await Category.findById(id);
      if (!cat) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }

      if (name) cat.name = name.trim();
      if (code !== undefined) cat.code = code.trim().toUpperCase();
      if (description !== undefined) cat.description = description;
      if (active !== undefined) cat.active = Boolean(active);

      await cat.save();
      res.json({ success: true, message: 'Category updated', data: cat });
    } catch (err) {
      next(err);
    }
  }

  public async deleteCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await Category.findByIdAndDelete(id);
      res.json({ success: true, message: 'Category deleted' });
    } catch (err) {
      next(err);
    }
  }

  // Legacy route aliases for backward compatibility
  public getAll = this.getCategories.bind(this);
  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cat = await Category.findById(req.params.id);
      if (!cat) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      res.json({ success: true, data: cat });
    } catch (err) {
      next(err);
    }
  };
  public create = this.createCategory.bind(this);
  public update = this.updateCategory.bind(this);
  public delete = this.deleteCategory.bind(this);
}

export const categoryController = new CategoryController();
export default categoryController;
