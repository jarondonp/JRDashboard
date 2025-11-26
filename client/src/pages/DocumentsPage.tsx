import { useMemo, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
  useAreas,
  useGoals,
  useCardLayout,
  useViewMode,
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
} from '../components'
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
  const { showToast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'review_date' | 'title'>('review_date')
  const { density, setDensity } = useCardLayout('documents')
  const { mode: viewMode, setMode: setViewMode } = useViewMode('documents:view-mode')

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

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    try {
      const submitData = {
        ...formData,
        goal_id: formData.goal_id || undefined,
        url: formData.url || undefined,
        review_date: formData.review_date || undefined
      }

      if (editingDoc) {
        await updateMutation.mutateAsync({ id: editingDoc.id, data: submitData })
        showToast('Documento actualizado exitosamente', 'success')
      } else {
        await createMutation.mutateAsync(submitData)
        showToast('Documento creado exitosamente', 'success')
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
        showToast('Documento eliminado', 'success')
      } catch (err) {
        showToast('Error al eliminar documento', 'error')
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

  const getDocTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'certificado': return 'bg-green-100 text-green-800'
      case 'contrato': return 'bg-yellow-100 text-yellow-800'
      case 'legal': return 'bg-red-100 text-red-800'
      case 'financiero': return 'bg-blue-100 text-blue-800'
      case 'pdf': return 'bg-purple-100 text-purple-800'
      case 'comprobante': return 'bg-teal-100 text-teal-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isReviewSoon = (reviewDate?: string) => {
    if (!reviewDate) return false
    const date = new Date(reviewDate)
    const now = new Date()
    const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil >= 0 && daysUntil <= 7
  }

  const formatDate = (value?: string | null) => {
    if (!value) return '—'
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString()
  }

  const filteredGoals = goals?.filter(g => g.area_id === formData.area_id) || []

  const filteredDocuments = useMemo(() => {
    if (!documents) return []
    const normalized = searchTerm.trim().toLowerCase()
    if (!normalized) return [...documents]

    return documents.filter((doc) => {
      const title = doc.title.toLowerCase()
      const description = (doc.description || '').toLowerCase()
      const areaName = getAreaName(doc.area_id).toLowerCase()
      const goalTitle = doc.goal_id ? (getGoalTitle(doc.goal_id) || '').toLowerCase() : ''
      const docType = (doc.doc_type || '').toLowerCase()
      return [title, description, areaName, goalTitle, docType].some((value) =>
        value.includes(normalized),
      )
    })
  }, [documents, searchTerm, areas, goals])

  const sortedDocuments = useMemo(() => {
    return [...filteredDocuments].sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title)
      }
      const aDate = a.review_date ? new Date(a.review_date).getTime() : Number.POSITIVE_INFINITY
      const bDate = b.review_date ? new Date(b.review_date).getTime() : Number.POSITIVE_INFINITY
      return aDate - bDate
    })
  }, [filteredDocuments, sortBy])

  const gridClass =
    density === 'compact'
      ? 'grid gap-4 grid-cols-[repeat(auto-fit,minmax(260px,_1fr))] auto-rows-[1fr]'
      : 'grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,_1fr))] auto-rows-[1fr]'

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
            <h1 className="text-3xl font-bold mb-1">📄 Documentos</h1>
            <p className="text-indigo-100">Gestiona tus documentos importantes</p>
          </div>
          <Button variant="secondary" onClick={() => setShowModal(true)}>
            + Nuevo Documento
          </Button>
        </div>
      </motion.div>

      {/* Documents Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardLayoutToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar por título, área, meta o tipo"
            sortOptions={[
              { value: 'review_date', label: 'Ordenar por fecha de revisión' },
              { value: 'title', label: 'Ordenar alfabéticamente' },
            ]}
            sortValue={sortBy}
            onSortChange={(value) => setSortBy(value as 'review_date' | 'title')}
            density={density}
            onDensityChange={setDensity}
          />
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
        {sortedDocuments.length > 0 ? (
          viewMode === 'cards' ? (
            <motion.div
              className={`${gridClass} mt-6`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <AnimatePresence>
                {sortedDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                      <Card hover className="h-full" minHeightClass="min-h-[230px]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-800 flex-1">{doc.title}</h3>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => handleEdit(doc)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
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
                          <strong>Área:</strong> {getAreaName(doc.area_id)}
                        </p>
                        {doc.goal_id && (
                          <p className="text-sm text-gray-600">
                            <strong>Meta:</strong> {getGoalTitle(doc.goal_id)}
                          </p>
                        )}
                        {doc.description && (
                          <p className="text-sm text-gray-700">{doc.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocTypeColor(doc.doc_type || 'General')}`}>
                            {doc.doc_type || 'General'}
                          </span>
                          {isReviewSoon(doc.review_date) && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ⚠️ Revisión próxima
                            </span>
                          )}
                        </div>

                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            🔗 Ver documento
                          </a>
                        )}

                        {doc.review_date && (
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            <p>Revisión: {new Date(doc.review_date).toLocaleDateString()}</p>
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
              className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-indigo-100">
                  <thead className="bg-indigo-50/60">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-indigo-600">
                      <th className="px-4 py-3">Documento</th>
                      <th className="px-4 py-3">Área</th>
                      <th className="px-4 py-3">Meta</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Revisión</th>
                      <th className="px-4 py-3">Enlace</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50 text-sm text-gray-700">
                    {sortedDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-indigo-50/40 transition">
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {doc.title}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {getAreaName(doc.area_id)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {doc.goal_id ? getGoalTitle(doc.goal_id) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getDocTypeColor(doc.doc_type || 'General')}`}>
                            {doc.doc_type || 'General'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {doc.review_date ? formatDate(doc.review_date) : '—'}
                          {isReviewSoon(doc.review_date) && (
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                              Próxima
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Abrir enlace
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">Sin enlace</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {doc.description ? doc.description : <span className="text-gray-400">Sin descripción</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(doc)}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDelete(doc.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-500 text-lg">No hay documentos registrados</p>
            <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
              Crear primer documento
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingDoc ? 'Editar Documento' : 'Nuevo Documento'}
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
                Tipo
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.doc_type}
                onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
              >
                <option value="General">General</option>
                <option value="Certificado">Certificado</option>
                <option value="Contrato">Contrato</option>
                <option value="Legal">Legal</option>
                <option value="Financiero">Financiero</option>
                <option value="PDF">PDF</option>
                <option value="Comprobante">Comprobante</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Revisión
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={formData.review_date}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del Documento
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <ModalFooter
            onCancel={resetForm}
            onSubmit={handleSubmit}
            submitText={editingDoc ? 'Actualizar' : 'Crear'}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </form>
      </Modal>
    </div>
  )
}

export default DocumentsPage
