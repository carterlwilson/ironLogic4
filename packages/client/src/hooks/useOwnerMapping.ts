import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../services/userApi';
import type { User } from '@ironlogic4/shared/types/users';

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
  const [ownerMapping, setOwnerMapping] = useState<OwnerMapping>({});
  const [ownerOptions, setOwnerOptions] = useState<Array<{ value: string; label: string }>>([
    { value: '', label: 'All Owners' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOwners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userApi.getUsers({ role: 'owner', limit: 100 });
      const owners = response.data || [];

      // Create mapping from owner ID to owner name
      const mapping: OwnerMapping = {};
      owners.forEach((owner: User) => {
        mapping[owner.id] = `${owner.firstName} ${owner.lastName}`;
      });

      // Create options for select dropdown
      const options = [
        { value: '', label: 'All Owners' },
        ...owners.map((owner: User) => ({
          value: owner.id,
          label: `${owner.firstName} ${owner.lastName}`,
        }))
      ];

      setOwnerMapping(mapping);
      setOwnerOptions(options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load owners';
      setError(errorMessage);
      console.error('Failed to load owners:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOwners = useCallback(() => {
    return loadOwners();
  }, [loadOwners]);

  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  return {
    ownerMapping,
    ownerOptions,
    loading,
    error,
    refreshOwners,
  };
};