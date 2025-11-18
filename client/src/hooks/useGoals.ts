import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as goalsApi from '../services/goalsApi';

export function useGoals() {
  return useQuery(['goals'], () => goalsApi.fetchGoals());
}

export function useGoal(id?: string) {
  return useQuery(['goal', id], () => goalsApi.fetchGoal(id as string), { enabled: !!id });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation((data: Parameters<typeof goalsApi.createGoal>[0]) => goalsApi.createGoal(data), {
    onSuccess: () => qc.invalidateQueries(['goals']),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation(({ id, data }: { id: string; data: any }) => goalsApi.updateGoal(id, data), {
    onSuccess: () => qc.invalidateQueries(['goals']),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation((id: string) => goalsApi.deleteGoal(id), {
    onSuccess: () => qc.invalidateQueries(['goals']),
  });
}
