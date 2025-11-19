import { useQuery } from '@tanstack/react-query';
import { getAreaDashboard, getAreaMetrics, AreaDashboardData, AreaMetrics } from '../services/areasDashboardApi';

export function useAreaDashboard(areaId: string) {
  return useQuery({
    queryKey: ['areaD ashboard', areaId],
    queryFn: () => getAreaDashboard(areaId),
    enabled: !!areaId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useAreaMetrics(areaId: string) {
  return useQuery({
    queryKey: ['areaMetrics', areaId],
    queryFn: () => getAreaMetrics(areaId),
    enabled: !!areaId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
