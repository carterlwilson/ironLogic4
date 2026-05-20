import type { ActivityGroupListParams } from '@ironlogic4/shared/types/activityGroups';
import { useSearchState } from './useSearchState';

export const useActivityGroupSearch = () => {
  const search = useSearchState<Record<string, never>>({
    initialFilters: {} as Record<string, never>,
    buildHasFilters: (debounced) => !!debounced.trim(),
    buildParams: (base, debounced): ActivityGroupListParams => ({
      page: base.page,
      limit: base.pageSize,
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
    }),
  });

  return {
    searchQuery: search.searchQuery,
    debouncedSearchQuery: search.debouncedSearchQuery,
    page: search.page,
    pageSize: search.pageSize,
    setSearchQuery: search.setSearchQuery,
    setPage: search.setPage,
    setPageSize: search.setPageSize,
    clearFilters: search.clearFilters,
    hasFilters: search.hasFilters,
    queryParams: search.queryParams as ActivityGroupListParams,
  };
};
