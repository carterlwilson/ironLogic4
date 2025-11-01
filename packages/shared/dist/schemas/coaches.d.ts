import { z } from 'zod';
/**
 * Schema for listing coaches with pagination and filtering
 */
export declare const CoachListParamsSchema: z.ZodObject<{
    gymId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    gymId?: string | undefined;
    search?: string | undefined;
}, {
    gymId?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
/**
 * Schema for creating a new coach
 */
export declare const CreateCoachSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    gymId: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    gymId?: string | undefined;
    password?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    gymId?: string | undefined;
    password?: string | undefined;
}>;
/**
 * Schema for updating a coach
 */
export declare const UpdateCoachSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}>, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
}>;
/**
 * Schema for resetting a coach's password
 */
export declare const ResetCoachPasswordSchema: z.ZodObject<{
    password: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    password?: string | undefined;
}, {
    password?: string | undefined;
}>;
/**
 * Schema for validating coach ID parameter
 */
export declare const CoachIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CoachListParamsInput = z.infer<typeof CoachListParamsSchema>;
export type CreateCoachInput = z.infer<typeof CreateCoachSchema>;
export type UpdateCoachInput = z.infer<typeof UpdateCoachSchema>;
export type ResetCoachPasswordInput = z.infer<typeof ResetCoachPasswordSchema>;
export type CoachIdInput = z.infer<typeof CoachIdSchema>;
//# sourceMappingURL=coaches.d.ts.map