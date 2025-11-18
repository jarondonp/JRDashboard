import { useState } from 'react'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useAreas } from '../hooks'
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
  const createMutation = useCreateGoal()
  const updateMutation = useUpdateGoal()
  const deleteMutation = useDeleteGoal()

  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState<GoalFormData>({
    area_id: '',
    title: '',
    description: '',
    goal_type: 'Corto Plazo',
    start_date: '',
    due_date: '',
    status: 'pendiente',
    priority: 'media',
    expected_outcome: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingGoal) {
        await updateMutation.mutateAsync({ id: editingGoal.id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      resetForm()
    } catch (err) {
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
      } catch (err) {
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
      status: 'pendiente',
      priority: 'media',
      expected_outcome: ''
    })
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completada': return 'badge-success'
      case 'en_progreso': return 'badge-warning'
      case 'pendiente': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'alta': return 'badge-danger'
      case 'media': return 'badge-warning'
      case 'baja': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  const getAreaName = (areaId: string) => {
    return areas?.find(a => a.id === areaId)?.name || 'Sin área'
  }

  if (isLoading) return <div className="page"><div className="loading">Cargando metas...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Metas</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nueva Meta
        </button>
      </div>

      <ul className="list">
        {goals?.map((goal) => (
          <li key={goal.id} className="list-item">
            <div className="list-item-content">
              <h3>{goal.title}</h3>
              <p><strong>Área:</strong> {getAreaName(goal.area_id)}</p>
              {goal.description && <p>{goal.description}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <span className={`badge ${getStatusBadgeClass(goal.status)}`}>
                  {goal.status}
                </span>
                <span className={`badge ${getPriorityBadgeClass(goal.priority)}`}>
                  {goal.priority}
                </span>
                {goal.goal_type && <span className="badge badge-secondary">{goal.goal_type}</span>}
              </div>
              {goal.computed_progress !== null && goal.computed_progress !== undefined && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>Progreso</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{goal.computed_progress}%</span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    backgroundColor: '#e0e0e0', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${goal.computed_progress}%`,
                      backgroundColor: goal.computed_progress === 100 ? '#10b981' : '#3b82f6',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}
              {goal.due_date && (
                <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#666' }}>
                  <strong>Fecha límite:</strong> {new Date(goal.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="list-item-actions">
              <button className="btn btn-secondary" onClick={() => handleEdit(goal)}>
                Editar
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(goal.id)}>
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGoal ? 'Editar Meta' : 'Nueva Meta'}</h3>
            </div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Área de Vida *</label>
                <select
                  value={formData.area_id}
                  onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
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
                <label>Título *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ej: Aprender React avanzado"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe tu meta..."
                />
              </div>

              <div className="form-group">
                <label>Tipo de Meta</label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                >
                  <option value="Corto Plazo">Corto Plazo</option>
                  <option value="Mediano Plazo">Mediano Plazo</option>
                  <option value="Largo Plazo">Largo Plazo</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Fecha Inicio</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Límite</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
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
                    <option value="pausada">Pausada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridad *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    required
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Resultado Esperado</label>
                <textarea
                  value={formData.expected_outcome}
                  onChange={(e) => setFormData({ ...formData, expected_outcome: e.target.value })}
                  placeholder="¿Qué esperas lograr?"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGoal ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalsPage
