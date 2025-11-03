import mongoose, { Schema } from 'mongoose';
import { BenchmarkType } from '@ironlogic4/shared';
const benchmarkTemplateSchema = new Schema({
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
}, {
    timestamps: true,
});
// Indexes for efficient queries
benchmarkTemplateSchema.index({ gymId: 1 });
benchmarkTemplateSchema.index({ gymId: 1, type: 1 });
benchmarkTemplateSchema.index({ tags: 1 });
benchmarkTemplateSchema.index({ name: 'text', notes: 'text' });
// Transform _id to id when converting to JSON
benchmarkTemplateSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
export const BenchmarkTemplate = mongoose.model('BenchmarkTemplate', benchmarkTemplateSchema);
//# sourceMappingURL=BenchmarkTemplate.js.map