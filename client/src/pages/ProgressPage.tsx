import { useState } from 'react'
import { useProgressLogs, useCreateProgressLog, useUpdateProgressLog, useDeleteProgressLog, useAreas, useGoals } from '../hooks'
import type { ProgressLog } from '../services/progressApi'

interface ProgressFormData {
  area_id: string
  goal_id: string
  task_id: string
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
  const createMutation = useCreateProgressLog()
  const updateMutation = useUpdateProgressLog()
  const deleteMutation = useDeleteProgressLog()

  const [showModal, setShowModal] = useState(false)
  const [editingLog, setEditingLog] = useState<ProgressLog | null>(null)
  const [formData, setFormData] = useState<ProgressFormData>({
    area_id: '',
    goal_id: '',
    task_id: '',
    title: '',
    note: '',
    date: new Date().toISOString().split('T')[0],
    impact_level: '',
    mood: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        goal_id: formData.goal_id || undefined,
        task_id: formData.task_id || undefined,
        impact_level: formData.impact_level || undefined,
        mood: formData.mood || undefined
      }

      if (editingLog) {
        await updateMutation.mutateAsync({ id: editingLog.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      resetForm()
    } catch (err) {
      console.error('Error al guardar avance:', err)
    }
  }

  const handleEdit = (log: ProgressLog) => {
    setEditingLog(log)
    setFormData({
      area_id: log.area_id,
      goal_id: log.goal_id || '',
      task_id: log.task_id || '',
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
      } catch (err) {
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

  const getMoodEmoji = (mood?: number) => {
    if (!mood) return ''
    if (mood === 5) return '😄'
    if (mood === 4) return '🙂'
    if (mood === 3) return '😐'
    if (mood === 2) return '😕'
    return '😞'
  }

  const filteredGoals = goals?.filter(g => g.area_id === formData.area_id) || []

  if (isLoading) return <div className="page"><div className="loading">Cargando avances...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Avances</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo Avance
        </button>
      </div>

      <ul className="list">
        {logs?.map((log) => (
          <li key={log.id} className="list-item">
            <div className="list-item-content">
              <h3>{log.title}</h3>
              <p><strong>Área:</strong> {getAreaName(log.area_id)}</p>
              {log.goal_id && <p><strong>Meta:</strong> {getGoalTitle(log.goal_id)}</p>}
              {log.note && <p>{log.note}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {log.mood && (
                  <span className="badge badge-secondary">
                    Mood: {getMoodEmoji(log.mood)} {log.mood}/5
                  </span>
                )}
                {log.impact_level && (
                  <span className={`badge ${log.impact_level >= 4 ? 'badge-success' : log.impact_level >= 2 ? 'badge-warning' : 'badge-info'}`}>
                    Impacto: {log.impact_level}/5
                  </span>
                )}
              </div>
              <p style={{ marginTop: '8px', fontSize: '0.875rem', color: '#666' }}>
                <strong>Fecha:</strong> {new Date(log.date).toLocaleDateString()}
              </p>
            </div>
            <div className="list-item-actions">
              <button className="btn btn-secondary" onClick={() => handleEdit(log)}>
                Editar
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(log.id)}>
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
              <h3>{editingLog ? 'Editar Avance' : 'Nuevo Avance'}</h3>
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
                <label>Meta Relacionada (opcional)</label>
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
                <label>Título del Avance *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ej: Completé la primera semana de ejercicio"
                />
              </div>

              <div className="form-group">
                <label>Notas / Detalles</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Describe tu avance, logros, aprendizajes..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Nivel de Impacto (1-5)</label>
                  <select
                    value={formData.impact_level}
                    onChange={(e) => setFormData({ ...formData, impact_level: e.target.value ? parseInt(e.target.value) : '' })}
                  >
                    <option value="">Sin evaluar</option>
                    <option value="1">1 - Muy bajo</option>
                    <option value="2">2 - Bajo</option>
                    <option value="3">3 - Medio</option>
                    <option value="4">4 - Alto</option>
                    <option value="5">5 - Muy alto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Estado de Ánimo (1-5)</label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({ ...formData, mood: e.target.value ? parseInt(e.target.value) : '' })}
                  >
                    <option value="">Sin evaluar</option>
                    <option value="1">1 - 😞 Muy mal</option>
                    <option value="2">2 - 😕 Mal</option>
                    <option value="3">3 - 😐 Neutral</option>
                    <option value="4">4 - 🙂 Bien</option>
                    <option value="5">5 - 😄 Excelente</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLog ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressPage
