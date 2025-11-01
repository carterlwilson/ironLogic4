import { z } from 'zod';
export declare const CreateActivityGroupSchema: z.ZodObject<{
    name: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    gymId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gymId: string;
    name: string;
    notes?: string | undefined;
}, {
    gymId: string;
    name: string;
    notes?: string | undefined;
}>;
export declare const UpdateActivityGroupSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    notes?: string | undefined;
}, {
    name?: string | undefined;
    notes?: string | undefined;
}>;
export declare const ActivityGroupListParamsSchema: z.ZodObject<{
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
export declare const ActivityGroupIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateActivityGroupInput = z.infer<typeof CreateActivityGroupSchema>;
export type UpdateActivityGroupInput = z.infer<typeof UpdateActivityGroupSchema>;
export type ActivityGroupListParamsInput = z.infer<typeof ActivityGroupListParamsSchema>;
export type ActivityGroupIdInput = z.infer<typeof ActivityGroupIdSchema>;
//# sourceMappingURL=activityGroups.d.ts.map