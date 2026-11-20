import { z } from 'zod';

/** True if `value` is an IANA time zone name the runtime recognizes. */
export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const TimeZoneSchema = z.string().refine(isValidTimeZone, 'Time zone must be a valid IANA name, e.g. America/Los_Angeles');

export const GymSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  address: z.string().min(1),
  phoneNumber: z.string().min(1),
  ownerId: z.string(),
  timezone: TimeZoneSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateGymSchema = z.object({
  name: z.string().min(1, 'Gym name is required'),
  address: z.string().min(1, 'Address is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  timezone: TimeZoneSchema,
});