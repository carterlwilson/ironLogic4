import mongoose, { Document, Schema } from 'mongoose';
import { IClientDefaultSchedule } from '@ironlogic4/shared';

export interface ClientDefaultScheduleDocument extends Omit<IClientDefaultSchedule, 'id' | 'createdAt'>, Document {}

const clientDefaultScheduleSchema = new Schema<ClientDefaultScheduleDocument>(
  {
    clientId:   { type: String, ref: 'User', required: true },
    templateId: { type: String, ref: 'ScheduleTemplate', required: true },
    isActive:   { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

clientDefaultScheduleSchema.index({ clientId: 1 });
clientDefaultScheduleSchema.index({ templateId: 1, isActive: 1 });
clientDefaultScheduleSchema.index({ clientId: 1, templateId: 1 }, { unique: true });

export const ClientDefaultSchedule = mongoose.model<ClientDefaultScheduleDocument>(
  'ClientDefaultSchedule',
  clientDefaultScheduleSchema
);
