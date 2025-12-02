import { useState, useEffect, type FormEvent } from 'react'
import { ModalFooter } from '../Modal'
import type { Area, AreaInput } from '../../services/areasApi'

interface AreaFormProps {
    initialData?: Area | null
    onSubmit: (data: AreaInput) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    submitText?: string
}

export const createEmptyAreaInput = (): AreaInput => ({
    name: '',
    type: 'Personal',
    color: '#3498db',
    description: '',
    icon: '',
})

export function AreaForm({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
    submitText
}: AreaFormProps) {
    const [formData, setFormData] = useState<AreaInput>(createEmptyAreaInput())

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                type: initialData.type,
                color: initialData.color,
                description: initialData.description || '',
                icon: initialData.icon || ''
            })
        } else {
            setFormData(createEmptyAreaInput())
        }
    }, [initialData])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    return (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo *
                    </label>
                    <select
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
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
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            required
                            className="h-10 w-14 p-1 border border-gray-300 rounded-lg cursor-pointer"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        />
                        <span className="text-sm text-gray-500">{formData.color}</span>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                </label>
                <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe brevemente el propósito de esta área..."
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icono (opcional)
                </label>
                <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Ej: 🎯, 💼, 📚"
                />
                <p className="mt-1 text-xs text-gray-500">
                    Usa un emoji para identificar visualmente esta área.
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
