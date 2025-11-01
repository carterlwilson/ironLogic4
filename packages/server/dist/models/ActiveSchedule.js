"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveSchedule = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const shared_1 = require("@ironlogic4/shared");
// TimeSlot subdocument schema (same as in ScheduleTemplate)
const timeSlotSchema = new mongoose_1.Schema({
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
const scheduleDaySchema = new mongoose_1.Schema({
    dayOfWeek: {
        type: Number,
        required: true,
        enum: Object.values(shared_1.DayOfWeek).filter(v => typeof v === 'number'),
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
const activeScheduleSchema = new mongoose_1.Schema({
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
exports.ActiveSchedule = mongoose_1.default.model('ActiveSchedule', activeScheduleSchema);
//# sourceMappingURL=ActiveSchedule.js.map