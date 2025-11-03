import { z } from 'zod';
import { BenchmarkType } from '../types/benchmarkTemplates.js';
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
/**
 * Schema for listing benchmark templates with pagination and filtering
 */
export const BenchmarkTemplateListParamsSchema = z.object({
    gymId: objectId.optional(),
    search: z.string().optional(),
    type: z.nativeEnum(BenchmarkType).optional(),
    tags: z.string().optional(), // Comma-separated tags
    page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});
/**
 * Schema for creating a new benchmark template
 */
export const CreateBenchmarkTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim(),
    notes: z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
    type: z.nativeEnum(BenchmarkType, { errorMap: () => ({ message: 'Invalid benchmark type' }) }),
    tags: z.array(z.string()).default([]),
});
/**
 * Schema for updating a benchmark template
 */
export const UpdateBenchmarkTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim().optional(),
    notes: z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
    type: z.nativeEnum(BenchmarkType, { errorMap: () => ({ message: 'Invalid benchmark type' }) }).optional(),
    tags: z.array(z.string()).optional(),
});
/**
 * Schema for validating benchmark template ID parameter
 */
export const BenchmarkTemplateIdSchema = z.object({
    id: objectId,
});
//# sourceMappingURL=benchmarkTemplates.js.map