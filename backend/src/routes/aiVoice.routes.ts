// ─── AI Voice Routes ────────────────────────────────────────────────────────
import { Router } from 'express';
import aiVoiceController from '../controllers/aiVoice.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Call Management
router.post(
  '/calls/initiate',
  authenticate,
  authorize('Administrator', 'Asset Manager', 'Department Head'),
  aiVoiceController.initiateCall
);

router.get(
  '/calls/history',
  authenticate,
  aiVoiceController.getCallHistory
);

router.get(
  '/calls/:id',
  authenticate,
  aiVoiceController.getCallDetails
);

router.post(
  '/calls/:id/simulate-webhook',
  authenticate,
  authorize('Administrator', 'Asset Manager'),
  aiVoiceController.simulateWebhook
);

// Automated Calling Triggers Scan
router.post(
  '/automated-triggers/scan',
  authenticate,
  authorize('Administrator', 'Asset Manager'),
  aiVoiceController.runAutomatedTriggersScan
);

// Campaign Management (Admin & Asset Manager)
router.post(
  '/campaigns',
  authenticate,
  authorize('Administrator', 'Asset Manager'),
  aiVoiceController.createCampaign
);

router.get(
  '/campaigns',
  authenticate,
  authorize('Administrator', 'Asset Manager'),
  aiVoiceController.getCampaigns
);

router.get(
  '/campaigns/:id',
  authenticate,
  authorize('Administrator', 'Asset Manager'),
  aiVoiceController.getCampaignById
);

// OmniDimension Agents & Voice Sessions
router.get(
  '/agents',
  authenticate,
  authorize('Administrator', 'Asset Manager'),
  aiVoiceController.listAgents
);

router.post(
  '/sessions/create',
  authenticate,
  aiVoiceController.createWebSession
);

// Voice Assistant Tool Endpoint (Admin & Employee)
router.post(
  '/assistant/query',
  authenticate,
  aiVoiceController.assistantQuery
);

export default router;
