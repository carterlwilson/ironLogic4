import { useState, useCallback } from 'react';

export interface UseClientSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  resetSearch: () => void;
}

const DEFAULT_PAGE_SIZE = 10;

export const useClientSearch = (): UseClientSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const resetSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    resetSearch,
  };
};