import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '../services/tasksApi';

export function useTasks() {
  return useQuery(['tasks'], () => tasksApi.fetchTasks());
}

export function useTask(id?: string) {
  return useQuery(['task', id], () => tasksApi.fetchTask(id as string), { enabled: !!id });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation((data: Parameters<typeof tasksApi.createTask>[0]) => tasksApi.createTask(data), {
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation(({ id, data }: { id: string; data: any }) => tasksApi.updateTask(id, data), {
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation((id: string) => tasksApi.deleteTask(id), {
    onSuccess: () => qc.invalidateQueries(['tasks']),
  });
}
