import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as areasApi from '../services/areasApi';

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: () => areasApi.fetchAreas()
  });
}

export function useArea(id?: string) {
  return useQuery({
    queryKey: ['area', id],
    queryFn: () => areasApi.fetchArea(id as string),
    enabled: !!id
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof areasApi.createArea>[0]) => areasApi.createArea(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      qc.invalidateQueries({ queryKey: ['areaDashboard'] });
    },
  });
}

export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => areasApi.updateArea(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      qc.invalidateQueries({ queryKey: ['areaDashboard'] });
    },
  });
}

export function useDeleteArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => areasApi.deleteArea(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['areas'] });
      qc.invalidateQueries({ queryKey: ['areaDashboard'] });
    },
  });
}
