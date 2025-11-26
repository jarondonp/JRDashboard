import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export type TaskInput = {
  area_id: string;
  goal_id?: string | null;
  title: string;
  description?: string | null;
  status: string;
  due_date?: string | null;
  estimated_effort?: number | null;
  progress_percentage?: number | null;
  tags?: string[];
};

export type Task = TaskInput & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

export async function fetchTasks(): Promise<Task[]> {
  return apiGet<Task[]>('/tasks');
}

export async function fetchTask(id: string): Promise<Task> {
  return apiGet<Task>(`/tasks/${id}`);
}

export async function createTask(data: TaskInput): Promise<Task> {
  return apiPost<Task>('/tasks', data);
}

export async function updateTask(id: string, data: TaskInput): Promise<Task> {
  return apiPut<Task>(`/tasks/${id}`, data);
}

export async function deleteTask(id: string): Promise<void> {
  await apiDelete<void>(`/tasks/${id}`);
}

export default { fetchTasks, fetchTask, createTask, updateTask, deleteTask };
