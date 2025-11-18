import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as progressApi from '../services/progressApi';

export function useProgressLogs() {
  return useQuery({
    queryKey: ['progressLogs'],
    queryFn: () => progressApi.fetchProgressLogs()
  });
}

export function useProgressLog(id?: string) {
  return useQuery({
    queryKey: ['progressLog', id],
    queryFn: () => progressApi.fetchProgressLog(id as string),
    enabled: !!id
  });
}

export function useCreateProgressLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof progressApi.createProgressLog>[0]) => progressApi.createProgressLog(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressLogs'] });
      qc.invalidateQueries({ queryKey: ['monthly-stats'] });
    },
  });
}

export function useUpdateProgressLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => progressApi.updateProgressLog(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressLogs'] });
      qc.invalidateQueries({ queryKey: ['monthly-stats'] });
    },
  });
}

export function useDeleteProgressLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => progressApi.deleteProgressLog(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progressLogs'] });
      qc.invalidateQueries({ queryKey: ['monthly-stats'] });
    },
  });
}
