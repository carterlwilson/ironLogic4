import { z } from 'zod';
import { UserType } from '../types/users';

export const UserTypeSchema = z.nativeEnum(UserType);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  userType: UserTypeSchema,
  password: z.string().min(6),
  gymId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  userType: UserTypeSchema,
  gymId: z.string().optional(),
});