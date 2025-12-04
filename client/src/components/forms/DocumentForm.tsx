import { useState, useEffect, type FormEvent } from 'react'
import { ModalFooter } from '../Modal'
import type { Document, DocumentInput } from '../../services/documentsApi'
import { useAreas } from '../../hooks/useAreas'
import { useGoals } from '../../hooks/useGoals'
import { useTasks } from '../../hooks/useTasks'
import { useProjects } from '../../hooks/useProjects'
import { useGlobalModal } from '../../context/GlobalModalContext'
import { SmartSelect } from '../SmartSelect'

interface DocumentFormProps {
    initialData?: Document | null
    onSubmit: (data: DocumentInput) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    submitText?: string
}

export const createEmptyDocumentInput = (): DocumentInput => ({
    area_id: '',
    project_id: '',
    goal_id: '',
    task_id: '',
    title: '',
    description: '',
    url: '',
    doc_type: 'General',
    review_date: '',
})

export function DocumentForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    submitText
}: DocumentFormProps) {
    const { data: areas } = useAreas()
    const { data: goals } = useGoals()
    const { data: tasks } = useTasks()
    const { data: projects } = useProjects()
    const { openModal } = useGlobalModal()
    const [formData, setFormData] = useState<DocumentInput>(createEmptyDocumentInput())

    useEffect(() => {
        if (initialData) {
            setFormData({
                area_id: initialData.area_id,
                project_id: initialData.project_id || '',
                goal_id: initialData.goal_id || '',
                task_id: initialData.task_id || '',
                title: initialData.title,
                description: initialData.description || '',
                url: initialData.url || '',
                doc_type: initialData.doc_type || 'General',
                review_date: initialData.review_date || '',
            })
        } else {
            setFormData(createEmptyDocumentInput())
        }
    }, [initialData])

    const filteredGoals = goals?.filter(g => g.area_id === formData.area_id) || []
    const filteredProjects = projects?.filter(p => p.area_id === formData.area_id || !p.area_id) || []

    const filteredTasks = tasks?.filter(t => {
        if (t.area_id !== formData.area_id) return false
        if (formData.goal_id && t.goal_id !== formData.goal_id) return false
        return true
    }) || []

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const cleanData: DocumentInput = {
            ...formData,
            project_id: formData.project_id || undefined,
            goal_id: formData.goal_id || undefined,
            task_id: formData.task_id || undefined,
            description: formData.description || undefined,
            url: formData.url || undefined,
            review_date: formData.review_date || undefined,
        }
        await onSubmit(cleanData)
    }

    const handleCreateArea = () => {
        openModal('area', 'create', null, (newArea) => {
            if (newArea?.id) {
                setFormData(prev => ({ ...prev, area_id: newArea.id, project_id: '', goal_id: '', task_id: '' }))
            }
        })
    }

    const handleCreateProject = () => {
        if (!formData.area_id) return
        openModal('project', 'create', { area_id: formData.area_id }, (newProject) => {
            if (newProject?.id) {
                setFormData(prev => ({ ...prev, project_id: newProject.id }))
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <SmartSelect
                        label="Área *"
                        required
                        value={formData.area_id}
                        onChange={(e) => setFormData({ ...formData, area_id: e.target.value, project_id: '', goal_id: '', task_id: '' })}
                        options={areas?.map(a => ({ value: a.id, label: a.name })) || []}
                        onCreate={handleCreateArea}
                        createLabel="Crear nueva Área"
                    />
                </div>

                <div>
                    <SmartSelect
                        label="Proyecto (opcional)"
                        value={formData.project_id || ''}
                        onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                        options={filteredProjects.map(p => ({ value: p.id, label: p.area_id ? p.title : `${p.title} (Global)` }))}
                        onCreate={handleCreateProject}
                        createLabel="Crear nuevo Proyecto"
                        disabled={!formData.area_id}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meta (opcional)
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        value={formData.goal_id || ''}
                        onChange={(e) => setFormData({ ...formData, goal_id: e.target.value, task_id: '' })}
                        disabled={!formData.area_id}
                    >
                        <option value="">Sin meta</option>
                        {filteredGoals.map((goal) => (
                            <option key={goal.id} value={goal.id}>{goal.title}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tarea (opcional)
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.task_id || ''}
                        onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                        disabled={!formData.area_id}
                    >
                        <option value="">Sin tarea</option>
                        {filteredTasks.map((task) => (
                            <option key={task.id} value={task.id}>{task.title}</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Contrato de Arrendamiento 2024"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                </label>
                <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descripción del contenido..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.doc_type || 'General'}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.review_date || ''}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                />
                <p className="mt-1 text-xs text-gray-500">
                    Enlace a Google Drive, Dropbox, etc.
                </p>
            </div>

            <ModalFooter
                onCancel={onCancel}
                onSubmit={handleSubmit}
                submitText={submitText || (initialData ? 'Actualizar' : 'Crear')}
                isLoading={isLoading}
            />
        </form>
    )
}
