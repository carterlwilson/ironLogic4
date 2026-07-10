import mongoose, { Document, Schema } from 'mongoose';

export interface DeletedUserLogDocument extends Document {
  deletedUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
  gymId?: string;
  status?: string;
  currentBenchmarksCount: number;
  historicalBenchmarksCount: number;
  accountCreatedAt?: Date;
  hadActiveSessions: boolean;
  deletedBy: {
    id: string;
    email: string;
    userType: string;
  };
  deletedVia: string;
  requestIp?: string;
  requestUserAgent?: string;
}

const deletedUserLogSchema = new Schema<DeletedUserLogDocument>(
  {
    deletedUserId: { type: String, required: true },
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userType: { type: String, required: true },
    gymId: { type: String, required: false },
    status: { type: String, required: false },
    currentBenchmarksCount: { type: Number, required: true },
    historicalBenchmarksCount: { type: Number, required: true },
    accountCreatedAt: { type: Date, required: false },
    hadActiveSessions: { type: Boolean, required: true },
    deletedBy: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      userType: { type: String, required: true },
    },
    deletedVia: { type: String, required: true },
    requestIp: { type: String, required: false },
    requestUserAgent: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

deletedUserLogSchema.index({ deletedUserId: 1 });
deletedUserLogSchema.index({ email: 1 });
deletedUserLogSchema.index({ createdAt: -1 });

export const DeletedUserLog = mongoose.model<DeletedUserLogDocument>('DeletedUserLog', deletedUserLogSchema);
