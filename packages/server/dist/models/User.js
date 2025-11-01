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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const users_1 = require("@ironlogic4/shared/types/users");
const auth_1 = require("../utils/auth");
const ClientBenchmark_1 = require("./ClientBenchmark");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    userType: {
        type: String,
        enum: Object.values(users_1.UserType),
        required: true,
        default: users_1.UserType.CLIENT,
    },
    password: {
        type: String,
        required: true,
        select: false, // Don't include password in queries by default
    },
    gymId: {
        type: String,
        required: false,
    },
    programId: {
        type: String,
        ref: 'Program',
        required: false,
    },
    currentBenchmarks: {
        type: [ClientBenchmark_1.clientBenchmarkSchema],
        default: [],
        required: false,
    },
    historicalBenchmarks: {
        type: [ClientBenchmark_1.clientBenchmarkSchema],
        default: [],
        required: false,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            if (ret.password)
                delete ret.password; // Never include password in JSON responses
            // Transform _id to id for benchmark subdocuments
            if (ret.currentBenchmarks && Array.isArray(ret.currentBenchmarks)) {
                ret.currentBenchmarks = ret.currentBenchmarks.map((benchmark) => {
                    if (benchmark._id) {
                        benchmark.id = benchmark._id;
                        delete benchmark._id;
                    }
                    return benchmark;
                });
            }
            if (ret.historicalBenchmarks && Array.isArray(ret.historicalBenchmarks)) {
                ret.historicalBenchmarks = ret.historicalBenchmarks.map((benchmark) => {
                    if (benchmark._id) {
                        benchmark.id = benchmark._id;
                        delete benchmark._id;
                    }
                    return benchmark;
                });
            }
            return ret;
        },
    },
});
// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password'))
        return next();
    try {
        this.password = await (0, auth_1.hashPassword)(this.password);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return (0, auth_1.comparePassword)(candidatePassword, this.password);
};
// Create unique index on email
userSchema.index({ email: 1 }, { unique: true });
// Compound index for gym-scoped queries
userSchema.index({ gymId: 1, userType: 1 });
// Index for sorting by creation date
userSchema.index({ createdAt: -1 });
// Index for program queries
userSchema.index({ programId: 1 });
exports.User = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=User.js.map