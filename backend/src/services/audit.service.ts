// ─── Audit Service ──────────────────────────────────────────────────────────
import auditRepo from '../repositories/audit.repository';
import activityLogRepo from '../repositories/activitylog.repository';
import notificationRepo from '../repositories/notification.repository';
import { AppError } from '../middlewares/errorHandler';
import { parsePagination } from '../utils/pagination';

class AuditService {
  async getAll(query: Record<string, any>) {
    const { skip, take, orderBy } = parsePagination(query);
    const where: any = {};
    if (query.department) where.department = { contains: query.department };
    if (query.isOpen !== undefined) where.isOpen = query.isOpen === 'true';
    return auditRepo.findAll({ skip, take, where, orderBy });
  }

  async getById(id: string) {
    const audit = await auditRepo.findById(id);
    if (!audit) throw new AppError('Audit cycle not found', 404);
    return audit;
  }

  async create(data: any, userId: string) {
    const audit = await auditRepo.create({
      name: data.name,
      department: data.department,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      assetIds: data.assetIds,
      auditorIds: data.auditorIds,
    });

    await activityLogRepo.create({ action: 'AUDIT_CREATED', targetResource: 'Audit', targetId: audit.id, details: `Audit cycle "${data.name}" created`, category: 'Approvals', userId });

    // Notify auditors
    if (data.auditorIds?.length) {
      for (const auditorId of data.auditorIds) {
        await notificationRepo.create({ type: 'AUDIT_ASSIGNED', message: `You have been assigned to audit: ${data.name}`, userId: auditorId });
      }
    }

    return audit;
  }

  async updateItem(auditId: string, itemId: string, status: 'VERIFIED' | 'MISSING' | 'DAMAGED', userId: string) {
    const audit = await auditRepo.findById(auditId);
    if (!audit) throw new AppError('Audit cycle not found', 404);
    if (!audit.isOpen) throw new AppError('Audit cycle is closed. Cannot modify items.', 400);

    const item = await auditRepo.updateItem(itemId, status);
    await activityLogRepo.create({ action: 'AUDIT_ITEM_UPDATED', targetResource: 'AuditItem', targetId: itemId, details: `Audit item ${item.asset.tag} marked as ${status}`, category: 'Alerts', userId });
    return item;
  }

  async closeCycle(id: string, userId: string) {
    const audit = await auditRepo.findById(id);
    if (!audit) throw new AppError('Audit cycle not found', 404);
    if (!audit.isOpen) throw new AppError('Audit cycle is already closed', 400);

    const closed = await auditRepo.closeCycle(id);
    await activityLogRepo.create({ action: 'AUDIT_CLOSED', targetResource: 'Audit', targetId: id, details: `Audit cycle "${audit.name}" closed`, category: 'Approvals', userId });
    return closed;
  }

  async getDiscrepancyReport(id: string) {
    const audit = await auditRepo.findById(id);
    if (!audit) throw new AppError('Audit cycle not found', 404);
    const items = await auditRepo.getDiscrepancyReport(id);
    return {
      auditName: audit.name,
      department: audit.department,
      totalItems: audit.items.length,
      discrepancies: items.length,
      items,
    };
  }
}

export default new AuditService();
