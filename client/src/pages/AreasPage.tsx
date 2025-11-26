import { useMemo, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAreas, useCreateArea, useUpdateArea, useDeleteArea, useCardLayout } from '../hooks'
import { Button, Modal, ModalFooter, Card, CardHeader, CardBody, useToast, CardLayoutToolbar } from '../components'
import type { Area, AreaInput } from '../services/areasApi'

function AreasPage() {
  const { data: areas, isLoading, error } = useAreas()
  const createMutation = useCreateArea()
  const updateMutation = useUpdateArea()
  const deleteMutation = useDeleteArea()
  const { showToast } = useToast()

  const [showModal, setShowModal] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [formData, setFormData] = useState<AreaInput>({
    name: '',
    type: 'Personal',
    color: '#3498db',
    description: '',
    icon: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'type'>('name')
  const { density, setDensity } = useCardLayout('areas')

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    try {
      if (editingArea) {
        await updateMutation.mutateAsync({ id: editingArea.id, data: formData })
        showToast('Área actualizada exitosamente', 'success')
      } else {
        await createMutation.mutateAsync(formData)
        showToast('Área creada exitosamente', 'success')
      }
      resetForm()
    } catch (err) {
      showToast('Error al guardar área', 'error')
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
        showToast('Área eliminada', 'success')
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

  const filteredAreas = useMemo(() => {
    if (!areas) return []
    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return [...areas]
    return areas.filter((area) => {
      const name = area.name.toLowerCase()
      const description = (area.description || '').toLowerCase()
      return (
        name.includes(normalizedSearch) ||
        description.includes(normalizedSearch) ||
        area.type.toLowerCase().includes(normalizedSearch)
      )
    })
  }, [areas, searchTerm])

  const sortedAreas = useMemo(() => {
    return [...filteredAreas].sort((a, b) => {
      if (sortBy === 'type') {
        return a.type.localeCompare(b.type)
      }
      return a.name.localeCompare(b.name)
    })
  }, [filteredAreas, sortBy])

  const gridClass =
    density === 'compact'
      ? 'grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,_1fr))] auto-rows-[1fr]'
      : 'grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,_1fr))] auto-rows-[1fr]'

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
            <h1 className="text-3xl font-bold mb-1">🎨 Áreas de Vida</h1>
            <p className="text-indigo-100">Organiza tu vida en diferentes áreas</p>
          </div>
          <Button variant="secondary" onClick={() => setShowModal(true)}>
            + Nueva Área
          </Button>
        </div>
      </motion.div>

      {/* Areas Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <CardLayoutToolbar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nombre, tipo o descripción"
          sortOptions={[
            { value: 'name', label: 'Ordenar por nombre' },
            { value: 'type', label: 'Ordenar por tipo' },
          ]}
          sortValue={sortBy}
          onSortChange={(value) => setSortBy(value as 'name' | 'type')}
          density={density}
          onDensityChange={setDensity}
        />

        {sortedAreas.length > 0 ? (
          <motion.div 
            className={`${gridClass} mt-6`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {sortedAreas.map((area, index) => (
                <motion.div
                  key={area.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover className="h-full" minHeightClass="min-h-[230px]">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2 flex-1">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: area.color }}
                          />
                          <h3 className="text-lg font-semibold text-gray-800">{area.name}</h3>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => handleEdit(area)}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(area.id)}
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
                          <strong>Tipo:</strong> {area.type}
                        </p>
                        {area.description && (
                          <p className="text-sm text-gray-700">{area.description}</p>
                        )}
                        {area.icon && (
                          <p className="text-sm text-gray-600">
                            <strong>Icono:</strong> {area.icon}
                          </p>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-500 text-lg">
                {areas && areas.length > 0
                  ? 'No se encontraron áreas con esos criterios'
                  : 'No hay áreas registradas'}
              </p>
              <Button variant="primary" onClick={() => setShowModal(true)} className="mt-4">
                Crear nueva área
              </Button>
            </motion.div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingArea ? 'Editar Área' : 'Nueva Área'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Personal">Personal</option>
              <option value="Profesional">Profesional</option>
              <option value="Académico">Académico</option>
              <option value="Salud">Salud</option>
              <option value="Financiero">Financiero</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color *
            </label>
            <input
              type="color"
              required
              className="w-full h-12 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icono (opcional)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Ej: 🎯, 💼, 📚"
            />
          </div>

          <ModalFooter
            onCancel={resetForm}
            onSubmit={handleSubmit}
            submitText={editingArea ? 'Actualizar' : 'Crear'}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </form>
      </Modal>
    </div>
  )
}

export default AreasPage
