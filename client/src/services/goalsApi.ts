import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export type GoalInput = {
  area_id: string;
  title: string;
  description?: string;
  goal_type?: string;
  start_date?: string;
  due_date?: string;
  status: string;
  priority: string;
  expected_outcome?: string;
  computed_progress?: number;
};

export type Goal = GoalInput & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

export async function fetchGoals(): Promise<Goal[]> {
  return apiGet<Goal[]>('/goals');
}

export async function fetchGoal(id: string): Promise<Goal> {
  return apiGet<Goal>(`/goals/${id}`);
}

export async function createGoal(data: GoalInput): Promise<Goal> {
  return apiPost<Goal>('/goals', data);
}

export async function updateGoal(id: string, data: GoalInput): Promise<Goal> {
  return apiPut<Goal>(`/goals/${id}`, data);
}

export async function deleteGoal(id: string): Promise<void> {
  await apiDelete<void>(`/goals/${id}`);
}

export default { fetchGoals, fetchGoal, createGoal, updateGoal, deleteGoal };
