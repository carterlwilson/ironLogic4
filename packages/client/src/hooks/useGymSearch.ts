import { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { GymListParams } from '@ironlogic4/shared/types/gyms';

interface UseGymSearchState {
  searchQuery: string;
  ownerFilter: string;
  page: number;
  pageSize: number;
}

interface UseGymSearchReturn extends UseGymSearchState {
  // Debounced search query
  debouncedSearchQuery: string;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setOwnerFilter: (ownerId: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;

  // Derived Values
  hasFilters: boolean;
  queryParams: GymListParams;
}

const initialState: UseGymSearchState = {
  searchQuery: '',
  ownerFilter: '',
  page: 1,
  pageSize: 10,
};

export const useGymSearch = (): UseGymSearchReturn => {
  const [state, setState] = useState<UseGymSearchState>(initialState);

  // Debounce search query to prevent excessive API calls
  const [debouncedSearchQuery] = useDebouncedValue(state.searchQuery, 300);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      page: 1, // Reset to first page when searching
    }));
  }, []);

  const setOwnerFilter = useCallback((ownerId: string) => {
    setState(prev => ({
      ...prev,
      ownerFilter: ownerId,
      page: 1, // Reset to first page when filtering
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setState(prev => ({
      ...prev,
      pageSize: size,
      page: 1, // Reset to first page when changing page size
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState({
      ...initialState,
      pageSize: state.pageSize, // Keep page size preference
    });
  }, [state.pageSize]);

  // Check if any filters are active
  const hasFilters = useMemo(() => {
    return !!(debouncedSearchQuery.trim() || state.ownerFilter);
  }, [debouncedSearchQuery, state.ownerFilter]);

  // Build query parameters for API calls
  const queryParams = useMemo((): GymListParams => {
    const params: GymListParams = {
      page: state.page,
      limit: state.pageSize,
    };

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    if (state.ownerFilter) {
      params.ownerId = state.ownerFilter;
    }

    return params;
  }, [state.page, state.pageSize, debouncedSearchQuery, state.ownerFilter]);

  return {
    ...state,
    debouncedSearchQuery,
    setSearchQuery,
    setOwnerFilter,
    setPage,
    setPageSize,
    clearFilters,
    hasFilters,
    queryParams,
  };
};