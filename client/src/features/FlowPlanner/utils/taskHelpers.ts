/**
 * Task management utilities
 */

import type { PlannerTask } from '../types';

/**
 * Import new tasks, adding them to existing tasks
 */
export function importTasksToState(
    existingTasks: PlannerTask[],
    newTasks: any[]
): PlannerTask[] {
    return [
        ...existingTasks,
        ...newTasks.map(t => ({
            ...t,
            dependencies: t.dependencies || [],
            position: { x: 0, y: 0 }
        }))
    ];
}

/**
 * Smart merge: Preserve existing task state when updating task list
 * This is used when modifying scope to keep priorities, positions, etc.
 */
export function mergeTasksWithPreservation(
    existingTasks: PlannerTask[],
    targetTasks: any[]
): PlannerTask[] {
    console.log('🔄 Smart merge started');
    console.log('  Existing tasks:', existingTasks.length);
    console.log('  Target tasks:', targetTasks.length);

    const currentTaskMap = new Map(existingTasks.map(t => [t.id, t]));

    let preservedCount = 0;
    const mergedTasks = targetTasks.map(t => {
        if (currentTaskMap.has(t.id)) {
            preservedCount++;
            const existing = currentTaskMap.get(t.id)!;
            return existing; // Keep existing state (position, impact, etc.)
        }
        console.log(`  New task found: ${t.id}`);
        return {
            ...t,
            dependencies: t.dependencies || [],
            position: { x: 0, y: 0 }
        };
    });

    console.log(`  Summary: Preserved ${preservedCount}, Total ${mergedTasks.length}`);

    return mergedTasks;
}

export function updateTaskInArray(
    tasks: PlannerTask[],
    taskId: string,
    updates: Partial<PlannerTask>
): PlannerTask[] {
    return tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
}

/**
 * Merge logic for "Update Real Status":
 * Overwrite scheduling fields from real tasks but preserve planner-specific meta (positions).
 */
export function updateTasksWithRealData(
    existingTasks: PlannerTask[],
    realTasks: any[]
): PlannerTask[] {
    console.log('🔄 Update Real Status merge started');
    const realTaskMap = new Map(realTasks.map(t => [t.id, t]));
    let updatedCount = 0;

    const merged = existingTasks.map(existing => {
        const real = realTaskMap.get(existing.id);
        if (real) {
            updatedCount++;
            return {
                ...existing,
                // Overwrite fields from real execution
                start_date: real.start_date,
                due_date: real.due_date,
                status: real.status,
                progress_percentage: real.progress_percentage,
                // Optional: priority could be overwritten too if desired
                calculated_priority: real.calculated_priority
            };
        }
        return existing;
    });

    console.log(`  Summary: Updated ${updatedCount} tasks with real data`);
    return merged;
}
