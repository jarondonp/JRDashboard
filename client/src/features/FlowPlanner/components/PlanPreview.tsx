
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

        // Calculate new estimated duration based on dates
        const startDate = new Date(newStart);
        const endDate = new Date(newEnd);
        // Add 1 day to include the end date day itself if needed, but Gantt logic usually treats end as inclusive/exclusive depending on implementation.
        // In GanttChart.tsx: totalDays calculation uses difference.
        // Let's stick to simple diff + 1?
        // scheduling.ts: taskEndMs = taskStartMs + (durationInDays * 24h)
        // So diff in days = (end - start) / 24h.

        const diffTime = endDate.getTime() - startDate.getTime();
        // If end date is same as start date, diff is 0, but duration is 1 day.
        // If end date is start + 1 day, diff is 1 day.
        // Our Gantt logic (dragState) adds deltaDays.
        // If start=0, end=0 (1 day task).
        // Let's assume inclusive end date for visual bars usually implies the day IS covered.
        // If scheduling.ts says: start + duration = end. 
        // Example: Start Mon, Duration 1 day -> End Mon? Or End Tue?
        // scheduling.ts: const taskEndMs = taskStartMs + (durationInDays * 24 * 60 * 60 * 1000);
        // If durationInDays is 1, End is Start + 24h.
        // So if Start is 2025-01-01, End is 2025-01-02.
        // If my Gantt view shows 2025-01-01 to 2025-01-01 for 1 day task, then "end" string is same.
        // If the GanttChart treats end as inclusive visual, let's check GanttChart.tsx again.

        // GanttChart.tsx:
        // duration = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        // If start = end, duration = 0 -> (duration || 1) -> 1 column. 
        // So visually start=end is 1 day.

        // So:
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        // If diffDays is 0 (start=end), it's 1 day work. 
        // If diffDays is 1 (start=Mon, end=Tue), it's 2 days work (Mon and Tue)? Or just 1 day span?
        // scheduling.ts adds days. 
        // If duration 1 day (8 hours) -> Add 1 day ms.
        // 2025-01-01 + 1 day = 2025-01-02.
        // So backend expects End Date to be Start + Duration.
        // If dragging moves end date to 2025-01-06 (from 2025-01-01), diff is 5 days.
        // Duration should be 5 days.

        const durationInDays = Math.max(1, diffDays);
        const newEstimatedDuration = durationInDays * 8 * 60; // Minutes (8h days)

        console.log(`⏱️ [Frontend] Calculated new duration: ${durationInDays} days (${newEstimatedDuration} mins)`);

        // Update local state immediately (visual feedback)
        setScheduledTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, start_date: newStart, due_date: newEnd } : t
        ));

        // Update global context
        updateTask(taskId, {
            start_date: newStart,
            due_date: newEnd,
            estimated_duration: newEstimatedDuration
        });

        console.log('✅ [Frontend] Task updated successfully with new duration');
    };

    // Date adjustment state
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [tempStartDate, setTempStartDate] = useState('');
    const { setProjectStartDate } = usePlanner();

    const openDateModal = () => {
        setTempStartDate(state.project_start_date || new Date().toISOString().split('T')[0]);
        setIsDateModalOpen(true);
    };

    const handleDateSubmit = () => {
        if (tempStartDate) {
            console.log('📅 [PlanPreview] Updating project start date to:', tempStartDate);
            setProjectStartDate(tempStartDate);
            setIsDateModalOpen(false);
            // Recalculation will trigger automatically via useEffect
        }
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

    // Navigation for redirect
    // We need to import useNavigate but it's not imported. 
    // Wait, PlanPreview is used inside PlannerLayout, does it have access to router?
    // Let's check if we can import useNavigate from react-router-dom.
    // Assuming standard React Router implementation.
    // Need to add import at top first, but I'll add the hook usage here and assume import is added or available.
    // Actually, I should check imports. PlanPreview imports React, etc. 
    // I I will assume useNavigate is available or I will add it in a separate edit if typically needed.
    // For now, let's just use window.location.href or try to import it if I can see imports.
    // I see file content, no react-router-dom import. I should add it.

    // ... logic ... but I can't add import at top with this tool easily in one go if it's far.
    // I'll assume I can add it or I'll just use window.location for now to be safe, or I'll do a multi-replace.

    // Let's use window.location.href = '/dashboard' for simplicity as verification step, 
    // OR try to inject the import. The file is small enough (300 lines).

    const handleConfirmPlan = async () => {
        if (!confirm('¿Estás seguro de confirmar este plan? Esto actualizará las fechas de todas las tareas en el sistema.')) {
            return;
        }

        try {
            setLoading(true);
            console.log('🏁 [Frontend] Confirming plan...');

            // Prepare payload
            // implementation_plan says: { project_id, tasks, create_baseline: true }
            // state.tasks has the current planned data (updated via updateTask context)
            // But wait, scheduledTasks (local state) has the Gantt data. 
            // state.tasks in context is updated on "handleTaskUpdate". 
            // Let's trust state.tasks as the source of truth since handleTaskUpdate updates it.

            // MERGE: We must send the *scheduled* dates (what user sees), not the original state.tasks
            // scheduledTasks contains the calculated/optimized dates.
            // Map state.tasks (full data) but overwrite start/end/duration from scheduledTasks

            const plannedTasksPayload = state.tasks.map(t => {
                const scheduled = scheduledTasks.find(s => s.id === t.id);
                if (scheduled) {
                    return {
                        ...t,
                        start_date: scheduled.start_date,
                        due_date: scheduled.due_date,
                        // We might want to persist critical path or other calculated fields if DB supports it, 
                        // but mainly dates are critical here.
                    };
                }
                return t;
            });

            console.log('📦 [Frontend] Payload preview (first 3):', plannedTasksPayload.slice(0, 3).map(t => ({ id: t.title, start: t.start_date, end: t.due_date })));

            const payload = {
                project_id: state.project_id,
                tasks: plannedTasksPayload, // Use the merged tasks with calculated dates!
                create_baseline: true,
                baseline_name: `Plan Confirmado - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`
            };

            const response = await fetch('/api/planner/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Error al confirmar el plan');

            const result = await response.json();
            console.log('✅ [Frontend] Plan confirmed!', result);

            // Show success (simple alert for now or existing toast if available)
            alert(' Plan aplicado correctamente. Redirigiendo al Dashboard...');

            // Redirect
            window.location.href = `/projects/${state.project_id}`; // Fixed: Removed /dashboard suffix which caused 404/blank page

        } catch (err) {
            console.error(err);
            alert('Error al aplicar el plan. Revisa la consola.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Date Adjustment Modal */}
            {isDateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ajustar Fecha de Inicio</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Selecciona la nueva fecha de inicio para el proyecto based on which all tasks will be rescheduled.
                        </p>
                        <input
                            type="date"
                            value={tempStartDate}
                            onChange={(e) => setTempStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 mb-6"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsDateModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDateSubmit}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Aplicar Cambio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Revisión del Plan</h2>
                        <div className="text-sm text-gray-500 mt-1 flex gap-4">
                            <span>📊 {state.tasks.length} tareas</span>
                            <span>🔗 {state.tasks.reduce((acc, t) => acc + (t.dependencies?.length || 0), 0)} dependencias</span>
                            <span>📅 Inicio: {state.project_start_date}</span>
                        </div>
                        {state.tasks.reduce((acc, t) => acc + (t.dependencies?.length || 0), 0) === 0 && (
                            <p className="text-amber-600 text-xs mt-1 font-medium">
                                ⚠️ No hay dependencias. Todas las tareas iniciarán juntas. Ve a "Dependencias" para conectarlas.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={openDateModal}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Ajustar Fechas
                        </button>
                        <button
                            onClick={handleConfirmPlan}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-colors flex items-center gap-2"
                        >
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

                <GanttChart tasks={scheduledTasks} startDate={state.project_start_date ? new Date(state.project_start_date) : undefined} onTaskUpdate={handleTaskUpdate} />

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
