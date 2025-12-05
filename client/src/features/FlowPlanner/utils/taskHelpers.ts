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

/**
 * Update a specific task in the tasks array
 */
export function updateTaskInArray(
    tasks: PlannerTask[],
    taskId: string,
    updates: Partial<PlannerTask>
): PlannerTask[] {
    return tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
}
