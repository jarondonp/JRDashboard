import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    useProject,
    useDeleteProject,
    useAreas,
    useGoals,
    useTasks,
    useDocuments,
} from '../hooks'
import {
    Card,
    CardHeader,
    CardBody,
    useToast,
    Tabs,
    Button,
    InlineCreateButton,
} from '../components'
import { useGlobalModal } from '../context/GlobalModalContext'

function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: project, isLoading: isLoadingProject, error } = useProject(id)
    const { data: areas } = useAreas()
    const { data: goals } = useGoals()
    const { data: tasks } = useTasks()
    const { data: documents } = useDocuments()
    const deleteMutation = useDeleteProject()
    const { showToast } = useToast()
    const { openModal } = useGlobalModal()

    const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'tasks' | 'documents'>('overview')

    const area = areas?.find(a => a.id === project?.area_id)

    const projectGoals = useMemo(() => goals?.filter(g => g.project_id === id) || [], [goals, id])
    const projectTasks = useMemo(() => tasks?.filter(t => t.project_id === id) || [], [tasks, id])
    const projectDocuments = useMemo(() => documents?.filter(d => d.project_id === id) || [], [documents, id])

    const progress = useMemo(() => {
        if (!projectTasks.length) return 0
        const completed = projectTasks.filter(t => t.status === 'completada').length
        return Math.round((completed / projectTasks.length) * 100)
    }, [projectTasks])

    const formatDate = (value?: string | null) => {
        if (!value) return 'Sin fecha'
        const date = new Date(value)
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
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

    const handleDelete = async () => {
        if (window.confirm('¿Estás seguro de eliminar este proyecto?')) {
            try {
                await deleteMutation.mutateAsync(id!)
                showToast('Proyecto eliminado', 'success')
                navigate('/projects')
            } catch (err) {
                showToast('Error al eliminar proyecto', 'error')
                console.error('Error al eliminar proyecto:', err)
            }
        }
    }

    if (isLoadingProject) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
                />
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
                <Card>
                    <CardBody>
                        <p className="text-red-600">Error: No se encontró el proyecto</p>
                        <Button onClick={() => navigate('/projects')} variant="secondary" className="mt-4">
                            Volver a Proyectos
                        </Button>
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
                className="bg-white shadow-sm border-b border-gray-200 px-8 py-6"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    onClick={() => navigate('/projects')}
                                    className="text-sm text-gray-500 hover:text-indigo-600 cursor-pointer transition-colors"
                                >
                                    Proyectos
                                </span>
                                <span className="text-gray-400">/</span>
                                <span className="text-sm text-indigo-600 font-medium">{project.title}</span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                    {project.status || 'activo'}
                                </span>
                                {area ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        {area.name}
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Global
                                    </span>
                                )}
                                {(project.start_date || project.end_date) && (
                                    <span className="text-xs text-gray-500">
                                        {project.start_date ? formatDate(project.start_date) : '...'} - {project.end_date ? formatDate(project.end_date) : '...'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={() => openModal('project', 'edit', project)}>
                                Editar
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>
                                Eliminar
                            </Button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progreso General</span>
                            <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="mb-6">
                    <Tabs
                        tabs={[
                            { id: 'overview', label: 'Resumen', icon: '📊' },
                            { id: 'goals', label: `Metas (${projectGoals.length})`, icon: '🎯' },
                            { id: 'tasks', label: `Tareas (${projectTasks.length})`, icon: '✅' },
                            { id: 'documents', label: `Documentos (${projectDocuments.length})`, icon: '📄' },
                        ]}
                        activeTab={activeTab}
                        onChange={(id) => setActiveTab(id as any)}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            <div className="md:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader><h3 className="font-semibold">Descripción</h3></CardHeader>
                                    <CardBody>
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {project.description || 'Sin descripción.'}
                                        </p>
                                    </CardBody>
                                </Card>
                            </div>
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader><h3 className="font-semibold">Estadísticas</h3></CardHeader>
                                    <CardBody>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Metas</span>
                                                <span className="font-medium">{projectGoals.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Tareas</span>
                                                <span className="font-medium">{projectTasks.length}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">Documentos</span>
                                                <span className="font-medium">{projectDocuments.length}</span>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'goals' && (
                        <motion.div
                            key="goals"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="mb-4 flex justify-end">
                                <InlineCreateButton
                                    type="goal"
                                    label="Nueva Meta"
                                    initialData={{ project_id: id, area_id: project.area_id || undefined }}
                                />
                            </div>
                            {projectGoals.length > 0 ? (
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {projectGoals.map(goal => (
                                        <Card key={goal.id} hover onClick={() => openModal('goal', 'edit', goal)}>
                                            <CardBody>
                                                <h4 className="font-semibold text-gray-800 mb-2">{goal.title}</h4>
                                                <div className="flex justify-between items-center text-sm text-gray-500">
                                                    <span>{goal.status}</span>
                                                    <span>{goal.computed_progress}%</span>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No hay metas asociadas a este proyecto.</p>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="mb-4 flex justify-end">
                                <InlineCreateButton
                                    type="task"
                                    label="Nueva Tarea"
                                    initialData={{ project_id: id, area_id: project.area_id || undefined }}
                                />
                            </div>
                            {projectTasks.length > 0 ? (
                                <div className="space-y-3">
                                    {projectTasks.map(task => (
                                        <Card key={task.id} hover onClick={() => openModal('task', 'edit', task)}>
                                            <CardBody className="py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'completada' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                        <span className={task.status === 'completada' ? 'line-through text-gray-500' : 'text-gray-800'}>
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <span>{task.progress_percentage}%</span>
                                                        {task.due_date && <span>{formatDate(task.due_date)}</span>}
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No hay tareas asociadas a este proyecto.</p>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'documents' && (
                        <motion.div
                            key="documents"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="mb-4 flex justify-end">
                                <InlineCreateButton
                                    type="document"
                                    label="Nuevo Documento"
                                    initialData={{ project_id: id, area_id: project.area_id }}
                                />
                            </div>
                            {projectDocuments.length > 0 ? (
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {projectDocuments.map(doc => (
                                        <Card key={doc.id} hover onClick={() => openModal('document', 'edit', doc)}>
                                            <CardBody>
                                                <div className="flex items-start gap-3">
                                                    <span className="text-2xl">📄</span>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800">{doc.title}</h4>
                                                        <p className="text-xs text-gray-500 mt-1">{doc.doc_type}</p>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No hay documentos asociados a este proyecto.</p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default ProjectDetailPage
