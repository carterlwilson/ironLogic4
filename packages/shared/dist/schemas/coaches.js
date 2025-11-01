import { z } from 'zod';
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
/**
 * Schema for listing coaches with pagination and filtering
 */
export const CoachListParamsSchema = z.object({
    gymId: objectId.optional(),
    search: z.string().optional(),
    page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
    limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});
/**
 * Schema for creating a new coach
 */
export const CreateCoachSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').trim(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').trim(),
    gymId: objectId.optional(), // Optional for owners (they use their own gym), required for admins
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});
/**
 * Schema for updating a coach
 */
export const UpdateCoachSchema = z.object({
    email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
    firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').trim().optional(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').trim().optional(),
}).refine((data) => {
    // At least one field must be provided
    return data.email || data.firstName || data.lastName;
}, { message: 'At least one field must be updated' });
/**
 * Schema for resetting a coach's password
 */
export const ResetCoachPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});
/**
 * Schema for validating coach ID parameter
 */
export const CoachIdSchema = z.object({
    id: objectId,
});
//# sourceMappingURL=coaches.js.map