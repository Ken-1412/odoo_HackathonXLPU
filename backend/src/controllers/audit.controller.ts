// ─── Audit Controller ───────────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import auditService from '../services/audit.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import { createAuditSchema, updateAuditItemSchema } from '../validators/common.validator';
import { parsePagination } from '../utils/pagination';
import { getParam } from '../utils/params';

class AuditController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = parsePagination(req.query as any);
      const { data, total } = await auditService.getAll(req.query);
      sendPaginated(res, data, total, page, limit);
    } catch (error) { next(error); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const audit = await auditService.getById(getParam(req, 'id'));
      sendSuccess(res, audit);
    } catch (error) { next(error); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createAuditSchema.parse(req.body);
      const audit = await auditService.create(data, req.user!.id);
      sendSuccess(res, audit, 'Audit cycle created', 201);
    } catch (error) { next(error); }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateAuditItemSchema.parse(req.body);
      const item = await auditService.updateItem(getParam(req, 'id'), getParam(req, 'itemId'), data.status, req.user!.id);
      sendSuccess(res, item, 'Audit item updated');
    } catch (error) { next(error); }
  }

  async closeCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const audit = await auditService.closeCycle(getParam(req, 'id'), req.user!.id);
      sendSuccess(res, audit, 'Audit cycle closed');
    } catch (error) { next(error); }
  }

  async getDiscrepancyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await auditService.getDiscrepancyReport(getParam(req, 'id'));
      sendSuccess(res, report);
    } catch (error) { next(error); }
  }
}

export default new AuditController();
