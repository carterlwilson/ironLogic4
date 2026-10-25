import type { IAttendanceRecord, SubmitClassAttendanceRequest } from '@ironlogic4/shared';
import { apiRequest } from './api';

interface ClassAttendanceResponse {
  success: true;
  data: IAttendanceRecord[];
  message?: string;
}

/**
 * Get attendance already recorded for one class on one date
 */
export async function getClassAttendance(timeslotId: string, date: string): Promise<ClassAttendanceResponse> {
  const params = new URLSearchParams({ timeslotId, date });
  return apiRequest<ClassAttendanceResponse>(`/api/gym/attendance/class?${params}`);
}

/**
 * Record attendance for a class roster, replacing anything recorded before
 */
export async function submitClassAttendance(payload: SubmitClassAttendanceRequest): Promise<ClassAttendanceResponse> {
  return apiRequest<ClassAttendanceResponse>('/api/gym/attendance/class', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
