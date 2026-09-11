import mongoose, { Document, Schema } from 'mongoose';

export interface ScheduleResetLogDocument extends Document {
  gymId: string;
  activeScheduleId: string;
  templateId?: string;
  triggeredBy: 'cron' | 'manual';
  success: boolean;
  error?: string;
}

const scheduleResetLogSchema = new Schema<ScheduleResetLogDocument>(
  {
    gymId: { type: String, required: true },
    activeScheduleId: { type: String, required: true },
    templateId: { type: String },
    triggeredBy: { type: String, required: true, enum: ['cron', 'manual'] },
    success: { type: Boolean, required: true },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

scheduleResetLogSchema.index({ gymId: 1 });
scheduleResetLogSchema.index({ createdAt: -1 });

export const ScheduleResetLog = mongoose.model<ScheduleResetLogDocument>(
  'ScheduleResetLog',
  scheduleResetLogSchema
);
