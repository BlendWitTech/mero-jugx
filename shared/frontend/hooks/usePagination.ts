import { useState, useCallback } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  totalItems?: number;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  totalPages: number;
  skip: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  reset: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  totalItems = 0,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const totalPages = Math.ceil(totalItems / limit) || 1;
  const skip = (page - 1) * limit;

  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToPage = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages],
  );

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    totalPages,
    skip,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
    reset,
    hasNextPage,
    hasPrevPage,
  };
}

