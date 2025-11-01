import { Schema } from 'mongoose';
import { ClientBenchmark as IClientBenchmark } from '@ironlogic4/shared';
export interface ClientBenchmarkDocument extends Omit<IClientBenchmark, 'id'> {
    _id: string;
}
export declare const clientBenchmarkSchema: Schema<ClientBenchmarkDocument, import("mongoose").Model<ClientBenchmarkDocument, any, any, any, import("mongoose").Document<unknown, any, ClientBenchmarkDocument, any, {}> & ClientBenchmarkDocument & Required<{
    _id: string;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ClientBenchmarkDocument, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ClientBenchmarkDocument>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ClientBenchmarkDocument> & Required<{
    _id: string;
}> & {
    __v: number;
}>;
//# sourceMappingURL=ClientBenchmark.d.ts.map