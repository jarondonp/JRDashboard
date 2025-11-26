import { useQuery } from '@tanstack/react-query';
import { fetchGlobalSearch } from '../services/searchApi';
import type { GlobalSearchResponse } from '../services/searchApi';

interface UseGlobalSearchOptions {
  enabled?: boolean;
  limit?: number;
}

export function useGlobalSearch(query: string, options: UseGlobalSearchOptions = {}) {
  const searchTerm = query.trim();
  const enabled = (options.enabled ?? true) && searchTerm.length >= 2;

  return useQuery<GlobalSearchResponse>({
    queryKey: ['global-search', searchTerm, options.limit],
    queryFn: () => fetchGlobalSearch(searchTerm, options.limit),
    enabled,
    staleTime: 30_000,
  });
}


