import mongoose, { Document } from 'mongoose';
import { Gym as IGym } from '@ironlogic4/shared/types/gyms';
export interface GymDocument extends Omit<IGym, 'id'>, Document {
}
export declare const Gym: mongoose.Model<GymDocument, {}, {}, {}, mongoose.Document<unknown, {}, GymDocument, {}, {}> & GymDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Gym.d.ts.map