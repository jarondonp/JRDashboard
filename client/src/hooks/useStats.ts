import { useQuery } from '@tanstack/react-query';
import { useGoals } from './useGoals';
import { useTasks } from './useTasks';
import { useProgressLogs } from './useProgress';
import { useDocuments } from './useDocuments';

// Hook para estadísticas del mes actual
export function useMonthlyStats() {
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();

  return useQuery({
    queryKey: ['monthly-stats', goals, tasks],
    queryFn: () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const parseDate = (value?: string | null) => {
        if (!value) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
      };
      const isSameMonth = (date: Date | null) =>
        !!date && date.getMonth() === currentMonth && date.getFullYear() === currentYear;

      const safeGoals = goals || [];

      const dueGoals = safeGoals.filter((goal) => isSameMonth(parseDate(goal.due_date)));

      const completedThisMonthGoals = safeGoals.filter((goal) => {
        const progress = goal.computed_progress || 0;
        if (progress < 100) return false;
        const updatedAt = parseDate(goal.updated_at);
        return isSameMonth(updatedAt);
      });

      const completedOnTimeGoals = dueGoals.filter((goal) => (goal.computed_progress || 0) >= 100);
      const pendingGoals = dueGoals.filter((goal) => (goal.computed_progress || 0) < 100);
      const completedEarlyGoals = completedThisMonthGoals.filter((goal) => {
        const dueDate = parseDate(goal.due_date);
        if (!dueDate) return true;
        if (dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth) return false;
        return dueDate.getTime() > now.getTime();
      });
      const completedLateGoals = completedThisMonthGoals.filter((goal) => {
        const dueDate = parseDate(goal.due_date);
        if (!dueDate) return false;
        if (dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth) return false;
        return dueDate.getTime() < new Date(currentYear, currentMonth, 1).getTime();
      });

      const monthTrackedGoals = [
        ...new Set([...dueGoals.map((g) => g.id), ...completedThisMonthGoals.map((g) => g.id)]),
      ];

      // Calcular tasa de completación usando el progreso computado de las metas
      const goalCompletionRate =
        dueGoals.length > 0
          ? Math.round(
              dueGoals.reduce((sum, goal) => sum + (goal.computed_progress || 0), 0) / dueGoals.length,
            )
          : 0;

      const trendWindow = 3;
      const completionTrend = Array.from({ length: trendWindow }).map((_, index) => {
        const target = new Date(currentYear, currentMonth - (trendWindow - 1 - index), 1);
        const label = target.toLocaleDateString(undefined, { month: 'short' });
        const value = safeGoals.filter((goal) => {
          const updatedAt = parseDate(goal.updated_at);
          if (!updatedAt) return false;
          const progress = goal.computed_progress || 0;
          return (
            progress >= 100 &&
            updatedAt.getFullYear() === target.getFullYear() &&
            updatedAt.getMonth() === target.getMonth()
          );
        }).length;
        return { label, value };
      });

      // Tareas abiertas del mes
      const monthTasks = tasks?.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
      }) || [];

      const openTasks = monthTasks.filter(t => t.status !== 'completada' && t.status !== 'completed');
      const overdueTasks = openTasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate < now;
      });

      return {
        goalCompletionRate,
        totalMonthGoals: dueGoals.length,
        trackedGoals: monthTrackedGoals.length,
        completedGoals: completedOnTimeGoals.length,
        completedThisMonth: completedThisMonthGoals.length,
        completedEarlyGoals: completedEarlyGoals.length,
        completedLateGoals: completedLateGoals.length,
        pendingGoals: pendingGoals.length,
        dueGoalIds: dueGoals.map((goal) => goal.id),
        pendingGoalIds: pendingGoals.map((goal) => goal.id),
        completedOnTimeGoalIds: completedOnTimeGoals.map((goal) => goal.id),
        completedEarlyGoalIds: completedEarlyGoals.map((goal) => goal.id),
        completedLateGoalIds: completedLateGoals.map((goal) => goal.id),
        completionTrend,
        openTasks: openTasks.length,
        overdueTasks: overdueTasks.length,
        totalMonthTasks: monthTasks.length,
      };
    },
    enabled: !!goals && !!tasks,
  });
}

// Hook para avances recientes (últimos 7 días)
export function useRecentProgress() {
  const { data: progressLogs } = useProgressLogs();

  return useQuery({
    queryKey: ['recent-progress', progressLogs],
    queryFn: () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentLogs = progressLogs?.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= sevenDaysAgo && logDate <= now;
      }) || [];

      // Obtener el más reciente
      const lastLog = recentLogs.length > 0 
        ? recentLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : null;

      return {
        count: recentLogs.length,
        lastUpdate: lastLog?.date || null,
        logs: recentLogs,
      };
    },
    enabled: !!progressLogs,
  });
}

// Hook para documentos críticos (próximos a vencer)
export function useCriticalDocuments() {
  const { data: documents } = useDocuments();

  return useQuery({
    queryKey: ['critical-documents', documents],
    queryFn: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const criticalDocs = documents?.filter(doc => {
        if (!doc.review_date) return false;
        const reviewDate = new Date(doc.review_date);
        return reviewDate >= today && reviewDate <= sevenDaysLater;
      }) || [];

      // Ordenar por fecha más cercana
      const sorted = criticalDocs.sort((a, b) => {
        return new Date(a.review_date!).getTime() - new Date(b.review_date!).getTime();
      });

      const nextReview = sorted.length > 0 ? sorted[0].review_date : null;

      return {
        count: criticalDocs.length,
        nextReviewDate: nextReview,
        documents: sorted,
      };
    },
    enabled: !!documents,
  });
}

// Hook para tareas pendientes
export function useOpenTasks() {
  const { data: tasks } = useTasks();

  return useQuery({
    queryKey: ['open-tasks', tasks],
    queryFn: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const openTasks = tasks?.filter(t => 
        t.status !== 'completada' && t.status !== 'completed'
      ) || [];

      const overdue = openTasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() < today.getTime();
      });

      const todayTasks = openTasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      });

      return {
        total: openTasks.length,
        overdue: overdue.length,
        today: todayTasks.length,
        tasks: openTasks,
      };
    },
    enabled: !!tasks,
  });
}
