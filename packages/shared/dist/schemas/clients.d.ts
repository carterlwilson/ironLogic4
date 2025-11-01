import { z } from 'zod';
import { BenchmarkType } from '../types/benchmarkTemplates';
/**
 * Schema for ClientBenchmark subdocuments
 */
export declare const ClientBenchmarkSchema: z.ZodObject<{
    templateId: z.ZodString;
    name: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof BenchmarkType>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    weightKg: z.ZodOptional<z.ZodNumber>;
    timeSeconds: z.ZodOptional<z.ZodNumber>;
    reps: z.ZodOptional<z.ZodNumber>;
    otherNotes: z.ZodOptional<z.ZodString>;
    recordedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type: BenchmarkType;
    name: string;
    templateId: string;
    tags: string[];
    recordedAt: Date;
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
}, {
    type: BenchmarkType;
    name: string;
    templateId: string;
    recordedAt: Date;
    reps?: number | undefined;
    notes?: string | undefined;
    tags?: string[] | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
}>;
/**
 * Schema for listing clients with pagination and filtering
 */
export declare const ClientListParamsSchema: z.ZodObject<{
    gymId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    gymId?: string | undefined;
    search?: string | undefined;
}, {
    gymId?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
/**
 * Schema for creating a new client
 */
export declare const CreateClientSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    gymId: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    generatePassword: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    programId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    gymId: string;
    email: string;
    firstName: string;
    lastName: string;
    generatePassword: boolean;
    password?: string | undefined;
    programId?: string | undefined;
}, {
    gymId: string;
    email: string;
    firstName: string;
    lastName: string;
    password?: string | undefined;
    programId?: string | undefined;
    generatePassword?: boolean | undefined;
}>;
/**
 * Schema for updating a client
 */
export declare const UpdateClientSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    currentBenchmarks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        templateId: z.ZodString;
        name: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
        type: z.ZodNativeEnum<typeof BenchmarkType>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        weightKg: z.ZodOptional<z.ZodNumber>;
        timeSeconds: z.ZodOptional<z.ZodNumber>;
        reps: z.ZodOptional<z.ZodNumber>;
        otherNotes: z.ZodOptional<z.ZodString>;
        recordedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type: BenchmarkType;
        name: string;
        templateId: string;
        tags: string[];
        recordedAt: Date;
        reps?: number | undefined;
        notes?: string | undefined;
        weightKg?: number | undefined;
        timeSeconds?: number | undefined;
        otherNotes?: string | undefined;
    }, {
        type: BenchmarkType;
        name: string;
        templateId: string;
        recordedAt: Date;
        reps?: number | undefined;
        notes?: string | undefined;
        tags?: string[] | undefined;
        weightKg?: number | undefined;
        timeSeconds?: number | undefined;
        otherNotes?: string | undefined;
    }>, "many">>;
    historicalBenchmarks: z.ZodOptional<z.ZodArray<z.ZodObject<{
        templateId: z.ZodString;
        name: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
        type: z.ZodNativeEnum<typeof BenchmarkType>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        weightKg: z.ZodOptional<z.ZodNumber>;
        timeSeconds: z.ZodOptional<z.ZodNumber>;
        reps: z.ZodOptional<z.ZodNumber>;
        otherNotes: z.ZodOptional<z.ZodString>;
        recordedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type: BenchmarkType;
        name: string;
        templateId: string;
        tags: string[];
        recordedAt: Date;
        reps?: number | undefined;
        notes?: string | undefined;
        weightKg?: number | undefined;
        timeSeconds?: number | undefined;
        otherNotes?: string | undefined;
    }, {
        type: BenchmarkType;
        name: string;
        templateId: string;
        recordedAt: Date;
        reps?: number | undefined;
        notes?: string | undefined;
        tags?: string[] | undefined;
        weightKg?: number | undefined;
        timeSeconds?: number | undefined;
        otherNotes?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    currentBenchmarks?: {
        type: BenchmarkType;
        name: string;
        templateId: string;
        tags: string[];
        recordedAt: Date;
        reps?: number | undefined;
        notes?: string | undefined;
        weightKg?: number | undefined;
        timeSeconds?: number | undefined;
        otherNotes?: string | undefined;
    }[] | undefined;
    historicalBenchmarks?: {
        type: BenchmarkType;
        name: string;
        templateId: string;
        tags: string[];
        recordedAt: Date;
        reps?: number | undefined;
        notes?: string | undefined;
        weightKg?: number | undefined;
        timeSeconds?: number | undefined;
        otherNotes?: string | undefined;
    }[] | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    currentBenchmarks?: {
        type: BenchmarkType;
        name: string;
        templateId: string;
        recordedAt: Date;
        reps?: number | undefined;
        notes?: string | undefined;
        tags?: string[] | undefined;
        weightKg?: number | undefined;
        timeSeconds?: number | undefined;
        otherNotes?: string | undefined;
    }[] | undefined;
    historicalBenchmarks?: {
        type: BenchmarkType;
        name: string;
        templateId: string;
        recordedAt: Date;
        reps?: number | undefined;
        notes?: string | undefined;
        tags?: string[] | undefined;
        weightKg?: number | undefined;
        timeSeconds?: number | undefined;
        otherNotes?: string | undefined;
    }[] | undefined;
}>;
/**
 * Schema for validating client ID parameter
 */
export declare const ClientIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Schema for creating a benchmark from template (client self-service)
 */
export declare const CreateMyBenchmarkSchema: z.ZodEffects<z.ZodObject<{
    templateId: z.ZodString;
    recordedAt: z.ZodDate;
    notes: z.ZodOptional<z.ZodString>;
    weightKg: z.ZodOptional<z.ZodNumber>;
    timeSeconds: z.ZodOptional<z.ZodNumber>;
    reps: z.ZodOptional<z.ZodNumber>;
    otherNotes: z.ZodOptional<z.ZodString>;
    oldBenchmarkId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    templateId: string;
    recordedAt: Date;
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
    oldBenchmarkId?: string | undefined;
}, {
    templateId: string;
    recordedAt: Date;
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
    oldBenchmarkId?: string | undefined;
}>, {
    templateId: string;
    recordedAt: Date;
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
    oldBenchmarkId?: string | undefined;
}, {
    templateId: string;
    recordedAt: Date;
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
    oldBenchmarkId?: string | undefined;
}>;
/**
 * Schema for updating a benchmark (client self-service)
 */
export declare const UpdateMyBenchmarkSchema: z.ZodEffects<z.ZodObject<{
    recordedAt: z.ZodOptional<z.ZodDate>;
    notes: z.ZodOptional<z.ZodString>;
    weightKg: z.ZodOptional<z.ZodNumber>;
    timeSeconds: z.ZodOptional<z.ZodNumber>;
    reps: z.ZodOptional<z.ZodNumber>;
    otherNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
    recordedAt?: Date | undefined;
}, {
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
    recordedAt?: Date | undefined;
}>, {
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
    recordedAt?: Date | undefined;
}, {
    reps?: number | undefined;
    notes?: string | undefined;
    weightKg?: number | undefined;
    timeSeconds?: number | undefined;
    otherNotes?: string | undefined;
    recordedAt?: Date | undefined;
}>;
export type ClientListParamsInput = z.infer<typeof ClientListParamsSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ClientIdInput = z.infer<typeof ClientIdSchema>;
export type CreateMyBenchmarkInput = z.infer<typeof CreateMyBenchmarkSchema>;
export type UpdateMyBenchmarkInput = z.infer<typeof UpdateMyBenchmarkSchema>;
//# sourceMappingURL=clients.d.ts.map