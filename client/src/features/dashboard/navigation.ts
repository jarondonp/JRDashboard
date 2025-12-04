import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export type DashboardFilterKey =
  | 'goals-overview'
  | 'goals-in-progress'
  | 'goals-active'
  | 'goals-month-current'
  | 'goals-month-due'
  | 'goals-month-completed'
  | 'goals-month-early'
  | 'goals-month-pending'
  | 'goals-month-recovered'
  | 'tasks-open-month'
  | 'tasks-pending'
  | 'tasks-today'
  | 'progress-this-week'
  | 'progress-today'
  | 'documents-critical';

export type GoalDashboardFilterKey =
  | 'goals-overview'
  | 'goals-in-progress'
  | 'goals-active'
  | 'goals-month-current'
  | 'goals-month-due'
  | 'goals-month-completed'
  | 'goals-month-early'
  | 'goals-month-pending'
  | 'goals-month-recovered';

export type TaskDashboardFilterKey = 'tasks-open-month' | 'tasks-pending' | 'tasks-today';

export type ProgressDashboardFilterKey = 'progress-this-week' | 'progress-today';

export type DocumentDashboardFilterKey = 'documents-critical';

type FilterRoute = {
  path: string;
  search: string;
};

const createSearch = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

const FILTER_ROUTES: Record<DashboardFilterKey, FilterRoute> = {
  'goals-overview': { path: '/goals', search: createSearch({ dashboardFilter: 'goals-overview' }) },
  'goals-in-progress': {
    path: '/goals',
    search: createSearch({ dashboardFilter: 'goals-in-progress' }),
  },
  'goals-active': {
    path: '/goals',
    search: createSearch({ dashboardFilter: 'goals-active' }),
  },
  'goals-month-current': {
    path: '/goals',
    search: createSearch({ dashboardFilter: 'goals-month-current' }),
  },
  'goals-month-due': {
    path: '/goals',
    search: createSearch({ dashboardFilter: 'goals-month-due' }),
  },
  'goals-month-completed': {
    path: '/goals',
    search: createSearch({ dashboardFilter: 'goals-month-completed' }),
  },
  'goals-month-early': {
    path: '/goals',
    search: createSearch({ dashboardFilter: 'goals-month-early' }),
  },
  'goals-month-pending': {
    path: '/goals',
    search: createSearch({ dashboardFilter: 'goals-month-pending' }),
  },
  'goals-month-recovered': {
    path: '/goals',
    search: createSearch({ dashboardFilter: 'goals-month-recovered' }),
  },
  'tasks-open-month': {
    path: '/tasks',
    search: createSearch({ dashboardFilter: 'tasks-open-month' }),
  },
  'tasks-pending': {
    path: '/tasks',
    search: createSearch({ dashboardFilter: 'tasks-pending' }),
  },
  'tasks-today': {
    path: '/tasks',
    search: createSearch({ dashboardFilter: 'tasks-today' }),
  },
  'progress-this-week': {
    path: '/progress',
    search: createSearch({ dashboardFilter: 'progress-this-week' }),
  },
  'progress-today': {
    path: '/progress',
    search: createSearch({ dashboardFilter: 'progress-today' }),
  },
  'documents-critical': {
    path: '/documents/review',
    search: createSearch({ dashboardFilter: 'documents-critical' }),
  },
};

const FILTER_KEYS = Object.keys(FILTER_ROUTES) as DashboardFilterKey[];

const TASK_FILTER_KEYS: TaskDashboardFilterKey[] = ['tasks-open-month', 'tasks-pending', 'tasks-today'];

const PROGRESS_FILTER_KEYS: ProgressDashboardFilterKey[] = ['progress-this-week', 'progress-today'];
const DOCUMENT_FILTER_KEYS: DocumentDashboardFilterKey[] = ['documents-critical'];

export const isDashboardFilterKey = (value: string | null): value is DashboardFilterKey =>
  !!value && FILTER_KEYS.includes(value as DashboardFilterKey);

export const isTaskDashboardFilter = (
  key: DashboardFilterKey | null,
): key is TaskDashboardFilterKey => !!key && TASK_FILTER_KEYS.includes(key as TaskDashboardFilterKey);

export const isProgressDashboardFilter = (
  key: DashboardFilterKey | null,
): key is ProgressDashboardFilterKey => !!key && PROGRESS_FILTER_KEYS.includes(key as ProgressDashboardFilterKey);

export const isDocumentDashboardFilter = (
  key: DashboardFilterKey | null,
): key is DocumentDashboardFilterKey => !!key && DOCUMENT_FILTER_KEYS.includes(key as DocumentDashboardFilterKey);


export const DASHBOARD_FILTER_LABELS: Partial<Record<DashboardFilterKey, string>> = {
  'goals-overview': 'Resumen general de metas',
  'goals-in-progress': 'Metas en progreso',
  'goals-active': 'Metas activas',
  'goals-month-current': 'Metas con fecha este mes',
  'goals-month-due': 'Metas que vencen este mes',
  'goals-month-completed': 'Metas completadas este mes',
  'goals-month-early': 'Metas finalizadas por adelantado',
  'goals-month-pending': 'Metas pendientes del mes',
  'goals-month-recovered': 'Metas recuperadas (fuera de plazo)',
  'tasks-open-month': 'Tareas abiertas del mes',
  'tasks-pending': 'Tareas pendientes',
  'tasks-today': 'Tareas con vencimiento hoy',
  'progress-this-week': 'Avances registrados esta semana',
  'progress-today': 'Avances registrados hoy',
  'documents-critical': 'Documentos críticos próximos a revisión',
};

type FocusType = 'goal' | 'task' | 'progress-log';

const focusRoute = (type: FocusType, id: string): FilterRoute => {
  switch (type) {
    case 'goal':
      return {
        path: '/goals',
        search: createSearch({ dashboardFocus: 'goal', dashboardId: id }),
      };
    case 'task':
      return {
        path: '/tasks',
        search: createSearch({ dashboardFocus: 'task', dashboardId: id }),
      };
    case 'progress-log':
      return {
        path: '/progress',
        search: createSearch({ dashboardFocus: 'progress-log', dashboardId: id }),
      };
    default:
      return { path: '/', search: '' };
  }
};

export function useDashboardNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const openFilter = useCallback(
    (key: DashboardFilterKey) => {
      const route = FILTER_ROUTES[key];
      navigate({ pathname: route.path, search: route.search });
    },
    [navigate],
  );

  const openGoalDetail = useCallback(
    (goalId: string) => {
      const search = createSearch({ dashboardFocus: 'goal', dashboardId: goalId });
      navigate({ pathname: location.pathname, search });
    },
    [navigate, location.pathname],
  );

  const openTaskDetail = useCallback(
    (taskId: string) => {
      const search = createSearch({ dashboardFocus: 'task', dashboardId: taskId });
      navigate({ pathname: location.pathname, search });
    },
    [navigate, location.pathname],
  );

  const openProgressLogDetail = useCallback(
    (progressId: string) => {
      const search = createSearch({ dashboardFocus: 'progress-log', dashboardId: progressId });
      navigate({ pathname: location.pathname, search });
    },
    [navigate, location.pathname],
  );

  return {
    openFilter,
    openGoalDetail,
    openTaskDetail,
    openProgressLogDetail,
  };
}


