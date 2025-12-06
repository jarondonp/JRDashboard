import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PlannerTask, PlannerPhase, PlannerState } from './types';
import {
    loadAndValidatePlan,
    createPlanInBackend,
    updatePlanInBackend,
    checkForTaskDeltas
} from './hooks/planOperations';
import {
    importTasksToState,
    mergeTasksWithPreservation,
    updateTaskInArray
} from './utils/taskHelpers';

interface PlannerContextValue {
    state: PlannerState;
    setProjectId: (id: string) => void;
    setProjectTitle: (title: string) => void;
    setProjectStartDate: (date: string) => void;
    loadTasks: (tasks: PlannerTask[]) => void;
    updateTask: (taskId: string, updates: Partial<PlannerTask>) => void;
    setPhase: (phase: PlannerPhase) => void;
    nextPhase: () => void;
    previousPhase: () => void;
    saveProgress: () => Promise<boolean>;
    loadPlan: (planId: string) => Promise<boolean>;
    loadPlanAtSavedPhase: (planId: string) => Promise<boolean>;
    createPlan: (name: string, description?: string) => Promise<string | null>;
    currentPlanId: string | null;
    lastSavedPhase: PlannerPhase | null;
    checkForUpdates: () => Promise<any[]>;
    importTasks: (tasks: any[]) => void;
    mergeTasks: (tasks: any[]) => void;
    resetPlanner: () => void;
}

const PlannerContext = createContext<PlannerContextValue | undefined>(undefined);

const PHASE_ORDER: PlannerPhase[] = ['ingestion', 'prioritization', 'dependencies', 'estimation', 'preview'];

export function PlannerProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<PlannerState>({
        project_id: '',
        project_title: '',
        project_start_date: new Date().toISOString().split('T')[0],
        tasks: [],
        current_phase: 'ingestion'
    });

    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
    const [lastSavedPhase, setLastSavedPhase] = useState<PlannerPhase | null>(null);

    // ============ BASIC SETTERS ============

    const setProjectId = (id: string) => setState(prev => ({ ...prev, project_id: id }));
    const setProjectTitle = (title: string) => setState(prev => ({ ...prev, project_title: title }));
    const setProjectStartDate = (date: string) => setState(prev => ({ ...prev, project_start_date: date }));
    const loadTasks = (tasks: PlannerTask[]) => setState(prev => ({ ...prev, tasks }));
    const setPhase = (phase: PlannerPhase) => setState(prev => ({ ...prev, current_phase: phase }));

    // ============ TASK OPERATIONS ============

    const updateTask = (taskId: string, updates: Partial<PlannerTask>) => {
        console.log('📝 [PlannerContext] updateTask called:', taskId, updates);
        setState(prev => {
            const newTasks = updateTaskInArray(prev.tasks, taskId, updates);
            const updatedTask = newTasks.find(t => t.id === taskId);
            console.log('📝 [PlannerContext] Updated task now has:', {
                id: updatedTask?.id,
                title: updatedTask?.title?.substring(0, 30),
                start_date: updatedTask?.start_date,
                due_date: updatedTask?.due_date
            });
            return { ...prev, tasks: newTasks };
        });
    };

    const importTasks = (newTasks: any[]) => {
        setState(prev => ({
            ...prev,
            tasks: importTasksToState(prev.tasks, newTasks)
        }));
    };

    const mergeTasks = (targetTasks: any[]) => {
        setState(prev => ({
            ...prev,
            tasks: mergeTasksWithPreservation(prev.tasks, targetTasks)
        }));
    };

    // ============ PHASE NAVIGATION ============

    const nextPhase = () => {
        const currentIndex = PHASE_ORDER.indexOf(state.current_phase);
        if (currentIndex < PHASE_ORDER.length - 1) {
            const nextPhase = PHASE_ORDER[currentIndex + 1];
            setPhase(nextPhase);
            // Auto-save on phase change
            setTimeout(() => saveProgress(), 0);
        }
    };

    const previousPhase = () => {
        const currentIndex = PHASE_ORDER.indexOf(state.current_phase);
        if (currentIndex > 0) {
            setPhase(PHASE_ORDER[currentIndex - 1]);
        }
    };

    // ============ PLAN CRUD OPERATIONS ============

    const createPlan = async (name: string, description?: string): Promise<string | null> => {
        if (!state.project_id) {
            console.error('❌ Cannot create plan: No project ID set');
            return null;
        }

        const planId = await createPlanInBackend(
            state.project_id,
            name,
            description,
            state.current_phase,
            state
        );

        if (planId) {
            setCurrentPlanId(planId);
        }

        return planId;
    };

    const saveProgress = async (): Promise<boolean> => {
        if (!currentPlanId) {
            console.warn('⚠️ Cannot save progress: No plan ID set');
            return false;
        }

        // Log what we're saving
        const tasksWithDates = state.tasks.filter(t => t.start_date);
        console.log(`💾 [PlannerContext] Saving progress. ${tasksWithDates.length} tasks have manual dates.`);
        tasksWithDates.forEach(t => {
            console.log(`   - ${t.title?.substring(0, 30)}: ${t.start_date} to ${t.due_date}`);
        });

        const success = await updatePlanInBackend(currentPlanId, state.current_phase, state);

        if (success) {
            setLastSavedPhase(state.current_phase);
            return true;
        }
        return false;
    };

    const loadPlan = async (planId: string): Promise<boolean> => {
        const result = await loadAndValidatePlan(
            planId,
            state.project_id,
            state.project_title
        );

        if (!result) {
            return false;
        }

        console.log('📥 Plan loaded successfully:', planId);
        setState(result.state);
        setCurrentPlanId(planId);
        setLastSavedPhase(result.phase);
        return true;
    };

    const loadPlanAtSavedPhase = async (planId: string): Promise<boolean> => {
        const result = await loadAndValidatePlan(
            planId,
            state.project_id,
            state.project_title
        );

        if (!result) {
            return false;
        }

        console.log('📥 Plan loaded at saved phase:', result.phase);
        setState({ ...result.state, current_phase: result.phase });
        setCurrentPlanId(planId);
        setLastSavedPhase(result.phase);
        return true;
    };

    const checkForUpdates = async (): Promise<any[]> => {
        if (!currentPlanId) {
            return [];
        }
        return await checkForTaskDeltas(currentPlanId);
    };

    // ============ RESET ============

    const resetPlanner = () => {
        setLastSavedPhase(null);
        setState({
            project_id: '',
            project_title: '',
            project_start_date: new Date().toISOString().split('T')[0],
            tasks: [],
            current_phase: 'ingestion'
        });
        setCurrentPlanId(null);
    };

    // ============ CONTEXT PROVIDER ============

    return (
        <PlannerContext.Provider value={{
            state,
            setProjectId,
            setProjectTitle,
            setProjectStartDate,
            loadTasks,
            updateTask,
            setPhase,
            nextPhase,
            previousPhase,
            saveProgress,
            loadPlan,
            loadPlanAtSavedPhase,
            createPlan,
            currentPlanId,
            lastSavedPhase,
            checkForUpdates,
            importTasks,
            mergeTasks,
            resetPlanner
        }}>
            {children}
        </PlannerContext.Provider>
    );
}

export function usePlanner() {
    const context = useContext(PlannerContext);
    if (!context) {
        throw new Error('usePlanner must be used within PlannerProvider');
    }
    return context;
}
