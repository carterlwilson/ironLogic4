"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMyBenchmarkSchema = exports.CreateMyBenchmarkSchema = exports.ClientIdSchema = exports.UpdateClientSchema = exports.CreateClientSchema = exports.ClientListParamsSchema = exports.ClientBenchmarkSchema = void 0;
const zod_1 = require("zod");
const benchmarkTemplates_1 = require("../types/benchmarkTemplates");
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
/**
 * Schema for ClientBenchmark subdocuments
 */
exports.ClientBenchmarkSchema = zod_1.z.object({
    templateId: zod_1.z.string().min(1, 'Template ID is required'),
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
    notes: zod_1.z.string().max(500, 'Notes must be 500 characters or less').optional(),
    type: zod_1.z.nativeEnum(benchmarkTemplates_1.BenchmarkType),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
    weightKg: zod_1.z.number().min(0, 'Weight must be non-negative').optional(),
    timeSeconds: zod_1.z.number().min(0, 'Time must be non-negative').optional(),
    reps: zod_1.z.number().min(0, 'Reps must be non-negative').optional(),
    otherNotes: zod_1.z.string().max(1000, 'Other notes must be 1000 characters or less').optional(),
    recordedAt: zod_1.z.coerce.date(),
});
/**
 * Schema for listing clients with pagination and filtering
 */
exports.ClientListParamsSchema = zod_1.z.object({
    gymId: objectId.optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});
/**
 * Schema for creating a new client
 */
exports.CreateClientSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').toLowerCase().trim(),
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').trim(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').trim(),
    gymId: objectId,
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').optional(),
    generatePassword: zod_1.z.boolean().optional().default(true),
    programId: objectId.optional(),
});
/**
 * Schema for updating a client
 */
exports.UpdateClientSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').toLowerCase().trim().optional(),
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').trim().optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').trim().optional(),
    currentBenchmarks: zod_1.z.array(exports.ClientBenchmarkSchema).optional(),
    historicalBenchmarks: zod_1.z.array(exports.ClientBenchmarkSchema).optional(),
});
/**
 * Schema for validating client ID parameter
 */
exports.ClientIdSchema = zod_1.z.object({
    id: objectId,
});
/**
 * Schema for creating a benchmark from template (client self-service)
 */
exports.CreateMyBenchmarkSchema = zod_1.z.object({
    templateId: zod_1.z.string().min(1, 'Template ID is required'),
    recordedAt: zod_1.z.coerce.date(),
    notes: zod_1.z.string().max(1000).optional(),
    weightKg: zod_1.z.number().positive().max(1000).optional(),
    timeSeconds: zod_1.z.number().positive().max(86400).optional(),
    reps: zod_1.z.number().int().positive().max(10000).optional(),
    otherNotes: zod_1.z.string().min(1).max(500).optional(),
    oldBenchmarkId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format').optional(),
}).refine((data) => {
    // Exactly one measurement field should be provided
    const fields = [data.weightKg, data.timeSeconds, data.reps, data.otherNotes];
    const nonNullFields = fields.filter(f => f !== undefined && f !== null);
    return nonNullFields.length === 1;
}, { message: 'Exactly one measurement type must be provided' });
/**
 * Schema for updating a benchmark (client self-service)
 */
exports.UpdateMyBenchmarkSchema = zod_1.z.object({
    recordedAt: zod_1.z.coerce.date().optional(),
    notes: zod_1.z.string().max(1000).optional(),
    weightKg: zod_1.z.number().positive().max(1000).optional(),
    timeSeconds: zod_1.z.number().positive().max(86400).optional(),
    reps: zod_1.z.number().int().positive().max(10000).optional(),
    otherNotes: zod_1.z.string().min(1).max(500).optional(),
}).refine((data) => {
    // At least one field must be provided
    return data.recordedAt || data.notes ||
        data.weightKg !== undefined || data.timeSeconds !== undefined ||
        data.reps !== undefined || data.otherNotes !== undefined;
}, { message: 'At least one field must be updated' });
//# sourceMappingURL=clients.js.map