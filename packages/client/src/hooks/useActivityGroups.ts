import { useQuery } from '@tanstack/react-query';
import { activityGroupApi } from '../services/activityGroupApi';
import type { ActivityGroup } from '@ironlogic4/shared/types/activityGroups';

interface UseActivityGroupsReturn {
  groups: ActivityGroup[];
  isLoading: boolean;
  error: Error | null;
}

export function useActivityGroups(gymId: string | undefined): UseActivityGroupsReturn {
  const { data, isLoading, error } = useQuery({
    queryKey: ['activityGroups', gymId],
    queryFn: () => activityGroupApi.getActivityGroups({ gymId: gymId!, limit: 100, page: 1 }),
    enabled: !!gymId,
    staleTime: 5 * 60 * 1000,
    select: (response) => response.data || [],
  });

  return { groups: data ?? [], isLoading, error: error as Error | null };
}
