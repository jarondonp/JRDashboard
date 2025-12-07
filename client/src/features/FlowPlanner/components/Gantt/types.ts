
export interface GanttTask {
    id: string;
    title: string;
    start_date: string;
    due_date: string;
    progress?: number;
    dependencies?: string[];
    critical?: boolean;
}

export type ViewMode = 'Day' | 'Week' | 'Month';

export interface BaselineTask {
    id: string;         // baseline_task_id
    task_id: string;    // Links to GanttTask.id
    start_date: string;
    due_date: string;
}
