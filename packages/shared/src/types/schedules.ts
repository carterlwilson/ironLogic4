export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

/** Maximum number of classes a client may be signed up for at once in the active schedule. */
export const MAX_CLASSES_PER_WEEK = 3;

/**
 * Determine whether a given day-of-week is earlier in the current (Sunday-start) week than today.
 * Day-granularity only — a class later today is never considered "past".
 * @param dayOfWeek - Day to check (0-6, Sunday-Saturday)
 * @param now - Reference date, defaults to the current time
 */
export function isDayInPast(dayOfWeek: DayOfWeek, now: Date = new Date()): boolean {
  return dayOfWeek < now.getDay();
}

export interface ITimeSlot {
  id: string;
  startTime: string;  // "HH:mm" format (e.g., "09:00", "14:30")
  endTime: string;    // "HH:mm" format (e.g., "10:00", "15:30")
  capacity: number;
  coachIds: string[];  // REQUIRED: At least one coach must be assigned
  location: string;    // REQUIRED: free-text location for this timeslot
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
  days: IScheduleDay[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActiveSchedule {
  id: string;
  gymId: string;
  templateId: string;
  days: IScheduleDay[];
  lastResetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response types for API

export interface CreateScheduleTemplateRequest {
  name: string;
  description?: string;
  days: IScheduleDay[];
}

export interface UpdateScheduleTemplateRequest {
  name?: string;
  description?: string;
  days?: IScheduleDay[];
}

export interface CreateActiveScheduleRequest {
}

export interface UpdateTimeslotAssignmentRequest {
  coachIds: string[];  // At least one required
  location: string;
}

export interface AddTimeslotClientRequest {
  clientId: string;
}

export interface JoinTimeslotRequest {
  // Empty - user ID comes from auth
}

export interface ResetScheduleResponse {
  success: boolean;
  resetCount: number;
  message: string;
}