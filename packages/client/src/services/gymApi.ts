import type { Gym, CreateGymRequest, UpdateGymRequest, GymListParams } from '@ironlogic4/shared/types/gyms';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';

class GymApiService {
  private baseUrl = '/api/admin/gyms';

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

  async getGyms(params: GymListParams = {}): Promise<PaginatedResponse<Gym>> {
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
      throw new Error(error.message || 'Failed to fetch gyms');
    }

    const apiResponse = await response.json();

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
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create gym');
    }

    return response.json();
  }

  async updateGym(id: string, data: UpdateGymRequest): Promise<ApiResponse<Gym>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update gym');
    }

    return response.json();
  }

  async deleteGym(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete gym');
    }

    return response.json();
  }
}

export const gymApi = new GymApiService();