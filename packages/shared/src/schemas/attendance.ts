import { z } from 'zod';
import { AttendanceStatus } from '../types/attendance.js';

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateString = z.string().regex(dateStringRegex, 'Date must be in YYYY-MM-DD format');

export const SubmitClassAttendanceSchema = z.object({
  timeslotId: z.string().min(1, 'Timeslot ID is required'),
  date: dateString,
  entries: z.array(z.object({
    clientId: z.string().min(1),
    status: z.nativeEnum(AttendanceStatus),
  }))
    .min(1, 'At least one attendance entry is required')
    .refine(
      (entries) => new Set(entries.map(e => e.clientId)).size === entries.length,
      { message: 'Duplicate client in attendance submission' }
    ),
});

export const ClassAttendanceQuerySchema = z.object({
  timeslotId: z.string().min(1, 'Timeslot ID is required'),
  date: dateString,
});

const AttendanceRangeFields = z.object({
  from: dateString,
  to: dateString,
  groupBy: z.enum(['week', 'month']).default('week'),
  gymId: z.string().min(1).optional(),
});

const rangeOrderCheck = {
  message: 'From date must be on or before to date',
  path: ['to'],
};

export const AttendanceRangeQuerySchema = AttendanceRangeFields
  .refine((data) => data.from <= data.to, rangeOrderCheck);

export const AttendanceSummaryQuerySchema = AttendanceRangeFields.extend({
  search: z.string().optional(),
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
}).refine((data) => data.from <= data.to, rangeOrderCheck);

export type SubmitClassAttendanceInput = z.infer<typeof SubmitClassAttendanceSchema>;
export type ClassAttendanceQueryInput = z.infer<typeof ClassAttendanceQuerySchema>;
export type AttendanceRangeQueryInput = z.infer<typeof AttendanceRangeQuerySchema>;
export type AttendanceSummaryQueryInput = z.infer<typeof AttendanceSummaryQuerySchema>;
