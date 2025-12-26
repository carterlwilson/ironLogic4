import {
  ClientBenchmark,
  CreateMyBenchmarkInput,
  UpdateMyBenchmarkInput,
  BenchmarkTemplate,
  BenchmarkType
} from '@ironlogic4/shared';
import { apiRequest } from './api';

interface GetBenchmarksResponse {
  success: true;
  data: {
    currentBenchmarks: ClientBenchmark[];
    historicalBenchmarks: ClientBenchmark[];
    templates: BenchmarkTemplate[];
  };
}

interface CreateBenchmarkResponse {
  success: true;
  data: {
    currentBenchmarks: ClientBenchmark[];
    historicalBenchmarks: ClientBenchmark[];
  };
  message: string;
}

interface UpdateBenchmarkResponse {
  success: true;
  data: {
    currentBenchmarks: ClientBenchmark[];
    historicalBenchmarks: ClientBenchmark[];
  };
  message: string;
}

interface GetTemplatesResponse {
  success: true;
  data: BenchmarkTemplate[];
}

interface GetBenchmarkProgressResponse {
  success: true;
  data: {
    benchmarkName: string;
    benchmarkType: BenchmarkType;
    unit: string;
    chartData: Array<{ date: string; value: number }>;
  };
}

/**
 * Fetch all benchmarks for the current user
 */
export async function getBenchmarks(): Promise<GetBenchmarksResponse> {
  return apiRequest<GetBenchmarksResponse>('/api/me/benchmarks');
}

/**
 * Create a new benchmark
 */
export async function createBenchmark(
  data: CreateMyBenchmarkInput
): Promise<CreateBenchmarkResponse> {
  return apiRequest<CreateBenchmarkResponse>('/api/me/benchmarks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update an existing benchmark
 */
export async function updateBenchmark(
  benchmarkId: string,
  data: UpdateMyBenchmarkInput
): Promise<UpdateBenchmarkResponse> {
  return apiRequest<UpdateBenchmarkResponse>(`/api/me/benchmarks/${benchmarkId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Get all available benchmark templates (non-paginated)
 */
export async function getBenchmarkTemplates(): Promise<GetTemplatesResponse> {
  return apiRequest<GetTemplatesResponse>('/api/gym/benchmark-templates/all');
}

/**
 * Get a single benchmark template by ID
 */
export async function getBenchmarkTemplate(templateId: string): Promise<{ success: true; data: BenchmarkTemplate }> {
  return apiRequest<{ success: true; data: BenchmarkTemplate }>(`/api/gym/benchmark-templates/${templateId}`);
}

/**
 * Get benchmark progress data for charts
 */
export async function getBenchmarkProgress(
  templateId: string,
  options?: { limit?: number; startDate?: string; endDate?: string }
): Promise<{
  benchmarkName: string;
  benchmarkType: BenchmarkType;
  unit: string;
  chartData: Array<{ date: string; value: number }>;
}> {
  // Build query params
  const queryParams = new URLSearchParams();
  if (options?.limit) {
    queryParams.append('limit', options.limit.toString());
  }
  if (options?.startDate) {
    queryParams.append('startDate', options.startDate);
  }
  if (options?.endDate) {
    queryParams.append('endDate', options.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/me/benchmarks/${templateId}/progress${queryString ? `?${queryString}` : ''}`;

  const result = await apiRequest<GetBenchmarkProgressResponse>(url);
  return result.data;
}