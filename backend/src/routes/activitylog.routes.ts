// ─── Activity Log Routes ────────────────────────────────────────────────────
import { Router } from 'express';
import activityLogController from '../controllers/activitylog.controller';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', activityLogController.getAll);

export default router;
