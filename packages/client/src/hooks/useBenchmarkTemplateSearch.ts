import { useCallback } from 'react';
import type { BenchmarkTemplateListParams } from '../services/benchmarkTemplateApi';
import type { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import { useSearchState } from './useSearchState';

type BenchmarkFilters = { typeFilter: BenchmarkType | '' };

export const useBenchmarkTemplateSearch = () => {
  const search = useSearchState<BenchmarkFilters>({
    initialFilters: { typeFilter: '' },
    buildHasFilters: (debounced, filters) => !!debounced.trim() || !!filters.typeFilter,
    buildParams: (base, debounced, filters): BenchmarkTemplateListParams => ({
      page: base.page,
      limit: base.pageSize,
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
      ...(filters.typeFilter ? { type: filters.typeFilter } : {}),
    }),
  });

  const setTypeFilter = useCallback(
    (type: BenchmarkType | '') => search.setFilters({ typeFilter: type }),
    [search.setFilters]
  );

  return {
    searchQuery: search.searchQuery,
    debouncedSearchQuery: search.debouncedSearchQuery,
    typeFilter: search.filters.typeFilter,
    page: search.page,
    pageSize: search.pageSize,
    setSearchQuery: search.setSearchQuery,
    setTypeFilter,
    setPage: search.setPage,
    setPageSize: search.setPageSize,
    clearFilters: search.clearFilters,
    hasFilters: search.hasFilters,
    queryParams: search.queryParams as BenchmarkTemplateListParams,
  };
};
