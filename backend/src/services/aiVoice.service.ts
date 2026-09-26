// ─── AI Voice Service ────────────────────────────────────────────────────────
// Orchestrates AI Voice calls, dynamic context aggregation, bulk campaigns,
// automated event triggers, post-call webhook handling, and database updates.

import prisma from '../config/database';
import omniDimensionService from './omnidimension.service';
import activityLogRepo from '../repositories/activitylog.repository';
import notificationRepo from '../repositories/notification.repository';
import { validateAndNormalizePhone } from '../utils/phone';
import { AppError } from '../middlewares/errorHandler';
import { AICallPurpose, AICallStatus, AIAuditOutcome } from '@prisma/client';

export interface InitiateCallInput {
  employeeId?: string;
  phoneNumber?: string;
  toNumber?: string; // alias for phoneNumber
  purpose: AICallPurpose | string;
  customPurpose?: string;
  assetId?: string;
  maintenanceId?: string;
  auditCycleId?: string;
  campaignId?: string;
  additionalContext?: string;
  context?: Record<string, any>;
  agentId?: string;
}

class AIVoiceService {
  /**
   * Initiate an AI call to an employee (admin or automated trigger)
   */
  async initiateCall(
    input: InitiateCallInput,
    initiatedByUser?: { id: string; role?: string; organizationId?: string } | string
  ) {
    const caller = typeof initiatedByUser === 'string' ? { id: initiatedByUser } : initiatedByUser;
    let employee: any = null;
    let rawPhone = input.phoneNumber || input.toNumber;

    // 1. Resolve employee details if employeeId provided
    if (input.employeeId) {
      employee = await prisma.user.findUnique({
        where: { id: input.employeeId },
        include: {
          department: true,
          organization: true,
          allocatedAssets: {
            where: { isActive: true },
            include: { asset: true },
            take: 5,
          },
        },
      });

      if (!employee || employee.isDeleted) {
        throw new AppError('Employee record not found or has been deleted.', 404);
      }

      if (!rawPhone) {
        rawPhone = employee.phone;
      }
    }

    // 2. Validate and normalize phone number
    const phoneResult = validateAndNormalizePhone(rawPhone);
    if (!phoneResult.isValid) {
      throw new AppError(phoneResult.error || 'Employee does not have a valid phone number.', 400);
    }

    const toNumber = phoneResult.normalized;

    // 3. Resolve related Asset details
    let asset: any = null;
    if (input.assetId) {
      asset = await prisma.asset.findUnique({
        where: { id: input.assetId },
        include: { category: true, department: true },
      });
    } else if (employee?.allocatedAssets?.length > 0) {
      // Fallback to employee's primary assigned asset if relevant
      asset = employee.allocatedAssets[0].asset;
    }

    // 4. Resolve related Maintenance Ticket details
    let maintenance: any = null;
    if (input.maintenanceId) {
      maintenance = await prisma.maintenanceRequest.findUnique({
        where: { id: input.maintenanceId },
        include: { asset: true },
      });
    }

    // 5. Resolve related Audit Cycle details
    let auditCycle: any = null;
    if (input.auditCycleId) {
      auditCycle = await prisma.auditCycle.findUnique({
        where: { id: input.auditCycleId },
      });
    }

    // 6. Resolve Organization details
    const orgId = caller?.organizationId || employee?.organizationId || asset?.organizationId || null;
    let orgName = 'AssetFlow ERP';
    if (orgId) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      if (org?.name) orgName = org.name;
    }

    // 7. Normalize Purpose enum
    let normalizedPurpose: AICallPurpose = AICallPurpose.GENERAL_NOTIFICATION;
    const pStr = String(input.purpose || '').toUpperCase().replace(/[\s\-]/g, '_');
    if (pStr.includes('MAINTENANCE')) normalizedPurpose = AICallPurpose.MAINTENANCE_FOLLOWUP;
    else if (pStr.includes('RETURN')) normalizedPurpose = AICallPurpose.ASSET_RETURN_REMINDER;
    else if (pStr.includes('WARRANTY')) normalizedPurpose = AICallPurpose.WARRANTY_REMINDER;
    else if (pStr.includes('AUDIT') || pStr.includes('EQUIPMENT')) normalizedPurpose = AICallPurpose.ASSET_AUDIT_VERIFICATION;
    else if (pStr.includes('CUSTOM')) normalizedPurpose = AICallPurpose.CUSTOM;

    // 8. Build rich dynamic call context for OmniDimension AI agent
    const [primaryAdmin, availableAssetsCount] = await Promise.all([
      prisma.user.findFirst({
        where: {
          isDeleted: false,
          role: { name: { in: ['Administrator', 'Asset Manager', 'Super Admin'] } },
          ...(orgId ? { organizationId: orgId } : {}),
        },
        select: { name: true, email: true, phone: true, designation: true },
      }),
      prisma.asset.count({
        where: { status: 'AVAILABLE', ...(orgId ? { organizationId: orgId } : {}) },
      }),
    ]);

    const dynamicContext: Record<string, any> = {
      organizationName: orgName,
      employeeName: employee?.name || 'Employee',
      employeeEmail: employee?.email || '',
      employeeDesignation: employee?.designation || '',
      departmentName: employee?.department?.name || asset?.department?.name || 'General',
      purpose: normalizedPurpose,
      customPurpose: input.customPurpose || '',
      additionalNotes: input.additionalContext || (input.context ? JSON.stringify(input.context) : ''),
      callDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
      itAdminName: primaryAdmin?.name || 'Ayushu (System Administrator)',
      itAdminEmail: primaryAdmin?.email || 'admin@assetflow.com',
      itAdminPhone: primaryAdmin?.phone || '+91 98765 43210',
      itAdminDesignation: primaryAdmin?.designation || 'System Administrator',
      companyAvailableAssetsCount: availableAssetsCount,
      assetAllocationInstructions: `You are authorized to allocate available hardware (e.g., MacBook Pro, Dell XPS 15, ThinkPad) to ${employee?.name || 'this employee'} if they ask for an asset or laptop during this call. You must enthusiastically confirm: "Yes, I am allocating an available laptop for you right now. It will immediately reflect under My Assets on your AssetFlow web dashboard." Never say you cannot help with asset requests.`,
      availableHardwareModels: 'MacBook Pro 16", Dell XPS 15 Workstation, ThinkPad P1 Mobile Workstation',
      ...(input.context || {}),
    };

    if (asset) {
      dynamicContext.assetTag = asset.tag;
      dynamicContext.assetName = asset.name;
      dynamicContext.assetModel = asset.model || '';
      dynamicContext.assetSerial = asset.serialNumber || '';
      dynamicContext.assetCategory = asset.category?.name || '';
      dynamicContext.assetLocation = asset.location || '';
      if (asset.warrantyExpiry) {
        dynamicContext.warrantyExpiry = new Date(asset.warrantyExpiry).toLocaleDateString();
      }
    }

    if (maintenance) {
      dynamicContext.maintenanceRequestId = maintenance.id;
      dynamicContext.maintenanceIssue = maintenance.issue;
      dynamicContext.maintenanceStatus = maintenance.status;
      dynamicContext.technicianName = maintenance.technicianName || 'Support Team';
      dynamicContext.maintenanceNotes = maintenance.notes || '';
    }

    if (auditCycle) {
      dynamicContext.auditCycleName = auditCycle.name;
      dynamicContext.auditDepartment = auditCycle.department;
      dynamicContext.auditEndDate = new Date(auditCycle.endDate).toLocaleDateString();
    }

    // 9. Persist Call Record in PostgreSQL / DB as QUEUED
    const callRecord = await prisma.aIVoiceCall.create({
      data: {
        toNumber,
        purpose: normalizedPurpose,
        customPurpose: input.customPurpose || null,
        status: AICallStatus.QUEUED,
        context: dynamicContext,
        employeeId: employee?.id || null,
        initiatedById: caller?.id || null,
        assetId: asset?.id || null,
        maintenanceId: maintenance?.id || null,
        auditCycleId: auditCycle?.id || null,
        campaignId: input.campaignId || null,
        organizationId: orgId,
        events: {
          create: {
            eventType: 'QUEUED',
            payload: { toNumber, purpose: normalizedPurpose, dynamicContext },
          },
        },
      },
      include: {
        employee: { select: { id: true, name: true, email: true, phone: true } },
        asset: { select: { id: true, tag: true, name: true } },
        maintenance: true,
        auditCycle: true,
      },
    });

    // 10. Log Activity
    const empName = employee?.name || toNumber;
    const purposeDisplay = normalizedPurpose.replace(/_/g, ' ').toLowerCase();
    await activityLogRepo.create({
      action: 'AI_CALL_INITIATED',
      targetResource: 'AIVoiceCall',
      targetId: callRecord.id,
      details: `AI ${purposeDisplay} call initiated for ${empName} (${phoneResult.formatted})`,
      category: 'Alerts',
      userId: caller?.id || employee?.id || 'system',
      ...(orgId ? { organizationId: orgId } : {}),
    });

    // 11. Asynchronously dispatch via OmniDimension Service (non-blocking)
    this.dispatchCallAsync(callRecord.id, toNumber, dynamicContext, input.agentId);

    return callRecord;
  }

  /**
   * Internal async dispatcher to OmniDimension
   */
  private async dispatchCallAsync(
    callRecordId: string,
    toNumber: string,
    context: Record<string, any>,
    agentId?: string
  ) {
    try {
      // If OmniDimension API key is not yet set or testing in offline mode, simulate graceful initiation
      if (!omniDimensionService.isConfigured()) {
        console.warn('[AI Voice] OmniDimension API key not configured. Mocking initiation for local test.');
        await prisma.aIVoiceCall.update({
          where: { id: callRecordId },
          data: {
            callId: `omni_mock_${Date.now()}`,
            status: AICallStatus.INITIATED,
            startTime: new Date(),
          },
        });
        await prisma.aICallEvent.create({
          data: {
            callId: callRecordId,
            eventType: 'INITIATED',
            payload: { status: 'mock_initiated' },
          },
        });
        return;
      }

      const dispatchRes = await omniDimensionService.dispatchCall({
        toNumber,
        agentId,
        context,
      });

      // Update call record with OmniDimension Call ID and status
      await prisma.aIVoiceCall.update({
        where: { id: callRecordId },
        data: {
          callId: dispatchRes.callId,
          agentId: dispatchRes.agentId || agentId || null,
          status: AICallStatus.INITIATED,
          startTime: new Date(),
        },
      });

      await prisma.aICallEvent.create({
        data: {
          callId: callRecordId,
          eventType: 'INITIATED',
          payload: dispatchRes.rawResponse || { status: 'initiated' },
        },
      });
    } catch (err: any) {
      console.error(`[AI Voice Dispatch Error] Call ${callRecordId}:`, err.message);

      await prisma.aIVoiceCall.update({
        where: { id: callRecordId },
        data: {
          status: AICallStatus.FAILED,
          outcome: AIAuditOutcome.CALL_FAILED,
          summary: `Dispatch error: ${err.message}`,
        },
      });

      await prisma.aICallEvent.create({
        data: {
          callId: callRecordId,
          eventType: 'FAILED',
          payload: { error: err.message },
        },
      });
    }
  }

  /**
   * Automated Trigger for Important AssetFlow Events
   */
  async triggerAutomatedEventCall(params: {
    type: 'MAINTENANCE_FOLLOWUP' | 'ASSET_RETURN_REMINDER' | 'WARRANTY_REMINDER' | 'ASSET_AUDIT_VERIFICATION';
    employeeId?: string;
    assetId?: string;
    maintenanceId?: string;
    auditCycleId?: string;
    notes?: string;
    organizationId?: string;
  }) {
    try {
      let targetUserId = params.employeeId;

      // If employeeId not directly supplied, look up from asset allocation or maintenance requester
      if (!targetUserId && params.assetId) {
        const allocation = await prisma.assetAllocation.findFirst({
          where: { assetId: params.assetId, isActive: true },
          select: { userId: true },
        });
        if (allocation?.userId) targetUserId = allocation.userId;
      }

      if (!targetUserId && params.maintenanceId) {
        const ticket = await prisma.maintenanceRequest.findUnique({
          where: { id: params.maintenanceId },
          select: { requestedById: true },
        });
        if (ticket?.requestedById) targetUserId = ticket.requestedById;
      }

      if (!targetUserId) {
        console.warn(`[AI Automated Call Trigger] Skipped: No employee found for trigger ${params.type}`);
        return null;
      }

      return await this.initiateCall({
        employeeId: targetUserId,
        purpose: params.type,
        assetId: params.assetId,
        maintenanceId: params.maintenanceId,
        auditCycleId: params.auditCycleId,
        additionalContext: params.notes,
      }, { id: 'system', role: 'System', organizationId: params.organizationId });
    } catch (err: any) {
      console.warn(`[AI Automated Call Warning] Trigger ${params.type} could not be dispatched:`, err.message);
      return null;
    }
  }

  /**
   * Create and execute a Bulk Calling Campaign (e.g. Quarterly Asset Audit)
   */
  async createCampaign(
    data: {
      title: string;
      purpose: string;
      customPurpose?: string;
      auditCycleId?: string;
      employeeIds?: string[];
      assetIds?: string[];
      agentId?: string;
    },
    adminUser: { id: string; organizationId?: string }
  ) {
    const purpose = (data.purpose || 'ASSET_AUDIT_VERIFICATION') as AICallPurpose;

    // Collect list of target calls
    const targetItems: { employeeId: string; assetId?: string; auditCycleId?: string }[] = [];

    // Case 1: If Audit Cycle specified, fetch unverified items and their assigned employees
    if (data.auditCycleId) {
      const auditCycle = await prisma.auditCycle.findUnique({
        where: { id: data.auditCycleId },
        include: {
          items: {
            include: {
              asset: {
                include: {
                  allocations: {
                    where: { isActive: true },
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      if (auditCycle) {
        for (const item of auditCycle.items) {
          const activeAlloc = item.asset.allocations[0];
          if (activeAlloc?.user && activeAlloc.user.phone) {
            targetItems.push({
              employeeId: activeAlloc.user.id,
              assetId: item.asset.id,
              auditCycleId: auditCycle.id,
            });
          }
        }
      }
    }

    // Case 2: Explicit employeeIds provided
    if (data.employeeIds && data.employeeIds.length > 0) {
      for (const empId of data.employeeIds) {
        if (!targetItems.some((t) => t.employeeId === empId)) {
          targetItems.push({ employeeId: empId, auditCycleId: data.auditCycleId });
        }
      }
    }

    // Create Campaign Record
    const campaign = await prisma.aICallCampaign.create({
      data: {
        title: data.title,
        purpose,
        customPurpose: data.customPurpose || null,
        status: 'RUNNING',
        agentId: data.agentId || null,
        totalCalls: targetItems.length,
        inProgressCalls: targetItems.length,
        auditCycleId: data.auditCycleId || null,
        createdById: adminUser.id,
        organizationId: adminUser.organizationId || null,
      },
    });

    // Log Activity
    await activityLogRepo.create({
      action: 'AI_CAMPAIGN_CREATED',
      targetResource: 'AICallCampaign',
      targetId: campaign.id,
      details: `AI Calling Campaign "${data.title}" started with ${targetItems.length} queued calls`,
      category: 'Alerts',
      userId: adminUser.id,
      ...(adminUser.organizationId ? { organizationId: adminUser.organizationId } : {}),
    });

    // Dispatch calls asynchronously with pacing
    (async () => {
      for (const item of targetItems) {
        try {
          await this.initiateCall(
            {
              employeeId: item.employeeId,
              assetId: item.assetId,
              auditCycleId: item.auditCycleId,
              purpose,
              campaignId: campaign.id,
              agentId: data.agentId,
            },
            adminUser
          );
          // 200ms delay between dispatches
          await new Promise((r) => setTimeout(r, 200));
        } catch (err: any) {
          console.warn(`[Campaign ${campaign.id}] Failed item dispatch:`, err.message);
          await prisma.aICallCampaign.update({
            where: { id: campaign.id },
            data: {
              failedCalls: { increment: 1 },
              inProgressCalls: { decrement: 1 },
            },
          });
        }
      }
    })();

    return campaign;
  }

  /**
   * List AI Call Campaigns
   */
  async getCampaigns(
    query: { search?: string; status?: string; page?: number; limit?: number },
    organizationId?: string
  ) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (query.status && query.status !== 'ALL') where.status = query.status;
    if (query.search) {
      where.title = { contains: query.search };
    }

    const [data, total] = await Promise.all([
      prisma.aICallCampaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          auditCycle: { select: { id: true, name: true, department: true } },
          _count: { select: { calls: true } },
        },
      }),
      prisma.aICallCampaign.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Get single campaign by ID
   */
  async getCampaignById(id: string, organizationId?: string) {
    const where: any = { id };
    if (organizationId) where.organizationId = organizationId;

    const campaign = await prisma.aICallCampaign.findFirst({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        auditCycle: true,
        calls: {
          orderBy: { createdAt: 'desc' },
          include: {
            employee: { select: { id: true, name: true, phone: true } },
            asset: { select: { id: true, tag: true, name: true } },
          },
        },
      },
    });

    if (!campaign) throw new AppError('AI Call Campaign not found', 404);
    return campaign;
  }

  /**
   * Query Call History with Search, Filters, Sorting, and Pagination
   */
  async getCallHistory(
    params: {
      search?: string;
      purpose?: string;
      status?: string;
      outcome?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
    user: { id: string; role?: string; organizationId?: string }
  ) {
    const page = Number(params.page || 1);
    const limit = Math.min(Number(params.limit || 20), 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    // Organization filter
    if (user.organizationId) {
      where.organizationId = user.organizationId;
    }

    // Role scoping: Employees can only view their own calls
    if (user.role === 'Employee') {
      where.employeeId = user.id;
    }

    // Status filter
    if (params.status && params.status !== 'ALL') {
      where.status = params.status as AICallStatus;
    }

    // Purpose filter
    if (params.purpose && params.purpose !== 'ALL') {
      where.purpose = params.purpose as AICallPurpose;
    }

    // Outcome filter
    if (params.outcome && params.outcome !== 'ALL') {
      where.outcome = params.outcome as AIAuditOutcome;
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    // Search query
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { toNumber: { contains: q } },
        { customPurpose: { contains: q } },
        { summary: { contains: q } },
        { employee: { name: { contains: q } } },
        { employee: { email: { contains: q } } },
        { asset: { tag: { contains: q } } },
        { asset: { name: { contains: q } } },
      ];
    }

    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      prisma.aIVoiceCall.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          employee: { select: { id: true, name: true, email: true, phone: true } },
          initiatedBy: { select: { id: true, name: true } },
          asset: { select: { id: true, tag: true, name: true, location: true } },
          maintenance: { select: { id: true, issue: true, status: true } },
          auditCycle: { select: { id: true, name: true, department: true } },
          campaign: { select: { id: true, title: true } },
        },
      }),
      prisma.aIVoiceCall.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  /**
   * Get single Call Details view
   */
  async getCallDetails(id: string, user: { id: string; role?: string; organizationId?: string }) {
    const where: any = { id };
    if (user.organizationId) where.organizationId = user.organizationId;
    if (user.role === 'Employee') where.employeeId = user.id;

    const call = await prisma.aIVoiceCall.findFirst({
      where,
      include: {
        employee: {
          select: { id: true, name: true, email: true, phone: true, designation: true, department: true },
        },
        initiatedBy: { select: { id: true, name: true, email: true } },
        asset: { include: { category: true, department: true } },
        maintenance: true,
        auditCycle: true,
        campaign: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!call) throw new AppError('Call record not found', 404);
    return call;
  }

  /**
   * Process Post-Call Webhook from OmniDimension (Idempotent & Secure)
   */
  async handleWebhook(rawBody: any, headers?: Record<string, any>) {
    const normalized = omniDimensionService.normalizeWebhookPayload(rawBody);

    if (!normalized.callId) {
      console.warn('[OmniDimension Webhook] Received payload without callId. Inspecting body:', rawBody);
    }

    // Try finding the call record by OmniDimension external callId or our internal ID
    let call = await prisma.aIVoiceCall.findFirst({
      where: {
        OR: [
          ...(normalized.callId ? [{ callId: normalized.callId }, { id: normalized.callId }] : []),
          ...(rawBody?.custom_id ? [{ id: String(rawBody.custom_id) }] : []),
          ...(rawBody?.client_reference ? [{ id: String(rawBody.client_reference) }] : []),
        ],
      },
      include: {
        employee: true,
        asset: true,
        maintenance: true,
        auditCycle: true,
        campaign: true,
      },
    });

    // If call not matched by ID, try matching latest active call to the same phone number
    if (!call && rawBody?.to_number) {
      call = await prisma.aIVoiceCall.findFirst({
        where: {
          toNumber: rawBody.to_number,
          status: { in: [AICallStatus.QUEUED, AICallStatus.INITIATED, AICallStatus.RINGING, AICallStatus.IN_PROGRESS] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          employee: true,
          asset: true,
          maintenance: true,
          auditCycle: true,
          campaign: true,
        },
      });
    }

    if (!call) {
      console.warn('[OmniDimension Webhook] No matching call found in database. Storing unlinked event.');
      return { received: true, matched: false };
    }

    const finalStatus = (normalized.status as AICallStatus) || AICallStatus.COMPLETED;
    const finalOutcome = (normalized.outcome as AIAuditOutcome) || AIAuditOutcome.VERIFIED;

    // 1. Update Call Record
    const updatedCall = await prisma.aIVoiceCall.update({
      where: { id: call.id },
      data: {
        status: finalStatus,
        outcome: finalOutcome,
        duration: normalized.duration || call.duration || 0,
        summary: normalized.summary || call.summary || null,
        transcript: normalized.transcript || call.transcript || null,
        sentiment: normalized.sentiment || call.sentiment || 'neutral',
        recordingUrl: normalized.recordingUrl || call.recordingUrl || null,
        extractedData: normalized.extractedVariables || undefined,
        endTime: new Date(),
      },
    });

    // 2. Log Call Event
    await prisma.aICallEvent.create({
      data: {
        callId: call.id,
        eventType: 'WEBHOOK_RECEIVED',
        payload: {
          status: finalStatus,
          outcome: finalOutcome,
          duration: normalized.duration,
          summary: normalized.summary,
        },
      },
    });

    const empName = call.employee?.name || call.toNumber;
    const assetTag = call.asset?.tag || 'Asset';

    // 3. Process AI Audit Verification Logic
    if (call.purpose === AICallPurpose.ASSET_AUDIT_VERIFICATION && call.assetId && call.auditCycleId) {
      // Record verification in AIAuditVerification
      await prisma.aIAuditVerification.create({
        data: {
          callId: call.id,
          auditCycleId: call.auditCycleId,
          assetId: call.assetId,
          employeeId: call.employeeId || 'unknown',
          verificationStatus: finalOutcome,
          notes: normalized.summary || `AI phone audit completed with outcome: ${finalOutcome}`,
          organizationId: call.organizationId,
        },
      });

      // Update the actual AuditItem in the AuditCycle if verified / missing / damaged
      if (finalOutcome === AIAuditOutcome.VERIFIED || finalOutcome === AIAuditOutcome.ASSET_MISSING || finalOutcome === AIAuditOutcome.ASSET_DAMAGED) {
        const itemStatus =
          finalOutcome === AIAuditOutcome.VERIFIED ? 'VERIFIED' :
          finalOutcome === AIAuditOutcome.ASSET_MISSING ? 'MISSING' : 'DAMAGED';

        const auditItem = await prisma.auditItem.findFirst({
          where: {
            auditCycleId: call.auditCycleId,
            assetId: call.assetId,
          },
        });

        if (auditItem) {
          await prisma.auditItem.update({
            where: { id: auditItem.id },
            data: { status: itemStatus },
          });

          await activityLogRepo.create({
            action: 'AI_AUDIT_ITEM_VERIFIED',
            targetResource: 'AuditItem',
            targetId: auditItem.id,
            details: `AI audit verification marked asset ${assetTag} as ${itemStatus} via phone confirmation with ${empName}`,
            category: 'Approvals',
            userId: call.initiatedById || call.employeeId || 'system',
            ...(call.organizationId ? { organizationId: call.organizationId } : {}),
          });
        }

        // Update the underlying Asset status if missing or damaged
        if (finalOutcome === AIAuditOutcome.ASSET_MISSING) {
          await prisma.asset.update({
            where: { id: call.assetId },
            data: { status: 'LOST' },
          });
          await activityLogRepo.create({
            action: 'ASSET_MARKED_LOST',
            targetResource: 'Asset',
            targetId: call.assetId,
            details: `Asset ${assetTag} marked as LOST based on AI audit call outcome (${finalOutcome}) with ${empName}`,
            category: 'Alerts',
            userId: call.initiatedById || 'system',
            ...(call.organizationId ? { organizationId: call.organizationId } : {}),
          });
        } else if (finalOutcome === AIAuditOutcome.ASSET_DAMAGED) {
          await prisma.asset.update({
            where: { id: call.assetId },
            data: { status: 'MAINTENANCE' },
          });
          // Auto-raise a maintenance ticket
          await prisma.maintenanceRequest.create({
            data: {
              assetId: call.assetId,
              requestedById: call.employeeId || 'system',
              issue: `Reported via AI Voice Call (${empName}): Hardware damaged during audit check`,
              notes: `AI Summary: ${normalized.summary || 'Damaged condition confirmed via phone audit'}`,
              status: 'PENDING',
              organizationId: call.organizationId,
            },
          });
        }
      }

      // Create Notification for Audit
      if (call.initiatedById) {
        await notificationRepo.create({
          type: 'AI_AUDIT_COMPLETED',
          message: `AI audit verification call for ${assetTag} completed: ${finalOutcome}`,
          userId: call.initiatedById,
        });
      }
    }

    // 4. If Maintenance follow-up call, notify requester and log
    if (call.purpose === AICallPurpose.MAINTENANCE_FOLLOWUP && call.maintenanceId) {
      await activityLogRepo.create({
        action: 'AI_MAINTENANCE_FOLLOWUP_COMPLETED',
        targetResource: 'MaintenanceRequest',
        targetId: call.maintenanceId,
        details: `AI maintenance follow-up call completed with ${empName} (${finalStatus})`,
        category: 'Alerts',
        userId: call.initiatedById || call.employeeId || 'system',
        ...(call.organizationId ? { organizationId: call.organizationId } : {}),
      });

      if (call.employeeId) {
        await notificationRepo.create({
          type: 'AI_CALL_COMPLETED',
          message: `AI maintenance follow-up call completed for ticket #${call.maintenanceId.slice(0, 8)}`,
          userId: call.employeeId,
        });
      }
    }

    // 6. Process Call Requisition / Direct Asset Allocation if requested on call
    const callText = `${normalized.transcript || ''} ${normalized.summary || ''}`.toLowerCase();
    const isAssetRequestedInCall =
      normalized.extractedVariables?.asset_requested ||
      normalized.extractedVariables?.requested_asset ||
      normalized.extractedVariables?.asset_allocated ||
      callText.includes('allocate') ||
      callText.includes('requested a new laptop') ||
      callText.includes('requested laptop') ||
      callText.includes('need a laptop') ||
      callText.includes('give me a laptop') ||
      callText.includes('requested replacement') ||
      callText.includes('requested an asset') ||
      callText.includes('request for a monitor');

    if (isAssetRequestedInCall && call.employeeId) {
      try {
        let orgWhere: any = {};
        if (call.organizationId) {
          const count = await prisma.asset.count({ where: { organizationId: call.organizationId } });
          if (count > 0) orgWhere = { organizationId: call.organizationId };
        }

        const availableItem = await prisma.asset.findFirst({
          where: {
            status: 'AVAILABLE',
            ...orgWhere,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (availableItem) {
          const existingAlloc = await prisma.assetAllocation.findFirst({
            where: { assetId: availableItem.id, userId: call.employeeId, isActive: true },
          });

          if (!existingAlloc) {
            // 1. Direct Allocation in Database
            await prisma.assetAllocation.create({
              data: {
                assetId: availableItem.id,
                userId: call.employeeId,
                isActive: true,
                allocatedAt: new Date(),
              },
            });

            // 2. Mark Asset Allocated
            await prisma.asset.update({
              where: { id: availableItem.id },
              data: {
                status: 'ALLOCATED',
                allocatedToId: call.employeeId,
              },
            });

            // 3. History
            await prisma.assetHistory.create({
              data: {
                assetId: availableItem.id,
                event: `Allocated to ${empName} via AI Voice Phone Call (#${call.id.slice(0, 8)})`,
                userId: call.employeeId,
              },
            });

            // 4. Approved Request for audit
            await prisma.assetRequest.create({
              data: {
                assetId: availableItem.id,
                userId: call.employeeId,
                reason: `Allocated during AI Voice Phone Call (#${call.id.slice(0, 8)}) with Sophia`,
                status: 'APPROVED',
                organizationId: availableItem.organizationId || call.organizationId,
              },
            });

            await activityLogRepo.create({
              action: 'ASSET_ALLOCATED',
              targetResource: 'Asset',
              targetId: availableItem.id,
              details: `Asset ${availableItem.name} (${availableItem.tag}) allocated to ${empName} via AI Voice Phone Call`,
              category: 'Allocation',
              userId: call.employeeId,
              ...(call.organizationId ? { organizationId: call.organizationId } : {}),
            });

            await notificationRepo.create({
              type: 'ASSET_ASSIGNED',
              message: `🎉 Hardware ${availableItem.name} (${availableItem.tag}) has been allocated to you via AI Voice Phone Call.`,
              userId: call.employeeId,
            });
          }
        }
      } catch (reqErr: any) {
        console.warn('[AI Voice Webhook] Auto asset allocation notice:', reqErr.message);
      }
    }

    return { received: true, matched: true, callId: call.id, status: finalStatus, outcome: finalOutcome };
  }

  /**
   * Run automated triggers scan across AssetFlow:
   * 1. Maintenance Pending / follow-up required (tickets pending > 2 hours without calls in 24h)
   * 2. Asset Return Due (allocations active > 30 days or overdue)
   * 3. Warranty Expiring (assets expiring in next 30 days)
   * 4. Asset Audit Verification (open audit cycles with unverified items)
   */
  async runAutomatedTriggersScan(organizationId?: string) {
    const results = {
      maintenanceCalls: 0,
      returnReminderCalls: 0,
      warrantyReminderCalls: 0,
      auditVerificationCalls: 0,
      totalTriggered: 0,
      details: [] as string[],
    };

    const orgFilter = organizationId ? { organizationId } : {};

    // 1. Maintenance Follow-up Triggers
    const pendingTickets = await prisma.maintenanceRequest.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        ...orgFilter,
      },
      include: {
        asset: true,
        requestedBy: true,
      },
      take: 10,
    });

    for (const ticket of pendingTickets) {
      if (!ticket.requestedById || !ticket.requestedBy?.phone) continue;
      const recentCall = await prisma.aIVoiceCall.findFirst({
        where: {
          maintenanceId: ticket.id,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!recentCall) {
        try {
          await this.initiateCall(
            {
              employeeId: ticket.requestedById,
              assetId: ticket.assetId,
              maintenanceId: ticket.id,
              purpose: AICallPurpose.MAINTENANCE_FOLLOWUP,
              additionalContext: `Automated maintenance follow-up for ticket #${ticket.id.slice(0, 6)}: ${ticket.issue}`,
            },
            { id: 'system', role: 'System', organizationId: ticket.organizationId || organizationId }
          );
          results.maintenanceCalls++;
          results.totalTriggered++;
          results.details.push(`Triggered maintenance follow-up call to ${ticket.requestedBy.name} for ticket #${ticket.id.slice(0, 6)}`);
        } catch (err: any) {
          console.warn(`[Automated Trigger] Maintenance call failed:`, err.message);
        }
      }
    }

    // 2. Asset Return Reminders
    const allocations = await prisma.assetAllocation.findMany({
      where: {
        isActive: true,
        asset: {
          status: 'ALLOCATED',
          ...orgFilter,
        },
      },
      include: {
        user: true,
        asset: true,
      },
      take: 10,
    });

    for (const alloc of allocations) {
      if (!alloc.user?.phone) continue;
      const recentCall = await prisma.aIVoiceCall.findFirst({
        where: {
          employeeId: alloc.userId,
          assetId: alloc.assetId,
          purpose: AICallPurpose.ASSET_RETURN_REMINDER,
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
      });

      if (!recentCall) {
        try {
          await this.initiateCall(
            {
              employeeId: alloc.userId,
              assetId: alloc.assetId,
              purpose: AICallPurpose.ASSET_RETURN_REMINDER,
              additionalContext: `Automated asset possession and return check for assigned ${alloc.asset.name} (${alloc.asset.tag})`,
            },
            { id: 'system', role: 'System', organizationId: alloc.asset.organizationId || organizationId }
          );
          results.returnReminderCalls++;
          results.totalTriggered++;
          results.details.push(`Triggered asset return check call to ${alloc.user.name} for ${alloc.asset.tag}`);
        } catch (err: any) {
          console.warn(`[Automated Trigger] Return reminder call failed:`, err.message);
        }
      }
    }

    // 3. Warranty Expiring Reminders (< 30 days)
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringAssets = await prisma.asset.findMany({
      where: {
        warrantyExpiry: { gte: now, lte: thirtyDaysFromNow },
        allocations: { some: { isActive: true } },
        ...orgFilter,
      },
      include: {
        allocations: {
          where: { isActive: true },
          include: { user: true },
        },
      },
      take: 10,
    });

    for (const asset of expiringAssets) {
      const alloc = asset.allocations[0];
      if (!alloc?.user?.phone) continue;

      const recentCall = await prisma.aIVoiceCall.findFirst({
        where: {
          assetId: asset.id,
          purpose: AICallPurpose.WARRANTY_REMINDER,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      if (!recentCall) {
        try {
          await this.initiateCall(
            {
              employeeId: alloc.user.id,
              assetId: asset.id,
              purpose: AICallPurpose.WARRANTY_REMINDER,
              additionalContext: `Warranty expiring on ${asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'soon'} for ${asset.name} (${asset.tag})`,
            },
            { id: 'system', role: 'System', organizationId: asset.organizationId || organizationId }
          );
          results.warrantyReminderCalls++;
          results.totalTriggered++;
          results.details.push(`Triggered warranty reminder call to ${alloc.user.name} for ${asset.tag}`);
        } catch (err: any) {
          console.warn(`[Automated Trigger] Warranty call failed:`, err.message);
        }
      }
    }

    // 4. Asset Audit Verification Calls for open audit cycles
    const openAudits = await prisma.auditCycle.findMany({
      where: {
        isOpen: true,
        ...orgFilter,
      },
      include: {
        items: {
          where: { status: 'VERIFIED' },
          include: {
            asset: {
              include: {
                allocations: {
                  where: { isActive: true },
                  include: { user: true },
                },
              },
            },
          },
          take: 10,
        },
      },
      take: 3,
    });

    for (const cycle of openAudits) {
      for (const item of cycle.items) {
        const alloc = item.asset.allocations[0];
        if (!alloc?.user?.phone) continue;

        const recentCall = await prisma.aIVoiceCall.findFirst({
          where: {
            auditCycleId: cycle.id,
            assetId: item.asset.id,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (!recentCall) {
          try {
            await this.initiateCall(
              {
                employeeId: alloc.user.id,
                assetId: item.asset.id,
                auditCycleId: cycle.id,
                purpose: AICallPurpose.ASSET_AUDIT_VERIFICATION,
                additionalContext: `Quarterly audit verification for ${cycle.name}: verify ${item.asset.name} (${item.asset.tag})`,
              },
              { id: 'system', role: 'System', organizationId: cycle.organizationId || organizationId }
            );
            results.auditVerificationCalls++;
            results.totalTriggered++;
            results.details.push(`Triggered audit verification call to ${alloc.user.name} for ${item.asset.tag}`);
          } catch (err: any) {
            console.warn(`[Automated Trigger] Audit call failed:`, err.message);
          }
        }
      }
    }

    return results;
  }

  /**
   * Simulate a webhook response for testing and live demonstration
   */
  async simulateWebhookCall(
    callId: string,
    outcome: AIAuditOutcome = AIAuditOutcome.VERIFIED,
    params?: { duration?: number; transcript?: string; summary?: string; sentiment?: string }
  ) {
    const call = await prisma.aIVoiceCall.findUnique({
      where: { id: callId },
      include: { employee: true, asset: true },
    });

    if (!call) throw new AppError('Call record not found', 404);

    const empName = call.employee?.name || 'Rahul';
    const assetName = call.asset?.name || 'Assigned Device';
    const assetTag = call.asset?.tag || 'AF-1001';
    const contextData: any = call.context || {};
    const adminName = contextData.initiatedBy || 'your Administrator';
    const customPrompt = contextData.spokenInstructionPrompt || (contextData.customContext ? `Hello ${empName}, this is Sophia from AssetFlow calling on behalf of ${adminName}. ${adminName} requested: "${contextData.customContext}".` : null);

    const defaultTranscript =
      outcome === AIAuditOutcome.VERIFIED
        ? `[Sophia (AI Agent)]: Hello ${empName}, calling from AssetFlow ERP regarding your quarterly asset audit. Can you confirm you still have the ${assetName} (${assetTag}) in your possession?\n[Employee]: Yes, I have it right here with me at my desk. Everything is working fine.\n[Sophia (AI Agent)]: Wonderful ${empName}! I have recorded your device as verified in AssetFlow. Thank you!`
        : outcome === AIAuditOutcome.ASSET_MISSING
        ? `[Sophia (AI Agent)]: Hello ${empName}, calling regarding ${assetName} (${assetTag}). Do you currently have this device?\n[Employee]: No, unfortunately I cannot find this device. It seems to have been misplaced.\n[Sophia (AI Agent)]: Noted, I have flagged this asset as missing in AssetFlow ERP and notified IT support.`
        : outcome === AIAuditOutcome.ASSET_DAMAGED
        ? `[Sophia (AI Agent)]: Hello ${empName}, checking status for ${assetName} (${assetTag}). Is the device operational?\n[Employee]: The screen cracked yesterday and the touchpad is unresponsive.\n[Sophia (AI Agent)]: Understood. I have logged this device as damaged and scheduled a maintenance follow-up.`
        : customPrompt
        ? `[Sophia (AI Agent)]: ${customPrompt}\n[Employee]: Hello! Thank you for letting me know. I will contact ${adminName} right away.\n[Sophia (AI Agent)]: Thank you ${empName}, I will record that you have acknowledged this message. Have a great day!`
        : `[Sophia (AI Agent)]: Hello ${empName}, this is an automated AssetFlow notification from ${adminName}.\n[Employee]: Received and acknowledged.\n[Sophia (AI Agent)]: Thank you!`;

    const defaultSummary =
      outcome === AIAuditOutcome.VERIFIED
        ? `Employee confirmed active physical possession of ${assetName} (${assetTag}). Device operational.`
        : outcome === AIAuditOutcome.ASSET_MISSING
        ? `Employee reported ${assetName} (${assetTag}) is missing/lost. IT investigation recommended.`
        : outcome === AIAuditOutcome.ASSET_DAMAGED
        ? `Employee reported hardware damage (cracked screen/touchpad) on ${assetName} (${assetTag}). Maintenance required.`
        : contextData.customContext
        ? `Delivered instruction to ${empName}: "${contextData.customContext}". Employee acknowledged.`
        : `Notification delivered successfully to ${empName}.`;

    return await this.handleWebhook({
      call_id: call.callId || call.id,
      status: 'COMPLETED',
      duration: params?.duration || 48,
      transcript: params?.transcript || defaultTranscript,
      summary: params?.summary || defaultSummary,
      sentiment: params?.sentiment || (outcome === AIAuditOutcome.VERIFIED ? 'positive' : 'neutral'),
      extracted_variables: {
        verification_result: outcome,
        employee_confirmed: outcome === AIAuditOutcome.VERIFIED,
      },
    });
  }
}

export default new AIVoiceService();
