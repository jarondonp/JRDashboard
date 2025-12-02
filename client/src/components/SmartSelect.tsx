import React from 'react'

interface Option {
    value: string
    label: string
}

interface SmartSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string
    options: Option[]
    onCreate: () => void
    createLabel: string
    error?: string
}

export function SmartSelect({
    label,
    options,
    onCreate,
    createLabel,
    error,
    value,
    onChange,
    ...props
}: SmartSelectProps) {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = e.target.value
        if (selectedValue === '__create_new__') {
            onCreate()
        } else {
            onChange?.(e)
        }
    }

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={value}
                onChange={handleChange}
                {...props}
            >
                <option value="">Seleccionar...</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
                <option disabled>──────────</option>
                <option value="__create_new__" className="font-semibold text-indigo-600">
                    + {createLabel}
                </option>
            </select>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    )
}
