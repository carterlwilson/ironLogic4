"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachIdSchema = exports.ResetCoachPasswordSchema = exports.UpdateCoachSchema = exports.CreateCoachSchema = exports.CoachListParamsSchema = void 0;
const zod_1 = require("zod");
const objectId = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
/**
 * Schema for listing coaches with pagination and filtering
 */
exports.CoachListParamsSchema = zod_1.z.object({
    gymId: objectId.optional(),
    search: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: zod_1.z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});
/**
 * Schema for creating a new coach
 */
exports.CreateCoachSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').toLowerCase().trim(),
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').trim(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').trim(),
    gymId: objectId.optional(), // Optional for owners (they use their own gym), required for admins
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').optional(),
});
/**
 * Schema for updating a coach
 */
exports.UpdateCoachSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address').toLowerCase().trim().optional(),
    firstName: zod_1.z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').trim().optional(),
    lastName: zod_1.z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').trim().optional(),
}).refine((data) => {
    // At least one field must be provided
    return data.email || data.firstName || data.lastName;
}, { message: 'At least one field must be updated' });
/**
 * Schema for resetting a coach's password
 */
exports.ResetCoachPasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters').optional(),
});
/**
 * Schema for validating coach ID parameter
 */
exports.CoachIdSchema = zod_1.z.object({
    id: objectId,
});
//# sourceMappingURL=coaches.js.map