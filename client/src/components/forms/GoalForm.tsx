import { useState, useEffect, type FormEvent } from 'react'
import { ModalFooter } from '../Modal'
import { SmartSelect } from '../SmartSelect'
import type { Goal, GoalInput } from '../../services/goalsApi'
import { useAreas } from '../../hooks/useAreas'
import { useGlobalModal } from '../../context/GlobalModalContext'

interface GoalFormProps {
    initialData?: Goal | null
    onSubmit: (data: GoalInput) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    submitText?: string
}

export const createEmptyGoalInput = (): GoalInput => ({
    area_id: '',
    title: '',
    description: '',
    goal_type: 'Corto Plazo',
    start_date: '',
    due_date: '',
    status: 'no_iniciada',
    priority: 'media',
    expected_outcome: '',
})

export function GoalForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    submitText
}: GoalFormProps) {
    const { data: areas } = useAreas()
    const { openModal } = useGlobalModal()
    const [formData, setFormData] = useState<GoalInput>(createEmptyGoalInput())

    useEffect(() => {
        if (initialData) {
            setFormData({
                area_id: initialData.area_id || '',
                title: initialData.title || '',
                description: initialData.description || '',
                goal_type: initialData.goal_type || 'Corto Plazo',
                start_date: initialData.start_date || '',
                due_date: initialData.due_date || '',
                status: initialData.status || 'no_iniciada',
                priority: initialData.priority || 'media',
                expected_outcome: initialData.expected_outcome || '',
                computed_progress: initialData.computed_progress
            })
        } else {
            setFormData(createEmptyGoalInput())
        }
    }, [initialData])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const cleanData: GoalInput = {
            ...formData,
            description: formData.description || null,
            goal_type: formData.goal_type || null,
            start_date: formData.start_date || null,
            due_date: formData.due_date || null,
            expected_outcome: formData.expected_outcome || null,
        }
        await onSubmit(cleanData)
    }

    const handleCreateArea = () => {
        openModal('area', 'create', null, (newArea) => {
            if (newArea?.id) {
                setFormData(prev => ({ ...prev, area_id: newArea.id }))
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
                        onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                        options={areas?.map(a => ({ value: a.id, label: a.name })) || []}
                        onCreate={handleCreateArea}
                        createLabel="Crear nueva Área"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Meta
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.goal_type || 'Corto Plazo'}
                        onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                    >
                        <option value="Corto Plazo">Corto Plazo</option>
                        <option value="Mediano Plazo">Mediano Plazo</option>
                        <option value="Largo Plazo">Largo Plazo</option>
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
                    placeholder="Ej: Aprender React Avanzado"
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
                    placeholder="Detalla qué quieres lograr..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridad
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                    </label>
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="no_iniciada">No Iniciada</option>
                        <option value="en_progreso">En Progreso</option>
                        <option value="completada">Completada</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Inicio
                    </label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.start_date || ''}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Vencimiento
                    </label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.due_date || ''}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resultado Esperado
                </label>
                <textarea
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    value={formData.expected_outcome || ''}
                    onChange={(e) => setFormData({ ...formData, expected_outcome: e.target.value })}
                    placeholder="¿Cómo sabrás que has tenido éxito?"
                />
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
