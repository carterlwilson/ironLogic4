"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityTemplateIdSchema = exports.ActivityTemplateListParamsSchema = exports.UpdateActivityTemplateSchema = exports.CreateActivityTemplateSchema = exports.ActivityTypeSchema = void 0;
const zod_1 = require("zod");
const activityTemplates_1 = require("../types/activityTemplates");
// MongoDB ObjectId validation
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
exports.ActivityTypeSchema = zod_1.z.nativeEnum(activityTemplates_1.ActivityType);
exports.CreateActivityTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
    notes: zod_1.z.string().max(500, 'Notes must be less than 500 characters').trim().optional(),
    groupId: zod_1.z.string().max(50, 'Group ID must be less than 50 characters').trim().optional(),
    type: exports.ActivityTypeSchema,
    benchmarkTemplateId: objectId.optional(),
    gymId: objectId
});
exports.UpdateActivityTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim().optional(),
    notes: zod_1.z.string().max(500, 'Notes must be less than 500 characters').trim().optional(),
    groupId: zod_1.z.string().max(50, 'Group ID must be less than 50 characters').trim().optional(),
    type: exports.ActivityTypeSchema.optional(),
    benchmarkTemplateId: objectId.optional()
});
exports.ActivityTemplateListParamsSchema = zod_1.z.object({
    gymId: objectId.optional(),
    type: exports.ActivityTypeSchema.optional(),
    groupId: zod_1.z.string().optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
});
exports.ActivityTemplateIdSchema = zod_1.z.object({
    id: objectId
});
//# sourceMappingURL=activityTemplates.js.map