// ─── OmniDimension Webhook Controller ────────────────────────────────────────
// Secure, idempotent post-call webhook receiver for OmniDimension call completions

import { Request, Response } from 'express';
import aiVoiceService from '../services/aiVoice.service';

export class OmniDimensionWebhookController {
  /**
   * POST /api/integrations/omnidimension/webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const payload = req.body;
    const headers = req.headers;

    // Fast acknowledgement check for webhook test pings
    if (payload?.type === 'ping' || payload?.event === 'ping') {
      res.status(200).json({ success: true, message: 'Pong! OmniDimension webhook endpoint active.' });
      return;
    }

    try {
      if (!payload || typeof payload !== 'object') {
        console.warn('[OmniDimension Webhook] Received invalid non-object payload:', payload);
        res.status(400).json({ success: false, message: 'Invalid JSON payload structure' });
        return;
      }

      console.log('[OmniDimension Webhook] Incoming event:', {
        callId: payload.call_id || payload.id || payload.callId,
        status: payload.status || payload.call_status,
      });

      const result = await aiVoiceService.handleWebhook(payload, headers);

      res.status(200).json({
        success: true,
        message: 'Post-call webhook processed successfully',
        ...result,
      });
    } catch (err: any) {
      console.error('[OmniDimension Webhook Error] Processing failed:', err);
      // Return 200/500 with failure notice so OmniDimension receives acknowledgement or retries accordingly
      res.status(500).json({
        success: false,
        message: 'Webhook processing error',
        error: err.message,
      });
    }
  }
}

export default new OmniDimensionWebhookController();
