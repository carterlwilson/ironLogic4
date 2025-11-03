import { z } from 'zod';
import { DayOfWeek } from '../types/schedules.js';

// Time format validation (HH:mm)
const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export const TimeSlotSchema = z.object({
  id: z.string().min(1),
  startTime: z.string().regex(timeFormatRegex, 'Time must be in HH:mm format (e.g., 09:00, 14:30)'),
  endTime: z.string().regex(timeFormatRegex, 'Time must be in HH:mm format (e.g., 09:00, 14:30)'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  assignedClients: z.array(z.string()).default([]),
}).refine((data) => {
  // Validate that endTime is after startTime
  const [startHour, startMin] = data.startTime.split(':').map(Number);
  const [endHour, endMin] = data.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes > startMinutes;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const ScheduleDaySchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  timeSlots: z.array(TimeSlotSchema),
});

export const CreateScheduleTemplateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  coachIds: z.array(z.string().min(1)).min(1, 'At least one coach is required'),
  days: z.array(ScheduleDaySchema).optional().default([]),
});

export const UpdateScheduleTemplateSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  coachIds: z.array(z.string().min(1)).min(1, 'At least one coach is required').optional(),
  days: z.array(ScheduleDaySchema).min(1, 'At least one day is required').optional(),
});

export const CreateActiveScheduleSchema = z.object({
  templateId: z.string().min(1),
});

export const AssignStaffSchema = z.object({
  coachId: z.string().min(1),
});

export const JoinTimeslotSchema = z.object({
  // Empty - user ID comes from auth
});

export const AvailableSchedulesQuerySchema = z.object({
  gymId: z.string().min(1).optional(),
});