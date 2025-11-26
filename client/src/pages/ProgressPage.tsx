import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useProgressLogs,
  useCreateProgressLog,
  useUpdateProgressLog,
  useDeleteProgressLog,
  useAreas,
  useGoals,
  useTasks,
} from '../hooks'
import { Button, Modal, ModalFooter, Card, CardHeader, CardBody, useToast } from '../components'
import type { ProgressLog } from '../services/progressApi'

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

function ProgressPage() {
  const { data: logs, isLoading, error } = useProgressLogs()
  const { data: areas } = useAreas()
  const { data: goals } = useGoals()
  const { data: tasks } = useTasks()
  const createMutation = useCreateProgressLog()
  const updateMutation = useUpdateProgressLog()
  const deleteMutation = useDeleteProgressLog()
  const { showToast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editingLog, setEditingLog] = useState<ProgressLog | null>(null)
  const [formData, setFormData] = useState<ProgressFormData>({
    area_id: '',
    goal_id: '',
    task_id: '',
    task_progress: '',
    title: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    impact_level: '',
    mood: ''
  })

  const handleSubmit = async (e?: React.FormEvent) => {
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
    setFormData({
      area_id: '',
      goal_id: '',
      task_id: '',
      task_progress: '',
      title: '',
      note: '',
      date: new Date().toISOString().split('T')[0],
      impact_level: '',
      mood: ''
    })
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

  const getMoodEmoji = (mood?: number) => {
    if (!mood) return ''
    if (mood === 5) return '😄'
    if (mood === 4) return '🙂'
    if (mood === 3) return '😐'
    if (mood === 2) return '😕'
    return '😞'
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
          <Button variant="secondary" onClick={() => setShowModal(true)}>
            + Nuevo Avance
          </Button>
        </div>
      </motion.div>

      {/* Progress Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {logs && logs.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-800 flex-1">{log.title}</h3>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-500 text-lg">No hay avances registrados</p>
            <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
              Registrar primer avance
            </Button>
          </motion.div>
        )}
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
            submitLabel={editingLog ? 'Actualizar' : 'Crear'}
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

export default ProgressPage
