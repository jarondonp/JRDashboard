import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reportsApi from '../services/reportsApi';

export function useReports() {
  return useQuery(['reports'], () => reportsApi.fetchReports());
}

export function useReport(id?: string) {
  return useQuery(['report', id], () => reportsApi.fetchReport(id as string), { enabled: !!id });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation((data: Parameters<typeof reportsApi.createReport>[0]) => reportsApi.createReport(data), {
    onSuccess: () => qc.invalidateQueries(['reports']),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation(({ id, data }: { id: string; data: any }) => reportsApi.updateReport(id, data), {
    onSuccess: () => qc.invalidateQueries(['reports']),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation((id: string) => reportsApi.deleteReport(id), {
    onSuccess: () => qc.invalidateQueries(['reports']),
  });
}
