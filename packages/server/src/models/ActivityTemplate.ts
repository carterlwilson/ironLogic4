import mongoose, { Document, Schema } from 'mongoose';
import { ActivityTemplate as IActivityTemplate, ActivityType } from '@ironlogic4/shared';

export interface ActivityTemplateDocument extends Omit<IActivityTemplate, 'id'>, Document {}

const activityTemplateSchema = new Schema<ActivityTemplateDocument>(
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
    groupId: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ActivityType),
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

// Indexes for efficient queries
activityTemplateSchema.index({ gymId: 1 });
activityTemplateSchema.index({ gymId: 1, type: 1 });
activityTemplateSchema.index({ gymId: 1, groupId: 1 });
activityTemplateSchema.index({ name: 'text', notes: 'text' });

// Transform the _id to id when converting to JSON
activityTemplateSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const ActivityTemplate = mongoose.model<ActivityTemplateDocument>('ActivityTemplate', activityTemplateSchema);