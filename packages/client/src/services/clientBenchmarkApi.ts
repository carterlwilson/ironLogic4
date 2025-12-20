import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import type { ApiResponse } from '@ironlogic4/shared/types/api';
import type { CreateMyBenchmarkInput, UpdateMyBenchmarkInput } from '@ironlogic4/shared';
import { authenticatedRequest } from './tokenRefresh';

export interface MyBenchmarksResponse {
  currentBenchmarks: ClientBenchmark[];
  historicalBenchmarks: ClientBenchmark[];
}

class ClientBenchmarkApiService {
  async getMyBenchmarks(): Promise<MyBenchmarksResponse> {
    const apiResponse = await authenticatedRequest<any>('/api/me/benchmarks');

    // Convert API response to proper ClientBenchmark objects with Date conversion
    const convertBenchmark = (benchmarkData: any): ClientBenchmark => ({
      id: benchmarkData.id,
      templateId: benchmarkData.templateId,
      name: benchmarkData.name,
      notes: benchmarkData.notes,
      type: benchmarkData.type,
      tags: benchmarkData.tags || [],
      repMaxes: benchmarkData.repMaxes ? benchmarkData.repMaxes.map((rm: any) => ({
        id: rm.id,
        templateRepMaxId: rm.templateRepMaxId,
        weightKg: rm.weightKg,
        recordedAt: new Date(rm.recordedAt),
        createdAt: new Date(rm.createdAt),
        updatedAt: new Date(rm.updatedAt),
      })) : undefined,
      timeSeconds: benchmarkData.timeSeconds,
      reps: benchmarkData.reps,
      otherNotes: benchmarkData.otherNotes,
      recordedAt: benchmarkData.recordedAt ? new Date(benchmarkData.recordedAt) : undefined,
      createdAt: new Date(benchmarkData.createdAt),
      updatedAt: new Date(benchmarkData.updatedAt),
    });

    return {
      currentBenchmarks: (apiResponse.data.currentBenchmarks || []).map(convertBenchmark),
      historicalBenchmarks: (apiResponse.data.historicalBenchmarks || []).map(convertBenchmark),
    };
  }

  async createMyBenchmark(data: CreateMyBenchmarkInput): Promise<ApiResponse<{ benchmark: ClientBenchmark }>> {
    return authenticatedRequest<ApiResponse<{ benchmark: ClientBenchmark }>>('/api/me/benchmarks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMyBenchmark(benchmarkId: string, data: UpdateMyBenchmarkInput): Promise<ApiResponse<{ benchmark: ClientBenchmark }>> {
    return authenticatedRequest<ApiResponse<{ benchmark: ClientBenchmark }>>(`/api/me/benchmarks/${benchmarkId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const clientBenchmarkApi = new ClientBenchmarkApiService();