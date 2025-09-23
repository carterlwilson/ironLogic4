import mongoose, { Document, Schema } from 'mongoose';
import { User as IUser, UserType } from '@ironlogic4/shared';
import { hashPassword, comparePassword } from '../utils/auth';

export interface UserDocument extends Omit<IUser, 'id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: Object.values(UserType),
      required: true,
      default: UserType.CLIENT,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't include password in queries by default
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        if (ret.password) delete (ret as any).password; // Never include password in JSON responses
        return ret;
      },
    },
  }
);

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return comparePassword(candidatePassword, this.password);
};

// Create unique index on email
userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<UserDocument>('User', userSchema);