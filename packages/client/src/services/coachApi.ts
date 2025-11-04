import type {
  CoachResponse,
  CoachListParams,
  CreateCoachRequest,
  CreateCoachResponse,
  UpdateCoachRequest,
  ResetCoachPasswordRequest,
  ResetCoachPasswordResponse,
} from '@ironlogic4/shared/types/coaches';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';

class CoachApiService {
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/gym/coaches`;

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

  async getCoaches(params: CoachListParams = { page: 1, limit: 10 }): Promise<PaginatedResponse<CoachResponse>> {
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
      throw new Error(error.message || 'Failed to fetch coaches');
    }

    const apiResponse = await response.json();

    // Convert API response to proper CoachResponse objects with Date conversion
    const coaches: CoachResponse[] = apiResponse.data.map((coachData: any): CoachResponse => ({
      id: coachData.id,
      email: coachData.email,
      firstName: coachData.firstName,
      lastName: coachData.lastName,
      userType: coachData.userType,
      gymId: coachData.gymId,
      createdAt: new Date(coachData.createdAt),
      updatedAt: new Date(coachData.updatedAt),
    }));

    return {
      ...apiResponse,
      data: coaches,
    };
  }

  async getCoachById(id: string): Promise<ApiResponse<CoachResponse>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to fetch coach');
    }

    return response.json();
  }

  async createCoach(data: CreateCoachRequest): Promise<ApiResponse<CreateCoachResponse>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create coach');
    }

    return response.json();
  }

  async updateCoach(id: string, data: UpdateCoachRequest): Promise<ApiResponse<CoachResponse>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update coach');
    }

    return response.json();
  }

  async deleteCoach(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));

      // If it's a 409 conflict (dependencies exist), return the error with details
      if (response.status === 409) {
        throw error;
      }

      throw new Error(error.message || 'Failed to delete coach');
    }

    return response.json();
  }

  async resetPassword(id: string, data: ResetCoachPasswordRequest): Promise<ApiResponse<ResetCoachPasswordResponse>> {
    const response = await fetch(`${this.baseUrl}/${id}/reset-password`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to reset password');
    }

    return response.json();
  }
}

export const coachApi = new CoachApiService();