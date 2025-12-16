import { IActiveSchedule, ITimeslotWithAvailability } from '@ironlogic4/shared';
import { apiRequest } from './api';

interface GetAvailableSchedulesResponse {
  success: true;
  data: IActiveScheduleWithAvailability[];
}

interface JoinTimeslotResponse {
  success: true;
  data: IActiveScheduleWithAvailability;
  message: string;
}

interface LeaveTimeslotResponse {
  success: true;
  data: IActiveScheduleWithAvailability;
  message: string;
}

export interface IScheduleDayWithAvailability {
  dayOfWeek: number;
  timeSlots: ITimeslotWithAvailability[];
}

export interface IActiveScheduleWithAvailability extends Omit<IActiveSchedule, 'days'> {
  days: IScheduleDayWithAvailability[];
}

/**
 * Fetch all available schedules for the current gym
 */
export async function getAvailableSchedules(): Promise<GetAvailableSchedulesResponse> {
  return apiRequest<GetAvailableSchedulesResponse>('/api/gym/schedules/available');
}

/**
 * Join a specific timeslot in a schedule
 */
export async function joinTimeslot(
  scheduleId: string,
  timeslotId: string
): Promise<JoinTimeslotResponse> {
  return apiRequest<JoinTimeslotResponse>(
    `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`,
    { method: 'POST' }
  );
}

/**
 * Leave a specific timeslot in a schedule
 */
export async function leaveTimeslot(
  scheduleId: string,
  timeslotId: string
): Promise<LeaveTimeslotResponse> {
  return apiRequest<LeaveTimeslotResponse>(
    `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/leave`,
    { method: 'DELETE' }
  );
}