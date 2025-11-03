import { z } from 'zod';
import { DistanceUnit } from '../types/programs.js';
import { ActivityType } from '../types/activityTemplates.js';

// MongoDB ObjectId validation
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Enums
const ActivityTypeSchema = z.nativeEnum(ActivityType);
export const DistanceUnitSchema = z.nativeEnum(DistanceUnit);

// Activity schema
export const ActivitySchema = z.object({
  activityTemplateId: objectId,
  type: ActivityTypeSchema,
  order: z.number().int().min(0),
  sets: z.number().int().min(1).optional(),
  reps: z.number().int().min(1).optional(),
  percentageOfMax: z.number().min(0).max(200).optional(),
  time: z.number().int().min(0).optional(), // in minutes
  distance: z.number().min(0).optional(),
  distanceUnit: DistanceUnitSchema.optional()
});

// Day schema
export const DaySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  order: z.number().int().min(0),
  activities: z.array(ActivitySchema).default([])
});

// ActivityGroupTarget schema
export const ActivityGroupTargetSchema = z.object({
  activityGroupId: objectId,
  targetPercentage: z.number().min(0).max(100)
});

// Week schema
export const WeekSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  order: z.number().int().min(0),
  activityGroupTargets: z.array(ActivityGroupTargetSchema).default([]),
  days: z.array(DaySchema).default([])
});

// Block schema
export const BlockSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  order: z.number().int().min(0),
  activityGroupTargets: z.array(ActivityGroupTargetSchema).default([]),
  weeks: z.array(WeekSchema).default([])
});

// Program creation schema
export const CreateProgramSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
  description: z.string().max(500, 'Description must be less than 500 characters').trim().optional(),
  gymId: objectId
});

// Program update schema
export const UpdateProgramSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').trim().optional(),
  isActive: z.boolean().optional(),
  blocks: z.array(BlockSchema).optional()
});

// Program list params schema
export const ProgramListParamsSchema = z.object({
  gymId: objectId.optional(),
  isActive: z.coerce.boolean().optional(),
  createdBy: objectId.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
});

// Program ID schema
export const ProgramIdSchema = z.object({
  id: objectId
});

// Block management schemas
export const CreateBlockSchema = BlockSchema;
export const UpdateBlockSchema = BlockSchema.partial();

// Week management schemas
export const CreateWeekSchema = WeekSchema;
export const UpdateWeekSchema = WeekSchema.partial();

// Day management schemas
export const CreateDaySchema = DaySchema;
export const UpdateDaySchema = DaySchema.partial();

// Activity management schemas
export const CreateActivitySchema = ActivitySchema;
export const UpdateActivitySchema = ActivitySchema.partial();

// Program progress schemas
export const JumpToWeekSchema = z.object({
  blockIndex: z.number().int().min(0, 'Block index must be at least 0'),
  weekIndex: z.number().int().min(0, 'Week index must be at least 0')
});

// Type exports
export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;
export type UpdateProgramInput = z.infer<typeof UpdateProgramSchema>;
export type ProgramListParamsInput = z.infer<typeof ProgramListParamsSchema>;
export type ProgramIdInput = z.infer<typeof ProgramIdSchema>;
export type CreateBlockInput = z.infer<typeof CreateBlockSchema>;
export type UpdateBlockInput = z.infer<typeof UpdateBlockSchema>;
export type CreateWeekInput = z.infer<typeof CreateWeekSchema>;
export type UpdateWeekInput = z.infer<typeof UpdateWeekSchema>;
export type CreateDayInput = z.infer<typeof CreateDaySchema>;
export type UpdateDayInput = z.infer<typeof UpdateDaySchema>;
export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;
export type UpdateActivityInput = z.infer<typeof UpdateActivitySchema>;
export type JumpToWeekInput = z.infer<typeof JumpToWeekSchema>;