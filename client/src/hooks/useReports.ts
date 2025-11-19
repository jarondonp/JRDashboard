import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reportsApi from '../services/reportsApi';
import { useGoals } from './useGoals';
import { useTasks } from './useTasks';
import { useProgressLogs } from './useProgress';
import { useAreas } from './useAreas';

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.fetchReports()
  });
}

export function useReport(id?: string) {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.fetchReport(id as string),
    enabled: !!id
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof reportsApi.createReport>[0]) => reportsApi.createReport(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => reportsApi.updateReport(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportsApi.deleteReport(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

// Hook para Reporte Ejecutivo Mensual
export function useMonthlyExecutiveReport() {
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();
  const { data: progressLogs } = useProgressLogs();
  const { data: areas } = useAreas();

  return useQuery({
    queryKey: ['monthly-executive-report', goals, tasks, progressLogs],
    queryFn: () => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // KPIs principales
      const completedGoals = goals?.filter(g => g.status === 'completada').length || 0;
      const totalGoals = goals?.length || 0;
      const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

      const completedTasks = tasks?.filter(t => t.status === 'completada').length || 0;
      const totalTasks = tasks?.length || 0;

      const totalHours = tasks?.reduce((sum, t) => sum + (t.estimated_effort || 0), 0) || 0;

      // Tendencia diaria de progreso (últimos 30 días)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      const dailyProgress = last30Days.map(date => {
        const dayLogs = progressLogs?.filter(p => p.date === date) || [];
        const avgMood = dayLogs.length > 0
          ? dayLogs.reduce((sum, p) => sum + (p.mood || 0), 0) / dayLogs.length
          : 0;
        
        return {
          date: new Date(date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
          avances: dayLogs.length,
          mood: Math.round(avgMood * 10) / 10
        };
      });

      // Cumplimiento por área
      const areaPerformance = areas?.map(area => {
        const areaGoals = goals?.filter(g => g.area_id === area.id) || [];
        const avgProgress = areaGoals.length > 0
          ? Math.round(areaGoals.reduce((sum, g) => sum + (g.computed_progress || 0), 0) / areaGoals.length)
          : 0;
        
        return {
          area: area.name,
          progreso: avgProgress,
          color: area.color
        };
      }) || [];

      // Top 5 logros del mes
      const monthProgress = progressLogs?.filter(p => {
        const date = new Date(p.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }) || [];

      const topAchievements = monthProgress
        .filter(p => (p.impact_level || 0) >= 4)
        .sort((a, b) => (b.impact_level || 0) - (a.impact_level || 0))
        .slice(0, 5)
        .map(p => ({
          title: p.title,
          impact: p.impact_level,
          date: new Date(p.date).toLocaleDateString()
        }));

      return {
        kpis: {
          completionRate,
          completedGoals,
          totalGoals,
          completedTasks,
          totalTasks,
          totalHours,
          avgMood: monthProgress.length > 0
            ? Math.round((monthProgress.reduce((sum, p) => sum + (p.mood || 0), 0) / monthProgress.length) * 10) / 10
            : 0
        },
        dailyProgress,
        areaPerformance,
        topAchievements
      };
    },
    enabled: !!goals && !!tasks && !!progressLogs && !!areas
  });
}

// Hook para Análisis de Productividad por Área
export function useAreaProductivityReport() {
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();
  const { data: areas } = useAreas();
  const { data: progressLogs } = useProgressLogs();

  return useQuery({
    queryKey: ['area-productivity-report', goals, tasks, areas, progressLogs],
    queryFn: () => {
      // Balance de vida (Radar)
      const radarData = areas?.map(area => {
        const areaGoals = goals?.filter(g => g.area_id === area.id) || [];
        const avgProgress = areaGoals.length > 0
          ? Math.round(areaGoals.reduce((sum, g) => sum + (g.computed_progress || 0), 0) / areaGoals.length)
          : 0;
        
        return {
          area: area.name,
          progreso: avgProgress
        };
      }) || [];

      // Tareas por estado en cada área
      const tasksByArea = areas?.map(area => {
        const areaTasks = tasks?.filter(t => t.area_id === area.id) || [];
        const completed = areaTasks.filter(t => t.status === 'completada').length;
        const inProgress = areaTasks.filter(t => t.status === 'en_progreso').length;
        const pending = areaTasks.filter(t => t.status === 'pendiente').length;

        return {
          area: area.name.substring(0, 10),
          completadas: completed,
          en_progreso: inProgress,
          pendientes: pending
        };
      }) || [];

      return {
        radarData,
        tasksByArea
      };
    },
    enabled: !!goals && !!tasks && !!areas && !!progressLogs
  });
}

// Hook para Tendencias de Mood y Bienestar
export function useMoodTrendsReport() {
  const { data: progressLogs } = useProgressLogs();
  const { data: tasks } = useTasks();

  return useQuery({
    queryKey: ['mood-trends-report', progressLogs, tasks],
    queryFn: () => {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      // Mood vs Productividad
      const moodVsProductivity = last30Days.map(date => {
        const dayLogs = progressLogs?.filter(p => p.date === date) || [];
        const dayCompletedTasks = tasks?.filter(t => {
          const completed = new Date(t.updated_at || '').toISOString().split('T')[0];
          return completed === date && t.status === 'completada';
        }).length || 0;

        const avgMood = dayLogs.length > 0
          ? Math.round((dayLogs.reduce((sum, p) => sum + (p.mood || 0), 0) / dayLogs.length) * 10) / 10
          : 0;

        return {
          date: new Date(date).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
          mood: avgMood,
          tareas: dayCompletedTasks
        };
      });

      // Distribución de mood por semana
      const weeklyMood = [];
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - ((3 - i) * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekLogs = progressLogs?.filter(p => {
          const date = new Date(p.date);
          return date >= weekStart && date <= weekEnd;
        }) || [];

        const avgMood = weekLogs.length > 0
          ? Math.round((weekLogs.reduce((sum, p) => sum + (p.mood || 0), 0) / weekLogs.length) * 10) / 10
          : 0;

        weeklyMood.push({
          semana: `Sem ${i + 1}`,
          mood: avgMood,
          registros: weekLogs.length
        });
      }

      // Estadísticas generales
      const allMoods = progressLogs?.map(p => p.mood).filter(m => m) || [];
      const avgMood = allMoods.length > 0
        ? Math.round((allMoods.reduce((a, b) => a! + b!, 0)! / allMoods.length) * 10) / 10
        : 0;

      const bestDay = moodVsProductivity.reduce((best, day) => 
        day.mood > best.mood ? day : best
      , { date: '', mood: 0, tareas: 0 });

      const worstDay = moodVsProductivity.filter(d => d.mood > 0).reduce((worst, day) => 
        day.mood < worst.mood ? day : worst
      , { date: '', mood: 10, tareas: 0 });

      return {
        moodVsProductivity,
        weeklyMood,
        stats: {
          avgMood,
          bestDay,
          worstDay,
          totalLogs: progressLogs?.length || 0
        }
      };
    },
    enabled: !!progressLogs && !!tasks
  });
}
