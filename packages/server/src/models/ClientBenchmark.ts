import { Schema } from 'mongoose';
import { ClientBenchmark as IClientBenchmark, BenchmarkType } from '@ironlogic4/shared';

// This is a subdocument schema for embedding in User documents, not a standalone model
export interface ClientBenchmarkDocument extends Omit<IClientBenchmark, 'id'> {
  _id: string;
}

const repMaxSchema = new Schema({
  templateRepMaxId: {
    type: String,
    required: true
  },
  weightKg: {
    type: Number,
    required: true,
    min: 0
  },
  recordedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true  // RepMax HAS timestamps
});

const timeSubMaxSchema = new Schema({
  templateSubMaxId: {
    type: String,
    required: true
  },
  distanceMeters: {
    type: Number,
    required: true,
    min: 0
  },
  recordedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true  // TimeSubMax HAS timestamps
});

const distanceSubMaxSchema = new Schema({
  templateDistanceSubMaxId: {
    type: String,
    required: true
  },
  timeSeconds: {
    type: Number,
    required: true,
    min: 0
  },
  recordedAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true  // DistanceSubMax HAS timestamps
});

export const clientBenchmarkSchema = new Schema<ClientBenchmarkDocument>(
  {
    templateId: {
      type: String,
      ref: 'BenchmarkTemplate',
      required: true,
    },
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
    // Measurement fields - only one should be populated based on type
    repMaxes: {
      type: [repMaxSchema],
      default: [],
      required: false
    },
    timeSubMaxes: {
      type: [timeSubMaxSchema],
      default: [],
      required: false
    },
    distanceSubMaxes: {
      type: [distanceSubMaxSchema],
      default: [],
      required: false
    },
    timeSeconds: {
      type: Number,
      min: 0,
    },
    reps: {
      type: Number,
      min: 0,
    },
    otherNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    recordedAt: {
      type: Date,
      required: false,  // Only required for non-WEIGHT types
    },
  },
  {
    timestamps: true,
  }
);

// Validate that the correct measurement field is populated based on type
clientBenchmarkSchema.pre('save', function (next) {
  const benchmark = this;

  switch (benchmark.type) {
    case BenchmarkType.WEIGHT:
      if (!benchmark.repMaxes || benchmark.repMaxes.length === 0) {
        return next(new Error('At least one repMax is required for WEIGHT type benchmarks'));
      }
      break;
    case BenchmarkType.DISTANCE:
      if (!benchmark.timeSubMaxes || benchmark.timeSubMaxes.length === 0) {
        return next(new Error('At least one timeSubMax is required for DISTANCE type benchmarks'));
      }
      break;
    case BenchmarkType.TIME:
      // TIME benchmarks can have either timeSeconds (legacy) OR distanceSubMaxes (new multi-distance)
      const hasTimeSeconds = benchmark.timeSeconds !== undefined && benchmark.timeSeconds !== null;
      const hasDistanceSubMaxes = benchmark.distanceSubMaxes && benchmark.distanceSubMaxes.length > 0;
      if (!hasTimeSeconds && !hasDistanceSubMaxes) {
        return next(new Error('TIME type benchmarks require either timeSeconds or at least one distanceSubMax'));
      }
      break;
    case BenchmarkType.REPS:
      if (benchmark.reps === undefined || benchmark.reps === null) {
        return next(new Error('reps is required for REPS type benchmarks'));
      }
      break;
    case BenchmarkType.OTHER:
      if (!benchmark.otherNotes || benchmark.otherNotes.trim() === '') {
        return next(new Error('otherNotes is required for OTHER type benchmarks'));
      }
      break;
  }

  next();
});

// Transform _id to id when converting to JSON
clientBenchmarkSchema.set('toJSON', {
  transform: function (doc, ret) {
    (ret as any).id = ret._id;
    delete (ret as any)._id;

    // Transform repMaxes subdocuments
    if (ret.repMaxes && Array.isArray(ret.repMaxes)) {
      ret.repMaxes = ret.repMaxes.map((rm: any) => ({
        id: rm._id.toString(),
        templateRepMaxId: rm.templateRepMaxId,
        weightKg: rm.weightKg,
        recordedAt: rm.recordedAt,
        createdAt: rm.createdAt,
        updatedAt: rm.updatedAt
      }));
    }

    // Transform timeSubMaxes subdocuments
    if (ret.timeSubMaxes && Array.isArray(ret.timeSubMaxes)) {
      ret.timeSubMaxes = ret.timeSubMaxes.map((tsm: any) => ({
        id: tsm._id.toString(),
        templateSubMaxId: tsm.templateSubMaxId,
        distanceMeters: tsm.distanceMeters,
        recordedAt: tsm.recordedAt,
        createdAt: tsm.createdAt,
        updatedAt: tsm.updatedAt
      }));
    }

    // Transform distanceSubMaxes subdocuments
    if (ret.distanceSubMaxes && Array.isArray(ret.distanceSubMaxes)) {
      ret.distanceSubMaxes = ret.distanceSubMaxes.map((dsm: any) => ({
        id: dsm._id.toString(),
        templateDistanceSubMaxId: dsm.templateDistanceSubMaxId,
        timeSeconds: dsm.timeSeconds,
        recordedAt: dsm.recordedAt,
        createdAt: dsm.createdAt,
        updatedAt: dsm.updatedAt
      }));
    }

    return ret;
  },
});