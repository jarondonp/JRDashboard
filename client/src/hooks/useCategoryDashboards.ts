import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useAreas } from './index';
import { getAreaDashboard, AreaDashboardData } from '../services/areasDashboardApi';
import { AreaCategoryKey } from '../constants/areaCategories';
import {
  aggregateCategoryDashboards,
  buildCategorySubtitle,
  matchesCategory,
  CategorisedAreaDashboard,
} from '../utils/categoryDashboard';

interface UseCategoryDashboardsResult {
  isLoading: boolean;
  isFetching: boolean;
  error?: unknown;
  areas: any[];
  dashboards: CategorisedAreaDashboard[];
  aggregatedDashboard?: AreaDashboardData;
  subtitle: string;
}

export function useCategoryDashboards(categoryKey: AreaCategoryKey): UseCategoryDashboardsResult {
  const { data: areas, isLoading: areasLoading } = useAreas();

  const categoryAreas = useMemo(
    () => areas?.filter((area: any) => matchesCategory(area, categoryKey)) ?? [],
    [areas, categoryKey],
  );

  const dashboardQueries = useQueries({
    queries: categoryAreas.map((area) => ({
      queryKey: ['areaDashboard', area.id],
      queryFn: () => getAreaDashboard(area.id),
      staleTime: 5 * 60 * 1000,
      enabled: !!area.id,
    })),
  });

  const dashboards = useMemo(() => {
    return dashboardQueries
      .map((query, index) => {
        const rawArea = categoryAreas[index];
        const data = query.data;
        if (!rawArea || !data) {
          return null;
        }
        return {
          area: {
            id: rawArea.id,
            name: rawArea.name,
            color: rawArea.color,
            description: rawArea.description,
            icon: rawArea.icon,
          },
          dashboard: data,
        } as CategorisedAreaDashboard;
      })
      .filter((entry): entry is CategorisedAreaDashboard => entry !== null);
  }, [dashboardQueries, categoryAreas]);

  const aggregatedDashboard = useMemo(() => {
    if (!dashboards.length) {
      return undefined;
    }
    return aggregateCategoryDashboards(categoryKey, dashboards);
  }, [categoryKey, dashboards]);

  const subtitle = useMemo(() => buildCategorySubtitle(categoryAreas), [categoryAreas]);

  const isLoadingDashboards =
    dashboardQueries.some((query) => query.isLoading || query.isPending) || areasLoading;

  const isFetching = dashboardQueries.some((query) => query.isFetching);

  const error = dashboardQueries.find((query) => query.error)?.error;

  return {
    isLoading: isLoadingDashboards,
    isFetching,
    error,
    areas: categoryAreas,
    dashboards,
    aggregatedDashboard,
    subtitle,
  };
}

