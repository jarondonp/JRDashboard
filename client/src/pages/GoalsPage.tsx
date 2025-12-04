import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useGoals,
  useDeleteGoal,
  useAreas,
  useTasks,
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
import type { Goal } from '../services/goalsApi'
import { type DashboardFilterKey, DASHBOARD_FILTER_LABELS } from '../features/dashboard/navigation'

function GoalsPage() {
  const { data: goals, isLoading, error } = useGoals()
  const { data: areas } = useAreas()
  const { data: tasks } = useTasks()
  const { data: progressLogs } = useProgressLogs()
  const { data: projects } = useProjects()
  const deleteMutation = useDeleteGoal()
  const { showToast } = useToast()

  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'list' | 'by-area' | 'compliance'>('list')
  const { openModal } = useGlobalModal()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
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
    openModal('goal', 'edit', goal)
  }, [openModal])

  const getAreaName = (areaId: string) => {
    return areas?.find(a => a.id === areaId)?.name || 'Sin área'
  }

  const getProjectName = (projectId?: string | null) => {
    if (!projectId) return 'Global'
    return projects?.find(p => p.id === projectId)?.title || 'Proyecto desconocido'
  }

  const getProjectCode = (projectId?: string | null) => {
    if (!projectId) return null
    return projects?.find(p => p.id === projectId)?.code
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

    return dataset.filter((goal) => {
      // Always check project filter first
      const matchesProject = selectedProjectId ? goal.project_id === selectedProjectId : true
      if (!matchesProject) return false

      // Then apply search filter if search term exists
      const normalizedSearch = searchTerm.trim().toLowerCase()
      if (!normalizedSearch) return true // No search term, just use project filter

      const title = goal.title.toLowerCase()
      const description = (goal.description || '').toLowerCase()
      const areaName = getAreaName(goal.area_id).toLowerCase()
      const projectName = getProjectName(goal.project_id).toLowerCase()

      const matchesSearch = (
        title.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        areaName.includes(normalizedSearch) ||
        projectName.includes(normalizedSearch)
      )

      return matchesSearch
    })
  }, [goalsForView, searchTerm, areas, selectedProjectId, projects])

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



  useRegisterQuickAction('goal:create', () => openModal('goal', 'create'))

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
      openModal('goal', 'create')
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate, openModal])

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
          <InlineCreateButton
            type="goal"
            label="+ Nueva Meta"
            variant="secondary"
          />
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
                            <h3 className="text-lg font-semibold text-gray-800 flex-1">
                              {getProjectCode(goal.project_id) && (
                                <span className="mr-2 text-indigo-600 font-mono text-sm bg-indigo-50 px-1.5 py-0.5 rounded">
                                  [{getProjectCode(goal.project_id)}]
                                </span>
                              )}
                              {goal.title}
                            </h3>
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
                            <p className="text-sm text-gray-600">
                              <strong>Proyecto:</strong> {getProjectName(goal.project_id)}
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
                      <th className="px-4 py-3">Proyecto</th>
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
                              <span className="font-semibold text-gray-800">
                                {getProjectCode(goal.project_id) && (
                                  <span className="mr-2 text-indigo-600 font-mono text-xs bg-indigo-50 px-1.5 py-0.5 rounded">
                                    [{getProjectCode(goal.project_id)}]
                                  </span>
                                )}
                                {goal.title}
                              </span>
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
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {getProjectName(goal.project_id)}
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
                      )
                    }
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
            <InlineCreateButton
              type="goal"
              label="Crear nueva meta"
              variant="primary"
              className="mt-4"
            />
          </motion.div>
        )}
      </div>


    </div>
  )
}

export default GoalsPage
