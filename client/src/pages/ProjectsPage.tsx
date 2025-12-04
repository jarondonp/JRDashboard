import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    useProjects,
    useDeleteProject,
    useAreas,
    useCardLayout,
    useViewMode,
    useRegisterQuickAction,
} from '../hooks'
import {
    Card,
    CardHeader,
    CardBody,
    useToast,
    CardLayoutToolbar,
    ViewModeToggle,
    InlineCreateButton,
} from '../components'
import { useGlobalModal } from '../context/GlobalModalContext'
import type { Project } from '../services/projectsApi'

function ProjectsPage() {
    const navigate = useNavigate()
    const { data: projects, isLoading, error } = useProjects()
    const { data: areas } = useAreas()
    const deleteMutation = useDeleteProject()
    const { showToast } = useToast()
    const { openModal } = useGlobalModal()

    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<'title' | 'status' | 'created_at'>('created_at')
    const { density, setDensity } = useCardLayout('projects')
    const { mode: viewMode, setMode: setViewMode } = useViewMode('projects:view-mode', 'cards')

    const formatDate = (value?: string | null) => {
        if (!value) return 'Sin fecha'
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
    }

    const getAreaName = (areaId: string | null) => {
        if (!areaId) return 'Global'
        return areas?.find(a => a.id === areaId)?.name || 'Sin área'
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'activo': return 'bg-green-100 text-green-800'
            case 'en_pausa': return 'bg-yellow-100 text-yellow-800'
            case 'completado': return 'bg-blue-100 text-blue-800'
            case 'archivado': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const handleEdit = (project: Project) => {
        openModal('project', 'edit', project)
    }

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
            try {
                await deleteMutation.mutateAsync(id)
                showToast('Proyecto eliminado', 'success')
            } catch (err) {
                showToast('Error al eliminar proyecto', 'error')
                console.error('Error al eliminar proyecto:', err)
            }
        }
    }

    const filteredProjects = useMemo(() => {
        if (!projects) return []
        const normalizedSearch = searchTerm.trim().toLowerCase()
        if (!normalizedSearch) return [...projects]

        return projects.filter((project) => {
            const title = project.title.toLowerCase()
            const description = (project.description || '').toLowerCase()
            const areaName = getAreaName(project.area_id).toLowerCase()

            return [title, description, areaName].some((value) =>
                value.includes(normalizedSearch),
            )
        })
    }, [projects, searchTerm, areas])

    const sortedProjects = useMemo(() => {
        return [...filteredProjects].sort((a, b) => {
            if (sortBy === 'title') {
                return a.title.localeCompare(b.title)
            }
            if (sortBy === 'status') {
                return (a.status || '').localeCompare(b.status || '')
            }
            // created_at
            const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
            const bDate = b.created_at ? new Date(b.created_at).getTime() : 0
            return bDate - aDate
        })
    }, [filteredProjects, sortBy])

    useRegisterQuickAction('project:create', () => openModal('project', 'create'))

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
                        <h1 className="text-3xl font-bold mb-1">🚀 Proyectos</h1>
                        <p className="text-indigo-100">Gestiona tus grandes iniciativas</p>
                    </div>
                    <InlineCreateButton
                        type="project"
                        label="+ Nuevo Proyecto"
                        variant="secondary"
                    />
                </div>
            </motion.div>

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <CardLayoutToolbar
                        searchValue={searchTerm}
                        onSearchChange={setSearchTerm}
                        searchPlaceholder="Buscar por título o área"
                        sortOptions={[
                            { value: 'created_at', label: 'Más recientes' },
                            { value: 'title', label: 'Alfabéticamente' },
                            { value: 'status', label: 'Por estado' },
                        ]}
                        sortValue={sortBy}
                        onSortChange={(value) => setSortBy(value as 'title' | 'status' | 'created_at')}
                        density={density}
                        onDensityChange={setDensity}
                    />
                    <ViewModeToggle mode={viewMode} onChange={setViewMode} />
                </div>

                {sortedProjects.length > 0 ? (
                    viewMode === 'cards' ? (
                        <motion.div
                            className={`${gridClass} mt-6`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            <AnimatePresence>
                                {sortedProjects.map((project, index) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                        className="cursor-pointer"
                                    >
                                        <Card hover className="h-full" minHeightClass="min-h-[200px]">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-lg font-semibold text-gray-800 flex-1">
                                                        {project.code && (
                                                            <span className="mr-2 text-indigo-600 font-mono text-sm bg-indigo-50 px-1.5 py-0.5 rounded">
                                                                [{project.code}]
                                                            </span>
                                                        )}
                                                        {project.title}
                                                    </h3>
                                                    <div className="flex gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleEdit(project)}
                                                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(project.id)}
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
                                                        <strong>Área:</strong> {getAreaName(project.area_id)}
                                                    </p>
                                                    {project.description && (
                                                        <p className="text-sm text-gray-700 line-clamp-2">{project.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                                            {project.status || 'activo'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
                                                        {project.start_date && <p>Inicio: {formatDate(project.start_date)}</p>}
                                                        {project.end_date && <p>Fin: {formatDate(project.end_date)}</p>}
                                                    </div>
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
                                            <th className="px-4 py-3">Proyecto</th>
                                            <th className="px-4 py-3">Área</th>
                                            <th className="px-4 py-3">Estado</th>
                                            <th className="px-4 py-3">Fechas</th>
                                            <th className="px-4 py-3 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-indigo-50 text-sm text-gray-700">
                                        {sortedProjects.map((project) => (
                                            <tr
                                                key={project.id}
                                                className="hover:bg-indigo-50/40 transition cursor-pointer"
                                                onClick={() => navigate(`/projects/${project.id}`)}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-800">
                                                            {project.code && (
                                                                <span className="mr-2 text-indigo-600 font-mono text-xs bg-indigo-50 px-1.5 py-0.5 rounded">
                                                                    [{project.code}]
                                                                </span>
                                                            )}
                                                            {project.title}
                                                        </span>
                                                        {project.description && (
                                                            <span className="text-xs text-gray-500 line-clamp-1">{project.description}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                                                        {getAreaName(project.area_id)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}>
                                                        {project.status || 'activo'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600">
                                                    <div className="flex flex-col gap-1">
                                                        {project.start_date && <span>Inicio: {formatDate(project.start_date)}</span>}
                                                        {project.end_date && <span>Fin: {formatDate(project.end_date)}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(project)}
                                                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(project.id)}
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
                            {projects && projects.length > 0
                                ? 'No se encontraron proyectos con estos filtros'
                                : 'No hay proyectos registrados'}
                        </p>
                        <InlineCreateButton
                            type="project"
                            label="Crear nuevo proyecto"
                            variant="primary"
                            className="mt-4"
                        />
                    </motion.div>
                )}
            </div>
        </div>
    )
}

export default ProjectsPage
