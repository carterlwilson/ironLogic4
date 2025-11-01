import { z } from 'zod';
import { ActivityType } from '../types/activityTemplates';
export declare const ActivityTypeSchema: z.ZodNativeEnum<typeof ActivityType>;
export declare const CreateActivityTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<typeof ActivityType>;
    benchmarkTemplateId: z.ZodOptional<z.ZodString>;
    gymId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gymId: string;
    type: ActivityType;
    name: string;
    notes?: string | undefined;
    groupId?: string | undefined;
    benchmarkTemplateId?: string | undefined;
}, {
    gymId: string;
    type: ActivityType;
    name: string;
    notes?: string | undefined;
    groupId?: string | undefined;
    benchmarkTemplateId?: string | undefined;
}>;
export declare const UpdateActivityTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    groupId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof ActivityType>>;
    benchmarkTemplateId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: ActivityType | undefined;
    name?: string | undefined;
    notes?: string | undefined;
    groupId?: string | undefined;
    benchmarkTemplateId?: string | undefined;
}, {
    type?: ActivityType | undefined;
    name?: string | undefined;
    notes?: string | undefined;
    groupId?: string | undefined;
    benchmarkTemplateId?: string | undefined;
}>;
export declare const ActivityTemplateListParamsSchema: z.ZodObject<{
    gymId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof ActivityType>>;
    groupId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    gymId?: string | undefined;
    search?: string | undefined;
    type?: ActivityType | undefined;
    groupId?: string | undefined;
}, {
    gymId?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    type?: ActivityType | undefined;
    groupId?: string | undefined;
}>;
export declare const ActivityTemplateIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export type CreateActivityTemplateInput = z.infer<typeof CreateActivityTemplateSchema>;
export type UpdateActivityTemplateInput = z.infer<typeof UpdateActivityTemplateSchema>;
export type ActivityTemplateListParamsInput = z.infer<typeof ActivityTemplateListParamsSchema>;
export type ActivityTemplateIdInput = z.infer<typeof ActivityTemplateIdSchema>;
//# sourceMappingURL=activityTemplates.d.ts.map