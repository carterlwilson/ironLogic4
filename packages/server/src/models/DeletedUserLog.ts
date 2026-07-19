import mongoose, { Document, Schema } from 'mongoose';

export interface DeletedUserLogDocument extends Document {
  email: string;
  firstName: string;
  lastName: string;
  deletedBy: {
    id: string;
    email: string;
    userType: string;
  };
  deletedVia: string;
}

const deletedUserLogSchema = new Schema<DeletedUserLogDocument>(
  {
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    deletedBy: {
      id: { type: String, required: true },
      email: { type: String, required: true },
      userType: { type: String, required: true },
    },
    deletedVia: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

deletedUserLogSchema.index({ email: 1 });
deletedUserLogSchema.index({ createdAt: -1 });

export const DeletedUserLog = mongoose.model<DeletedUserLogDocument>('DeletedUserLog', deletedUserLogSchema);
