import mongoose, { Schema } from 'mongoose';
import { DayOfWeek } from '@ironlogic4/shared';
// TimeSlot subdocument schema (same as in ScheduleTemplate)
const timeSlotSchema = new Schema({
    startTime: {
        type: String,
        required: true,
        match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
        type: String,
        required: true,
        match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
    },
    assignedClients: {
        type: [String],
        ref: 'User',
        default: [],
    },
}, {
    _id: true, // Generate _id for each timeslot
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        },
    },
});
// ScheduleDay subdocument schema (same as in ScheduleTemplate)
const scheduleDaySchema = new Schema({
    dayOfWeek: {
        type: Number,
        required: true,
        enum: Object.values(DayOfWeek).filter(v => typeof v === 'number'),
    },
    timeSlots: {
        type: [timeSlotSchema],
        required: true,
        default: [],
    },
}, {
    _id: false, // Don't generate _id for schedule days
});
// Main ActiveSchedule schema
const activeScheduleSchema = new Schema({
    gymId: {
        type: String,
        ref: 'Gym',
        required: true,
    },
    templateId: {
        type: String,
        ref: 'ScheduleTemplate',
        required: true,
        unique: true, // Ensures 1:1 relationship - only one active schedule per template
    },
    coachIds: {
        type: [String],
        ref: 'User',
        required: true,
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one coach is required',
        },
    },
    days: {
        type: [scheduleDaySchema],
        required: true,
        validate: {
            validator: function (v) {
                return v && v.length > 0;
            },
            message: 'At least one day is required',
        },
    },
    lastResetAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
// Indexes for efficient queries
activeScheduleSchema.index({ gymId: 1 });
activeScheduleSchema.index({ coachIds: 1 });
activeScheduleSchema.index({ templateId: 1 }, { unique: true }); // Enforce 1:1 relationship
activeScheduleSchema.index({ 'days.timeSlots.assignedClients': 1 }); // For client schedule lookups
// Virtual populate for coach details (optional, for future use)
activeScheduleSchema.virtual('coaches', {
    ref: 'User',
    localField: 'coachIds',
    foreignField: '_id',
});
export const ActiveSchedule = mongoose.model('ActiveSchedule', activeScheduleSchema);
//# sourceMappingURL=ActiveSchedule.js.map