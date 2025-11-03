import { z } from 'zod';
import { UserType } from '../types/users.js';
export declare const UserTypeSchema: z.ZodNativeEnum<typeof UserType>;
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    userType: z.ZodNativeEnum<typeof UserType>;
    password: z.ZodString;
    gymId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    id: string;
    userType: UserType;
    createdAt: Date;
    updatedAt: Date;
    gymId?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    id: string;
    userType: UserType;
    createdAt: Date;
    updatedAt: Date;
    gymId?: string | undefined;
}>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    userType: z.ZodNativeEnum<typeof UserType>;
    gymId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    userType: UserType;
    gymId?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    userType: UserType;
    gymId?: string | undefined;
}>;
//# sourceMappingURL=users.d.ts.map