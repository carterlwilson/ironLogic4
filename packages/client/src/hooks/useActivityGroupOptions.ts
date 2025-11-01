import { useState, useEffect, useCallback } from 'react';
import { activityGroupApi } from '../services/activityGroupApi';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';

export interface ActivityGroupOption {
  value: string;
  label: string;
}

export interface UseActivityGroupOptionsReturn {
  groupOptions: ActivityGroupOption[];
  loading: boolean;
  error: string | null;
  refreshGroups: () => Promise<void>;
}

export const useActivityGroupOptions = (gymId?: string): UseActivityGroupOptionsReturn => {
  const [groupOptions, setGroupOptions] = useState<ActivityGroupOption[]>([
    { value: '', label: 'No group' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    if (!gymId) {
      setGroupOptions([{ value: '', label: 'No group' }]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load all groups for the gym (no pagination for dropdown)
      const response = await activityGroupApi.getActivityGroups({ gymId, limit: 100, page: 1 });
      const groups = response.data || [];

      // Create options for select dropdown
      const options: ActivityGroupOption[] = [
        { value: '', label: 'No group' },
        ...groups.map((group: ActivityGroup) => ({
          value: group.id,
          label: group.name,
        }))
      ];

      setGroupOptions(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load activity groups';
      setError(errorMessage);
      console.error('Failed to load activity groups for selection:', err);

      // Set fallback options on error
      setGroupOptions([{ value: '', label: 'Error loading groups' }]);
    } finally {
      setLoading(false);
    }
  }, [gymId]);

  const refreshGroups = useCallback(() => {
    return loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    groupOptions,
    loading,
    error,
    refreshGroups,
  };
};