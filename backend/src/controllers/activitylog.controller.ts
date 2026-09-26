// ─── Activity Log Controller ────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import activityLogRepo from '../repositories/activitylog.repository';
import { sendSuccess, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/pagination';

class ActivityLogController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip, orderBy } = parsePagination(req.query as any);
      const where: any = {};
      if (req.query.category) where.category = req.query.category;
      if (req.query.action) where.action = { contains: req.query.action as string };
      if (req.query.userId) where.userId = req.query.userId;

      const { data, total } = await activityLogRepo.findAll({ skip, take: limit, where, orderBy });
      sendPaginated(res, data, total, page, limit);
    } catch (error) { next(error); }
  }
}

export default new ActivityLogController();
