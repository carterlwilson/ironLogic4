import mongoose, { Document, Schema } from 'mongoose';
import { BenchmarkTemplate as IBenchmarkTemplate, BenchmarkType } from '@ironlogic4/shared';

export interface BenchmarkTemplateDocument extends Omit<IBenchmarkTemplate, 'id'>, Document {}

const templateRepMaxSchema = new Schema({
  reps: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  }
  // DO NOT ADD timestamps: true
  // DO NOT ADD order field
});

const templateTimeSubMaxSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30  // e.g., "1 min", "3 min", "5 min"
  }
  // DO NOT ADD timestamps: true
});

const templateDistanceSubMaxSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30  // e.g., "100m", "500m", "1 mile"
  }
  // DO NOT ADD timestamps: true
});

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
    templateRepMaxes: {
      type: [templateRepMaxSchema],
      default: [],
      required: false
    },
    templateTimeSubMaxes: {
      type: [templateTimeSubMaxSchema],
      default: [],
      required: false
    },
    templateDistanceSubMaxes: {
      type: [templateDistanceSubMaxSchema],
      default: [],
      required: false
    },
    distanceUnit: {
      type: String,
      enum: ['meters', 'kilometers'],
      required: false
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

    // Transform templateRepMaxes subdocuments
    if (ret.templateRepMaxes && Array.isArray(ret.templateRepMaxes)) {
      ret.templateRepMaxes = ret.templateRepMaxes.map((trm: any) => ({
        id: trm._id.toString(),
        reps: trm.reps,
        name: trm.name
      }));
    }

    // Transform templateTimeSubMaxes subdocuments
    if (ret.templateTimeSubMaxes && Array.isArray(ret.templateTimeSubMaxes)) {
      ret.templateTimeSubMaxes = ret.templateTimeSubMaxes.map((tsm: any) => ({
        id: tsm._id.toString(),
        name: tsm.name
      }));
    }

    // Transform templateDistanceSubMaxes subdocuments
    if (ret.templateDistanceSubMaxes && Array.isArray(ret.templateDistanceSubMaxes)) {
      ret.templateDistanceSubMaxes = ret.templateDistanceSubMaxes.map((dsm: any) => ({
        id: dsm._id.toString(),
        name: dsm.name
      }));
    }

    return ret;
  },
});

// Pre-save validation
benchmarkTemplateSchema.pre('save', function (next) {
  // Validate WEIGHT type has templateRepMaxes
  if (this.type === BenchmarkType.WEIGHT) {
    if (!this.templateRepMaxes || this.templateRepMaxes.length === 0) {
      return next(new Error('WEIGHT type requires at least one templateRepMax'));
    }
  }

  // Validate DISTANCE type has templateTimeSubMaxes and distanceUnit
  if (this.type === BenchmarkType.DISTANCE) {
    if (!this.templateTimeSubMaxes || this.templateTimeSubMaxes.length === 0) {
      return next(new Error('DISTANCE type requires at least one templateTimeSubMax'));
    }
    if (!this.distanceUnit) {
      return next(new Error('DISTANCE type requires distanceUnit (meters or kilometers)'));
    }
  }

  // Validate TIME type has templateDistanceSubMaxes and distanceUnit
  if (this.type === BenchmarkType.TIME) {
    if (!this.templateDistanceSubMaxes || this.templateDistanceSubMaxes.length === 0) {
      return next(new Error('TIME type requires at least one templateDistanceSubMax'));
    }
    if (!this.distanceUnit) {
      return next(new Error('TIME type requires distanceUnit (meters or kilometers)'));
    }
  }

  next();
});

export const BenchmarkTemplate = mongoose.model<BenchmarkTemplateDocument>('BenchmarkTemplate', benchmarkTemplateSchema);