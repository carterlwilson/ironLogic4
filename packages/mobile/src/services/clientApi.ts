import type { PaginatedResponse } from '@ironlogic4/shared/types/api';
import type { User } from '@ironlogic4/shared/types/users';
import { apiRequest } from './api';

export interface ClientListParams {
  page?: number;
  limit?: number;
}

/**
 * Fetch a page of the gym's clients (server scopes to the caller's gym)
 */
export async function getClients(params: ClientListParams = {}): Promise<PaginatedResponse<User>> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.set(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  const url = `/api/gym/clients${queryString ? `?${queryString}` : ''}`;

  return apiRequest<PaginatedResponse<User>>(url);
}
