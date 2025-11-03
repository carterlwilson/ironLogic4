import { z } from 'zod';
import { UserType } from '../types/users.js';
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const RegisterSchema: z.ZodObject<{
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
//# sourceMappingURL=auth.d.ts.map