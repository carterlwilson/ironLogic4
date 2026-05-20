import { useQuery } from '@tanstack/react-query';
import { userApi } from '../services/userApi';

export interface OwnerMapping {
  [ownerId: string]: string;
}

export interface UseOwnerMappingReturn {
  ownerMapping: OwnerMapping;
  ownerOptions: Array<{ value: string; label: string }>;
  loading: boolean;
  error: string | null;
  refreshOwners: () => Promise<void>;
}

export const useOwnerMapping = (): UseOwnerMappingReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['owners'],
    queryFn: () => userApi.getUsers({ role: 'owner', limit: 100 }),
    staleTime: 5 * 60 * 1000,
    select: (response) => {
      const owners = response.data || [];
      const mapping: OwnerMapping = {};
      const options: Array<{ value: string; label: string }> = [{ value: '', label: 'All Owners' }];
      owners.forEach(owner => {
        mapping[owner.id] = `${owner.firstName} ${owner.lastName}`;
        options.push({ value: owner.id, label: `${owner.firstName} ${owner.lastName}` });
      });
      return { ownerMapping: mapping, ownerOptions: options };
    },
  });

  return {
    ownerMapping: data?.ownerMapping ?? {},
    ownerOptions: data?.ownerOptions ?? [{ value: '', label: 'All Owners' }],
    loading: isLoading,
    error: error?.message ?? null,
    refreshOwners: async () => { await refetch(); },
  };
};
