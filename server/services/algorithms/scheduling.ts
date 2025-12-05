import { PlannerTask } from '../PlanningEngine';
import { topologicalSort } from './topologicalSort';

export interface ScheduledTask extends PlannerTask {
    start_date: string;
    due_date: string;
}

/**
 * Asigna fechas de inicio y fin a las tareas basándose en:
 * - Fecha de inicio del proyecto
 * - Dependencias entre tareas
 * - Duración estimada de cada tarea
 */
export function scheduleTasks(
    tasks: PlannerTask[],
    projectStartDate: Date
): ScheduledTask[] {
    // Ordenar tareas topológicamente
    const { sorted, hasCycle } = topologicalSort(tasks);

    if (hasCycle) {
        throw new Error('Cannot schedule tasks with circular dependencies');
    }

    const taskMap = new Map(sorted.map(t => [t.id, t]));
    const scheduledTasks: ScheduledTask[] = [];
    const taskDates = new Map<string, { start: Date; end: Date }>();

    // Calcular fechas para cada tarea
    for (const task of sorted) {
        let taskStart = new Date(projectStartDate);

        // Si tiene dependencias, empezar después de que terminen
        if (task.dependencies && task.dependencies.length > 0) {
            let maxDependencyEnd = new Date(projectStartDate);

            for (const depId of task.dependencies) {
                const depDates = taskDates.get(depId);
                if (depDates && depDates.end > maxDependencyEnd) {
                    maxDependencyEnd = depDates.end;
                }
            }

            // Agregar 1 día de buffer entre tareas dependientes
            taskStart = new Date(maxDependencyEnd);
            taskStart.setDate(taskStart.getDate() + 1);
        }

        // Calcular fecha de fin basada en duración estimada
        const duration = task.estimated_duration || 60; // Default: 1 hora
        const durationInDays = Math.ceil(duration / (8 * 60)); // Convertir minutos a días laborales

        const taskEnd = new Date(taskStart);
        taskEnd.setDate(taskEnd.getDate() + durationInDays);

        taskDates.set(task.id, { start: taskStart, end: taskEnd });

        scheduledTasks.push({
            ...task,
            start_date: taskStart.toISOString().split('T')[0],
            due_date: taskEnd.toISOString().split('T')[0]
        });
    }

    return scheduledTasks;
}
