import { useState } from 'react'
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea } from '../hooks'
import type { Area, AreaInput } from '../services/areasApi'

function AreasPage() {
  const { data: areas, isLoading, error } = useAreas()
  const createMutation = useCreateArea()
  const updateMutation = useUpdateArea()
  const deleteMutation = useDeleteArea()

  const [showModal, setShowModal] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [formData, setFormData] = useState<AreaInput>({
    name: '',
    type: 'Personal',
    color: '#3498db',
    description: '',
    icon: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingArea) {
        await updateMutation.mutateAsync({ id: editingArea.id, data: formData })
      } else {
        await createMutation.mutateAsync(formData)
      }
      resetForm()
    } catch (err) {
      console.error('Error al guardar área:', err)
    }
  }

  const handleEdit = (area: Area) => {
    setEditingArea(area)
    setFormData({
      name: area.name,
      type: area.type,
      color: area.color,
      description: area.description || '',
      icon: area.icon || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta área?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (err) {
        console.error('Error al eliminar área:', err)
      }
    }
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingArea(null)
    setFormData({
      name: '',
      type: 'Personal',
      color: '#3498db',
      description: '',
      icon: ''
    })
  }

  if (isLoading) return <div className="page"><div className="loading">Cargando áreas...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Áreas de Vida</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nueva Área
        </button>
      </div>

      <ul className="list">
        {areas?.map((area) => (
          <li key={area.id} className="list-item">
            <div className="list-item-content">
              <h3 style={{ color: area.color }}>{area.name}</h3>
              <p><strong>Tipo:</strong> {area.type}</p>
              {area.description && <p>{area.description}</p>}
            </div>
            <div className="list-item-actions">
              <button className="btn btn-secondary" onClick={() => handleEdit(area)}>
                Editar
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(area.id)}>
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
              <h3>{editingArea ? 'Editar Área' : 'Nueva Área'}</h3>
            </div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="Personal">Personal</option>
                  <option value="Profesional">Profesional</option>
                  <option value="Académico">Académico</option>
                  <option value="Salud">Salud</option>
                  <option value="Financiero">Financiero</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color *</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Ícono</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Emoji o código de ícono"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingArea ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AreasPage
