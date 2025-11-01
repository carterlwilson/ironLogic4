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
exports.Gym = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const gymSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
});
// Create indexes for better query performance
gymSchema.index({ name: 1 });
gymSchema.index({ ownerId: 1 });
gymSchema.index({ createdAt: -1 });
// Validate that ownerId references an existing user
gymSchema.pre('save', async function (next) {
    if (this.isModified('ownerId')) {
        const User = mongoose_1.default.model('User');
        const userExists = await User.findById(this.ownerId);
        if (!userExists) {
            const error = new Error('Owner ID must reference an existing user');
            return next(error);
        }
    }
    next();
});
exports.Gym = mongoose_1.default.model('Gym', gymSchema);
//# sourceMappingURL=Gym.js.map