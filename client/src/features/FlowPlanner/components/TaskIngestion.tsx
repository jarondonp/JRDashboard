import React, { useState, useEffect } from 'react';
import { usePlanner } from '../PlannerContext';
import { useParams, useNavigate } from 'react-router-dom';
import { GoalSelector } from './GoalSelector';
import { getGoalColor, generateTaskId } from '../utils/goalColors';

type IngestionView = 'project_select' | 'plan_list' | 'plan_config' | 'task_review';

export function TaskIngestion() {
    const {
        state,
        setProjectId,
        setProjectTitle,
        setProjectStartDate,
        currentPlanId,
        nextPhase,
        mergeTasks,
        createPlan,
        loadPlan,
        resetPlanner
    } = usePlanner();

    const { projectId: urlProjectId } = useParams();
    const navigate = useNavigate();

    const [projects, setProjects] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState(urlProjectId || state.project_id || '');
    const [startDate, setStartDate] = useState(state.project_start_date);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<IngestionView>('project_select');
    const [showGoalSelector, setShowGoalSelector] = useState(false);

    // Local state for new plan form
    const [newPlanName, setNewPlanName] = useState('');
    const [newPlanDesc, setNewPlanDesc] = useState('');

    // UI Feedback state
    const [availableTaskCount, setAvailableTaskCount] = useState(0);

    // Load available projects on mount
    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(data => setProjects(data))
            .catch(err => console.error('Error loading projects:', err));
    }, []);

    // Handle URL changes and active plan detection
    useEffect(() => {
        console.log('🔄 URL changed. urlProjectId:', urlProjectId, '| selectedProject:', selectedProject, '| currentPlanId:', currentPlanId, '| tasks:', state.tasks.length);

        if (!urlProjectId) {
            // No project in URL
            if (currentPlanId && state.tasks.length > 0) {
                // But we have an active plan -> show task review
                console.log('  → No URL but active plan exists, showing task_review');
                setView('task_review');
            } else {
                // No plan active -> show project select
                console.log('  → No URL project, showing project_select');
                setView('project_select');
                setSelectedProject('');
            }
        } else if (urlProjectId !== selectedProject) {
            // CRITICAL FIX: New project detected -> Reset planner first to clear old state
            console.log('  → 🔄 Different project detected! Resetting planner state...');
            console.log('     Old project:', selectedProject);
            console.log('     New project:', urlProjectId);

            resetPlanner(); // Clear tasks and state from previous project
            setAvailableTaskCount(0); // Reset UI feedback count

            setSelectedProject(urlProjectId);
            loadProjectAndPlans(urlProjectId);
        } else if (currentPlanId && state.tasks.length > 0) {
            // Same project and we have tasks -> show task review
            console.log('  → URL project same, active plan exists, showing task_review');
            setView('task_review');
        } else {
            console.log('  → URL project same as selected, no action needed');
        }
    }, [urlProjectId, currentPlanId, state.tasks.length]);

    const loadProjectAndPlans = async (projectId: string) => {
        console.log('📦 loadProjectAndPlans called for:', projectId);
        setLoading(true);
        try {
            // Load project details
            const projectRes = await fetch(`/api/projects/${projectId}`);
            if (projectRes.ok) {
                const project = await projectRes.json();
                console.log('  ✅ Project loaded:', project.title);
                setProjectTitle(project.title || '');
                setProjectId(projectId);
            } else {
                console.error('  ❌ Failed to load project');
            }

            // Load available tasks count for UI feedback (to reassure user)
            fetch(`/api/planner/projects/${projectId}/tasks`)
                .then(res => res.ok ? res.json() : [])
                .then(tasks => {
                    if (Array.isArray(tasks)) {
                        console.log('  🔢 Available tasks in DB:', tasks.length);
                        setAvailableTaskCount(tasks.length);
                    }
                })
                .catch(err => console.error('Error loading task count:', err));

            // Load plans for this project
            const plansRes = await fetch(`/api/planner/projects/${projectId}/plans`);
            if (plansRes.ok) {
                const projectPlans = await plansRes.json();
                console.log('  ✅ Plans loaded:', projectPlans.length, 'plans');
                setPlans(projectPlans);

                // Decide view based on plan existence
                if (projectPlans.length > 0) {
                    console.log('  → Setting view to: plan_list');
                    setView('plan_list');
                } else {
                    console.log('  → Setting view to: task_review (no plans exist)');
                    setView('task_review');
                }
            } else {
                console.error('  ❌ Failed to load plans');
            }
        } catch (err) {
            console.error('❌ Error loading project/plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectSelect = async (projectId: string) => {
        console.log('🔍 handleProjectSelect called with:', projectId);
        if (!projectId) return;
        console.log('📍 Navigating to:', `/planner/${projectId}`);
        navigate(`/planner/${projectId}`);
    };

    const handleSelectPlan = async (planId: string) => {
        const success = await loadPlan(planId);
        if (success) {
            setView('task_review');
        }
    };

    const handleCreateNewPlan = () => {
        setNewPlanName('');
        setNewPlanDesc('');
        setView('plan_config');
    };

    const handleSavePlanConfig = async () => {
        if (!selectedProject) return;
        if (!newPlanName) {
            alert('Por favor ingresa un nombre para el plan');
            return;
        }

        setLoading(true);
        try {
            const planId = await createPlan(newPlanName, newPlanDesc);
            if (planId) {
                setView('task_review');
            }
        } catch (err) {
            console.error('Error creating plan:', err);
            alert('Error al crear el plan');
        } finally {
            setLoading(false);
        }
    };

    const handleGoalsSelected = async (goalIds: string[]) => {
        if (!selectedProject) return;

        setLoading(true);
        try {
            // Fetch all tasks for the project
            const res = await fetch(`/api/planner/projects/${selectedProject}/tasks`);
            if (!res.ok) throw new Error('Failed to load tasks');
            const allTasks = await res.json();

            // Filter tasks based on selected goals
            const filteredTasks = allTasks.filter((t: any) => {
                if (t.goal_id) {
                    return goalIds.includes(t.goal_id);
                } else {
                    return goalIds.includes('NO_GOAL');
                }
            });

            setProjectStartDate(startDate);

            // Use mergeTasks to preserve existing task state (Smart Merge)
            mergeTasks(filteredTasks.map((t: any) => ({
                ...t,
                dependencies: t.dependencies || [],
                position: { x: 0, y: 0 }
            })));

            setView('task_review');
            setShowGoalSelector(false);
        } catch (error) {
            console.error('Error loading tasks:', error);
            alert('Error al cargar las tareas. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    // ============ RENDER VIEWS ============

    if (view === 'project_select') {
        return (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Seleccionar Proyecto</h2>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Proyecto</label>
                    <select
                        value={selectedProject}
                        onChange={(e) => handleProjectSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Seleccionar...</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    }

    if (view === 'plan_list') {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <button
                            onClick={() => navigate('/planner')}
                            className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1"
                        >
                            ← Cambiar Proyecto
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900">Planes del Proyecto</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Gestiona diferentes escenarios para {state.project_title}
                        </p>
                    </div>
                    <button
                        onClick={handleCreateNewPlan}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        + Nuevo Plan
                    </button>
                </div>

                <div className="grid gap-4">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => handleSelectPlan(plan.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                                    {plan.description && (
                                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span>Fase: {plan.phase || 'ingestion'}</span>
                                        <span>{new Date(plan.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (view === 'plan_config') {
        return (
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuración del Plan</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Plan *
                        </label>
                        <input
                            type="text"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            placeholder="Ej: Escenario base, Plan optimista, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                        <p className="text-xs text-gray-500 mt-1">Este nombre te ayudará a identificar este escenario</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción (Opcional)
                        </label>
                        <textarea
                            value={newPlanDesc}
                            onChange={(e) => setNewPlanDesc(e.target.value)}
                            placeholder="Describe este escenario de planificación..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha de Inicio del Proyecto
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <button
                        onClick={handleSavePlanConfig}
                        disabled={loading || !newPlanName}
                        className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? 'Creando...' : 'Comenzar Planificación →'}
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'task_review') {
        if (showGoalSelector) {
            const currentGoalIds = Array.from(
                new Set(
                    state.tasks
                        .map(t => t.goal_id || 'NO_GOAL')
                        .filter(Boolean)
                )
            );

            return (
                <GoalSelector
                    projectId={selectedProject}
                    initialSelectedGoals={currentGoalIds}
                    onGoalsSelected={handleGoalsSelected}
                    onCancel={() => setShowGoalSelector(false)}
                />
            );
        }

        return (
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Revisar Tareas del Plan</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {state.tasks.length} tareas cargadas
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {!currentPlanId && (
                            <button
                                onClick={handleCreateNewPlan}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                                💾 Crear Plan
                            </button>
                        )}
                        <button
                            onClick={() => setShowGoalSelector(true)}
                            className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
                        >
                            ⚙️ Modificar Alcance
                        </button>
                        {currentPlanId && (
                            <button
                                onClick={() => setView('plan_list')}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                ← Cambiar de Plan
                            </button>
                        )}
                    </div>
                </div>

                {state.tasks.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-200">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Comenzar Planificación</h3>
                            <p className="text-gray-600 mb-6">
                                {availableTaskCount > 0 ? (
                                    <>
                                        Este proyecto tiene <strong>{availableTaskCount} tareas</strong> registradas en la base de datos.
                                        <br />
                                        Para comenzar a planificar, selecciona qué metas quieres incluir en este plan.
                                    </>
                                ) : (
                                    "No hay tareas cargadas en este plan. Selecciona metas para comenzar."
                                )}
                            </p>
                            <button
                                onClick={() => setShowGoalSelector(true)}
                                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Seleccionar Metas y Cargar Tareas
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {(() => {
                            const uniqueGoalIds = Array.from(new Set(state.tasks.map(t => t.goal_id || 'NO_GOAL')));

                            return state.tasks.map((task, idx) => {
                                const colors = getGoalColor(task.goal_id);
                                const taskId = generateTaskId(state.project_title, task.goal_id, idx, uniqueGoalIds);

                                return (
                                    <div
                                        key={task.id}
                                        className={`${colors.bg} border ${colors.border} rounded-lg p-4 transition-all ${colors.bgHover}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <span className={`inline-block px-2.5 py-1 ${colors.text} bg-white border ${colors.border} rounded text-xs font-mono font-bold`}>
                                                    {taskId}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text} px-2 py-0.5 rounded-full bg-white border ${colors.border}`}>
                                                        {task.goal_title || 'Sin meta'}
                                                    </span>
                                                    {task.goal_id && (
                                                        <span className={`text-xs ${colors.text} opacity-60 font-mono`}>
                                                            #{task.goal_id.substring(0, 8)}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="font-medium text-gray-900 leading-snug">
                                                    {task.title}
                                                </p>

                                                {task.description && (
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                    {(task as any).status && (
                                                        <span className="flex items-center gap-1">
                                                            📋 {(task as any).status}
                                                        </span>
                                                    )}
                                                    {(task as any).due_date && (
                                                        <span className="flex items-center gap-1">
                                                            📅 {new Date((task as any).due_date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            });
                        })()}

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={() => nextPhase()}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
                            >
                                Continuar a Priorización →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
