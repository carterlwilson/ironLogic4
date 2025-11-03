"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BenchmarkTemplateIdSchema = exports.UpdateBenchmarkTemplateSchema = exports.CreateBenchmarkTemplateSchema = exports.BenchmarkTemplateListParamsSchema = void 0;
const zod_1 = require("zod");
const benchmarkTemplates_1 = require("../types/benchmarkTemplates");
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
/**
 * Schema for listing benchmark templates with pagination and filtering
 */
exports.BenchmarkTemplateListParamsSchema = zod_1.z.object({
    gymId: objectId.optional(),
    search: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(benchmarkTemplates_1.BenchmarkType).optional(),
    tags: zod_1.z.string().optional(), // Comma-separated tags
    page: zod_1.z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});
/**
 * Schema for creating a new benchmark template
 */
exports.CreateBenchmarkTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim(),
    notes: zod_1.z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
    type: zod_1.z.nativeEnum(benchmarkTemplates_1.BenchmarkType, { errorMap: () => ({ message: 'Invalid benchmark type' }) }),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
/**
 * Schema for updating a benchmark template
 */
exports.UpdateBenchmarkTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim().optional(),
    notes: zod_1.z.string().max(500, 'Notes must be 500 characters or less').trim().optional(),
    type: zod_1.z.nativeEnum(benchmarkTemplates_1.BenchmarkType, { errorMap: () => ({ message: 'Invalid benchmark type' }) }).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
});
/**
 * Schema for validating benchmark template ID parameter
 */
exports.BenchmarkTemplateIdSchema = zod_1.z.object({
    id: objectId,
});
//# sourceMappingURL=benchmarkTemplates.js.map