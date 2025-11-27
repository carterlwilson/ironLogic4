import { z } from 'zod';

export const RepMaxSchema = z.object({
  reps: z.number().int().min(1).max(100),
  name: z.string().min(1).max(20).trim(),
  weightKg: z.number().positive().max(1000),
  recordedAt: z.coerce.date(),
});

export type RepMaxInput = z.infer<typeof RepMaxSchema>;