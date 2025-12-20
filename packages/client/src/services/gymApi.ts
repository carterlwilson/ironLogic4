import { authenticatedRequest } from './tokenRefresh';
import type { Gym, CreateGymRequest, UpdateGymRequest, GymListParams } from '@ironlogic4/shared/types/gyms';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';

class GymApiService {
  async getGyms(params: GymListParams = {}): Promise<PaginatedResponse<Gym>> {
    const queryParams = new URLSearchParams();

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = `/api/admin/gyms${queryString ? `?${queryString}` : ''}`;

    const apiResponse = await authenticatedRequest<any>(url);

    // Convert API response to proper Gym objects with Date conversion
    const gyms: Gym[] = apiResponse.data.map((gymData: any): Gym => ({
      id: gymData.id,
      name: gymData.name,
      address: gymData.address,
      phoneNumber: gymData.phoneNumber,
      ownerId: gymData.ownerId,
      createdAt: new Date(gymData.createdAt),
      updatedAt: new Date(gymData.updatedAt),
    }));

    return {
      ...apiResponse,
      data: gyms,
    };
  }

  async createGym(data: CreateGymRequest): Promise<ApiResponse<Gym>> {
    return authenticatedRequest<ApiResponse<Gym>>('/api/admin/gyms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGym(id: string, data: UpdateGymRequest): Promise<ApiResponse<Gym>> {
    return authenticatedRequest<ApiResponse<Gym>>(`/api/admin/gyms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGym(id: string): Promise<ApiResponse> {
    return authenticatedRequest<ApiResponse>(`/api/admin/gyms/${id}`, {
      method: 'DELETE',
    });
  }
}

export const gymApi = new GymApiService();