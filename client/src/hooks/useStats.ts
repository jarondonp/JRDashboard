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

      // Calcular cumplimiento de metas del mes
      const monthGoals = goals?.filter(g => {
        if (!g.due_date) return false;
        const dueDate = new Date(g.due_date);
        return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
      }) || [];

      const completedGoals = monthGoals.filter(g => g.status === 'completada' || g.status === 'completed');
      
      // Calcular tasa de completaci\u00f3n usando el progreso computado de las metas
      const goalCompletionRate = monthGoals.length > 0 
        ? Math.round(monthGoals.reduce((sum, g) => sum + (g.computed_progress || 0), 0) / monthGoals.length)
        : 0;

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
        totalMonthGoals: monthGoals.length,
        completedGoals: completedGoals.length,
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
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const criticalDocs = documents?.filter(doc => {
        if (!doc.review_date) return false;
        const reviewDate = new Date(doc.review_date);
        return reviewDate >= now && reviewDate <= thirtyDaysLater;
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
      const now = new Date();
      
      const openTasks = tasks?.filter(t => 
        t.status !== 'completada' && t.status !== 'completed'
      ) || [];

      const overdue = openTasks.filter(t => {
        if (!t.due_date) return false;
        return new Date(t.due_date) < now;
      });

      const today = openTasks.filter(t => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate.toDateString() === now.toDateString();
      });

      return {
        total: openTasks.length,
        overdue: overdue.length,
        today: today.length,
        tasks: openTasks,
      };
    },
    enabled: !!tasks,
  });
}
