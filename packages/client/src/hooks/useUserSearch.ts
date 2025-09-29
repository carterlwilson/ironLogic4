import { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { UserListParams } from '../services/userApi';

interface UseUserSearchState {
  searchQuery: string;
  roleFilter: string;
  page: number;
  pageSize: number;
}

interface UseUserSearchReturn extends UseUserSearchState {
  // Debounced search query
  debouncedSearchQuery: string;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setRoleFilter: (role: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;

  // Derived Values
  hasFilters: boolean;
  queryParams: UserListParams;
}

const initialState: UseUserSearchState = {
  searchQuery: '',
  roleFilter: '',
  page: 1,
  pageSize: 10,
};

export const useUserSearch = (): UseUserSearchReturn => {
  const [state, setState] = useState<UseUserSearchState>(initialState);

  // Debounce search query to prevent excessive API calls
  const [debouncedSearchQuery] = useDebouncedValue(state.searchQuery, 300);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      page: 1, // Reset to first page when searching
    }));
  }, []);

  const setRoleFilter = useCallback((role: string) => {
    setState(prev => ({
      ...prev,
      roleFilter: role,
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
    return !!(debouncedSearchQuery.trim() || state.roleFilter);
  }, [debouncedSearchQuery, state.roleFilter]);

  // Build query parameters for API calls
  const queryParams = useMemo((): UserListParams => {
    const params: UserListParams = {
      page: state.page,
      limit: state.pageSize,
    };

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    if (state.roleFilter) {
      params.role = state.roleFilter;
    }

    return params;
  }, [state.page, state.pageSize, debouncedSearchQuery, state.roleFilter]);

  return {
    ...state,
    debouncedSearchQuery,
    setSearchQuery,
    setRoleFilter,
    setPage,
    setPageSize,
    clearFilters,
    hasFilters,
    queryParams,
  };
};