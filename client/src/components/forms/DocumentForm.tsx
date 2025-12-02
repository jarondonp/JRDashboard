import { useState, useEffect, type FormEvent } from 'react'
import { ModalFooter } from '../Modal'
import type { Document, DocumentInput } from '../../services/documentsApi'
import { useAreas } from '../../hooks/useAreas'
import { useGoals } from '../../hooks/useGoals'
import { useTasks } from '../../hooks/useTasks'

interface DocumentFormProps {
    initialData?: Document | null
    onSubmit: (data: DocumentInput) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    submitText?: string
}

export const createEmptyDocumentInput = (): DocumentInput => ({
    area_id: '',
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
    const [formData, setFormData] = useState<DocumentInput>(createEmptyDocumentInput())

    useEffect(() => {
        if (initialData) {
            setFormData({
                area_id: initialData.area_id,
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

    const filteredTasks = tasks?.filter(t => {
        if (t.area_id !== formData.area_id) return false
        if (formData.goal_id && t.goal_id !== formData.goal_id) return false
        return true
    }) || []

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const cleanData: DocumentInput = {
            ...formData,
            goal_id: formData.goal_id || undefined, // undefined for optional fields in DocumentInput?
            task_id: formData.task_id || undefined,
            description: formData.description || undefined,
            url: formData.url || undefined,
            review_date: formData.review_date || undefined,
        }
        // Note: DocumentInput uses optional fields (?), so undefined is correct.
        // But if backend expects null, we might need to cast or change type.
        // In schema.ts, they are optional() which means undefined is fine for Zod.
        // But storage might expect null?
        // Let's check schema.ts again.
        // insertDocumentSchema: goal_id: z.string().optional()
        // So undefined is fine.

        await onSubmit(cleanData)
    }

    return (
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
                        onChange={(e) => setFormData({ ...formData, area_id: e.target.value, goal_id: '', task_id: '' })}
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
