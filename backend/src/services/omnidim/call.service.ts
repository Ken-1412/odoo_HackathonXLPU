import { omnidimClientService } from './omnidimClient';
import { OmniDimCallLog } from '../../models/OmniDimCallLog';
import env from '../../config/env';

export interface DispatchCallParams {
  agentId?: number | string;
  toNumber: string;
  fromNumberId?: number;
  userName?: string;
  context?: Record<string, any>;
}

class CallService {
  private defaultAgentId: string;

  constructor() {
    this.defaultAgentId = process.env.OMNIDIM_AGENT_ID || env.OMNIDIM_DEFAULT_AGENT_ID || '241840';
  }

  /**
   * Dispatch an outbound phone call via OmniDimension
   */
  public async dispatchCall(params: DispatchCallParams) {
    const { toNumber, fromNumberId, userName = 'Warehouse Operator', context = {} } = params;
    const agentId = Number(params.agentId || this.defaultAgentId);

    // Validate phone number format
    const cleanNumber = toNumber.replace(/[\s\-()]/g, '');
    if (!/^\+?[1-9]\d{7,14}$/.test(cleanNumber)) {
      throw new Error(`Invalid phone number format: "${toNumber}". Expected E.164 format (e.g. +14155552671 or +919876543210).`);
    }

    if (!omnidimClientService.isConfigured()) {
      // Simulate safe outbound dispatch for local development
      const simulatedId = `call_mock_${Date.now()}`;
      await OmniDimCallLog.create({
        externalCallId: simulatedId,
        agentId: String(agentId),
        userName,
        customerNumber: cleanNumber,
        channel: 'phone_outbound',
        startedAt: new Date(),
        status: 'queued',
        summary: `Outbound test call dispatched to ${cleanNumber}. (Live telco carrier pending OMNIDIM_API_KEY).`,
        sourceActions: ['OUTBOUND_CALL_DISPATCH'],
      });

      return {
        success: true,
        status: 'queued',
        requestId: Math.floor(Math.random() * 100000),
        callId: simulatedId,
        message: 'Outbound test call queued. (Live dispatch requires configured OMNIDIM_API_KEY & phone number).',
      };
    }

    const client = omnidimClientService.getClient();
    const result = await client.calls.dispatch({
      agent_id: agentId,
      to_number: cleanNumber,
      ...(fromNumberId ? { from_number_id: fromNumberId } : {}),
      call_context: {
        system: 'StockSense Inventory ERP',
        operator_name: userName,
        ...context,
      },
    });

    const callId = `call_${result.requestId || Date.now()}`;
    await OmniDimCallLog.create({
      externalCallId: callId,
      agentId: String(agentId),
      userName,
      customerNumber: cleanNumber,
      channel: 'phone_outbound',
      startedAt: new Date(),
      status: result.status || 'queued',
      sourceActions: ['OUTBOUND_CALL_DISPATCH'],
    });

    return {
      success: result.success ?? true,
      status: result.status,
      requestId: result.requestId,
      callId,
      message: 'Outbound call dispatched successfully via OmniDimension.',
    };
  }

  /**
   * List call logs from local database with optional remote synchronization
   */
  public async getCallLogs(filter: { page?: number; limit?: number; status?: string; channel?: string }) {
    const { page = 1, limit = 25, status, channel } = filter;
    const query: any = {};

    if (status && status !== 'ALL') query.status = status;
    if (channel && channel !== 'ALL') query.channel = channel;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      OmniDimCallLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      OmniDimCallLog.countDocuments(query),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
    };
  }

  /**
   * Get single call log with transcript
   */
  public async getCallLog(callId: string) {
    let log = await OmniDimCallLog.findOne({ externalCallId: callId });
    if (!log && callId.length === 24) {
      log = await OmniDimCallLog.findById(callId);
    }
    return log;
  }
}

export const callService = new CallService();
export default callService;
