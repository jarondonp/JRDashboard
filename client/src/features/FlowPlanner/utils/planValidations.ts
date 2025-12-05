/**
 * Validation utilities for planner operations
 */

import type { PlannerState } from '../types';

/**
 * Validates that a plan belongs to the current project
 * @returns true if valid, false if invalid
 */
export function validatePlanBelongsToProject(
    planProjectId: string,
    currentProjectId: string | undefined
): boolean {
    if (!currentProjectId) {
        // If no current project is set, allow loading
        return true;
    }

    if (planProjectId !== currentProjectId) {
        console.error('❌ Plan validation failed: Plan belongs to different project!', {
            planProjectId,
            currentProjectId
        });
        alert('⚠️ Este plan pertenece a otro proyecto y no puede ser cargado aquí.');
        return false;
    }

    return true;
}

/**
 * Preserves current project information when loading a plan
 * This prevents project data from being overwritten by old plan data
 */
export function preserveProjectInfo(
    planStateData: PlannerState,
    planName: string,
    currentProjectId: string | undefined,
    currentProjectTitle: string | undefined
): PlannerState {
    return {
        ...planStateData,
        name: planName,
        // CRITICAL: Use current project data, not plan's old project data
        project_id: currentProjectId || planStateData.project_id,
        project_title: currentProjectTitle || planStateData.project_title
    };
}
