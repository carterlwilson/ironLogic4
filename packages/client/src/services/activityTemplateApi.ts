import type { ActivityTemplate, CreateActivityTemplateRequest, UpdateActivityTemplateRequest, ActivityTemplateListParams } from '@ironlogic4/shared/types/activityTemplates';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';

class ActivityTemplateApiService {
  private baseUrl = '/api/gym/activity-templates';

  private async getAuthHeaders(): Promise<HeadersInit> {
    // Get token from localStorage (from AuthProvider)
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

  async getActivityTemplates(params: ActivityTemplateListParams = {}): Promise<PaginatedResponse<ActivityTemplate>> {
    const url = new URL(this.baseUrl, window.location.origin);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to fetch activity templates');
    }

    const apiResponse = await response.json();

    // Convert API response to proper ActivityTemplate objects with Date conversion
    const activityTemplates: ActivityTemplate[] = apiResponse.data.map((templateData: any): ActivityTemplate => ({
      id: templateData.id,
      name: templateData.name,
      notes: templateData.notes,
      groupId: templateData.groupId,
      type: templateData.type,
      gymId: templateData.gymId,
      createdBy: templateData.createdBy,
      createdAt: new Date(templateData.createdAt),
      updatedAt: new Date(templateData.updatedAt),
    }));

    return {
      ...apiResponse,
      data: activityTemplates,
    };
  }

  async createActivityTemplate(data: CreateActivityTemplateRequest): Promise<ApiResponse<ActivityTemplate>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create activity template');
    }

    return response.json();
  }

  async updateActivityTemplate(id: string, data: UpdateActivityTemplateRequest): Promise<ApiResponse<ActivityTemplate>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update activity template');
    }

    return response.json();
  }

  async deleteActivityTemplate(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete activity template');
    }

    return response.json();
  }
}

export const activityTemplateApi = new ActivityTemplateApiService();