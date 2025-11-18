import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as goalsApi from '../services/goalsApi';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => goalsApi.fetchGoals()
  });
}

export function useGoal(id?: string) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: () => goalsApi.fetchGoal(id as string),
    enabled: !!id
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof goalsApi.createGoal>[0]) => goalsApi.createGoal(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => goalsApi.updateGoal(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsApi.deleteGoal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
