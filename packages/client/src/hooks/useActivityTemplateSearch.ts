import { useCallback } from 'react';
import type { ActivityTemplateListParams, ActivityType } from '@ironlogic4/shared/types/activityTemplates';
import { useSearchState } from './useSearchState';

type ActivityTemplateFilters = { typeFilter: ActivityType | ''; groupFilter: string };

export const useActivityTemplateSearch = () => {
  const search = useSearchState<ActivityTemplateFilters>({
    initialFilters: { typeFilter: '', groupFilter: '' },
    buildHasFilters: (debounced, filters) =>
      !!(debounced.trim() || filters.typeFilter || filters.groupFilter),
    buildParams: (base, debounced, filters): ActivityTemplateListParams => ({
      page: base.page,
      limit: base.pageSize,
      ...(debounced.trim() ? { search: debounced.trim() } : {}),
      ...(filters.typeFilter ? { type: filters.typeFilter } : {}),
      ...(filters.groupFilter ? { groupId: filters.groupFilter } : {}),
    }),
  });

  const setTypeFilter = useCallback(
    (type: ActivityType | '') => search.setFilters({ typeFilter: type }),
    [search.setFilters]
  );

  const setGroupFilter = useCallback(
    (groupId: string) => search.setFilters({ groupFilter: groupId }),
    [search.setFilters]
  );

  return {
    searchQuery: search.searchQuery,
    debouncedSearchQuery: search.debouncedSearchQuery,
    typeFilter: search.filters.typeFilter,
    groupFilter: search.filters.groupFilter,
    page: search.page,
    pageSize: search.pageSize,
    setSearchQuery: search.setSearchQuery,
    setTypeFilter,
    setGroupFilter,
    setPage: search.setPage,
    setPageSize: search.setPageSize,
    clearFilters: search.clearFilters,
    hasFilters: search.hasFilters,
    queryParams: search.queryParams as ActivityTemplateListParams,
  };
};
