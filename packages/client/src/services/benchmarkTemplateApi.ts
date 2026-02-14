import { authenticatedRequest } from './tokenRefresh';
import type { BenchmarkTemplate, BenchmarkType, TemplateRepMax } from '@ironlogic4/shared/types/benchmarkTemplates';
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
  templateRepMaxes?: Omit<TemplateRepMax, 'id'>[];
}

export interface UpdateBenchmarkTemplateRequest {
  name?: string;
  notes?: string;
  type?: BenchmarkType;
  tags?: string[];
  templateRepMaxes?: Omit<TemplateRepMax, 'id'>[];
  templateTimeSubMaxes?: Array<{ name: string }>;
  templateDistanceSubMaxes?: Array<{ name: string }>;
  distanceUnit?: string;
}

class BenchmarkTemplateApiService {
  async getBenchmarkTemplates(params: BenchmarkTemplateListParams = { page: 1, limit: 10 }): Promise<PaginatedResponse<BenchmarkTemplate>> {
    const queryParams = new URLSearchParams();

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = `/api/gym/benchmark-templates${queryString ? `?${queryString}` : ''}`;

    const apiResponse = await authenticatedRequest<any>(url);

    // Convert API response to proper BenchmarkTemplate objects with Date conversion
    const benchmarkTemplates: BenchmarkTemplate[] = apiResponse.data.map((templateData: any): BenchmarkTemplate => ({
      id: templateData.id,
      name: templateData.name,
      notes: templateData.notes,
      type: templateData.type,
      tags: templateData.tags || [],
      templateRepMaxes: templateData.templateRepMaxes,
      templateTimeSubMaxes: templateData.templateTimeSubMaxes,
      templateDistanceSubMaxes: templateData.templateDistanceSubMaxes,
      distanceUnit: templateData.distanceUnit,
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
    return authenticatedRequest<ApiResponse<BenchmarkTemplate>>('/api/gym/benchmark-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBenchmarkTemplate(id: string, data: UpdateBenchmarkTemplateRequest): Promise<ApiResponse<BenchmarkTemplate>> {
    return authenticatedRequest<ApiResponse<BenchmarkTemplate>>(`/api/gym/benchmark-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBenchmarkTemplate(id: string): Promise<ApiResponse> {
    return authenticatedRequest<ApiResponse>(`/api/gym/benchmark-templates/${id}`, {
      method: 'DELETE',
    });
  }
}

export const benchmarkTemplateApi = new BenchmarkTemplateApiService();
