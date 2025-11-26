import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchTimeline, TIMELINE_EVENT_TYPES, type TimelineEventType } from '../services/timelineApi';

export const ALL_TIMELINE_EVENT_TYPES: TimelineEventType[] = [...TIMELINE_EVENT_TYPES];

export interface UseTimelineParams {
  areaId?: string;
  eventTypes?: TimelineEventType[];
  from?: string;
  to?: string;
  pageSize?: number;
  enabled?: boolean;
}

export function useTimeline(params: UseTimelineParams) {
  const { areaId, from, to, pageSize = 20, enabled = true } = params;
  const eventTypes = params.eventTypes;

  const eventTypesKey = eventTypes && eventTypes.length
    ? [...eventTypes].sort().join('|')
    : '';

  const normalizedEventTypes = useMemo<TimelineEventType[] | undefined>(() => {
    if (!eventTypes || eventTypes.length === 0) return undefined;
    const sorted = [...eventTypes].sort();
    return sorted as TimelineEventType[];
  }, [eventTypesKey, eventTypes]);

  return useInfiniteQuery({
    queryKey: [
      'timeline',
      {
        areaId: areaId ?? null,
        eventTypes: normalizedEventTypes ?? null,
        from: from ?? null,
        to: to ?? null,
        pageSize,
      },
    ],
    queryFn: ({ pageParam }) =>
      fetchTimeline({
        cursor: typeof pageParam === 'string' ? pageParam : undefined,
        areaId: areaId || undefined,
        eventTypes: normalizedEventTypes,
        from,
        to,
        pageSize,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.nextCursor ?? undefined : undefined,
    enabled: enabled && (!normalizedEventTypes || normalizedEventTypes.length > 0),
    refetchOnWindowFocus: false,
  });
}

