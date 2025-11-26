import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import * as progressApi from '../services/progressApi';
import type { ProgressLogInput } from '../services/progressApi';

const invalidateProgressRelatedQueries = (qc: QueryClient) => {
  qc.invalidateQueries({ queryKey: ['progressLogs'] });
  qc.invalidateQueries({ queryKey: ['tasks'] });
  qc.invalidateQueries({ queryKey: ['goals'] });
  qc.invalidateQueries({ queryKey: ['areas'] });
  qc.invalidateQueries({ queryKey: ['monthly-stats'] });
};

export function useProgressLogs() {
  return useQuery({
    queryKey: ['progressLogs'],
    queryFn: () => progressApi.fetchProgressLogs(),
  });
}

export function useProgressLog(id?: string) {
  return useQuery({
    queryKey: ['progressLog', id],
    queryFn: () => progressApi.fetchProgressLog(id as string),
    enabled: !!id,
  });
}

export function useCreateProgressLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof progressApi.createProgressLog>[0]) =>
      progressApi.createProgressLog(data),
    onSuccess: () => invalidateProgressRelatedQueries(qc),
  });
}

export function useUpdateProgressLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProgressLogInput }) =>
      progressApi.updateProgressLog(id, data),
    onSuccess: () => invalidateProgressRelatedQueries(qc),
  });
}

export function useDeleteProgressLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => progressApi.deleteProgressLog(id),
    onSuccess: () => invalidateProgressRelatedQueries(qc),
  });
}
