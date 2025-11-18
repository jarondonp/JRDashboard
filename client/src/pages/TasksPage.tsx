import { useState } from 'react'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useAreas, useGoals } from '../hooks'
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
      
      if (editingTask) {
        await updateMutation.mutateAsync({ id: editingTask.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      resetForm()
    } catch (err) {
      console.error('Error al guardar tarea:', err)
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      area_id: task.area_id,
      goal_id: task.goal_id || '',
      title: task.title,
      description: task.description || '',
      status: task.status,
      due_date: task.due_date || '',
      estimated_effort: task.estimated_effort || '',
      progress_percentage: (task as any).progress_percentage || 0,
      tags: task.tags || []
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (err) {
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completada': return 'badge-success'
      case 'en_progreso': return 'badge-warning'
      case 'pendiente': return 'badge-info'
      default: return 'badge-secondary'
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

  if (isLoading) return <div className="page"><div className="loading">Cargando tareas...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Tareas</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Nueva Tarea</button>
      </div>

      <ul className="list">
        {tasks?.map((task) => {
          const taskProgress = (task as any).progress_percentage
          return (
            <li key={task.id} className="list-item">
              <div className="list-item-content">
                <h3>{task.title}</h3>
                <p><strong>Área:</strong> {getAreaName(task.area_id)}</p>
                {task.goal_id && <p><strong>Meta:</strong> {getGoalTitle(task.goal_id)}</p>}
                {task.description && <p>{task.description}</p>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                    {task.status}
                  </span>
                  {task.tags?.map(tag => (
                    <span key={tag} className="badge badge-secondary">{tag}</span>
                  ))}
                </div>
                {taskProgress !== null && taskProgress !== undefined && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>Progreso</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{taskProgress}%</span>
                    </div>
                    <div style={{ 
                      height: '6px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${taskProgress}%`,
                        backgroundColor: taskProgress === 100 ? '#10b981' : '#3b82f6',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '8px', fontSize: '0.875rem', color: '#666', display: 'flex', gap: '16px' }}>
                  {task.due_date && (
                    <span><strong>Vence:</strong> {new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                  {task.estimated_effort && (
                    <span><strong>Esfuerzo:</strong> {task.estimated_effort}h</span>
                  )}
                </div>
              </div>
              <div className="list-item-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(task)}>
                  Editar
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>
                  Eliminar
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
            </div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Área de Vida *</label>
                <select
                  value={formData.area_id}
                  onChange={(e) => setFormData({ ...formData, area_id: e.target.value, goal_id: '' })}
                  required
                >
                  <option value="">Selecciona un área</option>
                  {areas?.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Meta (opcional)</label>
                <select
                  value={formData.goal_id}
                  onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
                  disabled={!formData.area_id}
                >
                  <option value="">Sin meta asignada</option>
                  {filteredGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ej: Completar módulo 3 del curso"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe la tarea..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Estado *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="completada">Completada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Progreso Manual (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progress_percentage}
                    onChange={(e) => setFormData({ ...formData, progress_percentage: e.target.value ? parseInt(e.target.value) : 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Fecha Límite</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Esfuerzo Estimado (horas)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimated_effort}
                    onChange={(e) => setFormData({ ...formData, estimated_effort: e.target.value ? parseFloat(e.target.value) : '' })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Etiquetas</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  {formData.tags.map(tag => (
                    <span key={tag} className="badge badge-secondary" style={{ cursor: 'pointer' }} onClick={() => removeTag(tag)}>
                      {tag} ×
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Agregar etiqueta..."
                  />
                  <button type="button" className="btn btn-secondary" onClick={addTag}>
                    +
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TasksPage
