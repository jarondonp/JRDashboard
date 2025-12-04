import { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  useCardLayout,
  useViewMode,
  useRegisterQuickAction,
} from '../hooks'
import {
  Button,
  Modal,
  Card,
  CardHeader,
  CardBody,
  useToast,
  CardLayoutToolbar,
  ViewModeToggle,
} from '../components'
import { AreaForm } from '../components/forms/AreaForm'
import type { Area, AreaInput } from '../services/areasApi'

function AreasPage() {
  const { data: areas, isLoading, error } = useAreas()
  const createMutation = useCreateArea()
  const updateMutation = useUpdateArea()
  const deleteMutation = useDeleteArea()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [showModal, setShowModal] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [areaToDelete, setAreaToDelete] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'type'>('name')
  const { density, setDensity } = useCardLayout('areas')
  const { mode: viewMode, setMode: setViewMode } = useViewMode('areas:view-mode', 'table')

  const handleSubmit = async (data: AreaInput) => {
    try {
      if (editingArea) {
        await updateMutation.mutateAsync({ id: editingArea.id, data })
        showToast('Área actualizada exitosamente', 'success')
      } else {
        await createMutation.mutateAsync(data)
        showToast('Área creada exitosamente', 'success')
      }
      setShowModal(false)
      setEditingArea(null)
    } catch (err) {
      showToast('Error al guardar área', 'error')
      console.error('Error al guardar área:', err)
    }
  }

  const handleEdit = (area: Area) => {
    setEditingArea(area)
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    setAreaToDelete(id)
  }

  const confirmDelete = async () => {
    if (!areaToDelete) return

    try {
      await deleteMutation.mutateAsync(areaToDelete)
      showToast('Área eliminada exitosamente', 'success')
      setAreaToDelete(null)
    } catch (err: any) {
      const errorMessage = err?.message || 'Error desconocido'
      console.error('Error al eliminar área:', err)
      showToast(`Error al eliminar área: ${errorMessage}`, 'error')
    }
  }

  const cancelDelete = () => {
    setAreaToDelete(null)
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingArea(null)
  }

  const openCreateAreaModal = useCallback(() => {
    setEditingArea(null)
    setShowModal(true)
  }, [])

  useRegisterQuickAction('area:create', openCreateAreaModal)

  useEffect(() => {
    const state = location.state as { quickAction?: string } | undefined
    if (state?.quickAction === 'area:create') {
      openCreateAreaModal()
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate, openCreateAreaModal])

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
          <Button variant="secondary" onClick={openCreateAreaModal}>
            + Nueva Área
          </Button>
        </div>
      </motion.div>

      {/* Areas Grid */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {sortedAreas.length > 0 ? (
          viewMode === 'cards' ? (
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
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Color</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50 text-sm text-gray-700">
                    {sortedAreas.map((area) => (
                      <tr key={area.id} className="hover:bg-indigo-50/40 transition">
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {area.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {area.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full border border-indigo-200"
                              style={{ backgroundColor: area.color }}
                            />
                            <span className="text-xs text-gray-500">{area.color}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {area.description ? (
                            <p className="line-clamp-2 text-gray-600">{area.description}</p>
                          ) : (
                            <span className="text-xs text-gray-400">Sin descripción</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(area)}
                              className="text-indigo-600 hover:text-indigo-800 transition-colors"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDelete(area.id)}
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
            className="mt-10 text-center"
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
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingArea ? 'Editar Área' : 'Nueva Área'}
        size="md"
      >
        <AreaForm
          initialData={editingArea}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!areaToDelete}
        onClose={cancelDelete}
        title="Confirmar Eliminación"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            ¿Estás seguro de que deseas eliminar esta área? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={cancelDelete}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AreasPage
