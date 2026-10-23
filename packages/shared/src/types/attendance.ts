import {
  SubmitClassAttendanceInput,
  AttendanceRangeQueryInput,
  ClassAttendanceQueryInput,
} from '../schemas/attendance.js';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
}

export type AttendanceGroupBy = 'week' | 'month';

/**
 * One client's attendance at one class occurrence. The class details are a
 * snapshot taken when attendance was recorded, because the active schedule is
 * reset from its template every week.
 */
export interface IAttendanceRecord {
  id: string;
  gymId: string;
  clientId: string;
  date: string;        // "YYYY-MM-DD" — the day the class took place
  timeslotId: string;
  dayOfWeek: number;
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
  location: string;
  coachIds: string[];
  status: AttendanceStatus;
  walkIn: boolean;     // client wasn't signed up for the class when attendance was recorded
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendancePeriodCount {
  periodStart: string; // "YYYY-MM-DD" — Sunday for weeks, the 1st for months
  present: number;
  absent: number;
}

export interface IClientAttendanceSummary {
  clientId: string;
  firstName?: string;
  lastName?: string;
  present: number;
  absent: number;
  byPeriod: IAttendancePeriodCount[];
}

export interface IAttendanceSummaryResponse {
  from: string;
  to: string;
  groupBy: AttendanceGroupBy;
  periods: string[];
  clients: IClientAttendanceSummary[];
}

export interface IClientAttendanceHistory {
  from: string;
  to: string;
  groupBy: AttendanceGroupBy;
  periods: string[];
  summary: IClientAttendanceSummary;
  records: IAttendanceRecord[];
}

export type SubmitClassAttendanceRequest = SubmitClassAttendanceInput;
export type AttendanceRangeQuery = AttendanceRangeQueryInput;
export type ClassAttendanceQuery = ClassAttendanceQueryInput;

/** Format a Date as "YYYY-MM-DD" in local time. */
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse a "YYYY-MM-DD" string as a local-time Date at midnight. */
export function parseDateString(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The start of the week (Sunday) or month containing `date`, as "YYYY-MM-DD". */
export function getAttendancePeriodStart(date: string, groupBy: AttendanceGroupBy): string {
  const d = parseDateString(date);
  if (groupBy === 'month') {
    return toDateString(new Date(d.getFullYear(), d.getMonth(), 1));
  }
  return toDateString(new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()));
}

/** Every period start touching the inclusive range `from`..`to`, oldest first. */
export function listAttendancePeriods(from: string, to: string, groupBy: AttendanceGroupBy): string[] {
  const periods: string[] = [];
  const end = parseDateString(to);
  let cursor = parseDateString(getAttendancePeriodStart(from, groupBy));

  while (cursor <= end) {
    periods.push(toDateString(cursor));
    cursor = groupBy === 'month'
      ? new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      : new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  }

  return periods;
}
