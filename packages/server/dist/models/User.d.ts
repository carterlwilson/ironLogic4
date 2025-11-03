import mongoose, { Document } from 'mongoose';
import { User as IUser } from '@ironlogic4/shared/types/users';
import { ClientBenchmarkDocument } from './ClientBenchmark.js';
export interface UserDocument extends Omit<IUser, 'id' | 'currentBenchmarks' | 'historicalBenchmarks'>, Document {
    currentBenchmarks?: ClientBenchmarkDocument[];
    historicalBenchmarks?: ClientBenchmarkDocument[];
    comparePassword(candidatePassword: string): Promise<boolean>;
}
export declare const User: mongoose.Model<UserDocument, {}, {}, {}, mongoose.Document<unknown, {}, UserDocument, {}, {}> & UserDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=User.d.ts.map