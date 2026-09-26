import mongoose, { Schema, Document } from 'mongoose';

export interface IOmniDimAgentConfig extends Document {
  agentId: string;
  name: string;
  status: string;
  primaryLanguage: string;
  languages: string[];
  llmModel?: string;
  voiceId?: string;
  voiceName?: string;
  toolToken?: string;
  webhookUrl?: string;
  phoneNumberId?: string;
  assignedPhoneNumber?: string;
  transferNumber?: string;
  systemPrompt?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OmniDimAgentConfigSchema = new Schema<IOmniDimAgentConfig>(
  {
    agentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: 'StockSense Inventory Voice Assistant' },
    status: { type: String, default: 'active' },
    primaryLanguage: { type: String, default: 'en-US' },
    languages: [{ type: String, default: ['en-US', 'en-IN', 'hi-IN'] }],
    llmModel: { type: String, default: 'gpt-4.1-mini' },
    voiceId: { type: String, default: 'asteria' },
    voiceName: { type: String, default: 'Asteria' },
    toolToken: { type: String },
    webhookUrl: { type: String },
    phoneNumberId: { type: String },
    assignedPhoneNumber: { type: String },
    transferNumber: { type: String },
    systemPrompt: { type: String },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

export const OmniDimAgentConfig =
  mongoose.models.OmniDimAgentConfig ||
  mongoose.model<IOmniDimAgentConfig>('OmniDimAgentConfig', OmniDimAgentConfigSchema);
