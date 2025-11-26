import { apiGet } from './apiClient';

export type GlobalSearchEntityType = 'area' | 'goal' | 'task' | 'document';

export interface GlobalSearchHit {
  id: string;
  type: GlobalSearchEntityType;
  title: string;
  subtitle?: string;
  path: string;
  area?: {
    id: string;
    name: string;
    color: string | null;
  };
  meta?: Record<string, unknown>;
}

export interface GlobalSearchResponse {
  query: string;
  results: {
    areas: GlobalSearchHit[];
    goals: GlobalSearchHit[];
    tasks: GlobalSearchHit[];
    documents: GlobalSearchHit[];
  };
}

export async function fetchGlobalSearch(query: string, limit?: number) {
  const params = new URLSearchParams();
  params.set('q', query);
  if (limit !== undefined) {
    params.set('limit', String(limit));
  }

  return apiGet<GlobalSearchResponse>(`/search?${params.toString()}`);
}


