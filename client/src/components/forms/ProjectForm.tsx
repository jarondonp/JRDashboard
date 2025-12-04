import { useState, useEffect, type FormEvent } from 'react'
import { ModalFooter } from '../Modal'
import { SmartSelect } from '../SmartSelect'
import type { Project, ProjectInput } from '../../services/projectsApi'
import { useAreas } from '../../hooks/useAreas'
import { useGlobalModal } from '../../context/GlobalModalContext'

interface ProjectFormProps {
    initialData?: Project | null
    onSubmit: (data: ProjectInput) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    submitText?: string
}

export const createEmptyProjectInput = (): ProjectInput => ({
    area_id: 'global', // Default to Global
    code: '',
    title: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: '',
})

export function ProjectForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    submitText
}: ProjectFormProps) {
    const { data: areas } = useAreas()
    const { openModal } = useGlobalModal()
    const [formData, setFormData] = useState<ProjectInput>(createEmptyProjectInput())
    const [codeMode, setCodeMode] = useState<'auto' | 'custom'>('auto')
    const isEditing = !!initialData

    useEffect(() => {
        if (initialData) {
            setFormData({
                area_id: initialData.area_id || 'global',
                code: initialData.code || '',
                title: initialData.title || '',
                description: initialData.description || '',
                status: initialData.status || 'active',
                start_date: initialData.start_date || '',
                end_date: initialData.end_date || '',
            })
            setCodeMode('custom')
        } else {
            setFormData(createEmptyProjectInput())
            setCodeMode('auto')
        }
    }, [initialData])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        const cleanData: ProjectInput = {
            ...formData,
            area_id: (formData.area_id === 'global' || !formData.area_id) ? null : formData.area_id,
            code: codeMode === 'auto' && !isEditing ? undefined : formData.code,
            description: formData.description || null,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
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
            <div>
                <SmartSelect
                    label="Área"
                    value={formData.area_id || ''}
                    onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                    options={[
                        { value: 'global', label: 'Global / Transversal' },
                        ...(areas?.map(a => ({ value: a.id, label: a.name })) || [])
                    ]}
                    onCreate={handleCreateArea}
                    createLabel="Crear nueva Área"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código del Proyecto
                </label>

                {!isEditing && (
                    <div className="flex gap-4 mb-2">
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-indigo-600"
                                name="codeMode"
                                value="auto"
                                checked={codeMode === 'auto'}
                                onChange={() => setCodeMode('auto')}
                            />
                            <span className="ml-2 text-sm text-gray-700">Auto (P000X)</span>
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="radio"
                                className="form-radio text-indigo-600"
                                name="codeMode"
                                value="custom"
                                checked={codeMode === 'custom'}
                                onChange={() => setCodeMode('custom')}
                            />
                            <span className="ml-2 text-sm text-gray-700">Personalizado</span>
                        </label>
                    </div>
                )}

                {codeMode === 'custom' && (
                    <div>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow uppercase"
                            value={formData.code || ''}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="Ej: AUTH-2025"
                            maxLength={10}
                        />
                        {isEditing && (
                            <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                                ⚠️ Cambiar el código actualizará la visualización en todas las metas, tareas y documentos asociados.
                            </p>
                        )}
                    </div>
                )}
                {codeMode === 'auto' && !isEditing && (
                    <p className="text-xs text-gray-500 italic">
                        El código se generará automáticamente al guardar (ej: P0001, P0002...)
                    </p>
                )}
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
                    placeholder="Ej: Lanzamiento de Producto"
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
                    placeholder="Describe el alcance del proyecto..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                </label>
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                    <option value="active">Activo</option>
                    <option value="paused">Pausado</option>
                    <option value="completed">Completado</option>
                    <option value="archived">Archivado</option>
                </select>
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
                        Fecha Fin
                    </label>
                    <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                        value={formData.end_date || ''}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
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
