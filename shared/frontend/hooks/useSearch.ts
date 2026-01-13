import { useState, useEffect, useCallback } from 'react';

export interface UseSearchOptions {
  debounceMs?: number;
  initialValue?: string;
  onSearch?: (value: string) => void;
}

export interface UseSearchReturn {
  searchValue: string;
  debouncedValue: string;
  setSearchValue: (value: string) => void;
  clear: () => void;
  isSearching: boolean;
}

export function useSearch({
  debounceMs = 300,
  initialValue = '',
  onSearch,
}: UseSearchOptions = {}): UseSearchReturn {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue);
      setIsSearching(false);
      if (onSearch) {
        onSearch(searchValue);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchValue, debounceMs, onSearch]);

  const clear = useCallback(() => {
    setSearchValue('');
    setDebouncedValue('');
  }, []);

  return {
    searchValue,
    debouncedValue,
    setSearchValue,
    clear,
    isSearching,
  };
}

