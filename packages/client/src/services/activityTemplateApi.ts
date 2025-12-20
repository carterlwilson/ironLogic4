import type { ActivityTemplate, CreateActivityTemplateRequest, UpdateActivityTemplateRequest, ActivityTemplateListParams } from '@ironlogic4/shared/types/activityTemplates';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
import { authenticatedRequest } from './tokenRefresh';

class ActivityTemplateApiService {
  async getActivityTemplates(params: ActivityTemplateListParams = {}): Promise<PaginatedResponse<ActivityTemplate>> {
    const queryParams = new URLSearchParams();

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = `/api/gym/activity-templates${queryString ? `?${queryString}` : ''}`;

    const apiResponse = await authenticatedRequest<any>(url);

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
    return authenticatedRequest<ApiResponse<ActivityTemplate>>('/api/gym/activity-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActivityTemplate(id: string, data: UpdateActivityTemplateRequest): Promise<ApiResponse<ActivityTemplate>> {
    return authenticatedRequest<ApiResponse<ActivityTemplate>>(`/api/gym/activity-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteActivityTemplate(id: string): Promise<ApiResponse> {
    return authenticatedRequest<ApiResponse>(`/api/gym/activity-templates/${id}`, {
      method: 'DELETE',
    });
  }
}

export const activityTemplateApi = new ActivityTemplateApiService();