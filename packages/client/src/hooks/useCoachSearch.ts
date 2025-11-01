import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '@mantine/hooks';
import type { CoachListParams } from '@ironlogic4/shared/types/coaches';

interface UseCoachSearchReturn {
  // Current filter values
  searchQuery: string;
  gymId: string;
  page: number;
  pageSize: number;

  // Debounced search query
  debouncedSearchQuery: string;

  // Search Actions
  setSearchQuery: (query: string) => void;
  setGymId: (gymId: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearFilters: () => void;

  // Derived Values
  hasFilters: boolean;
  queryParams: CoachListParams;
}

export const useCoachSearch = (): UseCoachSearchReturn => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract values from URL
  const searchQuery = searchParams.get('search') || '';
  const gymId = searchParams.get('gymId') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('limit') || '10', 10);

  // Debounce search query to prevent excessive API calls
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);

  const setSearchQuery = useCallback((query: string) => {
    setSearchParams(params => {
      if (query.trim()) {
        params.set('search', query.trim());
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // Reset to first page when searching
      return params;
    });
  }, [setSearchParams]);

  const setGymId = useCallback((gymId: string) => {
    setSearchParams(params => {
      if (gymId) {
        params.set('gymId', gymId);
      } else {
        params.delete('gymId');
      }
      params.set('page', '1'); // Reset to first page when filtering
      return params;
    });
  }, [setSearchParams]);

  const setPage = useCallback((page: number) => {
    setSearchParams(params => {
      params.set('page', String(page));
      return params;
    });
  }, [setSearchParams]);

  const setPageSize = useCallback((size: number) => {
    setSearchParams(params => {
      params.set('limit', String(size));
      params.set('page', '1'); // Reset to first page when changing page size
      return params;
    });
  }, [setSearchParams]);

  const clearFilters = useCallback(() => {
    setSearchParams(params => {
      params.delete('search');
      params.delete('gymId');
      params.set('page', '1');
      // Keep page size preference
      return params;
    });
  }, [setSearchParams]);

  // Check if any filters are active
  const hasFilters = useMemo(() => {
    return !!debouncedSearchQuery.trim() || !!gymId;
  }, [debouncedSearchQuery, gymId]);

  // Build query parameters for API calls
  const queryParams = useMemo((): CoachListParams => {
    const params: CoachListParams = {
      page,
      limit: pageSize,
    };

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    if (gymId) {
      params.gymId = gymId;
    }

    return params;
  }, [page, pageSize, debouncedSearchQuery, gymId]);

  return {
    searchQuery,
    gymId,
    page,
    pageSize,
    debouncedSearchQuery,
    setSearchQuery,
    setGymId,
    setPage,
    setPageSize,
    clearFilters,
    hasFilters,
    queryParams,
  };
};