import type { IProgram, CreateProgramRequest, UpdateProgramRequest, ProgramListParams } from '@ironlogic4/shared/types/programs';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';

class ProgramApiService {
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/gym/programs`;

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

  async getPrograms(params: ProgramListParams = {}): Promise<PaginatedResponse<IProgram>> {
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
      throw new Error(error.message || 'Failed to fetch programs');
    }

    const apiResponse = await response.json();

    // Convert API response to proper Program objects with Date conversion
    const programs: IProgram[] = apiResponse.data.map((programData: any): IProgram => ({
      ...programData,
      createdAt: new Date(programData.createdAt),
      updatedAt: new Date(programData.updatedAt),
    }));

    return {
      ...apiResponse,
      data: programs,
    };
  }

  async getProgram(id: string): Promise<ApiResponse<IProgram>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to fetch program');
    }

    const apiResponse = await response.json();

    // Convert dates
    const program: IProgram = {
      ...apiResponse.data,
      createdAt: new Date(apiResponse.data.createdAt),
      updatedAt: new Date(apiResponse.data.updatedAt),
    };

    return {
      ...apiResponse,
      data: program,
    };
  }

  async createProgram(data: CreateProgramRequest): Promise<ApiResponse<IProgram>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create program');
    }

    return response.json();
  }

  async updateProgram(id: string, data: UpdateProgramRequest): Promise<ApiResponse<IProgram>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update program');
    }

    return response.json();
  }

  async deleteProgram(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete program');
    }

    return response.json();
  }

  // Full program update (for nested structure changes)
  async updateProgramStructure(id: string, program: Partial<IProgram>): Promise<ApiResponse<IProgram>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(program),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update program structure');
    }

    return response.json();
  }
}

export const programApi = new ProgramApiService();