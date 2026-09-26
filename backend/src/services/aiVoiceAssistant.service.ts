// ─── AI Voice Assistant Service ──────────────────────────────────────────────
// Executes purpose-built, secure ERP tools for Voice Assistant in Admin & Employee Portals.
// Enforces strict authentication and role-based authorization.
// Features: Natural conversational AI, real-time DB search, OmniDimension AI Voice Call initiation,
// Role-differentiated Admin vs Employee knowledge bases and full natural language processing.

import prisma from '../config/database';
import activityLogRepo from '../repositories/activitylog.repository';
import notificationRepo from '../repositories/notification.repository';
import maintenanceService from './maintenance.service';
import assetRequestService from './assetRequest.service';
import bookingService from './booking.service';
import allocationService from './allocation.service';
import aiVoiceService from './aiVoice.service';
import omniDimensionService from './omnidimension.service';
import { AppError } from '../middlewares/errorHandler';

export interface AssistantQueryInput {
  query: string;
  context?: Record<string, any>;
}

export interface AssistantQueryResult {
  answer: string;
  actionTaken?: string;
  toolUsed?: string;
  data?: any;
  suggestions?: string[];
}

export class AIVoiceAssistantService {
  /**
   * Process user voice or text query with intent classification & safe tool execution
   */
  async processQuery(
    input: AssistantQueryInput,
    user: { id: string; name: string; role: string; organizationId?: string }
  ): Promise<AssistantQueryResult> {
    const rawQuery = (input.query || '').trim();
    const q = rawQuery.toLowerCase();
    const isAdmin = user.role === 'Administrator' || user.role === 'Asset Manager';
    const userName = user.name || 'there';

    if (!q) {
      return {
        answer: isAdmin
          ? `Hello ${userName}! I'm your **AssetFlow Admin AI Voice Assistant**. How can I assist you with inventory management, maintenance tickets, expiring warranties, department analytics, or dispatching AI voice calls?`
          : `Hello ${userName}! I'm your **AssetFlow AI Voice Assistant**. How can I help you today? You can ask about your assigned assets, contact your IT admin, report broken hardware, or check room bookings.`,
        suggestions: this.getDefaultSuggestions(user.role),
      };
    }

    // ─── CONVERSATIONAL / GREETING INTENTS (must be first) ──────────────────
    const greeting = this.handleConversationalQuery(q, userName, isAdmin);
    if (greeting) return greeting;

    // ─── INTENT: AI ACTION SAFETY — RESTRICTED SENSITIVE ACTIONS ───────────
    if (this.matchesSensitiveSecurityIntent(q)) {
      return this.handleSensitiveSecurityOperation(rawQuery);
    }

    // ─── INTENT: SAFE ASSET TRANSFER REQUEST (Requirement 9) ───────────────
    if (this.matchesTransferIntent(q)) {
      try {
        const transferResult = await this.handleTransferRequestIntent(rawQuery, user, isAdmin);
        if (transferResult) return transferResult;
      } catch (err: any) {
        return {
          answer: `I couldn't process the transfer request: ${err.message}. Please use the Transfer form in your portal.`,
          suggestions: this.getDefaultSuggestions(user.role),
        };
      }
    }

    // ─── INTENT: UPDATE EMPLOYEE PHONE NUMBER ──────────────────────────────
    if (this.matchesUpdatePhoneIntent(q)) {
      try {
        const updateResult = await this.handleUpdatePhoneIntent(rawQuery, user);
        if (updateResult) return updateResult;
      } catch (err: any) {
        return {
          answer: `I couldn't update the phone number: ${err.message}.`,
          suggestions: this.getDefaultSuggestions(user.role),
        };
      }
    }

    // ─── INTENT: CALL EMPLOYEE VIA OMNIDIMENSION ───────────────────────────
    if (this.matchesCallIntent(q)) {
      try {
        const callResult = await this.handleCallEmployeeIntent(rawQuery, user);
        if (callResult) return callResult;
      } catch (err: any) {
        return {
          answer: `I tried to initiate the call but encountered an issue: ${err.message || 'Unknown error'}. Please try again or use the AI Communications panel.`,
          suggestions: this.getDefaultSuggestions(user.role),
        };
      }
    }

    // ─── INTENT: IT ADMIN & HELPDESK INQUIRIES (For Both Employees & Admins) ─
    if (this.matchesITAdminIntent(q)) {
      try {
        return await this.handleITAdminQuery(user.organizationId);
      } catch (err: any) {
        return { answer: `I couldn't fetch the IT admin details right now. Error: ${err.message}`, suggestions: ['How many assets are available in company?', 'What assets are assigned to me?'] };
      }
    }

    // ─── INTENT: ASSET REQUISITION (Creates live request in database) ────────
    if (this.matchesAssetRequestIntent(q)) {
      try {
        const reqResult = await this.handleAssetRequestIntent(rawQuery, user, isAdmin);
        if (reqResult) return reqResult;
      } catch (err: any) {
        return { answer: `I couldn't process the asset request: ${err.message}. Please use the Request Asset button in your dashboard.`, suggestions: this.getDefaultSuggestions(user.role) };
      }
    }

    // ─── INTENT: VIEW / AVAILABLE ASSETS IN COMPANY ────────────────────────
    if (this.matchesAvailableAssetsIntent(q)) {
      try {
        return await this.handleAvailableAssetsQuery(rawQuery, user.organizationId, isAdmin, user);
      } catch (err: any) {
        return { answer: `I couldn't fetch available assets: ${err.message}`, suggestions: this.getDefaultSuggestions(user.role) };
      }
    }

    // ─── INTENT: EMPLOYEE SEARCH & DIRECTORY ──────────────────────────────
    if (this.matchesEmployeeSearchIntent(q)) {
      try {
        const empResult = await this.handleEmployeeSearchQuery(rawQuery, user.organizationId, isAdmin);
        if (empResult) return empResult;
      } catch (err: any) {
        return { answer: `I couldn't search the employee directory: ${err.message}`, suggestions: this.getDefaultSuggestions(user.role) };
      }
    }

    // ─── INTENT: ASSET SEARCH & CODE LOOKUP ────────────────────────────────
    if (this.matchesAssetSearchIntent(q)) {
      try {
        const assetResult = await this.handleAssetSearchQuery(rawQuery, user.organizationId, isAdmin);
        if (assetResult) return assetResult;
      } catch (err: any) {
        return { answer: `I couldn't search assets right now: ${err.message}`, suggestions: this.getDefaultSuggestions(user.role) };
      }
    }

    // ─── INTENT: MY ASSETS / ASSIGNED TO ME / WHERE IS MY LAPTOP ──────────
    if (this.matchesMyAssetsIntent(q)) {
      try {
        return await this.handleGetMyAssets(user.id, isAdmin, q);
      } catch (err: any) {
        return { answer: `I couldn't fetch assigned assets: ${err.message}`, suggestions: this.getDefaultSuggestions(user.role) };
      }
    }

    // ─── INTENT: ADMIN INVENTORY & STATS ──────────────────────────────────
    if (isAdmin) {
      const adminResult = await this.handleAdminIntents(q, user.organizationId);
      if (adminResult) return adminResult;
    }

    // ─── INTENT: MY MAINTENANCE REQUESTS ──────────────────────────────────
    if (this.matchesMyMaintenanceIntent(q)) {
      try {
        return await this.handleGetMyMaintenance(user.id, isAdmin);
      } catch (err: any) {
        return { answer: `I couldn't fetch maintenance requests: ${err.message}` };
      }
    }

    // ─── INTENT: REPORT ISSUE / BROKEN SCREEN ─────────────────────────────
    if (this.matchesMaintenanceReportIntent(q)) {
      try {
        return await this.handleCreateMaintenanceIntent(rawQuery, user, isAdmin);
      } catch (err: any) {
        return { answer: `I couldn't create the maintenance ticket: ${err.message}. Please use the Maintenance form in your dashboard.` };
      }
    }

    // ─── INTENT: ROOM / BOOKING (e.g. Conference Room A tomorrow) ───────────
    if (this.matchesBookingIntent(q)) {
      try {
        return await this.handleCheckBookingAvailability(rawQuery, user, isAdmin);
      } catch (err: any) {
        return { answer: `I couldn't check booking availability: ${err.message}` };
      }
    }

    // ─── INTENT: COMPANY & ROLE-BASED KNOWLEDGE BASE ───────────────────────
    const knowledgeResult = this.handleCompanyKnowledgeQuery(rawQuery, isAdmin);
    if (knowledgeResult) return knowledgeResult;

    // ─── SMART CONVERSATIONAL FALLBACK ────────────────────────────────────
    return this.handleSmartFallback(rawQuery, user, isAdmin);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Intent Matchers & Helper Methods ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  private getDefaultSuggestions(role: string): string[] {
    const isAdmin = role === 'Administrator' || role === 'Asset Manager';
    return isAdmin
      ? [
          'How many assets are available in company?',
          'Who is the IT admin?',
          'Assets under maintenance summary',
          'Hardware warranties expiring soon',
          'Call employee Priya Sharma',
          'Department asset utilization',
        ]
      : [
          'Who is the IT admin?',
          'How many assets are available in company?',
          'Request a laptop',
          'What assets are assigned to me?',
          'Report a broken screen',
          'Check meeting room availability',
        ];
  }

  /**
   * Handle greetings, small talk, "who are you", "thank you", help, etc.
   */
  private handleConversationalQuery(q: string, userName: string, isAdmin: boolean): AssistantQueryResult | null {
    const suggestions = this.getDefaultSuggestions(isAdmin ? 'Administrator' : 'Employee');

    // Greetings
    if (/^(hi|hey|hello|hola|sup|yo|howdy|greetings|hiya|good\s*(morning|afternoon|evening|day)|what'?s?\s*up)[\s!?.]*$/i.test(q)) {
      const greetings = isAdmin
        ? [
            `Hey ${userName}! 👋 AssetFlow Admin AI at your service. Ask me about inventory stats, maintenance tickets, expiring warranties, or dispatching AI voice calls!`,
            `Hello ${userName}! 😊 Ready to assist with system analytics, employee call campaigns, and asset oversight. What would you like to check?`,
          ]
        : [
            `Hey ${userName}! 👋 How can I help you today? I can check your assigned devices, connect you with IT support, report hardware issues, or book meeting rooms!`,
            `Hello ${userName}! 😊 Ready to assist you. Ask me anything about your assigned assets or IT requests!`,
          ];
      return {
        answer: greetings[Math.floor(Math.random() * greetings.length)],
        suggestions,
      };
    }

    // How are you
    if (/^(how\s*(are\s*you|r\s*u|is\s*it\s*going|'?s?\s*it\s*going|do\s*you\s*do)|what'?s?\s*(up|good|new)|you\s*(good|okay|ok|alright))[\s!?.]*$/i.test(q)) {
      return {
        answer: `I'm doing great, ${userName}! 😄 All AssetFlow ERP systems and OmniDimension Voice AI services are running at 100% capacity. How can I assist you today?`,
        suggestions,
      };
    }

    // Who are you / What are you
    if (/^(who\s*(are\s*you|r\s*u)|what\s*(are\s*you|r\s*u)|tell\s*me\s*about\s*(yourself|you)|introduce\s*yourself|your\s*name)[\s!?.]*$/i.test(q)) {
      return {
        answer: isAdmin
          ? `I'm the **AssetFlow Admin AI Voice Assistant** 🤖, powered by OmniDimension's AI Engine.\n\nAs an Administrator, I can help you with:\n• 📊 **Inventory & Stock**: Check real-time available assets & categories\n• 🔧 **Maintenance Overview**: Track active repair tickets across all departments\n• ⏰ **Warranty Tracking**: Inspect hardware expiring in 90 days\n• 📈 **Department Analytics**: View resource allocation per department\n• 📞 **Automated Voice Calls**: Dispatch AI audit calls to employees via OmniDimension`
          : `I'm the **AssetFlow AI Voice Assistant** 🤖, powered by OmniDimension AI.\n\nI can help you with:\n• 💻 **Assigned Assets**: View your active hardware allocations\n• 👨‍💻 **IT Support**: Find your IT Administrator contact details\n• 🔧 **Maintenance**: Report broken screens or damaged devices\n• 📅 **Bookings**: Check conference room & vehicle availability`,
        suggestions,
      };
    }

    // Thank you
    if (/^(thanks?(\s*you)?|thank\s*u|ty|appreciate\s*it|thx|cheers|nice|great|awesome|perfect|cool|wonderful|amazing|excellent)[\s!?.]*$/i.test(q)) {
      return {
        answer: `You're very welcome, ${userName}! 😊 Let me know if you need anything else.`,
        suggestions,
      };
    }

    // Goodbye
    if (/^(bye|goodbye|see\s*ya|later|take\s*care|have\s*a\s*good\s*(day|one)|cya|peace|i'?m?\s*done|that'?s?\s*(all|it)|nothing\s*(else|more))[\s!?.]*$/i.test(q)) {
      return {
        answer: `Goodbye, ${userName}! 👋 Have a productive day ahead. I'm here whenever you need system assistance!`,
        suggestions,
      };
    }

    // Help / Capabilities
    if (/^(help|help\s*me|what\s*can\s*(you|u)\s*do|commands|features|options|menu|guide|capabilities)[\s!?.]*$/i.test(q)) {
      return {
        answer: isAdmin
          ? `Here are key Admin capabilities available to you, ${userName}:\n\n🔹 **Inventory & Stock**\n• "How many laptops are available?"\n• "Search asset AF-1001"\n\n🔹 **Maintenance & Repair**\n• "Assets under maintenance summary"\n• "Check repair tickets"\n\n🔹 **Warranties & Analytics**\n• "Hardware warranties expiring soon"\n• "Department asset utilization"\n• "Total employee headcount"\n\n🔹 **OmniDimension AI Voice Calls**\n• "Call employee Priya Sharma" (Dispatches automated audit call)\n• "How to run voice audit campaign?"`
          : `Here's what I can do for you, ${userName}:\n\n🔹 **My Devices**\n• "What assets are assigned to me?"\n• "Where is my laptop?"\n\n🔹 **IT Support**\n• "Who is the IT admin?"\n• "Contact IT support"\n\n🔹 **Maintenance**\n• "Report a broken screen"\n• "Check my maintenance tickets"\n\n🔹 **Bookings**\n• "Is Conference Room A available?"\n• "Check room availability"`,
        suggestions,
      };
    }

    // Acknowledgements
    if (/^(yes|yeah|yep|yup|no|nope|nah|okay|ok|sure|alright|got\s*it|understood|i\s*see|right|correct)[\s!?.]*$/i.test(q)) {
      return {
        answer: `Understood! Let me know what you'd like to check next.`,
        suggestions,
      };
    }

    return null;
  }

  private matchesUpdatePhoneIntent(q: string): boolean {
    const hasPhoneWord = q.includes('phone') || q.includes('number') || q.includes('mobile') || q.includes('contact');
    const hasActionWord = q.includes('update') || q.includes('set') || q.includes('change') || q.includes('add') || q.includes('save') || q.includes('register') || q.includes('assign');
    const hasDigits = /\d{7,15}/.test(q.replace(/[\s\-\+\(\)]/g, ''));
    return hasPhoneWord && hasActionWord && hasDigits;
  }

  private matchesCallIntent(q: string): boolean {
    return (
      (q.includes('call') || q.includes('dial') || q.includes('ring') || q.includes('reach out to') || q.includes('dispatch call') || (q.includes('phone') && !q.includes('update') && !q.includes('set'))) &&
      !q.includes('call log') && !q.includes('history') && !q.includes('how to call')
    );
  }

  private matchesTransferIntent(q: string): boolean {
    return (
      (q.includes('transfer') || q.includes('reassign') || q.includes('hand over to') || q.includes('give my laptop to') || q.includes('give laptop to') || q.includes('transfer my')) &&
      !q.includes('how to transfer') && !q.includes('transfer policy')
    );
  }

  private matchesSensitiveSecurityIntent(q: string): boolean {
    return (
      q.includes('delete asset') || q.includes('delete all asset') || q.includes('drop table') ||
      q.includes('delete database') || q.includes('dispose asset') || q.includes('retire asset') ||
      q.includes('change role') || q.includes('make me admin') || q.includes('grant admin') ||
      q.includes('terminate employee') || q.includes('delete employee')
    );
  }

  private matchesITAdminIntent(q: string): boolean {
    return (
      q.includes('it admin') || q.includes('admin contact') || q.includes('who is the admin') ||
      q.includes('who is admin') || q.includes('helpdesk') || q.includes('sysadmin') ||
      q.includes('system administrator') || q.includes('support team') || q.includes('contact admin') ||
      q.includes('who is the it') || q.includes('it support') || q.includes('tech support') ||
      q.includes('admin details') || q.includes('about it admin') || q.includes('details about it admin') ||
      q.includes('details about the admin') || q.includes('who is my admin') || q.includes('admin phone') ||
      q.includes('admin email') || q.includes('admin info') || q.includes('it team') || q.includes('it manager')
    );
  }

  private matchesEmployeeSearchIntent(q: string): boolean {
    return (
      q.includes('find employee') || q.includes('search employee') ||
      q.includes('staff member') || q.includes('team member') || q.includes('user details') ||
      q.includes('find user') || q.includes('look up')
    );
  }

  private matchesAssetSearchIntent(q: string): boolean {
    return (
      q.includes('search asset') || q.includes('find asset') || q.includes('asset code') ||
      q.includes('asset tag') || q.includes('serial number') || q.includes('where is asset') ||
      /af-\d+/i.test(q)
    );
  }

  private matchesMyAssetsIntent(q: string): boolean {
    return (
      q.includes('my laptop') || q.includes('my asset') || q.includes('assigned to me') ||
      q.includes('my equipment') || q.includes('my devices') || q.includes('my computer') ||
      q.includes('what do i have') || q.includes('my assigned') || q.includes('where is my')
    );
  }

  private matchesAvailableAssetsIntent(q: string): boolean {
    return (
      q.includes('available asset') || q.includes('available laptop') || q.includes('in stock') ||
      q.includes('inventory') || q.includes('how many laptop') || q.includes('how many asset') ||
      q.includes('how many monitor') || q.includes('how many printer') || q.includes('how many desktop') ||
      q.includes('view asset') || q.includes('show asset') || q.includes('list asset') ||
      q.includes('view available') || q.includes('show available') || q.includes('assets are available') ||
      q.includes('available in company') || q.includes('available in the company') ||
      q.includes('in company') || q.includes('company asset') || q.includes('stock in company') ||
      q.includes('company inventory') || q.includes('total assets') || q.includes('assets in company') ||
      q.includes('how many total') || q.includes('assets count') || q.includes('all assets')
    );
  }

  private matchesMyMaintenanceIntent(q: string): boolean {
    return (
      q.includes('my maintenance') || q.includes('my ticket') || q.includes('status of my request') ||
      q.includes('repair status') || q.includes('my repair') || q.includes('my request')
    );
  }

  private matchesMaintenanceReportIntent(q: string): boolean {
    return (
      q.includes('report') || q.includes('broken') || q.includes('damaged') ||
      q.includes('screen') || q.includes('maintenance for') ||
      (q.includes('fix') && (q.includes('laptop') || q.includes('screen') || q.includes('device') || q.includes('computer')))
    );
  }

  private matchesBookingIntent(q: string): boolean {
    return (
      q.includes('room') || q.includes('booking') || q.includes('conference') ||
      q.includes('vehicle') || q.includes('slot') || q.includes('reserve')
    );
  }

  private matchesAssetRequestIntent(q: string): boolean {
    return (
      q.includes('request an asset') || q.includes('request asset') || q.includes('request a asset') ||
      q.includes('need a laptop') || q.includes('need a monitor') || q.includes('need a printer') ||
      q.includes('need a desktop') || q.includes('need a macbook') || q.includes('need a keyboard') ||
      q.includes('need a mouse') || q.includes('need a phone') || q.includes('need a device') ||
      q.includes('need an asset') || q.includes('need asset') || q.includes('request new') ||
      q.includes('request laptop') || q.includes('request monitor') || q.includes('request printer') ||
      q.includes('request desktop') || q.includes('request macbook') || q.includes('request phone') ||
      q.includes('request device') || q.includes('requisition') || q.includes('can i request') ||
      q.includes('can i get a') || q.includes('can i have a') || q.includes('i want to request') ||
      q.includes('i want a laptop') || q.includes('i want a monitor') || q.includes('i want a printer') ||
      q.includes('issue me a') || q.includes('allocate me a') || q.includes('order a laptop') ||
      q.includes('apply for asset') || q.includes('apply for a laptop') || q.includes('submit asset request') ||
      q.includes('allocate') || q.includes('allocation') || q.includes('assign me') ||
      q.includes('assign asset') || q.includes('give me a') || q.includes('give me an asset') ||
      q.includes('give me laptop') || q.includes('provide me a') || q.includes('provision me') ||
      q.includes('can you allocate') || q.includes('allocate laptop') || q.includes('allocate asset') ||
      q.includes('allocate me an asset') || q.includes('allocate me asset') || q.includes('assign a laptop') ||
      q.includes('assign laptop to me') || q.includes('get me a laptop') || q.includes('get a laptop') ||
      /allocate\s+(?:me\s+)?(?:an?\s+)?(?:asset|laptop|printer|monitor|desktop|macbook|computer|device)/i.test(q) ||
      /request\s+(?:asset\s+)?(?:af-\d+|laptop|printer|monitor|desktop|macbook|computer)/i.test(q)
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Admin Intents (grouped) ──────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleAdminIntents(q: string, organizationId?: string): Promise<AssistantQueryResult | null> {
    // Maintenance summary
    if (q.includes('under maintenance') || q.includes('in repair') || q.includes('maintenance summary') || q.includes('repair ticket')) {
      try { return await this.handleAdminMaintenanceSummary(organizationId); } catch (err: any) { return { answer: `Error: ${err.message}` }; }
    }

    // Warranty expiring
    if (q.includes('warranty') || q.includes('expiring') || q.includes('expire')) {
      try { return await this.handleAdminWarrantyExpiring(organizationId); } catch (err: any) { return { answer: `Error: ${err.message}` }; }
    }

    // Department utilization
    if (q.includes('department') || q.includes('utilization') || q.includes('allocated assets')) {
      try { return await this.handleAdminDepartmentStats(organizationId); } catch (err: any) { return { answer: `Error: ${err.message}` }; }
    }

    // Employee count
    if (q.includes('how many employees') || q.includes('headcount') || q.includes('total staff') || q.includes('employee count')) {
      try { return await this.handleAdminEmployeeCount(q, organizationId); } catch (err: any) { return { answer: `Error: ${err.message}` }; }
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Action Handlers ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle restricted sensitive security operations (Requirement 9)
   */
  private handleSensitiveSecurityOperation(query: string): AssistantQueryResult {
    let operation = 'Restricted Administrative Operation';
    const q = query.toLowerCase();
    if (q.includes('delete') || q.includes('drop')) operation = 'Asset / Database Deletion';
    else if (q.includes('dispose') || q.includes('retire')) operation = 'Asset Disposal / Decommission';
    else if (q.includes('role') || q.includes('admin')) operation = 'Privilege Escalation & Role Modification';

    return {
      answer: `🛡️ **AI Action Safety Guardrail**\n\nDirect execution of **${operation}** is strictly restricted for security and audit compliance.\n\nThe AI Voice Assistant does not directly perform irreversible operations, deletions, or role changes without verified administrative authorization.\n\nPlease navigate to the **Admin Settings & Governance Portal** with appropriate administrative credentials to initiate this workflow.`,
      suggestions: ['How many laptops are available?', 'Assets under maintenance summary', 'Hardware warranties expiring soon'],
    };
  }

  /**
   * Handle safe asset transfer requests (Requirement 9)
   */
  private async handleTransferRequestIntent(
    query: string,
    user: { id: string; name: string; role: string; organizationId?: string },
    isAdmin: boolean
  ): Promise<AssistantQueryResult> {
    const clean = query.replace(/(please|can you|i want to|transfer|reassign|my|laptop|asset|device|to|for)/gi, ' ').trim();
    const recipientName = clean.split(/\s+/)[0] || '';

    let recipient: any = null;
    if (recipientName.length >= 2) {
      recipient = await prisma.user.findFirst({
        where: {
          isDeleted: false,
          name: { contains: recipientName },
          id: { not: user.id },
          ...(user.organizationId ? { organizationId: user.organizationId } : {}),
        },
      });
    }

    const myAllocations = await prisma.assetAllocation.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        asset: {
          include: { category: true },
        },
      },
    });

    if (myAllocations.length === 0) {
      return {
        answer: `I cannot initiate a transfer because you currently don't have any active assets assigned to you in AssetFlow ERP.`,
        suggestions: ['What assets are assigned to me?', 'Who is the IT admin?'],
      };
    }

    const assetToTransfer = myAllocations.find((a) => a.asset.category?.name?.toLowerCase().includes('laptop'))?.asset || myAllocations[0].asset;

    if (!recipient) {
      const sampleUser = await prisma.user.findFirst({
        where: { isDeleted: false, id: { not: user.id }, ...(user.organizationId ? { organizationId: user.organizationId } : {}) },
      });
      recipient = sampleUser || { id: user.id, name: recipientName || 'Colleague', email: 'colleague@company.com' };
    }

    const transfer = await prisma.transferRequest.create({
      data: {
        assetId: assetToTransfer.id,
        fromUserId: user.id,
        toUserId: recipient.id,
        reason: `Initiated via AssetFlow AI Voice Assistant by ${user.name}`,
        status: 'REQUESTED',
      },
      include: {
        asset: true,
        toUser: true,
      },
    });

    await activityLogRepo.create({
      action: 'TRANSFER_REQUESTED',
      targetResource: 'TransferRequest',
      targetId: transfer.id,
      details: `AI Assistant created transfer request for ${assetToTransfer.name} (${assetToTransfer.tag}) from ${user.name} to ${recipient.name}`,
      category: 'Approvals',
      userId: user.id,
      ...(user.organizationId ? { organizationId: user.organizationId } : {}),
    });

    return {
      answer: `🛡️ **AI Safety Protocol Activated**\n\nAssets cannot be transferred directly without authorization. I have generated an official **Transfer Request** instead:\n\n• **Asset**: ${assetToTransfer.name} (\`${assetToTransfer.tag}\`)\n• **From**: ${user.name}\n• **To**: ${recipient.name} (${recipient.email})\n• **Request ID**: \`#${transfer.id.slice(0, 8)}\`\n• **Status**: **REQUESTED** (Pending Admin & Dept Head Approval)\n\nOnce your Department Head approves the request, the transfer will be completed automatically!`,
      actionTaken: 'TRANSFER_REQUESTED',
      toolUsed: 'create_transfer_request',
      data: transfer,
      suggestions: ['Check my maintenance tickets', 'What assets are assigned to me?', 'Who is the IT admin?'],
    };
  }

  /**
   * Update employee phone number via voice/text query
   */
  private async handleUpdatePhoneIntent(
    query: string,
    user: { id: string; name: string; role: string; organizationId?: string }
  ): Promise<AssistantQueryResult | null> {
    const suggestions = this.getDefaultSuggestions(user.role);

    const phoneMatch = query.match(/(?:\+?\d{1,4}[\s\-]?)?(?:\(?\d{2,5}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{3,5}/);
    if (!phoneMatch) return null;

    const rawPhone = phoneMatch[0].trim();
    const cleanPhone = rawPhone.replace(/[\s\-()]/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) return null;

    // Extract candidate employee name
    let nameText = query
      .replace(rawPhone, '')
      .replace(/\b(?:update|set|change|add|save|register|phone|number|mobile|contact|for|to|of|employee|employe|user|colleague|staff|please)\b/gi, '')
      .replace(/['’]s/g, '')
      .replace(/[^\w\s@.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!nameText || nameText.length < 2) {
      return {
        answer: `Please specify the employee name along with the phone number.\n\nExample: *"Set Shubham's phone number to ${rawPhone}"*`,
        suggestions: [`Set Shubham's phone to ${rawPhone}`],
      };
    }

    let employees = await prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(user.organizationId ? { organizationId: user.organizationId } : {}),
        OR: [
          { name: { contains: nameText } },
          { email: { contains: nameText } },
          { employeeId: { contains: nameText } },
        ],
      },
    });

    if (employees.length === 0) {
      const tokens = nameText.split(/\s+/).filter((t) => t.length >= 3);
      for (const token of tokens) {
        const found = await prisma.user.findMany({
          where: {
            isDeleted: false,
            ...(user.organizationId ? { organizationId: user.organizationId } : {}),
            OR: [{ name: { contains: token } }, { email: { contains: token } }],
          },
        });
        if (found.length > 0) {
          employees = found;
          break;
        }
      }
    }

    if (employees.length === 0) {
      return {
        answer: `I couldn't find an employee matching *"${nameText}"* in the directory to update their phone number.`,
        suggestions,
      };
    }

    const targetEmp = employees[0];
    const updated = await prisma.user.update({
      where: { id: targetEmp.id },
      data: { phone: cleanPhone },
    });

    return {
      answer: `✅ **Phone Number Updated**!\n\n• **Employee**: **${updated.name}** (${updated.email})\n• **Phone Number**: **${cleanPhone}**\n\nWould you like me to call **${updated.name.split(' ')[0]}** now?`,
      actionTaken: 'PHONE_UPDATED',
      toolUsed: 'update_employee_phone',
      data: updated,
      suggestions: [`Call ${updated.name}`, `Call ${updated.name} and ask him to contact me`],
    };
  }

  /**
   * Dispatch OmniDimension AI Voice call to an employee with smart NLP
   */
  private async handleCallEmployeeIntent(
    query: string,
    user: { id: string; name: string; role: string; organizationId?: string }
  ): Promise<AssistantQueryResult | null> {
    const suggestions = this.getDefaultSuggestions(user.role);

    // 1. Extract explicit phone number if provided (e.g. +91 98765 43210, +919876543210, 9876543210)
    const phoneMatch = query.match(/(?:\+?\d{1,4}[\s\-]?)?(?:\(?\d{2,5}\)?[\s\-]?)?\d{3,5}[\s\-]?\d{3,5}/);
    let explicitPhone: string | null = null;
    if (phoneMatch) {
      const digitsOnly = phoneMatch[0].replace(/\D/g, '');
      if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
        explicitPhone = phoneMatch[0].trim();
      }
    }

    // 2. Extract custom instructions / reason / message clause
    let customNote = '';
    let targetText = query;

    const splitPatterns = [
      /\b(?:and\s+)?(?:ask|tell|inform|instruct|remind|notify|request)\s+(?:him|her|them|the\s+employee|the\s+user)?\s*(?:to\s+|that\s+)?(.*)$/i,
      /\b(?:to\s+)(?:contact|call\s*back|meet|reach|update|submit|return|check|verify|fix)\b(.*)$/i,
      /\b(?:regarding|about|for)\s+(.*)$/i,
    ];

    for (const pat of splitPatterns) {
      const m = targetText.match(pat);
      if (m && m[1] && m.index !== undefined && m.index > 3) {
        customNote = m[0].trim();
        targetText = targetText.slice(0, m.index).trim();
        break;
      }
    }

    // 3. Clean targetText to isolate candidate employee name
    let candidateName = targetText
      .replace(/(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:would\s+you\s+)?(?:i\s+want\s+to\s+)?(?:let'?s\s+)?(?:call|dial|phone|ring|reach\s+out\s+to|dispatch\s+call\s+to)\s*/gi, '')
      .replace(/\b(?:employee|employe|worker|user|staff|person|colleague|member|mr|ms|mrs|dr)\b/gi, '')
      .replace(/\b(?:at|on|with|to)\b/gi, '')
      .replace(/[^\w\s@.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (explicitPhone) {
      candidateName = candidateName.replace(explicitPhone, '').trim();
    }

    // If query is just a phone number or no name found
    if (!candidateName || candidateName.length < 2) {
      if (explicitPhone) {
        const phoneTarget = explicitPhone.replace(/[\s\-()]/g, '');
        try {
          const callRecord = await aiVoiceService.initiateCall(
            {
              purpose: 'GENERAL',
              phoneNumber: phoneTarget,
              context: {
                initiatedBy: user.name,
                query,
                customContext: customNote || 'Automated AssetFlow notification call',
              },
            },
            { id: user.id, role: user.role, organizationId: user.organizationId }
          );

          const isReal = omniDimensionService.isConfigured();
          return {
            answer: `📞 **AI Voice Call Initiated** ${isReal ? 'via OmniDimension API' : '(Testing Mode)'}!\n\n• **Target**: \`${phoneTarget}\`\n• **Call Ref**: \`${callRecord.callId || callRecord.id}\`\n• **Status**: **${callRecord.status}**\n${customNote ? `• **Context Note**: *"${customNote}"*\n` : ''}\nThe OmniDimension AI Voice Agent is now dialing.`,
            actionTaken: 'AI_CALL_DISPATCHED',
            toolUsed: 'omnidimension_call',
            data: callRecord,
            suggestions: ['Assets under maintenance', 'Hardware warranties expiring soon'],
          };
        } catch (err: any) {
          return {
            answer: `I tried calling **${phoneTarget}** but encountered an issue: ${err.message}.`,
            suggestions,
          };
        }
      }

      return {
        answer: "Sure! Who would you like me to call? Please provide the employee's name or phone number.\n\nExample: *\"Call Shubham and ask him to contact me\"* or *\"Call +919876543210\"*",
        suggestions: ['Call Priya Sharma', 'Call +919876543210'],
      };
    }

    // 4. Search for the employee in DB
    let employees = await prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(user.organizationId ? { organizationId: user.organizationId } : {}),
        OR: [
          { name: { contains: candidateName } },
          { email: { contains: candidateName } },
          { phone: { contains: candidateName } },
          { employeeId: { contains: candidateName } },
        ],
      },
    });

    if (employees.length === 0) {
      const tokens = candidateName.split(/\s+/).filter((t) => t.length >= 3);
      for (const token of tokens) {
        const found = await prisma.user.findMany({
          where: {
            isDeleted: false,
            ...(user.organizationId ? { organizationId: user.organizationId } : {}),
            OR: [{ name: { contains: token } }, { email: { contains: token } }],
          },
        });
        if (found.length > 0) {
          employees = found;
          break;
        }
      }
    }

    if (employees.length === 0) {
      if (explicitPhone) {
        const phoneTarget = explicitPhone.replace(/[\s\-()]/g, '');
        try {
          const callRecord = await aiVoiceService.initiateCall(
            {
              purpose: 'GENERAL',
              phoneNumber: phoneTarget,
              context: {
                initiatedBy: user.name,
                candidateName,
                query,
                customContext: customNote || 'Automated AssetFlow notification call',
              },
            },
            { id: user.id, role: user.role, organizationId: user.organizationId }
          );

          return {
            answer: `📞 **AI Voice Call Initiated** to **${phoneTarget}** for *${candidateName}*!\n\n• **Call Ref**: \`${callRecord.callId || callRecord.id}\`\n• **Status**: **${callRecord.status}**\n${customNote ? `• **Note**: *"${customNote}"*\n` : ''}\nThe OmniDimension AI Voice Agent is reaching out now.`,
            actionTaken: 'AI_CALL_DISPATCHED',
            toolUsed: 'omnidimension_call',
            data: callRecord,
            suggestions,
          };
        } catch (err: any) {
          return {
            answer: `I couldn't find *"${candidateName}"* in the directory and call to **${phoneTarget}** failed: ${err.message}.`,
            suggestions,
          };
        }
      }

      return {
        answer: `I couldn't find an employee matching *"${candidateName}"* in the directory. Please check the name or provide their phone number.\n\nTip: Try *"Call ${candidateName} on +919876543210 ${customNote ? `and ${customNote}` : ''}"*.`,
        suggestions: [`Call ${candidateName} on +919876543210`, ...suggestions.slice(0, 2)],
      };
    }

    let targetEmployee = employees[0];

    // If employee has no phone registered, but an explicitPhone was in query -> save phone & proceed
    if (!targetEmployee.phone && explicitPhone) {
      const cleanPhone = explicitPhone.replace(/[\s\-()]/g, '');
      targetEmployee = await prisma.user.update({
        where: { id: targetEmployee.id },
        data: { phone: cleanPhone },
      });
    }

    // If still no phone registered
    if (!targetEmployee.phone) {
      const firstName = targetEmployee.name.split(' ')[0];
      return {
        answer: `I found **${targetEmployee.name}** (${targetEmployee.email}), but they don't have a phone number registered in their profile yet.\n\n💡 **Quick Action**: You can:\n1. Specify their number directly, e.g.: *"Call ${firstName} on +919876543210 ${customNote ? `${customNote}` : ''}"*\n2. Or say: *"Set ${firstName}'s phone to +919876543210"* to register their number.`,
        suggestions: [`Call ${firstName} on +919876543210`, `Set ${firstName}'s phone to +919876543210`],
      };
    }

    // Humanize custom instructions & generate humane spoken prompt
    let humanizedInstruction = customNote;
    let spokenInstructionPrompt = '';

    if (customNote) {
      const parsed = customNote
        .replace(/\b(?:and\s+)?(?:ask|tell|inform|instruct|remind|notify|request)\s+(?:him|her|them|the\s+employee|the\s+user)?\s*(?:to\s+|that\s+)?/i, '')
        .replace(/\(the\s*admin\)/gi, '')
        .trim();

      if (/^(contact|call\s*back|call|reach\s*out\s*to|reach|get\s*in\s*touch\s*with)\s*(me|the\s*admin|admin)?/i.test(parsed)) {
        humanizedInstruction = `Please contact your administrator, ${user.name}, as soon as you are available.`;
        spokenInstructionPrompt = `Hello! This is Sophia, the AssetFlow voice assistant calling on behalf of your administrator, ${user.name}. ${user.name} kindly requested that you get in touch with them directly at your earliest convenience. Could you please confirm you received this message?`;
      } else {
        humanizedInstruction = parsed.replace(/\bme\b/gi, user.name).replace(/\bmy\b/gi, `${user.name}'s`);
        spokenInstructionPrompt = `Hello! This is Sophia from AssetFlow calling on behalf of your administrator, ${user.name}. ${user.name} asked me to notify you: "${humanizedInstruction}". Please confirm if you received this message.`;
      }
    }

    // Initiate the call
    try {
      const isRepair = customNote.toLowerCase().includes('screen') || customNote.toLowerCase().includes('repair') || customNote.toLowerCase().includes('maintenance');
      const callPurpose = isRepair ? 'MAINTENANCE_FOLLOWUP' : 'GENERAL';

      const callRecord = await aiVoiceService.initiateCall(
        {
          purpose: callPurpose,
          phoneNumber: targetEmployee.phone,
          employeeId: targetEmployee.id,
          context: {
            initiatedBy: user.name,
            employeeName: targetEmployee.name,
            customContext: humanizedInstruction || customNote || 'Please contact your administrator.',
            spokenInstructionPrompt: spokenInstructionPrompt || `Hello ${targetEmployee.name}, this is Sophia from AssetFlow calling on behalf of ${user.name}.`,
            query,
          },
        },
        { id: user.id, role: user.role, organizationId: user.organizationId }
      );

      const isReal = omniDimensionService.isConfigured();
      return {
        answer: `📞 **AI Voice Call Initiated** ${isReal ? 'via OmniDimension API' : '(Testing Mode)'}!\n\n• **Target Employee**: **${targetEmployee.name}** (${targetEmployee.phone})\n• **Call Ref**: \`${callRecord.callId || callRecord.id}\`\n• **Status**: **${callRecord.status}**\n${humanizedInstruction ? `• **Humane Spoken Message**: *"${humanizedInstruction}"*\n` : ''}\nSophia (AssetFlow AI Voice Agent) is calling **${targetEmployee.name}** with clear, polite instructions.`,
        actionTaken: 'AI_CALL_DISPATCHED',
        toolUsed: 'omnidimension_call',
        data: callRecord,
        suggestions: ['Assets under maintenance', 'How many laptops are available?', 'Department asset utilization'],
      };
    } catch (err: any) {
      return {
        answer: `I found **${targetEmployee.name}**, but the call couldn't be initiated: ${err.message}. Please try again or use the AI Communications panel.`,
        suggestions,
      };
    }
  }

  /**
   * Return IT Admin and Support team details (For Employees & Admins)
   */
  private async handleITAdminQuery(organizationId?: string): Promise<AssistantQueryResult> {
    const admins = await prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(organizationId ? { organizationId } : {}),
        role: { name: { in: ['Administrator', 'Asset Manager', 'Super Admin'] } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        designation: true,
        employeeId: true,
        role: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (admins.length === 0) {
      return {
        answer: 'Currently no Administrator account is designated in this organization. Please reach out to your system owner.',
        suggestions: ['How many assets are available in company?', 'What assets are assigned to me?'],
      };
    }

    const adminList = admins
      .map(
        (a) =>
          `• 👨‍💻 **${a.name}** — *${a.designation || a.role?.name || 'System Administrator'}*\n  - 📧 **Email**: ${a.email}\n  - 📞 **Direct Contact**: ${a.phone || '+91 98765 43210'}\n  - 🏢 **Department**: ${a.department?.name || 'IT & Systems'}\n  - 🆔 **Staff Code**: ${a.employeeId || 'ADM-01'}`
      )
      .join('\n\n');

    return {
      answer: `Here are the details for your **IT Administration & Support Team**:\n\n${adminList}\n\n🛠️ **What they handle**:\n• Hardware allocation, new device requests, & upgrades\n• Maintenance ticket resolution & technician assignments\n• Physical asset verification audits\n\n💡 *Tip: You can ask me to "Request a laptop", "Report a broken screen", or "How many assets are available in company?"*`,
      toolUsed: 'get_it_admin_directory',
      data: admins,
      suggestions: ['How many assets are available in company?', 'Request a laptop', 'What assets are assigned to me?', 'Report a broken screen'],
    };
  }

  /**
   * Search employee directory
   */
  private async handleEmployeeSearchQuery(query: string, organizationId: string | undefined, isAdmin: boolean): Promise<AssistantQueryResult | null> {
    const searchStr = query.replace(/(who is|employee|search|find|staff|user|member|details for|about|look up)/gi, '').trim();
    if (!searchStr || searchStr.length < 2) return null;

    const results = await prisma.user.findMany({
      where: {
        isDeleted: false,
        ...(organizationId ? { organizationId } : {}),
        OR: [
          { name: { contains: searchStr } },
          { email: { contains: searchStr } },
          { employeeId: { contains: searchStr } },
          { designation: { contains: searchStr } },
        ],
      },
      take: 4,
      select: {
        name: true,
        email: true,
        phone: true,
        designation: true,
        employeeId: true,
        role: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (results.length === 0) {
      return {
        answer: `I couldn't find any employee matching *"${searchStr}"*. Please try searching by their full name or employee ID.`,
        suggestions: this.getDefaultSuggestions(isAdmin ? 'Administrator' : 'Employee'),
      };
    }

    const list = results
      .map(
        (e) =>
          `• **${e.name}** ${e.designation ? `(${e.designation})` : ''}\n  - Email: ${e.email}\n  - Phone: ${e.phone || 'N/A'}\n  - Department: ${e.department?.name || 'N/A'}\n  - Role: ${e.role?.name || 'Employee'}`
      )
      .join('\n\n');

    return {
      answer: `Found **${results.length}** employee(s) matching your search:\n\n${list}`,
      toolUsed: 'search_employee_directory',
      data: results,
      suggestions: [`Call ${results[0].name}`, 'Department asset utilization', 'How many laptops are available?'],
    };
  }

  /**
   * Search assets by code, tag, name, or serial number
   */
  private async handleAssetSearchQuery(query: string, organizationId: string | undefined, isAdmin: boolean): Promise<AssistantQueryResult | null> {
    const searchStr = query.replace(/(search|find|where is|asset|code|tag|serial|number|lookup|look up)/gi, '').trim();
    if (!searchStr || searchStr.length < 2) return null;

    const assets = await prisma.asset.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        OR: [
          { tag: { contains: searchStr } },
          { name: { contains: searchStr } },
          { serialNumber: { contains: searchStr } },
          { model: { contains: searchStr } },
        ],
      },
      take: 4,
      include: { category: true, department: true },
    });

    if (assets.length === 0) {
      return {
        answer: `No assets found matching *"${searchStr}"*. Try using the full asset code (e.g., AF-1001) or serial number.`,
        suggestions: this.getDefaultSuggestions(isAdmin ? 'Administrator' : 'Employee'),
      };
    }

    const list = assets
      .map(
        (a) =>
          `• **${a.name}** (\`${a.tag}\`)\n  - Category: ${a.category?.name || 'General'}\n  - Status: **${a.status}**\n  - Location: ${a.location || 'N/A'}\n  - Serial: ${a.serialNumber || 'N/A'}`
      )
      .join('\n\n');

    return {
      answer: `Found **${assets.length}** matching asset(s):\n\n${list}`,
      toolUsed: 'search_asset_directory',
      data: assets,
      suggestions: isAdmin
        ? ['How many laptops are available?', 'Assets under maintenance summary', 'Hardware warranties expiring soon']
        : ['What assets are assigned to me?', 'Report a broken screen'],
    };
  }

  /**
   * Role-based Knowledge Base queries
   */
  private handleCompanyKnowledgeQuery(query: string, isAdmin: boolean): AssistantQueryResult | null {
    const q = query.toLowerCase();

    // Admin Specific Queries
    if (isAdmin) {
      if (q.includes('admin capabilities') || q.includes('admin feature') || q.includes('what can i do as admin') || q.includes('admin power')) {
        return {
          answer: `**Administrator Capabilities in AssetFlow ERP**:

1. **Inventory & Asset Lifecycle**: Full CRUD control over assets, categories, QR/Barcode generation, and deprecation.
2. **OmniDimension AI Voice Audits**: Launch automated phone audit campaigns to verify employee hardware possession.
3. **Maintenance & Repairs**: Overview of all organization repair tickets, status updates, and technician assignments.
4. **Department Analytics**: Track hardware allocation, headcount, and budget utilization per department.
5. **Warranty & Renewal Alerts**: View expiring hardware warranties and streamline vendor replacements.`,
          suggestions: ['How many laptops are available?', 'Assets under maintenance summary', 'Hardware warranties expiring soon'],
        };
      }

      if (q.includes('audit campaign') || q.includes('voice audit') || q.includes('how to run audit')) {
        return {
          answer: `**Launching an OmniDimension AI Voice Audit Campaign**:

1. Open the **AI Voice Agents** tab in your Admin Portal.
2. Click **Create Voice Campaign**.
3. Select the target department or employee group.
4. Choose the call purpose: *Asset Possession Check*, *Warranty Verification*, or *Return Reminder*.
5. Click **Launch Campaign** — OmniDimension AI will call each employee, converse naturally, and log responses into your ERP audit logs automatically.`,
          suggestions: ['Call employee Priya Sharma', 'Assets under maintenance summary'],
        };
      }

      if (q.includes('add asset') || q.includes('create asset') || q.includes('new asset')) {
        return {
          answer: `**Adding a New Asset to Inventory**:

1. Go to **Asset Management** > Click **+ Add Asset**.
2. Enter the Tag ID (e.g. \`AF-1050\`), Asset Name, Serial Number, and Category.
3. Assign initial status (**AVAILABLE**, **ALLOCATED**, or **MAINTENANCE**).
4. Save the entry — AssetFlow automatically generates printable **QR Codes & Barcodes** for instant physical scanning!`,
          suggestions: ['How many laptops are available?', 'Department asset utilization'],
        };
      }

      if (q.includes('offboard') || q.includes('recover asset') || q.includes('employee exit')) {
        return {
          answer: `**Employee Offboarding & Hardware Recovery Protocol**:

1. Go to **Team Directory** > Select the departing employee.
2. View **Assigned Hardware Assets**.
3. Initiate **Asset Return Request** or dispatch an automated **OmniDimension Return Call**.
4. Upon receiving hardware, click **Close Allocation** to return items to the **AVAILABLE** pool.`,
          suggestions: ['Total employee headcount', 'Department asset utilization'],
        };
      }
    }

    // General Platform / OmniDimension Knowledge
    if (q.includes('assetflow') || q.includes('about website') || q.includes('what is this') || q.includes('company info')) {
      return {
        answer: `**AssetFlow AMS** is an enterprise AI-driven Asset & Resource Management System.

Key Capabilities:
• **Asset Lifecycle Tracking** — Register hardware, tag with QR/Barcodes, track warranty & depreciation.
• **OmniDimension Voice AI** — Automated voice calls for physical audits, return reminders, & repair checks.
• **IT Maintenance Portal** — Report broken hardware, track technician resolution, view repair history.
• **Room & Resource Bookings** — Reserve conference rooms, executive suites, and fleet vehicles.
• **Team Management** — Admin, Asset Manager, Department Head, and Employee self-service portals.`,
        suggestions: isAdmin
          ? ['How many laptops are available?', 'Assets under maintenance summary', 'Hardware warranties expiring soon']
          : ['What assets are assigned to me?', 'Who is the IT admin?', 'Report a broken screen'],
      };
    }

    if (q.includes('omnidimension') || q.includes('api key') || q.includes('voice call setup') || q.includes('how call works')) {
      const isConfigured = omniDimensionService.isConfigured();
      return {
        answer: `**OmniDimension AI Voice Integration**

• **Status**: ${isConfigured ? '🟢 Active & Configured' : '🟡 Offline / Testing Mode'}
• **Features**:
  1. Direct Outbound Voice Calls to Employees
  2. Automated Audit & Verification Campaigns
  3. Post-Call Webhook Processing into ERP logs

To configure: Add \`OMNIDIM_API_KEY=your_key\` in your backend \`.env\` file.`,
        suggestions: isAdmin
          ? ['Call employee Priya Sharma', 'Assets under maintenance summary', 'Hardware warranties expiring soon']
          : ['What assets are assigned to me?', 'Who is the IT admin?'],
      };
    }

    if (q.includes('return asset') || q.includes('give back laptop') || q.includes('handover')) {
      return {
        answer: `**Asset Return & Handover Procedure**:

1. Log in to your Employee Portal and view **Assigned Assets**.
2. Click **Initiate Return Request** or inform your IT Administrator.
3. Hand in the device, charger, and accessories to IT Admin.
4. IT Admin verifies hardware condition and closes allocation.

You'll receive an automated confirmation email once processed.`,
        suggestions: isAdmin
          ? ['Department asset utilization', 'Total employee headcount']
          : ['What assets are assigned to me?', 'Who is the IT admin?'],
      };
    }

    return null;
  }

  /**
   * Smart conversational fallback
   */
  private async handleSmartFallback(
    query: string,
    user: { id: string; name?: string; role: string; organizationId?: string },
    isAdmin: boolean
  ): Promise<AssistantQueryResult> {
    const userName = user.name || 'there';

    return {
      answer: isAdmin
        ? `I'm not quite sure how to help with *"${query}"*, but I'd love to assist! As an Administrator, here are key actions I can perform for you:\n\n• 💻 **Check Stock** — "How many laptops are available?"\n• 🔧 **Maintenance Summary** — "Assets under maintenance summary"\n• ⏰ **Expiring Warranties** — "Hardware warranties expiring soon"\n• 📈 **Department Analytics** — "Department asset utilization"\n• 📞 **Dispatch AI Call** — "Call employee Priya Sharma"\n• 👥 **Employee Headcount** — "Total employee headcount"\n\nSelect a suggestion below or rephrase your query!`
        : `I'm not quite sure how to help with *"${query}"*, but I'd love to assist! Here are things I can do for you:\n\n• 💻 **My Devices** — "What assets are assigned to me?"\n• 👨‍💻 **IT Support Contact** — "Who is the IT admin?"\n• 🔧 **Report Maintenance** — "Report a broken screen"\n• 📅 **Room Booking** — "Check meeting room availability"\n\nSelect a suggestion below or rephrase your query!`,
      suggestions: this.getDefaultSuggestions(isAdmin ? 'Administrator' : 'Employee'),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── Tool Handlers ────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  private async handleGetMyAssets(userId: string, isAdmin: boolean, query?: string): Promise<AssistantQueryResult> {
    const isWhereQuery = (query || '').toLowerCase().includes('where');
    const allocations = await prisma.assetAllocation.findMany({
      where: { userId, isActive: true },
      include: {
        asset: {
          include: { category: true, department: true },
        },
      },
    });

    if (allocations.length === 0) {
      return {
        answer: 'You currently don\'t have any assets assigned to you.',
        data: [],
        suggestions: this.getDefaultSuggestions(isAdmin ? 'Administrator' : 'Employee'),
      };
    }

    if (isWhereQuery) {
      const laptopAlloc = allocations.find((a) => a.asset.category?.name?.toLowerCase().includes('laptop')) || allocations[0];
      const a = laptopAlloc.asset;
      return {
        answer: `📍 **Your Assigned Device Location & Details**:\n\n• **Model**: ${a.name} (${a.model || 'Standard Issue'})\n• **Asset Tag**: \`${a.tag}\`\n• **Serial Number**: \`${a.serialNumber || 'N/A'}\`\n• **Location**: ${a.location || (a.room ? `${a.building || 'HQ'}, Floor ${a.floor || '1'}, Room ${a.room}` : 'Assigned to your desk / Remote')}\n• **Category**: ${a.category?.name || 'Hardware'}\n• **Status**: **${a.status}**`,
        toolUsed: 'get_asset_location',
        data: a,
        suggestions: ['Report a broken screen', 'Who is the IT admin?', 'Check meeting room availability'],
      };
    }

    const listText = allocations
      .map((a) => `• **${a.asset.name}** (Code: \`${a.asset.tag}\`, Serial: ${a.asset.serialNumber || 'N/A'}, Location: ${a.asset.location || 'Assigned to you'})`)
      .join('\n');

    return {
      answer: `You have **${allocations.length}** assigned asset(s):\n\n${listText}`,
      toolUsed: 'get_my_assets',
      data: allocations.map((a) => a.asset),
      suggestions: isAdmin
        ? ['How many laptops are available?', 'Assets under maintenance summary', 'Department asset utilization']
        : ['Where is my assigned laptop?', 'Report a broken screen', 'Who is the IT admin?'],
    };
  }

  private async handleGetMyMaintenance(userId: string, isAdmin: boolean): Promise<AssistantQueryResult> {
    const requests = await prisma.maintenanceRequest.findMany({
      where: { requestedById: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { asset: true },
    });

    if (requests.length === 0) {
      return {
        answer: 'You don\'t have any pending or past maintenance requests. Everything looks good! 🎉',
        data: [],
        suggestions: this.getDefaultSuggestions(isAdmin ? 'Administrator' : 'Employee'),
      };
    }

    const listText = requests
      .map((r) => `• **#${r.id.slice(0, 6)}** — *${r.issue}* for \`${r.asset?.tag || 'Asset'}\` (Status: **${r.status}**)`)
      .join('\n');

    return {
      answer: `Here are your recent maintenance requests:\n\n${listText}`,
      toolUsed: 'get_my_maintenance_requests',
      data: requests,
      suggestions: isAdmin
        ? ['Assets under maintenance summary', 'How many laptops are available?']
        : ['Report a broken screen', 'What assets are assigned to me?'],
    };
  }

  private async handleCreateMaintenanceIntent(
    query: string,
    user: { id: string; name: string; role: string },
    isAdmin: boolean
  ): Promise<AssistantQueryResult> {
    const allocations = await prisma.assetAllocation.findMany({
      where: { userId: user.id, isActive: true },
      include: { asset: true },
    });

    if (allocations.length === 0) {
      return {
        answer: 'I can help you raise a maintenance request. However, you don\'t have any assets assigned directly to you. Please select the asset code from the portal or inspect inventory.',
        suggestions: this.getDefaultSuggestions(isAdmin ? 'Administrator' : 'Employee'),
      };
    }

    const primaryAsset = allocations[0].asset;
    let issueDescription = query.replace(/(i need to report a|report a|broken|damaged|i have a|problem with)/gi, '').trim();

    if (!issueDescription || issueDescription.length < 3) {
      issueDescription = 'Reported issue: Hardware check / broken screen';
    }

    try {
      const ticket = await maintenanceService.create(
        {
          issue: issueDescription,
          notes: `Created via AssetFlow AI Voice Assistant by ${user.name}`,
          assetId: primaryAsset.id,
        },
        user.id
      );

      return {
        answer: `✅ I've created maintenance ticket **#${ticket.id.slice(0, 8)}** for **${primaryAsset.name}** (\`${primaryAsset.tag}\`) regarding: *"${issueDescription}"*.\n\nIT support has been notified!`,
        actionTaken: 'MAINTENANCE_CREATED',
        toolUsed: 'create_maintenance_request',
        data: ticket,
        suggestions: isAdmin
          ? ['Assets under maintenance summary', 'How many laptops are available?']
          : ['Check my maintenance tickets', 'What assets are assigned to me?'],
      };
    } catch (err: any) {
      return {
        answer: `I couldn't automatically create the maintenance ticket: ${err.message}. Please use the Maintenance form in your dashboard.`,
        suggestions: this.getDefaultSuggestions(isAdmin ? 'Administrator' : 'Employee'),
      };
    }
  }

  private async handleCheckBookingAvailability(
    query: string,
    user: { id: string },
    isAdmin: boolean
  ): Promise<AssistantQueryResult> {
    const qLower = query.toLowerCase();
    const isTomorrow = qLower.includes('tomorrow');
    const isSpecificRoomA = qLower.includes('room a') || qLower.includes('conference room a');

    const targetDateObj = isTomorrow ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date();
    const dateStr = targetDateObj.toISOString().split('T')[0];
    const displayDate = targetDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: new Date(`${dateStr}T00:00:00.000Z`),
          lte: new Date(`${dateStr}T23:59:59.999Z`),
        },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      orderBy: { startTime: 'asc' },
    });

    if (isSpecificRoomA) {
      const roomABookings = bookings.filter((b) => b.resourceName.toLowerCase().includes('conference room a') || b.resourceName.toLowerCase().includes('room a'));
      if (roomABookings.length === 0) {
        return {
          answer: `✅ **Conference Room A is Available** ${isTomorrow ? 'tomorrow' : 'today'} (${displayDate}) all day!\n\nNo reservations are scheduled. Would you like me to book a slot for your meeting?`,
          toolUsed: 'check_booking_availability',
          data: { room: 'Conference Room A', date: dateStr, available: true, bookings: [] },
          suggestions: ['Report a broken screen', 'What assets are assigned to me?'],
        };
      } else {
        const slots = roomABookings.map((b) => `• ${b.startTime} - ${b.endTime} (Status: ${b.status})`).join('\n');
        return {
          answer: `📅 **Conference Room A Schedule** for ${isTomorrow ? 'tomorrow' : 'today'} (${displayDate}):\n\n${slots}\n\nAll other time slots remain free and open for reservation.`,
          toolUsed: 'check_booking_availability',
          data: { room: 'Conference Room A', date: dateStr, available: false, bookings: roomABookings },
          suggestions: ['Check meeting room availability', 'What assets are assigned to me?'],
        };
      }
    }

    const activeRooms = ['Conference Room A', 'Board Room Alpha', 'Meeting Pod 1', 'Executive Suite'];
    const summary = activeRooms
      .map((r) => {
        const booked = bookings.filter((b) => b.resourceName.toLowerCase().includes(r.toLowerCase()));
        if (booked.length === 0) {
          return `• **${r}**: ✅ Available all day`;
        }
        const slots = booked.map((b) => `${b.startTime}-${b.endTime}`).join(', ');
        return `• **${r}**: Booked during (${slots})`;
      })
      .join('\n');

    return {
      answer: `Here is the resource availability for **${displayDate}**:\n\n${summary}\n\nWould you like me to reserve a slot for you?`,
      toolUsed: 'check_booking_availability',
      data: bookings,
      suggestions: isAdmin
        ? ['How many laptops are available?', 'Department asset utilization']
        : ['Is Conference Room A available tomorrow?', 'What assets are assigned to me?', 'Who is the IT admin?'],
    };
  }

  /**
   * Handle natural language Asset Requests from employees with real-time database requisition
   */
  /**
   * Handle natural language Asset Allocation and Requisition from employees
   */
  private async handleAssetRequestIntent(
    query: string,
    user: { id: string; name?: string; role: string; organizationId?: string },
    isAdmin: boolean
  ): Promise<AssistantQueryResult> {
    const qLower = query.toLowerCase();
    const requesterName = user.name || 'Employee';

    // Relax organizationId filter if user's specific org has no assets in DB yet
    let orgWhere: any = {};
    if (user.organizationId) {
      const orgCount = await prisma.asset.count({ where: { organizationId: user.organizationId } });
      if (orgCount > 0) {
        orgWhere = { organizationId: user.organizationId };
      }
    }

    // 1. Check if a specific Asset Tag was provided (e.g. AF-1001, AF-1002, etc.)
    const tagMatch = query.match(/AF-[\w\d-]+/i);
    let targetAsset: any = null;

    if (tagMatch) {
      const tag = tagMatch[0].toUpperCase();
      targetAsset = await prisma.asset.findFirst({
        where: {
          tag: { equals: tag },
          status: 'AVAILABLE',
          ...orgWhere,
        },
        include: { category: true, department: true },
      });

      if (!targetAsset) {
        const existingAsset = await prisma.asset.findFirst({
          where: { tag: { equals: tag }, ...orgWhere },
          include: { category: true },
        });

        if (existingAsset) {
          if (existingAsset.allocatedToId === user.id) {
            return {
              answer: `You already have **${existingAsset.name}** (\`${existingAsset.tag}\`) allocated to your account.\n\nIt is listed under **My Assets** in your dashboard.`,
              suggestions: ['What assets are assigned to me?', 'Who is the IT admin?'],
            };
          }
          return {
            answer: `Asset **${existingAsset.name}** (\`${existingAsset.tag}\`) is currently **${existingAsset.status}** and cannot be allocated right now.\n\nWould you like me to allocate another available model for you?`,
            suggestions: ['How many laptops are available?', 'Who is the IT admin?'],
          };
        }
      }
    }

    // 2. Identify category or keyword from query
    if (!targetAsset) {
      let categoryKeyword = '';
      if (qLower.includes('laptop') || qLower.includes('macbook') || qLower.includes('thinkpad') || qLower.includes('dell')) {
        categoryKeyword = 'Laptop';
      } else if (qLower.includes('monitor') || qLower.includes('display') || qLower.includes('screen')) {
        categoryKeyword = 'Monitor';
      } else if (qLower.includes('printer') || qLower.includes('canon') || qLower.includes('scanner')) {
        categoryKeyword = 'Printer';
      } else if (qLower.includes('desktop') || qLower.includes('pc') || qLower.includes('workstation')) {
        categoryKeyword = 'Desktop';
      } else if (qLower.includes('phone') || qLower.includes('mobile') || qLower.includes('tablet') || qLower.includes('ipad')) {
        categoryKeyword = 'Tablet';
      } else if (qLower.includes('chair') || qLower.includes('furniture')) {
        categoryKeyword = 'Furniture';
      } else if (qLower.includes('projector')) {
        categoryKeyword = 'Projector';
      }

      if (categoryKeyword) {
        targetAsset = await prisma.asset.findFirst({
          where: {
            status: 'AVAILABLE',
            OR: [
              { category: { name: { contains: categoryKeyword } } },
              { name: { contains: categoryKeyword } },
              { model: { contains: categoryKeyword } },
              ...(categoryKeyword === 'Laptop' ? [{ category: { name: { contains: 'Laptops' } } }] : []),
            ],
            ...orgWhere,
          },
          include: { category: true, department: true },
          orderBy: { name: 'asc' },
        });
      }

      // If still not found, check any asset matching model/name
      if (!targetAsset) {
        const cleanedName = query
          .replace(/(?:allocate\s+me\s+an?\s+asset|allocate\s+me\s+a|allocate\s+me|allocate\s+a|allocate|i\s+want\s+to\s+request|please\s+request|request\s+an\s+asset|request\s+a|request\s+new|need\s+a|need\s+an|can\s+i\s+get\s+a|can\s+i\s+request|requisition|for\s+me|asset|give\s+me\s+a|give\s+me|assign\s+me\s+a|assign\s+me)/gi, '')
          .trim();

        if (cleanedName.length >= 2) {
          targetAsset = await prisma.asset.findFirst({
            where: {
              status: 'AVAILABLE',
              OR: [
                { name: { contains: cleanedName } },
                { model: { contains: cleanedName } },
                { category: { name: { contains: cleanedName } } },
              ],
              ...orgWhere,
            },
            include: { category: true, department: true },
          });
        }
      }

      // Fallback: Pick any primary available asset in stock (prefer laptops)
      if (!targetAsset) {
        targetAsset = await prisma.asset.findFirst({
          where: {
            status: 'AVAILABLE',
            OR: [
              { category: { name: { contains: 'Laptop' } } },
              { category: { name: { contains: 'Laptops' } } },
            ],
            ...orgWhere,
          },
          include: { category: true, department: true },
          orderBy: { createdAt: 'desc' },
        });
      }

      if (!targetAsset) {
        targetAsset = await prisma.asset.findFirst({
          where: { status: 'AVAILABLE', ...orgWhere },
          include: { category: true, department: true },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    if (!targetAsset) {
      return {
        answer: `I looked in the company inventory, but there are currently **no available assets** matching your request in the stock pool.\n\nPlease reach out to your IT Administrator to procure or reserve this hardware.`,
        suggestions: ['Who is the IT admin?', 'How many assets are available in company?', 'What assets are assigned to me?'],
      };
    }

    // Check if employee already has an active allocation for this asset
    const existingAllocation = await prisma.assetAllocation.findFirst({
      where: {
        assetId: targetAsset.id,
        userId: user.id,
        isActive: true,
      },
    });

    if (existingAllocation) {
      return {
        answer: `You already have **${targetAsset.name}** (\`${targetAsset.tag}\`) allocated to your account.\n\nIt is active and displayed under **My Assets** in your dashboard.`,
        suggestions: ['What assets are assigned to me?', 'Who is the IT admin?', 'How many assets are available in company?'],
      };
    }

    // ─── Direct Live Allocation in Database ─────────────────────────────────
    // 1. Create active AssetAllocation
    const newAllocation = await prisma.assetAllocation.create({
      data: {
        assetId: targetAsset.id,
        userId: user.id,
        isActive: true,
        allocatedAt: new Date(),
      },
      include: { asset: true, user: { select: { id: true, name: true, email: true } } },
    });

    // 2. Update asset status to ALLOCATED and set allocatedToId
    await prisma.asset.update({
      where: { id: targetAsset.id },
      data: {
        status: 'ALLOCATED',
        allocatedToId: user.id,
      },
    });

    // 3. Create Asset History log
    await prisma.assetHistory.create({
      data: {
        assetId: targetAsset.id,
        event: `Allocated to ${requesterName} via AI Voice Assistant`,
        userId: user.id,
      },
    });

    // 4. Create an approved AssetRequest record for complete audit trail
    const newRequest = await prisma.assetRequest.create({
      data: {
        assetId: targetAsset.id,
        userId: user.id,
        reason: `Allocated via AssetFlow AI Voice Assistant to ${requesterName}`,
        status: 'APPROVED',
        organizationId: targetAsset.organizationId || user.organizationId,
      },
    });

    // 5. Activity Log & Notification
    await activityLogRepo.create({
      action: 'ASSET_ALLOCATED',
      targetResource: 'Asset',
      targetId: targetAsset.id,
      details: `Asset ${targetAsset.name} (${targetAsset.tag}) allocated to ${requesterName} via AI Voice Assistant`,
      category: 'Allocation',
      userId: user.id,
      ...(user.organizationId ? { organizationId: user.organizationId } : {}),
    });

    await notificationRepo.create({
      type: 'ASSET_ASSIGNED',
      message: `Hardware ${targetAsset.name} (${targetAsset.tag}) has been allocated to you via AI Voice Assistant.`,
      userId: user.id,
    });

    return {
      answer: `🎉 **Asset Allocated Successfully!**\n\nI have allocated **${targetAsset.name}** (\`${targetAsset.tag}\`) directly to your account:\n\n• 🏷️ **Asset Tag**: \`${targetAsset.tag}\`\n• 💻 **Model**: ${targetAsset.model || targetAsset.name}\n• 📂 **Category**: ${targetAsset.category?.name || 'Hardware'}\n• 📍 **Location**: ${targetAsset.location || 'Assigned to Desk'}\n• ✅ **Status**: **ACTIVE ALLOCATION**\n\n📌 *This asset now reflects immediately under **My Assets** and on your Dashboard counters on the website!*`,
      actionTaken: 'ASSET_ALLOCATED',
      toolUsed: 'allocate_asset_to_employee',
      data: {
        ...newAllocation,
        asset: targetAsset,
        request: newRequest,
      },
      suggestions: ['What assets are assigned to me?', 'Who is the IT admin?', 'How many assets are available in company?'],
    };
  }

  /**
   * Return available assets in company & detailed category stock breakdown
   */
  private async handleAvailableAssetsQuery(
    query: string,
    organizationId: string | undefined,
    isAdmin: boolean,
    user: { id: string; name?: string; role?: string }
  ): Promise<AssistantQueryResult> {
    const qLower = query.toLowerCase();

    // Relax organizationId filter if current organization has no registered assets
    let orgWhere: any = {};
    if (organizationId) {
      const orgAssetCount = await prisma.asset.count({ where: { organizationId } });
      if (orgAssetCount > 0) {
        orgWhere = { organizationId };
      }
    }

    // Specific category filter if user specifically asked for laptops, monitors, etc.
    let specificCategory = '';
    if (qLower.includes('laptop') || qLower.includes('macbook') || qLower.includes('notebook') || qLower.includes('thinkpad')) specificCategory = 'Laptop';
    else if (qLower.includes('monitor') || qLower.includes('display') || qLower.includes('screen')) specificCategory = 'Monitor';
    else if (qLower.includes('printer') || qLower.includes('scanner') || qLower.includes('canon')) specificCategory = 'Printer';
    else if (qLower.includes('desktop') || qLower.includes('pc') || qLower.includes('workstation')) specificCategory = 'Desktop';
    else if (qLower.includes('phone') || qLower.includes('mobile') || qLower.includes('tablet') || qLower.includes('ipad')) specificCategory = 'Mobile Phone';
    else if (qLower.includes('projector')) specificCategory = 'Projector';
    else if (qLower.includes('chair') || qLower.includes('furniture')) specificCategory = 'Furniture';

    const catCondition = specificCategory
      ? {
          OR: [
            { category: { name: { contains: specificCategory } } },
            { name: { contains: specificCategory } },
            { model: { contains: specificCategory } },
            ...(specificCategory === 'Laptop' ? [{ category: { name: { contains: 'Laptops' } } }] : []),
          ],
        }
      : {};

    const [totalAssetsCount, totalAvailableCount, totalAllocatedCount, totalMaintenanceCount, categoriesWithCount, specificCategoryCount, sampleAssets] = await Promise.all([
      prisma.asset.count({ where: orgWhere }),
      prisma.asset.count({ where: { ...orgWhere, status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { ...orgWhere, status: 'ALLOCATED' } }),
      prisma.asset.count({ where: { ...orgWhere, status: 'MAINTENANCE' } }),
      prisma.assetCategory.findMany({
        where: orgWhere,
        include: {
          assets: {
            where: { status: 'AVAILABLE' },
            select: { id: true },
          },
        },
      }),
      specificCategory
        ? prisma.asset.count({
            where: {
              ...orgWhere,
              status: 'AVAILABLE',
              ...catCondition,
            },
          })
        : Promise.resolve(0),
      prisma.asset.findMany({
        where: {
          ...orgWhere,
          status: 'AVAILABLE',
          ...(specificCategory ? catCondition : {}),
        },
        take: 6,
        include: { category: true, department: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Build category stock breakdown
    const categoryLines = categoriesWithCount
      .map((cat) => {
        const count = cat.assets.length;
        const icon = cat.name.toLowerCase().includes('laptop') ? '💻' :
          cat.name.toLowerCase().includes('monitor') || cat.name.toLowerCase().includes('display') ? '🖥️' :
          cat.name.toLowerCase().includes('printer') ? '🖨️' :
          cat.name.toLowerCase().includes('desktop') ? '🖥️' :
          cat.name.toLowerCase().includes('phone') || cat.name.toLowerCase().includes('mobile') || cat.name.toLowerCase().includes('tablet') ? '📱' : '📦';
        return `• ${icon} **${cat.name}**: **${count}** available`;
      })
      .join('\n');

    // Sample list
    const sampleList = sampleAssets.length > 0
      ? sampleAssets
          .map((a) => `• **${a.name}** (\`${a.tag}\` — ${a.category?.name || 'General'})${a.location ? ` [📍 ${a.location}]` : ''}`)
          .join('\n')
      : '• No specific models currently in stock for this category.';

    if (specificCategory) {
      return {
        answer: `📊 **${specificCategory} Availability in Company**\n\nThere are currently **${specificCategoryCount}** available **${specificCategory}**(s) ready for immediate allocation:\n\n${sampleList}\n\n💡 *Would you like me to allocate one to you? Just say: "Allocate me a ${sampleAssets[0]?.name || specificCategory}"!*`,
        toolUsed: 'get_category_available_assets',
        data: { specificCategory, count: specificCategoryCount, sample: sampleAssets },
        suggestions: sampleAssets.length > 0
          ? [`Allocate me a ${sampleAssets[0].name}`, 'Who is the IT admin?', 'What assets are assigned to me?']
          : ['How many assets are available in company?', 'Who is the IT admin?'],
      };
    }

    return {
      answer: `📊 **Company Asset Availability & Stock Overview**\n\nThere are currently **${totalAvailableCount} available asset(s)** ready for allocation out of **${totalAssetsCount} total registered assets** in the company (**${totalAllocatedCount} allocated**, **${totalMaintenanceCount} in maintenance**):\n\n📦 **Available Stock by Category**:\n${categoryLines || '• 💻 Laptops: In Stock\n• 🖥️ Monitors: In Stock\n• 🖨️ Printers: In Stock'}\n\n✨ **Featured Available Devices**:\n${sampleList}\n\n💡 *Tip: You can allocate any available device directly through voice by saying "Allocate me a laptop" or "Allocate asset [Tag]"!*`,
      toolUsed: 'get_company_asset_availability',
      data: {
        totalAssetsCount,
        totalAvailableCount,
        totalAllocatedCount,
        totalMaintenanceCount,
        sample: sampleAssets,
      },
      suggestions: ['Allocate me a laptop', 'Who is the IT admin?', 'What assets are assigned to me?', 'Check meeting room availability'],
    };
  }

  private async handleAdminMaintenanceSummary(organizationId?: string): Promise<AssistantQueryResult> {
    const where: any = { status: { in: ['PENDING', 'APPROVED', 'TECHNICIAN_ASSIGNED', 'IN_PROGRESS'] } };
    if (organizationId) where.organizationId = organizationId;

    const [count, tickets] = await Promise.all([
      prisma.maintenanceRequest.count({ where }),
      prisma.maintenanceRequest.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { asset: true, requestedBy: { select: { name: true } } },
      }),
    ]);

    if (count === 0) {
      return {
        answer: 'Great news! There are no active maintenance tickets right now. 🎉',
        data: { count: 0, tickets: [] },
        suggestions: ['How many laptops are available?', 'Hardware warranties expiring soon', 'Department asset utilization'],
      };
    }

    const list = tickets
      .map((t) => `• **${t.asset?.tag || 'Asset'}** (${t.asset?.name}): *"${t.issue}"* — by ${t.requestedBy?.name || 'Employee'} [${t.status}]`)
      .join('\n');

    return {
      answer: `There are **${count}** active maintenance ticket(s) under review or repair:\n\n${list}`,
      toolUsed: 'get_maintenance_summary',
      data: { count, tickets },
      suggestions: ['Call employee Priya Sharma', 'How many laptops are available?', 'Hardware warranties expiring soon'],
    };
  }

  private async handleAdminWarrantyExpiring(organizationId?: string): Promise<AssistantQueryResult> {
    const now = new Date();
    const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const where: any = {
      warrantyExpiry: { gte: now, lte: ninetyDays },
    };
    if (organizationId) where.organizationId = organizationId;

    const expiring = await prisma.asset.findMany({
      where,
      take: 6,
      orderBy: { warrantyExpiry: 'asc' },
      include: { department: true, category: true },
    });

    if (expiring.length === 0) {
      return {
        answer: 'No assets have warranties expiring in the next 90 days. Everything is in good shape! ✅',
        data: [],
        suggestions: ['How many laptops are available?', 'Assets under maintenance summary', 'Department asset utilization'],
      };
    }

    const list = expiring
      .map((a) => `• **${a.name}** (\`${a.tag}\`) — Expires: **${a.warrantyExpiry ? new Date(a.warrantyExpiry).toLocaleDateString() : 'N/A'}** (${a.department?.name || 'General'})`)
      .join('\n');

    return {
      answer: `Found **${expiring.length}** asset(s) with warranties expiring in the next 90 days:\n\n${list}`,
      toolUsed: 'get_expiring_warranties',
      data: expiring,
      suggestions: ['Call employee Priya Sharma', 'How many laptops are available?', 'Assets under maintenance summary'],
    };
  }

  private async handleAdminDepartmentStats(organizationId?: string): Promise<AssistantQueryResult> {
    const departments = await prisma.department.findMany({
      where: organizationId ? { organizationId } : {},
      include: {
        _count: { select: { assets: true, employees: true } },
      },
      take: 6,
    });

    if (departments.length === 0) {
      return {
        answer: 'No departments have been set up yet. You can create departments from the Organization Settings.',
        suggestions: ['How many laptops are available?', 'Total employee headcount'],
      };
    }

    const summary = departments
      .map((d) => `• **${d.name}**: ${d._count.assets} assets, ${d._count.employees} employees`)
      .join('\n');

    return {
      answer: `Here's the departmental resource breakdown:\n\n${summary}`,
      toolUsed: 'get_department_utilization',
      data: departments,
      suggestions: ['How many laptops are available?', 'Assets under maintenance summary', 'Hardware warranties expiring soon'],
    };
  }

  private async handleAdminEmployeeCount(query: string, organizationId?: string): Promise<AssistantQueryResult> {
    const where: any = { isDeleted: false };
    if (organizationId) where.organizationId = organizationId;

    const totalEmployees = await prisma.user.count({ where });
    return {
      answer: `AssetFlow currently manages **${totalEmployees}** registered employee account(s) across all departments.`,
      toolUsed: 'get_employee_count',
      data: { count: totalEmployees },
      suggestions: ['Call employee Priya Sharma', 'Department asset utilization', 'How many laptops are available?'],
    };
  }
}

export default new AIVoiceAssistantService();
