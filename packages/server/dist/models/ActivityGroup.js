import mongoose, { Schema } from 'mongoose';
const activityGroupSchema = new Schema({
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
activityGroupSchema.index({ gymId: 1 });
activityGroupSchema.index({ gymId: 1, name: 1 });
activityGroupSchema.index({ name: 'text', notes: 'text' });
activityGroupSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
export const ActivityGroup = mongoose.model('ActivityGroup', activityGroupSchema);
//# sourceMappingURL=ActivityGroup.js.map