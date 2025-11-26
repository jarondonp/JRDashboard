import { apiGet } from './apiClient';

export const TIMELINE_EVENT_TYPES = ['progress_log', 'task_completed', 'goal_completed', 'document_added'] as const;

export type TimelineEventType = typeof TIMELINE_EVENT_TYPES[number];

export interface TimelineEventEntity {
  id: string;
  title: string | null;
}

export interface TimelineEventArea {
  id: string;
  name: string;
  color: string | null;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  area: TimelineEventArea;
  goal?: TimelineEventEntity | null;
  task?: TimelineEventEntity | null;
  date: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface TimelinePagination {
  hasMore: boolean;
  nextCursor: string | null;
}

export interface TimelineResponse {
  items: TimelineEvent[];
  pagination: TimelinePagination;
}

export interface FetchTimelineParams {
  pageSize?: number;
  cursor?: string;
  areaId?: string;
  eventTypes?: TimelineEventType[];
  from?: string;
  to?: string;
}

export async function fetchTimeline(params: FetchTimelineParams = {}): Promise<TimelineResponse> {
  const searchParams = new URLSearchParams();

  if (params.pageSize) {
    searchParams.set('pageSize', String(params.pageSize));
  }
  if (params.cursor) {
    searchParams.set('cursor', params.cursor);
  }
  if (params.areaId) {
    searchParams.set('areaId', params.areaId);
  }
  if (params.eventTypes && params.eventTypes.length > 0) {
    params.eventTypes.forEach((type) => searchParams.append('eventType', type));
  }
  if (params.from) {
    searchParams.set('from', params.from);
  }
  if (params.to) {
    searchParams.set('to', params.to);
  }

  const queryString = searchParams.toString();
  const path = queryString.length ? `/timeline?${queryString}` : '/timeline';

  return apiGet<TimelineResponse>(path);
}

