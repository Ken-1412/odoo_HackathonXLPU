import { Request, Response, NextFunction } from 'express';
import { Alert } from '../models';

export class AlertController {
  public async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { unreadOnly, type } = req.query;
      const filter: any = {};

      if (unreadOnly === 'true') {
        filter.isRead = false;
      }
      if (type) {
        filter.type = type;
      }

      const alerts = await Alert.find(filter)
        .populate('productId', 'name sku unitOfMeasure')
        .sort({ createdAt: -1 })
        .limit(100);

      res.json({ success: true, data: alerts, count: alerts.length });
    } catch (err) {
      next(err);
    }
  }

  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const alert = await Alert.findByIdAndUpdate(id, { isRead: true }, { new: true });
      if (!alert) {
        res.status(404).json({ success: false, message: 'Alert not found' });
        return;
      }
      res.json({ success: true, message: 'Alert marked as read', data: alert });
    } catch (err) {
      next(err);
    }
  }

  public async markAllAsRead(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await Alert.updateMany({ isRead: false }, { isRead: true });
      res.json({ success: true, message: 'All alerts marked as read' });
    } catch (err) {
      next(err);
    }
  }
}

export const alertController = new AlertController();
