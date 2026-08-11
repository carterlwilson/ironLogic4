import { useState, useEffect, useCallback, useMemo } from 'react';
import { getClients } from '../services/clientApi';
import { UserType } from '@ironlogic4/shared/types/users';
import type { User } from '@ironlogic4/shared/types/users';

export interface DirectoryClient {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Hook to fetch and manage the full list of the gym's clients
 * Uses /api/gym/clients (already gym-scoped server-side for coaches)
 * Also exposes an id -> client lookup map for resolving assignedClients IDs to names
 */
export function useClientDirectory() {
  const [clients, setClients] = useState<DirectoryClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const firstPage = await getClients({ limit: 100, page: 1 });
      const totalPages = firstPage.pagination?.totalPages ?? 1;
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
          getClients({ limit: 100, page: i + 2 })
        )
      );

      const allUsers: User[] = [firstPage, ...remainingPages].flatMap(
        (response) => response.data || []
      );

      const clientList: DirectoryClient[] = allUsers
        .filter((user) => user.userType === UserType.CLIENT)
        .map((user) => ({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }));

      setClients(clientList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load clients';
      setError(errorMessage);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);

  return { clients, clientMap, loading, error, refresh };
}
