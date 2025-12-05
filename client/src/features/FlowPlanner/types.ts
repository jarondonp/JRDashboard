export type PlannerPhase = 'ingestion' | 'prioritization' | 'dependencies' | 'estimation' | 'preview';

export interface PlannerTask {
    id: string;
    title: string;
    description?: string;
    impact?: number;
    effort?: number;
    calculated_priority?: 'P1' | 'P2' | 'P3' | 'P4';
    estimated_duration?: number;
    dependencies: string[];
    start_date?: string;
    due_date?: string;
    position?: { x: number; y: number }; // Para Eisenhower matrix
    goal_title?: string;
    goal_id?: string;
}

export interface ScheduleResult {
    tasks: PlannerTask[];
    critical_path: string[];
    warnings: string[];
    suggestions: string[];
}

export interface PlannerState {
    project_id: string;
    project_title: string;
    project_start_date: string;
    tasks: PlannerTask[];
    current_phase: PlannerPhase;
    generated_schedule?: ScheduleResult;
    name?: string;
}
