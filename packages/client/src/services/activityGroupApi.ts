import type { ActivityGroup, ActivityGroupListParams } from '@ironlogic4/shared/types/activityGroups';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';

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
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/gym/activity-groups`;

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

  async getActivityGroups(params: ActivityGroupListParams = { page: 1, limit: 10 }): Promise<PaginatedResponse<ActivityGroup>> {
    const url = new URL(this.baseUrl);

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
      throw new Error(error.message || 'Failed to fetch activity groups');
    }

    const apiResponse = await response.json();

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
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create activity group');
    }

    return response.json();
  }

  async updateActivityGroup(id: string, data: UpdateActivityGroupRequest): Promise<ApiResponse<ActivityGroup>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update activity group');
    }

    return response.json();
  }

  async deleteActivityGroup(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete activity group');
    }

    return response.json();
  }
}

export const activityGroupApi = new ActivityGroupApiService();