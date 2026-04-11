import type {
  IScheduleTemplate,
  IClassSession,
  IEnrollment,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest,
  GenerateWeekResponse,
  ApiResponse,
} from '@ironlogic4/shared';

export interface IClassSessionWithCounts extends IClassSession {
  enrolledCount: number;
}

export interface ISessionRosterEntry {
  enrollmentId: string;
  clientId: string;
  source: 'default' | 'override';
  status: 'enrolled' | 'skipped';
  client?: { id: string; firstName: string; lastName: string };
}

export interface ISessionDetail extends IClassSession {
  enrolledCount: number;
  roster: ISessionRosterEntry[];
}

class ScheduleApiService {
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/gym/schedules`;

  private async getAuthHeaders(): Promise<HeadersInit> {
    const authTokens = localStorage.getItem('authTokens');
    if (!authTokens) throw new Error('No authentication token found');
    const { accessToken } = JSON.parse(authTokens);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...await this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || error.error || 'Request failed');
    }
    return response.json();
  }

  // ==================== SCHEDULE TEMPLATES ====================

  async getTemplates(): Promise<ApiResponse<IScheduleTemplate[]>> {
    const res = await this.request<ApiResponse<any[]>>('/templates');
    return {
      ...res,
      data: (res.data || []).map((t: any) => ({
        ...t,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      })),
    };
  }

  async createTemplate(data: CreateScheduleTemplateRequest): Promise<ApiResponse<IScheduleTemplate>> {
    return this.request<ApiResponse<IScheduleTemplate>>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: UpdateScheduleTemplateRequest): Promise<ApiResponse<IScheduleTemplate>> {
    return this.request<ApiResponse<IScheduleTemplate>>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/templates/${id}`, { method: 'DELETE' });
  }

  // ==================== SESSIONS ====================

  async getSessionsForWeek(startDate: string): Promise<ApiResponse<IClassSessionWithCounts[]>> {
    return this.request<ApiResponse<IClassSessionWithCounts[]>>(
      `/sessions/coach/week?startDate=${encodeURIComponent(startDate)}`
    );
  }

  async getSessionById(id: string): Promise<ApiResponse<ISessionDetail>> {
    return this.request<ApiResponse<ISessionDetail>>(`/sessions/${id}`);
  }

  async deleteSession(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/sessions/${id}`, { method: 'DELETE' });
  }

  async deleteSessionsForWeek(weekStart: string): Promise<ApiResponse<{ deleted: number }>> {
    return this.request<ApiResponse<{ deleted: number }>>(
      `/sessions?weekStart=${encodeURIComponent(weekStart)}`,
      { method: 'DELETE' }
    );
  }

  // ==================== ADMIN ENROLLMENT ====================

  async adminEnrollClient(sessionId: string, clientId: string): Promise<ApiResponse<IEnrollment>> {
    return this.request<ApiResponse<IEnrollment>>(`/sessions/${sessionId}/enroll/admin`, {
      method: 'POST',
      body: JSON.stringify({ clientId }),
    });
  }

  async adminUnenrollClient(sessionId: string, clientId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/sessions/${sessionId}/enroll/admin`, {
      method: 'DELETE',
      body: JSON.stringify({ clientId }),
    });
  }

  // ==================== SESSION GENERATION ====================

  async generateWeek(startDate?: string): Promise<ApiResponse<GenerateWeekResponse>> {
    return this.request<ApiResponse<GenerateWeekResponse>>('/generate-week', {
      method: 'POST',
      body: JSON.stringify(startDate ? { startDate } : {}),
    });
  }
}

export const scheduleApi = new ScheduleApiService();
