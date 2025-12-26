import mongoose, { Document, Schema } from 'mongoose';
import { Announcement as IAnnouncement } from '@ironlogic4/shared/types/announcements';

export interface AnnouncementDocument extends Omit<IAnnouncement, 'id'>, Document {}

const announcementSchema = new Schema<AnnouncementDocument>(
  {
    gymId: {
      type: String,
      required: true,
      unique: true, // Ensures one announcement per gym
      ref: 'Gym',
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000, // Prevent abuse
    },
  },
  {
    timestamps: true, // Provides createdAt and updatedAt
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

// Index for efficient gym-based queries
announcementSchema.index({ gymId: 1 });

export const Announcement = mongoose.model<AnnouncementDocument>('Announcement', announcementSchema);
