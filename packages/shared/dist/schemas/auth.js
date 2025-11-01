import { z } from 'zod';
import { UserType } from '../types/users';
const UserTypeSchema = z.nativeEnum(UserType);
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    userType: UserTypeSchema,
    gymId: z.string().optional(),
});
//# sourceMappingURL=auth.js.map