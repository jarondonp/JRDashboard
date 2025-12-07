import React, { useState, useEffect } from 'react';
import { PlannerTask, Baseline, ComparisonData } from '../../types';
import { GanttChart } from './Gantt/GanttChart';
import { GanttTask, BaselineTask } from './Gantt/types';
import { AIInsightsPanel } from './AIInsightsPanel';

interface BaselineComparisonProps {
    projectId: string;
    currentTasks?: PlannerTask[]; // Tasks from Planner State (Scenario/Draft)
}

// ... existing interfaces ...

export const BaselineComparison: React.FC<BaselineComparisonProps> = ({ projectId, currentTasks }) => {
    const [baselines, setBaselines] = useState<Baseline[]>([]);
    const [selectedBaselineId, setSelectedBaselineId] = useState<string | null>(null);
    // const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    // Instead of raw comparison data from API, we will build it locally to support scenarios.
    // We need fetched baseline tasks.
    const [fetchedBaselineTasks, setFetchedBaselineTasks] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    // Fetch Baselines on mount
    useEffect(() => {
        console.log('🔍 [BaselineComparison] Mount. ProjectId:', projectId);
        if (!projectId) return;

        const fetchBaselines = async () => {
            try {
                const url = `/api/planner/project-baselines/${projectId}`;
                console.log('🔍 [BaselineComparison] Fetching:', url);
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    console.log('✅ [BaselineComparison] Baselines fetched:', data.length);
                    // Sort descending by date
                    const sorted = data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    setBaselines(sorted);
                    if (sorted.length > 0) {
                        setSelectedBaselineId(sorted[0].id);
                    }
                } else {
                    console.error('❌ [BaselineComparison] Fetch failed:', res.status);
                }
            } catch (err) {
                console.error('Error fetching baselines', err);
            }
        };
        fetchBaselines();
    }, [projectId]);

    // Fetch Baseline Tasks when baseline selected
    useEffect(() => {
        if (!selectedBaselineId) return;

        const fetchBaselineTasks = async () => {
            setLoading(true);
            try {
                // We fetch the raw tasks of the baseline, not the comparison.
                // Or we fetch comparison but ignore the "current" part if props are present.
                // Let's use the comparison endpoint as it returns convenient format, 
                // but we will override the "current" values with our props.
                const res = await fetch(`/api/planner/baselines/${selectedBaselineId}/compare?projectId=${projectId}`);
                if (res.ok) {
                    const data = await res.json();
                    // setComparisonData(data); // We won't use this directly anymore

                    // Extract baseline info from the comparison response
                    // The endpoint returns combined data. We want the baseline side.
                    // Actually, getting raw baseline tasks might be cleaner, but let's stick to what we have.
                    setFetchedBaselineTasks(data.comparison.map((t: any) => ({
                        id: t.id,
                        baseline_start: t.baseline_start,
                        baseline_end: t.baseline_end,
                        title: t.title // Warning: This might be current title if matched by ID.
                    })));
                }
            } catch (err) {
                console.error('Error fetching comparison', err);
            } finally {
                setLoading(false);
            }
        };
        fetchBaselineTasks();
    }, [selectedBaselineId, projectId]);

    // Construct Comparison Data (Merge Local State vs Baseline)
    // If currentTasks (prop) is present, use it. Otherwise use fetched comparison (fallback).
    // For simplicity, let's assume if we are in Planner, we always have currentTasks.

    const computedComparison = React.useMemo(() => {
        if (!currentTasks || !fetchedBaselineTasks.length) return [];

        return currentTasks.map(task => {
            const baseline = fetchedBaselineTasks.find(b => b.id === task.id);

            const startDate = task.start_date || task.planner_meta?.start_date; // Fallback
            const dueDate = task.due_date || task.planner_meta?.due_date;

            let delayDays = 0;
            let status = 'ontrack';

            if (baseline && baseline.baseline_end && dueDate) {
                const currentEnd = new Date(dueDate).getTime();
                const baselineEnd = new Date(baseline.baseline_end).getTime();
                const diffTime = currentEnd - baselineEnd;
                delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (delayDays > 0) status = 'delayed';
                else if (delayDays < 0) status = 'ahead';
            }

            return {
                id: task.id,
                title: task.title,
                start_date: startDate,
                due_date: dueDate,
                baseline_start: baseline?.baseline_start,
                baseline_end: baseline?.baseline_end,
                delay_days: delayDays,
                status: status,
                progress_percentage: task.progress_percentage || 0,
                _status: 'active' // TODO: Detect deleted
            };
        });
    }, [currentTasks, fetchedBaselineTasks]);


    const handleAnalyze = async () => {
        setIsAnalysisOpen(true);
        // Always re-analyze for "What-If" scenarios as data changes often
        // if (analysisResult) return; 

        setAnalyzing(true);
        try {
            const payload = {
                projectTitle: "Análisis de Escenario (Simulación)",
                currentTasks: computedComparison.map(t => ({
                    id: t.id,
                    title: t.title,
                    start: t.start_date,
                    due: t.due_date,
                    delay: t.delay_days,
                    status: t.status
                })),
                baselineTasks: computedComparison.map(t => ({
                    id: t.id,
                    title: t.title,
                    start: t.baseline_start,
                    due: t.baseline_end
                }))
            };

            const res = await fetch('/api/planner/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setAnalysisResult(data);
            }
        } catch (err) {
            console.error('AI Analysis failed', err);
        } finally {
            setAnalyzing(false);
        }
    };

    // Transform data for Gantt
    const ganttTasks: GanttTask[] = computedComparison.map(t => ({
        id: t.id,
        title: t.title,
        start_date: t.start_date || t.baseline_start,
        due_date: t.due_date || t.baseline_end,
        critical: t.delay_days > 0,
        progress: t.progress_percentage
    }));

    const baselineTasks: BaselineTask[] = computedComparison.filter(t => t.baseline_start).map(t => ({
        id: `base-${t.id}`,
        task_id: t.id,
        start_date: t.baseline_start,
        due_date: t.baseline_end
    }));

    // Calculate KPIs
    const totalDelay = computedComparison.reduce((acc, t) => acc + (t.delay_days > 0 ? t.delay_days : 0), 0) || 0;
    const delayedTasksCount = computedComparison.filter(t => t.delay_days > 0).length || 0;

    return (
        <div className="flex flex-col gap-6 p-4">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Control & Análisis
                        <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Simulación en Vivo</span>
                    </h2>
                    {baselines.length > 0 ? (
                        <select
                            className="border rounded-md px-3 py-1.5 text-sm bg-gray-50 hover:bg-white transition-colors"
                            value={selectedBaselineId || ''}
                            onChange={(e) => setSelectedBaselineId(e.target.value)}
                        >
                            {baselines.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.version_name} ({new Date(b.created_at).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <span className="text-sm text-gray-500 italic">No hay planes base guardados.</span>
                    )}
                </div>

                {/* AI Button */}
                <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                    <span>✨</span> Analizar Escenario con IA
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-xs font-medium uppercase">Desviación Proyectada</div>
                    <div className={`text-2xl font-bold ${totalDelay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {totalDelay > 0 ? `+${totalDelay} días` : 'A tiempo'}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-xs font-medium uppercase">Tareas Retrasadas</div>
                    <div className="text-2xl font-bold text-gray-800">
                        {delayedTasksCount} <span className="text-sm font-normal text-gray-400">/ {computedComparison.length}</span>
                    </div>
                </div>
                {/* ... other KPIs ... */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="text-gray-500 text-xs font-medium uppercase">Salud del Escenario</div>
                    <div className="text-2xl font-bold text-indigo-600">
                        {Math.max(0, 100 - (totalDelay * 2))}%
                    </div>
                </div>
            </div>

            {/* Gantt View */}
            {loading ? (
                <div className="h-96 flex items-center justify-center text-gray-400">Cargando línea base...</div>
            ) : (
                <GanttChart
                    tasks={ganttTasks}
                    baselineTasks={baselineTasks}
                />
            )}
            {/* AI Panel */}
            <AIInsightsPanel
                isOpen={isAnalysisOpen}
                isLoading={analyzing}
                data={analysisResult}
                onClose={() => setIsAnalysisOpen(false)}
            />
        </div>
    );
};
