"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JumpToWeekSchema = exports.UpdateActivitySchema = exports.CreateActivitySchema = exports.UpdateDaySchema = exports.CreateDaySchema = exports.UpdateWeekSchema = exports.CreateWeekSchema = exports.UpdateBlockSchema = exports.CreateBlockSchema = exports.ProgramIdSchema = exports.ProgramListParamsSchema = exports.UpdateProgramSchema = exports.CreateProgramSchema = exports.BlockSchema = exports.WeekSchema = exports.ActivityGroupTargetSchema = exports.DaySchema = exports.ActivitySchema = exports.DistanceUnitSchema = void 0;
const zod_1 = require("zod");
const programs_1 = require("../types/programs");
const activityTemplates_1 = require("../types/activityTemplates");
// MongoDB ObjectId validation
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
// Enums
const ActivityTypeSchema = zod_1.z.nativeEnum(activityTemplates_1.ActivityType);
exports.DistanceUnitSchema = zod_1.z.nativeEnum(programs_1.DistanceUnit);
// Activity schema
exports.ActivitySchema = zod_1.z.object({
    activityTemplateId: objectId,
    type: ActivityTypeSchema,
    order: zod_1.z.number().int().min(0),
    sets: zod_1.z.number().int().min(1).optional(),
    reps: zod_1.z.number().int().min(1).optional(),
    percentageOfMax: zod_1.z.number().min(0).max(200).optional(),
    time: zod_1.z.number().int().min(0).optional(), // in minutes
    distance: zod_1.z.number().min(0).optional(),
    distanceUnit: exports.DistanceUnitSchema.optional()
});
// Day schema
exports.DaySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim(),
    order: zod_1.z.number().int().min(0),
    activities: zod_1.z.array(exports.ActivitySchema).default([])
});
// ActivityGroupTarget schema
exports.ActivityGroupTargetSchema = zod_1.z.object({
    activityGroupId: objectId,
    targetPercentage: zod_1.z.number().min(0).max(100)
});
// Week schema
exports.WeekSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim(),
    order: zod_1.z.number().int().min(0),
    activityGroupTargets: zod_1.z.array(exports.ActivityGroupTargetSchema).default([]),
    days: zod_1.z.array(exports.DaySchema).default([])
});
// Block schema
exports.BlockSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim(),
    order: zod_1.z.number().int().min(0),
    activityGroupTargets: zod_1.z.array(exports.ActivityGroupTargetSchema).default([]),
    weeks: zod_1.z.array(exports.WeekSchema).default([])
});
// Program creation schema
exports.CreateProgramSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
    description: zod_1.z.string().max(500, 'Description must be less than 500 characters').trim().optional(),
    gymId: objectId
});
// Program update schema
exports.UpdateProgramSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim().optional(),
    description: zod_1.z.string().max(500, 'Description must be less than 500 characters').trim().optional(),
    isActive: zod_1.z.boolean().optional(),
    blocks: zod_1.z.array(exports.BlockSchema).optional()
});
// Program list params schema
exports.ProgramListParamsSchema = zod_1.z.object({
    gymId: objectId.optional(),
    isActive: zod_1.z.coerce.boolean().optional(),
    createdBy: objectId.optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
});
// Program ID schema
exports.ProgramIdSchema = zod_1.z.object({
    id: objectId
});
// Block management schemas
exports.CreateBlockSchema = exports.BlockSchema;
exports.UpdateBlockSchema = exports.BlockSchema.partial();
// Week management schemas
exports.CreateWeekSchema = exports.WeekSchema;
exports.UpdateWeekSchema = exports.WeekSchema.partial();
// Day management schemas
exports.CreateDaySchema = exports.DaySchema;
exports.UpdateDaySchema = exports.DaySchema.partial();
// Activity management schemas
exports.CreateActivitySchema = exports.ActivitySchema;
exports.UpdateActivitySchema = exports.ActivitySchema.partial();
// Program progress schemas
exports.JumpToWeekSchema = zod_1.z.object({
    blockIndex: zod_1.z.number().int().min(0, 'Block index must be at least 0'),
    weekIndex: zod_1.z.number().int().min(0, 'Week index must be at least 0')
});
//# sourceMappingURL=programs.js.map