import { useState, useMemo, useCallback, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useAreas,
  useTasks,
  useProgressLogs,
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
} from '../components'
import type { Goal } from '../services/goalsApi'
import type { DashboardFilterKey } from '../features/dashboard/navigation'
import { DASHBOARD_FILTER_LABELS } from '../features/dashboard/navigation'

interface GoalFormData {
  area_id: string
  title: string
  description: string
  goal_type: string
  start_date: string
  due_date: string
  status: string
  priority: string
  expected_outcome: string
}

const createEmptyGoalForm = (): GoalFormData => ({
  area_id: '',
  title: '',
  description: '',
  goal_type: 'Corto Plazo',
  start_date: '',
  due_date: '',
  status: 'no_iniciada',
  priority: 'media',
  expected_outcome: '',
})

function GoalsPage() {
  const { data: goals, isLoading, error } = useGoals()
  const { data: areas } = useAreas()
  const { data: tasks } = useTasks()
  const { data: progressLogs } = useProgressLogs()
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()
  const { showToast } = useToast()

  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'list' | 'by-area' | 'compliance'>('list')
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState<GoalFormData>(() => createEmptyGoalForm())
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'progress' | 'due_date' | 'title'>('progress')
  const { density, setDensity } = useCardLayout('goals')
  const { mode: viewMode, setMode: setViewMode } = useViewMode('goals:view-mode', 'table')
  const [searchParams, setSearchParams] = useSearchParams()
  const rawDashboardFilter = searchParams.get('dashboardFilter')
  const dashboardFilter: DashboardFilterKey | null =
    rawDashboardFilter && rawDashboardFilter.startsWith('goals-')
      ? (rawDashboardFilter as DashboardFilterKey)
      : null
  const dashboardFocus = searchParams.get('dashboardFocus')
  const dashboardFocusId = searchParams.get('dashboardId')
  const dashboardFilterLabel = dashboardFilter ? DASHBOARD_FILTER_LABELS[dashboardFilter] : undefined

  const handleTabChange = (tabId: 'list' | 'by-area' | 'compliance') => {
    setActiveTab(tabId)
    if (tabId === 'list') {
      navigate('/goals')
      return
    }
    if (tabId === 'by-area') {
      navigate('/goals/by-area')
      return
    }
    navigate('/analytics/compliance')
  }

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    try {
      // Limpiar datos: convertir strings vacíos a null (PostgreSQL requiere null, no undefined)
      const cleanData = {
        area_id: formData.area_id,
        title: formData.title,
        description: formData.description || null,
        goal_type: formData.goal_type || null,
        start_date: formData.start_date || null,
        due_date: formData.due_date || null,
        status: formData.status,
        priority: formData.priority,
        expected_outcome: formData.expected_outcome || null,
      };

      if (editingGoal) {
        await updateMutation.mutateAsync({ id: editingGoal.id, data: cleanData })
        showToast('Meta actualizada exitosamente', 'success')
      } else {
        await createMutation.mutateAsync(cleanData)
        showToast('Meta creada exitosamente', 'success')
      }
      resetForm()
    } catch (err) {
      showToast('Error al guardar meta', 'error')
      console.error('Error al guardar meta:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta meta?')) {
      try {
        await deleteMutation.mutateAsync(id)
        showToast('Meta eliminada', 'success')
      } catch (err) {
        showToast('Error al eliminar meta', 'error')
        console.error('Error al eliminar meta:', err)
      }
    }
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingGoal(null)
    setFormData(createEmptyGoalForm())
  }

  const handleClearDashboardFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('dashboardFilter')
    setSearchParams(next, { replace: true })
  }

  const isDateInCurrentMonth = (value?: string | null) => {
    if (!value) return false
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return false
    const now = new Date()
    return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth()
  }

const isUpdatedInCurrentMonth = (value?: string | null) => {
  if (!value) return false
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false
  const now = new Date()
  return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth()
}

const isBeforeCurrentMonth = (value?: string | null) => {
  if (!value) return false
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false
  const now = new Date()
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
  parsed.setHours(0, 0, 0, 0)
  return parsed.getTime() < currentStart.getTime()
}

const isAfterCurrentMonth = (value?: string | null) => {
  if (!value) return false
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false
  const now = new Date()
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  parsed.setHours(0, 0, 0, 0)
  return parsed.getTime() >= nextMonthStart.getTime()
}

  useEffect(() => {
    if (dashboardFilter) {
      setActiveTab('list')
    }
  }, [dashboardFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completada': return 'bg-green-100 text-green-800'
      case 'en_progreso': return 'bg-yellow-100 text-yellow-800'
      case 'no_iniciada': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'baja': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const resolveGoalStatus = useCallback((goal: Goal) => {
    const progress = goal.computed_progress ?? 0
    if (progress >= 100) {
      return 'completada'
    }
    if (goal.status === 'completada' && progress < 100) {
      return progress === 0 ? 'no_iniciada' : 'en_progreso'
    }
    return goal.status
  }, [])

const handleEdit = useCallback((goal: Goal) => {
  setEditingGoal(goal)
  setFormData({
    area_id: goal.area_id,
    title: goal.title,
    description: goal.description || '',
    goal_type: goal.goal_type || 'Corto Plazo',
    start_date: goal.start_date || '',
    due_date: goal.due_date || '',
    status: resolveGoalStatus(goal),
    priority: goal.priority,
    expected_outcome: goal.expected_outcome || '',
  })
  setShowModal(true)
}, [resolveGoalStatus])

  const getAreaName = (areaId: string) => {
    return areas?.find(a => a.id === areaId)?.name || 'Sin área'
  }

  const formatDate = (value?: string | null) => {
    if (!value) return 'Sin fecha'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
  }

  const taskLookup = useMemo(() => {
    const map: Record<string, { title: string; progress: number }> = {}
    tasks?.forEach(task => {
      map[task.id] = {
        title: task.title,
        progress: task.progress_percentage ?? 0,
      }
    })
    return map
  }, [tasks])

  const goalTaskStats = useMemo(() => {
    const stats: Record<string, { total: number; completed: number; withoutProgress: number }> = {}

    tasks?.forEach(task => {
      if (!task.goal_id) return
      if (!stats[task.goal_id]) {
        stats[task.goal_id] = { total: 0, completed: 0, withoutProgress: 0 }
      }
      stats[task.goal_id].total += 1
      const progress = task.progress_percentage ?? 0
      if (progress >= 100) {
        stats[task.goal_id].completed += 1
      }
      if (progress === 0) {
        stats[task.goal_id].withoutProgress += 1
      }
    })

    return stats
  }, [tasks])

  const latestUpdatesByGoal = useMemo(() => {
    if (!progressLogs) {
      return {} as Record<string, { title: string; date?: string; progress?: number; taskTitle?: string }>
    }

    type InternalInfo = {
      title: string
      date?: string
      progress?: number
      taskTitle?: string
      timestamp: number
    }

    const map: Record<string, InternalInfo> = {}

    progressLogs.forEach(log => {
      if (!log.goal_id) return
      const rawDate = log.date || log.created_at || ''
      const timestamp = rawDate ? new Date(rawDate).getTime() : 0
      const existing = map[log.goal_id]
      const taskTitle = log.task_id ? taskLookup[log.task_id]?.title : undefined

      if (!existing || timestamp >= existing.timestamp) {
        map[log.goal_id] = {
          title: log.title,
          date: rawDate,
          progress: log.task_progress ?? undefined,
          taskTitle,
          timestamp,
        }
      }
    })

    return Object.fromEntries(
      Object.entries(map).map(([goalId, { title, date, progress, taskTitle }]) => [
        goalId,
        { title, date, progress, taskTitle },
      ]),
    ) as Record<string, { title: string; date?: string; progress?: number; taskTitle?: string }>
  }, [progressLogs, taskLookup])

  const goalsForView = useMemo(() => {
    if (!goals) return []
    let dataset = [...goals]
    if (activeTab === 'list' && dashboardFilter) {
      dataset = dataset.filter(goal => {
        const status = resolveGoalStatus(goal)
        const progress = goal.computed_progress ?? 0
        switch (dashboardFilter) {
          case 'goals-in-progress':
            return status === 'en_progreso' || status === 'in_progress'
          case 'goals-month-current':
          case 'goals-month-due':
            return isDateInCurrentMonth(goal.due_date)
          case 'goals-month-completed':
            return progress >= 100 && (isUpdatedInCurrentMonth(goal.updated_at) || isDateInCurrentMonth(goal.due_date))
          case 'goals-month-early':
            return progress >= 100 && isUpdatedInCurrentMonth(goal.updated_at) && (isAfterCurrentMonth(goal.due_date) || !goal.due_date)
          case 'goals-month-pending':
            return isDateInCurrentMonth(goal.due_date) && progress < 100
          case 'goals-month-recovered':
            return progress >= 100 && isUpdatedInCurrentMonth(goal.updated_at) && isBeforeCurrentMonth(goal.due_date)
          default:
            return true
        }
      })
    }

    if (activeTab === 'compliance') {
      dataset = dataset.filter((goal) => resolveGoalStatus(goal) !== 'completada')
    }
    return dataset
  }, [goals, dashboardFilter, resolveGoalStatus, activeTab])

  const filteredGoals = useMemo(() => {
    const dataset = goalsForView
    if (dataset.length === 0) return []
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return [...dataset]

    return dataset.filter((goal) => {
      const title = goal.title.toLowerCase()
      const description = (goal.description || '').toLowerCase()
      const areaName = getAreaName(goal.area_id).toLowerCase()
      return (
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        areaName.includes(normalizedSearch)
      )
    })
  }, [goalsForView, searchTerm, areas])

  const sortedGoals = useMemo(() => {
    return [...filteredGoals].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      if (sortBy === 'due_date') {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY
        const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY
        return aDate - bDate
      }
      const aProgress = a.computed_progress ?? 0
      const bProgress = b.computed_progress ?? 0
      return bProgress - aProgress
    })
  }, [filteredGoals, sortBy])

  const gridClass =
    density === 'compact'
      ? 'grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,_1fr))] auto-rows-[1fr]'
      : 'grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,_1fr))] auto-rows-[1fr]'

  const openCreateGoalModal = useCallback(() => {
    setActiveTab('list')
    setEditingGoal(null)
    setFormData(createEmptyGoalForm())
    setShowModal(true)
  }, [])

  useRegisterQuickAction('goal:create', openCreateGoalModal)

  useEffect(() => {
    if (dashboardFocus === 'goal' && dashboardFocusId && goals) {
      const target = goals.find((goal) => goal.id === dashboardFocusId)
      if (target) {
        handleEdit(target)
        const next = new URLSearchParams(searchParams)
        next.delete('dashboardFocus')
        next.delete('dashboardId')
        setSearchParams(next, { replace: true })
      }
    }
  }, [dashboardFocus, dashboardFocusId, goals, handleEdit, searchParams, setSearchParams])

  useEffect(() => {
    const state = location.state as { quickAction?: string } | undefined
    if (state?.quickAction === 'goal:create') {
      openCreateGoalModal()
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate, openCreateGoalModal])

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
            <h1 className="text-3xl font-bold mb-1">🎯 Metas</h1>
            <p className="text-indigo-100">Gestiona tus objetivos y alcanza tus sueños</p>
          </div>
          <Button variant="secondary" onClick={openCreateGoalModal}>
            + Nueva Meta
          </Button>
        </div>
      </motion.div>

      {/* Goals Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardLayoutToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por título, área o descripción"
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
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {dashboardFilterLabel && (
          <div className="dashboard-origin-banner">
            <span>
              Vista filtrada desde el dashboard:&nbsp;
              <strong>{dashboardFilterLabel}</strong>
            </span>
            <button
              type="button"
              className="dashboard-origin-banner__button"
              onClick={handleClearDashboardFilter}
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {sortedGoals.length > 0 ? (
          viewMode === 'cards' ? (
            <motion.div
              className={`${gridClass} mt-6`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <AnimatePresence>
                {sortedGoals.map((goal, index) => {
                  const derivedStatus = resolveGoalStatus(goal)
                  const goalStats = goalTaskStats[goal.id!]
                  const latestUpdate = latestUpdatesByGoal[goal.id!]
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card hover className="h-full" minHeightClass="min-h-[260px]">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold text-gray-800 flex-1">{goal.title}</h3>
                            <div className="flex gap-2 ml-2">
                              <button
                                onClick={() => handleEdit(goal)}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(goal.id)}
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
                              <strong>Área:</strong> {getAreaName(goal.area_id)}
                            </p>
                            {goal.description && (
                              <p className="text-sm text-gray-700">{goal.description}</p>
                            )}

                            <div className="flex flex-wrap gap-2 items-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(derivedStatus)}`}>
                                {derivedStatus}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                                {goal.priority}
                              </span>
                              {goal.goal_type && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {goal.goal_type}
                                </span>
                              )}
                            </div>

                            {typeof goal.computed_progress === 'number' && (
                              <div className="mt-4">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>Progreso</span>
                                  <span className="font-semibold">{goal.computed_progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${goal.computed_progress}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                              {latestUpdate ? (
                                <>
                                  <p>
                                    Último avance: {formatDate(latestUpdate.date)}
                                    {latestUpdate.taskTitle ? ` · ${latestUpdate.taskTitle}` : ''}
                                  </p>
                                  {typeof latestUpdate.progress === 'number' && (
                                    <p>Progreso registrado: {latestUpdate.progress}%</p>
                                  )}
                                  <p className="text-gray-600 italic">"{latestUpdate.title}"</p>
                                </>
                              ) : (
                                <p className="text-gray-400">Aún no hay avances registrados para esta meta.</p>
                              )}
                              {goalStats ? (
                                <p className="text-sm text-slate-500">
                                  {goalStats.completed}/{goalStats.total} tareas completadas
                                  {goalStats.withoutProgress > 0 && (
                                    <span> · {goalStats.withoutProgress} sin avance</span>
                                  )}
                                </p>
                              ) : (
                                <p>No hay tareas asociadas a esta meta.</p>
                              )}
                              {goal.start_date && <p>Inicio: {goal.start_date}</p>}
                              {goal.due_date && <p>Vence: {goal.due_date}</p>}
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
                      <th className="px-4 py-3">Meta</th>
                      <th className="px-4 py-3">Área</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Prioridad</th>
                      <th className="px-4 py-3">Progreso</th>
                      <th className="px-4 py-3">Fechas</th>
                      <th className="px-4 py-3">Resumen</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50 text-sm text-gray-700">
                    {sortedGoals.map((goal) => {
                      const derivedStatus = resolveGoalStatus(goal)
                      const goalStats = goalTaskStats[goal.id!]
                      const latestUpdate = latestUpdatesByGoal[goal.id!]
                      return (
                        <tr key={goal.id} className="hover:bg-indigo-50/40 transition">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800">{goal.title}</span>
                              {goal.description && (
                                <span className="text-xs text-gray-500 line-clamp-2">{goal.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              {getAreaName(goal.area_id)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(derivedStatus)}`}>
                              {derivedStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                              {goal.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-20 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                  style={{ width: `${goal.computed_progress ?? 0}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">
                                {goal.computed_progress ?? 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            <div className="flex flex-col gap-1">
                              <span>Inicio: {goal.start_date ? formatDate(goal.start_date) : '—'}</span>
                              <span>Vence: {goal.due_date ? formatDate(goal.due_date) : '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {latestUpdate ? (
                              <div className="flex flex-col gap-1">
                                <span>Último avance: {formatDate(latestUpdate.date)}</span>
                                {latestUpdate.progress !== undefined && (
                                  <span>Progreso reporte: {latestUpdate.progress}%</span>
                                )}
                                {goalStats && (
                                  <div className="text-sm text-slate-500">
                                    {goalStats.completed}/{goalStats.total} tareas
                                    {goalStats.withoutProgress > 0 && (
                                      <span> · {goalStats.withoutProgress} sin avance</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin avances registrados</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(goal)}
                                className="text-indigo-600 hover:text-indigo-800 transition-colors"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={() => handleDelete(goal.id!)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                🗑️ Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    )}
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
              {goals && goals.length > 0
                ? 'No se encontraron metas con estos filtros'
                : 'No hay metas registradas'}
            </p>
            <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
              Crear nueva meta
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingGoal ? 'Editar Meta' : 'Nueva Meta'}
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
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
              >
                <option value="">Seleccionar área</option>
                {areas?.map((area) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Meta
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.goal_type}
                onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
              >
                <option value="Corto Plazo">Corto Plazo</option>
                <option value="Mediano Plazo">Mediano Plazo</option>
                <option value="Largo Plazo">Largo Plazo</option>
              </select>
            </div>
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
              Descripción
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="no_iniciada">No Iniciada</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Vencimiento
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resultado Esperado
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.expected_outcome}
              onChange={(e) => setFormData({ ...formData, expected_outcome: e.target.value })}
            />
          </div>

          <ModalFooter
            onCancel={resetForm}
            onSubmit={handleSubmit}
            submitText={editingGoal ? 'Actualizar' : 'Crear'}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </form>
      </Modal>
    </div>
  )
}

export default GoalsPage
