import { omnidimClientService } from './omnidimClient';
import env from '../../config/env';

export interface StockSensePhoneNumber {
  id: number | string;
  phoneNumber: string;
  countryCode: string;
  carrier: string;
  status: 'ACTIVE' | 'UNASSIGNED' | 'STANDBY';
  inboundEnabled: boolean;
  assignedAgentId?: string | number;
  assignedAgentName?: string;
  transferTargetNumber?: string;
}

class PhoneNumberService {
  private defaultAgentId: string;

  constructor() {
    this.defaultAgentId = process.env.OMNIDIM_AGENT_ID || env.OMNIDIM_DEFAULT_AGENT_ID || '241840';
  }

  /**
   * List phone numbers attached to OmniDimension
   */
  public async listPhoneNumbers(): Promise<{
    success: boolean;
    phoneNumbers: StockSensePhoneNumber[];
    isConfigured: boolean;
    assignedAgentId: string;
    message?: string;
  }> {
    const configuredNumber = process.env.OMNIDIM_DEFAULT_CALLER_NUMBER || '';
    const transferNumber = process.env.OMNIDIM_TRANSFER_NUMBER || '';

    if (!omnidimClientService.isConfigured()) {
      return {
        success: true,
        phoneNumbers: configuredNumber
          ? [
              {
                id: 'pn-config-01',
                phoneNumber: configuredNumber,
                countryCode: configuredNumber.startsWith('+91') ? 'IN' : 'US',
                carrier: 'Direct Voice Trunk',
                status: 'ACTIVE',
                inboundEnabled: true,
                assignedAgentId: this.defaultAgentId,
                assignedAgentName: 'StockSense Inventory Voice Assistant',
                transferTargetNumber: transferNumber || undefined,
              },
            ]
          : [],
        isConfigured: false,
        assignedAgentId: this.defaultAgentId,
        message: 'Phone numbers channel not connected. Set OMNIDIM_API_KEY to fetch remote telco numbers.',
      };
    }

    try {
      const client = omnidimClientService.getClient();
      const res = await client.phoneNumbers.list();
      const numbers = (res.phone_numbers || []).map((pn: any) => ({
        id: pn.id,
        phoneNumber: pn.phone_number || pn.number,
        countryCode: pn.region || (pn.phone_number?.startsWith('+91') ? 'IN' : 'US'),
        carrier: pn.carrier_name || pn.provider || 'OmniDimension Telecom',
        status: (pn.status || (pn.agent_id ? 'ACTIVE' : 'UNASSIGNED')).toUpperCase(),
        inboundEnabled: Boolean(pn.inbound_enabled ?? true),
        assignedAgentId: pn.agent_id || this.defaultAgentId,
        assignedAgentName: pn.agent_name || 'StockSense Inventory Voice Assistant',
        transferTargetNumber: transferNumber || undefined,
      }));

      return {
        success: true,
        phoneNumbers: numbers,
        isConfigured: true,
        assignedAgentId: this.defaultAgentId,
      };
    } catch (err: any) {
      console.warn('[OmniDim PhoneNumbers] Remote list error:', err.message);
      return {
        success: true,
        phoneNumbers: configuredNumber
          ? [
              {
                id: 'pn-config-01',
                phoneNumber: configuredNumber,
                countryCode: configuredNumber.startsWith('+91') ? 'IN' : 'US',
                carrier: 'Direct Voice Trunk',
                status: 'ACTIVE',
                inboundEnabled: true,
                assignedAgentId: this.defaultAgentId,
                assignedAgentName: 'StockSense Inventory Voice Assistant',
                transferTargetNumber: transferNumber || undefined,
              },
            ]
          : [],
        isConfigured: true,
        assignedAgentId: this.defaultAgentId,
        message: err.message,
      };
    }
  }

  /**
   * Attach phone number to agent
   */
  public async attachNumber(phoneNumberId: number, agentId?: number) {
    if (!omnidimClientService.isConfigured()) {
      return { success: true, message: `Number #${phoneNumberId} attached locally to agent.` };
    }
    const client = omnidimClientService.getClient();
    const targetAgent = agentId || Number(this.defaultAgentId);
    return client.phoneNumbers.attach({
      phone_number_id: phoneNumberId,
      agent_id: targetAgent,
    });
  }

  /**
   * Detach phone number
   */
  public async detachNumber(phoneNumberId: number) {
    if (!omnidimClientService.isConfigured()) {
      return { success: true, message: `Number #${phoneNumberId} detached.` };
    }
    const client = omnidimClientService.getClient();
    return client.phoneNumbers.detach({
      phone_number_id: phoneNumberId,
    });
  }
}

export const phoneNumberService = new PhoneNumberService();
export default phoneNumberService;
