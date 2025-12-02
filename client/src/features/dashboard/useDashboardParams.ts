import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  type DashboardFilterKey,
  DASHBOARD_FILTER_LABELS,
  isDashboardFilterKey,
} from './navigation';

export interface DashboardParams {
  dashboardFilter: DashboardFilterKey | null;
  dashboardFilterLabel?: string;
  dashboardFocus: string | null;
  dashboardFocusId?: string;
  clearDashboardFilter: () => void;
  clearDashboardFocus: () => void;
  hasDashboardParams: boolean;
}

export function useDashboardParams(): DashboardParams {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawFilter = searchParams.get('dashboardFilter');
  const dashboardFilter: DashboardFilterKey | null = isDashboardFilterKey(rawFilter) ? rawFilter : null;
  const dashboardFilterLabel = dashboardFilter ? DASHBOARD_FILTER_LABELS[dashboardFilter] : undefined;

  const dashboardFocus = searchParams.get('dashboardFocus');
  const dashboardFocusId = searchParams.get('dashboardId') ?? undefined;

  const clearDashboardFilter = useMemo(
    () => () => {
      const next = new URLSearchParams(searchParams);
      next.delete('dashboardFilter');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const clearDashboardFocus = useMemo(
    () => () => {
      const next = new URLSearchParams(searchParams);
      next.delete('dashboardFocus');
      next.delete('dashboardId');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const hasDashboardParams = dashboardFilter !== null || !!dashboardFocus;

  return {
    dashboardFilter,
    dashboardFilterLabel,
    dashboardFocus,
    dashboardFocusId,
    clearDashboardFilter,
    clearDashboardFocus,
    hasDashboardParams,
  };
}



