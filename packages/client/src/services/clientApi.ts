import type { User } from '@ironlogic4/shared/types/users';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';

export interface ClientListParams {
  page?: number;
  limit?: number;
  search?: string;
  gymId?: string;
}

export interface CreateClientRequest {
  email: string;
  firstName: string;
  lastName: string;
  gymId: string;
  password?: string;
  generatePassword?: boolean;
  programId?: string;
}

export interface CreateClientResponse extends ApiResponse {
  data: User & {
    generatedPassword?: string;
  };
}

export interface UpdateClientRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  currentBenchmarks?: ClientBenchmark[];
  historicalBenchmarks?: ClientBenchmark[];
  programId?: string | null;
}

class ClientApiService {
  private apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  private baseUrl = `${this.apiBaseUrl}/api/gym/clients`;

  private async getAuthHeaders(): Promise<HeadersInit> {
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

  async getClients(params: ClientListParams = {}): Promise<PaginatedResponse<User>> {
    const url = new URL(this.baseUrl);

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
      throw new Error(error.message || 'Failed to fetch clients');
    }

    const apiResponse = await response.json();

    const clients: User[] = apiResponse.data.map((clientData: any): User => ({
      id: clientData.id,
      email: clientData.email,
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      userType: clientData.userType,
      password: clientData.password,
      gymId: clientData.gymId,
      programId: clientData.programId,
      currentBenchmarks: clientData.currentBenchmarks?.map((b: any) => ({
        ...b,
        recordedAt: new Date(b.recordedAt),
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      })) || [],
      historicalBenchmarks: clientData.historicalBenchmarks?.map((b: any) => ({
        ...b,
        recordedAt: new Date(b.recordedAt),
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      })) || [],
      createdAt: new Date(clientData.createdAt),
      updatedAt: new Date(clientData.updatedAt),
    }));

    return {
      ...apiResponse,
      data: clients,
    };
  }

  async getClientById(id: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to fetch client');
    }

    const apiResponse = await response.json();

    // Convert benchmark dates
    const client = {
      ...apiResponse.data,
      currentBenchmarks: apiResponse.data.currentBenchmarks?.map((b: any) => ({
        ...b,
        recordedAt: new Date(b.recordedAt),
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      })) || [],
      historicalBenchmarks: apiResponse.data.historicalBenchmarks?.map((b: any) => ({
        ...b,
        recordedAt: new Date(b.recordedAt),
        createdAt: new Date(b.createdAt),
        updatedAt: new Date(b.updatedAt),
      })) || [],
      createdAt: new Date(apiResponse.data.createdAt),
      updatedAt: new Date(apiResponse.data.updatedAt),
    };

    return {
      ...apiResponse,
      data: client,
    };
  }

  async createClient(data: CreateClientRequest): Promise<CreateClientResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to create client');
    }

    return response.json();
  }

  async updateClient(id: string, data: UpdateClientRequest): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to update client');
    }

    return response.json();
  }

  async deleteClient(id: string): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to delete client');
    }

    return response.json();
  }

  async assignProgram(clientId: string, programId: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/${clientId}/program`, {
      method: 'PATCH',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ programId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to assign program');
    }

    return response.json();
  }

  async unassignProgram(clientId: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${this.baseUrl}/${clientId}/program`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Failed to unassign program');
    }

    return response.json();
  }
}

export const clientApi = new ClientApiService();