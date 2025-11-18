import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reportsApi from '../services/reportsApi';

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.fetchReports()
  });
}

export function useReport(id?: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.fetchReport(id as string),
    enabled: !!id
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof reportsApi.createReport>[0]) => reportsApi.createReport(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => reportsApi.updateReport(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.deleteReport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}
