import { useState, useEffect } from 'react';
import { activityGroupApi } from '../services/activityGroupApi';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';

interface UseActivityGroupsReturn {
  groups: ActivityGroup[];
  isLoading: boolean;
  error: Error | null;
}

export function useActivityGroups(gymId: string | undefined): UseActivityGroupsReturn {
  const [groups, setGroups] = useState<ActivityGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gymId) {
      setGroups([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    activityGroupApi.getActivityGroups({ gymId, limit: 100, page: 1 })
      .then(response => {
        setGroups(response.data || []);
      })
      .catch(err => {
        console.error('Failed to load activity groups:', err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [gymId]);

  return { groups, isLoading, error };
}