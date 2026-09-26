// ─── Category Routes ────────────────────────────────────────────────────────
import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('Administrator', 'Asset Manager', 'Employee', 'Department Head'), categoryController.getAll);
router.get('/:id', authorize('Administrator', 'Asset Manager', 'Employee', 'Department Head'), categoryController.getById);
router.post('/', authorize('Administrator', 'Asset Manager'), categoryController.create);
router.patch('/:id', authorize('Administrator', 'Asset Manager'), categoryController.update);
router.delete('/:id', authorize('Administrator'), categoryController.delete);

export default router;
