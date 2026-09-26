// ─── Category Service ───────────────────────────────────────────────────────
import categoryRepo from '../repositories/category.repository';
import activityLogRepo from '../repositories/activitylog.repository';
import { AppError } from '../middlewares/errorHandler';
import { parsePagination } from '../utils/pagination';

class CategoryService {
  async getAll(query: Record<string, any>) {
    const { skip, take } = parsePagination(query);
    const where: any = {};
    if (query.search) where.name = { contains: query.search };
    if (query.status) where.status = query.status;
    const limit = query.limit ? take : 100;
    return categoryRepo.findAll({
      skip,
      take: limit,
      where,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortOrder === 'desc' ? 'desc' : 'asc' } : { createdAt: 'asc' },
    });
  }

  async getById(id: string) {
    const cat = await categoryRepo.findById(id);
    if (!cat) throw new AppError('Category not found', 404);
    return cat;
  }

  async create(data: any, userId: string) {
    const existing = await categoryRepo.findByName(data.name);
    if (existing) throw new AppError('Category name already exists', 409);

    const cat = await categoryRepo.create({
      name: data.name,
      description: data.description,
      iconName: data.iconName || 'Laptop',
      status: data.status || 'ACTIVE',
    });

    if (data.customFields?.length) {
      await categoryRepo.replaceCustomFields(cat.id, data.customFields);
    }

    await activityLogRepo.create({ action: 'CATEGORY_CREATED', targetResource: 'AssetCategory', targetId: cat.id, details: `Category "${cat.name}" created`, category: 'Approvals', userId });
    return categoryRepo.findById(cat.id);
  }

  async update(id: string, data: any, userId: string) {
    const cat = await categoryRepo.findById(id);
    if (!cat) throw new AppError('Category not found', 404);

    if (data.name && data.name !== cat.name) {
      const existing = await categoryRepo.findByName(data.name);
      if (existing) throw new AppError('Category name already exists', 409);
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.iconName !== undefined) updateData.iconName = data.iconName;
    if (data.status !== undefined) updateData.status = data.status;

    await categoryRepo.update(id, updateData);
    if (data.customFields) await categoryRepo.replaceCustomFields(id, data.customFields);

    await activityLogRepo.create({ action: 'CATEGORY_UPDATED', targetResource: 'AssetCategory', targetId: id, details: `Category "${data.name || cat.name}" updated`, category: 'Approvals', userId });
    return categoryRepo.findById(id);
  }

  async delete(id: string, userId: string) {
    const cat = await categoryRepo.findById(id);
    if (!cat) throw new AppError('Category not found', 404);
    if (cat._count.assets > 0) throw new AppError('Cannot delete category with assets. Reassign assets first.', 400);
    await categoryRepo.delete(id);
    await activityLogRepo.create({ action: 'CATEGORY_DELETED', targetResource: 'AssetCategory', targetId: id, details: `Category "${cat.name}" deleted`, category: 'Approvals', userId });
  }
}

export default new CategoryService();
