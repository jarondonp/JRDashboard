import { useState, useEffect, type FormEvent } from 'react'
import { ModalFooter } from '../Modal'
import { Button } from '../Button'
import { SmartSelect } from '../SmartSelect'
import type { Task, TaskInput } from '../../services/tasksApi'
import { useAreas } from '../../hooks/useAreas'
import { useGoals } from '../../hooks/useGoals'
import { useGlobalModal } from '../../context/GlobalModalContext'

interface TaskFormProps {
    initialData?: Task | null
    onSubmit: (data: TaskInput) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    submitText?: string
}

export const createEmptyTaskInput = (): TaskInput => ({
    area_id: '',
    goal_id: '',
    title: '',
    description: '',
    status: 'pendiente',
    due_date: '',
    estimated_effort: 0,
    progress_percentage: 0,
    tags: [],
})

export function TaskForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    submitText
}: TaskFormProps) {
    const { data: areas } = useAreas()
    const { data: goals } = useGoals()
    const { openModal } = useGlobalModal()
    const [formData, setFormData] = useState<TaskInput>(createEmptyTaskInput())
    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        if (initialData) {
            setFormData({
                area_id: initialData.area_id || '',
                goal_id: initialData.goal_id || '',
                title: initialData.title || '',
                description: initialData.description || '',
                status: initialData.status || 'pendiente',
                due_date: initialData.due_date || '',
                estimated_effort: initialData.estimated_effort || 0,
                progress_percentage: initialData.progress_percentage || 0,
                tags: initialData.tags || []
            })
        } else {
            setFormData(createEmptyTaskInput())
        }
    }, [initialData])

    const filteredGoals = goals?.filter(g => g.area_id === formData.area_id) || []

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const cleanData: TaskInput = {
            ...formData,
            goal_id: formData.goal_id || null,
            description: formData.description || null,
            due_date: formData.due_date || null,
            estimated_effort: formData.estimated_effort || null,
            progress_percentage: formData.progress_percentage || 0,
        }
        await onSubmit(cleanData)
    }

    const addTag = () => {
        if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
            setFormData({
                ...formData,
                tags: [...(formData.tags || []), tagInput.trim()]
            })
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags?.filter(tag => tag !== tagToRemove)
        })
    }

    const handleCreateArea = () => {
        openModal('area', 'create', null, (newArea) => {
            if (newArea?.id) {
                setFormData(prev => ({ ...prev, area_id: newArea.id, goal_id: '' }))
            }
        })
    }

    const handleCreateGoal = () => {
        if (!formData.area_id) return
        openModal('goal', 'create', { area_id: formData.area_id }, (newGoal) => {
            if (newGoal?.id) {
                setFormData(prev => ({ ...prev, goal_id: newGoal.id }))
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
                        onChange={(e) => setFormData({ ...formData, area_id: e.target.value, goal_id: '' })}
                        options={areas?.map(a => ({ value: a.id, label: a.name })) || []}
                        onCreate={handleCreateArea}
                        createLabel="Crear nueva Área"
                    />
                </div>

                <div>
                    <SmartSelect
                        label="Meta (opcional)"
                        value={formData.goal_id || ''}
                        onChange={(e) => setFormData({ ...formData, goal_id: e.target.value })}
                        options={filteredGoals.map(g => ({ value: g.id, label: g.title }))}
                        onCreate={handleCreateGoal}
                        createLabel="Crear nueva Meta"
                        disabled={!formData.area_id}
                    />
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
                    placeholder="Ej: Redactar informe mensual"
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
                    placeholder="Añade detalles sobre la tarea..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado *
                    </label>
                    <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="completada">Completada</option>
                        <option value="bloqueada">Bloqueada</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Progreso (%)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.progress_percentage || 0}
                        onChange={(e) => setFormData({ ...formData, progress_percentage: e.target.value ? parseInt(e.target.value) : 0 })}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Se actualiza automáticamente al registrar avances.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Límite
                    </label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.due_date || ''}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Esfuerzo (horas)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.estimated_effort || ''}
                        onChange={(e) => setFormData({ ...formData, estimated_effort: e.target.value ? parseFloat(e.target.value) : 0 })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiquetas
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags?.map(tag => (
                        <span
                            key={tag}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs cursor-pointer hover:bg-indigo-100 border border-indigo-100 transition-colors"
                            onClick={() => removeTag(tag)}
                        >
                            {tag} ×
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Agregar etiqueta y presionar Enter..."
                    />
                    <Button type="button" variant="secondary" onClick={addTag}>
                        +
                    </Button>
                </div>
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
