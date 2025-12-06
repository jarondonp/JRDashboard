import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useTasks,
  useDeleteTask,
  useAreas,
  useGoals,
  useProgressLogs,
  useCardLayout,
  useViewMode,
  useRegisterQuickAction,
  useProjects,
} from '../hooks'
import {
  Card,
  CardHeader,
  CardBody,
  useToast,
  CardLayoutToolbar,
  ViewModeToggle,
  Tabs,
  InlineCreateButton,
} from '../components'
import { useGlobalModal } from '../context/GlobalModalContext'
import type { Task } from '../services/tasksApi'
import { useDashboardParams } from '../features/dashboard/useDashboardParams'
import { filterTasksForDashboard } from '../features/dashboard/filters'
import { isTaskDashboardFilter } from '../features/dashboard/navigation'

const KANBAN_STATUSES = [
  { id: 'pendiente', label: 'Pendientes', icon: '📝', accent: '#6366F1' },
  { id: 'en_progreso', label: 'En progreso', icon: '🚀', accent: '#f97316' },
  { id: 'bloqueada', label: 'Bloqueadas', icon: '⛔', accent: '#ef4444' },
  { id: 'completada', label: 'Completadas', icon: '✅', accent: '#10b981' },
]

function TasksPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { data: tasks, isLoading, error } = useTasks()
  const { data: areas } = useAreas()
  const { data: goals } = useGoals()
  const { data: progressLogs } = useProgressLogs()
  const { data: projects } = useProjects()
  const deleteMutation = useDeleteTask()
  const { showToast } = useToast()

  const formatDate = (value?: string | null) => {
    if (!value) return 'Sin fecha'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
  }

  const latestLogsByTask = useMemo(() => {
    if (!progressLogs) return {} as Record<string, { title: string; date?: string; task_progress?: number }>

    type InternalLogInfo = { title: string; date?: string; task_progress?: number; timestamp: number }
    const entries: Record<string, InternalLogInfo> = {}

    progressLogs.forEach((log) => {
      if (!log.task_id) return
      const baseDate = log.date || log.created_at || ''
      const timestamp = baseDate ? new Date(baseDate).getTime() : 0
      const existing = entries[log.task_id]

      if (!existing || timestamp >= existing.timestamp) {
        entries[log.task_id] = {
          title: log.title,
          date: baseDate,
          task_progress: log.task_progress ?? undefined,
          timestamp,
        }
      }
    })

    return Object.fromEntries(
      Object.entries(entries).map(([taskId, { title, date, task_progress }]) => [
        taskId,
        { title, date, task_progress },
      ]),
    ) as Record<string, { title: string; date?: string; task_progress?: number }>
  }, [progressLogs])

  const [activeTab, setActiveTab] = useState<'list' | 'overdue' | 'kanban'>('list')
  const { openModal } = useGlobalModal()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [sortBy, setSortBy] = useState<'progress' | 'due_date' | 'title'>('progress')
  const { density, setDensity } = useCardLayout('tasks')
  const { mode: viewMode, setMode: setViewMode } = useViewMode('tasks:view-mode', 'table')
  const {
    dashboardFilter,
    dashboardFilterLabel,
    dashboardFocus,
    dashboardFocusId,
    clearDashboardFilter,
    clearDashboardFocus,
  } = useDashboardParams()
  const taskDashboardFilter = isTaskDashboardFilter(dashboardFilter) ? dashboardFilter : null
  const activeDashboardFilterLabel = taskDashboardFilter ? dashboardFilterLabel : undefined

  const handleTabChange = (tabId: 'list' | 'overdue' | 'kanban') => {
    setActiveTab(tabId)
    if (tabId === 'overdue') {
      navigate('/tasks/overdue')
      return
    }
    if (tabId === 'list') {
      navigate('/tasks')
    }
  }



  const handleEdit = (task: Task) => {
    openModal('task', 'edit', task)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      try {
        await deleteMutation.mutateAsync(id)
        showToast('Tarea eliminada', 'success')
      } catch (err) {
        showToast('Error al eliminar tarea', 'error')
        console.error('Error al eliminar tarea:', err)
      }
    }
  }





  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completada': return 'bg-green-100 text-green-800'
      case 'en_progreso': return 'bg-yellow-100 text-yellow-800'
      case 'pendiente': return 'bg-blue-100 text-blue-800'
      case 'bloqueada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAreaName = (areaId: string) => {
    return areas?.find(a => a.id === areaId)?.name || 'Sin área'
  }

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return null
    return goals?.find(g => g.id === goalId)?.title || 'Meta desconocida'
  }

  const getProjectName = (projectId?: string | null) => {
    if (!projectId) return 'Global'
    return projects?.find(p => p.id === projectId)?.title || 'Proyecto desconocido'
  }

  const getProjectCode = (projectId?: string | null) => {
    if (!projectId) return null
    return projects?.find(p => p.id === projectId)?.code
  }



  const filteredTasksList = useMemo(() => {
    if (!tasks) return []

    return tasks.filter((task) => {
      // Always check project filter first
      const matchesProject = selectedProjectId ? task.project_id === selectedProjectId : true
      if (!matchesProject) return false

      // Then apply search filter if search term exists
      const normalizedSearch = searchTerm.trim().toLowerCase()
      if (!normalizedSearch) return true // No search term, just use project filter

      const title = task.title.toLowerCase()
      const description = (task.description || '').toLowerCase()
      const status = task.status.toLowerCase()
      const areaName = getAreaName(task.area_id).toLowerCase()
      const goalTitle = task.goal_id ? (getGoalTitle(task.goal_id) || '').toLowerCase() : ''
      const projectName = getProjectName(task.project_id).toLowerCase()
      const tags = (task.tags || []).join(' ').toLowerCase()

      const matchesSearch = [title, description, status, areaName, goalTitle, projectName, tags].some((value) =>
        value.includes(normalizedSearch),
      )

      return matchesSearch
    })
  }, [tasks, searchTerm, areas, goals, selectedProjectId, projects])

  const dashboardFilteredTasks = useMemo(() => {
    return filterTasksForDashboard(filteredTasksList, taskDashboardFilter)
  }, [filteredTasksList, taskDashboardFilter])

  const sortedTasksList = useMemo(() => {
    return [...dashboardFilteredTasks].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'due_date') {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY
        const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY
        return aDate - bDate
      }
      const aProgress = a.progress_percentage ?? 0
      const bProgress = b.progress_percentage ?? 0
      return bProgress - aProgress
    })
  }, [dashboardFilteredTasks, sortBy])

  useEffect(() => {
    if (!taskDashboardFilter) return
    setActiveTab('list')
    setViewMode('table')
  }, [taskDashboardFilter, setViewMode])

  useEffect(() => {
    if (dashboardFocus === 'task' && dashboardFocusId && tasks) {
      const target = tasks.find((task) => task.id === dashboardFocusId)
      if (target) {
        handleEdit(target)
        clearDashboardFocus()
      }
    }
  }, [dashboardFocus, dashboardFocusId, tasks, clearDashboardFocus])

  const kanbanColumns = useMemo(() => {
    const baseColumns = KANBAN_STATUSES.map((status) => ({
      ...status,
      tasks: filteredTasksList
        .filter((task) => task.status === status.id)
        .sort((a, b) => {
          const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY
          const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY
          return aDate - bDate
        }),
    }))

    const unmatched = filteredTasksList.filter(
      (task) => !KANBAN_STATUSES.some((status) => status.id === task.status),
    )

    if (unmatched.length > 0) {
      baseColumns.push({
        id: 'otros',
        label: 'Otros estados',
        icon: '🗂️',
        accent: '#64748b',
        tasks: unmatched,
      })
    }

    return baseColumns
  }, [filteredTasksList])



  useRegisterQuickAction('task:create', () => openModal('task', 'create'))

  useEffect(() => {
    const state = location.state as { tasksTab?: 'list' | 'overdue' | 'kanban'; quickAction?: string } | undefined
    if (!state) return

    if (state.tasksTab === 'overdue') {
      navigate('/tasks/overdue', { replace: true, state: {} })
      return
    }

    let shouldClearState = false

    if (state.tasksTab && state.tasksTab !== activeTab) {
      setActiveTab(state.tasksTab)
      shouldClearState = true
    }

    if (state.quickAction === 'task:create') {
      openModal('task', 'create')
      shouldClearState = true
    }

    if (shouldClearState) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [activeTab, location.pathname, location.state, navigate, openModal])

  const gridClass =
    density === 'compact'
      ? 'grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,_1fr))] auto-rows-[1fr]'
      : 'grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,_1fr))] auto-rows-[1fr]'

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
            <h1 className="text-3xl font-bold mb-1">✅ Tareas</h1>
            <p className="text-indigo-100">Gestiona tus tareas y actividades</p>
          </div>
          <InlineCreateButton
            type="task"
            label="+ Nueva Tarea"
            variant="secondary"
          />
        </div>
      </motion.div>

      {/* Tasks Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <Tabs
            tabs={[
              { id: 'list', label: 'Lista', icon: '📋' },
              { id: 'overdue', label: 'Atrasadas', icon: '⏰' },
              { id: 'kanban', label: 'Kanban', icon: '🗂️' },
            ]}
            activeTab={activeTab}
            onChange={(nextId) => handleTabChange(nextId as 'list' | 'overdue' | 'kanban')}
          />
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardLayoutToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por título, área, meta o tag"
            sortOptions={[
              { value: 'progress', label: 'Ordenar por progreso' },
              { value: 'due_date', label: 'Ordenar por fecha límite' },
              { value: 'title', label: 'Ordenar alfabéticamente' },
            ]}
            sortValue={sortBy}
            onSortChange={(value) => setSortBy(value as 'progress' | 'due_date' | 'title')}
            density={density}
            onDensityChange={setDensity}
          />

          <div className="flex items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Todos los proyectos</option>
              {projects?.map(project => (
                <option key={project.id} value={project.id}>{project.title}</option>
              ))}
            </select>
          </div>

          {activeTab === 'list' && <ViewModeToggle mode={viewMode} onChange={setViewMode} />}
        </div>
        {activeDashboardFilterLabel && (
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
        {activeTab === 'list' && (
          <>
            {sortedTasksList.length > 0 ? (
              viewMode === 'cards' ? (
                <motion.div
                  className={`${gridClass} mt-6`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <AnimatePresence>
                    {sortedTasksList.map((task, index) => {
                      const taskProgress = task.progress_percentage
                      const latestLog = latestLogsByTask[task.id!]
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card hover className="h-full" minHeightClass="min-h-[260px]">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <h3 className="text-lg font-semibold text-gray-800 flex-1">
                                  {getProjectCode(task.project_id) && (
                                    <span className="mr-2 text-indigo-600 font-mono text-sm bg-indigo-50 px-1.5 py-0.5 rounded">
                                      [{getProjectCode(task.project_id)}]
                                    </span>
                                  )}
                                  {task.title}
                                </h3>
                                <div className="flex gap-2 ml-2">
                                  <button
                                    onClick={() => handleEdit(task)}
                                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => handleDelete(task.id!)}
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
                                  <strong>Área:</strong> {getAreaName(task.area_id)}
                                </p>
                                {task.goal_id && (
                                  <p className="text-sm text-gray-600">
                                    <strong>Meta:</strong> {getGoalTitle(task.goal_id)}
                                  </p>
                                )}
                                <p className="text-sm text-gray-600">
                                  <strong>Proyecto:</strong> {getProjectName(task.project_id)}
                                </p>
                                {task.description && (
                                  <p className="text-sm text-gray-700">{task.description}</p>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                  {task.tags?.map(tag => (
                                    <span key={tag} className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {typeof taskProgress === 'number' && (
                                  <div className="mt-4">
                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                      <span>Progreso</span>
                                      <span className="font-semibold">{taskProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${taskProgress}%` }}
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                        className={`h-full rounded-full ${taskProgress === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                      />
                                    </div>
                                  </div>
                                )}

                                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                                  {latestLog ? (
                                    <>
                                      <p>
                                        Último avance: {formatDate(latestLog.date)}
                                        {typeof latestLog.task_progress === 'number' && ` · ${latestLog.task_progress}%`}
                                      </p>
                                      <p className="text-gray-600 italic">"{latestLog.title}"</p>
                                    </>
                                  ) : (
                                    <p className="text-gray-400">Aún no hay avances registrados para esta tarea.</p>
                                  )}
                                  {task.start_date && <p>Inicio: {formatDate(task.start_date)}</p>}
                                  {task.due_date && <p>Vence: {formatDate(task.due_date)}</p>}
                                  {task.estimated_effort && <p>Esfuerzo: {task.estimated_effort}h</p>}
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </motion.div>
                      )
                    })}
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
                          <th className="px-4 py-3">Tarea</th>
                          <th className="px-4 py-3">Área</th>
                          <th className="px-4 py-3">Meta</th>
                          <th className="px-4 py-3">Proyecto</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Progreso</th>
                          <th className="px-4 py-3">Inicio</th>
                          <th className="px-4 py-3">Vencimiento</th>
                          <th className="px-4 py-3">Etiquetas</th>
                          <th className="px-4 py-3">Último avance</th>
                          <th className="px-4 py-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-indigo-50 text-sm text-gray-700">
                        {sortedTasksList.map((task) => {
                          const latestLog = latestLogsByTask[task.id!]
                          return (
                            <tr key={task.id} className="hover:bg-indigo-50/40 transition">
                              <td className="px-4 py-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-800">
                                    {getProjectCode(task.project_id) && (
                                      <span className="mr-2 text-indigo-600 font-mono text-xs bg-indigo-50 px-1.5 py-0.5 rounded">
                                        [{getProjectCode(task.project_id)}]
                                      </span>
                                    )}
                                    {task.title}
                                  </span>
                                  {task.description && (
                                    <span className="text-xs text-gray-500 line-clamp-2">{task.description}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                  {getAreaName(task.area_id)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                {task.goal_id ? getGoalTitle(task.goal_id) : '—'}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                  {getProjectName(task.project_id)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}>
                                  {task.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${task.progress_percentage === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                      style={{ width: `${task.progress_percentage ?? 0}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600">
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                {task.start_date ? formatDate(task.start_date) : '—'}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                <div className="flex flex-col gap-1">
                                  <span>Vence: {task.due_date ? formatDate(task.due_date) : '—'}</span>
                                  {task.estimated_effort ? <span>Esfuerzo: {task.estimated_effort}h</span> : null}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                {task.tags && task.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {task.tags.map((tag) => (
                                      <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Sin tags</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                {latestLog ? (
                                  <div className="flex flex-col gap-1">
                                    <span>{formatDate(latestLog.date)}</span>
                                    {typeof latestLog.task_progress === 'number' && (
                                      <span>Progreso: {latestLog.task_progress}%</span>
                                    )}
                                    <span className="italic text-gray-500">"{latestLog.title}"</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Sin avances</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleEdit(task)}
                                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                  >
                                    ✏️ Editar
                                  </button>
                                  <button
                                    onClick={() => handleDelete(task.id!)}
                                    className="text-red-600 hover:text-red-800 transition-colors"
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
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
                  {tasks && tasks.length > 0
                    ? 'No se encontraron tareas con estos filtros'
                    : 'No hay tareas registradas'}
                </p>
                <InlineCreateButton
                  type="task"
                  label="Crear nueva tarea"
                  variant="primary"
                  className="mt-4"
                />
              </motion.div>
            )}
          </>
        )}

        {activeTab === 'kanban' && (
          <div className="mt-6 kanban-board">
            {kanbanColumns.map((column) => (
              <div key={column.id} className="kanban-column">
                <div className="kanban-column-header">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="text-lg" role="img" aria-hidden>
                      {column.icon}
                    </span>
                    {column.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="kanban-column-count">{column.tasks.length}</span>
                    <InlineCreateButton
                      type="task"
                      initialData={{ status: column.id }}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 flex items-center justify-center rounded-full hover:bg-slate-200"
                    />
                  </div>
                </div>
                <div className="kanban-column-body">
                  {column.tasks.length > 0 ? (
                    column.tasks.map((task) => {
                      const latestLog = latestLogsByTask[task.id!]
                      const statusColor = getStatusColor(task.status)
                      return (
                        <Card key={task.id} hover className="kanban-card" minHeightClass="min-h-[190px]">
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="flex-1 text-sm font-semibold text-gray-800 line-clamp-2">
                                {getProjectCode(task.project_id) && (
                                  <span className="mr-1 text-indigo-600 font-mono text-xs bg-indigo-50 px-1 py-0.5 rounded">
                                    [{getProjectCode(task.project_id)}]
                                  </span>
                                )}
                                {task.title}
                              </h3>
                              <div className="flex gap-2 text-sm">
                                <button
                                  onClick={() => handleEdit(task)}
                                  className="text-indigo-600 transition-colors hover:text-indigo-800"
                                  title="Editar tarea"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDelete(task.id!)}
                                  className="text-red-600 transition-colors hover:text-red-800"
                                  title="Eliminar tarea"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-3 text-xs text-gray-600">
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-700">
                                  {getAreaName(task.area_id)}
                                </span>
                                {task.goal_id && (
                                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-700">
                                    {getGoalTitle(task.goal_id)}
                                  </span>
                                )}
                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
                                  {getProjectName(task.project_id)}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium capitalize ${statusColor}`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </div>

                              {task.description && (
                                <p className="text-xs text-gray-600 line-clamp-3">{task.description}</p>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-gray-500">
                                <span className={task.start_date ? 'text-indigo-600' : ''}>
                                  {task.start_date ? `Ini: ${formatDate(task.start_date)}` : ''}
                                </span>
                                <span>Vence: {task.due_date ? formatDate(task.due_date) : '—'}</span>
                              </div>

                              <div>
                                <div className="mb-1 flex justify-between text-[11px] text-gray-500">
                                  <span>Progreso</span>
                                  <span className="font-semibold text-gray-700">{task.progress_percentage ?? 0}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className={`${(task.progress_percentage ?? 0) >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'} h-full rounded-full`}
                                    style={{ width: `${task.progress_percentage ?? 0}%` }}
                                  />
                                </div>
                              </div>

                              {latestLog && (
                                <div className="space-y-1 text-[11px] text-gray-500">
                                  <span>Último avance: {formatDate(latestLog.date)}</span>
                                  {typeof latestLog.task_progress === 'number' && (
                                    <span>Progreso reportado: {latestLog.task_progress}%</span>
                                  )}
                                  <span className="italic text-gray-400">"{latestLog.title}"</span>
                                </div>
                              )}

                              {task.tags && task.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 text-[11px]">
                                  {task.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="kanban-empty">Sin tareas en esta columna</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  )
}

export default TasksPage
