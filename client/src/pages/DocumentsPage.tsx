import { useState } from 'react'
import { useDocuments, useCreateDocument, useUpdateDocument, useDeleteDocument, useAreas, useGoals } from '../hooks'
import type { Document } from '../services/documentsApi'

interface DocumentFormData {
  area_id: string
  goal_id: string
  title: string
  description: string
  url: string
  doc_type: string
  review_date: string
}

function DocumentsPage() {
  const { data: documents, isLoading, error } = useDocuments()
  const { data: areas } = useAreas()
  const { data: goals } = useGoals()
  const createMutation = useCreateDocument()
  const updateMutation = useUpdateDocument()
  const deleteMutation = useDeleteDocument()

  const [showModal, setShowModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [formData, setFormData] = useState<DocumentFormData>({
    area_id: '',
    goal_id: '',
    title: '',
    description: '',
    url: '',
    doc_type: 'General',
    review_date: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        goal_id: formData.goal_id || undefined,
        url: formData.url || undefined,
        review_date: formData.review_date || undefined
      }

      if (editingDoc) {
        await updateMutation.mutateAsync({ id: editingDoc.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
      resetForm()
    } catch (err) {
      console.error('Error al guardar documento:', err)
    }
  }

  const handleEdit = (doc: Document) => {
    setEditingDoc(doc)
    setFormData({
      area_id: doc.area_id,
      goal_id: doc.goal_id || '',
      title: doc.title,
      description: doc.description || '',
      url: doc.url || '',
      doc_type: doc.doc_type || 'General',
      review_date: doc.review_date || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (err) {
        console.error('Error al eliminar documento:', err)
      }
    }
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingDoc(null)
    setFormData({
      area_id: '',
      goal_id: '',
      title: '',
      description: '',
      url: '',
      doc_type: 'General',
      review_date: ''
    })
  }

  const getAreaName = (areaId: string) => {
    return areas?.find(a => a.id === areaId)?.name || 'Sin área'
  }

  const getGoalTitle = (goalId?: string) => {
    if (!goalId) return null
    return goals?.find(g => g.id === goalId)?.title || 'Meta desconocida'
  }

  const getDocTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case 'certificado': return 'badge-success'
      case 'contrato': return 'badge-warning'
      case 'legal': return 'badge-danger'
      case 'financiero': return 'badge-info'
      default: return 'badge-secondary'
    }
  }

  const isReviewSoon = (reviewDate?: string) => {
    if (!reviewDate) return false
    const date = new Date(reviewDate)
    const now = new Date()
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 7
  }

  const filteredGoals = goals?.filter(g => g.area_id === formData.area_id) || []

  if (isLoading) return <div className="page"><div className="loading">Cargando documentos...</div></div>
  if (error) return <div className="page"><div className="error">Error: {error.message}</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <h2>Documentos</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Nuevo Documento
        </button>
      </div>

      <ul className="list">
        {documents?.map((doc) => {
          const reviewSoon = isReviewSoon(doc.review_date)
          return (
            <li key={doc.id} className="list-item">
              <div className="list-item-content">
                <h3>{doc.title}</h3>
                <p><strong>Área:</strong> {getAreaName(doc.area_id)}</p>
                {doc.goal_id && <p><strong>Meta:</strong> {getGoalTitle(doc.goal_id)}</p>}
                {doc.description && <p>{doc.description}</p>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <span className={`badge ${getDocTypeBadgeClass(doc.doc_type || 'General')}`}>
                    {doc.doc_type || 'General'}
                  </span>
                  {doc.review_date && (
                    <span className={`badge ${reviewSoon ? 'badge-warning' : 'badge-info'}`}>
                      {reviewSoon ? '⚠️ ' : ''}Revisión: {new Date(doc.review_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {doc.url && (
                  <p style={{ marginTop: '8px' }}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                      🔗 Ver documento
                    </a>
                  </p>
                )}
              </div>
              <div className="list-item-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(doc)}>
                  Editar
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(doc.id)}>
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
              <h3>{editingDoc ? 'Editar Documento' : 'Nuevo Documento'}</h3>
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
                <label>Título del Documento *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Ej: Pasaporte, Contrato de arrendamiento..."
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles adicionales del documento..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Documento *</label>
                <select
                  value={formData.doc_type}
                  onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
                  required
                >
                  <option value="General">General</option>
                  <option value="Certificado">Certificado</option>
                  <option value="Contrato">Contrato</option>
                  <option value="Legal">Legal</option>
                  <option value="Financiero">Financiero</option>
                  <option value="Médico">Médico</option>
                  <option value="Educativo">Educativo</option>
                  <option value="Identificación">Identificación</option>
                </select>
              </div>

              <div className="form-group">
                <label>URL / Enlace (opcional)</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>Fecha de Revisión (opcional)</label>
                <input
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                />
                <small style={{ color: '#666', fontSize: '0.875rem' }}>
                  Se te alertará cuando se acerque la fecha de revisión
                </small>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDoc ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentsPage
