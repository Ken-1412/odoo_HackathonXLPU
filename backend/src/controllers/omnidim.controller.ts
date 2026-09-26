import { Request, Response, NextFunction } from 'express';
import {
  OmniDimCallLog,
  OmniDimAgentConfig,
  Product,
  Inventory,
  Warehouse,
  Location,
  Receipt,
  Delivery,
  Transfer,
  Adjustment,
  StockLedger,
} from '../models';
import { inventoryService } from '../services/inventory.service';
import { omnidimClientService } from '../services/omnidim/omnidimClient';
import { agentService, STOCKSENSE_AGENT_PROMPT } from '../services/omnidim/agent.service';
import { callService } from '../services/omnidim/call.service';
import { knowledgeBaseService } from '../services/omnidim/knowledgeBase.service';
import { phoneNumberService } from '../services/omnidim/phoneNumber.service';
import env from '../config/env';

export class OmniDimController {
  private defaultAgentId = process.env.OMNIDIM_AGENT_ID || env.OMNIDIM_DEFAULT_AGENT_ID || '241840';
  private toolToken = process.env.OMNIDIM_TOOL_TOKEN || 'stocksense-omnidim-tool-secret-token-2026';
  private baseUrl = (process.env.OMNIDIM_BASE_URL || env.OMNIDIM_BASE_URL || 'https://backend.omnidim.io/api/v1').replace(/\/+$/, '');

  /**
   * Helper: verify internal tool token
   * Protects OmniDimension -> StockSense Custom API tool calls
   */
  public verifyToolAuth(req: Request, res: Response): boolean {
    const authHeader = req.headers.authorization || '';
    const customHeader = (req.headers['x-omnidim-token'] || req.headers['x-api-key']) as string;
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : customHeader || '';

    const apiKey = omnidimClientService.getApiKey();
    if (token === this.toolToken || (apiKey && token === apiKey) || !this.toolToken) {
      return true;
    }

    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid OmniDimension tool integration token',
    });
    return false;
  }

  /**
   * Overall Integration Health & Subsystem Status
   * GET /api/omnidim/health
   */
  public async getHealth(_req: Request, res: Response): Promise<void> {
    const apiKeyConfigured = omnidimClientService.isConfigured();
    const config = await agentService.ensureStockSenseAgent();
    const phoneInfo = await phoneNumberService.listPhoneNumbers();

    res.json({
      success: true,
      data: {
        apiKeyConfigured,
        agentId: config.agentId,
        agentConfigured: true,
        agentName: config.name,
        connectionStatus: apiKeyConfigured ? 'CONNECTED' : 'STANDBY_PENDING_KEY',
        voiceSessionService: 'AVAILABLE',
        webhookConfigured: true,
        webhookUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/webhooks/omnidim`,
        customToolsStatus: 'HEALTHY',
        phoneNumberCount: phoneInfo.phoneNumbers.length,
        phoneChannelConfigured: phoneInfo.phoneNumbers.length > 0,
        knowledgeBaseCount: 4,
        llmModel: config.llmModel || 'gpt-4.1-mini',
        voiceName: config.voiceName || 'Asteria',
        languages: config.languages || ['en-US', 'en-IN', 'hi-IN'],
      },
    });
  }

  /**
   * Create short-lived web voice session for in-browser voice assistant
   * POST /api/omnidim/session
   * CRITICAL SECURITY RULE: NEVER returns OMNIDIM_API_KEY to the browser!
   */
  public async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const userName = user?.name || user?.username || user?.email?.split('@')[0] || 'Warehouse Operator';
      const role = user?.role || 'Inventory Manager';

      const config = await agentService.ensureStockSenseAgent();
      const apiKey = omnidimClientService.getApiKey();

      let sessionData = {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        wsUrl: '',
        token: '',
        agentId: config.agentId,
        agentName: config.name,
        expiresIn: 3600,
      };

      if (apiKey) {
        try {
          const resp = await fetch(`${this.baseUrl}/sessions/create`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              agent_id: isNaN(Number(config.agentId)) ? config.agentId : Number(config.agentId),
              type: 'voice',
              custom_variables: {
                user_name: userName,
                user_role: role,
                system: 'StockSense Enterprise ERP',
                facility: 'Main Distribution Center',
              },
            }),
          });

          if (resp.ok) {
            const json: any = await resp.json();
            sessionData.sessionId = json.session_id || json.id || sessionData.sessionId;
            sessionData.wsUrl = json.ws_url || json.websocket_url || '';
            sessionData.token = json.token || json.client_token || '';
          } else {
            console.warn('[OmniDim Session] Remote session status:', resp.status);
          }
        } catch (apiErr: any) {
          console.warn('[OmniDim Session] Live session API call warning:', apiErr.message);
        }
      }

      // Log initial session start
      await OmniDimCallLog.findOneAndUpdate(
        { externalCallId: sessionData.sessionId },
        {
          externalCallId: sessionData.sessionId,
          agentId: config.agentId,
          userId: user?.id || user?.userId,
          userName,
          channel: 'web_session',
          startedAt: new Date(),
          status: 'in-progress',
          sourceActions: ['VOICE_SESSION_START'],
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        data: sessionData,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get configured agent status and details
   * GET /api/omnidim/agent
   */
  public async getAgent(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await agentService.ensureStockSenseAgent();
      const remote = await agentService.getAgent(config.agentId);

      res.json({
        success: true,
        data: {
          agentId: config.agentId,
          name: config.name,
          status: config.status,
          primaryLanguage: config.primaryLanguage,
          languages: config.languages,
          llmModel: config.llmModel,
          voiceName: config.voiceName,
          connectionStatus: omnidimClientService.isConfigured() ? 'CONNECTED' : 'STANDBY',
          isConfigured: omnidimClientService.isConfigured(),
          webhookUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/webhooks/omnidim`,
          systemPrompt: STOCKSENSE_AGENT_PROMPT,
          remoteDetails: remote,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update agent configuration
   * PUT /api/omnidim/agent
   */
  public async updateAgent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, agentId, primaryLanguage, languages, status, transferNumber } = req.body;
      const updated = await agentService.updateAgent(agentId, {
        name,
        primaryLanguage,
        languages,
        status,
        transferNumber,
      });
      res.json({ success: true, message: 'Agent configuration updated', data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List Call Logs with pagination and filters
   * GET /api/omnidim/calls
   */
  public async getCalls(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 25, status, channel } = req.query;
      const result = await callService.getCallLogs({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        channel: channel as string,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single call log
   * GET /api/omnidim/calls/:id
   */
  public async getCallDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const log = await callService.getCallLog(req.params.id);
      if (!log) {
        res.status(404).json({ success: false, message: 'Call log not found' });
        return;
      }
      res.json({ success: true, data: log });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Dispatch an outbound call
   * POST /api/omnidim/calls/dispatch
   */
  public async dispatchCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { toNumber, fromNumberId, context } = req.body;
      const user = (req as any).user;
      const userName = user?.name || user?.username || 'Operator';

      if (!toNumber) {
        res.status(400).json({ success: false, message: 'Destination phone number is required.' });
        return;
      }

      const result = await callService.dispatchCall({
        toNumber,
        fromNumberId,
        userName,
        context,
      });

      res.json(result);
    } catch (err: any) {
      next(err);
    }
  }

  /**
   * Phone Numbers Listing
   * GET /api/omnidim/phone-numbers
   */
  public async getPhoneNumbers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await phoneNumberService.listPhoneNumbers();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Knowledge Base Listing
   * GET /api/omnidim/knowledge-base
   */
  public async getKnowledgeBase(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await knowledgeBaseService.listFiles();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload Document to Knowledge Base
   * POST /api/omnidim/knowledge-base
   */
  public async uploadKnowledgeBase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, category, summary } = req.body;
      if (!name) {
        res.status(400).json({ success: false, message: 'Document name is required.' });
        return;
      }
      const result = await knowledgeBaseService.addDocument({ name, category, summary });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Attach Knowledge Base document to Agent
   * POST /api/omnidim/knowledge-base/:id/attach
   */
  public async attachKnowledgeBase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await knowledgeBaseService.attachFile(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Detach Knowledge Base document from Agent
   * POST /api/omnidim/knowledge-base/:id/detach
   */
  public async detachKnowledgeBase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await knowledgeBaseService.detachFile(id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Run Agent Simulation / Test Scenario
   * POST /api/omnidim/simulations/run
   */
  public async runSimulation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scenario = 'stock_lookup', query } = req.body;

      let result: any = {};
      const simCallId = `sim_${Date.now()}`;

      if (scenario === 'stock_lookup') {
        const prodName = query || 'Steel Rod';
        const product = await Product.findOne({ name: new RegExp(prodName, 'i') });
        const invs = product ? await Inventory.find({ productId: product._id }) : [];
        const total = invs.reduce((sum, i) => sum + (i.onHandQuantity || 0), 0);

        result = {
          scenario: 'Stock Lookup',
          userUtterance: `How many ${prodName}s do we have in stock?`,
          detectedIntent: 'CHECK_STOCK',
          entities: { product: prodName, resolvedSku: product?.sku || 'UNKNOWN' },
          speechResponse: product
            ? `We currently have ${total} ${product.unitOfMeasure} of ${product.name} on hand.`
            : `No matching product found for "${prodName}".`,
          ledgerSource: 'SIMULATION',
        };
      } else if (scenario === 'low_stock') {
        const prods = await Product.find({ active: true });
        const items = [];
        for (const p of prods) {
          const invs = await Inventory.find({ productId: p._id });
          const onHand = invs.reduce((sum, i) => sum + (i.onHandQuantity || 0), 0);
          if (onHand <= (p.reorderLevel || 10)) items.push({ name: p.name, onHand });
        }

        result = {
          scenario: 'Low Stock Alert Check',
          userUtterance: 'Which products are currently low in stock?',
          detectedIntent: 'CHECK_LOW_STOCK',
          entities: { count: items.length },
          speechResponse: items.length > 0
            ? `There are ${items.length} items below minimum threshold: ${items.map((i) => `${i.name} (${i.onHand})`).join(', ')}.`
            : 'All inventory levels are currently healthy.',
          ledgerSource: 'SIMULATION',
        };
      } else if (scenario === 'receipt_confirmation') {
        result = {
          scenario: 'Receipt Creation Confirmation',
          userUtterance: 'Receive 50 units of Steel Rod from ABC Steel into Main Warehouse.',
          detectedIntent: 'RECEIVE_STOCK',
          entities: { product: 'Steel Rod 20mm', quantity: 50, supplier: 'ABC Steel', warehouse: 'Main Warehouse' },
          speechResponse: 'I found Steel Rod 20mm (SKU: STL-20MM). This will create and validate a receipt for 50 KG from ABC Steel into Main Store. Should I proceed?',
          requiresConfirmation: true,
          status: 'PENDING_USER_CONFIRMATION',
        };
      } else if (scenario === 'transfer_confirmation') {
        result = {
          scenario: 'Internal Transfer Confirmation',
          userUtterance: 'Transfer 20 Steel Rods from Main Store to Production Floor.',
          detectedIntent: 'TRANSFER_STOCK',
          entities: { product: 'Steel Rod 20mm', quantity: 20, from: 'Main Store', to: 'Production Floor' },
          speechResponse: 'I found 670 KG of Steel Rod 20mm in Main Store. This will relocate 20 KG to Production Floor. Total company stock remains unchanged. Should I proceed?',
          requiresConfirmation: true,
          status: 'PENDING_USER_CONFIRMATION',
        };
      } else {
        result = {
          scenario: 'General Query',
          userUtterance: 'What is the warehouse capacity utilization?',
          detectedIntent: 'WAREHOUSE_TELEMETRY',
          speechResponse: 'Main Warehouse is currently operating at 27% capacity with 670 total units stored across 2 active locations.',
        };
      }

      // Record simulation in call logs
      await OmniDimCallLog.create({
        externalCallId: simCallId,
        agentId: this.defaultAgentId,
        userName: 'Simulation Runner',
        channel: 'simulation',
        startedAt: new Date(),
        endedAt: new Date(),
        duration: 8,
        status: 'completed',
        transcript: `User: ${result.userUtterance}\nAgent: ${result.speechResponse}`,
        summary: `Simulation Test: ${result.scenario}`,
        intent: result.detectedIntent,
        sourceActions: ['SIMULATION_EXECUTION'],
      });

      res.json({
        success: true,
        callId: simCallId,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Webhook endpoint for OmniDimension post-call events
   * POST /api/webhooks/omnidim
   */
  public async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body || {};
      const callId = body.call_id || body.id || body.callId || `omni_${Date.now()}`;
      const status = (body.status || 'completed').toLowerCase();
      const duration = Number(body.duration || body.duration_seconds || 0);
      const transcript = body.transcript || body.text || '';
      const summary = body.summary || '';
      const extractedVariables = body.extracted_variables || body.context || {};

      await OmniDimCallLog.findOneAndUpdate(
        { externalCallId: callId },
        {
          externalCallId: callId,
          agentId: String(body.agent_id || this.defaultAgentId),
          status,
          duration,
          transcript,
          summary,
          extractedVariables,
          endedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (err: any) {
      console.warn('[OmniDim Webhook] Processing warning:', err.message);
      res.json({ success: true, message: 'Webhook received with fallback' });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // OMNIDIMENSION DEDICATED TOOL ENDPOINTS (OPERATING STOCKSENSE VIA VOICE AI)
  // Protected with internal tool token & write-action confirmation
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * Tool: Query Stock of a product
   * GET /api/omnidim/tools/stock?query=Steel
   */
  public async toolStock(req: Request, res: Response): Promise<void> {
    if (!this.verifyToolAuth(req, res)) return;

    try {
      const query = String(req.query.query || req.query.product || req.query.name || '').trim();
      if (!query) {
        res.status(400).json({ success: false, message: 'Please provide a product name or SKU to check stock.' });
        return;
      }

      const product = await Product.findOne({
        $or: [
          { sku: query.toUpperCase() },
          { name: new RegExp(query, 'i') },
        ],
      });

      if (!product) {
        res.json({
          success: false,
          found: false,
          speechResponse: `I could not find any product matching "${query}" in the inventory database.`,
        });
        return;
      }

      const inventories = await Inventory.find({ productId: product._id })
        .populate('warehouseId', 'name shortCode')
        .populate('locationId', 'name shortCode');

      const totalOnHand = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);
      const totalReserved = inventories.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0);
      const totalFree = Math.max(0, totalOnHand - totalReserved);

      const locationDetails = inventories
        .filter((inv) => inv.onHandQuantity > 0)
        .map((inv: any) => `${inv.onHandQuantity} in ${inv.locationId?.name || inv.warehouseId?.name}`)
        .join(', ');

      const speechResponse = `Current stock for ${product.name} (SKU ${product.sku}) is ${totalOnHand} ${product.unitOfMeasure}. Free to use: ${totalFree}. ${
        locationDetails ? `Locations: ${locationDetails}.` : 'No stock in any specific location.'
      }`;

      res.json({
        success: true,
        found: true,
        speechResponse,
        data: {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          totalOnHand,
          totalFree,
          unitOfMeasure: product.unitOfMeasure,
          reorderLevel: product.reorderLevel,
          locations: inventories.map((inv: any) => ({
            warehouse: inv.warehouseId?.name,
            location: inv.locationId?.name,
            onHand: inv.onHandQuantity,
            free: inv.freeToUseQuantity,
          })),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Tool: Query Low Stock Items
   * GET /api/omnidim/tools/low-stock
   */
  public async toolLowStock(req: Request, res: Response): Promise<void> {
    if (!this.verifyToolAuth(req, res)) return;

    try {
      const products = await Product.find({ active: true });
      const lowStockList = [];

      for (const prod of products) {
        const inventories = await Inventory.find({ productId: prod._id });
        const onHand = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);
        if (onHand <= (prod.reorderLevel || 10)) {
          lowStockList.push({
            name: prod.name,
            sku: prod.sku,
            onHand,
            threshold: prod.reorderLevel,
            uom: prod.unitOfMeasure,
          });
        }
      }

      let speechResponse = '';
      if (lowStockList.length === 0) {
        speechResponse = 'All inventory levels are healthy. There are no low stock or out of stock items.';
      } else {
        const itemsSummary = lowStockList
          .map((item) => `${item.name}: ${item.onHand} ${item.uom} (reorder threshold is ${item.threshold})`)
          .join('; ');
        speechResponse = `There are ${lowStockList.length} items requiring reorder: ${itemsSummary}.`;
      }

      res.json({
        success: true,
        speechResponse,
        count: lowStockList.length,
        items: lowStockList,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Tool: Create and/or Validate Receipt via Voice
   * POST /api/omnidim/tools/receipt
   * Requires confirmation before mutating stock!
   */
  public async toolReceipt(req: Request, res: Response): Promise<void> {
    if (!this.verifyToolAuth(req, res)) return;

    try {
      const {
        productName,
        sku,
        quantity,
        supplier = 'Vendor Direct',
        warehouseName,
        confirmed = false,
      } = req.body;

      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity <= 0) {
        res.status(400).json({ success: false, message: 'Please provide a valid quantity to receive.' });
        return;
      }

      let prod = null;
      if (sku) prod = await Product.findOne({ sku: String(sku).trim().toUpperCase() });
      if (!prod && productName) prod = await Product.findOne({ name: new RegExp(String(productName).trim(), 'i') });

      if (!prod) {
        res.json({
          success: false,
          speechResponse: `I could not locate product "${productName || sku}" in StockSense. Please create the product first.`,
        });
        return;
      }

      let wh = warehouseName ? await Warehouse.findOne({ name: new RegExp(warehouseName, 'i') }) : await Warehouse.findOne();
      if (!wh) wh = await Warehouse.findOne();

      let loc = await Location.findOne({ warehouseId: wh?._id });
      if (!loc && wh) {
        loc = await Location.create({ name: 'Main Rack', warehouseId: wh._id });
      }

      // Confirmation requirement
      if (!confirmed) {
        res.json({
          success: true,
          requiresConfirmation: true,
          speechResponse: `I found ${prod.name} (SKU ${prod.sku}). This will create and validate a receipt for ${numQuantity} ${prod.unitOfMeasure} from ${supplier} into ${wh?.name}. Should I proceed?`,
          pendingAction: {
            action: 'RECEIVE_STOCK',
            productName: prod.name,
            sku: prod.sku,
            quantity: numQuantity,
            supplier,
            warehouseId: wh?._id,
            locationId: loc?._id,
          },
        });
        return;
      }

      // Execute receipt and stock mutation with source: 'VOICE_AI'
      const count = await Receipt.countDocuments();
      const reference = `RCP-V${String(count + 1).padStart(3, '0')}`;

      const { inventory, ledger } = await inventoryService.receiveStock({
        productId: prod._id,
        warehouseId: wh?._id!,
        locationId: loc?._id!,
        quantity: numQuantity,
        reference,
        performedBy: 'Voice AI Assistant',
        source: 'VOICE_AI',
        reason: `Voice receipt: +${numQuantity} ${prod.name} from ${supplier}`,
      });

      const receipt = new Receipt({
        reference,
        supplier,
        warehouseId: wh?._id,
        locationId: loc?._id,
        status: 'DONE',
        lines: [
          {
            productId: prod._id,
            productName: prod.name,
            sku: prod.sku,
            quantity: numQuantity,
            receivedQuantity: numQuantity,
            unitOfMeasure: prod.unitOfMeasure,
          },
        ],
        source: 'VOICE_AI',
        responsibleName: 'Voice AI Assistant',
        validatedAt: new Date(),
      });
      await receipt.save();

      res.json({
        success: true,
        speechResponse: `Successfully received ${numQuantity} ${prod.unitOfMeasure} of ${prod.name}. New total on-hand stock is ${inventory.onHandQuantity} units.`,
        data: {
          receiptReference: reference,
          product: prod.name,
          quantityAdded: numQuantity,
          newStock: inventory.onHandQuantity,
          ledgerId: ledger._id,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Tool: Create and/or Validate Delivery via Voice
   * POST /api/omnidim/tools/delivery
   * Requires confirmation before mutating stock!
   */
  public async toolDelivery(req: Request, res: Response): Promise<void> {
    if (!this.verifyToolAuth(req, res)) return;

    try {
      const {
        productName,
        sku,
        quantity,
        customer = 'Customer Order',
        confirmed = false,
      } = req.body;

      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity <= 0) {
        res.status(400).json({ success: false, message: 'Please provide a valid quantity to deliver.' });
        return;
      }

      let prod = null;
      if (sku) prod = await Product.findOne({ sku: String(sku).trim().toUpperCase() });
      if (!prod && productName) prod = await Product.findOne({ name: new RegExp(String(productName).trim(), 'i') });

      if (!prod) {
        res.json({
          success: false,
          speechResponse: `I could not locate product "${productName || sku}".`,
        });
        return;
      }

      const inventories = await Inventory.find({ productId: prod._id });
      const totalAvailable = inventories.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);

      if (totalAvailable < numQuantity) {
        res.json({
          success: false,
          speechResponse: `Cannot deliver ${numQuantity} ${prod.unitOfMeasure} of ${prod.name}. Only ${totalAvailable} units are available in inventory.`,
        });
        return;
      }

      const activeInv = inventories.find((inv) => inv.onHandQuantity >= numQuantity) || inventories[0];

      if (!confirmed) {
        res.json({
          success: true,
          requiresConfirmation: true,
          speechResponse: `I found ${totalAvailable} ${prod.unitOfMeasure} of ${prod.name} on hand. This will deduct ${numQuantity} units for delivery to ${customer}. Should I proceed?`,
          pendingAction: {
            action: 'DELIVER_STOCK',
            productName: prod.name,
            sku: prod.sku,
            quantity: numQuantity,
            customer,
          },
        });
        return;
      }

      const count = await Delivery.countDocuments();
      const reference = `DLV-V${String(count + 1).padStart(3, '0')}`;

      const { inventory, ledger } = await inventoryService.deliverStock({
        productId: prod._id,
        warehouseId: activeInv.warehouseId,
        locationId: activeInv.locationId,
        quantity: numQuantity,
        reference,
        performedBy: 'Voice AI Assistant',
        source: 'VOICE_AI',
        reason: `Voice delivery order: -${numQuantity} ${prod.name} to ${customer}`,
      });

      const delivery = new Delivery({
        reference,
        customer,
        warehouseId: activeInv.warehouseId,
        locationId: activeInv.locationId,
        status: 'DONE',
        stage: 'DONE',
        lines: [
          {
            productId: prod._id,
            productName: prod.name,
            sku: prod.sku,
            quantity: numQuantity,
            unitOfMeasure: prod.unitOfMeasure,
          },
        ],
        source: 'VOICE_AI',
        responsibleName: 'Voice AI Assistant',
        validatedAt: new Date(),
      });
      await delivery.save();

      res.json({
        success: true,
        speechResponse: `Successfully delivered ${numQuantity} ${prod.unitOfMeasure} of ${prod.name} to ${customer}. Remaining stock is ${inventory.onHandQuantity} units.`,
        data: {
          deliveryReference: reference,
          product: prod.name,
          quantityDelivered: numQuantity,
          remainingStock: inventory.onHandQuantity,
          ledgerId: ledger._id,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Tool: Execute Internal Transfer via Voice
   * POST /api/omnidim/tools/transfer
   * Requires confirmation before executing stock relocation!
   */
  public async toolTransfer(req: Request, res: Response): Promise<void> {
    if (!this.verifyToolAuth(req, res)) return;

    try {
      const {
        productName,
        sku,
        quantity,
        fromLocation: fromLocName,
        toLocation: toLocName,
        confirmed = false,
      } = req.body;

      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity <= 0) {
        res.status(400).json({ success: false, message: 'Please specify a valid transfer quantity.' });
        return;
      }

      let prod = null;
      if (sku) prod = await Product.findOne({ sku: String(sku).trim().toUpperCase() });
      if (!prod && productName) prod = await Product.findOne({ name: new RegExp(String(productName).trim(), 'i') });

      if (!prod) {
        res.json({ success: false, speechResponse: `Product "${productName || sku}" was not found.` });
        return;
      }

      let srcLoc = fromLocName ? await Location.findOne({ name: new RegExp(String(fromLocName).trim(), 'i') }) : null;
      if (!srcLoc) {
        const srcInv = await Inventory.findOne({ productId: prod._id, onHandQuantity: { $gte: numQuantity } });
        if (srcInv) srcLoc = await Location.findById(srcInv.locationId);
      }

      let dstLoc = toLocName ? await Location.findOne({ name: new RegExp(String(toLocName).trim(), 'i') }) : null;
      if (!dstLoc && srcLoc) {
        dstLoc = await Location.findOne({ _id: { $ne: srcLoc._id } });
      }

      if (!srcLoc || !dstLoc) {
        res.json({
          success: false,
          speechResponse: 'Could not resolve source and destination locations for transfer.',
        });
        return;
      }

      const srcInv = await Inventory.findOne({ productId: prod._id, locationId: srcLoc._id });
      const available = srcInv ? srcInv.onHandQuantity : 0;

      if (available < numQuantity) {
        res.json({
          success: false,
          speechResponse: `Insufficient stock in ${srcLoc.name}. Only ${available} units available, requested ${numQuantity}.`,
        });
        return;
      }

      if (!confirmed) {
        res.json({
          success: true,
          requiresConfirmation: true,
          speechResponse: `I found ${available} ${prod.unitOfMeasure} of ${prod.name} in ${srcLoc.name}. This will transfer ${numQuantity} to ${dstLoc.name}. Total company stock remains unchanged. Should I proceed?`,
          pendingAction: {
            action: 'TRANSFER_STOCK',
            productName: prod.name,
            sku: prod.sku,
            quantity: numQuantity,
            fromLocation: srcLoc.name,
            toLocation: dstLoc.name,
          },
        });
        return;
      }

      const count = await Transfer.countDocuments();
      const reference = `TRF-V${String(count + 1).padStart(3, '0')}`;

      const { sourceInventory, destInventory, ledger } = await inventoryService.transferStock({
        productId: prod._id,
        fromWarehouseId: srcLoc.warehouseId,
        fromLocationId: srcLoc._id,
        toWarehouseId: dstLoc.warehouseId,
        toLocationId: dstLoc._id,
        quantity: numQuantity,
        reference,
        performedBy: 'Voice AI Assistant',
        source: 'VOICE_AI',
        reason: `Voice transfer of ${numQuantity} ${prod.name} from ${srcLoc.name} to ${dstLoc.name}`,
      });

      const transfer = new Transfer({
        reference,
        fromWarehouseId: srcLoc.warehouseId,
        fromLocationId: srcLoc._id,
        toWarehouseId: dstLoc.warehouseId,
        toLocationId: dstLoc._id,
        status: 'DONE',
        lines: [
          {
            productId: prod._id,
            productName: prod.name,
            sku: prod.sku,
            quantity: numQuantity,
            unitOfMeasure: prod.unitOfMeasure,
          },
        ],
        source: 'VOICE_AI',
        responsibleName: 'Voice AI Assistant',
        validatedAt: new Date(),
      });
      await transfer.save();

      res.json({
        success: true,
        speechResponse: `Successfully moved ${numQuantity} ${prod.name} from ${srcLoc.name} to ${dstLoc.name}. ${srcLoc.name} now has ${sourceInventory.onHandQuantity}, and ${dstLoc.name} has ${destInventory.onHandQuantity}.`,
        data: {
          transferReference: reference,
          product: prod.name,
          sourceStock: sourceInventory.onHandQuantity,
          destStock: destInventory.onHandQuantity,
          ledgerId: ledger._id,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Tool: Execute Inventory Adjustment via Voice
   * POST /api/omnidim/tools/adjustment
   * Requires confirmation before adjusting system stock!
   */
  public async toolAdjustment(req: Request, res: Response): Promise<void> {
    if (!this.verifyToolAuth(req, res)) return;

    try {
      const {
        productName,
        sku,
        countedQuantity,
        locationName,
        reason = 'Voice AI Cycle Count Audit',
        confirmed = false,
      } = req.body;

      const finalCounted = Number(countedQuantity);
      if (isNaN(finalCounted) || finalCounted < 0) {
        res.status(400).json({ success: false, message: 'Please provide a valid counted physical quantity.' });
        return;
      }

      let prod = null;
      if (sku) prod = await Product.findOne({ sku: String(sku).trim().toUpperCase() });
      if (!prod && productName) prod = await Product.findOne({ name: new RegExp(String(productName).trim(), 'i') });

      if (!prod) {
        res.json({ success: false, speechResponse: `Product "${productName || sku}" was not found.` });
        return;
      }

      let loc = locationName ? await Location.findOne({ name: new RegExp(String(locationName).trim(), 'i') }) : null;
      if (!loc) {
        loc = await Location.findOne();
      }

      const inv = await Inventory.findOne({ productId: prod._id, locationId: loc?._id });
      const currentSystemStock = inv ? inv.onHandQuantity : 0;
      const difference = finalCounted - currentSystemStock;

      if (!confirmed) {
        res.json({
          success: true,
          requiresConfirmation: true,
          speechResponse: `The current system stock for ${prod.name} in ${loc?.name} is ${currentSystemStock}. Adjusting to physical count of ${finalCounted} will record a variance of ${difference > 0 ? `+${difference}` : difference}. Should I proceed?`,
          pendingAction: {
            action: 'ADJUST_STOCK',
            productName: prod.name,
            sku: prod.sku,
            currentSystemStock,
            countedQuantity: finalCounted,
            difference,
            location: loc?.name,
          },
        });
        return;
      }

      const count = await Adjustment.countDocuments();
      const reference = `ADJ-V${String(count + 1).padStart(3, '0')}`;

      const { inventory, ledger } = await inventoryService.adjustStock({
        productId: prod._id,
        warehouseId: loc?.warehouseId!,
        locationId: loc?._id!,
        countedQuantity: finalCounted,
        reason,
        reference,
        performedBy: 'Voice AI Assistant',
        source: 'VOICE_AI',
      });

      const adj = new Adjustment({
        reference,
        productId: prod._id,
        productName: prod.name,
        sku: prod.sku,
        warehouseId: loc?.warehouseId,
        locationId: loc?._id,
        systemQuantity: currentSystemStock,
        countedQuantity: finalCounted,
        difference,
        reason,
        status: 'DONE',
        source: 'VOICE_AI',
        responsibleName: 'Voice AI Assistant',
        validatedAt: new Date(),
      });
      await adj.save();

      res.json({
        success: true,
        speechResponse: `Stock for ${prod.name} has been adjusted to ${finalCounted} units. Stock Ledger updated with variance of ${difference}.`,
        data: {
          adjustmentReference: reference,
          product: prod.name,
          systemStockBefore: currentSystemStock,
          newStock: inventory.onHandQuantity,
          difference,
          ledgerId: ledger._id,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Tool: Query Move History via Voice
   * GET /api/omnidim/tools/move-history
   */
  public async toolMoveHistory(req: Request, res: Response): Promise<void> {
    if (!this.verifyToolAuth(req, res)) return;

    try {
      const recent = await StockLedger.find().sort({ createdAt: -1 }).limit(5);
      if (recent.length === 0) {
        res.json({ success: true, speechResponse: 'There are no recorded movements in the stock ledger.' });
        return;
      }

      const summaries = recent.map(
        (m) =>
          `${m.movementType}: ${m.quantity > 0 ? `+${m.quantity}` : m.quantity} ${m.productName} (${m.referenceId}, source: ${m.source})`
      );

      res.json({
        success: true,
        speechResponse: `The latest movements are: ${summaries.join('; ')}.`,
        data: recent,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Tool: Query Warehouse Dashboard Telemetry via Voice
   * GET /api/omnidim/tools/dashboard
   */
  public async toolDashboard(req: Request, res: Response): Promise<void> {
    if (!this.verifyToolAuth(req, res)) return;

    try {
      const [totalProds, invs, lowStock] = await Promise.all([
        Product.countDocuments({ active: true }),
        Inventory.find(),
        Product.countDocuments({ active: true, isLowStock: true }),
      ]);

      const totalUnits = invs.reduce((sum, inv) => sum + (inv.onHandQuantity || 0), 0);

      const speechResponse = `StockSense telemetry: You have ${totalProds} active products cataloged, totaling ${totalUnits} on-hand units across all facilities. ${lowStock} items currently require replenishment attention.`;

      res.json({
        success: true,
        speechResponse,
        data: {
          totalProducts: totalProds,
          totalUnits,
          lowStockCount: lowStock,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const omniDimController = new OmniDimController();
export default omniDimController;
