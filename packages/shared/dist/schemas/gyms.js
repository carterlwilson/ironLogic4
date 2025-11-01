import { z } from 'zod';
export const GymSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    address: z.string().min(1),
    phoneNumber: z.string().min(1),
    ownerId: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const CreateGymSchema = z.object({
    name: z.string().min(1, 'Gym name is required'),
    address: z.string().min(1, 'Address is required'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    ownerId: z.string().min(1, 'Owner ID is required'),
});
//# sourceMappingURL=gyms.js.map