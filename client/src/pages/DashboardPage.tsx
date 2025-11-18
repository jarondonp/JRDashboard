import { MetricCard, ProgressCard, ListCard } from '../components';
import { 
  useMonthlyStats, 
  useRecentProgress, 
  useCriticalDocuments, 
  useOpenTasks,
  useGoals,
  useTasks
} from '../hooks';
import './DashboardPage.css';

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
      <div className="dashboard-page">
        <div className="loading">Cargando dashboard...</div>
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
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header__content">
          <h1 className="dashboard-header__title">🌈 Javier 360° Control Center</h1>
          <p className="dashboard-header__subtitle">
            Sistema Maestro de Vida · Progreso · IA preparada
          </p>
        </div>
      </div>

      {/* Sección 1: Estado General del Sistema */}
      <section className="dashboard-section">
        <h2 className="dashboard-section__title">Estado General del Sistema</h2>
        <div className="dashboard-grid dashboard-grid--4">
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
      </section>

      {/* Sección 2: Panel de Metas */}
      <section className="dashboard-section">
        <h2 className="dashboard-section__title">🎯 Metas del Mes</h2>
        <div className="dashboard-grid dashboard-grid--1">
          <ProgressCard
            title="Cumplimiento de Metas"
            current={monthlyStats?.completedGoals || 0}
            total={monthlyStats?.totalMonthGoals || 0}
            subtitle="metas completadas este mes"
            color="blue"
          />
        </div>
      </section>

      {/* Sección 3: Metas en Progreso y Tareas */}
      <section className="dashboard-section">
        <div className="dashboard-grid dashboard-grid--2">
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
      </section>

      {/* Sección 4: Avances Recientes */}
      <section className="dashboard-section">
        <h2 className="dashboard-section__title">📈 Avances Recientes</h2>
        <div className="dashboard-grid dashboard-grid--1">
          <ListCard
            title="Últimos 7 días"
            items={recentLogs}
            emptyMessage="No hay avances registrados esta semana"
            maxItems={5}
          />
        </div>
      </section>

      {/* Sección 5: Resumen Rápido */}
      <section className="dashboard-section">
        <h2 className="dashboard-section__title">📌 Resumen Rápido</h2>
        <div className="dashboard-summary">
          <div className="dashboard-summary__item">
            <span className="dashboard-summary__label">Total de metas activas:</span>
            <span className="dashboard-summary__value">{monthlyStats?.totalMonthGoals || 0}</span>
          </div>
          <div className="dashboard-summary__item">
            <span className="dashboard-summary__label">Tareas pendientes:</span>
            <span className="dashboard-summary__value">{openTasks?.total || 0}</span>
          </div>
          <div className="dashboard-summary__item">
            <span className="dashboard-summary__label">Tareas de hoy:</span>
            <span className="dashboard-summary__value">{openTasks?.today || 0}</span>
          </div>
          <div className="dashboard-summary__item">
            <span className="dashboard-summary__label">Avances esta semana:</span>
            <span className="dashboard-summary__value">{recentProgress?.count || 0}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
