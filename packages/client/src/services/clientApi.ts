import type { User } from '@ironlogic4/shared/types/users';
import type { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
import type { ClientBenchmark } from '@ironlogic4/shared/types/clientBenchmarks';
import { authenticatedRequest } from './tokenRefresh';

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
  async getClients(params: ClientListParams = {}): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.set(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const url = `/api/gym/clients${queryString ? `?${queryString}` : ''}`;

    const apiResponse = await authenticatedRequest<any>(url);

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
    const apiResponse = await authenticatedRequest<any>(`/api/gym/clients/${id}`);

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
    return authenticatedRequest<CreateClientResponse>('/api/gym/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: UpdateClientRequest): Promise<ApiResponse<User>> {
    return authenticatedRequest<ApiResponse<User>>(`/api/gym/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string): Promise<ApiResponse> {
    return authenticatedRequest<ApiResponse>(`/api/gym/clients/${id}`, {
      method: 'DELETE',
    });
  }

  async assignProgram(clientId: string, programId: string): Promise<ApiResponse<User>> {
    return authenticatedRequest<ApiResponse<User>>(`/api/gym/clients/${clientId}/program`, {
      method: 'PATCH',
      body: JSON.stringify({ programId }),
    });
  }

  async unassignProgram(clientId: string): Promise<ApiResponse<User>> {
    return authenticatedRequest<ApiResponse<User>>(`/api/gym/clients/${clientId}/program`, {
      method: 'DELETE',
    });
  }
}

export const clientApi = new ClientApiService();