// ─── Notification Routes ────────────────────────────────────────────────────
import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.getAll);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

export default router;
