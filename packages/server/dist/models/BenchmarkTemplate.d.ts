import mongoose, { Document } from 'mongoose';
import { BenchmarkTemplate as IBenchmarkTemplate } from '@ironlogic4/shared';
export interface BenchmarkTemplateDocument extends Omit<IBenchmarkTemplate, 'id'>, Document {
}
export declare const BenchmarkTemplate: mongoose.Model<BenchmarkTemplateDocument, {}, {}, {}, mongoose.Document<unknown, {}, BenchmarkTemplateDocument, {}, {}> & BenchmarkTemplateDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=BenchmarkTemplate.d.ts.map