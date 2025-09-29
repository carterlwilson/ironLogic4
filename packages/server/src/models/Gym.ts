import mongoose, { Document, Schema } from 'mongoose';
import { Gym as IGym } from '@ironlogic4/shared/types/gyms';

export interface GymDocument extends Omit<IGym, 'id'>, Document {}

const gymSchema = new Schema<GymDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    ownerId: {
      type: String,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
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

// Create indexes for better query performance
gymSchema.index({ name: 1 });
gymSchema.index({ ownerId: 1 });
gymSchema.index({ createdAt: -1 });

// Validate that ownerId references an existing user
gymSchema.pre('save', async function (next) {
  if (this.isModified('ownerId')) {
    const User = mongoose.model('User');
    const userExists = await User.findById(this.ownerId);
    if (!userExists) {
      const error = new Error('Owner ID must reference an existing user');
      return next(error);
    }
  }
  next();
});

export const Gym = mongoose.model<GymDocument>('Gym', gymSchema);