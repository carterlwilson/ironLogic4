import {
  ClientBenchmark,
  CreateMyBenchmarkInput,
  UpdateMyBenchmarkInput,
  BenchmarkTemplate,
  BenchmarkType
} from '@ironlogic4/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_BASE = `${API_BASE_URL}/api`;

interface GetBenchmarksResponse {
  success: true;
  data: {
    currentBenchmarks: ClientBenchmark[];
    historicalBenchmarks: ClientBenchmark[];
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
 * Get auth token from localStorage
 */
function getAuthToken(): string {
  const authTokens = localStorage.getItem('authTokens');
  if (!authTokens) {
    throw new Error('No authentication token found');
  }
  const { accessToken } = JSON.parse(authTokens);
  return accessToken;
}

/**
 * Fetch all benchmarks for the current user
 */
export async function getBenchmarks(): Promise<GetBenchmarksResponse> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/me/benchmarks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch benchmarks');
  }

  return response.json();
}

/**
 * Create a new benchmark
 */
export async function createBenchmark(
  data: CreateMyBenchmarkInput
): Promise<CreateBenchmarkResponse> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/me/benchmarks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create benchmark');
  }

  return response.json();
}

/**
 * Update an existing benchmark
 */
export async function updateBenchmark(
  benchmarkId: string,
  data: UpdateMyBenchmarkInput
): Promise<UpdateBenchmarkResponse> {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/me/benchmarks/${benchmarkId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update benchmark');
  }

  return response.json();
}

/**
 * Get all available benchmark templates (non-paginated)
 */
export async function getBenchmarkTemplates(): Promise<GetTemplatesResponse> {
  const token = getAuthToken();

  // Use the non-paginated /all endpoint to get all templates for dropdowns
  const response = await fetch(`${API_BASE}/gym/benchmark-templates/all`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch benchmark templates');
  }

  return response.json();
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
  const token = getAuthToken();

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
  const url = `${API_BASE}/me/benchmarks/${templateId}/progress${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch benchmark progress');
  }

  const result: GetBenchmarkProgressResponse = await response.json();
  return result.data;
}