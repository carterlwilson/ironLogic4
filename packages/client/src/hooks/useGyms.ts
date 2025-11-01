import { useState, useEffect, useCallback } from 'react';
import type { Gym } from '@ironlogic4/shared/types/gyms';

interface UseGymsReturn {
  gyms: Gym[];
  loading: boolean;
  error: string | null;
  gymOptions: Array<{ value: string; label: string }>;
  gymMap: Map<string, string>;
  refreshGyms: () => Promise<void>;
}

export const useGyms = (enabled: boolean = true): UseGymsReturn => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGyms = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authTokens = localStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('No authentication token found');
      }

      const { accessToken } = JSON.parse(authTokens);
      const response = await fetch('/api/admin/gyms', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        throw new Error(errorData.message || 'Failed to fetch gyms');
      }

      const data = await response.json();
      setGyms(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch gyms';
      setError(errorMessage);
      setGyms([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  // Transform gyms into select options
  const gymOptions = gyms.map(gym => ({
    value: gym.id,
    label: gym.name,
  }));

  // Create a map for quick gym name lookup by ID
  const gymMap = new Map(gyms.map(gym => [gym.id, gym.name]));

  return {
    gyms,
    loading,
    error,
    gymOptions,
    gymMap,
    refreshGyms: fetchGyms,
  };
};