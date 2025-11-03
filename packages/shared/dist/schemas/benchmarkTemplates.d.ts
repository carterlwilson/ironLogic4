import { z } from 'zod';
import { BenchmarkType } from '../types/benchmarkTemplates.js';
/**
 * Schema for listing benchmark templates with pagination and filtering
 */
export declare const BenchmarkTemplateListParamsSchema: z.ZodObject<{
    gymId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof BenchmarkType>>;
    tags: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    gymId?: string | undefined;
    search?: string | undefined;
    type?: BenchmarkType | undefined;
    tags?: string | undefined;
}, {
    gymId?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    type?: BenchmarkType | undefined;
    tags?: string | undefined;
}>;
/**
 * Schema for creating a new benchmark template
 */
export declare const CreateBenchmarkTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof BenchmarkType>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: BenchmarkType;
    name: string;
    tags: string[];
    notes?: string | undefined;
}, {
    type: BenchmarkType;
    name: string;
    notes?: string | undefined;
    tags?: string[] | undefined;
}>;
/**
 * Schema for updating a benchmark template
 */
export declare const UpdateBenchmarkTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof BenchmarkType>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: BenchmarkType | undefined;
    name?: string | undefined;
    notes?: string | undefined;
    tags?: string[] | undefined;
}, {
    type?: BenchmarkType | undefined;
    name?: string | undefined;
    notes?: string | undefined;
    tags?: string[] | undefined;
}>;
/**
 * Schema for validating benchmark template ID parameter
 */
export declare const BenchmarkTemplateIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type BenchmarkTemplateListParamsInput = z.infer<typeof BenchmarkTemplateListParamsSchema>;
export type CreateBenchmarkTemplateInput = z.infer<typeof CreateBenchmarkTemplateSchema>;
export type UpdateBenchmarkTemplateInput = z.infer<typeof UpdateBenchmarkTemplateSchema>;
export type BenchmarkTemplateIdInput = z.infer<typeof BenchmarkTemplateIdSchema>;
//# sourceMappingURL=benchmarkTemplates.d.ts.map