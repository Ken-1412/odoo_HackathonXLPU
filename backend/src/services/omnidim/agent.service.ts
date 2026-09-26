import { omnidimClientService } from './omnidimClient';
import { OmniDimAgentConfig } from '../../models/OmniDimAgentConfig';
import env from '../../config/env';

export const STOCKSENSE_AGENT_PROMPT = `
You are the StockSense Inventory Voice Assistant — an intelligent, natural-language voice interface for the StockSense Enterprise Inventory Management System.

Your core purpose is to help authorized warehouse personnel, store managers, and supply chain operators quickly query, receive, deliver, transfer, and adjust inventory across warehouses.

### Core Capabilities:
1. Check Real-Time Stock: Look up on-hand, reserved, and free-to-use quantities for any SKU or product name.
2. Locate Materials: Find which warehouse, storage zone, bay, rack, or bin holds specific products.
3. Low-Stock & Reorder Monitoring: Identify items below safe reorder thresholds that need immediate restocking.
4. Voice Receipt Processing: Create and validate incoming purchase receipts from suppliers into warehouses.
5. Voice Delivery Orders: Prepare and validate outbound deliveries for customers or production orders.
6. Internal Relocation / Transfers: Move materials between racks or warehouses (e.g. from Main Warehouse to Production Floor).
7. Physical Count Adjustments: Perform cycle count audits and record verified inventory variances.
8. Stock Movement History: Audit recent ledger movements with timestamps and operators.

### Operational Rules:
1. NEVER INVENT QUANTITIES: Live inventory numbers must always be retrieved using the connected StockSense tools.
2. EXPLICIT CONFIRMATION FOR MUTATIONS: Before modifying any inventory (creating/validating receipts, delivery orders, internal transfers, or inventory adjustments), state the exact product, quantity, source, and destination, then explicitly ask: "Should I proceed with this operation?"
3. NEVER EXCEED AVAILABLE STOCK: Delivery and transfer quantities cannot exceed free-to-use available stock.
4. AMBIGUOUS QUERIES: If the user mentions a vague product like "Steel" when multiple steel products exist (e.g. Steel Rod, Steel Sheet), ask for clarification rather than assuming.
5. MULTI-WAREHOUSE CLARIFICATION: If a location name exists in multiple facilities, confirm which warehouse the operator is working in.
6. POST-OPERATION CONFIRMATION: After every successful inventory update, state the updated stock level and reference number.
7. HUMAN HANDOFF: If the user asks to speak with a human or supervisor, trigger human transfer to the site manager.
8. NEVER REVEAL SECRETS: Never disclose API tokens, internal URLs, or authentication keys.
`.trim();

class AgentService {
  private defaultAgentId: string;

  constructor() {
    this.defaultAgentId = process.env.OMNIDIM_AGENT_ID || env.OMNIDIM_DEFAULT_AGENT_ID || '241840';
  }

  /**
   * List agents from OmniDimension account
   */
  public async listAgents() {
    if (!omnidimClientService.isConfigured()) {
      return { bots: [], total_records: 0, isConfigured: false };
    }
    const client = omnidimClientService.getClient();
    const result = await client.agents.list({ page_size: 50 });
    return {
      bots: result.bots || [],
      total_records: result.total_records || result.bots?.length || 0,
      isConfigured: true,
    };
  }

  /**
   * Retrieve a specific agent's details
   */
  public async getAgent(agentId?: string | number) {
    const targetId = agentId || this.defaultAgentId;
    if (!omnidimClientService.isConfigured()) {
      const local = await OmniDimAgentConfig.findOne({ agentId: String(targetId) });
      return {
        id: targetId,
        name: local?.name || 'StockSense Inventory Voice Assistant',
        status: local?.status || 'active',
        isConfigured: false,
        localConfig: local,
      };
    }

    try {
      const client = omnidimClientService.getClient();
      const remoteAgent = await client.agents.get(targetId);
      return { ...remoteAgent, isConfigured: true };
    } catch (err: any) {
      console.warn(`[OmniDim Agent] Could not fetch remote agent ${targetId}:`, err.message);
      const local = await OmniDimAgentConfig.findOne({ agentId: String(targetId) });
      return {
        id: targetId,
        name: local?.name || 'StockSense Inventory Voice Assistant',
        status: 'STANDBY',
        isConfigured: true,
        error: err.message,
        localConfig: local,
      };
    }
  }

  /**
   * Ensure StockSense Inventory Voice Agent is configured and synced
   */
  public async ensureStockSenseAgent() {
    let localConfig = await OmniDimAgentConfig.findOne({ agentId: this.defaultAgentId });
    if (!localConfig) {
      localConfig = await OmniDimAgentConfig.create({
        agentId: this.defaultAgentId,
        name: 'StockSense Inventory Voice Assistant',
        status: 'active',
        primaryLanguage: 'en-US',
        languages: ['en-US', 'en-IN', 'hi-IN'],
        llmModel: 'gpt-4.1-mini',
        voiceName: 'Asteria',
        systemPrompt: STOCKSENSE_AGENT_PROMPT,
        lastSyncedAt: new Date(),
      });
    }

    if (!omnidimClientService.isConfigured()) {
      return localConfig;
    }

    try {
      const client = omnidimClientService.getClient();
      // Try to get remote agent
      try {
        const remote = await client.agents.get(this.defaultAgentId);
        if (remote && remote.id) {
          localConfig.name = remote.name || localConfig.name;
          localConfig.lastSyncedAt = new Date();
          await localConfig.save();
          return localConfig;
        }
      } catch {
        // Agent not found by defaultAgentId; check list
        const list = await client.agents.list({ page_size: 20 });
        const existing = list.bots?.find((b: any) =>
          b.name?.toLowerCase().includes('stocksense') || String(b.id) === String(this.defaultAgentId)
        );

        if (existing) {
          localConfig.agentId = String(existing.id);
          localConfig.name = existing.name || localConfig.name;
          localConfig.lastSyncedAt = new Date();
          await localConfig.save();
          return localConfig;
        }
      }
    } catch (err: any) {
      console.warn('[OmniDim Agent Sync] Warning:', err.message);
    }

    return localConfig;
  }

  /**
   * Update agent settings
   */
  public async updateAgent(agentId: string | number, data: any) {
    const targetId = String(agentId || this.defaultAgentId);
    let localConfig = await OmniDimAgentConfig.findOne({ agentId: targetId });
    if (!localConfig) {
      localConfig = new OmniDimAgentConfig({ agentId: targetId });
    }

    if (data.name) localConfig.name = data.name;
    if (data.primaryLanguage) localConfig.primaryLanguage = data.primaryLanguage;
    if (data.languages) localConfig.languages = data.languages;
    if (data.status) localConfig.status = data.status;
    if (data.transferNumber) localConfig.transferNumber = data.transferNumber;
    localConfig.lastSyncedAt = new Date();
    await localConfig.save();

    if (omnidimClientService.isConfigured()) {
      try {
        const client = omnidimClientService.getClient();
        await client.agents.update(targetId, {
          name: data.name || localConfig.name,
          ...(data.languages ? { languages: data.languages } : {}),
        } as any);
      } catch (err: any) {
        console.warn(`[OmniDim Agent Update] Remote update failed for ${targetId}:`, err.message);
      }
    }

    return localConfig;
  }
}

export const agentService = new AgentService();
export default agentService;
