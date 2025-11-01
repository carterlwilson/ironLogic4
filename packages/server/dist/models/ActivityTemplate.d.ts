import mongoose, { Document } from 'mongoose';
import { ActivityTemplate as IActivityTemplate } from '@ironlogic4/shared';
export interface ActivityTemplateDocument extends Omit<IActivityTemplate, 'id'>, Document {
}
export declare const ActivityTemplate: mongoose.Model<ActivityTemplateDocument, {}, {}, {}, mongoose.Document<unknown, {}, ActivityTemplateDocument, {}, {}> & ActivityTemplateDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ActivityTemplate.d.ts.map