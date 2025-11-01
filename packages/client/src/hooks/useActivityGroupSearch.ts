import { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { ActivityGroupListParams } from '@ironlogic4/shared/types/activityGroups';

interface UseActivityGroupSearchState {
  searchQuery: string;
  page: number;
  pageSize: number;
}

interface UseActivityGroupSearchReturn extends UseActivityGroupSearchState {
  // Debounced search query
  debouncedSearchQuery: string;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;

  // Derived Values
  hasFilters: boolean;
  queryParams: ActivityGroupListParams;
}

const initialState: UseActivityGroupSearchState = {
  searchQuery: '',
  page: 1,
  pageSize: 10,
};

export const useActivityGroupSearch = (): UseActivityGroupSearchReturn => {
  const [state, setState] = useState<UseActivityGroupSearchState>(initialState);

  // Debounce search query to prevent excessive API calls
  const [debouncedSearchQuery] = useDebouncedValue(state.searchQuery, 300);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      page: 1, // Reset to first page when searching
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
    return !!debouncedSearchQuery.trim();
  }, [debouncedSearchQuery]);

  // Build query parameters for API calls
  const queryParams = useMemo((): ActivityGroupListParams => {
    const params: ActivityGroupListParams = {
      page: state.page,
      limit: state.pageSize,
    };

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    return params;
  }, [state.page, state.pageSize, debouncedSearchQuery]);

  return {
    ...state,
    debouncedSearchQuery,
    setSearchQuery,
    setPage,
    setPageSize,
    clearFilters,
    hasFilters,
    queryParams,
  };
};