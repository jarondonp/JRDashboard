import { useMemo } from 'react';
import { MetricCard, ListCard, Card, CardBody } from '../components';
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
import { useDashboardNavigation } from '../features/dashboard/navigation';
import { filterTasksForDashboard } from '../features/dashboard/filters';

function DashboardPage() {
  const { data: monthlyStats, isLoading: loadingStats } = useMonthlyStats();
  const { data: recentProgress, isLoading: loadingProgress } = useRecentProgress();
  const { data: criticalDocs, isLoading: loadingDocs } = useCriticalDocuments();
  const { data: openTasks, isLoading: loadingTasks } = useOpenTasks();
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();
  const { data: progressLogs } = useProgressLogs();
  const {
    openFilter,
    openGoalDetail,
    openTaskDetail,
    openProgressLogDetail,
  } = useDashboardNavigation();

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

  const openTasksThisMonth = useMemo(() => {
    if (!openTasks?.tasks) return []
    return filterTasksForDashboard(openTasks.tasks, 'tasks-open-month')
  }, [openTasks])

  const openTasksThisMonthOverdue = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return openTasksThisMonth.filter((task) => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() < today.getTime()
    }).length
  }, [openTasksThisMonth])

  const monthNameRaw = new Intl.DateTimeFormat('es', { month: 'long' }).format(new Date())
  const monthName = monthNameRaw.charAt(0).toUpperCase() + monthNameRaw.slice(1)
  const pluralize = (value: number, singular: string, plural: string) => (value === 1 ? singular : plural)

  const totalDueGoals = monthlyStats?.totalMonthGoals ?? 0
  const completedOnTimeCount = monthlyStats?.completedGoals ?? 0
  const pendingGoalsCount = monthlyStats?.pendingGoals ?? 0
  const completedThisMonthCount = monthlyStats?.completedThisMonth ?? 0
  const earlyGoalsCount = monthlyStats?.completedEarlyGoals ?? 0
  const recoveredGoalsCount = monthlyStats?.completedLateGoals ?? 0
  const completionPercent = totalDueGoals > 0 ? Math.round((completedOnTimeCount / totalDueGoals) * 100) : 0
  const averageMonthlyProgress = monthlyStats?.goalCompletionRate ?? 0

  const summaryText = useMemo(() => {
    const parts: string[] = []
    if (totalDueGoals > 0) {
      parts.push(
        `${totalDueGoals} ${pluralize(totalDueGoals, 'meta con fecha límite', 'metas con fecha límite')} en ${monthName}`,
      )
    }
    const extraCompleted = Math.max(completedThisMonthCount - completedOnTimeCount, 0)
    if (extraCompleted > 0) {
      parts.push(
        `${extraCompleted} ${pluralize(extraCompleted, 'meta', 'metas')} finalizada${extraCompleted === 1 ? '' : 's'} este mes aunque vencen más adelante`,
      )
    }
    if (recoveredGoalsCount > 0) {
      parts.push(
        `${recoveredGoalsCount} ${pluralize(
          recoveredGoalsCount,
          'meta recuperada fuera de plazo',
          'metas recuperadas fuera de plazo',
        )}`,
      )
    }
    if (parts.length === 0) {
      return 'Aún no hay metas asociadas al mes actual.'
    }
    return parts.join(' · ')
  }, [totalDueGoals, monthName, completedThisMonthCount, completedOnTimeCount, recoveredGoalsCount])

  const trendData = monthlyStats?.completionTrend ?? []
  const trendMaxValue = trendData.reduce((max, item) => Math.max(max, item.value), 0)

  const pendingGoalsList = useMemo(() => {
    if (!goals || !monthlyStats) return []
    const ids = new Set(monthlyStats.pendingGoalIds || [])
    return goals.filter((goal) => goal.id && ids.has(goal.id))
  }, [goals, monthlyStats])

  const earlyGoalsList = useMemo(() => {
    if (!goals || !monthlyStats) return []
    const ids = new Set(monthlyStats.completedEarlyGoalIds || [])
    return goals.filter((goal) => goal.id && ids.has(goal.id))
  }, [goals, monthlyStats])

  const recoveredGoalsList = useMemo(() => {
    if (!goals || !monthlyStats) return []
    const ids = new Set(monthlyStats.completedLateGoalIds || [])
    return goals.filter((goal) => goal.id && ids.has(goal.id))
  }, [goals, monthlyStats])

  const summaryItems = useMemo(
    () => [
      {
        key: 'goals',
        value: monthlyStats?.trackedGoals ?? 0,
        valueClass: 'text-indigo-600',
        label: 'Metas monitoreadas este mes',
        action: () => openFilter('goals-active'),
      },
      {
        key: 'tasks-total',
        value: openTasks?.total ?? 0,
        valueClass: 'text-purple-600',
        label: 'Tareas pendientes',
        action: () => openFilter('tasks-pending'),
      },
      {
        key: 'tasks-today',
        value: openTasks?.today ?? 0,
        valueClass: 'text-pink-600',
        label: 'Tareas de hoy',
        action: () => openFilter('tasks-today'),
      },
      {
        key: 'progress-week',
        value: recentProgress?.count ?? 0,
        valueClass: 'text-teal-600',
        label: 'Avances esta semana',
        action: () => openFilter('progress-this-week'),
      },
    ],
    [monthlyStats?.trackedGoals, openTasks?.total, openTasks?.today, recentProgress?.count, openFilter],
  )

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
              onClick={() => openFilter('goals-overview')}
            />
            <MetricCard
              title="Tareas Abiertas del Mes"
              value={openTasksThisMonth.length}
              subtitle={
                openTasksThisMonthOverdue
                  ? `${openTasksThisMonthOverdue} atrasada${openTasksThisMonthOverdue !== 1 ? 's' : ''} 🔴`
                  : 'Al día'
              }
              icon="📋"
              color={openTasksThisMonthOverdue ? 'red' : 'green'}
              onClick={() => openFilter('tasks-open-month')}
            />
            <MetricCard
              title="Avances Esta Semana"
              value={recentProgress?.count || 0}
              subtitle={recentProgress?.lastUpdate ? `Última: ${recentProgress.lastUpdate}` : 'Sin registros'}
              icon="📈"
              color="purple"
              onClick={() => openFilter('progress-this-week')}
            />
            <MetricCard
              title="Documentos Críticos"
              value={criticalDocs?.count || 0}
              subtitle={criticalDocs?.nextReviewDate ? `Próxima revisión: ${criticalDocs.nextReviewDate}` : 'Sin fechas próximas'}
              icon="📄"
              color="yellow"
              onClick={() => openFilter('documents-critical')}
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
              onClick={() => openFilter('progress-today')}
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
          <Card>
            <CardBody>
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">Seguimiento de {monthName}</h3>
                    <p className="text-sm text-slate-500 max-w-2xl">{summaryText}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-indigo-600">{completionPercent}%</span>
                    <p className="text-xs text-slate-500">metas con fecha del mes completadas</p>
                    <p className="text-xs text-slate-400">Progreso promedio: {averageMonthlyProgress}%</p>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all"
                    style={{ width: `${Math.min(Math.max(completionPercent, 0), 100)}%` }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <button
                    type="button"
                    className="rounded-xl border border-indigo-100 bg-white/70 px-4 py-3 text-left shadow-sm transition hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    onClick={() => openFilter('goals-month-due')}
                  >
                    <span className="block text-2xl font-semibold text-indigo-600">{totalDueGoals}</span>
                    <span className="text-xs text-slate-500">Vencen en {monthName}</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-left shadow-sm transition hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    onClick={() => openFilter('goals-month-completed')}
                  >
                    <span className="block text-2xl font-semibold text-emerald-600">{completedThisMonthCount}</span>
                    <span className="text-xs text-emerald-700">Completadas este mes</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-left shadow-sm transition hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
                    onClick={() => openFilter('goals-month-pending')}
                  >
                    <span className="block text-2xl font-semibold text-amber-600">{pendingGoalsCount}</span>
                    <span className="text-xs text-amber-700">Pendientes del mes</span>
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-fuchsia-100 bg-fuchsia-50/70 px-4 py-3 text-left shadow-sm transition hover:border-fuchsia-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                    onClick={() => openFilter('goals-month-early')}
                  >
                    <span className="block text-2xl font-semibold text-fuchsia-600">{earlyGoalsCount}</span>
                    <span className="text-xs text-fuchsia-700">Finalizadas anticipadamente</span>
                  </button>
                </div>
                {trendData.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                        Historial de cierres
                      </h4>
                      <span className="text-xs text-slate-400">Últimos {trendData.length} meses</span>
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      {trendData.map(({ label, value }) => (
                        <div key={label} className="flex-1">
                          <div className="relative h-20 rounded-lg bg-indigo-50">
                            <div
                              className="absolute bottom-0 left-0 right-0 rounded-lg bg-indigo-500"
                              style={{ height: trendMaxValue > 0 ? `${(value / trendMaxValue) * 100}%` : '0%' }}
                            />
                          </div>
                          <div className="mt-1 text-center text-xs font-medium text-slate-500">{label}</div>
                          <div className="text-center text-xs text-slate-400">
                            {value} {pluralize(value, 'meta', 'metas')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pendingGoalsList.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-600">Metas pendientes clave</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pendingGoalsList.slice(0, 4).map((goal) => (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => openGoalDetail(goal.id)}
                          className="group flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        >
                          <span>{goal.title}</span>
                          <span className="text-[10px] text-amber-500">{Math.round(goal.computed_progress ?? 0)}%</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {earlyGoalsList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
                      <span>Metas finalizadas antes de lo previsto</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                        {earlyGoalsCount}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {earlyGoalsList.slice(0, 4).map((goal) => (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => openGoalDetail(goal.id)}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        >
                          {goal.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {recoveredGoalsList.length > 0 && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50/80 px-4 py-3">
                    <p className="text-sm font-medium text-orange-700">
                      {recoveredGoalsCount} {pluralize(recoveredGoalsCount, 'meta recuperada', 'metas recuperadas')} este
                      mes. Celebra el avance y ajusta la planificación para evitar retrasos futuros.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recoveredGoalsList.slice(0, 3).map((goal) => (
                        <button
                          key={goal.id}
                          type="button"
                          onClick={() => openGoalDetail(goal.id)}
                          className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-200"
                        >
                          {goal.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
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
              onItemClick={openGoalDetail}
            />
            <ListCard
              title="⏳ Tareas Prioritarias"
              items={pendingTasks}
              emptyMessage="No hay tareas pendientes"
              maxItems={5}
              onItemClick={openTaskDetail}
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
            onItemClick={openProgressLogDetail}
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
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {summaryItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.action}
                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/80 px-6 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2"
                  >
                    <span className={`text-3xl font-bold ${item.valueClass}`}>{item.value}</span>
                    <span className="text-sm font-medium text-slate-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

export default DashboardPage;
