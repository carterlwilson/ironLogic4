import mongoose, { Schema } from 'mongoose';
const gymSchema = new Schema({
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
        const User = mongoose.model('User');
        const userExists = await User.findById(this.ownerId);
        if (!userExists) {
            const error = new Error('Owner ID must reference an existing user');
            return next(error);
        }
    }
    next();
});
export const Gym = mongoose.model('Gym', gymSchema);
//# sourceMappingURL=Gym.js.map