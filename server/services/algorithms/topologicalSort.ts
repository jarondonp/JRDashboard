import { PlannerTask } from '../PlanningEngine';

export interface TopologicalSortResult {
    sorted: PlannerTask[];
    hasCycle: boolean;
    cycle?: string[];
}

/**
 * Ordena las tareas topológicamente basándose en sus dependencias
 * Usa DFS (Depth-First Search) con detección de ciclos
 */
export function topologicalSort(tasks: PlannerTask[]): TopologicalSortResult {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const sorted: PlannerTask[] = [];
    let hasCycle = false;
    let cycle: string[] = [];

    function dfs(taskId: string, path: string[] = []): boolean {
        if (recursionStack.has(taskId)) {
            // Ciclo detectado
            const cycleStartIndex = path.indexOf(taskId);
            cycle = path.slice(cycleStartIndex).concat(taskId);
            return true;
        }

        if (visited.has(taskId)) {
            return false;
        }

        const task = taskMap.get(taskId);
        if (!task) return false;

        visited.add(taskId);
        recursionStack.add(taskId);
        const newPath = [...path, taskId];

        // Visitar dependencias primero
        for (const depId of task.dependencies || []) {
            if (dfs(depId, newPath)) {
                return true; // Propagar detección de ciclo
            }
        }

        recursionStack.delete(taskId);
        sorted.unshift(task); // Agregar al inicio para orden correcto
        return false;
    }

    // Procesar todas las tareas
    for (const task of tasks) {
        if (!visited.has(task.id)) {
            if (dfs(task.id)) {
                hasCycle = true;
                break;
            }
        }
    }

    return {
        sorted: hasCycle ? tasks : sorted,
        hasCycle,
        cycle: hasCycle ? cycle : undefined
    };
}
