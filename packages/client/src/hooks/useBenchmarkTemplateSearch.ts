import { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import type { BenchmarkTemplateListParams } from '../services/benchmarkTemplateApi';
import type { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';

interface UseBenchmarkTemplateSearchState {
  searchQuery: string;
  typeFilter: BenchmarkType | '';
  page: number;
  pageSize: number;
}

interface UseBenchmarkTemplateSearchReturn extends UseBenchmarkTemplateSearchState {
  // Debounced search query
  debouncedSearchQuery: string;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setTypeFilter: (type: BenchmarkType | '') => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;

  // Derived Values
  hasFilters: boolean;
  queryParams: BenchmarkTemplateListParams;
}

const initialState: UseBenchmarkTemplateSearchState = {
  searchQuery: '',
  typeFilter: '',
  page: 1,
  pageSize: 10,
};

export const useBenchmarkTemplateSearch = (): UseBenchmarkTemplateSearchReturn => {
  const [state, setState] = useState<UseBenchmarkTemplateSearchState>(initialState);

  // Debounce search query to prevent excessive API calls
  const [debouncedSearchQuery] = useDebouncedValue(state.searchQuery, 300);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      page: 1, // Reset to first page when searching
    }));
  }, []);

  const setTypeFilter = useCallback((type: BenchmarkType | '') => {
    setState(prev => ({
      ...prev,
      typeFilter: type,
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
    return !!debouncedSearchQuery.trim() || !!state.typeFilter;
  }, [debouncedSearchQuery, state.typeFilter]);

  // Build query parameters for API calls
  const queryParams = useMemo((): BenchmarkTemplateListParams => {
    const params: BenchmarkTemplateListParams = {
      page: state.page,
      limit: state.pageSize,
    };

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    if (state.typeFilter) {
      params.type = state.typeFilter;
    }

    return params;
  }, [state.page, state.pageSize, debouncedSearchQuery, state.typeFilter]);

  return {
    ...state,
    debouncedSearchQuery,
    setSearchQuery,
    setTypeFilter,
    setPage,
    setPageSize,
    clearFilters,
    hasFilters,
    queryParams,
  };
};