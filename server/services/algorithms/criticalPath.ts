import { PlannerTask } from '../PlanningEngine';

export interface CriticalPathResult {
    criticalPath: string[];
    taskTimes: Map<string, {
        earliestStart: number;
        earliestFinish: number;
        latestStart: number;
        latestFinish: number;
        slack: number;
    }>;
    totalDuration: number;
}

/**
 * Calcula el camino crítico usando el algoritmo CPM
 */
export function calculateCriticalPath(tasks: PlannerTask[]): CriticalPathResult {
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    const taskTimes = new Map<string, any>();

    // Inicializar tiempos
    for (const task of tasks) {
        taskTimes.set(task.id, {
            earliestStart: 0,
            earliestFinish: 0,
            latestStart: Infinity,
            latestFinish: Infinity,
            slack: 0
        });
    }

    // Forward pass: calcular earliest start/finish
    function forwardPass(taskId: string, visited = new Set<string>()): number {
        if (visited.has(taskId)) return taskTimes.get(taskId).earliestFinish;
        visited.add(taskId);

        const task = taskMap.get(taskId);
        if (!task) return 0;

        const duration = task.estimated_duration || 0;
        const times = taskTimes.get(taskId);

        // Earliest start es el máximo de los earliest finish de las dependencias
        let maxDependencyFinish = 0;
        for (const depId of task.dependencies || []) {
            const depFinish = forwardPass(depId, visited);
            maxDependencyFinish = Math.max(maxDependencyFinish, depFinish);
        }

        times.earliestStart = maxDependencyFinish;
        times.earliestFinish = maxDependencyFinish + duration;

        return times.earliestFinish;
    }

    // Ejecutar forward pass para todas las tareas
    let projectDuration = 0;
    for (const task of tasks) {
        const finish = forwardPass(task.id);
        projectDuration = Math.max(projectDuration, finish);
    }

    // Backward pass: calcular latest start/finish
    function backwardPass(taskId: string, projectEnd: number, visited = new Set<string>()) {
        if (visited.has(taskId)) return;
        visited.add(taskId);

        const task = taskMap.get(taskId);
        if (!task) return;

        const times = taskTimes.get(taskId);
        const duration = task.estimated_duration || 0;

        // Encontrar tareas que dependen de esta
        const dependentTasks = tasks.filter(t =>
            t.dependencies && t.dependencies.includes(taskId)
        );

        if (dependentTasks.length === 0) {
            // Tarea final
            times.latestFinish = projectEnd;
        } else {
            // Latest finish es el mínimo de los latest start de tareas dependientes
            let minDependentStart = Infinity;
            for (const depTask of dependentTasks) {
                backwardPass(depTask.id, projectEnd, visited);
                const depTimes = taskTimes.get(depTask.id);
                minDependentStart = Math.min(minDependentStart, depTimes.latestStart);
            }
            times.latestFinish = minDependentStart;
        }

        times.latestStart = times.latestFinish - duration;
        times.slack = times.latestStart - times.earliestStart;
    }

    for (const task of tasks) {
        backwardPass(task.id, projectDuration);
    }

    // Identificar camino crítico (tareas con slack = 0)
    const criticalPath = tasks
        .filter(task => {
            const times = taskTimes.get(task.id);
            return times && times.slack === 0;
        })
        .map(task => task.id);

    return {
        criticalPath,
        taskTimes,
        totalDuration: projectDuration
    };
}
