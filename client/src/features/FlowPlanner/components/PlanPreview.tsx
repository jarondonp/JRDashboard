
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePlanner } from '../PlannerContext';
import { GanttChart } from './Gantt/GanttChart';
import { GanttTask } from './Gantt/types';

export const PlanPreview: React.FC = () => {
    const { state, updateTask } = usePlanner();
    const [scheduledTasks, setScheduledTasks] = useState<GanttTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [criticalPath, setCriticalPath] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    // Flag to skip recalculation after manual drag
    const skipNextRecalculation = useRef(false);
    // Track manual overrides
    const manualOverrides = useRef<Map<string, { start_date: string; due_date: string }>>(new Map());

    const calculateSchedule = useCallback(async () => {
        try {
            setLoading(true);
            const startDate = state.project_start_date
                ? new Date(state.project_start_date).toISOString()
                : new Date().toISOString();

            // Detailed log of what we received from context
            console.group('📊 [PlanPreview] calculateSchedule starting');
            console.log(`Total tasks: ${state.tasks.length}`);
            const tasksWithDates = state.tasks.filter(t => t.start_date);
            console.log(`Tasks with manual dates: ${tasksWithDates.length}`);
            tasksWithDates.forEach(t => {
                console.log(`   📅 ${t.title?.substring(0, 30)}: ${t.start_date}`);
            });
            console.groupEnd();

            // Log what we're sending
            const tasksWithManualDates = state.tasks.filter(t => t.start_date);
            console.log(`🚀 [Frontend] Calculating schedule with ${state.tasks.length} tasks (${tasksWithManualDates.length} with manual dates)`);

            const response = await fetch('/api/planner/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tasks: state.tasks,
                    project_start_date: startDate
                })
            });

            if (!response.ok) throw new Error('Failed to calculate schedule');

            const result = await response.json();

            // Log backend debug info
            if (result.debug_logs && result.debug_logs.length > 0) {
                console.group('🔧 [Backend] Schedule Calculation Logs');
                result.debug_logs.forEach((log: string) => console.log(log));
                console.groupEnd();
            }

            // Map result to GanttTask, applying manual overrides
            const mappedTasks: GanttTask[] = result.tasks.map((t: any) => {
                // Check if there's a manual override for this task
                const override = manualOverrides.current.get(t.id);
                if (override) {
                    console.log(`📌 [Frontend] Applying manual override for "${t.title}": ${override.start_date}`);
                    return {
                        id: t.id,
                        title: t.title,
                        start_date: override.start_date,
                        due_date: override.due_date,
                        dependencies: t.dependencies,
                        critical: result.critical_path.includes(t.id)
                    };
                }

                return {
                    id: t.id,
                    title: t.title,
                    start_date: t.start_date,
                    due_date: t.due_date,
                    dependencies: t.dependencies,
                    critical: result.critical_path.includes(t.id)
                };
            });

            setScheduledTasks(mappedTasks);
            setCriticalPath(result.critical_path);
            setSuggestions(result.suggestions);
        } catch (err) {
            console.error(err);
            setError('Error al calcular el cronograma. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [state.tasks, state.project_start_date]);

    useEffect(() => {
        // Skip if flagged (after manual drag)
        if (skipNextRecalculation.current) {
            console.log('⏭️ [Frontend] Skipping recalculation (manual update in progress)');
            skipNextRecalculation.current = false;
            return;
        }

        if (state.tasks.length > 0) {
            calculateSchedule();
        }
    }, [state.tasks, calculateSchedule]);

    const handleTaskUpdate = (taskId: string, newStart: string, newEnd: string) => {
        console.log('🖱️ [Frontend] handleTaskUpdate called:', taskId, newStart, '->', newEnd);

        // Store manual override
        manualOverrides.current.set(taskId, { start_date: newStart, due_date: newEnd });

        // Set flag to skip next recalculation
        skipNextRecalculation.current = true;

        // Update local state immediately (visual feedback)
        setScheduledTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, start_date: newStart, due_date: newEnd } : t
        ));

        // Update global context (will trigger useEffect, but we'll skip it)
        updateTask(taskId, { start_date: newStart, due_date: newEnd });

        console.log('✅ [Frontend] Task updated successfully, bar should stay in place');
    };

    if (loading && scheduledTasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p>Calculando fechas óptimas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-red-500 mb-4">⚠️ {error}</div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Revisión del Plan</h2>
                        <div className="text-sm text-gray-500 mt-1 flex gap-4">
                            <span>📊 {state.tasks.length} tareas</span>
                            <span>🔗 {state.tasks.reduce((acc, t) => acc + (t.dependencies?.length || 0), 0)} dependencias</span>
                        </div>
                        {state.tasks.reduce((acc, t) => acc + (t.dependencies?.length || 0), 0) === 0 && (
                            <p className="text-amber-600 text-xs mt-1 font-medium">
                                ⚠️ No hay dependencias. Todas las tareas iniciarán juntas. Ve a "Dependencias" para conectarlas.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            Ajustar Fechas
                        </button>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-colors flex items-center gap-2">
                            <span>✅</span> Confirmar Plan
                        </button>
                    </div>
                </div>

                {suggestions.length > 0 && (
                    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Sugerencias de Optimización</h4>
                        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                            {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                )}

                <GanttChart tasks={scheduledTasks} onTaskUpdate={handleTaskUpdate} />

                <div className="mt-6 flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                        <span>Tarea Normal</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span>Ruta Crítica (No retrasar)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
