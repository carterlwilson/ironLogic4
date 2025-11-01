import { useState, useEffect, useCallback } from 'react';
import { gymApi } from '../services/gymApi';
import type { Gym } from '@ironlogic4/shared/types/gyms';

export interface GymOption {
  value: string;
  label: string;
}

export interface UseGymOptionsReturn {
  gymOptions: GymOption[];
  loading: boolean;
  error: string | null;
  refreshGyms: () => Promise<void>;
}

export const useGymOptions = (): UseGymOptionsReturn => {
  const [gymOptions, setGymOptions] = useState<GymOption[]>([
    { value: '', label: 'No gym assigned' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGyms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all gyms (no pagination for dropdown)
      const response = await gymApi.getGyms({ limit: 100 });
      const gyms = response.data || [];

      // Create options for select dropdown
      const options: GymOption[] = [
        { value: '', label: 'No gym assigned' },
        ...gyms.map((gym: Gym) => ({
          value: gym.id,
          label: gym.name,
        }))
      ];

      setGymOptions(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load gyms';
      setError(errorMessage);
      console.error('Failed to load gyms for selection:', err);

      // Set fallback options on error
      setGymOptions([{ value: '', label: 'Error loading gyms' }]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshGyms = useCallback(() => {
    return loadGyms();
  }, [loadGyms]);

  useEffect(() => {
    loadGyms();
  }, [loadGyms]);

  return {
    gymOptions,
    loading,
    error,
    refreshGyms,
  };
};