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
import { useAreas, useGoals, useTasks, useProjects } from '../hooks';
import type { Goal } from '../services/goalsApi';
import { ProjectFilterDropdown } from '../components/ProjectFilterDropdown';

type StatusFilter = 'all' | 'completada' | 'en_progreso' | 'pendiente';
type PriorityFilter = 'all' | 'alta' | 'media' | 'baja';
type ViewMode = 'grid' | 'list';

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
  const { data: projects } = useProjects();

  const [activeTab, setActiveTab] = useState<'list' | 'by-area' | 'compliance'>('by-area');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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
      if (selectedProject && goal.project_id !== selectedProject) return;

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
  }, [areas, goals, statusFilter, priorityFilter, searchTerm, selectedProject, tasksByArea, tasksByGoal]);

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

  const getProjectInfo = (projectId?: string | null) => {
    if (!projectId || !projects) return null;
    return projects.find(p => p.id === projectId);
  };

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
          <CardBody className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search & Project Filter Column */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700">Proyecto</label>
                    <ProjectFilterDropdown
                      selectedProject={selectedProject}
                      onChange={setSelectedProject}
                      projects={projects ?? []}
                    />
                  </div>
                </div>
              </div>

              {/* Filters Column */}
              <div className="flex-1 space-y-4">
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

                <div className="flex items-center justify-between">
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

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setPriorityFilter('all');
                      setSearchTerm('');
                      setSelectedProject('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Limpiar filtros
                  </Button>
                </div>
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
          <div className="space-y-8">
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
                  <Card className="border border-indigo-100 shadow-md overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-100">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span
                              className="inline-block w-4 h-4 rounded-full shadow-sm"
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
                          <p className="text-sm text-gray-500 mt-1">
                            {areaSummary.totalGoals} metas · {areaSummary.tasksTotal} tareas asignadas
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                              onClick={() => setViewMode('grid')}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'grid'
                                  ? 'bg-white text-indigo-600 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                              <span className="mr-1">⊞</span> Tarjetas
                            </button>
                            <button
                              onClick={() => setViewMode('list')}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list'
                                  ? 'bg-white text-indigo-600 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                              <span className="mr-1">☰</span> Lista
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                              {areaSummary.completedGoals} completadas
                            </span>
                            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                              {areaSummary.inProgressGoals} en progreso
                            </span>
                            <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                              Promedio {areaSummary.avgProgress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardBody className="space-y-6 bg-white/50">
                      <div>
                        <div className="flex justify-between text-xs font-semibold uppercase text-gray-500 mb-2">
                          <span>Avance global del área</span>
                          <span>{areaSummary.avgProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${areaSummary.avgProgress}%` }}
                            transition={{ duration: 0.6 }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          />
                        </div>
                      </div>

                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {areaSummary.goals.map((goal) => {
                            const tasksStats = tasksByGoal.get(goal.id!) ?? { total: 0, completed: 0 };
                            const tasksRate =
                              tasksStats.total > 0
                                ? Math.round((tasksStats.completed / tasksStats.total) * 100)
                                : 0;
                            const project = getProjectInfo(goal.project_id);

                            return (
                              <Card key={goal.id} className="border border-gray-100 hover:shadow-md transition-shadow duration-200">
                                <CardHeader className="pb-3">
                                  <div className="flex justify-between items-start gap-3">
                                    <div className="space-y-1">
                                      {project && (
                                        <div className="flex items-center gap-1.5 mb-1">
                                          {project.code && (
                                            <span className="font-mono text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                                              {project.code}
                                            </span>
                                          )}
                                          <span className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
                                            {project.title}
                                          </span>
                                        </div>
                                      )}
                                      <h3 className="text-lg font-semibold text-gray-800 leading-tight">{goal.title}</h3>
                                      {goal.goal_type && (
                                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                          {goal.goal_type}
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${goal.status === 'completada'
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
                                <CardBody className="space-y-4 pt-0">
                                  {goal.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">{goal.description}</p>
                                  )}

                                  <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                      <span>Progreso</span>
                                      <span className="font-medium">{goal.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${goal.progress}%` }}
                                        transition={{ duration: 0.6 }}
                                        className={`h-full rounded-full ${goal.status === 'completada' ? 'bg-emerald-500' : 'bg-indigo-500'
                                          }`}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                                    <div className="text-center flex-1 border-r border-gray-200">
                                      <p className="font-semibold text-gray-700">Inicio</p>
                                      <p>{formatDate(goal.start_date)}</p>
                                    </div>
                                    <div className="text-center flex-1">
                                      <p className="font-semibold text-gray-700">Vencimiento</p>
                                      <p>{formatDate(goal.due_date)}</p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <span className={`px-2 py-1 rounded-full font-semibold ${goal.priority === 'alta' ? 'bg-red-50 text-red-700' :
                                        goal.priority === 'media' ? 'bg-amber-50 text-amber-700' :
                                          'bg-green-50 text-green-700'
                                      }`}>
                                      Prioridad {goal.priority}
                                    </span>
                                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                                      Tareas: {tasksStats.completed}/{tasksStats.total}
                                    </span>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meta</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proyecto</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {areaSummary.goals.map((goal) => {
                                const project = getProjectInfo(goal.project_id);
                                return (
                                  <tr key={goal.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-900">{goal.title}</div>
                                      {goal.description && (
                                        <div className="text-xs text-gray-500 truncate max-w-xs">{goal.description}</div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {project ? (
                                        <div className="flex flex-col">
                                          {project.code && (
                                            <span className="text-[10px] font-mono text-indigo-600">{project.code}</span>
                                          )}
                                          <span className="text-sm text-gray-600 truncate max-w-[120px]">{project.title}</span>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${goal.status === 'completada' ? 'bg-emerald-100 text-emerald-800' :
                                          goal.status === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {goal.status.replace('_', ' ')}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${goal.status === 'completada' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${goal.progress}%` }}
                                          />
                                        </div>
                                        <span className="text-xs text-gray-500">{goal.progress}%</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {formatDate(goal.due_date)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
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

