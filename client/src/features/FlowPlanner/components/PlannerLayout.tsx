import React, { useState, useEffect } from 'react';
import { usePlanner } from '../PlannerContext';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { TaskIngestion } from './TaskIngestion';
import { EisenhowerMatrix } from './EisenhowerMatrix';
import { DependencyBuilder } from './DependencyBuilder';
import { TimeEstimator } from './TimeEstimator';
import { SyncModal } from './SyncModal';
import { ActivePlanModal } from './ActivePlanModal';
import { PlannerPhase } from '../types';
import { PlanPreview } from './PlanPreview';
import { BaselineComparison } from './BaselineComparison';

const STEPS = [
    { id: 'ingestion', label: 'Cargar Tareas', icon: '📥' },
    { id: 'prioritization', label: 'Priorizar', icon: '🎯' },
    { id: 'dependencies', label: 'Dependencias', icon: '🔗' },
    { id: 'estimation', label: 'Estimación', icon: '⏱️' },
    { id: 'preview', label: 'Revisión', icon: '👁️' },
    { id: 'analysis', label: 'Control', icon: '📊' }
];

export function PlannerLayout() {
    const {
        state,
        previousPhase,
        nextPhase,
        saveProgress,
        currentPlanId,
        lastSavedPhase,
        checkForUpdates,
        setPhase,
        resetPlanner,
        loadPlanAtSavedPhase,
        syncProjectData,
        setProjectId
    } = usePlanner();

    const { projectId: urlProjectId } = useParams();
    const navigate = useNavigate();
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [isActivePlanModalOpen, setIsActivePlanModalOpen] = useState(false);
    const [loadedPlanInfo, setLoadedPlanInfo] = useState<any>(null);
    const [syncData, setSyncData] = useState<{ newTasks: any[], existingTasksUpdates: any[] } | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [hasCheckedActivePlan, setHasCheckedActivePlan] = useState(false);

    // Detect active plan on mount
    useEffect(() => {
        const checkForActivePlan = async () => {
            if (!hasCheckedActivePlan && currentPlanId && !urlProjectId) {
                try {
                    // Load plan info to show in modal
                    const res = await fetch(`/api/planner/plans/${currentPlanId}`);
                    if (res.ok) {
                        const plan = await res.json();
                        setLoadedPlanInfo(plan);
                        setIsActivePlanModalOpen(true);
                    }
                } catch (err) {
                    console.error('Error loading plan info:', err);
                }
                setHasCheckedActivePlan(true);
            }
        };

        checkForActivePlan();
    }, [currentPlanId, urlProjectId, hasCheckedActivePlan]);

    // Ensure state.project_id is set if URL has it
    useEffect(() => {
        if (urlProjectId && !state.project_id) {
            console.log('🔄 [PlannerLayout] Setting project ID from URL:', urlProjectId);
            setProjectId(urlProjectId);
        }
    }, [urlProjectId, state.project_id, setProjectId]);



    // Reset planner if URL is empty and user explicitly changed plans
    useEffect(() => {
        if (!urlProjectId && currentPlanId && !isActivePlanModalOpen) {
            // Only reset if modal is not showing (user didn't choose to continue)
            // This will be handled by the modal's "Change Plan" button
        }
    }, [urlProjectId, currentPlanId, isActivePlanModalOpen]);

    // Handle explicit reset request via URL (e.g. from Sidebar)
    const [searchParams, setSearchParams] = useSearchParams();
    const resetProcessed = React.useRef(false);

    useEffect(() => {
        const shouldReset = searchParams.get('reset') === 'true';

        if (shouldReset && !resetProcessed.current) {
            console.log('🔄 Resetting planner via URL param (One-time)');
            resetProcessed.current = true;

            // Execute reset
            resetPlanner();

            // Clear param immediately without full reload if possible, or navigate
            // Using setSearchParams to remove the param keeps us on the same route but updates URL
            setSearchParams({}, { replace: true });
        } else if (!shouldReset) {
            // Reset the ref if we are not in reset mode anymore
            resetProcessed.current = false;
        }
    }, [searchParams, resetPlanner, setSearchParams]);

    const currentStepIndex = STEPS.findIndex(s => s.id === state.current_phase);

    const renderPhase = () => {
        switch (state.current_phase) {
            case 'ingestion': return <TaskIngestion />;
            case 'prioritization': return <EisenhowerMatrix />;
            case 'dependencies': return <DependencyBuilder />;
            case 'estimation': return <TimeEstimator />;
            case 'preview': return <PlanPreview />;
            case 'analysis': return <BaselineComparison projectId={state.project_id || ''} currentTasks={state.tasks} />;
            default: return null;
        }
    };

    const handleSave = async () => {
        const success = await saveProgress();
        if (success) {
            alert('Progreso guardado correctamente.');
        } else {
            alert('⚠️ No se pudo guardar el progreso.\n\nDebes crear un PLAN primero para poder guardar.\nVe a la pantalla inicial y haz clic en "+ Nuevo Plan" o configura el plan actual.');
        }
    };


    const handleSync = async () => {
        setIsChecking(true);
        const data = await checkForUpdates();
        setIsChecking(false);

        const hasNew = data.newTasks.length > 0;
        const hasUpdates = data.existingTasksUpdates.length > 0; // In reality this is always true if plan has tasks, better if we checked diff.
        // For now, we always show modal if there is ANY task in the project, to allow "Reset to Real" even if no obvious diff?
        // Or strictly if new tasks.
        // Let's show if either hasNew OR (hasUpdates and we want to allow reset).
        // Let's just show it.

        if (hasNew || hasUpdates) {
            setSyncData(data);
            setIsSyncModalOpen(true);
        } else {
            alert('No se encontraron datos para sincronizar.');
        }
    };


    const handleStepClick = async (stepId: string) => {
        // Always allow navigation if a plan is loaded
        if (!currentPlanId) {
            return;
        }

        // Save progress before switching
        await saveProgress();
        setPhase(stepId as PlannerPhase);
    };

    const handleContinuePlan = async () => {
        if (loadedPlanInfo) {
            setIsActivePlanModalOpen(false);
            // Restore plan at saved phase
            await loadPlanAtSavedPhase(loadedPlanInfo.id);
            // Navigate to the project URL
            if (loadedPlanInfo.project_id) {
                navigate(`/planner/${loadedPlanInfo.project_id}`);
            }
        }
    };

    const handleChangePlan = () => {
        setIsActivePlanModalOpen(false);
        resetPlanner();
        navigate('/planner');
    };

    return (
        <div className="planner-layout min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Flow Project Planner</h1>
                            {state.name && <span className="text-sm text-gray-500 font-medium">Escenario: {state.name}</span>}
                        </div>
                        <div className="flex gap-3">
                            {currentPlanId && (
                                <button
                                    onClick={handleSync}
                                    disabled={isChecking}
                                    className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                >
                                    {isChecking ? 'Buscando...' : '🔄 Sincronizar'}
                                </button>
                            )}
                            {state.project_id && (
                                <button
                                    onClick={handleSave}
                                    className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-2"
                                >
                                    💾 Guardar Progreso
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <button
                                key={step.id}
                                onClick={() => handleStepClick(step.id)}
                                className={`flex items-center group ${!currentPlanId ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                disabled={!currentPlanId}
                            >
                                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full transition-colors
                  ${index <= currentStepIndex ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}
                `}>
                                    <span className="text-lg">{step.icon}</span>
                                </div>
                                <span className={`ml-2 text-sm font-medium ${index <= currentStepIndex ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {step.label}
                                </span>
                                {index < STEPS.length - 1 && (
                                    <div className={`w-16 h-1 mx-4 ${index < currentStepIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Contenido de la fase */}
            <div className={`max-w-7xl mx-auto px-6 ${state.current_phase === 'prioritization' ? 'py-2' : 'py-8'}`}>
                {renderPhase()}
            </div>

            {/* Navegación */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between">
                    <button
                        onClick={previousPhase}
                        disabled={currentStepIndex === 0}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ← Anterior
                    </button>
                    <button
                        onClick={nextPhase}
                        disabled={currentStepIndex === STEPS.length - 1}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Siguiente →
                    </button>
                </div>
            </div>

            <SyncModal
                isOpen={isSyncModalOpen}
                onClose={() => setIsSyncModalOpen(false)}
                syncData={syncData}
                onConfirmSync={(options, selectedTasks) => {
                    if (syncData) {
                        syncProjectData(options, syncData, selectedTasks);
                    }
                }}
            />

            <ActivePlanModal
                isOpen={isActivePlanModalOpen}
                planName={loadedPlanInfo?.name || 'Plan sin nombre'}
                planDescription={loadedPlanInfo?.description}
                lastPhase={lastSavedPhase || state.current_phase}
                projectTitle={state.project_title}
                onContinue={handleContinuePlan}
                onChangePlan={handleChangePlan}
            />

        </div>
    );
}
