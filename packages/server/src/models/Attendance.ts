import mongoose, { Document, Schema } from 'mongoose';
import { IAttendance } from '@ironlogic4/shared';

export interface AttendanceDocument extends Omit<IAttendance, 'id'>, Document {}

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    sessionId:   { type: String, ref: 'ClassSession', required: true },
    clientId:    { type: String, ref: 'User', required: true },
    status:      { type: String, enum: ['present', 'absent', 'late'], required: true },
    recordedBy:  { type: String, ref: 'User', required: true },
    recordedAt:  { type: Date, required: true, default: Date.now },
  },
  {
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

attendanceSchema.index({ sessionId: 1 });
attendanceSchema.index({ clientId: 1, sessionId: 1 }, { unique: true });
attendanceSchema.index({ clientId: 1, recordedAt: -1 });

export const Attendance = mongoose.model<AttendanceDocument>('Attendance', attendanceSchema);
