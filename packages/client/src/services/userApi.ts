import type { User, UserType } from '@ironlogic4/shared/types/users';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';

// Request/Response Types
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  password: string;
  gymId?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: UserType;
  password?: string;
  gymId?: string;
}

export interface ResetPasswordRequest {
  generateRandom?: boolean;
  newPassword?: string;
}

export interface ResetPasswordResponse extends ApiResponse {
  data: {
    newPassword?: string;
    message: string;
  };
}

class UserApiService {
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/admin/users`;

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

  async getUsers(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
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
      throw new Error(error.message || 'Failed to fetch users');
    }

    const apiResponse = await response.json();

    // Convert API response to proper User objects with Date conversion
    const users: User[] = apiResponse.data.map((userData: any): User => ({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType,
      password: userData.password,
      gymId: userData.gymId,
      createdAt: new Date(userData.createdAt),
      updatedAt: new Date(userData.updatedAt),
    }));

    return {
      ...apiResponse,
      data: users,
    };
  }

  async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create user');
    }

    return response.json();
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update user');
    }

    return response.json();
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete user');
    }

    return response.json();
  }

  async resetPassword(id: string, data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
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

export const userApi = new UserApiService();