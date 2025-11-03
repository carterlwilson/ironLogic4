import { z } from 'zod';
import { ActivityType } from '../types/activityTemplates.js';
// MongoDB ObjectId validation
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
export const ActivityTypeSchema = z.nativeEnum(ActivityType);
export const CreateActivityTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
    notes: z.string().max(500, 'Notes must be less than 500 characters').trim().optional(),
    groupId: z.string().max(50, 'Group ID must be less than 50 characters').trim().optional(),
    type: ActivityTypeSchema,
    benchmarkTemplateId: objectId.optional(),
    gymId: objectId
});
export const UpdateActivityTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim().optional(),
    notes: z.string().max(500, 'Notes must be less than 500 characters').trim().optional(),
    groupId: z.string().max(50, 'Group ID must be less than 50 characters').trim().optional(),
    type: ActivityTypeSchema.optional(),
    benchmarkTemplateId: objectId.optional()
});
export const ActivityTemplateListParamsSchema = z.object({
    gymId: objectId.optional(),
    type: ActivityTypeSchema.optional(),
    groupId: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
});
export const ActivityTemplateIdSchema = z.object({
    id: objectId
});
//# sourceMappingURL=activityTemplates.js.map