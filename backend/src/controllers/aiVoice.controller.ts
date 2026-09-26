// ─── AI Voice Controller ───────────────────────────────────────────────────
import { Request, Response, NextFunction } from 'express';
import aiVoiceService from '../services/aiVoice.service';
import omniDimensionService from '../services/omnidimension.service';
import aiVoiceAssistantService from '../services/aiVoiceAssistant.service';
import { AppError } from '../middlewares/errorHandler';

class AIVoiceController {
  /**
   * POST /api/ai-voice/calls/initiate
   * Admin-initiated single employee AI Call
   */
  async initiateCall(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const {
        employeeId,
        phoneNumber,
        purpose,
        customPurpose,
        assetId,
        maintenanceId,
        auditCycleId,
        campaignId,
        additionalContext,
        agentId,
      } = req.body;

      if (!employeeId && !phoneNumber) {
        throw new AppError('Either an employee selection or valid phone number is required.', 400);
      }

      const call = await aiVoiceService.initiateCall(
        {
          employeeId,
          phoneNumber,
          purpose,
          customPurpose,
          assetId,
          maintenanceId,
          auditCycleId,
          campaignId,
          additionalContext,
          agentId,
        },
        user
      );

      res.status(201).json({
        success: true,
        message: 'AI call successfully queued and initiated.',
        data: call,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai-voice/calls/history
   * Call history with search, filters, pagination
   */
  async getCallHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await aiVoiceService.getCallHistory(req.query, user);
      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai-voice/calls/:id
   * Single call details view
   */
  async getCallDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const call = await aiVoiceService.getCallDetails(String(req.params.id), user);
      res.json({
        success: true,
        data: call,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/ai-voice/campaigns
   * Create and launch a bulk AI calling campaign
   */
  async createCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { title, purpose, customPurpose, auditCycleId, employeeIds, assetIds, agentId } = req.body;

      if (!title || !title.trim()) {
        throw new AppError('Campaign title is required.', 400);
      }

      const campaign = await aiVoiceService.createCampaign(
        {
          title: title.trim(),
          purpose,
          customPurpose,
          auditCycleId,
          employeeIds,
          assetIds,
          agentId,
        },
        user
      );

      res.status(201).json({
        success: true,
        message: 'AI call campaign created and queued for dispatch.',
        data: campaign,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai-voice/campaigns
   * List campaigns
   */
  async getCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await aiVoiceService.getCampaigns(req.query, user.organizationId);
      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai-voice/campaigns/:id
   * Single campaign details
   */
  async getCampaignById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const campaign = await aiVoiceService.getCampaignById(String(req.params.id), user.organizationId);
      res.json({
        success: true,
        data: campaign,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/ai-voice/agents
   * List configured OmniDimension voice agents
   */
  async listAgents(_req: Request, res: Response, next: NextFunction) {
    try {
      const agents = await omniDimensionService.listAgents();
      res.json({
        success: true,
        data: agents,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/ai-voice/sessions/create
   * Create browser web voice session for live AI assistant
   */
  async createWebSession(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const session = await omniDimensionService.createWebSession({
        userId: user.id,
        role: user.role,
        organizationId: user.organizationId,
        userName: (user as any).name,
        context: req.body?.context,
      });

      res.json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/ai-voice/assistant/query
   * Execute secure voice assistant query & tools
   */
  async assistantQuery(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { query, context } = req.body;

      const result = await aiVoiceAssistantService.processQuery(
        { query: query || '', context },
        {
          id: user.id,
          name: (user as any).name || 'User',
          role: user.role,
          organizationId: user.organizationId,
        }
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/ai-voice/automated-triggers/scan
   * Run automated trigger check for maintenance, return due, warranties, audits
   */
  async runAutomatedTriggersScan(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const result = await aiVoiceService.runAutomatedTriggersScan(user.organizationId);
      res.json({
        success: true,
        message: `Automated trigger scan completed: ${result.totalTriggered} call(s) dispatched.`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/ai-voice/calls/:id/simulate-webhook
   * Replay/simulate post-call webhook for immediate validation & demo
   */
  async simulateWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const callId = String(req.params.id);
      const { outcome, duration, transcript, summary, sentiment } = req.body;
      const result = await aiVoiceService.simulateWebhookCall(callId, outcome, {
        duration,
        transcript,
        summary,
        sentiment,
      });

      res.json({
        success: true,
        message: 'Webhook simulation completed and database records updated.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default new AIVoiceController();
