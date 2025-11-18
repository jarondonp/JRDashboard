import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as progressApi from '../services/progressApi';

export function useProgressLogs() {
  return useQuery(['progressLogs'], () => progressApi.fetchProgressLogs());
}

export function useProgressLog(id?: string) {
  return useQuery(['progressLog', id], () => progressApi.fetchProgressLog(id as string), { enabled: !!id });
}

export function useCreateProgressLog() {
  const qc = useQueryClient();
  return useMutation((data: Parameters<typeof progressApi.createProgressLog>[0]) => progressApi.createProgressLog(data), {
    onSuccess: () => qc.invalidateQueries(['progressLogs']),
  });
}

export function useUpdateProgressLog() {
  const qc = useQueryClient();
  return useMutation(({ id, data }: { id: string; data: any }) => progressApi.updateProgressLog(id, data), {
    onSuccess: () => qc.invalidateQueries(['progressLogs']),
  });
}

export function useDeleteProgressLog() {
  const qc = useQueryClient();
  return useMutation((id: string) => progressApi.deleteProgressLog(id), {
    onSuccess: () => qc.invalidateQueries(['progressLogs']),
  });
}
