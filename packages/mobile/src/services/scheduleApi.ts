import { IActiveSchedule, IScheduleTemplate, ITimeslotWithAvailability } from '@ironlogic4/shared';
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

interface GetScheduleTemplatesResponse {
  success: true;
  data: IScheduleTemplate[];
}

interface GetActiveSchedulesResponse {
  success: true;
  data: IActiveSchedule[];
}

interface TimeslotClientMutationResponse<T> {
  success: true;
  data: T;
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

// ==================== COACH SCHEDULE MANAGEMENT ====================

/**
 * Fetch the gym's schedule template(s) — coach-scoped server-side to templates
 * the caller coaches at least one timeslot in
 */
export async function getScheduleTemplates(): Promise<GetScheduleTemplatesResponse> {
  return apiRequest<GetScheduleTemplatesResponse>('/api/gym/schedules/templates');
}

/**
 * Fetch the gym's active schedule(s) — coach-scoped server-side to schedules
 * the caller coaches at least one timeslot in
 */
export async function getActiveSchedules(): Promise<GetActiveSchedulesResponse> {
  return apiRequest<GetActiveSchedulesResponse>('/api/gym/schedules/active');
}

/**
 * Add a client to a specific timeslot on a schedule template
 */
export async function addTemplateTimeslotClient(
  templateId: string,
  timeslotId: string,
  clientId: string
): Promise<TimeslotClientMutationResponse<IScheduleTemplate>> {
  return apiRequest(
    `/api/gym/schedules/templates/${templateId}/timeslots/${timeslotId}/clients`,
    { method: 'POST', body: JSON.stringify({ clientId }) }
  );
}

/**
 * Remove a client from a specific timeslot on a schedule template
 */
export async function removeTemplateTimeslotClient(
  templateId: string,
  timeslotId: string,
  clientId: string
): Promise<TimeslotClientMutationResponse<IScheduleTemplate>> {
  return apiRequest(
    `/api/gym/schedules/templates/${templateId}/timeslots/${timeslotId}/clients/${clientId}`,
    { method: 'DELETE' }
  );
}

/**
 * Add a client to a specific timeslot on the active schedule
 */
export async function addActiveTimeslotClient(
  scheduleId: string,
  timeslotId: string,
  clientId: string
): Promise<TimeslotClientMutationResponse<IActiveSchedule>> {
  return apiRequest(
    `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/clients`,
    { method: 'POST', body: JSON.stringify({ clientId }) }
  );
}

/**
 * Remove a client from a specific timeslot on the active schedule
 */
export async function removeActiveTimeslotClient(
  scheduleId: string,
  timeslotId: string,
  clientId: string
): Promise<TimeslotClientMutationResponse<IActiveSchedule>> {
  return apiRequest(
    `/api/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/clients/${clientId}`,
    { method: 'DELETE' }
  );
}
