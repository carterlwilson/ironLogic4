import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import type { ApiResponse } from '@ironlogic4/shared/types/api';
import type { CreateMyBenchmarkInput, UpdateMyBenchmarkInput } from '@ironlogic4/shared';

export interface MyBenchmarksResponse {
  currentBenchmarks: ClientBenchmark[];
  historicalBenchmarks: ClientBenchmark[];
}

class ClientBenchmarkApiService {
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/me/benchmarks`;

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

  async getMyBenchmarks(): Promise<MyBenchmarksResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to fetch benchmarks');
    }

    const apiResponse = await response.json();

    // Convert API response to proper ClientBenchmark objects with Date conversion
    const convertBenchmark = (benchmarkData: any): ClientBenchmark => ({
      id: benchmarkData.id,
      templateId: benchmarkData.templateId,
      name: benchmarkData.name,
      notes: benchmarkData.notes,
      type: benchmarkData.type,
      tags: benchmarkData.tags || [],
      weightKg: benchmarkData.weightKg,
      timeSeconds: benchmarkData.timeSeconds,
      reps: benchmarkData.reps,
      otherNotes: benchmarkData.otherNotes,
      recordedAt: new Date(benchmarkData.recordedAt),
      createdAt: new Date(benchmarkData.createdAt),
      updatedAt: new Date(benchmarkData.updatedAt),
    });

    return {
      currentBenchmarks: (apiResponse.data.currentBenchmarks || []).map(convertBenchmark),
      historicalBenchmarks: (apiResponse.data.historicalBenchmarks || []).map(convertBenchmark),
    };
  }

  async createMyBenchmark(data: CreateMyBenchmarkInput): Promise<ApiResponse<{ benchmark: ClientBenchmark }>> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create benchmark');
    }

    return response.json();
  }

  async updateMyBenchmark(benchmarkId: string, data: UpdateMyBenchmarkInput): Promise<ApiResponse<{ benchmark: ClientBenchmark }>> {
    const response = await fetch(`${this.baseUrl}/${benchmarkId}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update benchmark');
    }

    return response.json();
  }
}

export const clientBenchmarkApi = new ClientBenchmarkApiService();