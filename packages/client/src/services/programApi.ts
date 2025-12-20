import type { IProgram, CreateProgramRequest, UpdateProgramRequest, ProgramListParams } from '@ironlogic4/shared/types/programs';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
import { authenticatedRequest } from './tokenRefresh';

class ProgramApiService {

  async getPrograms(params: ProgramListParams = {}): Promise<PaginatedResponse<IProgram>> {
    const queryParams = new URLSearchParams();

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = `/api/gym/programs${queryString ? `?${queryString}` : ''}`;

    const apiResponse = await authenticatedRequest<any>(url);

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
    const apiResponse = await authenticatedRequest<any>(`/api/gym/programs/${id}`);

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
    return authenticatedRequest<ApiResponse<IProgram>>('/api/gym/programs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProgram(id: string, data: UpdateProgramRequest): Promise<ApiResponse<IProgram>> {
    return authenticatedRequest<ApiResponse<IProgram>>(`/api/gym/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProgram(id: string): Promise<ApiResponse> {
    return authenticatedRequest<ApiResponse>(`/api/gym/programs/${id}`, {
      method: 'DELETE',
    });
  }

  // Full program update (for nested structure changes)
  async updateProgramStructure(id: string, program: Partial<IProgram>): Promise<ApiResponse<IProgram>> {
    return authenticatedRequest<ApiResponse<IProgram>>(`/api/gym/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(program),
    });
  }

  // Get current progress with metadata
  async getCurrentProgress(programId: string): Promise<ApiResponse<any>> {
    return authenticatedRequest<ApiResponse<any>>(`/api/gym/programs/${programId}/progress`);
  }

  // Update progress position
  async updateProgress(
    programId: string,
    blockIndex: number,
    weekIndex: number
  ): Promise<ApiResponse<IProgram>> {
    return authenticatedRequest<ApiResponse<IProgram>>(`/api/gym/programs/${programId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ blockIndex, weekIndex }),
    });
  }
}

export const programApi = new ProgramApiService();