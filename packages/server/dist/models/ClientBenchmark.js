import { Schema } from 'mongoose';
import { BenchmarkType } from '@ironlogic4/shared';
export const clientBenchmarkSchema = new Schema({
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
    weightKg: {
        type: Number,
        min: 0,
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
        required: true,
    },
}, {
    timestamps: true,
});
// Validate that the correct measurement field is populated based on type
clientBenchmarkSchema.pre('save', function (next) {
    const benchmark = this;
    switch (benchmark.type) {
        case BenchmarkType.WEIGHT:
            if (benchmark.weightKg === undefined || benchmark.weightKg === null) {
                return next(new Error('weightKg is required for WEIGHT type benchmarks'));
            }
            break;
        case BenchmarkType.TIME:
            if (benchmark.timeSeconds === undefined || benchmark.timeSeconds === null) {
                return next(new Error('timeSeconds is required for TIME type benchmarks'));
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
        ret.id = ret._id;
        delete ret._id;
        return ret;
    },
});
//# sourceMappingURL=ClientBenchmark.js.map