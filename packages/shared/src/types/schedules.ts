export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

// ===== Schedule Template (flat model — one document per recurring class slot) =====

export interface IScheduleTemplate {
  id: string;
  gymId: string;
  coachId: string;
  dayOfWeek: DayOfWeek;
  period: 'AM' | 'PM';
  time: string;       // start time "HH:mm"
  endTime: string;    // end time "HH:mm"
  maxCapacity: number;
  isActive: boolean;
  assignedCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScheduleTemplateRequest {
  coachId: string;
  dayOfWeek: DayOfWeek;
  period: 'AM' | 'PM';
  time: string;
  endTime: string;
  maxCapacity: number;
}

export interface UpdateScheduleTemplateRequest {
  coachId?: string;
  dayOfWeek?: DayOfWeek;
  period?: 'AM' | 'PM';
  time?: string;
  endTime?: string;
  maxCapacity?: number;
  isActive?: boolean;
}

// ===== Class Session (dated occurrence generated from a template) =====

export interface IClassSession {
  id: string;
  templateId: string;
  coachId: string;
  gymId: string;
  date: Date;             // midnight UTC of the specific calendar day
  period: 'AM' | 'PM';   // denormalized from template
  startTime: string;      // "HH:mm"
  endTime: string;        // "HH:mm"
  maxCapacity: number;    // snapshot at time of generation
  createdAt: Date;
}

// ===== Client Default Schedule =====

export interface IClientDefaultSchedule {
  id: string;
  clientId: string;
  templateId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateClientDefaultScheduleRequest {
  templateId: string;
}

// ===== Enrollment =====

export interface IEnrollment {
  id: string;
  sessionId: string;
  clientId: string;
  source: 'default' | 'override';
  status: 'enrolled' | 'skipped';
  enrolledAt: Date;
}

// ===== Attendance =====

export interface IAttendance {
  id: string;
  sessionId: string;
  clientId: string;
  status: 'present' | 'absent' | 'late';
  recordedBy: string;    // coachId
  recordedAt: Date;
}

export interface SubmitAttendanceRequest {
  attendance: Array<{ clientId: string; status: 'present' | 'absent' | 'late' }>;
}

// ===== Session Generation =====

export interface GenerateWeekRequest {
  startDate?: string;    // ISO date string for Monday; defaults to next Monday
}

export interface GenerateWeekResponse {
  sessionsCreated: number;
  enrollmentsCreated: number;
  weekStart: string;
}

export interface ITemplateClient {
  defaultId: string;
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AdminAssignClientRequest {
  clientId: string;
}
