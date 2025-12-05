/**
 * Custom hooks for planner plan operations
 */

import type { PlannerState, PlannerPhase } from '../types';
import { validatePlanBelongsToProject, preserveProjectInfo } from '../utils/planValidations';

/**
 * Load a plan from the backend and return its data
 */
export async function loadPlanData(planId: string): Promise<any | null> {
    try {
        const response = await fetch(`/api/planner/plans/${planId}`);
        if (!response.ok) {
            throw new Error('Failed to load plan');
        }
        return await response.json();
    } catch (err) {
        console.error('❌ Error loading plan:', err);
        return null;
    }
}

/**
 * Create a new plan in the backend
 */
export async function createPlanInBackend(
    projectId: string,
    name: string,
    description: string | undefined,
    phase: PlannerPhase,
    stateData: PlannerState
): Promise<string | null> {
    try {
        const response = await fetch('/api/planner/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_id: projectId,
                name,
                description,
                phase,
                stateData
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create plan');
        }

        const newPlan = await response.json();
        console.log('✅ Plan created:', newPlan.id);
        return newPlan.id;
    } catch (err) {
        console.error('❌ Error creating plan:', err);
        return null;
    }
}

/**
 * Update an existing plan in the backend
 */
export async function updatePlanInBackend(
    planId: string,
    phase: PlannerPhase,
    stateData: PlannerState
): Promise<boolean> {
    try {
        const response = await fetch(`/api/planner/plans/${planId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phase,
                stateData
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update plan');
        }

        console.log('✅ Plan updated:', planId, 'Phase:', phase);
        return true;
    } catch (err) {
        console.error('❌ Error updating plan:', err);
        return false;
    }
}

/**
 * Load and validate a plan, returning prepared state if valid
 */
export async function loadAndValidatePlan(
    planId: string,
    currentProjectId: string | undefined,
    currentProjectTitle: string | undefined
): Promise<{ state: PlannerState; phase: PlannerPhase } | null> {
    const plan = await loadPlanData(planId);

    if (!plan || !plan.state_data) {
        return null;
    }

    // Validate plan belongs to current project
    if (!validatePlanBelongsToProject(plan.project_id, currentProjectId)) {
        return null;
    }

    // Preserve current project info
    const validatedState = preserveProjectInfo(
        plan.state_data,
        plan.name,
        currentProjectId,
        currentProjectTitle
    );

    return {
        state: validatedState,
        phase: plan.state_data.current_phase || 'ingestion'
    };
}

/**
 * Check for task deltas (new tasks not in plan)
 */
export async function checkForTaskDeltas(planId: string): Promise<any[]> {
    try {
        const res = await fetch(`/api/planner/plans/${planId}/deltas`);
        if (res.ok) {
            return await res.json();
        }
        return [];
    } catch (err) {
        console.error('Error checking for deltas:', err);
        return [];
    }
}
