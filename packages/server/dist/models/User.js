import mongoose, { Schema } from 'mongoose';
import { UserType } from '@ironlogic4/shared/types/users';
import { hashPassword, comparePassword } from '../utils/auth.js';
import { clientBenchmarkSchema } from './ClientBenchmark.js';
const userSchema = new Schema({
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
        enum: Object.values(UserType),
        required: true,
        default: UserType.CLIENT,
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
        type: [clientBenchmarkSchema],
        default: [],
        required: false,
    },
    historicalBenchmarks: {
        type: [clientBenchmarkSchema],
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
        this.password = await hashPassword(this.password);
        next();
    }
    catch (error) {
        next(error);
    }
});
// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return comparePassword(candidatePassword, this.password);
};
// Create unique index on email
userSchema.index({ email: 1 }, { unique: true });
// Compound index for gym-scoped queries
userSchema.index({ gymId: 1, userType: 1 });
// Index for sorting by creation date
userSchema.index({ createdAt: -1 });
// Index for program queries
userSchema.index({ programId: 1 });
export const User = mongoose.model('User', userSchema);
//# sourceMappingURL=User.js.map