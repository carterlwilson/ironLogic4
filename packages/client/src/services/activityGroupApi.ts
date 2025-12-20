import type { ActivityGroup, ActivityGroupListParams } from '@ironlogic4/shared/types/activityGroups';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
import { authenticatedRequest } from './tokenRefresh';

export interface CreateActivityGroupRequest {
  name: string;
  notes?: string;
  gymId: string;
}

export interface UpdateActivityGroupRequest {
  name?: string;
  notes?: string;
}

class ActivityGroupApiService {
  async getActivityGroups(params: ActivityGroupListParams = { page: 1, limit: 10 }): Promise<PaginatedResponse<ActivityGroup>> {
    const queryParams = new URLSearchParams();

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = `/api/gym/activity-groups${queryString ? `?${queryString}` : ''}`;

    const apiResponse = await authenticatedRequest<any>(url);

    // Convert API response to proper ActivityGroup objects with Date conversion
    const activityGroups: ActivityGroup[] = apiResponse.data.map((groupData: any): ActivityGroup => ({
      id: groupData.id,
      name: groupData.name,
      notes: groupData.notes,
      gymId: groupData.gymId,
      createdBy: groupData.createdBy,
      createdAt: new Date(groupData.createdAt),
      updatedAt: new Date(groupData.updatedAt),
    }));

    return {
      ...apiResponse,
      data: activityGroups,
    };
  }

  async createActivityGroup(data: CreateActivityGroupRequest): Promise<ApiResponse<ActivityGroup>> {
    return authenticatedRequest<ApiResponse<ActivityGroup>>('/api/gym/activity-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActivityGroup(id: string, data: UpdateActivityGroupRequest): Promise<ApiResponse<ActivityGroup>> {
    return authenticatedRequest<ApiResponse<ActivityGroup>>(`/api/gym/activity-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteActivityGroup(id: string): Promise<ApiResponse> {
    return authenticatedRequest<ApiResponse>(`/api/gym/activity-groups/${id}`, {
      method: 'DELETE',
    });
  }
}

export const activityGroupApi = new ActivityGroupApiService();