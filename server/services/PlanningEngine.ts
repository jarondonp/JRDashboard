import { randomUUID } from 'crypto';
import { topologicalSort } from './algorithms/topologicalSort';
import { calculateCriticalPath as calculateCPM } from './algorithms/criticalPath';
import { scheduleTasks } from './algorithms/scheduling';

export interface PlannerTask {
    id: string;
    title: string;
    impact?: number;
    effort?: number;
    calculated_priority?: 'P1' | 'P2' | 'P3' | 'P4';
    estimated_duration?: number; // minutos
    dependencies: string[];
    start_date?: string;
    due_date?: string;
}

export interface ScheduleResult {
    tasks: PlannerTask[];
    critical_path: string[];
    warnings: string[];
    suggestions: string[];
    debug_logs?: string[];
}

export class PlanningEngine {
    // ... (detectCycles, topologicalSort, calculateCriticalPath remain unchanged)

    /**
     * Detectar ciclos en dependencias
     */
    static detectCycles(tasks: PlannerTask[]): { has_cycle: boolean; cycle?: string[] } {
        const { hasCycle, cycle } = topologicalSort(tasks);
        return { has_cycle: hasCycle, cycle };
    }

    /**
     * Ordenamiento topológico
     */
    static topologicalSort(tasks: PlannerTask[]): PlannerTask[] {
        const { sorted, hasCycle } = topologicalSort(tasks);
        if (hasCycle) {
            throw new Error('Cannot sort tasks with circular dependencies');
        }
        return sorted;
    }

    /**
     * Critical Path Method
     */
    static calculateCriticalPath(tasks: PlannerTask[]): string[] {
        const { criticalPath } = calculateCPM(tasks);
        return criticalPath;
    }

    /**
     * Generar schedule completo
     */
    static calculateSchedule(
        tasks: PlannerTask[],
        projectStartDate: Date
    ): ScheduleResult {
        const warnings: string[] = [];
        const suggestions: string[] = [];
        let debugLogs: string[] = [];

        // Detectar ciclos
        const { has_cycle, cycle } = this.detectCycles(tasks);
        if (has_cycle) {
            warnings.push(`Dependencia circular detectada: ${cycle?.join(' → ')}`);
            return { tasks, critical_path: [], warnings, suggestions };
        }

        // Verificar que todas las tareas tengan duración estimada
        const missingDuration = tasks.filter(t => !t.estimated_duration);
        if (missingDuration.length > 0) {
            warnings.push(`${missingDuration.length} tareas sin duración estimada (se usará 1 hora por defecto)`);
        }

        // Programar tareas
        let scheduledTasks;
        try {
            const result = scheduleTasks(tasks, projectStartDate);
            scheduledTasks = result.tasks;
            debugLogs = result.logs;
        } catch (error: any) {
            return { tasks, critical_path: [], warnings: [error.message], suggestions };
        }

        // Calcular camino crítico
        const critical_path = this.calculateCriticalPath(tasks);

        // Generar sugerencias
        if (critical_path.length > 0) {
            suggestions.push(`El camino crítico incluye ${critical_path.length} tareas. Enfócate en estas para acortar el proyecto.`);
        }

        const { totalDuration } = calculateCPM(tasks);
        const durationInDays = Math.ceil(totalDuration / (8 * 60));
        suggestions.push(`Duración total estimada del proyecto: ${durationInDays} días laborales`);

        return {
            tasks: scheduledTasks,
            critical_path,
            warnings,
            suggestions,
            debug_logs: debugLogs
        };
    }
}
