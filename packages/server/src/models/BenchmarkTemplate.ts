import mongoose, { Document, Schema } from 'mongoose';
import { BenchmarkTemplate as IBenchmarkTemplate, BenchmarkType } from '@ironlogic4/shared';

export interface BenchmarkTemplateDocument extends Omit<IBenchmarkTemplate, 'id'>, Document {}

const benchmarkTemplateSchema = new Schema<BenchmarkTemplateDocument>(
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
    type: {
      type: String,
      required: true,
      enum: Object.values(BenchmarkType),
    },
    tags: {
      type: [String],
      default: [],
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
benchmarkTemplateSchema.index({ gymId: 1 });
benchmarkTemplateSchema.index({ gymId: 1, type: 1 });
benchmarkTemplateSchema.index({ tags: 1 });
benchmarkTemplateSchema.index({ name: 'text', notes: 'text' });

// Transform _id to id when converting to JSON
benchmarkTemplateSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const BenchmarkTemplate = mongoose.model<BenchmarkTemplateDocument>('BenchmarkTemplate', benchmarkTemplateSchema);