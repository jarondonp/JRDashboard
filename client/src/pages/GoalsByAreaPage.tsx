import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  InlineCreateButton,
} from '../components';
import { useAreas, useGoals, useTasks } from '../hooks';
import type { Goal } from '../services/goalsApi';

type StatusFilter = 'all' | 'completada' | 'en_progreso' | 'pendiente';
type PriorityFilter = 'all' | 'alta' | 'media' | 'baja';

const DEFAULT_AREA_COLOR = '#6366F1';

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: 'Todas',
  completada: 'Completadas',
  en_progreso: 'En progreso',
  pendiente: 'Pendientes',
};

const PRIORITY_LABELS: Record<PriorityFilter, string> = {
  all: 'Todas',
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

const formatProgress = (value?: number | null) => {
  if (value === null || value === undefined) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface AreaSummary {
  areaId: string;
  areaName: string;
  areaColor: string | null;
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  pendingGoals: number;
  avgProgress: number;
  tasksTotal: number;
  tasksCompleted: number;
  goals: Array<
    Goal & {
      progress: number;
      tags: string[];
      tasksTotal: number;
      tasksCompleted: number;
    }
  >;
}

function GoalsByAreaPage() {
  const navigate = useNavigate();
  const { data: areas, isLoading: loadingAreas } = useAreas();
  const { data: goals, isLoading: loadingGoals, error } = useGoals();
  const { data: tasks, isLoading: loadingTasks } = useTasks();

  const [activeTab, setActiveTab] = useState<'list' | 'by-area' | 'compliance'>('by-area');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = (tabId: 'list' | 'by-area' | 'compliance') => {
    setActiveTab(tabId);
    if (tabId === 'list') {
      navigate('/goals');
      return;
    }
    if (tabId === 'compliance') {
      navigate('/analytics/compliance');
    }
  };

  const tasksByGoal = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    (tasks ?? []).forEach((task) => {
      if (!task.goal_id) return;
      const goalEntry = map.get(task.goal_id) ?? { total: 0, completed: 0 };
      goalEntry.total += 1;
      if (task.status === 'completada') {
        goalEntry.completed += 1;
      }
      map.set(task.goal_id, goalEntry);
    });
    return map;
  }, [tasks]);

  const tasksByArea = useMemo(() => {
    const totals = new Map<string, { total: number; completed: number }>();
    (tasks ?? []).forEach((task) => {
      const entry = totals.get(task.area_id) ?? { total: 0, completed: 0 };
      entry.total += 1;
      if (task.status === 'completada') {
        entry.completed += 1;
      }
      totals.set(task.area_id, entry);
    });
    return totals;
  }, [tasks]);

  const filteredSummaries = useMemo<AreaSummary[]>(() => {
    if (!areas || !goals) return [];

    const normalizedSearch = searchTerm.trim().toLowerCase();

    const goalsByArea = new Map<string, AreaSummary>();

    goals.forEach((goal) => {
      if (statusFilter !== 'all' && goal.status !== statusFilter) return;
      if (priorityFilter !== 'all' && goal.priority !== priorityFilter) return;

      const searchMatch =
        !normalizedSearch ||
        goal.title.toLowerCase().includes(normalizedSearch) ||
        (goal.description ?? '').toLowerCase().includes(normalizedSearch);
      if (!searchMatch) return;

      const area = areas.find((item) => item.id === goal.area_id);
      if (!area) return;

      const areaEntry =
        goalsByArea.get(goal.area_id) ??
        {
          areaId: area.id,
          areaName: area.name,
          areaColor: area.color ?? DEFAULT_AREA_COLOR,
          totalGoals: 0,
          completedGoals: 0,
          inProgressGoals: 0,
          pendingGoals: 0,
          avgProgress: 0,
          tasksTotal: tasksByArea.get(goal.area_id)?.total ?? 0,
          tasksCompleted: tasksByArea.get(goal.area_id)?.completed ?? 0,
          goals: [],
        };

      areaEntry.totalGoals += 1;
      if (goal.status === 'completada') areaEntry.completedGoals += 1;
      if (goal.status === 'en_progreso') areaEntry.inProgressGoals += 1;
      if (goal.status === 'pendiente') areaEntry.pendingGoals += 1;

      const goalTaskStats = tasksByGoal.get(goal.id!) ?? { total: 0, completed: 0 };
      areaEntry.goals.push({
        ...goal,
        progress: formatProgress(goal.computed_progress),
        tags: (goal.goal_type ? [goal.goal_type] : []).filter(Boolean),
        tasksTotal: goalTaskStats.total,
        tasksCompleted: goalTaskStats.completed,
      });

      goalsByArea.set(goal.area_id, areaEntry);
    });

    const summaries = Array.from(goalsByArea.values()).map((summary) => ({
      ...summary,
      avgProgress:
        summary.totalGoals > 0
          ? Math.round(
            summary.goals.reduce((acc, goal) => acc + formatProgress(goal.computed_progress), 0) /
            summary.goals.length,
          )
          : 0,
      goals: summary.goals.sort((a, b) => {
        if (a.status === b.status) return b.progress - a.progress;
        if (a.status === 'completada') return -1;
        if (b.status === 'completada') return 1;
        if (a.status === 'en_progreso') return -1;
        if (b.status === 'en_progreso') return 1;
        return 0;
      }),
    }));

    return summaries.sort((a, b) => b.avgProgress - a.avgProgress);
  }, [areas, goals, statusFilter, priorityFilter, searchTerm, tasksByArea, tasksByGoal]);

  const overallSummary = useMemo(() => {
    const totals = filteredSummaries.reduce(
      (acc, area) => {
        acc.totalGoals += area.totalGoals;
        acc.completedGoals += area.completedGoals;
        acc.totalProgress += area.avgProgress;
        return acc;
      },
      { totalGoals: 0, completedGoals: 0, totalProgress: 0 },
    );

    return {
      totalGoals: totals.totalGoals,
      completedGoals: totals.completedGoals,
      completionRate:
        totals.totalGoals > 0 ? Math.round((totals.completedGoals / totals.totalGoals) * 100) : 0,
      avgProgress:
        filteredSummaries.length > 0
          ? Math.round(totals.totalProgress / filteredSummaries.length)
          : 0,
    };
  }, [filteredSummaries]);

  const isLoading = loadingAreas || loadingGoals || loadingTasks;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 p-8">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50 p-8">
        <Card>
          <CardBody>
            <p className="text-red-600">Error: {error.message}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-8 py-10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">🎯 Metas por Área</h1>
          <p className="text-indigo-100 max-w-2xl">
            Analiza el avance de cada área, identifica metas rezagadas y detecta oportunidades de enfoque.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <div className="flex flex-wrap items-center gap-4">
          <Tabs
            tabs={[
              { id: 'list', label: 'Lista', icon: '📋' },
              { id: 'by-area', label: 'Por Área', icon: '🗺️' },
              { id: 'compliance', label: 'Cumplimiento', icon: '📏' },
            ]}
            activeTab={activeTab}
            onChange={(nextId) => handleTabChange(nextId as 'list' | 'by-area' | 'compliance')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Metas totales</p>
              <p className="text-3xl font-bold text-indigo-600">{overallSummary.totalGoals}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Metas completadas</p>
              <p className="text-3xl font-bold text-emerald-600">{overallSummary.completedGoals}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Promedio de cumplimiento</p>
              <p className="text-3xl font-bold text-purple-600">{overallSummary.avgProgress}%</p>
              <p className="text-sm text-purple-500">
                Tasa global: {overallSummary.completionRate}%
              </p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Buscar</label>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Filtra por título o descripción..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={statusFilter === key ? 'primary' : 'ghost'}
                      onClick={() => setStatusFilter(key)}
                    >
                      {STATUS_LABELS[key]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PRIORITY_LABELS) as PriorityFilter[]).map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={priorityFilter === key ? 'secondary' : 'ghost'}
                      onClick={() => setPriorityFilter(key)}
                    >
                      {PRIORITY_LABELS[key]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setSearchTerm('');
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {filteredSummaries.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center space-y-3">
              <p className="text-2xl">🔍</p>
              <p className="text-gray-600 font-semibold">No hay metas con los filtros seleccionados.</p>
              <p className="text-sm text-gray-500">Prueba ajustando el estado, prioridad o búsqueda.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSummaries.map((areaSummary) => {
              const tasksCompletionRate =
                areaSummary.tasksTotal > 0
                  ? Math.round((areaSummary.tasksCompleted / areaSummary.tasksTotal) * 100)
                  : 0;

              return (
                <motion.div
                  key={areaSummary.areaId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border border-indigo-100 shadow-md">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span
                              className="inline-block w-3 h-3 rounded-full"
                              style={{ backgroundColor: areaSummary.areaColor ?? DEFAULT_AREA_COLOR }}
                            />
                            {areaSummary.areaName}
                            <InlineCreateButton
                              type="goal"
                              initialData={{ area_id: areaSummary.areaId }}
                              className="ml-2"
                              size="sm"
                              variant="ghost"
                            />
                          </h2>
                          <p className="text-sm text-gray-500">
                            {areaSummary.totalGoals} metas · {areaSummary.tasksTotal} tareas asignadas
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                            {areaSummary.completedGoals} completadas
                          </span>
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                            {areaSummary.inProgressGoals} en progreso
                          </span>
                          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">
                            {areaSummary.pendingGoals} pendientes
                          </span>
                          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold">
                            Promedio {areaSummary.avgProgress}%
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500 mb-2">
                          Avance global del área
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${areaSummary.avgProgress}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {areaSummary.goals.map((goal) => {
                          const tasksStats = tasksByGoal.get(goal.id!) ?? { total: 0, completed: 0 };
                          const tasksRate =
                            tasksStats.total > 0
                              ? Math.round((tasksStats.completed / tasksStats.total) * 100)
                              : 0;

                          return (
                            <Card key={goal.id} className="border border-gray-100">
                              <CardHeader>
                                <div className="flex justify-between items-start gap-3">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{goal.title}</h3>
                                    {goal.goal_type && (
                                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                                        {goal.goal_type}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${goal.status === 'completada'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : goal.status === 'en_progreso'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-gray-100 text-gray-700'
                                      }`}
                                  >
                                    {goal.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </CardHeader>
                              <CardBody className="space-y-4">
                                {goal.description && (
                                  <p className="text-sm text-gray-600">{goal.description}</p>
                                )}

                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase">Progreso</p>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${goal.progress}%` }}
                                      transition={{ duration: 0.6 }}
                                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                    />
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">{goal.progress}% completado</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                                  <div>
                                    <p className="font-semibold text-gray-700">Inicio</p>
                                    <p>{formatDate(goal.start_date)}</p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-700">Vencimiento</p>
                                    <p>{formatDate(goal.due_date)}</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                                    Prioridad {goal.priority}
                                  </span>
                                  <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                                    Tareas: {tasksStats.completed}/{tasksStats.total}
                                  </span>
                                  <span className="px-2 py-1 rounded-full bg-sky-100 text-sky-700 font-semibold">
                                    Avance tareas {tasksRate}%
                                  </span>
                                </div>

                                {goal.tags && goal.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                    {goal.tags.map((tag, index) => (
                                      <span key={`${goal.id}-tag-${index}`} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </CardBody>
                            </Card>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>Metas completadas: {areaSummary.completedGoals}/{areaSummary.totalGoals}</span>
                        <span>·</span>
                        <span>Tareas completadas: {areaSummary.tasksCompleted}/{areaSummary.tasksTotal}</span>
                        <span>·</span>
                        <span>Progreso promedio: {areaSummary.avgProgress}%</span>
                        <span>·</span>
                        <span>
                          Cumplimiento de tareas: {tasksCompletionRate}% {areaSummary.tasksTotal === 0 ? '(sin tareas vinculadas)' : ''}
                        </span>
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default GoalsByAreaPage;

