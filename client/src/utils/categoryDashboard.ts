import { AREA_CATEGORIES, AreaCategoryKey, AreaCategoryConfig } from '../constants/areaCategories';
import type { AreaDashboardData } from '../services/areasDashboardApi';

type AreaEntity = {
  id: string;
  name: string;
  color?: string;
  description?: string | null;
  icon?: string | null;
};

export interface CategorisedAreaDashboard {
  area: AreaEntity;
  dashboard: AreaDashboardData;
}

const COMPLETED_STATUSES = new Set(['completada', 'completed', 'done', 'terminada', 'terminado', 'aceptada', 'accepted']);

const getCategoryConfig = (category: AreaCategoryKey): AreaCategoryConfig => AREA_CATEGORIES[category];

const isItemCompleted = (status?: string | null) => {
  if (!status) return false;
  return COMPLETED_STATUSES.has(status.toLowerCase());
};

export const matchesCategory = (area: AreaEntity, categoryKey: AreaCategoryKey) => {
  const config = getCategoryConfig(categoryKey);
  const areaName = area.name.toLowerCase();
  return config.keywords.some((keyword) => areaName.includes(keyword));
};

export const buildCategorySubtitle = (areas: AreaEntity[], limit = 60) => {
  if (!areas.length) return '';
  const areaNames = areas.map((area) => area.name).join(', ');
  const base = `📊 ${areas.length} ${areas.length === 1 ? 'área' : 'áreas'} monitoreadas: `;
  return base + (areaNames.length > limit ? `${areaNames.slice(0, limit)}...` : areaNames);
};

export const annotateWithArea = <T extends Record<string, any>>(items: T[], area: AreaEntity) =>
  items.map((item) => ({
    ...item,
    __area: {
      id: area.id,
      name: area.name,
      color: area.color,
    },
  }));

export const aggregateCategoryDashboards = (
  categoryKey: AreaCategoryKey,
  entries: CategorisedAreaDashboard[],
): AreaDashboardData => {
  const categoryConfig = getCategoryConfig(categoryKey);

  const goals = entries.flatMap(({ area, dashboard }) => annotateWithArea(dashboard.goals ?? [], area));
  const tasks = entries.flatMap(({ area, dashboard }) => annotateWithArea(dashboard.tasks ?? [], area));
  const progressLogs = entries
    .flatMap(({ area, dashboard }) => annotateWithArea(dashboard.progressLogs ?? [], area))
    .sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return dateB - dateA;
    });

  const totalGoals = goals.length;
  const completedGoals = goals.filter((goal) => isItemCompleted(goal.status)).length;
  const totalGoalProgress = goals.reduce((sum, goal) => sum + (goal.computed_progress ?? 0), 0);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => isItemCompleted(task.status)).length;
  const totalTaskProgress = tasks.reduce((sum, task) => sum + (task.progress_percentage ?? 0), 0);

  const moodLogs = progressLogs.filter((log) => typeof log.mood === 'number');
  const moodAverage = moodLogs.length
    ? moodLogs.reduce((sum, log) => sum + (log.mood ?? 0), 0) / moodLogs.length
    : 0;

  return {
    area: {
      id: `${categoryKey}-overview`,
      name: categoryConfig.panelTitle,
      color: categoryConfig.panelColor,
      description: buildCategorySubtitle(entries.map((entry) => entry.area)),
    },
    metrics: {
      totalGoals,
      completedGoals,
      goalCompletionRate: totalGoals ? (completedGoals / totalGoals) * 100 : 0,
      avgGoalProgress: totalGoals ? totalGoalProgress / totalGoals : 0,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks ? (completedTasks / totalTasks) * 100 : 0,
      avgTaskProgress: totalTasks ? totalTaskProgress / totalTasks : 0,
      avgMood: moodAverage,
      progressLogsCount: progressLogs.length,
    },
    goals,
    tasks,
    progressLogs,
  };
};

