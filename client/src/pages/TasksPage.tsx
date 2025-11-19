import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useAreas, useGoals } from '../hooks'
import { Button, Modal, ModalFooter, Card, CardHeader, CardBody, useToast } from '../components'
import type { Task } from '../services/tasksApi'

interface TaskFormData {
  area_id: string
  goal_id: string
  title: string
  description: string
  status: string
  due_date: string
  estimated_effort: number | ''
  progress_percentage: number | ''
  tags: string[]
}

function TasksPage() {
  const { data: tasks, isLoading, error } = useTasks()
  const { data: areas } = useAreas()
  const { data: goals } = useGoals()
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const deleteMutation = useDeleteTask()
  const { showToast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState<TaskFormData>({
    area_id: '',
    goal_id: '',
    title: '',
    description: '',
    status: 'pendiente',
    due_date: '',
    estimated_effort: '',
    progress_percentage: 0,
    tags: []
  })
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        goal_id: formData.goal_id || undefined,
        estimated_effort: formData.estimated_effort || undefined,
        progress_percentage: formData.progress_percentage || 0,
        tags: formData.tags.length > 0 ? formData.tags : undefined
      }
      
      console.log('Submitting task data:', submitData)
      
      if (editingTask) {
        await updateMutation.mutateAsync({ id: editingTask.id, data: submitData })
        showToast('Tarea actualizada exitosamente', 'success')
      } else {
        await createMutation.mutateAsync(submitData)
        showToast('Tarea creada exitosamente', 'success')
      }
      resetForm()
    } catch (err) {
      showToast('Error al guardar tarea', 'error')
      console.error('Error al guardar tarea:', err)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    console.log('Editing task:', task)
    console.log('Progress percentage:', task.progress_percentage)
    setFormData({
      area_id: task.area_id,
      goal_id: task.goal_id || '',
      title: task.title,
      description: task.description || '',
      status: task.status,
      due_date: task.due_date || '',
      estimated_effort: task.estimated_effort || '',
      progress_percentage: task.progress_percentage ?? 0,
      tags: task.tags || []
    })
    setShowModal(true)
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

  const resetForm = () => {
    setShowModal(false)
    setEditingTask(null)
    setFormData({
      area_id: '',
      goal_id: '',
      title: '',
      description: '',
      status: 'pendiente',
      due_date: '',
      estimated_effort: '',
      progress_percentage: 0,
      tags: []
    })
    setTagInput('')
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completada': return 'bg-green-100 text-green-800'
      case 'en_progreso': return 'bg-yellow-100 text-yellow-800'
      case 'pendiente': return 'bg-blue-100 text-blue-800'
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

  const filteredGoals = goals?.filter(g => g.area_id === formData.area_id) || []

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
          <Button variant="secondary" onClick={() => setShowModal(true)}>
            + Nueva Tarea
          </Button>
        </div>
      </motion.div>

      {/* Tasks Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {tasks && tasks.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {tasks.map((task, index) => {
                const taskProgress = task.progress_percentage
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-800 flex-1">{task.title}</h3>
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => handleEdit(task)}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
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

                          {taskProgress !== null && taskProgress !== undefined && (
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
                            {task.due_date && <p>Vence: {new Date(task.due_date).toLocaleDateString()}</p>}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-500 text-lg">No hay tareas registradas</p>
            <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
              Crear primera tarea
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
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
                onChange={(e) => setFormData({ ...formData, area_id: e.target.value, goal_id: '' })}
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
                onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
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
                Estado *
              </label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progreso (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.progress_percentage}
                onChange={(e) => setFormData({ ...formData, progress_percentage: e.target.value ? parseInt(e.target.value) : 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Límite
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Esfuerzo (horas)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.estimated_effort}
                onChange={(e) => setFormData({ ...formData, estimated_effort: e.target.value ? parseFloat(e.target.value) : '' })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs cursor-pointer hover:bg-gray-200"
                  onClick={() => removeTag(tag)}
                >
                  {tag} ×
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Agregar etiqueta..."
              />
              <Button type="button" variant="secondary" onClick={addTag}>
                +
              </Button>
            </div>
          </div>

          <ModalFooter
            onCancel={resetForm}
            submitLabel={editingTask ? 'Actualizar' : 'Crear'}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            submitType="submit"
          />
        </form>
      </Modal>
    </div>
  )
}

export default TasksPage
