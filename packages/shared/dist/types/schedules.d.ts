export declare enum DayOfWeek {
    SUNDAY = 0,
    MONDAY = 1,
    TUESDAY = 2,
    WEDNESDAY = 3,
    THURSDAY = 4,
    FRIDAY = 5,
    SATURDAY = 6
}
export interface ITimeSlot {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    assignedClients: string[];
}
export interface ITimeslotWithAvailability extends ITimeSlot {
    availableSpots: number;
    isUserAssigned: boolean;
}
export interface IScheduleDay {
    dayOfWeek: DayOfWeek;
    timeSlots: ITimeSlot[];
}
export interface IScheduleTemplate {
    id: string;
    gymId: string;
    name: string;
    description?: string;
    coachIds: string[];
    days: IScheduleDay[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IActiveSchedule {
    id: string;
    gymId: string;
    templateId: string;
    coachIds: string[];
    days: IScheduleDay[];
    lastResetAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateScheduleTemplateRequest {
    name: string;
    description?: string;
    coachIds: string[];
    days: IScheduleDay[];
}
export interface UpdateScheduleTemplateRequest {
    name?: string;
    description?: string;
    coachIds?: string[];
    days?: IScheduleDay[];
}
export interface CreateActiveScheduleRequest {
    templateId: string;
}
export interface AssignStaffRequest {
    coachId: string;
}
export interface JoinTimeslotRequest {
}
export interface ResetScheduleResponse {
    success: boolean;
    resetCount: number;
    message: string;
}
//# sourceMappingURL=schedules.d.ts.map