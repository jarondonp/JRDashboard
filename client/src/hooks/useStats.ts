import { useQuery } from '@tanstack/react-query';
import { useGoals } from './useGoals';
import { useTasks } from './useTasks';
import { useProgressLogs } from './useProgress';

// Hook para estadísticas del mes actual
export function useMonthlyStats(options?: { includeArchived?: boolean; projectIds?: string[] }) {
  const { data: goals, isLoading: loadingGoals } = useGoals();
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { data: logs, isLoading: loadingLogs } = useProgressLogs();

  return useQuery({
    queryKey: ['monthly-stats', options?.includeArchived, options?.projectIds],
    queryFn: async () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const parseDate = (dateStr?: string | null) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      const isSameMonth = (date: Date | null) =>
        !!date && date.getMonth() === currentMonth && date.getFullYear() === currentYear;

      const safeGoals = goals?.filter(g => {
        if (options?.projectIds && options.projectIds.length > 0) {
          if (g.project_id && !options.projectIds.includes(g.project_id)) return false;
          if (!g.project_id && !options.projectIds.includes('global')) return false;
        }

        if (options?.includeArchived) return true;
        return g.project_status !== 'archived' && g.project_status !== 'cancelled';
      }) || [];

      const dueGoals = safeGoals.filter((goal) => isSameMonth(parseDate(goal.due_date)));

      const completedGoals = dueGoals.filter(
        (goal) => goal.status === 'completada' || goal.status === 'completed',
      );

      const pendingGoals = dueGoals.filter(
        (goal) => goal.status !== 'completada' && goal.status !== 'completed',
      );

      // Metas completadas este mes (aunque venzan en otro mes)
      const completedThisMonth = safeGoals.filter((goal) => {
        if (goal.status !== 'completada' && goal.status !== 'completed') return false;
        // Usar updated_at como proxy de fecha de completitud si no hay log específico
        // Idealmente deberíamos buscar en los logs, pero esto es una aproximación rápida
        return isSameMonth(parseDate(goal.updated_at));
      });

      // Metas completadas anticipadamente (vencen después de este mes pero se completaron este mes)
      const completedEarlyGoals = completedThisMonth.filter((goal) => {
        const dueDate = parseDate(goal.due_date);
        if (!dueDate) return false; // Si no tiene fecha límite, no es "anticipada"
        // Si la fecha límite es en un mes futuro
        return dueDate > new Date() && dueDate.getMonth() !== currentMonth;
      });

      // Metas recuperadas (vencían antes de este mes pero se completaron este mes)
      const completedLateGoals = completedThisMonth.filter((goal) => {
        const dueDate = parseDate(goal.due_date);
        if (!dueDate) return false;
        // Si la fecha límite es en un mes pasado
        return dueDate < new Date() && dueDate.getMonth() !== currentMonth;
      });

      // Calcular tendencia de completitud (últimos 6 meses)
      const completionTrend = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(currentMonth - (5 - i));
        const month = d.getMonth();
        const year = d.getFullYear();
        const monthName = d.toLocaleString('es', { month: 'short' });

        // Esto requeriría historial, por ahora simulamos o usamos datos actuales si coinciden
        // Para una implementación real, necesitaríamos un endpoint de estadísticas históricas
        // Por ahora devolvemos datos reales solo para el mes actual
        if (month === currentMonth && year === currentYear) {
          return { label: monthName, value: completedThisMonth.length };
        }
        return { label: monthName, value: 0 };
      });

      // Tareas abiertas del mes
      const monthTasks = tasks?.filter(t => {
        if (options?.projectIds && options.projectIds.length > 0) {
          if (t.project_id && !options.projectIds.includes(t.project_id)) return false;
          if (!t.project_id && !options.projectIds.includes('global')) return false;
        }

        if (!options?.includeArchived) {
          if (t.project_status === 'archived' || t.project_status === 'cancelled') return false;
        }
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
      }) || [];

      const goalCompletionRate =
        dueGoals.length > 0
          ? Math.round(
            dueGoals.reduce((acc, g) => acc + (g.computed_progress || 0), 0) / dueGoals.length,
          )
          : 0;

      return {
        totalMonthGoals: dueGoals.length,
        completedGoals: completedGoals.length,
        pendingGoals: pendingGoals.length,
        goalCompletionRate,
        activeTasks: monthTasks.length,
        trackedGoals: safeGoals.length, // Total de metas activas monitoreadas
        completedThisMonth: completedThisMonth.length,
        completedEarlyGoals: completedEarlyGoals.length,
        completedLateGoals: completedLateGoals.length,
        completionTrend,
        pendingGoalIds: pendingGoals.map((g) => g.id),
        completedEarlyGoalIds: completedEarlyGoals.map((g) => g.id),
        completedLateGoalIds: completedLateGoals.map((g) => g.id),
      };
    },
    enabled: !loadingGoals && !loadingTasks && !loadingLogs,
  });
}

export function useRecentProgress() {
  const { data: logs } = useProgressLogs();

  return useQuery({
    queryKey: ['recent-progress'],
    queryFn: async () => {
      if (!logs) return { count: 0, lastUpdate: null, logs: [] };

      // Filtrar logs de la última semana
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const recentLogs = logs.filter((log) => {
        const date = new Date(log.date || log.created_at || '');
        return date >= oneWeekAgo;
      });

      // Ordenar por fecha descendente
      recentLogs.sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || '').getTime();
        const dateB = new Date(b.date || b.created_at || '').getTime();
        return dateB - dateA;
      });

      const lastUpdate = recentLogs.length > 0 ? recentLogs[0].date || recentLogs[0].created_at : null;

      return {
        count: recentLogs.length,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toLocaleDateString() : null,
        logs: recentLogs,
      };
    },
    enabled: !!logs,
  });
}

export function useCriticalDocuments() {
  // Implementación simulada por ahora
  return useQuery({
    queryKey: ['critical-documents'],
    queryFn: async () => {
      return {
        count: 0,
        nextReviewDate: null,
        documents: [],
      };
    },
  });
}

export function useOpenTasks(options?: { includeArchived?: boolean; projectIds?: string[] }) {
  const { data: tasks, isLoading } = useTasks();

  return useQuery({
    queryKey: ['open-tasks', options?.includeArchived, options?.projectIds],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const openTasks = tasks?.filter(t => {
        const isCompleted = t.status === 'completada' || t.status === 'completed';
        if (isCompleted) return false;

        if (options?.projectIds && options.projectIds.length > 0) {
          if (t.project_id && !options.projectIds.includes(t.project_id)) return false;
          if (!t.project_id && !options.projectIds.includes('global')) return false;
        }

        if (!options?.includeArchived) {
          if (t.project_status === 'archived' || t.project_status === 'cancelled') return false;
        }

        return true;
      }) || [];

      const overdue = openTasks.filter(t => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        due.setHours(0, 0, 0, 0);
        return due < today;
      });

      const todayTasks = openTasks.filter(t => {
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        due.setHours(0, 0, 0, 0);
        return due.getTime() === today.getTime();
      });

      return {
        total: openTasks.length,
        overdue: overdue.length,
        today: todayTasks.length,
        tasks: openTasks
      };
    },
    enabled: !isLoading,
  });
}
