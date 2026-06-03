import type { IClassSession, IClientDefaultSchedule, IEnrollment, IScheduleTemplate, ITemplateClient } from '@ironlogic4/shared';
import { apiRequest } from './api';

export interface IClassSessionWithAvailability extends IClassSession {
  enrolledCount: number;
  availableSpots: number;
  coach?: { firstName: string; lastName: string };
}

export interface ISessionWithRoster extends IClassSession {
  roster: Array<{
    enrollmentId: string;
    source: 'default' | 'override';
    client?: { id: string; firstName: string; lastName: string };
  }>;
  enrolledCount: number;
}

export interface IAttendanceRecord {
  id: string;
  clientId: string;
  status: 'present' | 'absent' | 'late';
  client?: { id: string; firstName: string; lastName: string };
}

export async function getSessions(params: {
  date?: string;
  period?: 'AM' | 'PM';
  startTime?: string;
  coachId?: string;
}): Promise<{ success: true; data: IClassSessionWithAvailability[] }> {
  const query = new URLSearchParams();
  if (params.date) query.set('date', params.date);
  if (params.period) query.set('period', params.period);
  if (params.startTime) query.set('startTime', params.startTime);
  if (params.coachId) query.set('coachId', params.coachId);
  return apiRequest(`/api/gym/schedules/sessions?${query.toString()}`);
}

export async function enrollInSession(sessionId: string): Promise<{ success: true; data: IEnrollment; message: string }> {
  return apiRequest(`/api/gym/schedules/sessions/${sessionId}/enroll`, { method: 'POST' });
}

export async function unenrollFromSession(sessionId: string): Promise<{ success: true; message: string }> {
  return apiRequest(`/api/gym/schedules/sessions/${sessionId}/enroll`, { method: 'DELETE' });
}

export async function getSessionsByCoachDay(date: string): Promise<{ success: true; data: ISessionWithRoster[] }> {
  return apiRequest(`/api/gym/schedules/sessions/coach/${date}`);
}

export async function getSessionsByCoachWeek(startDate: string): Promise<{ success: true; data: (IClassSession & { enrolledCount: number })[] }> {
  return apiRequest(`/api/gym/schedules/sessions/coach/week?startDate=${startDate}`);
}

export async function submitAttendance(
  sessionId: string,
  attendance: Array<{ clientId: string; status: 'present' | 'absent' | 'late' }>
): Promise<{ success: true; data: IAttendanceRecord[]; message: string }> {
  return apiRequest(`/api/gym/schedules/sessions/${sessionId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ attendance }),
  });
}

export async function getAttendance(sessionId: string): Promise<{ success: true; data: IAttendanceRecord[] }> {
  return apiRequest(`/api/gym/schedules/sessions/${sessionId}/attendance`);
}

export async function getMyDefaults(): Promise<{ success: true; data: IClientDefaultSchedule[] }> {
  return apiRequest('/api/gym/schedules/defaults');
}

export async function addDefault(templateId: string): Promise<{ success: true; data: IClientDefaultSchedule }> {
  return apiRequest('/api/gym/schedules/defaults', {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  });
}

export async function removeDefault(id: string): Promise<{ success: true; message: string }> {
  return apiRequest(`/api/gym/schedules/defaults/${id}`, { method: 'DELETE' });
}

export interface ClientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function getTemplates(): Promise<{ success: true; data: IScheduleTemplate[] }> {
  return apiRequest('/api/gym/schedules/templates');
}

export async function getTemplateClients(templateId: string): Promise<{ success: true; data: ITemplateClient[] }> {
  return apiRequest(`/api/gym/schedules/templates/${templateId}/clients`);
}

export async function assignClientToTemplate(templateId: string, clientId: string): Promise<{ success: true }> {
  return apiRequest(`/api/gym/schedules/templates/${templateId}/clients`, {
    method: 'POST',
    body: JSON.stringify({ clientId }),
  });
}

export async function removeClientFromTemplate(templateId: string, clientId: string): Promise<{ success: true }> {
  return apiRequest(`/api/gym/schedules/templates/${templateId}/clients/${clientId}`, { method: 'DELETE' });
}

export async function getGymClients(params?: { search?: string; page?: number; limit?: number }): Promise<{ success: true; data: ClientSummary[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiRequest(`/api/gym/clients${qs ? `?${qs}` : ''}`);
}
