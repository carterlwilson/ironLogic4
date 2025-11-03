"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityGroupIdSchema = exports.ActivityGroupListParamsSchema = exports.UpdateActivityGroupSchema = exports.CreateActivityGroupSchema = void 0;
const zod_1 = require("zod");
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
exports.CreateActivityGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim(),
    notes: zod_1.z.string().max(500, 'Notes must be less than 500 characters').trim().optional(),
    gymId: objectId
});
exports.UpdateActivityGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').trim().optional(),
    notes: zod_1.z.string().max(500, 'Notes must be less than 500 characters').trim().optional()
});
exports.ActivityGroupListParamsSchema = zod_1.z.object({
    gymId: objectId.optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10)
});
exports.ActivityGroupIdSchema = zod_1.z.object({
    id: objectId
});
//# sourceMappingURL=activityGroups.js.map