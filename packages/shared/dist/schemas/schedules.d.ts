import { z } from 'zod';
import { DayOfWeek } from '../types/schedules';
export declare const TimeSlotSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    capacity: z.ZodNumber;
    assignedClients: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    assignedClients: string[];
}, {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    assignedClients?: string[] | undefined;
}>, {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    assignedClients: string[];
}, {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    assignedClients?: string[] | undefined;
}>;
export declare const ScheduleDaySchema: z.ZodObject<{
    dayOfWeek: z.ZodNativeEnum<typeof DayOfWeek>;
    timeSlots: z.ZodArray<z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodString;
        capacity: z.ZodNumber;
        assignedClients: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        startTime: string;
        endTime: string;
        capacity: number;
        assignedClients: string[];
    }, {
        id: string;
        startTime: string;
        endTime: string;
        capacity: number;
        assignedClients?: string[] | undefined;
    }>, {
        id: string;
        startTime: string;
        endTime: string;
        capacity: number;
        assignedClients: string[];
    }, {
        id: string;
        startTime: string;
        endTime: string;
        capacity: number;
        assignedClients?: string[] | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    dayOfWeek: DayOfWeek;
    timeSlots: {
        id: string;
        startTime: string;
        endTime: string;
        capacity: number;
        assignedClients: string[];
    }[];
}, {
    dayOfWeek: DayOfWeek;
    timeSlots: {
        id: string;
        startTime: string;
        endTime: string;
        capacity: number;
        assignedClients?: string[] | undefined;
    }[];
}>;
export declare const CreateScheduleTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    coachIds: z.ZodArray<z.ZodString, "many">;
    days: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        dayOfWeek: z.ZodNativeEnum<typeof DayOfWeek>;
        timeSlots: z.ZodArray<z.ZodEffects<z.ZodObject<{
            id: z.ZodString;
            startTime: z.ZodString;
            endTime: z.ZodString;
            capacity: z.ZodNumber;
            assignedClients: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients: string[];
        }, {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients?: string[] | undefined;
        }>, {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients: string[];
        }, {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients?: string[] | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        dayOfWeek: DayOfWeek;
        timeSlots: {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients: string[];
        }[];
    }, {
        dayOfWeek: DayOfWeek;
        timeSlots: {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients?: string[] | undefined;
        }[];
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    days: {
        dayOfWeek: DayOfWeek;
        timeSlots: {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients: string[];
        }[];
    }[];
    coachIds: string[];
    description?: string | undefined;
}, {
    name: string;
    coachIds: string[];
    days?: {
        dayOfWeek: DayOfWeek;
        timeSlots: {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients?: string[] | undefined;
        }[];
    }[] | undefined;
    description?: string | undefined;
}>;
export declare const UpdateScheduleTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    coachIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    days: z.ZodOptional<z.ZodArray<z.ZodObject<{
        dayOfWeek: z.ZodNativeEnum<typeof DayOfWeek>;
        timeSlots: z.ZodArray<z.ZodEffects<z.ZodObject<{
            id: z.ZodString;
            startTime: z.ZodString;
            endTime: z.ZodString;
            capacity: z.ZodNumber;
            assignedClients: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients: string[];
        }, {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients?: string[] | undefined;
        }>, {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients: string[];
        }, {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients?: string[] | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        dayOfWeek: DayOfWeek;
        timeSlots: {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients: string[];
        }[];
    }, {
        dayOfWeek: DayOfWeek;
        timeSlots: {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients?: string[] | undefined;
        }[];
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    days?: {
        dayOfWeek: DayOfWeek;
        timeSlots: {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients: string[];
        }[];
    }[] | undefined;
    description?: string | undefined;
    coachIds?: string[] | undefined;
}, {
    name?: string | undefined;
    days?: {
        dayOfWeek: DayOfWeek;
        timeSlots: {
            id: string;
            startTime: string;
            endTime: string;
            capacity: number;
            assignedClients?: string[] | undefined;
        }[];
    }[] | undefined;
    description?: string | undefined;
    coachIds?: string[] | undefined;
}>;
export declare const CreateActiveScheduleSchema: z.ZodObject<{
    templateId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    templateId: string;
}, {
    templateId: string;
}>;
export declare const AssignStaffSchema: z.ZodObject<{
    coachId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    coachId: string;
}, {
    coachId: string;
}>;
export declare const JoinTimeslotSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const AvailableSchedulesQuerySchema: z.ZodObject<{
    gymId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    gymId?: string | undefined;
}, {
    gymId?: string | undefined;
}>;
//# sourceMappingURL=schedules.d.ts.map