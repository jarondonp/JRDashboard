import { useState } from 'react';
import { usePlanner } from '../PlannerContext';
import { CanvasView } from './CanvasView';
import { SmartSuggestionsModal } from './SmartSuggestionsModal';
import { getGoalColor } from '../utils/goalColors';

export function DependencyBuilder() {
    const { state, updateTask } = usePlanner();
    const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [showSmartModal, setShowSmartModal] = useState(false);

    const handleAddDependency = (taskId: string, dependencyId: string) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newDependencies = [...(task.dependencies || []), dependencyId];
        updateTask(taskId, { dependencies: newDependencies });
    };

    const handleRemoveDependency = (taskId: string, dependencyId: string) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const newDependencies = task.dependencies.filter(d => d !== dependencyId);
        updateTask(taskId, { dependencies: newDependencies });
    };

    const availableDependencies = (taskId: string) => {
        return state.tasks.filter(t =>
            t.id !== taskId &&
            !state.tasks.find(task => task.id === taskId)?.dependencies?.includes(t.id)
        );
    };

    const handleApplySuggestion = (taskId: string, dependsOn: string) => {
        handleAddDependency(taskId, dependsOn);
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Header con toggle y botón Smart */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Definir Dependencias
                        </h2>
                        {state.project_title && (
                            <p className="text-sm text-gray-600 mt-1">
                                📋 Proyecto: <span className="font-medium text-gray-900">{state.project_title}</span>
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 items-center">
                        {/* Smart Suggestions Button */}
                        <button
                            onClick={() => setShowSmartModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md flex items-center gap-2"
                        >
                            <span className="text-lg">🧠</span>
                            Sugerencias Smart
                        </button>

                        {/* View mode toggle */}
                        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('canvas')}
                                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${viewMode === 'canvas'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                `}
                            >
                                🗺️ Canvas Visual
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`
                  px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${viewMode === 'list'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                `}
                            >
                                📋 Vista Lista
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content based on view mode */}
                {viewMode === 'canvas' ? (
                    <CanvasView />
                ) : (
                    <div className="grid grid-cols-2 gap-6">
                        {/* Lista de tareas */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Tareas</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {state.tasks.map(task => {
                                    const colors = getGoalColor(task.goal_id);
                                    return (
                                        <button
                                            key={task.id}
                                            onClick={() => setSelectedTask(task.id)}
                                            className={`
                        w-full text-left px-4 py-3 rounded-md border transition-colors
                        ${selectedTask === task.id
                                                    ? `border-indigo-500 ${colors.bg}`
                                                    : `border-gray-200 ${colors.bg} hover:border-gray-300`
                                                }
                      `}
                                        >
                                            {task.goal_title && (
                                                <div className={`text-[10px] font-semibold uppercase tracking-wider ${colors.text} mb-1`}>
                                                    🎯 {task.goal_title}
                                                </div>
                                            )}
                                            <div className="font-medium text-gray-900">{task.title}</div>
                                            {task.dependencies && task.dependencies.length > 0 && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Depende de {task.dependencies.length} tarea(s)
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Panel de dependencias */}
                        <div>
                            {selectedTask ? (
                                <>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                                        Dependencias de: {state.tasks.find(t => t.id === selectedTask)?.title}
                                    </h3>

                                    {/* Dependencias actuales */}
                                    <div className="mb-4">
                                        <label className="text-xs text-gray-600 mb-2 block">Actualmente depende de:</label>
                                        <div className="space-y-1">
                                            {state.tasks.find(t => t.id === selectedTask)?.dependencies?.map(depId => {
                                                const depTask = state.tasks.find(t => t.id === depId);
                                                if (!depTask) return null;
                                                const colors = getGoalColor(depTask.goal_id);
                                                return (
                                                    <div key={depId} className={`flex items-center justify-between px-3 py-2 ${colors.bg} border ${colors.border} rounded`}>
                                                        <div className="flex-1">
                                                            {depTask.goal_title && (
                                                                <div className={`text-[9px] font-semibold uppercase ${colors.text} mb-0.5`}>
                                                                    {depTask.goal_title}
                                                                </div>
                                                            )}
                                                            <span className="text-sm text-gray-900">{depTask.title}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveDependency(selectedTask, depId)}
                                                            className="text-red-600 hover:text-red-800 text-xs ml-2"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                            {(!state.tasks.find(t => t.id === selectedTask)?.dependencies?.length) && (
                                                <p className="text-sm text-gray-400 italic">Sin dependencias</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Agregar nueva dependencia */}
                                    <div>
                                        <label className="text-xs text-gray-600 mb-2 block">Agregar dependencia:</label>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleAddDependency(selectedTask, e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        >
                                            <option value="">Seleccionar tarea...</option>
                                            {availableDependencies(selectedTask).map(task => (
                                                <option key={task.id} value={task.id}>
                                                    {task.goal_title ? `[${task.goal_title}] ` : ''}{task.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                                        <p className="text-xs text-yellow-800">
                                            💡 Tip: Una tarea solo puede empezar cuando todas sus dependencias estén completadas
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-gray-400 py-12">
                                    Selecciona una tarea para gestionar sus dependencias
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Suggestions Modal */}
            {showSmartModal && (
                <SmartSuggestionsModal
                    onClose={() => setShowSmartModal(false)}
                    onApplySuggestion={handleApplySuggestion}
                />
            )}
        </div>
    );
}
