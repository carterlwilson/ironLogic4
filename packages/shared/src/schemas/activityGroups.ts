import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const CreateActivityGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').trim().optional(),
  gymId: objectId
});

export const UpdateActivityGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').trim().optional()
});

export const ActivityGroupListParamsSchema = z.object({
  gymId: objectId.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
});

export const ActivityGroupIdSchema = z.object({
  id: objectId
});

export type CreateActivityGroupInput = z.infer<typeof CreateActivityGroupSchema>;
export type UpdateActivityGroupInput = z.infer<typeof UpdateActivityGroupSchema>;
export type ActivityGroupListParamsInput = z.infer<typeof ActivityGroupListParamsSchema>;
export type ActivityGroupIdInput = z.infer<typeof ActivityGroupIdSchema>;