import mongoose, { Schema } from 'mongoose';
import { ActivityType, DistanceUnit } from '@ironlogic4/shared';
// ============================================================================
// MONGOOSE SCHEMAS
// ============================================================================
/**
 * Activity Schema
 */
const activitySchema = new Schema({
    activityTemplateId: {
        type: String,
        ref: 'ActivityTemplate',
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(ActivityType),
    },
    order: {
        type: Number,
        required: true,
        min: 0,
    },
    sets: {
        type: Number,
        min: 1,
    },
    reps: {
        type: Number,
        min: 1,
    },
    percentageOfMax: {
        type: Number,
        min: 0,
        max: 200,
    },
    time: {
        type: Number,
        min: 0,
    },
    distance: {
        type: Number,
        min: 0,
    },
    distanceUnit: {
        type: String,
        enum: Object.values(DistanceUnit),
    },
}, { _id: true });
/**
 * Day Schema
 */
const daySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
    },
    order: {
        type: Number,
        required: true,
        min: 0,
    },
    activities: {
        type: [activitySchema],
        required: true,
        default: [],
    },
}, { _id: true });
/**
 * ActivityGroupTarget Schema
 */
const activityGroupTargetSchema = new Schema({
    activityGroupId: {
        type: String,
        ref: 'ActivityGroup',
        required: true,
    },
    targetPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
}, { _id: false });
/**
 * Week Schema
 */
const weekSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
    },
    order: {
        type: Number,
        required: true,
        min: 0,
    },
    activityGroupTargets: {
        type: [activityGroupTargetSchema],
        required: true,
        default: [],
    },
    days: {
        type: [daySchema],
        required: true,
        default: [],
    },
}, { _id: true });
/**
 * Block Schema
 */
const blockSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
    },
    order: {
        type: Number,
        required: true,
        min: 0,
    },
    activityGroupTargets: {
        type: [activityGroupTargetSchema],
        required: true,
        default: [],
    },
    weeks: {
        type: [weekSchema],
        required: true,
        default: [],
    },
}, { _id: true });
/**
 * Program Progress Schema
 */
const programProgressSchema = new Schema({
    blockIndex: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    weekIndex: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    startedAt: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    lastAdvancedAt: {
        type: Date,
        default: null,
    },
    totalWeeksCompleted: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
}, { _id: false });
/**
 * Program Schema
 * -------------
 * Main schema for the Program model.
 *
 * INDEXES:
 * - name: For search functionality
 * - gymId: For gym-based queries
 * - gymId + isActive: For finding active programs in a gym
 * - createdBy: For finding programs created by a specific user
 */
const programSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    gymId: {
        type: String,
        ref: 'Gym',
        required: true,
        index: true,
    },
    createdBy: {
        type: String,
        ref: 'User',
        required: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
        index: true,
    },
    blocks: {
        type: [blockSchema],
        required: true,
        default: [],
    },
    currentProgress: {
        type: programProgressSchema,
        required: true,
        default: () => ({
            blockIndex: 0,
            weekIndex: 0,
            startedAt: null,
            completedAt: null,
            lastAdvancedAt: null,
            totalWeeksCompleted: 0,
        }),
    },
}, {
    timestamps: true,
});
// ============================================================================
// INDEXES
// ============================================================================
programSchema.index({ name: 1 });
programSchema.index({ gymId: 1, isActive: 1 });
programSchema.index({ gymId: 1, createdBy: 1 });
// ============================================================================
// JSON TRANSFORMATION
// ============================================================================
/**
 * Helper function to recursively transform _id to id in nested objects
 */
function transformIds(obj) {
    // Return primitives as-is
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    // Preserve Date objects - DON'T transform them
    if (obj instanceof Date) {
        return obj;
    }
    // Preserve Buffer objects (from ObjectIds that weren't converted properly)
    if (Buffer.isBuffer(obj)) {
        return obj.toString('hex');
    }
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => transformIds(item));
    }
    // Handle Mongoose ObjectIds directly
    if (obj.constructor && obj.constructor.name === 'ObjectID') {
        return obj.toString();
    }
    // Handle objects
    const transformed = {};
    for (const key in obj) {
        if (!obj.hasOwnProperty(key))
            continue; // Skip inherited properties
        if (key === '_id' && obj[key]) {
            transformed.id = obj[key].toString();
        }
        else if (key === '__v') {
            // Skip version key
            continue;
        }
        else {
            transformed[key] = transformIds(obj[key]);
        }
    }
    return transformed;
}
/**
 * Transform _id to id when converting to JSON
 * This provides a consistent API response format
 * Recursively transforms all nested subdocuments
 */
programSchema.set('toJSON', {
    transform: function (doc, ret) {
        return transformIds(ret);
    },
});
// ============================================================================
// MIDDLEWARE - CASCADE OPERATIONS
// ============================================================================
/**
 * Pre-delete hook to unassign program from all clients
 * When a program is deleted, set programId to null for all users assigned to it
 */
programSchema.pre(['deleteOne', 'findOneAndDelete'], async function (next) {
    try {
        const programId = this.getQuery()._id;
        // Import User model dynamically to avoid circular dependency
        const User = mongoose.model('User');
        // Unassign this program from all clients
        await User.updateMany({ programId: programId }, { $unset: { programId: 1 } });
        next();
    }
    catch (error) {
        next(error);
    }
});
// ============================================================================
// MODEL EXPORT
// ============================================================================
export const Program = mongoose.model('Program', programSchema);
//# sourceMappingURL=Program.js.map