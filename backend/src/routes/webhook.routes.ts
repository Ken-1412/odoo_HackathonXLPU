// ─── OmniDimension Webhook Routes ───────────────────────────────────────────
import { Router } from 'express';
import omnidimensionWebhookController from '../controllers/omnidimensionWebhook.controller';

const router = Router();

// Post-call Webhook receivers
router.post('/webhook', omnidimensionWebhookController.handleWebhook);
router.post('/events', omnidimensionWebhookController.handleWebhook);

export default router;
