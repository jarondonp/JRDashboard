import { useMemo, useState, useEffect, useCallback, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useProgressLogs,
  useCreateProgressLog,
  useUpdateProgressLog,
  useDeleteProgressLog,
  useAreas,
  useGoals,
  useTasks,
  useProjects,
  useCardLayout,
  useViewMode,
  useRegisterQuickAction,
} from '../hooks'
import {
  Button,
  Modal,
  ModalFooter,
  Card,
  CardHeader,
  CardBody,
  useToast,
  CardLayoutToolbar,
  ViewModeToggle,
  Tabs,
  TabsContent,
} from '../components'
import type { ProgressLog } from '../services/progressApi'
import { useDashboardParams } from '../features/dashboard/useDashboardParams'
import { filterProgressForDashboard } from '../features/dashboard/filters'
import { isProgressDashboardFilter } from '../features/dashboard/navigation'

interface ProgressFormData {
  area_id: string
  goal_id: string
  task_id: string
  task_progress: number | ''
  title: string
  note: string
  date: string
  impact_level: number | ''
  mood: number | ''
}

const createEmptyProgressForm = (): ProgressFormData => ({
  area_id: '',
  goal_id: '',
  task_id: '',
  task_progress: '',
  title: '',
  note: '',
  date: new Date().toISOString().split('T')[0],
  impact_level: '',
  mood: '',
})

function ProgressPage() {
  const { data: logs, isLoading, error } = useProgressLogs()
  const { data: areas } = useAreas()
  const { data: goals } = useGoals()
  const { data: tasks } = useTasks()
  const { data: projects } = useProjects()
  const createMutation = useCreateProgressLog()
  const updateMutation = useUpdateProgressLog()
  const deleteMutation = useDeleteProgressLog()
  const { showToast } = useToast()

  const navigate = useNavigate()
  const location = useLocation()

  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date')
  const { density, setDensity } = useCardLayout('progress')
  const { mode: viewMode, setMode: setViewMode } = useViewMode('progress:view-mode', 'table')
  const [activeTab, setActiveTab] = useState<'logs' | 'mood'>('logs')
  const {
    dashboardFilter,
    dashboardFilterLabel,
    dashboardFocus,
    dashboardFocusId,
    clearDashboardFilter,
    clearDashboardFocus,
  } = useDashboardParams()
  const progressDashboardFilter = isProgressDashboardFilter(dashboardFilter) ? dashboardFilter : null
  const activeDashboardFilterLabel = progressDashboardFilter ? dashboardFilterLabel : undefined

  const [editingLog, setEditingLog] = useState<ProgressLog | null>(null)
  const [formData, setFormData] = useState<ProgressFormData>(() => createEmptyProgressForm())

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    try {
      const submitData = {
        ...formData,
        goal_id: formData.goal_id || undefined,
        task_id: formData.task_id || undefined,
        task_progress: formData.task_progress === '' ? undefined : Number(formData.task_progress),
        impact_level: formData.impact_level || undefined,
        mood: formData.mood || undefined
      }

      if (editingLog) {
        await updateMutation.mutateAsync({ id: editingLog.id, data: submitData })
        showToast('Avance actualizado exitosamente', 'success')
      } else {
        await createMutation.mutateAsync(submitData)
        showToast('Avance registrado exitosamente', 'success')
      }
      resetForm()
    } catch (err) {
      showToast('Error al guardar avance', 'error')
      console.error('Error al guardar avance:', err)
    }
  }

  const handleEdit = (log: ProgressLog) => {
    setEditingLog(log)
    setFormData({
      area_id: log.area_id,
      goal_id: log.goal_id || '',
      task_id: log.task_id || '',
      task_progress: log.task_progress ?? '',
      title: log.title,
      note: log.note || '',
      date: log.date || new Date().toISOString().split('T')[0],
      impact_level: log.impact_level || '',
      mood: log.mood || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro de avance?')) {
      try {
        await deleteMutation.mutateAsync(id)
        showToast('Avance eliminado', 'success')
      } catch (err) {
        showToast('Error al eliminar avance', 'error')
        console.error('Error al eliminar avance:', err)
      }
    }
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingLog(null)
    setFormData(createEmptyProgressForm())
  }

  const getAreaName = (areaId: string) => {
    return areas?.find(a => a.id === areaId)?.name || 'Sin área'
  }

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return null
    return goals?.find(g => g.id === goalId)?.title || 'Meta desconocida'
  }

  const getTaskTitle = (taskId?: string) => {
    if (!taskId) return null
    return tasks?.find(t => t.id === taskId)?.title || 'Tarea desconocida'
  }

  const getProjectCodeForLog = (log: ProgressLog) => {
    if (log.task_id) {
      const task = tasks?.find(t => t.id === log.task_id)
      if (task?.project_id) {
        return projects?.find(p => p.id === task.project_id)?.code
      }
    }
    if (log.goal_id) {
      const goal = goals?.find(g => g.id === log.goal_id)
      if (goal?.project_id) {
        return projects?.find(p => p.id === goal.project_id)?.code
      }
    }
    return null
  }

  const getMoodEmoji = (mood?: number) => {
    if (!mood) return ''
    if (mood === 5) return '😄'
    if (mood === 4) return '🙂'
    if (mood === 3) return '😐'
    if (mood === 2) return '😕'
    return '😞'
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
  }

  const filteredGoals = goals?.filter(g => g.area_id === formData.area_id) || []
  const filteredTasks =
    tasks?.filter(task => {
      if (task.area_id !== formData.area_id) return false
      if (formData.goal_id) {
        return (task.goal_id || '') === formData.goal_id
      }
      return true
    }) || []

  // Compute the project associated with the selected task or goal
  const selectedProject = useMemo(() => {
    let projectId: string | null = null

    // Try to get project from selected task first
    if (formData.task_id) {
      const task = tasks?.find(t => t.id === formData.task_id)
      projectId = task?.project_id || null
    }

    // If no task or task has no project, try the goal
    if (!projectId && formData.goal_id) {
      const goal = goals?.find(g => g.id === formData.goal_id)
      projectId = goal?.project_id || null
    }

    // Find the project info
    if (projectId && projects) {
      return projects.find(p => p.id === projectId) || null
    }

    return null
  }, [formData.task_id, formData.goal_id, tasks, goals, projects])

  const filteredLogs = useMemo(() => {
    if (!logs) return []
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return [...logs]

    return logs.filter((log) => {
      const title = log.title.toLowerCase()
      const note = (log.note || '').toLowerCase()
      const areaName = getAreaName(log.area_id).toLowerCase()
      const goalTitle = log.goal_id ? (getGoalTitle(log.goal_id) || '').toLowerCase() : ''
      const taskTitle = log.task_id ? (getTaskTitle(log.task_id) || '').toLowerCase() : ''
      return [title, note, areaName, goalTitle, taskTitle].some((value) =>
        value.includes(normalized),
      )
    })
  }, [logs, searchTerm, areas, goals, tasks])

  const dashboardFilteredLogs = useMemo(() => {
    return filterProgressForDashboard(filteredLogs, progressDashboardFilter)
  }, [filteredLogs, progressDashboardFilter])

  const sortedLogs = useMemo(() => {
    const source = dashboardFilteredLogs
    return [...source].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      const aDate = a.date ? new Date(a.date).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0)
      const bDate = b.date ? new Date(b.date).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0)
      return bDate - aDate
    })
  }, [dashboardFilteredLogs, sortBy])

  const moodStats = useMemo(() => {
    if (!sortedLogs.length) {
      return {
        average: 0,
        counts: {} as Record<number, number>,
      }
    }
    const counts: Record<number, number> = {}
    let sum = 0
    let samples = 0

    sortedLogs.forEach((log) => {
      if (log.mood) {
        sum += log.mood
        samples += 1
        counts[log.mood] = (counts[log.mood] || 0) + 1
      }
    })

    const average = samples > 0 ? sum / samples : 0
    return { average, counts }
  }, [sortedLogs])

  const openCreateProgressModal = useCallback(() => {
    setActiveTab('logs')
    setEditingLog(null)
    setFormData(createEmptyProgressForm())
    setShowModal(true)
  }, [])

  useRegisterQuickAction('progress:create', openCreateProgressModal)

  useEffect(() => {
    const state = location.state as { quickAction?: string } | undefined
    if (state?.quickAction === 'progress:create') {
      openCreateProgressModal()
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate, openCreateProgressModal])

  useEffect(() => {
    if (progressDashboardFilter) {
      setActiveTab('logs')
      setViewMode('table')
    }
  }, [progressDashboardFilter, setViewMode])

  useEffect(() => {
    if (dashboardFocus === 'progress-log' && dashboardFocusId && logs) {
      const target = logs.find((log) => log.id === dashboardFocusId)
      if (target) {
        handleEdit(target)
        clearDashboardFocus()
      }
    }
  }, [dashboardFocus, dashboardFocusId, logs, clearDashboardFocus])

  const gridClass =
    density === 'compact'
      ? 'grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,_1fr))] auto-rows-[1fr]'
      : 'grid gap-6 grid-cols-[repeat(auto-fit,minmax(320px,_1fr))] auto-rows-[1fr]'

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
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <Card>
          <CardBody>
            <p className="text-red-600">Error: {error.message}</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-8 shadow-lg"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">📈 Avances</h1>
            <p className="text-indigo-100">Registra tu progreso diario</p>
          </div>
          <Button variant="secondary" onClick={openCreateProgressModal}>
            + Nuevo Avance
          </Button>
        </div>
      </motion.div>

      {/* Progress Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs
            tabs={[
              { id: 'logs', label: 'Registros', icon: '📈' },
              { id: 'mood', label: 'Mood & Impacto', icon: '💡' },
            ]}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'logs' | 'mood')}
          />

          {activeTab === 'logs' && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <CardLayoutToolbar
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Buscar por título, área, meta o nota"
                sortOptions={[
                  { value: 'date', label: 'Ordenar por fecha' },
                  { value: 'title', label: 'Ordenar alfabéticamente' },
                ]}
                sortValue={sortBy}
                onSortChange={(value) => setSortBy(value as 'date' | 'title')}
                density={density}
                onDensityChange={setDensity}
              />
              <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            </div>
          )}
        </div>

        {activeTab === 'logs' && activeDashboardFilterLabel && (
          <div className="dashboard-origin-banner">
            <span>
              Vista filtrada desde el dashboard:&nbsp;
              <strong>{activeDashboardFilterLabel}</strong>
            </span>
            <button
              type="button"
              className="dashboard-origin-banner__button"
              onClick={clearDashboardFilter}
            >
              Limpiar filtros
            </button>
          </div>
        )}

        <TabsContent>
          {activeTab === 'logs' ? (
            sortedLogs.length > 0 ? (
              viewMode === 'cards' ? (
                <motion.div
                  className={`${gridClass} mt-6`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <AnimatePresence>
                    {sortedLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card hover className="h-full" minHeightClass="min-h-[260px]">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-semibold text-gray-800 flex-1">
                                {getProjectCodeForLog(log) && (
                                  <span className="mr-2 text-indigo-600 font-mono text-sm bg-indigo-50 px-1.5 py-0.5 rounded">
                                    [{getProjectCodeForLog(log)}]
                                  </span>
                                )}
                                {log.title}
                              </h3>
                              <div className="flex gap-2 ml-2">
                                <button
                                  onClick={() => handleEdit(log)}
                                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(log.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-3">
                              <p className="text-sm text-gray-600">
                                <strong>Área:</strong> {getAreaName(log.area_id)}
                              </p>
                              {log.goal_id && (
                                <p className="text-sm text-gray-600">
                                  <strong>Meta:</strong> {getGoalTitle(log.goal_id)}
                                </p>
                              )}
                              {log.task_id && (
                                <p className="text-sm text-gray-600">
                                  <strong>Tarea:</strong> {getTaskTitle(log.task_id)}
                                </p>
                              )}
                              {log.note && (
                                <p className="text-sm text-gray-700">{log.note}</p>
                              )}

                              <div className="flex flex-wrap gap-2">
                                {log.mood && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Mood: {getMoodEmoji(log.mood)} {log.mood}/5
                                  </span>
                                )}
                                {log.impact_level && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.impact_level >= 4 ? 'bg-green-100 text-green-800' : log.impact_level >= 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                    Impacto: {log.impact_level}/5
                                  </span>
                                )}
                                {typeof log.task_progress === 'number' && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    Progreso tarea: {log.task_progress}%
                                  </span>
                                )}
                              </div>

                              {log.date && (
                                <div className="text-xs text-gray-500 pt-2 border-t">
                                  <p>Fecha: {new Date(log.date).toLocaleDateString()}</p>
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-indigo-100">
                      <thead className="bg-indigo-50/60">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-indigo-600">
                          <th className="px-4 py-3">Título</th>
                          <th className="px-4 py-3">Área</th>
                          <th className="px-4 py-3">Meta</th>
                          <th className="px-4 py-3">Tarea</th>
                          <th className="px-4 py-3">Mood / Impacto</th>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Nota</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-50 text-sm text-gray-700">
                        {sortedLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-indigo-50/40 transition">
                            <td className="px-4 py-3 font-semibold text-gray-800">
                              {getProjectCodeForLog(log) && (
                                <span className="mr-2 text-indigo-600 font-mono text-xs bg-indigo-50 px-1.5 py-0.5 rounded">
                                  [{getProjectCodeForLog(log)}]
                                </span>
                              )}
                              {log.title}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                {getAreaName(log.area_id)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {log.goal_id ? getGoalTitle(log.goal_id) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {log.task_id ? getTaskTitle(log.task_id) : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              <div className="flex flex-wrap items-center gap-2">
                                {log.mood && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-800">
                                    {getMoodEmoji(log.mood)} {log.mood}/5
                                  </span>
                                )}
                                {log.impact_level && (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${log.impact_level >= 4
                                    ? 'bg-green-100 text-green-800'
                                    : log.impact_level >= 2
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    Impacto: {log.impact_level}/5
                                  </span>
                                )}
                                {typeof log.task_progress === 'number' && (
                                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-800">
                                    Progreso tarea: {log.task_progress}%
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {log.date ? formatDate(log.date) : formatDate(log.created_at)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {log.note ? log.note : <span className="text-gray-400">Sin nota</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleEdit(log)}
                                  className="text-indigo-600 hover=text-indigo-800 transition-colors"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => handleDelete(log.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  🗑️ Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-10 text-center"
              >
                <p className="text-gray-500 text-lg">
                  Aún no has registrado avances.
                </p>
                <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
                  Registrar primer avance
                </Button>
              </motion.div>
            )
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Card minHeightClass="min-h-[160px]">
                <CardBody>
                  <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Promedio de Mood</h3>
                  <p className="mt-3 text-4xl font-bold text-gray-800">
                    {moodStats.average > 0 ? `${moodStats.average.toFixed(1)} / 5` : 'Sin datos'}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    {sortedLogs.length} registros con mood registrado.
                  </p>
                </CardBody>
              </Card>

              <Card minHeightClass="min-h-[160px]">
                <CardBody>
                  <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Distribución</h3>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                    {[5, 4, 3, 2, 1].map((value) => (
                      <div key={value} className="flex items-center gap-2">
                        <span className="text-lg">{getMoodEmoji(value)}</span>
                        <span>{value}/5</span>
                        <span className="text-xs text-gray-400">
                          {moodStats.counts[value] ?? 0} registros
                        </span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
        </TabsContent>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingLog ? 'Editar Avance' : 'Nuevo Avance'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.area_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    area_id: e.target.value,
                    goal_id: '',
                    task_id: '',
                    task_progress: '',
                  })
                }
              >
                <option value="">Seleccionar área</option>
                {areas?.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta (opcional)
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.goal_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    goal_id: e.target.value,
                    task_id: '',
                    task_progress: '',
                  })
                }
                disabled={!formData.area_id}
              >
                <option value="">Sin meta</option>
                {filteredGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>{goal.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarea (opcional)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.task_id}
              onChange={(e) => setFormData({ ...formData, task_id: e.target.value, task_progress: '' })}
              disabled={!formData.area_id}
            >
              <option value="">Sin tarea</option>
              {filteredTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            {formData.area_id && filteredTasks.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {formData.goal_id
                  ? 'No hay tareas vinculadas a esta meta. Puedes crear nuevas desde la sección de Tareas.'
                  : 'No hay tareas registradas para el área seleccionada.'}
              </p>
            )}
            {selectedProject && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                <span>📁</span>
                <span className="font-medium">Proyecto:</span>
                <span>{selectedProject.title}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mood (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: e.target.value ? parseInt(e.target.value) : '' })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impacto (1-5)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.impact_level}
                onChange={(e) => setFormData({ ...formData, impact_level: e.target.value ? parseInt(e.target.value) : '' })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                <span>Progreso de la tarea (%)</span>
                <span className="text-xs text-gray-400">{formData.task_id ? '0-100' : 'Selecciona una tarea'}</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.task_progress}
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '') {
                    setFormData({ ...formData, task_progress: '' })
                    return
                  }
                  const parsed = Math.min(100, Math.max(0, parseInt(raw, 10)))
                  setFormData({ ...formData, task_progress: Number.isNaN(parsed) ? '' : parsed })
                }}
                disabled={!formData.task_id}
                placeholder={formData.task_id ? 'Ingresa un valor entre 0 y 100' : 'Selecciona una tarea para habilitar'}
              />
            </div>
          </div>

          <ModalFooter
            onCancel={resetForm}
            onSubmit={handleSubmit}
            submitText={editingLog ? 'Actualizar' : 'Crear'}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </form>
      </Modal>
    </div>
  )
}

export default ProgressPage
