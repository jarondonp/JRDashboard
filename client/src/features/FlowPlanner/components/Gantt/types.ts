
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
