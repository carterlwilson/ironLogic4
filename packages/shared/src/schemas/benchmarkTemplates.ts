import { z } from 'zod';
import { BenchmarkType } from '../types/benchmarkTemplates.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

/**
 * Schema for TemplateRepMax subdocument
 */
const templateRepMaxSchema = z.object({
  reps: z.number().int().min(1).max(50),
  name: z.string().min(1).max(20)
});

/**
 * Schema for TemplateTimeSubMax subdocument
 */
const templateTimeSubMaxSchema = z.object({
  name: z.string().min(1).max(30)  // e.g., "1 min", "3 min", "5 min"
});

/**
 * Schema for TemplateDistanceSubMax subdocument
 */
const templateDistanceSubMaxSchema = z.object({
  name: z.string().min(1).max(30)  // e.g., "100m", "500m", "1 mile"
});

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
 * Schema for listing all benchmark templates without pagination (for dropdowns)
 */
export const BenchmarkTemplateListAllParamsSchema = z.object({
  gymId: objectId.optional(),
  search: z.string().optional(),
  type: z.nativeEnum(BenchmarkType).optional(),
  tags: z.string().optional(), // Comma-separated tags
});

/**
 * Schema for creating a new benchmark template
 */
export const CreateBenchmarkTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
  type: z.nativeEnum(BenchmarkType, { errorMap: () => ({ message: 'Invalid benchmark type' }) }),
  tags: z.array(z.string()).default([]),
  templateRepMaxes: z.array(templateRepMaxSchema).optional(),
  templateTimeSubMaxes: z.array(templateTimeSubMaxSchema).optional(),
  templateDistanceSubMaxes: z.array(templateDistanceSubMaxSchema).optional(),
  distanceUnit: z.enum(['meters', 'kilometers']).optional()
}).refine(
  (data) => {
    // WEIGHT type requires templateRepMaxes
    if (data.type === BenchmarkType.WEIGHT) {
      return data.templateRepMaxes && data.templateRepMaxes.length > 0;
    }
    // DISTANCE type requires templateTimeSubMaxes and distanceUnit
    if (data.type === BenchmarkType.DISTANCE) {
      return data.templateTimeSubMaxes && data.templateTimeSubMaxes.length > 0 &&
             data.distanceUnit !== undefined;
    }
    // TIME type requires templateDistanceSubMaxes and distanceUnit
    if (data.type === BenchmarkType.TIME) {
      return data.templateDistanceSubMaxes && data.templateDistanceSubMaxes.length > 0 &&
             data.distanceUnit !== undefined;
    }
    return true;
  },
  {
    message: 'WEIGHT requires templateRepMaxes, DISTANCE requires templateTimeSubMaxes and distanceUnit, TIME requires templateDistanceSubMaxes and distanceUnit'
  }
);

/**
 * Schema for updating a benchmark template
 */
export const UpdateBenchmarkTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim().optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
  type: z.nativeEnum(BenchmarkType, { errorMap: () => ({ message: 'Invalid benchmark type' }) }).optional(),
  tags: z.array(z.string()).optional(),
  templateRepMaxes: z.array(templateRepMaxSchema).optional(),
  templateTimeSubMaxes: z.array(templateTimeSubMaxSchema).optional(),
  templateDistanceSubMaxes: z.array(templateDistanceSubMaxSchema).optional(),
  distanceUnit: z.enum(['meters', 'kilometers']).optional()
});

/**
 * Schema for validating benchmark template ID parameter
 */
export const BenchmarkTemplateIdSchema = z.object({
  id: objectId,
});

export type BenchmarkTemplateListParamsInput = z.infer<typeof BenchmarkTemplateListParamsSchema>;
export type BenchmarkTemplateListAllParamsInput = z.infer<typeof BenchmarkTemplateListAllParamsSchema>;
export type CreateBenchmarkTemplateInput = z.infer<typeof CreateBenchmarkTemplateSchema>;
export type UpdateBenchmarkTemplateInput = z.infer<typeof UpdateBenchmarkTemplateSchema>;
export type BenchmarkTemplateIdInput = z.infer<typeof BenchmarkTemplateIdSchema>;