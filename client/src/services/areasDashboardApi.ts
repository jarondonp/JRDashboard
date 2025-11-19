import { apiGet } from './apiClient';

export interface AreaDashboardData {
  area: {
    id: string;
    name: string;
    color: string;
    description?: string;
  };
  metrics: {
    totalGoals: number;
    completedGoals: number;
    goalCompletionRate: number;
    avgGoalProgress: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    avgTaskProgress: number;
    avgMood: number;
    progressLogsCount: number;
  };
  goals: any[];
  tasks: any[];
  progressLogs: any[];
}

export interface AreaMetrics {
  goals: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    avgProgress: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    avgProgress: number;
  };
  wellness: {
    logCount: number;
    avgMood: number;
    avgImpact: number;
  };
}

export async function getAreaDashboard(areaId: string): Promise<AreaDashboardData> {
  return apiGet(`/areas/${areaId}/dashboard`);
}

export async function getAreaGoals(areaId: string) {
  return apiGet(`/areas/${areaId}/goals`);
}

export async function getAreaTasks(areaId: string) {
  return apiGet(`/areas/${areaId}/tasks`);
}

export async function getAreaProgress(areaId: string) {
  return apiGet(`/areas/${areaId}/progress`);
}

export async function getAreaMetrics(areaId: string): Promise<AreaMetrics> {
  return apiGet(`/areas/${areaId}/metrics`);
}
