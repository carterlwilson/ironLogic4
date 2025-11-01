import { useState, useEffect } from 'react';
import { clientApi } from '../services/clientApi';
import type { User } from '@ironlogic4/shared/types/users';
import { UserType } from '@ironlogic4/shared/types/users';

export interface Client {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Hook to fetch and manage clients for the current gym
 * Uses /api/gym/clients endpoint (owner and admin accessible)
 * Returns clients who can be assigned to schedules (CLIENT user type)
 *
 * @param gymId - The gym ID to fetch clients for (used for cache key, server handles scoping)
 * @returns { clients, loading, error }
 */
export function useClients(gymId: string | undefined) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gymId) {
      setClients([]);
      return;
    }

    const fetchClients = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch clients using the gym-scoped endpoint
        // Server automatically filters by user's gym
        const response = await clientApi.getClients({
          limit: 100, // Get up to 100 clients (most gyms have <100)
          page: 1,
        });

        // Filter for CLIENT user type and transform to Client interface
        const clientList: Client[] = (response.data || [])
          .filter((user: User) => user.userType === UserType.CLIENT)
          .map((user: User) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }));

        setClients(clientList);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clients';
        console.error('Failed to fetch clients:', errorMessage);
        setError(errorMessage);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [gymId]);

  return { clients, loading, error };
}