import type { BenchmarkTemplate, BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';

export interface BenchmarkTemplateListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: BenchmarkType;
  gymId?: string;
}

export interface CreateBenchmarkTemplateRequest {
  name: string;
  notes?: string;
  type: BenchmarkType;
  tags: string[];
  gymId: string;
}

export interface UpdateBenchmarkTemplateRequest {
  name?: string;
  notes?: string;
  type?: BenchmarkType;
  tags?: string[];
}

class BenchmarkTemplateApiService {
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/gym/benchmark-templates`;

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

  async getBenchmarkTemplates(params: BenchmarkTemplateListParams = { page: 1, limit: 10 }): Promise<PaginatedResponse<BenchmarkTemplate>> {
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
      throw new Error(error.message || 'Failed to fetch benchmark templates');
    }

    const apiResponse = await response.json();

    // Convert API response to proper BenchmarkTemplate objects with Date conversion
    const benchmarkTemplates: BenchmarkTemplate[] = apiResponse.data.map((templateData: any): BenchmarkTemplate => ({
      id: templateData.id,
      name: templateData.name,
      notes: templateData.notes,
      type: templateData.type,
      tags: templateData.tags || [],
      gymId: templateData.gymId,
      createdBy: templateData.createdBy,
      createdAt: new Date(templateData.createdAt),
      updatedAt: new Date(templateData.updatedAt),
    }));

    return {
      ...apiResponse,
      data: benchmarkTemplates,
    };
  }

  async createBenchmarkTemplate(data: CreateBenchmarkTemplateRequest): Promise<ApiResponse<BenchmarkTemplate>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create benchmark template');
    }

    return response.json();
  }

  async updateBenchmarkTemplate(id: string, data: UpdateBenchmarkTemplateRequest): Promise<ApiResponse<BenchmarkTemplate>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update benchmark template');
    }

    return response.json();
  }

  async deleteBenchmarkTemplate(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete benchmark template');
    }

    return response.json();
  }
}

export const benchmarkTemplateApi = new BenchmarkTemplateApiService();
