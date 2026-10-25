import mongoose, { Document, Schema } from 'mongoose';
import { IAttendanceRecord, AttendanceStatus } from '@ironlogic4/shared';

export interface AttendanceRecordDocument extends Omit<IAttendanceRecord, 'id'>, Document {}

const attendanceRecordSchema = new Schema<AttendanceRecordDocument>(
  {
    gymId: {
      type: String,
      ref: 'Gym',
      required: true,
    },
    clientId: {
      type: String,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    // Snapshot of the class, since the active schedule is reset from its template every week
    timeslotId: {
      type: String,
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: '',
    },
    coachIds: {
      type: [String],
      ref: 'User',
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(AttendanceStatus),
      required: true,
    },
    walkIn: {
      type: Boolean,
      default: false,
    },
    recordedBy: {
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

// One record per client per class occurrence — resubmitting a roster upserts
attendanceRecordSchema.index({ timeslotId: 1, date: 1, clientId: 1 }, { unique: true });
attendanceRecordSchema.index({ gymId: 1, date: 1 });
attendanceRecordSchema.index({ clientId: 1, date: 1 });

export const AttendanceRecord = mongoose.model<AttendanceRecordDocument>(
  'AttendanceRecord',
  attendanceRecordSchema
);
