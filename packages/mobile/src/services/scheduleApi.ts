import { IActiveSchedule, ITimeslotWithAvailability } from '@ironlogic4/shared';

const API_BASE = '/api';

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
 * Get auth token from localStorage
 */
function getAuthToken(): string {
  const authTokens = localStorage.getItem('authTokens');
  if (!authTokens) {
    throw new Error('No authentication token found');
  }
  const { accessToken } = JSON.parse(authTokens);
  return accessToken;
}

/**
 * Fetch all available schedules for the current gym
 */
export async function getAvailableSchedules(): Promise<GetAvailableSchedulesResponse> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/gym/schedules/available`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch schedules');
  }

  return response.json();
}

/**
 * Join a specific timeslot in a schedule
 */
export async function joinTimeslot(
  scheduleId: string,
  timeslotId: string
): Promise<JoinTimeslotResponse> {
  const token = getAuthToken();

  const response = await fetch(
    `${API_BASE}/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/join`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to join timeslot');
  }

  return response.json();
}

/**
 * Leave a specific timeslot in a schedule
 */
export async function leaveTimeslot(
  scheduleId: string,
  timeslotId: string
): Promise<LeaveTimeslotResponse> {
  const token = getAuthToken();

  const response = await fetch(
    `${API_BASE}/gym/schedules/active/${scheduleId}/timeslots/${timeslotId}/leave`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to leave timeslot');
  }

  return response.json();
}