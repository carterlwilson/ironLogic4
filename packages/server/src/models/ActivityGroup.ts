import mongoose, { Document, Schema } from 'mongoose';
import { ActivityGroup as IActivityGroup } from '@ironlogic4/shared';

export interface ActivityGroupDocument extends Omit<IActivityGroup, 'id'>, Document {}

const activityGroupSchema = new Schema<ActivityGroupDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    gymId: {
      type: String,
      ref: 'Gym',
      required: true,
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

activityGroupSchema.index({ gymId: 1 });
activityGroupSchema.index({ gymId: 1, name: 1 });
activityGroupSchema.index({ name: 'text', notes: 'text' });

activityGroupSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const ActivityGroup = mongoose.model<ActivityGroupDocument>('ActivityGroup', activityGroupSchema);