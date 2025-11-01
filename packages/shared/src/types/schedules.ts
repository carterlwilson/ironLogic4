export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export interface ITimeSlot {
  id: string;
  startTime: string;  // "HH:mm" format (e.g., "09:00", "14:30")
  endTime: string;    // "HH:mm" format (e.g., "10:00", "15:30")
  capacity: number;
  assignedClients: string[];  // User IDs of clients assigned to this timeslot
}

export interface ITimeslotWithAvailability extends ITimeSlot {
  availableSpots: number;  // Computed: capacity - assignedClients.length
  isUserAssigned: boolean;  // Computed: whether the requesting user is assigned
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
  coachIds: string[];  // REQUIRED: At least one coach must be assigned
  days: IScheduleDay[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActiveSchedule {
  id: string;
  gymId: string;
  templateId: string;
  coachIds: string[];  // REQUIRED: At least one coach must be assigned
  days: IScheduleDay[];
  lastResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types for API

export interface CreateScheduleTemplateRequest {
  name: string;
  description?: string;
  coachIds: string[];  // At least one required
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
  // Empty - user ID comes from auth
}

export interface ResetScheduleResponse {
  success: boolean;
  resetCount: number;
  message: string;
}