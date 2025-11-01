import { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { ActivityTemplateListParams, ActivityType } from '@ironlogic4/shared/types/activityTemplates';

interface UseActivityTemplateSearchState {
  searchQuery: string;
  typeFilter: ActivityType | '';
  groupFilter: string;
  page: number;
  pageSize: number;
}

interface UseActivityTemplateSearchReturn extends UseActivityTemplateSearchState {
  // Debounced search query
  debouncedSearchQuery: string;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: ActivityType | '') => void;
  setGroupFilter: (groupId: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;

  // Derived Values
  hasFilters: boolean;
  queryParams: ActivityTemplateListParams;
}

const initialState: UseActivityTemplateSearchState = {
  searchQuery: '',
  typeFilter: '',
  groupFilter: '',
  page: 1,
  pageSize: 10,
};

export const useActivityTemplateSearch = (): UseActivityTemplateSearchReturn => {
  const [state, setState] = useState<UseActivityTemplateSearchState>(initialState);

  // Debounce search query to prevent excessive API calls
  const [debouncedSearchQuery] = useDebouncedValue(state.searchQuery, 300);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      page: 1, // Reset to first page when searching
    }));
  }, []);

  const setTypeFilter = useCallback((type: ActivityType | '') => {
    setState(prev => ({
      ...prev,
      typeFilter: type,
      page: 1, // Reset to first page when filtering
    }));
  }, []);

  const setGroupFilter = useCallback((groupId: string) => {
    setState(prev => ({
      ...prev,
      groupFilter: groupId,
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
    return !!(debouncedSearchQuery.trim() || state.typeFilter || state.groupFilter);
  }, [debouncedSearchQuery, state.typeFilter, state.groupFilter]);

  // Build query parameters for API calls
  const queryParams = useMemo((): ActivityTemplateListParams => {
    const params: ActivityTemplateListParams = {
      page: state.page,
      limit: state.pageSize,
    };

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    if (state.typeFilter) {
      params.type = state.typeFilter;
    }

    if (state.groupFilter) {
      params.groupId = state.groupFilter;
    }

    return params;
  }, [state.page, state.pageSize, debouncedSearchQuery, state.typeFilter, state.groupFilter]);

  return {
    ...state,
    debouncedSearchQuery,
    setSearchQuery,
    setTypeFilter,
    setGroupFilter,
    setPage,
    setPageSize,
    clearFilters,
    hasFilters,
    queryParams,
  };
};