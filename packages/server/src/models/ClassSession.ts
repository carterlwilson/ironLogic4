import mongoose, { Document, Schema } from 'mongoose';
import { IClassSession } from '@ironlogic4/shared';

export interface ClassSessionDocument extends Omit<IClassSession, 'id' | 'createdAt'>, Document {}

const classSessionSchema = new Schema<ClassSessionDocument>(
  {
    templateId:  { type: String, ref: 'ScheduleTemplate', required: true },
    coachId:     { type: String, ref: 'User', required: true },
    gymId:       { type: String, ref: 'Gym', required: true },
    date:        { type: Date, required: true },
    period:      { type: String, required: true, enum: ['AM', 'PM'] },
    startTime:   { type: String, required: true, match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ },
    endTime:     { type: String, required: true, match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ },
    maxCapacity: { type: Number, required: true, min: 1 },
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

classSessionSchema.index({ coachId: 1, date: 1 });
classSessionSchema.index({ gymId: 1, date: 1 });
classSessionSchema.index({ templateId: 1, date: 1 }, { unique: true });

export const ClassSession = mongoose.model<ClassSessionDocument>('ClassSession', classSessionSchema);
