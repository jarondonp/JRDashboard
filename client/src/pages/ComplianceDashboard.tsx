import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  Button,
  MetricCard,
  ProgressCard,
  ListCard,
  Tabs,
} from '../components';
import { LineChart, BarChart } from '../components/charts';
import { useGoals, useAreas, useTasks, useProjects } from '../hooks';
import { ProjectFilterDropdown } from '../components/ProjectFilterDropdown';

type WindowOption = '30' | '60' | '90';

const WINDOW_CHOICES: Record<WindowOption, { label: string; days: number }> = {
  '30': { label: 'Últimos 30 días', days: 30 },
  '60': { label: 'Últimos 60 días', days: 60 },
  '90': { label: 'Últimos 90 días', days: 90 },
};

const DEFAULT_AREA_COLOR = '#0ea5e9';
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const UPCOMING_WINDOW_MS = 7 * DAY_IN_MS;

const normalizeDate = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const formatShortDate = (value?: Date) => {
  if (!value) return 'Sin fecha definida';
  return value.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const withinWindow = (date?: string | null, days?: number) => {
  if (!days) return true;
  const parsed = normalizeDate(date);
  if (!parsed) return false;
  const now = new Date();
  const diff = now.getTime() - parsed.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
};

function ComplianceDashboard() {
  const navigate = useNavigate();
  const { data: goals, isLoading: goalsLoading, error: goalsError } = useGoals();
  const { data: areas, isLoading: areasLoading } = useAreas();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects } = useProjects();

  const [windowOption, setWindowOption] = useState<WindowOption>('60');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'by-area' | 'compliance'>('compliance');

  const handleTabChange = (tabId: 'list' | 'by-area' | 'compliance') => {
    setActiveTab(tabId);
    if (tabId === 'list') {
      navigate('/goals');
      return;
    }
    if (tabId === 'by-area') {
      navigate('/goals/by-area');
      return;
    }
    navigate('/analytics/compliance');
  };

  const windowDays = WINDOW_CHOICES[windowOption].days;
  const areaFilter = selectedArea || undefined;

  const areaMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null }>();
    (areas ?? []).forEach((area) => {
      map.set(area.id, { name: area.name, color: area.color ?? DEFAULT_AREA_COLOR });
    });
    return map;
  }, [areas]);

  const projectMap = useMemo(() => {
    const map = new Map<string, { code?: string; title: string }>();
    (projects ?? []).forEach((project) => {
      map.set(project.id, { code: project.code, title: project.title });
    });
    return map;
  }, [projects]);

  const filteredGoals = useMemo(() => {
    if (!goals) return [];
    return goals.filter((goal) => {
      if (areaFilter && goal.area_id !== areaFilter) return false;
      if (selectedProject && goal.project_id !== selectedProject) return false;

      const completedAt = normalizeDate(goal.updated_at);
      if (goal.status === 'completada' && completedAt) {
        return withinWindow(goal.updated_at, windowDays);
      }
      if (goal.status !== 'completada') {
        return true;
      }
      return false;
    });
  }, [goals, areaFilter, selectedProject, windowDays]);

  const summary = useMemo(() => {
    if (!filteredGoals.length) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        completionRate: 0,
        avgProgress: 0,
      };
    }
    const totals = filteredGoals.reduce(
      (acc, goal) => {
        acc.total += 1;
        if (goal.status === 'completada') acc.completed += 1;
        if (goal.status === 'en_progreso') acc.inProgress += 1;
        if (goal.status === 'pendiente') acc.pending += 1;
        acc.progressSum += goal.computed_progress ?? 0;
        return acc;
      },
      { total: 0, completed: 0, inProgress: 0, pending: 0, progressSum: 0 },
    );
    return {
      total: totals.total,
      completed: totals.completed,
      inProgress: totals.inProgress,
      pending: totals.pending,
      completionRate: totals.total > 0 ? Math.round((totals.completed / totals.total) * 100) : 0,
      avgProgress: totals.total > 0 ? Math.round(totals.progressSum / totals.total) : 0,
    };
  }, [filteredGoals]);

  const areaRankings = useMemo(() => {
    if (!goals) return [];
    const map = new Map<
      string,
      { name: string; color: string | null; total: number; completed: number; progressSum: number }
    >();

    goals.forEach((goal) => {
      if (!withinWindow(goal.updated_at, windowDays)) return;
      if (areaFilter && goal.area_id !== areaFilter) return;
      if (selectedProject && goal.project_id !== selectedProject) return;

      const areaInfo = areaMap.get(goal.area_id);
      if (!areaInfo) return;
      const entry =
        map.get(goal.area_id) ?? { name: areaInfo.name, color: areaInfo.color, total: 0, completed: 0, progressSum: 0 };
      entry.total += 1;
      if (goal.status === 'completada') entry.completed += 1;
      entry.progressSum += goal.computed_progress ?? 0;
      map.set(goal.area_id, entry);
    });

    return Array.from(map.entries())
      .map(([id, entry]) => ({
        id,
        name: entry.name,
        color: entry.color,
        total: entry.total,
        completed: entry.completed,
        completionRate: entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
        avgProgress: entry.total > 0 ? Math.round(entry.progressSum / entry.total) : 0,
      }))
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [areaMap, goals, windowDays, areaFilter, selectedProject]);

  const trendData = useMemo(() => {
    if (!goals) return [];
    const grouped = new Map<string, { completed: number; total: number }>();
    goals.forEach((goal) => {
      if (!withinWindow(goal.updated_at, windowDays)) return;
      if (areaFilter && goal.area_id !== areaFilter) return;
      if (selectedProject && goal.project_id !== selectedProject) return;

      const updated = normalizeDate(goal.updated_at);
      const key = updated ? `${updated.getFullYear()}-${updated.getMonth() + 1}` : 'sin-fecha';
      const entry = grouped.get(key) ?? { completed: 0, total: 0 };
      entry.total += 1;
      if (goal.status === 'completada') entry.completed += 1;
      grouped.set(key, entry);
    });
    return Array.from(grouped.entries())
      .map(([key, entry]) => ({
        label: key,
        cumplimiento: entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
        completadas: entry.completed,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [goals, windowDays, areaFilter, selectedProject]);

  const performanceList = useMemo(() => {
    if (!areaRankings.length) return [];
    return areaRankings.slice(0, 5).map((entry) => ({
      id: entry.id,
      title: entry.name,
      subtitle: `${entry.completed}/${entry.total} metas completadas`,
      badge: {
        text: `${entry.completionRate}%`,
        color: entry.completionRate >= 80 ? ('green' as const) : entry.completionRate >= 50 ? ('yellow' as const) : ('red' as const),
      },
    }));
  }, [areaRankings]);

  const riskList = useMemo(() => {
    if (!filteredGoals.length) return [];
    return filteredGoals
      .filter((goal) => (goal.status !== 'completada' && (goal.computed_progress ?? 0) < 50))
      .slice(0, 5)
      .map((goal) => {
        const projectInfo = goal.project_id ? projectMap.get(goal.project_id) : null;
        const projectPrefix = projectInfo?.code ? `[${projectInfo.code}] ` : '';

        return {
          id: goal.id,
          title: goal.title,
          subtitle: `${projectPrefix}Progreso ${goal.computed_progress ?? 0}% · Prioridad ${goal.priority}`,
          badge: {
            text: goal.status === 'en_progreso' ? 'En progreso' : 'Pendiente',
            color: goal.status === 'en_progreso' ? ('yellow' as const) : ('red' as const),
          },
        };
      });
  }, [filteredGoals, projectMap]);

  const taskSummary = useMemo(() => {
    if (!tasks) {
      return {
        total: 0,
        completed: 0,
        onTrack: 0,
        overdue: 0,
        dueSoon: 0,
        dueSoonItems: [] as Array<{ id: string; title: string; subtitle: string; badge?: { text: string; color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' }; date?: string }>,
      };
    }

    // Filter tasks by area and project
    const filteredTasks = tasks.filter((task) => {
      if (areaFilter && task.area_id !== areaFilter) return false;

      // For project filtering, we need to check the associated goal's project_id
      // Since we don't have direct access to goal details for every task here easily without a lookup,
      // we can rely on the fact that we have 'goals' available.
      if (selectedProject) {
        const taskGoal = goals?.find(g => g.id === task.goal_id);
        if (!taskGoal || taskGoal.project_id !== selectedProject) return false;
      }

      return true;
    });

    const now = new Date();

    const summary = {
      total: filteredTasks.length,
      completed: 0,
      onTrack: 0,
      overdue: 0,
      dueSoon: 0,
    };

    const dueCandidates: Array<{ task: (typeof filteredTasks)[number]; due?: Date }> = [];

    filteredTasks.forEach((task) => {
      const due = normalizeDate(task.due_date);
      const status = task.status;

      if (status === 'completada') {
        summary.completed += 1;
        return;
      }

      if (due && due.getTime() < now.getTime()) {
        summary.overdue += 1;
        dueCandidates.push({ task, due });
        return;
      }

      if (due && due.getTime() - now.getTime() <= UPCOMING_WINDOW_MS) {
        summary.dueSoon += 1;
        dueCandidates.push({ task, due });
      }

      summary.onTrack += 1;
    });

    const dueSoonItems = dueCandidates
      .sort((a, b) => {
        const aTime = a.due ? a.due.getTime() : Number.POSITIVE_INFINITY;
        const bTime = b.due ? b.due.getTime() : Number.POSITIVE_INFINITY;
        return aTime - bTime;
      })
      .slice(0, 8)
      .map(({ task, due }) => {
        const dueDate = due;
        const isOverdue = dueDate ? dueDate.getTime() < now.getTime() : false;
        const diffMs = dueDate ? Math.abs(dueDate.getTime() - now.getTime()) : 0;
        const diffDays = dueDate ? Math.ceil(diffMs / DAY_IN_MS) : undefined;
        const areaInfo = areaMap.get(task.area_id);

        // Get project info for the task
        const taskGoal = goals?.find(g => g.id === task.goal_id);
        const projectInfo = taskGoal?.project_id ? projectMap.get(taskGoal.project_id) : null;
        const projectPrefix = projectInfo?.code ? `[${projectInfo.code}] ` : '';

        const subtitleParts = [] as string[];
        if (projectPrefix) subtitleParts.push(projectPrefix.trim());

        if (dueDate) {
          subtitleParts.push(isOverdue ? `Atrasada desde ${formatShortDate(dueDate)}` : `Vence ${formatShortDate(dueDate)}`);
        } else {
          subtitleParts.push('Sin fecha definida');
        }
        if (areaInfo) subtitleParts.push(areaInfo.name);

        let badgeText = 'Sin fecha';
        if (dueDate) {
          if (isOverdue) {
            badgeText = 'Atrasada';
          } else if (diffDays === 0) {
            badgeText = 'Hoy';
          } else if (diffDays === 1) {
            badgeText = 'Mañana';
          } else {
            badgeText = `En ${diffDays} días`;
          }
        }

        return {
          id: task.id ?? task.title,
          title: task.title,
          subtitle: subtitleParts.join(' · '),
          badge: dueDate
            ? {
              text: badgeText,
              color: isOverdue ? ('red' as const) : ('yellow' as const),
            }
            : undefined,
          date: dueDate ? dueDate.toLocaleDateString('es-ES') : undefined,
        };
      });

    return {
      ...summary,
      dueSoonItems,
    };
  }, [tasks, areaFilter, selectedProject, goals, areaMap, projectMap]);

  const activeTasksTotal = Math.max(taskSummary.total - taskSummary.completed, 0);

  const isLoading = goalsLoading || areasLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 p-8">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (goalsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 p-8">
        <Card>
          <CardBody>
            <p className="text-red-600">Error: {goalsError.message}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-sky-600 via-cyan-600 to-emerald-600 text-white px-8 py-10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">📊 Panel de Cumplimiento</h1>
          <p className="text-sky-100 max-w-2xl">
            Monitorea el avance por área, identifica tendencias y detecta dónde enfocar esfuerzos para alcanzar los objetivos.
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
        <Card className="overflow-visible">
          <CardBody className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Área</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={selectedArea}
                  onChange={(event) => setSelectedArea(event.target.value)}
                >
                  <option value="">Todas las áreas</option>
                  {(areas ?? []).map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Proyecto</label>
                <ProjectFilterDropdown
                  selectedProject={selectedProject}
                  onChange={setSelectedProject}
                  projects={projects ?? []}
                />
              </div>

              <div className="flex-1 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Ventana temporal</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(WINDOW_CHOICES) as WindowOption[]).map((key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={windowOption === key ? 'primary' : 'ghost'}
                      onClick={() => setWindowOption(key)}
                    >
                      {WINDOW_CHOICES[key].label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            icon="🎯"
            title="Metas completadas"
            value={`${summary.completed}/${summary.total}`}
            subtitle="En este periodo"
            color="green"
          />
          <MetricCard
            icon="📈"
            title="Tasa de cumplimiento"
            value={`${summary.completionRate}%`}
            subtitle="Metas completadas vs total"
            color="blue"
          />
          <MetricCard
            icon="⚖️"
            title="Metas activas"
            value={summary.inProgress}
            subtitle={`${summary.pending} pendientes`}
            color="yellow"
          />
          <MetricCard
            icon="📉"
            title="Progreso medio"
            value={`${summary.avgProgress}%`}
            subtitle="Metas en seguimiento"
            color="purple"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProgressCard
            title="Tareas completadas"
            current={taskSummary.completed}
            total={taskSummary.total}
            subtitle="Respecto al total en la vista"
            color="green"
          />
          <ProgressCard
            title="Tareas en riesgo"
            current={taskSummary.overdue}
            total={activeTasksTotal}
            subtitle={`${taskSummary.dueSoon} vencen pronto`}
            color="red"
          />
          <ProgressCard
            title="Tareas en curso"
            current={taskSummary.onTrack}
            total={activeTasksTotal}
            subtitle="Pendientes sin retraso"
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de cumplimiento</h2>
              <LineChart
                data={trendData}
                xKey="label"
                lines={[
                  { key: 'cumplimiento', name: '% cumplimiento', color: '#0ea5e9' },
                  { key: 'completadas', name: 'Metas completadas', color: '#22c55e' },
                ]}
                height={320}
              />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Áreas destacadas</h2>
              <ListCard
                items={performanceList}
                title="Top desempeño"
                emptyMessage="Aún no hay datos en este rango"
              />
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cumplimiento por área</h2>
              <BarChart
                data={areaRankings}
                xKey="name"
                bars={[
                  { key: 'completionRate', name: '% cumplimiento', color: '#0ea5e9' },
                  { key: 'avgProgress', name: 'Progreso promedio', color: '#6366f1' },
                ]}
                height={360}
              />
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Tareas próximas</h2>
              <ListCard
                title="Próximas fechas límite"
                items={taskSummary.dueSoonItems}
                emptyMessage="Sin tareas próximas a vencer"
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Metas en riesgo (Top 5)</h2>
            <ListCard
              title="Metas en riesgo"
              items={riskList}
              emptyMessage="Sin metas en riesgo en este rango"
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default ComplianceDashboard;