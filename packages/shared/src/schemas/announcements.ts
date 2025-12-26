import { z } from 'zod';

export const AnnouncementSchema = z.object({
  id: z.string(),
  gymId: z.string(),
  content: z.string(),
  updatedAt: z.date(),
});

export const UpsertAnnouncementSchema = z.object({
  content: z
    .string()
    .min(1, 'Announcement content is required')
    .max(5000, 'Content must be less than 5000 characters'),
});
