// ─── Notification Controller ────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import notificationRepo from '../repositories/notification.repository';
import { sendSuccess, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/pagination';
import { getParam } from '../utils/params';

class NotificationController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = parsePagination(req.query as any);
      const { data, total } = await notificationRepo.findByUser(req.user!.id, skip, limit);
      sendPaginated(res, data, total, page, limit);
    } catch (error) { next(error); }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const notification = await notificationRepo.markRead(getParam(req, 'id'));
      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) { next(error); }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationRepo.markAllRead(req.user!.id);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error) { next(error); }
  }

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await notificationRepo.unreadCount(req.user!.id);
      sendSuccess(res, { count });
    } catch (error) { next(error); }
  }
}

export default new NotificationController();
