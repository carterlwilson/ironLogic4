import mongoose, { Document, Schema } from 'mongoose';
import { IEnrollment } from '@ironlogic4/shared';

export interface EnrollmentDocument extends Omit<IEnrollment, 'id'>, Document {}

const enrollmentSchema = new Schema<EnrollmentDocument>(
  {
    sessionId:  { type: String, ref: 'ClassSession', required: true },
    clientId:   { type: String, ref: 'User', required: true },
    source:     { type: String, enum: ['default', 'override'], required: true },
    status:     { type: String, enum: ['enrolled', 'skipped'], required: true, default: 'enrolled' },
    enrolledAt: { type: Date, required: true, default: Date.now },
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

enrollmentSchema.index({ sessionId: 1, status: 1 });
enrollmentSchema.index({ clientId: 1, sessionId: 1 }, { unique: true });
enrollmentSchema.index({ clientId: 1, status: 1 });

export const Enrollment = mongoose.model<EnrollmentDocument>('Enrollment', enrollmentSchema);
