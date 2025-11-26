import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Modal,
  ModalFooter,
  useToast,
} from '../components';
import { useAreas, useGoals, useTasks, useUpdateTask } from '../hooks';
import type { Task } from '../services/tasksApi';

type RescheduleModalState =
  | { open: false }
  | { open: true; task: Task; newDate: string };

const normalizeDate = (value?: string | null) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const formatDate = (value?: string | null) => {
  const parsed = normalizeDate(value);
  if (!parsed) return 'Sin fecha';
  return parsed.toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });
};

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const calculateDaysOverdue = (dueDate: string) => {
  const due = normalizeDate(dueDate);
  if (!due) return 0;
  const today = startOfToday();
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
};

const buildTaskPayload = (task: Task, overrides: Partial<Task> & { status?: string }) => ({
  area_id: task.area_id,
  goal_id: task.goal_id ?? null,
  title: task.title,
  description: task.description ?? null,
  status: overrides.status ?? task.status,
  due_date: overrides.due_date ?? task.due_date ?? null,
  estimated_effort: task.estimated_effort ?? null,
  progress_percentage:
    overrides.progress_percentage ?? (task.progress_percentage ?? (task.status === 'completada' ? 100 : 0)),
  tags: task.tags ?? [],
});

function OverdueTasksPage() {
  const { data: tasks, isLoading, error } = useTasks();
  const { data: areas } = useAreas();
  const { data: goals } = useGoals();
  const updateTask = useUpdateTask();
  const { showToast } = useToast();

  const [selectedArea, setSelectedArea] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [modalState, setModalState] = useState<RescheduleModalState>({ open: false });

  const overdueTasks = useMemo(() => {
    if (!tasks) return [];
    const today = startOfToday();
    return tasks
      .filter((task) => {
        if (!task.due_date) return false;
        if (task.status === 'completada') return false;
        const due = normalizeDate(task.due_date);
        if (!due) return false;
        return due.getTime() < today.getTime();
      })
      .map((task) => ({
        ...task,
        daysOverdue: calculateDaysOverdue(task.due_date!),
      }));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return overdueTasks
      .filter((task) => {
        if (selectedArea && task.area_id !== selectedArea) return false;
        if (selectedGoal && task.goal_id !== selectedGoal) return false;
        return true;
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [overdueTasks, selectedArea, selectedGoal]);

  const summary = useMemo(() => {
    if (filteredTasks.length === 0) {
      return { total: 0, avgDays: 0, maxDays: 0, nearingWeek: 0 };
    }
    const total = filteredTasks.length;
    const sum = filteredTasks.reduce((acc, task) => acc + task.daysOverdue, 0);
    const maxDays = filteredTasks[0]?.daysOverdue ?? 0;
    const nearingWeek = filteredTasks.filter((task) => task.daysOverdue >= 7).length;
    return {
      total,
      avgDays: Math.round(sum / total),
      maxDays,
      nearingWeek,
    };
  }, [filteredTasks]);

  const getAreaName = (id: string) => areas?.find((area) => area.id === id)?.name || 'Área sin nombre';
  const getGoalTitle = (id?: string | null) =>
    id ? goals?.find((goal) => goal.id === id)?.title || 'Meta sin título' : null;

  const handleMarkComplete = async (task: Task & { daysOverdue: number }) => {
    try {
      await updateTask.mutateAsync({
        id: task.id!,
        data: buildTaskPayload(task, { status: 'completada', progress_percentage: 100 }),
      });
      showToast('Tarea marcada como completada', 'success');
    } catch (err: any) {
      const message = err?.response?.data?.error || err.message || 'Error marcando tarea como completada';
      showToast(message, 'error');
    }
  };

  const handleRescheduleClick = (task: Task) => {
    const defaultValue = task.due_date ?? '';
    setModalState({
      open: true,
      task,
      newDate: defaultValue,
    });
  };

  const confirmReschedule = async () => {
    if (!modalState.open) return;
    const { task, newDate } = modalState;
    if (!newDate) {
      showToast('Debes seleccionar una nueva fecha', 'error');
      return;
    }
    const parsed = normalizeDate(newDate);
    if (!parsed) {
      showToast('Fecha inválida', 'error');
      return;
    }

    try {
      await updateTask.mutateAsync({
        id: task.id!,
        data: buildTaskPayload(task, { due_date: parsed.toISOString().split('T')[0] }),
      });
      showToast('Fecha reprogramada correctamente', 'success');
      setModalState({ open: false });
    } catch (err: any) {
      const message = err?.response?.data?.error || err.message || 'Error al reprogramar la tarea';
      showToast(message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-8">
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-8">
        <Card>
          <CardBody>
            <p className="text-red-600">Error: {error.message}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white px-8 py-10 shadow-lg"
      >
        <div className="max-w-7xl mx-auto space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">🚨 Tareas Atrasadas</h1>
          <p className="text-amber-100 max-w-2xl">
            Identifica las tareas que requieren atención urgente, ordenadas por días de retraso. Reprograma o
            márcalas como completadas directamente desde este panel.
          </p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total atrasadas</p>
              <p className="text-3xl font-bold text-red-600">{summary.total}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Promedio días retraso</p>
              <p className="text-3xl font-bold text-orange-600">{summary.avgDays}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mayor retraso</p>
              <p className="text-3xl font-bold text-rose-600">{summary.maxDays}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">+7 días sin atender</p>
              <p className="text-3xl font-bold text-yellow-600">{summary.nearingWeek}</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                value={selectedArea}
                onChange={(event) => {
                  setSelectedArea(event.target.value);
                  setSelectedGoal('');
                }}
              >
                <option value="">Todas las áreas</option>
                {(areas ?? []).map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
                value={selectedGoal}
                onChange={(event) => setSelectedGoal(event.target.value)}
                disabled={!selectedArea}
              >
                <option value="">Todas las metas</option>
                {(goals ?? [])
                  .filter((goal) => !selectedArea || goal.area_id === selectedArea)
                  .map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button variant="ghost" onClick={() => {
                setSelectedArea('');
                setSelectedGoal('');
              }}>
                Limpiar filtros
              </Button>
            </div>
          </CardBody>
        </Card>

        {filteredTasks.length === 0 ? (
          <Card>
            <CardBody className="py-16 text-center space-y-3">
              <p className="text-2xl">🎉</p>
              <p className="text-gray-600 font-semibold">
                No hay tareas atrasadas con los filtros seleccionados.
              </p>
              <p className="text-sm text-gray-500">
                ¡Sigue así! Mantener tu backlog al día te acerca más a tus objetivos.
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(320px,_1fr))]">
            {filteredTasks.map((task) => {
              const statusBadge =
                task.daysOverdue >= 14
                  ? 'bg-red-100 text-red-700'
                  : task.daysOverdue >= 7
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-amber-100 text-amber-700';

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card hover className="h-full" minHeightClass="min-h-[220px]">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                          <p className="text-sm text-gray-600 flex flex-wrap gap-2">
                            <span>Área: <strong>{getAreaName(task.area_id)}</strong></span>
                            {task.goal_id && (
                              <span>Meta: <strong>{getGoalTitle(task.goal_id)}</strong></span>
                            )}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge}`}>
                          {task.daysOverdue} día{task.daysOverdue === 1 ? '' : 's'} atraso
                        </span>
                      </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                      {task.description && (
                        <p className="text-sm text-gray-600">{task.description}</p>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-700">Fecha vencimiento</p>
                          <p>{formatDate(task.due_date)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-700">Estado actual</p>
                          <p className="capitalize">{task.status}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleMarkComplete(task)}
                          isLoading={updateTask.isPending}
                        >
                          Marcar completada
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRescheduleClick(task)}
                        >
                          Reprogramar
                        </Button>
                      </div>

                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {task.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                              #{tag}
                            </span>
                          ))}
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

      {modalState.open && (
        <Modal
          isOpen={modalState.open}
          onClose={() => setModalState({ open: false })}
          title="Reprogramar tarea"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              confirmReschedule();
            }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-600">
              Selecciona una nueva fecha para <strong>{modalState.task.title}</strong>.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva fecha
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                value={modalState.newDate ?? ''}
                onChange={(event) => setModalState({ ...modalState, newDate: event.target.value })}
                required
              />
            </div>
            <ModalFooter
              onCancel={() => setModalState({ open: false })}
              onSubmit={confirmReschedule}
              submitText="Actualizar fecha"
              cancelText="Cancelar"
              isLoading={updateTask.isPending}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

export default OverdueTasksPage;

