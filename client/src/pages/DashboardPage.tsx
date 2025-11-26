import { useMemo } from 'react';
import { MetricCard, ProgressCard, ListCard, Card, CardBody } from '../components';
import { 
  useMonthlyStats, 
  useRecentProgress, 
  useCriticalDocuments, 
  useOpenTasks,
  useGoals,
  useTasks,
  useProgressLogs
} from '../hooks';
import { motion } from 'framer-motion';

function DashboardPage() {
  const { data: monthlyStats, isLoading: loadingStats } = useMonthlyStats();
  const { data: recentProgress, isLoading: loadingProgress } = useRecentProgress();
  const { data: criticalDocs, isLoading: loadingDocs } = useCriticalDocuments();
  const { data: openTasks, isLoading: loadingTasks } = useOpenTasks();
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();
  const { data: progressLogs } = useProgressLogs();

  const isLoading = loadingStats || loadingProgress || loadingDocs || loadingTasks;

  // Calcular cumplimiento global de TODAS las metas (no solo del mes)
  const globalCompletion = goals && goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.computed_progress || 0), 0) / goals.length)
    : 0;

  const formatDate = (value?: string | null) => {
    if (!value) return 'Sin fecha'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
  }

  const latestLogsByTask = useMemo(() => {
    if (!progressLogs) return {} as Record<string, { title: string; date?: string; task_progress?: number }>

    type Internal = { title: string; date?: string; task_progress?: number; timestamp: number }
    const map: Record<string, Internal> = {}

    progressLogs.forEach(log => {
      if (!log.task_id) return
      const rawDate = log.date || log.created_at || ''
      const timestamp = rawDate ? new Date(rawDate).getTime() : 0
      const existing = map[log.task_id]
      if (!existing || timestamp >= existing.timestamp) {
        map[log.task_id] = {
          title: log.title,
          date: rawDate,
          task_progress: log.task_progress ?? undefined,
          timestamp,
        }
      }
    })

    return Object.fromEntries(
      Object.entries(map).map(([taskId, { title, date, task_progress }]) => [
        taskId,
        { title, date, task_progress },
      ]),
    ) as Record<string, { title: string; date?: string; task_progress?: number }>
  }, [progressLogs])

  const tasksWithRecentProgress = useMemo(() => {
    if (!progressLogs) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return progressLogs.filter(log => {
      if (!log.task_id) return false
      const rawDate = log.date || log.created_at
      if (!rawDate) return false
      const date = new Date(rawDate)
      date.setHours(0, 0, 0, 0)
      return date.getTime() === today.getTime()
    }).length
  }, [progressLogs])

  const lastTaskProgress = useMemo((): { title: string; date?: string; task_progress?: number } | undefined => {
    if (!progressLogs || progressLogs.length === 0) return undefined
    const sorted = [...progressLogs].sort((a, b) => {
      const aDate = new Date(a.date || a.created_at || '').getTime()
      const bDate = new Date(b.date || b.created_at || '').getTime()
      return bDate - aDate
    })
    const latest = sorted.find(log => log.task_id)
    if (!latest) return undefined
    return {
      title: latest.title,
      date: latest.date || latest.created_at,
      task_progress: latest.task_progress ?? undefined,
    }
  }, [progressLogs])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  // Preparar datos para metas en progreso
  const goalsInProgress = goals?.filter(g => 
    g.status === 'en_progreso' || g.status === 'in_progress'
  ).slice(0, 5).map(goal => ({
    id: goal.id,
    title: goal.title,
    subtitle: `Prioridad: ${goal.priority}`,
    badge: {
      text: `${goal.computed_progress || 0}%`,
      color: (goal.computed_progress || 0) > 50 ? 'green' as const : 'yellow' as const
    },
    date: goal.due_date || undefined
  })) || [];

  // Preparar datos para tareas pendientes
  const pendingTasks = tasks?.filter(t => 
    t.status !== 'completada' && t.status !== 'completed'
  ).slice(0, 5).map(task => {
    const latestLog = latestLogsByTask[task.id]
    const subtitleParts: string[] = []
    if (task.description) subtitleParts.push(task.description)
    subtitleParts.push(`Progreso: ${task.progress_percentage ?? 0}%`)
    if (latestLog?.date) subtitleParts.push(`Último avance: ${formatDate(latestLog.date)}`)
    return {
      id: task.id,
      title: task.title,
      subtitle: subtitleParts.join(' · '),
      badge: {
        text: `${task.progress_percentage ?? 0}%`,
        color:
          (task.progress_percentage ?? 0) >= 80
            ? ('green' as const)
            : (task.progress_percentage ?? 0) > 0
            ? ('purple' as const)
            : ('blue' as const),
      },
      date: task.due_date || undefined
    };
  }) || [];

  // Preparar datos para avances recientes
  const recentLogs = recentProgress?.logs.slice(0, 5).map(log => ({
    id: log.id,
    title: log.title,
    subtitle: log.note || '',
    badge: log.mood ? {
      text: `Mood: ${log.mood}/5`,
      color: log.mood >= 4 ? 'green' as const : log.mood >= 3 ? 'yellow' as const : 'red' as const
    } : undefined,
    date: log.date
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header with gradient */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-12 shadow-lg"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">🌈 Javier 360° Control Center</h1>
          <p className="text-indigo-100 text-lg">
            Sistema Maestro de Vida · Progreso · IA preparada
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* Sección 1: Estado General del Sistema */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Estado General del Sistema</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard
              title="Cumplimiento Global"
              value={`${globalCompletion}%`}
              subtitle="Progreso promedio de metas"
              icon="📊"
              color="blue"
            />
            <MetricCard
              title="Tareas Abiertas del Mes"
              value={openTasks?.total || 0}
              subtitle={openTasks?.overdue ? `${openTasks.overdue} atrasada${openTasks.overdue !== 1 ? 's' : ''} 🔴` : 'Al día'}
              icon="📋"
              color={openTasks?.overdue ? 'red' : 'green'}
            />
            <MetricCard
              title="Avances Esta Semana"
              value={recentProgress?.count || 0}
              subtitle={recentProgress?.lastUpdate ? `Última: ${recentProgress.lastUpdate}` : 'Sin registros'}
              icon="📈"
              color="purple"
            />
            <MetricCard
              title="Documentos Críticos"
              value={criticalDocs?.count || 0}
              subtitle={criticalDocs?.nextReviewDate ? `Próxima revisión: ${criticalDocs.nextReviewDate}` : 'Sin fechas próximas'}
              icon="📄"
              color="yellow"
            />
            <MetricCard
              title="Tareas con avance hoy"
              value={tasksWithRecentProgress}
              subtitle={
                lastTaskProgress
                  ? `Último: ${formatDate(lastTaskProgress.date)}${typeof lastTaskProgress.task_progress === 'number' ? ` · ${lastTaskProgress.task_progress}%` : ''}`
                  : 'Sin avances registrados recientemente'
              }
              icon="⚙️"
              color={tasksWithRecentProgress > 0 ? 'green' : 'yellow'}
            />
          </div>
        </motion.section>

        {/* Sección 2: Panel de Metas */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Metas del Mes</h2>
          <ProgressCard
            title="Cumplimiento de Metas"
            current={monthlyStats?.completedGoals || 0}
            total={monthlyStats?.totalMonthGoals || 0}
            subtitle="metas completadas este mes"
            color="blue"
          />
        </motion.section>

        {/* Sección 3: Metas en Progreso y Tareas */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListCard
              title="🟨 Metas en Progreso"
              items={goalsInProgress}
              emptyMessage="No hay metas en progreso"
              maxItems={5}
            />
            <ListCard
              title="⏳ Tareas Prioritarias"
              items={pendingTasks}
              emptyMessage="No hay tareas pendientes"
              maxItems={5}
            />
          </div>
        </motion.section>

        {/* Sección 4: Avances Recientes */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Avances Recientes</h2>
          <ListCard
            title="Últimos 7 días"
            items={recentLogs}
            emptyMessage="No hay avances registrados esta semana"
            maxItems={5}
          />
        </motion.section>

        {/* Sección 5: Resumen Rápido */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📌 Resumen Rápido</h2>
          <Card gradient>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600">{monthlyStats?.totalMonthGoals || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Total de metas activas</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{openTasks?.total || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Tareas pendientes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">{openTasks?.today || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Tareas de hoy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600">{recentProgress?.count || 0}</div>
                  <div className="text-sm text-gray-600 mt-1">Avances esta semana</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

export default DashboardPage;
