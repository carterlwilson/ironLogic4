import mongoose, { Document } from 'mongoose';
import { ActivityGroup as IActivityGroup } from '@ironlogic4/shared';
export interface ActivityGroupDocument extends Omit<IActivityGroup, 'id'>, Document {
}
export declare const ActivityGroup: mongoose.Model<ActivityGroupDocument, {}, {}, {}, mongoose.Document<unknown, {}, ActivityGroupDocument, {}, {}> & ActivityGroupDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ActivityGroup.d.ts.map