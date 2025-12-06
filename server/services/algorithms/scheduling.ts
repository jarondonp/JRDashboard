import { PlannerTask } from '../PlanningEngine';
import { topologicalSort } from './topologicalSort';

export interface ScheduledTask extends PlannerTask {
    start_date: string;
    due_date: string;
}

export interface ScheduleResult {
    tasks: ScheduledTask[];
    logs: string[];
}

/**
 * Helper: Parse YYYY-MM-DD string to UTC timestamp (midnight UTC)
 */
function parseUTCDate(dateStr: string): number {
    const [year, month, day] = dateStr.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
}

/**
 * Helper: Format Date to YYYY-MM-DD using UTC
 */
function formatUTCDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Helper: Add days to a UTC date
 */
function addDaysUTC(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

/**
 * Asigna fechas de inicio y fin a las tareas basándose en:
 * - Fecha de inicio del proyecto
 * - Dependencias entre tareas
 * - Duración estimada de cada tarea
 * - Fechas manuales de override (respetadas si son posteriores)
 */
export function scheduleTasks(
    tasks: PlannerTask[],
    projectStartDate: Date
): ScheduleResult {
    const logs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        logs.push(msg);
    };

    // Ordenar tareas topológicamente
    const { sorted, hasCycle } = topologicalSort(tasks);

    if (hasCycle) {
        throw new Error('Cannot schedule tasks with circular dependencies');
    }

    const scheduledTasks: ScheduledTask[] = [];
    const taskDates = new Map<string, { startMs: number; endMs: number }>();

    // Normalizar fecha de inicio del proyecto a UTC midnight
    const projectStartMs = Date.UTC(
        projectStartDate.getUTCFullYear(),
        projectStartDate.getUTCMonth(),
        projectStartDate.getUTCDate()
    );

    // Calcular fechas para cada tarea
    for (const task of sorted) {
        let taskStartMs = projectStartMs;

        // Si tiene dependencias, empezar después de que terminen
        if (task.dependencies && task.dependencies.length > 0) {
            let maxDependencyEndMs = projectStartMs;

            for (const depId of task.dependencies) {
                const depDates = taskDates.get(depId);
                if (depDates && depDates.endMs > maxDependencyEndMs) {
                    maxDependencyEndMs = depDates.endMs;
                }
            }

            // Agregar 1 día de buffer entre tareas dependientes
            taskStartMs = maxDependencyEndMs + (24 * 60 * 60 * 1000); // +1 day in ms
        }

        // Respetar fecha manual si existe y es posterior a la calculada (Slack/Lag)
        if (task.start_date) {
            const manualStartMs = parseUTCDate(task.start_date);
            const calculatedDateStr = formatUTCDate(new Date(taskStartMs));

            log(`[Schedule] Task "${task.title}": Manual=${task.start_date} vs Calculated=${calculatedDateStr}`);

            if (!isNaN(manualStartMs)) {
                if (manualStartMs >= taskStartMs) {
                    log(`[Schedule] ✅ Using manual start for "${task.title}"`);
                    taskStartMs = manualStartMs;
                } else {
                    log(`[Schedule] ⚠️ Ignoring manual start (too early) for "${task.title}"`);
                }
            }
        }

        // Calcular fecha de fin basada en duración estimada
        const duration = task.estimated_duration || 60; // Default: 1 hora
        const durationInDays = Math.ceil(duration / (8 * 60)); // Convertir minutos a días laborales

        const taskEndMs = taskStartMs + (durationInDays * 24 * 60 * 60 * 1000);

        taskDates.set(task.id, { startMs: taskStartMs, endMs: taskEndMs });

        const startDateStr = formatUTCDate(new Date(taskStartMs));
        const endDateStr = formatUTCDate(new Date(taskEndMs));

        scheduledTasks.push({
            ...task,
            start_date: startDateStr,
            due_date: endDateStr
        });

        log(`[Schedule] Final: "${task.title}" -> ${startDateStr} to ${endDateStr}`);
    }

    return { tasks: scheduledTasks, logs };
}
