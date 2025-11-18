import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export type ProgressLogInput = {
  area_id: string;
  goal_id?: string;
  task_id?: string;
  title: string;
  note?: string;
  date: string; // ISO date
  impact_level?: number;
  mood?: number;
};

export type ProgressLog = ProgressLogInput & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

export async function fetchProgressLogs(): Promise<ProgressLog[]> {
  return apiGet<ProgressLog[]>('/progress-logs');
}

export async function fetchProgressLog(id: string): Promise<ProgressLog> {
  return apiGet<ProgressLog>(`/progress-logs/${id}`);
}

export async function createProgressLog(data: ProgressLogInput): Promise<ProgressLog> {
  return apiPost<ProgressLog>('/progress-logs', data);
}

export async function updateProgressLog(id: string, data: ProgressLogInput): Promise<ProgressLog> {
  return apiPut<ProgressLog>(`/progress-logs/${id}`, data);
}

export async function deleteProgressLog(id: string): Promise<void> {
  await apiDelete<void>(`/progress-logs/${id}`);
}

export default { fetchProgressLogs, fetchProgressLog, createProgressLog, updateProgressLog, deleteProgressLog };
