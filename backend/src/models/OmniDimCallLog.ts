import mongoose, { Schema, Document } from 'mongoose';

export interface IOmniDimCallLog extends Document {
  externalCallId: string;
  agentId: string;
  userId?: string;
  userName?: string;
  channel: 'web_session' | 'phone_inbound' | 'phone_outbound' | 'simulation';
  customerNumber?: string;
  startedAt: Date;
  endedAt?: Date;
  duration: number; // in seconds
  status: string; // 'completed' | 'in-progress' | 'failed' | 'no-answer' | 'queued'
  transcript?: string;
  summary?: string;
  intent?: string;
  sentiment?: string; // 'positive' | 'neutral' | 'negative'
  extractedVariables?: Record<string, any>;
  sourceActions: string[];
  operationReferences?: string[]; // e.g. ['RCP-V001', 'TRF-V002']
  createdAt: Date;
  updatedAt: Date;
}

const OmniDimCallLogSchema = new Schema<IOmniDimCallLog>(
  {
    externalCallId: { type: String, required: true, unique: true, index: true },
    agentId: { type: String, required: true, index: true },
    userId: { type: String },
    userName: { type: String },
    channel: { type: String, default: 'web_session', index: true },
    customerNumber: { type: String },
    startedAt: { type: Date, default: () => new Date() },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 },
    status: { type: String, default: 'completed', index: true },
    transcript: { type: String },
    summary: { type: String },
    intent: { type: String },
    sentiment: { type: String, default: 'neutral' },
    extractedVariables: { type: Schema.Types.Mixed },
    sourceActions: [{ type: String }],
    operationReferences: [{ type: String }],
  },
  { timestamps: true }
);

OmniDimCallLogSchema.index({ createdAt: -1 });

export const OmniDimCallLog =
  mongoose.models.OmniDimCallLog || mongoose.model<IOmniDimCallLog>('OmniDimCallLog', OmniDimCallLogSchema);
