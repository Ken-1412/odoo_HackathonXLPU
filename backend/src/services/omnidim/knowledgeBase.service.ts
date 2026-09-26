import { omnidimClientService } from './omnidimClient';
import env from '../../config/env';

export interface KnowledgeDocument {
  id: number | string;
  name: string;
  category: string;
  status: 'PROCESSED' | 'PROCESSING' | 'ATTACHED' | 'STANDBY';
  fileSize?: string;
  attachedToAgent: boolean;
  uploadedAt: string;
  summary: string;
}

// Built-in StockSense Standard Operating Procedures for Inventory Management
const DEFAULT_STOCKSENSE_SOPS: KnowledgeDocument[] = [
  {
    id: 101,
    name: 'StockSense_Warehouse_Receiving_SOP.pdf',
    category: 'Inbound Operations',
    status: 'ATTACHED',
    fileSize: '342 KB',
    attachedToAgent: true,
    uploadedAt: '2026-09-20',
    summary: 'Standard procedures for physical inspection, quantity tallying against vendor purchase orders, bay staging, and automated receipt validation into StockSense.',
  },
  {
    id: 102,
    name: 'Internal_Transfer_&_Location_Topology_Guidelines.pdf',
    category: 'Spatial Hierarchy',
    status: 'ATTACHED',
    fileSize: '512 KB',
    attachedToAgent: true,
    uploadedAt: '2026-09-22',
    summary: 'Rules for warehouse zone partitions (Zone A Staging, Zone B Bulk, Zone C Picking), rack indexing, bin capacity limits, and multi-facility transfers.',
  },
  {
    id: 103,
    name: 'Cycle_Count_Audit_&_Variance_Adjustment_Policy.pdf',
    category: 'Inventory Control',
    status: 'ATTACHED',
    fileSize: '280 KB',
    attachedToAgent: true,
    uploadedAt: '2026-09-24',
    summary: 'Strict audit protocols for stock discrepancy resolution, physical vs system variance reconciliation, manager approvals, and unalterable StockLedger updates.',
  },
  {
    id: 104,
    name: 'Outbound_Fulfillment_&_Delivery_Dispatch_SOP.pdf',
    category: 'Outbound Operations',
    status: 'PROCESSED',
    fileSize: '415 KB',
    attachedToAgent: false,
    uploadedAt: '2026-09-25',
    summary: 'Pick-pack-ship protocols, reserved stock allocations, staging verification, delivery order signing, and carrier handoff.',
  },
];

class KnowledgeBaseService {
  private inMemoryDocs: KnowledgeDocument[] = [...DEFAULT_STOCKSENSE_SOPS];
  private defaultAgentId: string;

  constructor() {
    this.defaultAgentId = process.env.OMNIDIM_AGENT_ID || env.OMNIDIM_DEFAULT_AGENT_ID || '241840';
  }

  /**
   * List Knowledge Base files
   */
  public async listFiles() {
    if (!omnidimClientService.isConfigured()) {
      return {
        success: true,
        files: this.inMemoryDocs,
        isConfigured: false,
      };
    }

    try {
      const client = omnidimClientService.getClient();
      const res = await client.knowledgeBase.list();
      const remoteFiles = res.files || [];

      // Merge remote files with StockSense documentation
      const merged = [
        ...this.inMemoryDocs,
        ...remoteFiles.map((rf: any) => ({
          id: rf.id,
          name: rf.file_name || rf.name || 'OmniDim_Doc.pdf',
          category: 'Remote Knowledge Base',
          status: (rf.status || 'ATTACHED').toUpperCase(),
          fileSize: rf.file_size ? `${Math.round(rf.file_size / 1024)} KB` : 'Unknown',
          attachedToAgent: Boolean(rf.attached_to_agent ?? true),
          uploadedAt: rf.created_at ? new Date(rf.created_at).toISOString().split('T')[0] : 'Recent',
          summary: rf.description || 'OmniDimension connected knowledge base file.',
        })),
      ];

      return {
        success: true,
        files: merged,
        isConfigured: true,
      };
    } catch (err: any) {
      console.warn('[OmniDim KB] Remote list warning:', err.message);
      return {
        success: true,
        files: this.inMemoryDocs,
        isConfigured: true,
        error: err.message,
      };
    }
  }

  /**
   * Attach file to agent
   */
  public async attachFile(fileId: number | string, agentId?: number | string) {
    const targetAgentId = Number(agentId || this.defaultAgentId);
    const numFileId = Number(fileId);

    // Update local state
    const doc = this.inMemoryDocs.find((d) => String(d.id) === String(fileId));
    if (doc) doc.attachedToAgent = true;

    if (omnidimClientService.isConfigured()) {
      try {
        const client = omnidimClientService.getClient();
        await client.knowledgeBase.attach({
          agent_id: targetAgentId,
          file_ids: [numFileId],
        } as any);
      } catch (err: any) {
        console.warn('[OmniDim KB] Remote attach error:', err.message);
      }
    }

    return { success: true, message: `Knowledge document #${fileId} attached to agent #${targetAgentId}.` };
  }

  /**
   * Detach file from agent
   */
  public async detachFile(fileId: number | string, agentId?: number | string) {
    const targetAgentId = Number(agentId || this.defaultAgentId);
    const numFileId = Number(fileId);

    const doc = this.inMemoryDocs.find((d) => String(d.id) === String(fileId));
    if (doc) doc.attachedToAgent = false;

    if (omnidimClientService.isConfigured()) {
      try {
        const client = omnidimClientService.getClient();
        await client.knowledgeBase.detach({
          agent_id: targetAgentId,
          file_ids: [numFileId],
        } as any);
      } catch (err: any) {
        console.warn('[OmniDim KB] Remote detach error:', err.message);
      }
    }

    return { success: true, message: `Knowledge document #${fileId} detached from agent #${targetAgentId}.` };
  }

  /**
   * Add a new document (SOP) to Knowledge Base
   */
  public async addDocument(doc: { name: string; category?: string; summary?: string }) {
    const newDoc: KnowledgeDocument = {
      id: Date.now(),
      name: doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`,
      category: doc.category || 'Standard Operating Procedure',
      status: 'PROCESSED',
      fileSize: '150 KB',
      attachedToAgent: false,
      uploadedAt: new Date().toISOString().split('T')[0],
      summary: doc.summary || 'StockSense inventory operating policy.',
    };

    this.inMemoryDocs.push(newDoc);
    return { success: true, file: newDoc, message: 'Document added to StockSense Knowledge Base repository.' };
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;
