import { z } from 'zod';
import { BenchmarkType } from '../types/benchmarkTemplates.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Helper for nullable ObjectId fields that may receive empty strings from forms
const nullableObjectId = z.preprocess(
  (val) => val === '' ? undefined : val,
  objectId.optional()
);

/**
 * Schema for ClientBenchmark subdocuments
 */
export const ClientBenchmarkSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  type: z.nativeEnum(BenchmarkType),
  tags: z.array(z.string()).default([]),
  weightKg: z.number().min(0, 'Weight must be non-negative').optional(),
  timeSeconds: z.number().min(0, 'Time must be non-negative').optional(),
  reps: z.number().min(0, 'Reps must be non-negative').optional(),
  otherNotes: z.string().max(1000, 'Other notes must be 1000 characters or less').optional(),
  recordedAt: z.coerce.date(),
});

/**
 * Schema for listing clients with pagination and filtering
 */
export const ClientListParamsSchema = z.object({
  gymId: nullableObjectId,
  search: z.string().optional(),
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});

/**
 * Schema for creating a new client
 */
export const CreateClientSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').trim(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').trim(),
  gymId: objectId,
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  generatePassword: z.boolean().optional().default(true),
  programId: nullableObjectId,
});

/**
 * Schema for updating a client
 */
export const UpdateClientSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').trim().optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').trim().optional(),
  currentBenchmarks: z.array(ClientBenchmarkSchema).optional(),
  historicalBenchmarks: z.array(ClientBenchmarkSchema).optional(),
});

/**
 * Schema for validating client ID parameter
 */
export const ClientIdSchema = z.object({
  id: objectId,
});

/**
 * Schema for creating a benchmark from template (client self-service)
 */
export const CreateMyBenchmarkSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  recordedAt: z.coerce.date(),
  notes: z.string().max(1000).optional(),
  weightKg: z.number().positive().max(1000).optional(),
  timeSeconds: z.number().positive().max(86400).optional(),
  reps: z.number().int().positive().max(10000).optional(),
  otherNotes: z.string().min(1).max(500).optional(),
  oldBenchmarkId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format').optional(),
}).refine(
  (data) => {
    // Exactly one measurement field should be provided
    const fields = [data.weightKg, data.timeSeconds, data.reps, data.otherNotes];
    const nonNullFields = fields.filter(f => f !== undefined && f !== null);
    return nonNullFields.length === 1;
  },
  { message: 'Exactly one measurement type must be provided' }
);

/**
 * Schema for updating a benchmark (client self-service)
 */
export const UpdateMyBenchmarkSchema = z.object({
  recordedAt: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  weightKg: z.number().positive().max(1000).optional(),
  timeSeconds: z.number().positive().max(86400).optional(),
  reps: z.number().int().positive().max(10000).optional(),
  otherNotes: z.string().min(1).max(500).optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    return data.recordedAt || data.notes ||
           data.weightKg !== undefined || data.timeSeconds !== undefined ||
           data.reps !== undefined || data.otherNotes !== undefined;
  },
  { message: 'At least one field must be updated' }
);

export type ClientListParamsInput = z.infer<typeof ClientListParamsSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ClientIdInput = z.infer<typeof ClientIdSchema>;
export type CreateMyBenchmarkInput = z.infer<typeof CreateMyBenchmarkSchema>;
export type UpdateMyBenchmarkInput = z.infer<typeof UpdateMyBenchmarkSchema>;