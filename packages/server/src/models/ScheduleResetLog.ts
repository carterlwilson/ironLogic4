import mongoose, { Document, Schema } from 'mongoose';

export type ScheduleResetStatus = 'success' | 'partial_failure' | 'failure';
export type ScheduleResetTrigger = 'cron' | 'manual';

export interface ScheduleResetLogDocument extends Document {
  trigger: ScheduleResetTrigger;
  status: ScheduleResetStatus;
  resetCount: number;
  failedCount: number;
  errorMessages: string[];
  durationMs: number;
  startedAt: Date;
}

const scheduleResetLogSchema = new Schema<ScheduleResetLogDocument>(
  {
    trigger: { type: String, enum: ['cron', 'manual'], required: true },
    status: { type: String, enum: ['success', 'partial_failure', 'failure'], required: true },
    resetCount: { type: Number, required: true, default: 0 },
    failedCount: { type: Number, required: true, default: 0 },
    errorMessages: { type: [String], default: [] },
    durationMs: { type: Number, required: true },
    startedAt: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

scheduleResetLogSchema.index({ createdAt: -1 });

export const ScheduleResetLog = mongoose.model<ScheduleResetLogDocument>('ScheduleResetLog', scheduleResetLogSchema);
