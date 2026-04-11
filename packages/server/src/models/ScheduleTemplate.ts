import mongoose, { Document, Schema } from 'mongoose';
import { IScheduleTemplate, DayOfWeek } from '@ironlogic4/shared';

export interface ScheduleTemplateDocument extends Omit<IScheduleTemplate, 'id'>, Document {}

const scheduleTemplateSchema = new Schema<ScheduleTemplateDocument>(
  {
    gymId: {
      type: String,
      ref: 'Gym',
      required: true,
    },
    coachId: {
      type: String,
      ref: 'User',
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      enum: Object.values(DayOfWeek).filter(v => typeof v === 'number'),
    },
    period: {
      type: String,
      required: true,
      enum: ['AM', 'PM'],
    },
    time: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    maxCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

scheduleTemplateSchema.index({ gymId: 1 });
scheduleTemplateSchema.index({ gymId: 1, dayOfWeek: 1, time: 1 });
scheduleTemplateSchema.index({ coachId: 1 });

export const ScheduleTemplate = mongoose.model<ScheduleTemplateDocument>(
  'ScheduleTemplate',
  scheduleTemplateSchema
);
