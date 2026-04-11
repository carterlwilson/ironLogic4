import { z } from 'zod';
import { DayOfWeek } from '../types/schedules.js';

// Time format validation (HH:mm)
const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

// ===== Schedule Template Schemas (flat model) =====

export const CreateScheduleTemplateSchema = z.object({
  coachId: z.string().min(1),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  period: z.enum(['AM', 'PM']),
  time: z.string().regex(timeFormatRegex, 'Time must be in HH:mm format'),
  endTime: z.string().regex(timeFormatRegex, 'Time must be in HH:mm format'),
  maxCapacity: z.number().int().min(1, 'Capacity must be at least 1'),
}).refine((data) => {
  const [sh, sm] = data.time.split(':').map(Number);
  const [eh, em] = data.endTime.split(':').map(Number);
  return eh * 60 + em > sh * 60 + sm;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const UpdateScheduleTemplateSchema = z.object({
  coachId: z.string().min(1).optional(),
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  period: z.enum(['AM', 'PM']).optional(),
  time: z.string().regex(timeFormatRegex, 'Time must be in HH:mm format').optional(),
  endTime: z.string().regex(timeFormatRegex, 'Time must be in HH:mm format').optional(),
  maxCapacity: z.number().int().min(1, 'Capacity must be at least 1').optional(),
  isActive: z.boolean().optional(),
});

// ===== Class Session Query Schemas =====

export const ClassSessionQuerySchema = z.object({
  date: z.string().optional(),
  coachId: z.string().optional(),
  period: z.enum(['AM', 'PM']).optional(),
  startTime: z.string().regex(timeFormatRegex).optional(),
});

export const WeekViewQuerySchema = z.object({
  startDate: z.string().min(1),
});

// ===== Client Default Schedule Schema =====

export const ClientDefaultScheduleSchema = z.object({
  templateId: z.string().min(1),
});

// ===== Attendance Schema =====

export const SubmitAttendanceSchema = z.object({
  attendance: z.array(z.object({
    clientId: z.string().min(1),
    status: z.enum(['present', 'absent', 'late']),
  })).min(1),
});

// ===== Session Generation Schema =====

export const GenerateWeekSchema = z.object({
  startDate: z.string().optional(),
});

// ===== Available Schedules Query (kept for mobile client) =====

export const AvailableSchedulesQuerySchema = z.object({
  gymId: z.string().min(1).optional(),
});
