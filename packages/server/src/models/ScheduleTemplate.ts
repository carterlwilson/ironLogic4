import mongoose, { Document, Schema } from 'mongoose';
import {
  IScheduleTemplate,
  IScheduleDay,
  ITimeSlot,
  DayOfWeek
} from '@ironlogic4/shared';

// Subdocument interfaces
export interface TimeSlotDocument extends Omit<ITimeSlot, 'id'>, Document {}

export interface ScheduleDayDocument extends Omit<IScheduleDay, 'timeSlots'>, Document {
  timeSlots: TimeSlotDocument[];
}

export interface ScheduleTemplateDocument extends Omit<IScheduleTemplate, 'id' | 'days'>, Document {
  days: ScheduleDayDocument[];
}

// TimeSlot subdocument schema
const timeSlotSchema = new Schema<TimeSlotDocument>(
  {
    startTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    assignedClients: {
      type: [String],
      ref: 'User',
      default: [],
    },
  },
  {
    _id: true, // Generate _id for each timeslot
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        return ret;
      },
    },
  }
);

// ScheduleDay subdocument schema
const scheduleDaySchema = new Schema<ScheduleDayDocument>(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      enum: Object.values(DayOfWeek).filter(v => typeof v === 'number'),
    },
    timeSlots: {
      type: [timeSlotSchema],
      required: true,
      default: [],
    },
  },
  {
    _id: false, // Don't generate _id for schedule days
  }
);

// Main ScheduleTemplate schema
const scheduleTemplateSchema = new Schema<ScheduleTemplateDocument>(
  {
    gymId: {
      type: String,
      ref: 'Gym',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    coachIds: {
      type: [String],
      ref: 'User',
      required: true,
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0;
        },
        message: 'At least one coach is required',
      },
    },
    days: {
      type: [scheduleDaySchema],
      required: true,
      validate: {
        validator: function(v: ScheduleDayDocument[]) {
          return v && v.length > 0;
        },
        message: 'At least one day is required',
      },
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: true,
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

// Indexes for efficient queries
scheduleTemplateSchema.index({ gymId: 1 });
scheduleTemplateSchema.index({ coachIds: 1 });
scheduleTemplateSchema.index({ gymId: 1, name: 1 }, { unique: true });

// Virtual populate for coach details (optional, for future use)
scheduleTemplateSchema.virtual('coaches', {
  ref: 'User',
  localField: 'coachIds',
  foreignField: '_id',
});

export const ScheduleTemplate = mongoose.model<ScheduleTemplateDocument>(
  'ScheduleTemplate',
  scheduleTemplateSchema
);