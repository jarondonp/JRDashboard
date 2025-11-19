import { MetricCard, ProgressCard, ListCard, Card, CardHeader, CardBody } from '../components';
import { 
  useMonthlyStats, 
  useRecentProgress, 
  useCriticalDocuments, 
  useOpenTasks,
  useGoals,
  useTasks
} from '../hooks';
import { motion } from 'framer-motion';

function DashboardPage() {
  const { data: monthlyStats, isLoading: loadingStats } = useMonthlyStats();
  const { data: recentProgress, isLoading: loadingProgress } = useRecentProgress();
  const { data: criticalDocs, isLoading: loadingDocs } = useCriticalDocuments();
  const { data: openTasks, isLoading: loadingTasks } = useOpenTasks();
  const { data: goals } = useGoals();
  const { data: tasks } = useTasks();

  const isLoading = loadingStats || loadingProgress || loadingDocs || loadingTasks;

  // Calcular cumplimiento global de TODAS las metas (no solo del mes)
  const globalCompletion = goals && goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + (g.computed_progress || 0), 0) / goals.length)
    : 0;

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
    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
    return {
      id: task.id,
      title: task.title,
      subtitle: task.description || '',
      badge: {
        text: task.status,
        color: isOverdue ? 'red' as const : 'blue' as const
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
