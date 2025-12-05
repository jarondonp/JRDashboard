import React from 'react';
import { usePlanner } from '../PlannerContext';
import { getGoalColor } from '../utils/goalColors';

const QUICK_DURATIONS = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hora', value: 60 },
    { label: '2 horas', value: 120 },
    { label: '4 horas', value: 240 },
    { label: '1 día', value: 480 },
    { label: '2 días', value: 960 },
    { label: '1 semana', value: 2400 },
];

export function TimeEstimator() {
    const { state, updateTask } = usePlanner();

    const handleDurationChange = (taskId: string, duration: number) => {
        updateTask(taskId, { estimated_duration: duration });
    };

    const tasksWithoutEstimate = state.tasks.filter(t => !t.estimated_duration);
    const totalEstimatedTime = state.tasks.reduce((sum, t) => sum + (t.estimated_duration || 0), 0);
    const totalDays = Math.ceil(totalEstimatedTime / (8 * 60));

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Estimación de Tiempos
                        </h2>
                        {state.project_title && (
                            <p className="text-sm text-gray-600 mt-1">
                                📋 Proyecto: <span className="font-medium text-gray-900">{state.project_title}</span>
                            </p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Duración total estimada</p>
                        <p className="text-2xl font-bold text-indigo-600">
                            {totalDays} días laborales
                        </p>
                        <p className="text-xs text-gray-500">
                            ({Math.floor(totalEstimatedTime / 60)}h {totalEstimatedTime % 60}min)
                        </p>
                    </div>
                </div>

                {tasksWithoutEstimate.length > 0 && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                            ⚠️ {tasksWithoutEstimate.length} tareas sin estimación de tiempo
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {state.tasks.map(task => {
                        const colors = getGoalColor(task.goal_id);
                        return (
                            <div
                                key={task.id}
                                className={`border ${colors.border} ${colors.bg} rounded-lg p-4 hover:shadow-md transition-all`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        {task.goal_title && (
                                            <div className={`text-[10px] font-semibold uppercase tracking-wider ${colors.text} mb-1`}>
                                                🎯 {task.goal_title}
                                            </div>
                                        )}
                                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                                        {task.calculated_priority && (
                                            <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold rounded bg-white text-gray-700 border border-gray-300">
                                                {task.calculated_priority}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Botones rápidos */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {QUICK_DURATIONS.map(({ label, value }) => (
                                        <button
                                            key={value}
                                            onClick={() => handleDurationChange(task.id, value)}
                                            className={`
                      px-3 py-1 text-xs rounded-full transition-colors
                      ${task.estimated_duration === value
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                                                }
                    `}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Input personalizado */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Personalizado:</label>
                                    <input
                                        type="number"
                                        value={task.estimated_duration || ''}
                                        onChange={(e) => handleDurationChange(task.id, parseInt(e.target.value) || 0)}
                                        placeholder="Minutos"
                                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                                    />
                                    <span className="text-sm text-gray-500">minutos</span>
                                    {task.estimated_duration && (
                                        <span className="text-sm text-gray-400">
                                            ≈ {Math.round(task.estimated_duration / 60 * 10) / 10} horas
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
