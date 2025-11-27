import type { Task } from '../../services/tasksApi';
import type { ProgressLog } from '../../services/progressApi';
import type { Document } from '../../services/documentsApi';
import {
  type TaskDashboardFilterKey,
  type ProgressDashboardFilterKey,
  type DocumentDashboardFilterKey,
} from './navigation';

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const isSameDay = (value?: string | null, reference?: Date) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const compare = reference ? new Date(reference) : startOfToday();
  date.setHours(0, 0, 0, 0);
  compare.setHours(0, 0, 0, 0);
  return date.getTime() === compare.getTime();
};

const isInCurrentMonth = (value?: string | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
};

const isWithinCurrentWeek = (value?: string | null) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = startOfToday();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as first day of week
  const start = new Date(today);
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  return date >= start && date < end;
};

const daysUntil = (value?: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return Number.POSITIVE_INFINITY;
  const today = startOfToday();
  const diff = target.getTime() - today.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export function filterTasksForDashboard(
  tasks: Task[],
  filter: TaskDashboardFilterKey | null,
): Task[] {
  if (!filter) return tasks;

  switch (filter) {
    case 'tasks-open-month':
      return tasks.filter((task) => task.status !== 'completada' && isInCurrentMonth(task.due_date));
    case 'tasks-pending':
      return tasks.filter((task) => task.status !== 'completada');
    case 'tasks-today':
      return tasks.filter((task) => isSameDay(task.due_date));
    default:
      return tasks;
  }
}

export function filterProgressForDashboard(
  logs: ProgressLog[],
  filter: ProgressDashboardFilterKey | null,
): ProgressLog[] {
  if (!filter) return logs;

  switch (filter) {
    case 'progress-this-week':
      return logs.filter((log) => isWithinCurrentWeek(log.date || log.created_at));
    case 'progress-today':
      return logs.filter((log) => isSameDay(log.date || log.created_at));
    default:
      return logs;
  }
}

export function filterDocumentsForDashboard(
  documents: Document[],
  filter: DocumentDashboardFilterKey | null,
): Document[] {
  if (!filter) return documents;

  if (filter === 'documents-critical') {
    return documents.filter((doc) => {
      const days = daysUntil(doc.review_date);
      return Number.isFinite(days) && days >= 0 && days <= 7;
    });
  }

  return documents;
}


