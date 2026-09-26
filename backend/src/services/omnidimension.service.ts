// ─── OmniDimension AI Voice Service ─────────────────────────────────────────
// Centralized backend communication layer with OmniDimension API
// Strictly backend-only; handles API authentication, dispatch, sessions, webhooks, error normalization

import env from '../config/env';

export interface DispatchCallParams {
  toNumber: string;           // E.164 formatted (+919876543210)
  agentId?: string | number;  // OmniDimension agent ID
  fromNumberId?: string | number;
  purpose?: string;
  context?: Record<string, any>; // Dynamic variables passed into conversation
}

export interface DispatchCallResponse {
  success: boolean;
  callId: string;
  status: string;
  agentId?: string;
  rawResponse?: any;
  message?: string;
}

export interface OmniDimensionAgent {
  id: string | number;
  name: string;
  description?: string;
  language?: string;
  voice?: string;
  status?: string;
  createdAt?: string;
}

export interface WebSessionResponse {
  success: boolean;
  sessionId: string;
  wsUrl?: string;
  token?: string;
  agentId?: string;
  raw?: any;
}

export class OmniDimensionService {
  private apiKey: string;
  private baseUrl: string;
  private defaultAgentId: string;

  constructor() {
    this.apiKey = process.env.OMNIDIM_API_KEY || env.OMNIDIM_API_KEY || '';
    this.baseUrl = (process.env.OMNIDIM_BASE_URL || env.OMNIDIM_BASE_URL || 'https://backend.omnidim.io/api/v1').replace(/\/+$/, '');
    this.defaultAgentId = process.env.OMNIDIM_DEFAULT_AGENT_ID || env.OMNIDIM_DEFAULT_AGENT_ID || '';
  }

  public getApiKey(): string {
    return process.env.OMNIDIM_API_KEY || this.apiKey || '';
  }

  public setApiKey(key: string) {
    this.apiKey = key;
    process.env.OMNIDIM_API_KEY = key;
  }

  /**
   * Check if OmniDimension is configured with a valid API key
   */
  public isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.trim().length > 5);
  }

  /**
   * Generic authenticated HTTP fetcher with timeout and error handling
   */
  private async request<T = any>(
    path: string,
    options: RequestInit = {},
    timeoutMs = 12000
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('OmniDimension API key is not configured in backend environment (OMNIDIM_API_KEY).');
    }

    const currentApiKey = this.getApiKey();
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options.headers || {}),
        },
      });


      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      let data: any;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = { rawText: text };
        }
      }

      if (!response.ok) {
        const errorMessage =
          data?.message ||
          data?.error_description ||
          data?.error ||
          `OmniDimension API responded with status ${response.status}: ${response.statusText}`;
        
        console.error(`[OmniDimension Error ${response.status}] ${path}:`, data);
        const err = new Error(errorMessage);
        (err as any).statusCode = response.status;
        (err as any).apiData = data;
        throw err;
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error(`[OmniDimension Timeout] Request to ${path} exceeded ${timeoutMs}ms`);
        throw new Error(`OmniDimension API request timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }

  /**
   * List all configured AI agents on the OmniDimension account
   */
  public async listAgents(): Promise<OmniDimensionAgent[]> {
    try {
      const res = await this.request<any>('/agents', { method: 'GET' });
      // Normalizes various OmniDimension response formats (array, { bots: [] }, { data: [] }, { agents: [] })
      if (Array.isArray(res)) return res;
      if (Array.isArray(res.bots)) return res.bots;
      if (Array.isArray(res.agents)) return res.agents;
      if (Array.isArray(res.data)) return res.data;
      return [];
    } catch (err: any) {
      console.warn('[OmniDimension Service] Failed to list agents:', err.message);
      return [];
    }
  }

  /**
   * Get an agent by ID or resolve the default agent
   */
  public async getOrCreateDefaultAgent(name = 'AssetFlow Voice Assistant'): Promise<string> {
    if (this.defaultAgentId) {
      return this.defaultAgentId;
    }

    try {
      const agents = await this.listAgents();
      if (agents.length > 0) {
        const agent = agents[0];
        return String(agent.id);
      }

      // If no agent exists, try creating a default voice agent
      try {
        const created = await this.request<any>('/agents', {
          method: 'POST',
          body: JSON.stringify({
            name,
            language: 'en-US',
            voice: 'female',
            voice_id: 'aura-asteria-en',
            gender: 'female',
            description: 'AssetFlow ERP Enterprise Female Voice Agent for Asset Audits, Maintenance Follow-ups, and Employee Communications',
            prompt: 'You are Sophia, the official female voice assistant for AssetFlow ERP. You communicate with warm, clear, polite, and humane professionalism. You verify equipment possession during audits, deliver critical administrative messages, and assist employees with hardware allocations, asset requests, and IT support. If an employee asks for an asset or laptop during the call, warmly confirm that you are allocating it to them right now and that it will immediately reflect under My Assets on their AssetFlow dashboard. Never say you cannot help with asset requests.',
          }),
        });
        if (created?.id) {
          this.defaultAgentId = String(created.id);
          return this.defaultAgentId;
        }
      } catch (createErr: any) {
        console.warn('[OmniDimension] Could not auto-create agent, using fallback:', createErr.message);
      }
    } catch (err: any) {
      console.warn('[OmniDimension Service] Agent lookup error:', err.message);
    }

    // Return fallback system agent ID
    return '1';
  }

  /**
   * Dispatch an outbound phone call via OmniDimension
   */
  public async dispatchCall(params: DispatchCallParams): Promise<DispatchCallResponse> {
    const { toNumber, context, fromNumberId } = params;

    let agentId = params.agentId || this.defaultAgentId;
    if (!agentId) {
      agentId = await this.getOrCreateDefaultAgent();
    }

    const payload: any = {
      agent_id: isNaN(Number(agentId)) ? agentId : Number(agentId),
      to_number: toNumber,
      voice: 'female',
      call_context: context || {},
    };

    if (fromNumberId) {
      payload.from_number_id = fromNumberId;
    }

    let response: any;
    try {
      response = await this.request<any>('/calls/dispatch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (firstErr: any) {
      try {
        response = await this.request<any>('/calls', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      } catch (secondErr: any) {
        console.error('[OmniDimension Service] Dispatch call failed:', firstErr.message, secondErr.message);
        throw new Error(`Failed to dispatch call via OmniDimension: ${firstErr.message}`);
      }
    }

    const callId =
      response?.call_id ||
      response?.id ||
      response?.data?.call_id ||
      response?.data?.id ||
      `omni_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const status = response?.status || response?.data?.status || 'initiated';

    return {
      success: true,
      callId: String(callId),
      status: status.toLowerCase(),
      agentId: String(agentId),
      rawResponse: response,
      message: 'AI Voice Call successfully dispatched via OmniDimension.',
    };

  }

  /**
   * Retrieve live status and details of a call by its OmniDimension Call ID
   */
  public async getCallStatus(callId: string): Promise<any> {
    try {
      const response = await this.request<any>(`/calls/${encodeURIComponent(callId)}`, {
        method: 'GET',
      });
      return response?.data || response;
    } catch (err: any) {
      console.warn(`[OmniDimension Service] Call status lookup failed for ${callId}:`, err.message);
      return null;
    }
  }

  /**
   * Create a real-time web voice session for in-browser voice assistant
   */
  public async createWebSession(params: {
    userId: string;
    role: string;
    organizationId?: string;
    userName?: string;
    context?: Record<string, any>;
  }): Promise<WebSessionResponse> {
    let agentId = this.defaultAgentId;
    if (!agentId) {
      agentId = await this.getOrCreateDefaultAgent();
    }

    try {
      const sessionPayload = {
        agent_id: isNaN(Number(agentId)) ? agentId : Number(agentId),
        user_id: params.userId,
        user_name: params.userName || 'AssetFlow User',
        user_role: params.role,
        context: {
          userId: params.userId,
          role: params.role,
          organizationId: params.organizationId,
          ...(params.context || {}),
        },
      };

      const res = await this.request<any>('/sessions/create', {
        method: 'POST',
        body: JSON.stringify(sessionPayload),
      });

      return {
        success: true,
        sessionId: res?.session_id || res?.id || `sess_${Date.now()}`,
        wsUrl: res?.ws_url || res?.websocket_url || '',
        token: res?.token || res?.client_token || '',
        agentId: String(agentId),
        raw: res,
      };
    } catch (err: any) {
      console.warn('[OmniDimension Service] Web session creation fallback:', err.message);
      // Return a structured fallback session for local browser voice assistant execution
      return {
        success: true,
        sessionId: `local_voice_${Date.now()}`,
        wsUrl: '',
        token: '',
        agentId: String(agentId),
      };
    }
  }

  /**
   * Normalize post-call webhook payload received from OmniDimension
   */
  public normalizeWebhookPayload(body: any): {
    callId?: string;
    status: string;
    duration?: number;
    transcript?: string;
    summary?: string;
    sentiment?: string;
    extractedVariables?: Record<string, any>;
    outcome?: string;
    recordingUrl?: string;
  } {
    if (!body || typeof body !== 'object') {
      return { status: 'UNKNOWN' };
    }

    const callId = body.call_id || body.id || body.callId || body.data?.call_id || body.data?.id;
    const rawStatus = (body.status || body.call_status || body.data?.status || 'COMPLETED').toUpperCase();
    
    // Normalize status
    let status = 'COMPLETED';
    if (rawStatus.includes('FAIL') || rawStatus.includes('ERROR')) status = 'FAILED';
    else if (rawStatus.includes('NO_ANSWER') || rawStatus.includes('BUSY') || rawStatus.includes('UNANSWERED')) status = 'NO_ANSWER';
    else if (rawStatus.includes('CANCEL')) status = 'CANCELLED';
    else if (rawStatus.includes('PROGRESS')) status = 'IN_PROGRESS';
    else if (rawStatus.includes('RING')) status = 'RINGING';

    const duration = Number(body.duration || body.call_duration || body.duration_seconds || body.data?.duration || 0);
    const transcript = body.full_conversation || body.transcript || body.conversation || body.data?.transcript || '';
    const summary = body.summary || body.call_summary || body.data?.summary || '';
    const sentiment = (body.sentiment || body.call_sentiment || body.data?.sentiment || 'neutral').toLowerCase();
    const recordingUrl = body.recording_url || body.recording || body.data?.recording_url || undefined;
    const extractedVariables = body.extracted_variables || body.variables || body.data?.extracted_variables || {};

    // Determine audit/verification outcome if present
    let outcome = 'UNKNOWN';
    const auditStatusRaw = (
      extractedVariables.verification_result ||
      extractedVariables.audit_outcome ||
      extractedVariables.status ||
      body.outcome ||
      ''
    ).toUpperCase();

    if (auditStatusRaw.includes('VERIFIED') && !auditStatusRaw.includes('NOT')) {
      outcome = 'VERIFIED';
    } else if (auditStatusRaw.includes('MISSING')) {
      outcome = 'ASSET_MISSING';
    } else if (auditStatusRaw.includes('DAMAGED')) {
      outcome = 'ASSET_DAMAGED';
    } else if (auditStatusRaw.includes('DISPUTE')) {
      outcome = 'EMPLOYEE_DISPUTED';
    } else if (auditStatusRaw.includes('NOT_VERIFIED') || auditStatusRaw.includes('UNVERIFIED')) {
      outcome = 'NOT_VERIFIED';
    } else if (status === 'NO_ANSWER') {
      outcome = 'NO_ANSWER';
    } else if (status === 'FAILED') {
      outcome = 'CALL_FAILED';
    } else {
      // Analyze text transcript for possession confirmation
      const textLower = (transcript + ' ' + summary).toLowerCase();
      if (textLower.includes('confirmed possession') || textLower.includes('yes i have it') || textLower.includes('still have this device') || textLower.includes('verified possession')) {
        outcome = 'VERIFIED';
      } else if (textLower.includes('missing') || textLower.includes('lost') || textLower.includes('stolen') || textLower.includes('cannot find')) {
        outcome = 'ASSET_MISSING';
      } else if (textLower.includes('damaged') || textLower.includes('broken') || textLower.includes('screen cracked')) {
        outcome = 'ASSET_DAMAGED';
      } else if (textLower.includes('do not have') || textLower.includes('not mine') || textLower.includes('never received')) {
        outcome = 'EMPLOYEE_DISPUTED';
      } else if (status === 'COMPLETED') {
        outcome = 'VERIFIED';
      }
    }

    return {
      callId: callId ? String(callId) : undefined,
      status,
      duration: isNaN(duration) ? undefined : duration,
      transcript: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
      summary: typeof summary === 'string' ? summary : JSON.stringify(summary),
      sentiment,
      extractedVariables,
      outcome,
      recordingUrl,
    };
  }
}

export default new OmniDimensionService();
