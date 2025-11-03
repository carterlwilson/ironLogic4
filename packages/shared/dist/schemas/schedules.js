"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailableSchedulesQuerySchema = exports.JoinTimeslotSchema = exports.AssignStaffSchema = exports.CreateActiveScheduleSchema = exports.UpdateScheduleTemplateSchema = exports.CreateScheduleTemplateSchema = exports.ScheduleDaySchema = exports.TimeSlotSchema = void 0;
const zod_1 = require("zod");
const schedules_1 = require("../types/schedules");
// Time format validation (HH:mm)
const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
exports.TimeSlotSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    startTime: zod_1.z.string().regex(timeFormatRegex, 'Time must be in HH:mm format (e.g., 09:00, 14:30)'),
    endTime: zod_1.z.string().regex(timeFormatRegex, 'Time must be in HH:mm format (e.g., 09:00, 14:30)'),
    capacity: zod_1.z.number().int().min(1, 'Capacity must be at least 1'),
    assignedClients: zod_1.z.array(zod_1.z.string()).default([]),
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
exports.ScheduleDaySchema = zod_1.z.object({
    dayOfWeek: zod_1.z.nativeEnum(schedules_1.DayOfWeek),
    timeSlots: zod_1.z.array(exports.TimeSlotSchema),
});
exports.CreateScheduleTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim(),
    description: zod_1.z.string().max(500).trim().optional(),
    coachIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one coach is required'),
    days: zod_1.z.array(exports.ScheduleDaySchema).optional().default([]),
});
exports.UpdateScheduleTemplateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).trim().optional(),
    description: zod_1.z.string().max(500).trim().optional(),
    coachIds: zod_1.z.array(zod_1.z.string().min(1)).min(1, 'At least one coach is required').optional(),
    days: zod_1.z.array(exports.ScheduleDaySchema).min(1, 'At least one day is required').optional(),
});
exports.CreateActiveScheduleSchema = zod_1.z.object({
    templateId: zod_1.z.string().min(1),
});
exports.AssignStaffSchema = zod_1.z.object({
    coachId: zod_1.z.string().min(1),
});
exports.JoinTimeslotSchema = zod_1.z.object({
// Empty - user ID comes from auth
});
exports.AvailableSchedulesQuerySchema = zod_1.z.object({
    gymId: zod_1.z.string().min(1).optional(),
});
//# sourceMappingURL=schedules.js.map