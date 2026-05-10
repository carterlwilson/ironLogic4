import { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';

interface BaseSearchState {
  page: number;
  pageSize: number;
}

interface UseSearchStateOptions<F extends Record<string, any>> {
  initialFilters: F;
  debounceMs?: number;
  buildHasFilters: (debounced: string, filters: F) => boolean;
  buildParams: (base: BaseSearchState, debounced: string, filters: F) => any;
}

export function useSearchState<F extends Record<string, any>>(options: UseSearchStateOptions<F>) {
  const { initialFilters, debounceMs = 300, buildHasFilters, buildParams } = options;

  const [searchQuery, setSearchQueryRaw] = useState('');
  const [page, setPageRaw] = useState(1);
  const [pageSize, setPageSizeRaw] = useState(10);
  const [filters, setFiltersRaw] = useState<F>(initialFilters);

  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, debounceMs);

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryRaw(query);
    setPageRaw(1);
  }, []);

  const setPage = useCallback((p: number) => setPageRaw(p), []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeRaw(size);
    setPageRaw(1);
  }, []);

  const setFilters = useCallback((update: Partial<F>) => {
    setFiltersRaw(prev => ({ ...prev, ...update }));
    setPageRaw(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQueryRaw('');
    setFiltersRaw(initialFilters);
    setPageRaw(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = useMemo(
    () => buildHasFilters(debouncedSearchQuery, filters),
    [debouncedSearchQuery, filters] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const queryParams = useMemo(
    () => buildParams({ page, pageSize }, debouncedSearchQuery, filters),
    [page, pageSize, debouncedSearchQuery, filters] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    searchQuery,
    page,
    pageSize,
    debouncedSearchQuery,
    filters,
    setSearchQuery,
    setPage,
    setPageSize,
    setFilters,
    clearFilters,
    hasFilters,
    queryParams,
  };
}
