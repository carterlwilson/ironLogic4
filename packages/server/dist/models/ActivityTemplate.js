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
exports.ActivityTemplate = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const shared_1 = require("@ironlogic4/shared");
const activityTemplateSchema = new mongoose_1.Schema({
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
    groupId: {
        type: String,
        trim: true,
        maxlength: 50,
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(shared_1.ActivityType),
    },
    benchmarkTemplateId: {
        type: String,
        ref: 'BenchmarkTemplate',
        required: false,
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
activityTemplateSchema.index({ gymId: 1 });
activityTemplateSchema.index({ gymId: 1, type: 1 });
activityTemplateSchema.index({ gymId: 1, groupId: 1 });
activityTemplateSchema.index({ name: 'text', notes: 'text' });
// Transform the _id to id when converting to JSON
activityTemplateSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
exports.ActivityTemplate = mongoose_1.default.model('ActivityTemplate', activityTemplateSchema);
//# sourceMappingURL=ActivityTemplate.js.map