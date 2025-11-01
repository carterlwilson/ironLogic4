import { z } from 'zod';
export declare const GymSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    address: z.ZodString;
    phoneNumber: z.ZodString;
    ownerId: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    address: string;
    phoneNumber: string;
    ownerId: string;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    address: string;
    phoneNumber: string;
    ownerId: string;
}>;
export declare const CreateGymSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodString;
    phoneNumber: z.ZodString;
    ownerId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    address: string;
    phoneNumber: string;
    ownerId: string;
}, {
    name: string;
    address: string;
    phoneNumber: string;
    ownerId: string;
}>;
//# sourceMappingURL=gyms.d.ts.map