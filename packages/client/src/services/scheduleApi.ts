import type {
  IScheduleTemplate,
  IActiveSchedule,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest,
  CreateActiveScheduleRequest,
  ResetScheduleResponse,
  ApiResponse,
} from '@ironlogic4/shared';

/**
 * API service for schedule management
 * Handles both schedule templates and active schedules
 */
class ScheduleApiService {
  private baseUrl = '/api/gym/schedules';

  private async getAuthHeaders(): Promise<HeadersInit> {
    const authTokens = localStorage.getItem('authTokens');
    if (!authTokens) {
      throw new Error('No authentication token found');
    }

    const { accessToken } = JSON.parse(authTokens);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  // ==================== SCHEDULE TEMPLATES ====================

  /**
   * Get all schedule templates for the current gym
   */
  async getTemplates(): Promise<ApiResponse<IScheduleTemplate[]>> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to fetch schedule templates');
    }

    const apiResponse = await response.json();

    // Convert date strings to Date objects
    const templates: IScheduleTemplate[] = apiResponse.data.map((template: any) => ({
      ...template,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt),
    }));

    return {
      ...apiResponse,
      data: templates,
    };
  }

  /**
   * Get a single schedule template by ID
   */
  async getTemplate(id: string): Promise<ApiResponse<IScheduleTemplate>> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to fetch schedule template');
    }

    const apiResponse = await response.json();

    // Convert date strings to Date objects
    const template: IScheduleTemplate = {
      ...apiResponse.data,
      createdAt: new Date(apiResponse.data.createdAt),
      updatedAt: new Date(apiResponse.data.updatedAt),
    };

    return {
      ...apiResponse,
      data: template,
    };
  }

  /**
   * Create a new schedule template
   */
  async createTemplate(data: CreateScheduleTemplateRequest): Promise<ApiResponse<IScheduleTemplate>> {
    const response = await fetch(`${this.baseUrl}/templates`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create schedule template');
    }

    return response.json();
  }

  /**
   * Update an existing schedule template
   */
  async updateTemplate(id: string, data: UpdateScheduleTemplateRequest): Promise<ApiResponse<IScheduleTemplate>> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update schedule template');
    }

    return response.json();
  }

  /**
   * Delete a schedule template
   */
  async deleteTemplate(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/templates/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete schedule template');
    }

    return response.json();
  }

  // ==================== ACTIVE SCHEDULES ====================

  /**
   * Get the active schedule for the current gym
   */
  async getActiveSchedule(): Promise<ApiResponse<IActiveSchedule | null>> {
    const response = await fetch(`${this.baseUrl}/active`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to fetch active schedule');
    }

    const apiResponse = await response.json();

    // The API returns an array of active schedules, we need the first one (gym owner's schedule)
    const schedules = apiResponse.data || [];

    // Handle case where no active schedule exists
    if (schedules.length === 0) {
      return {
        success: apiResponse.success,
        data: null,
      };
    }

    // Get the first schedule (should be the only one for a gym owner)
    const scheduleData = schedules[0];

    // Convert date strings to Date objects
    const activeSchedule: IActiveSchedule = {
      ...scheduleData,
      lastResetAt: new Date(scheduleData.lastResetAt),
      createdAt: new Date(scheduleData.createdAt),
      updatedAt: new Date(scheduleData.updatedAt),
    };

    return {
      success: apiResponse.success,
      data: activeSchedule,
    };
  }

  /**
   * Create an active schedule from a template
   */
  async createActiveSchedule(data: CreateActiveScheduleRequest): Promise<ApiResponse<IActiveSchedule>> {
    const response = await fetch(`${this.baseUrl}/active`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create active schedule');
    }

    return response.json();
  }

  /**
   * Delete the active schedule
   * First fetches the active schedule to get its ID, then deletes it
   */
  async deleteActiveSchedule(): Promise<ApiResponse> {
    // First, get the active schedule to obtain its ID
    const activeScheduleResponse = await this.getActiveSchedule();

    if (!activeScheduleResponse.data) {
      throw new Error('No active schedule to delete');
    }

    const scheduleId = activeScheduleResponse.data.id;

    const response = await fetch(`${this.baseUrl}/active/${scheduleId}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete active schedule');
    }

    return response.json();
  }

  /**
   * Reset the active schedule (clear all client assignments)
   * First fetches the active schedule to get its ID, then resets it
   */
  async resetActiveSchedule(): Promise<ApiResponse<ResetScheduleResponse>> {
    // First, get the active schedule to obtain its ID
    const activeScheduleResponse = await this.getActiveSchedule();

    if (!activeScheduleResponse.data) {
      throw new Error('No active schedule to reset');
    }

    const scheduleId = activeScheduleResponse.data.id;

    const response = await fetch(`${this.baseUrl}/active/${scheduleId}/reset`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to reset active schedule');
    }

    return response.json();
  }

  /**
   * Update coaches for the active schedule
   * Replaces all coaches by removing old ones and adding new ones
   */
  async updateActiveScheduleCoaches(coachIds: string[]): Promise<ApiResponse<IActiveSchedule>> {
    // First, get the active schedule to obtain its ID and current coaches
    const activeScheduleResponse = await this.getActiveSchedule();

    if (!activeScheduleResponse.data) {
      throw new Error('No active schedule to update');
    }

    const schedule = activeScheduleResponse.data;
    const scheduleId = schedule.id;
    const currentCoachIds = schedule.coachIds;

    // Determine which coaches to add and remove
    const coachesToAdd = coachIds.filter(id => !currentCoachIds.includes(id));
    const coachesToRemove = currentCoachIds.filter(id => !coachIds.includes(id));

    // Remove coaches that are no longer in the list
    for (const coachId of coachesToRemove) {
      const response = await fetch(`${this.baseUrl}/active/${scheduleId}/unassign/${coachId}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `Failed to unassign coach ${coachId}`);
      }
    }

    // Add new coaches
    for (const coachId of coachesToAdd) {
      const response = await fetch(`${this.baseUrl}/active/${scheduleId}/assign`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ coachId }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(error.message || `Failed to assign coach ${coachId}`);
      }
    }

    // Fetch and return the updated schedule
    const updatedSchedule = await this.getActiveSchedule();
    return updatedSchedule as ApiResponse<IActiveSchedule>;
  }

  // ==================== TIMESLOT MANAGEMENT ====================

  /**
   * Assign a coach to a specific timeslot
   */
  async assignCoachToTimeslot(
    dayOfWeek: number,
    timeslotId: string,
    coachId: string
  ): Promise<ApiResponse<IActiveSchedule>> {
    const response = await fetch(
      `${this.baseUrl}/active/days/${dayOfWeek}/timeslots/${timeslotId}/assign`,
      {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ coachId }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to assign coach to timeslot');
    }

    return response.json();
  }

  /**
   * Unassign a coach from a specific timeslot
   */
  async unassignCoachFromTimeslot(
    dayOfWeek: number,
    timeslotId: string,
    coachId: string
  ): Promise<ApiResponse<IActiveSchedule>> {
    const response = await fetch(
      `${this.baseUrl}/active/days/${dayOfWeek}/timeslots/${timeslotId}/unassign`,
      {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify({ coachId }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to unassign coach from timeslot');
    }

    return response.json();
  }

  /**
   * Join a timeslot (for clients)
   */
  async joinTimeslot(dayOfWeek: number, timeslotId: string): Promise<ApiResponse<IActiveSchedule>> {
    const response = await fetch(
      `${this.baseUrl}/active/days/${dayOfWeek}/timeslots/${timeslotId}/join`,
      {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to join timeslot');
    }

    return response.json();
  }

  /**
   * Leave a timeslot (for clients)
   */
  async leaveTimeslot(dayOfWeek: number, timeslotId: string): Promise<ApiResponse<IActiveSchedule>> {
    const response = await fetch(
      `${this.baseUrl}/active/days/${dayOfWeek}/timeslots/${timeslotId}/leave`,
      {
        method: 'POST',
        headers: await this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to leave timeslot');
    }

    return response.json();
  }
}

export const scheduleApi = new ScheduleApiService();