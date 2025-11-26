import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useAreas, useTasks, useProgressLogs } from '../hooks'
import { Button, Modal, ModalFooter, Card, CardHeader, CardBody, useToast } from '../components'
import type { Goal } from '../services/goalsApi'

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

function GoalsPage() {
  const { data: goals, isLoading, error } = useGoals()
  const { data: areas } = useAreas()
  const { data: tasks } = useTasks()
  const { data: progressLogs } = useProgressLogs()
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()
  const { showToast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState<GoalFormData>({
    area_id: '',
    title: '',
    description: '',
    goal_type: 'Corto Plazo',
    start_date: '',
    due_date: '',
    status: 'no_iniciada',
    priority: 'media',
    expected_outcome: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      area_id: goal.area_id,
      title: goal.title,
      description: goal.description || '',
      goal_type: goal.goal_type || 'Corto Plazo',
      start_date: goal.start_date || '',
      due_date: goal.due_date || '',
      status: goal.status,
      priority: goal.priority,
      expected_outcome: goal.expected_outcome || ''
    })
    setShowModal(true)
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
    setFormData({
      area_id: '',
      title: '',
      description: '',
      goal_type: 'Corto Plazo',
      start_date: '',
      due_date: '',
      status: 'no_iniciada',
      priority: 'media',
      expected_outcome: ''
    })
  }

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
          <Button variant="secondary" onClick={() => setShowModal(true)}>
            + Nueva Meta
          </Button>
        </div>
      </motion.div>

      {/* Goals Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {goals && goals.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {goals.map((goal, index) => {
                const latestUpdate = latestUpdatesByGoal[goal.id]
                const goalStats = goalTaskStats[goal.id]
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                  <Card hover>
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
                        
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                            {goal.status}
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

                        {goal.computed_progress !== null && goal.computed_progress !== undefined && (
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
                            <p>
                              {goalStats.completed}/{goalStats.total} tareas completadas ·{' '}
                              {goalStats.withoutProgress} sin avance
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-500 text-lg">No hay metas registradas</p>
            <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
              Crear primera meta
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
            submitLabel={editingGoal ? 'Actualizar' : 'Crear'}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
<<<<<<< Updated upstream
            submitType="submit"
=======
>>>>>>> Stashed changes
          />
        </form>
      </Modal>
    </div>
  )
}

export default GoalsPage
