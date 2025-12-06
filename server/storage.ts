import { db } from './db';
import { and, desc, eq, gte, lte, sql, like, getTableColumns } from 'drizzle-orm';
import { areas, goals, tasks, progress_logs, documents, reports, projects } from '../shared/schema';
import { randomUUID } from 'crypto';

export const TIMELINE_EVENT_TYPES = ['progress_log', 'task_completed', 'goal_completed', 'document_added'] as const;
export type TimelineEventType = typeof TIMELINE_EVENT_TYPES[number];

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  area: {
    id: string;
    name: string;
    color: string | null;
  };
  goal?: { id: string; title: string | null } | null;
  task?: { id: string; title: string | null } | null;
  project?: { id: string; title: string | null; code?: string } | null;
  date: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface TimelineQueryParams {
  limit: number;
  cursor?: string;
  areaId?: string;
  projectId?: string;
  eventTypes?: TimelineEventType[];
  from?: Date;
  to?: Date;
}

// Areas
export async function getAreas() {
  return db.select().from(areas);
}
export async function getAreaById(id: string) {
  return db.select().from(areas).where(eq(areas.id, id)).limit(1);
}
export async function createArea(data: any) {
  const areaData = { ...data, id: randomUUID() };
  return db.insert(areas).values(areaData).returning();
}
export async function updateArea(id: string, data: any) {
  return db.update(areas).set(data).where(eq(areas.id, id)).returning();
}
export async function deleteArea(id: string) {
  return db.delete(areas).where(eq(areas.id, id));
}

// Projects
export async function getProjects() {
  return db.select().from(projects);
}
export async function getProjectById(id: string) {
  return db.select().from(projects).where(eq(projects.id, id)).limit(1);
}
export async function getNextProjectCode() {
  const lastProject = await db
    .select({ code: projects.code })
    .from(projects)
    .where(like(projects.code, 'P%'))
    .orderBy(desc(projects.code))
    .limit(1);

  if (!lastProject.length || !lastProject[0].code) {
    return 'P0001';
  }

  const lastCode = lastProject[0].code;
  // Extract number part assuming format PXXXX
  const match = lastCode.match(/^P(\d+)$/);
  if (!match) return 'P0001';

  const num = parseInt(match[1], 10);
  const nextNum = num + 1;
  return `P${nextNum.toString().padStart(4, '0')}`;
}

export async function createProject(data: any) {
  let projectData = { ...data };

  if (!projectData.code) {
    projectData.code = await getNextProjectCode();
  }

  return db.insert(projects).values(projectData).returning();
}
export async function updateProject(id: string, data: any) {
  return db.update(projects).set(data).where(eq(projects.id, id)).returning();
}
export async function deleteProject(id: string) {
  // Unlink children first (set project_id to null)
  await db.update(goals).set({ project_id: null }).where(eq(goals.project_id, id));
  await db.update(tasks).set({ project_id: null }).where(eq(tasks.project_id, id));
  await db.update(documents).set({ project_id: null }).where(eq(documents.project_id, id));

  return db.delete(projects).where(eq(projects.id, id));
}

// Goals
export async function getGoals() {
  return db.select({
    id: goals.id,
    area_id: goals.area_id,
    project_id: goals.project_id,
    title: goals.title,
    description: goals.description,
    goal_type: goals.goal_type,
    start_date: goals.start_date,
    due_date: goals.due_date,
    status: goals.status,
    priority: goals.priority,
    expected_outcome: goals.expected_outcome,
    computed_progress: goals.computed_progress,
    created_at: goals.created_at,
    updated_at: goals.updated_at,
    project_status: projects.status
  }).from(goals)
    .leftJoin(projects, eq(goals.project_id, projects.id));
}
export async function getGoalById(id: string) {
  return db.select({
    id: goals.id,
    area_id: goals.area_id,
    title: goals.title,
    description: goals.description,
    goal_type: goals.goal_type,
    start_date: goals.start_date,
    due_date: goals.due_date,
    status: goals.status,
    priority: goals.priority,
    expected_outcome: goals.expected_outcome,
    computed_progress: goals.computed_progress,
    created_at: goals.created_at,
    updated_at: goals.updated_at
  }).from(goals).where(eq(goals.id, id)).limit(1);
}

export async function getGoalsByProject(projectId: string) {
  return db.select({
    id: goals.id,
    title: goals.title,
    description: goals.description,
    status: goals.status,
    priority: goals.priority
  }).from(goals).where(eq(goals.project_id, projectId));
}

export async function createGoal(data: any) {
  return db.insert(goals).values(data).returning();
}
export async function updateGoal(id: string, data: any) {
  const result = await db.update(goals).set(data).where(eq(goals.id, id)).returning();

  // Si se actualizó el proyecto, actualizar también las tareas asociadas
  if (data.project_id !== undefined) {
    await db.update(tasks)
      .set({ project_id: data.project_id })
      .where(eq(tasks.goal_id, id));
  }

  return result;
}
export async function deleteGoal(id: string) {
  return db.delete(goals).where(eq(goals.id, id));
}

// Tasks
export async function getTasks() {
  const result = await db.select({
    id: tasks.id,
    area_id: tasks.area_id,
    project_id: tasks.project_id,
    goal_id: tasks.goal_id,
    title: tasks.title,
    description: tasks.description,
    status: tasks.status,
    start_date: tasks.start_date,
    due_date: tasks.due_date,
    estimated_effort: tasks.estimated_effort,
    progress_percentage: tasks.progress_percentage,
    tags: tasks.tags,
    created_at: tasks.created_at,
    updated_at: tasks.updated_at,
    project_status: projects.status,
    // Planner fields
    impact: tasks.impact,
    effort: tasks.effort,
    calculated_priority: tasks.calculated_priority,
    estimated_duration: tasks.estimated_duration,
    dependencies: tasks.dependencies,
    planner_meta: tasks.planner_meta
  }).from(tasks)
    .leftJoin(projects, eq(tasks.project_id, projects.id));
  console.log('Storage getTasks - Sample task:', result[0]);
  return result;
}

export async function getTasksByProject(projectId: string) {
  const result = await db.select()
    .from(tasks)
    .leftJoin(goals, eq(tasks.goal_id, goals.id))
    .where(eq(tasks.project_id, projectId));

  return result.map(row => ({
    ...row.tasks,
    goal_title: row.goals?.title,
    goal_id: row.tasks.goal_id
  }));
}
export async function getTaskById(id: string) {
  return db.select({
    id: tasks.id,
    area_id: tasks.area_id,
    project_id: tasks.project_id,
    goal_id: tasks.goal_id,
    title: tasks.title,
    description: tasks.description,
    status: tasks.status,
    start_date: tasks.start_date,
    due_date: tasks.due_date,
    estimated_effort: tasks.estimated_effort,
    progress_percentage: tasks.progress_percentage,
    tags: tasks.tags,
    created_at: tasks.created_at,
    updated_at: tasks.updated_at
  }).from(tasks).where(eq(tasks.id, id)).limit(1);
}
export async function createTask(data: any) {
  // Si hay una meta asignada pero no un proyecto, heredar el proyecto de la meta
  if (data.goal_id && !data.project_id) {
    const [goal] = await db.select().from(goals).where(eq(goals.id, data.goal_id)).limit(1);
    if (goal && goal.project_id) {
      data.project_id = goal.project_id;
    }
  }
  return db.insert(tasks).values(data).returning();
}
export async function updateTask(id: string, data: any) {
  console.log('Storage updateTask - ID:', id, 'Data:', data);
  const result = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
  console.log('Storage updateTask - Result:', result);
  return result;
}
export async function deleteTask(id: string) {
  return db.delete(tasks).where(eq(tasks.id, id));
}

// Progress Logs
const progressLogFields = {
  id: progress_logs.id,
  area_id: progress_logs.area_id,
  goal_id: progress_logs.goal_id,
  task_id: progress_logs.task_id,
  task_progress: progress_logs.task_progress,
  title: progress_logs.title,
  note: progress_logs.note,
  date: progress_logs.date,
  impact_level: progress_logs.impact_level,
  mood: progress_logs.mood,
  created_at: progress_logs.created_at,
  updated_at: progress_logs.updated_at,
};

export async function getProgressLogs() {
  return db.select(progressLogFields).from(progress_logs);
}
export async function getProgressLogById(id: string) {
  return db.select(progressLogFields).from(progress_logs).where(eq(progress_logs.id, id)).limit(1);
}
export async function createProgressLog(data: any) {
  return db.insert(progress_logs).values(data).returning();
}
export async function updateProgressLog(id: string, data: any) {
  return db.update(progress_logs).set(data).where(eq(progress_logs.id, id)).returning();
}
export async function deleteProgressLog(id: string) {
  return db.delete(progress_logs).where(eq(progress_logs.id, id));
}

// Documents
export async function getDocuments() {
  return db.select().from(documents);
}
export async function getDocumentById(id: string) {
  return db.select().from(documents).where(eq(documents.id, id)).limit(1);
}
export async function createDocument(data: any) {
  return db.insert(documents).values(data).returning();
}
export async function updateDocument(id: string, data: any) {
  return db.update(documents).set(data).where(eq(documents.id, id)).returning();
}
export async function deleteDocument(id: string) {
  return db.delete(documents).where(eq(documents.id, id));
}

const DEFAULT_FETCH_MULTIPLIER = 3;
const DEFAULT_AREA_COLOR = '#6366F1';

export type GlobalSearchEntityType = 'area' | 'goal' | 'task' | 'document';

export interface GlobalSearchHit {
  id: string;
  type: GlobalSearchEntityType;
  title: string;
  subtitle?: string;
  path: string;
  area?: {
    id: string;
    name: string;
    color: string | null;
  };
  meta?: Record<string, unknown>;
}

export interface GlobalSearchResults {
  query: string;
  results: {
    areas: GlobalSearchHit[];
    goals: GlobalSearchHit[];
    tasks: GlobalSearchHit[];
    documents: GlobalSearchHit[];
  };
}

const buildMeta = (entries: Record<string, unknown>): Record<string, unknown> | undefined => {
  const meta: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      meta[key] = value;
      continue;
    }
    if (value instanceof Date) {
      meta[key] = value.toISOString();
      continue;
    }
    meta[key] = value;
  }
  return Object.keys(meta).length > 0 ? meta : undefined;
};

interface InternalTimelineEvent extends TimelineEvent {
  sortKey: number;
  sortId: string;
}

const parseCursor = (cursor?: string) => {
  if (!cursor) return null;
  const [timestampPart, idPart] = cursor.split('|');
  if (!timestampPart || !idPart) return null;
  const date = new Date(timestampPart);
  const timestamp = date.getTime();
  if (Number.isNaN(timestamp)) return null;
  return { timestamp, id: idPart };
};

const normalizeDate = (input?: Date | string | null): Date | undefined => {
  if (!input) return undefined;
  if (input instanceof Date) return input;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const shouldIncludeDate = (date: Date | undefined, from?: Date, to?: Date) => {
  if (!date) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

const createEmptySearchResults = (): GlobalSearchResults['results'] => ({
  areas: [],
  goals: [],
  tasks: [],
  documents: [],
});

const normalizeSearchLimit = (value?: number) => {
  if (!value || Number.isNaN(value)) return 6;
  const parsed = Math.trunc(value);
  if (parsed < 1) return 1;
  if (parsed > 20) return 20;
  return parsed;
};

export async function globalSearch(query: string, limitPerEntity?: number): Promise<GlobalSearchResults> {
  const raw = query ?? '';
  const sanitized = raw.trim();

  if (sanitized.length < 2) {
    return { query: sanitized, results: createEmptySearchResults() };
  }

  const limit = normalizeSearchLimit(limitPerEntity);
  const pattern = `%${sanitized.replace(/\s+/g, '%')}%`;

  const [areaRows, goalRows, taskRows, documentRows] = await Promise.all([
    db
      .select({
        id: areas.id,
        name: areas.name,
        description: areas.description,
        type: areas.type,
        color: areas.color,
      })
      .from(areas)
      .where(
        sql`
          ${areas.name} ILIKE ${pattern}
          OR COALESCE(${areas.description}, '') ILIKE ${pattern}
          OR ${areas.type} ILIKE ${pattern}
        `,
      )
      .orderBy(sql`lower(${areas.name})`)
      .limit(limit),
    db
      .select({
        id: goals.id,
        title: goals.title,
        description: goals.description,
        status: goals.status,
        dueDate: goals.due_date,
        expectedOutcome: goals.expected_outcome,
        updatedAt: goals.updated_at,
        areaId: goals.area_id,
        areaName: areas.name,
        areaColor: areas.color,
      })
      .from(goals)
      .innerJoin(areas, eq(areas.id, goals.area_id))
      .where(
        sql`
          ${goals.title} ILIKE ${pattern}
          OR COALESCE(${goals.description}, '') ILIKE ${pattern}
          OR COALESCE(${goals.expected_outcome}, '') ILIKE ${pattern}
        `,
      )
      .orderBy(desc(goals.updated_at))
      .limit(limit),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        dueDate: tasks.due_date,
        progress: tasks.progress_percentage,
        tags: tasks.tags,
        updatedAt: tasks.updated_at,
        goalId: tasks.goal_id,
        goalTitle: goals.title,
        areaId: tasks.area_id,
        areaName: areas.name,
        areaColor: areas.color,
      })
      .from(tasks)
      .innerJoin(areas, eq(areas.id, tasks.area_id))
      .leftJoin(goals, eq(goals.id, tasks.goal_id))
      .where(
        sql`
          ${tasks.title} ILIKE ${pattern}
          OR COALESCE(${tasks.description}, '') ILIKE ${pattern}
          OR COALESCE(array_to_string(${tasks.tags}, ' '), '') ILIKE ${pattern}
          OR COALESCE(${goals.title}, '') ILIKE ${pattern}
        `,
      )
      .orderBy(desc(tasks.updated_at))
      .limit(limit),
    db
      .select({
        id: documents.id,
        title: documents.title,
        description: documents.description,
        docType: documents.doc_type,
        reviewDate: documents.review_date,
        url: documents.url,
        updatedAt: documents.updated_at,
        areaId: documents.area_id,
        areaName: areas.name,
        areaColor: areas.color,
        goalId: documents.goal_id,
        goalTitle: goals.title,
        taskId: documents.task_id,
        taskTitle: tasks.title,
      })
      .from(documents)
      .innerJoin(areas, eq(areas.id, documents.area_id))
      .leftJoin(goals, eq(goals.id, documents.goal_id))
      .leftJoin(tasks, eq(tasks.id, documents.task_id))
      .where(
        sql`
          ${documents.title} ILIKE ${pattern}
          OR COALESCE(${documents.description}, '') ILIKE ${pattern}
          OR COALESCE(${documents.doc_type}, '') ILIKE ${pattern}
          OR COALESCE(${documents.url}, '') ILIKE ${pattern}
          OR COALESCE(${goals.title}, '') ILIKE ${pattern}
          OR COALESCE(${tasks.title}, '') ILIKE ${pattern}
        `,
      )
      .orderBy(desc(documents.updated_at))
      .limit(limit),
  ]);

  const areaHits: GlobalSearchHit[] = areaRows.map((row) => ({
    id: row.id,
    type: 'area',
    title: row.name,
    subtitle: row.description ?? undefined,
    path: `/areas/${row.id}/dashboard`,
    area: {
      id: row.id,
      name: row.name,
      color: row.color ?? DEFAULT_AREA_COLOR,
    },
    meta: buildMeta({
      category: row.type,
    }),
  }));

  const goalHits: GlobalSearchHit[] = goalRows.map((row) => ({
    id: row.id,
    type: 'goal',
    title: row.title,
    subtitle: row.description ?? undefined,
    path: `/goals?highlight=${row.id}`,
    area: {
      id: row.areaId,
      name: row.areaName ?? 'Área sin nombre',
      color: row.areaColor ?? DEFAULT_AREA_COLOR,
    },
    meta: buildMeta({
      status: row.status,
      dueDate: row.dueDate ?? undefined,
      expectedOutcome: row.expectedOutcome ?? undefined,
      updatedAt: row.updatedAt,
    }),
  }));

  const taskHits: GlobalSearchHit[] = taskRows.map((row) => ({
    id: row.id,
    type: 'task',
    title: row.title,
    subtitle: row.description ?? undefined,
    path: `/tasks?highlight=${row.id}`,
    area: {
      id: row.areaId,
      name: row.areaName ?? 'Área sin nombre',
      color: row.areaColor ?? DEFAULT_AREA_COLOR,
    },
    meta: buildMeta({
      status: row.status,
      dueDate: row.dueDate ?? undefined,
      progress: row.progress ?? undefined,
      tags: row.tags ?? undefined,
      goalId: row.goalId ?? undefined,
      goalTitle: row.goalTitle ?? undefined,
      updatedAt: row.updatedAt,
    }),
  }));

  const documentHits: GlobalSearchHit[] = documentRows.map((row) => ({
    id: row.id,
    type: 'document',
    title: row.title,
    subtitle: row.description ?? undefined,
    path: `/documents?highlight=${row.id}`,
    area: {
      id: row.areaId,
      name: row.areaName ?? 'Área sin nombre',
      color: row.areaColor ?? DEFAULT_AREA_COLOR,
    },
    meta: buildMeta({
      docType: row.docType ?? undefined,
      reviewDate: row.reviewDate ?? undefined,
      url: row.url ?? undefined,
      goalId: row.goalId ?? undefined,
      goalTitle: row.goalTitle ?? undefined,
      taskId: row.taskId ?? undefined,
      taskTitle: row.taskTitle ?? undefined,
      updatedAt: row.updatedAt,
    }),
  }));

  return {
    query: sanitized,
    results: {
      areas: areaHits,
      goals: goalHits,
      tasks: taskHits,
      documents: documentHits,
    },
  };
}

export async function getTimelineEvents(params: TimelineQueryParams) {
  const limit = Math.max(1, params.limit);
  const fetchLimit = Math.max(limit * DEFAULT_FETCH_MULTIPLIER, limit + 10);
  const eventTypes = new Set(params.eventTypes && params.eventTypes.length ? params.eventTypes : TIMELINE_EVENT_TYPES);

  const events: InternalTimelineEvent[] = [];

  const { areaId, projectId, from: fromDate, to: toDate } = params;

  if (eventTypes.has('progress_log')) {
    let query: any = db
      .select({
        id: progress_logs.id,
        areaId: progress_logs.area_id,
        areaName: areas.name,
        areaColor: areas.color,
        goalId: progress_logs.goal_id,
        goalTitle: goals.title,
        goalProjectId: goals.project_id,
        taskId: progress_logs.task_id,
        taskTitle: tasks.title,
        taskProjectId: tasks.project_id,
        projectTitle: projects.title,
        projectCode: projects.code,
        title: progress_logs.title,
        note: progress_logs.note,
        date: progress_logs.date,
        createdAt: progress_logs.created_at,
        mood: progress_logs.mood,
        impact: progress_logs.impact_level,
        taskProgress: progress_logs.task_progress,
      })
      .from(progress_logs)
      .innerJoin(areas, eq(areas.id, progress_logs.area_id))
      .leftJoin(goals, eq(goals.id, progress_logs.goal_id))
      .leftJoin(tasks, eq(tasks.id, progress_logs.task_id))
      .leftJoin(projects, sql`${projects.id} = COALESCE(${tasks.project_id}, ${goals.project_id})`);

    const conditions = [];
    if (areaId) conditions.push(eq(progress_logs.area_id, areaId));
    if (projectId) conditions.push(sql`COALESCE(${tasks.project_id}, ${goals.project_id}) = ${projectId}`);
    if (fromDate) conditions.push(gte(progress_logs.created_at, fromDate));
    if (toDate) conditions.push(lte(progress_logs.created_at, toDate));
    if (conditions.length) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(progress_logs.created_at)).limit(fetchLimit);

    for (const row of rows) {
      const createdAt = normalizeDate(row.createdAt) ?? new Date();
      const eventDate = normalizeDate(row.date) ?? createdAt;
      if (!shouldIncludeDate(eventDate, fromDate, toDate)) continue;

      const projectId = row.taskProjectId ?? row.goalProjectId;
      events.push({
        id: `progress_log:${row.id}`,
        sortId: row.id,
        sortKey: createdAt.getTime(),
        type: 'progress_log',
        title: row.title,
        subtitle: row.note ?? undefined,
        area: {
          id: row.areaId,
          name: row.areaName ?? 'Área sin nombre',
          color: row.areaColor ?? DEFAULT_AREA_COLOR,
        },
        goal: row.goalId ? { id: row.goalId, title: row.goalTitle ?? null } : null,
        task: row.taskId ? { id: row.taskId, title: row.taskTitle ?? null } : null,
        project: projectId ? { id: projectId, title: row.projectTitle ?? null, code: row.projectCode } : null,
        date: eventDate.toISOString(),
        createdAt: createdAt.toISOString(),
        meta: buildMeta({
          mood: row.mood,
          impact: row.impact,
          progress: row.taskProgress,
        }),
      });
    }
  }

  if (eventTypes.has('task_completed')) {
    let query: any = db
      .select({
        id: tasks.id,
        areaId: tasks.area_id,
        projectId: tasks.project_id,
        areaName: areas.name,
        areaColor: areas.color,
        goalId: tasks.goal_id,
        goalTitle: goals.title,
        projectTitle: projects.title,
        projectCode: projects.code,
        title: tasks.title,
        description: tasks.description,
        updatedAt: tasks.updated_at,
        createdAt: tasks.created_at,
        dueDate: tasks.due_date,
        tags: tasks.tags,
        progress: tasks.progress_percentage,
      })
      .from(tasks)
      .innerJoin(areas, eq(areas.id, tasks.area_id))
      .leftJoin(goals, eq(goals.id, tasks.goal_id))
      .leftJoin(projects, eq(projects.id, tasks.project_id));

    const conditions = [eq(tasks.status, 'completada')];
    if (areaId) conditions.push(eq(tasks.area_id, areaId));
    if (projectId) conditions.push(eq(tasks.project_id, projectId));
    if (fromDate) conditions.push(gte(tasks.updated_at, fromDate));
    if (toDate) conditions.push(lte(tasks.updated_at, toDate));
    if (conditions.length) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(tasks.updated_at)).limit(fetchLimit);

    for (const row of rows) {
      const updatedAt = normalizeDate(row.updatedAt) ?? normalizeDate(row.createdAt) ?? new Date();
      if (!shouldIncludeDate(updatedAt, fromDate, toDate)) continue;

      events.push({
        id: `task_completed:${row.id}`,
        sortId: row.id,
        sortKey: updatedAt.getTime(),
        type: 'task_completed',
        title: row.title,
        subtitle: row.goalTitle ? `Meta: ${row.goalTitle}` : row.description ?? undefined,
        area: {
          id: row.areaId,
          name: row.areaName ?? 'Área sin nombre',
          color: row.areaColor ?? DEFAULT_AREA_COLOR,
        },
        goal: row.goalId ? { id: row.goalId, title: row.goalTitle ?? null } : null,
        task: { id: row.id, title: row.title },
        project: row.projectId ? { id: row.projectId, title: row.projectTitle ?? null, code: row.projectCode } : null,
        date: updatedAt.toISOString(),
        createdAt: updatedAt.toISOString(),
        meta: buildMeta({
          progress: row.progress,
          dueDate: normalizeDate(row.dueDate),
          tags: row.tags,
        }),
      });
    }
  }

  if (eventTypes.has('goal_completed')) {
    let query: any = db
      .select({
        id: goals.id,
        areaId: goals.area_id,
        projectId: goals.project_id,
        areaName: areas.name,
        areaColor: areas.color,
        projectTitle: projects.title,
        projectCode: projects.code,
        title: goals.title,
        description: goals.description,
        updatedAt: goals.updated_at,
        createdAt: goals.created_at,
        computedProgress: goals.computed_progress,
        priority: goals.priority,
      })
      .from(goals)
      .innerJoin(areas, eq(areas.id, goals.area_id))
      .leftJoin(projects, eq(projects.id, goals.project_id));

    const conditions = [eq(goals.status, 'completada')];
    if (areaId) conditions.push(eq(goals.area_id, areaId));
    if (projectId) conditions.push(eq(goals.project_id, projectId));
    if (fromDate) conditions.push(gte(goals.updated_at, fromDate));
    if (toDate) conditions.push(lte(goals.updated_at, toDate));
    if (conditions.length) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(goals.updated_at)).limit(fetchLimit);

    for (const row of rows) {
      const completedAt = normalizeDate(row.updatedAt) ?? normalizeDate(row.createdAt) ?? new Date();
      if (!shouldIncludeDate(completedAt, fromDate, toDate)) continue;

      events.push({
        id: `goal_completed:${row.id}`,
        sortId: row.id,
        sortKey: completedAt.getTime(),
        type: 'goal_completed',
        title: row.title,
        subtitle: row.description ?? undefined,
        area: {
          id: row.areaId,
          name: row.areaName ?? 'Área sin nombre',
          color: row.areaColor ?? DEFAULT_AREA_COLOR,
        },
        goal: { id: row.id, title: row.title },
        project: row.projectId ? { id: row.projectId, title: row.projectTitle ?? null, code: row.projectCode } : null,
        date: completedAt.toISOString(),
        createdAt: completedAt.toISOString(),
        meta: buildMeta({
          progress: row.computedProgress,
          priority: row.priority,
        }),
      });
    }
  }

  if (eventTypes.has('document_added')) {
    let query: any = db
      .select({
        id: documents.id,
        areaId: documents.area_id,
        projectId: documents.project_id,
        areaName: areas.name,
        areaColor: areas.color,
        goalId: documents.goal_id,
        goalTitle: goals.title,
        taskId: documents.task_id,
        taskTitle: tasks.title,
        projectTitle: projects.title,
        projectCode: projects.code,
        title: documents.title,
        description: documents.description,
        docType: documents.doc_type,
        url: documents.url,
        reviewDate: documents.review_date,
        createdAt: documents.created_at,
      })
      .from(documents)
      .innerJoin(areas, eq(areas.id, documents.area_id))
      .leftJoin(goals, eq(goals.id, documents.goal_id))
      .leftJoin(tasks, eq(tasks.id, documents.task_id))
      .leftJoin(projects, eq(projects.id, documents.project_id));

    const conditions = [];
    if (areaId) conditions.push(eq(documents.area_id, areaId));
    if (projectId) conditions.push(eq(documents.project_id, projectId));
    if (fromDate) conditions.push(gte(documents.created_at, fromDate));
    if (toDate) conditions.push(lte(documents.created_at, toDate));
    if (conditions.length) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(desc(documents.created_at)).limit(fetchLimit);

    for (const row of rows) {
      const createdAt = normalizeDate(row.createdAt) ?? new Date();
      if (!shouldIncludeDate(createdAt, fromDate, toDate)) continue;

      events.push({
        id: `document_added:${row.id}`,
        sortId: row.id,
        sortKey: createdAt.getTime(),
        type: 'document_added',
        title: row.title,
        subtitle: row.description ?? undefined,
        area: {
          id: row.areaId,
          name: row.areaName ?? 'Área sin nombre',
          color: row.areaColor ?? DEFAULT_AREA_COLOR,
        },
        goal: row.goalId ? { id: row.goalId, title: row.goalTitle ?? null } : null,
        task: row.taskId ? { id: row.taskId, title: row.taskTitle ?? null } : null,
        project: row.projectId ? { id: row.projectId, title: row.projectTitle ?? null, code: row.projectCode } : null,
        date: createdAt.toISOString(),
        createdAt: createdAt.toISOString(),
        meta: buildMeta({
          docType: row.docType,
          url: row.url,
          reviewDate: normalizeDate(row.reviewDate),
        }),
      });
    }
  }

  const cursorInfo = parseCursor(params.cursor);

  const sorted = events.sort((a, b) => {
    if (b.sortKey !== a.sortKey) return b.sortKey - a.sortKey;
    return a.sortId.localeCompare(b.sortId);
  });

  const filtered = cursorInfo
    ? sorted.filter((event) => {
      if (event.sortKey < cursorInfo.timestamp) return true;
      if (event.sortKey > cursorInfo.timestamp) return false;
      return event.sortId < cursorInfo.id;
    })
    : sorted;

  const slice = filtered.slice(0, limit);
  const hasMore = filtered.length > limit;
  const nextCursor =
    hasMore && slice.length
      ? `${slice[limit - 1].createdAt}|${slice[limit - 1].sortId}`
      : undefined;

  const items: TimelineEvent[] = slice.map(({ sortKey, sortId, ...rest }) => rest);

  return {
    items,
    pagination: {
      hasMore,
      nextCursor: nextCursor ?? null,
    },
  };
}

// Reports
export async function getReports() {
  return db.select().from(reports);
}
export async function getReportById(id: string) {
  return db.select().from(reports).where(eq(reports.id, id)).limit(1);
}
export async function createReport(data: any) {
  return db.insert(reports).values(data).returning();
}
export async function updateReport(id: string, data: any) {
  return db.update(reports).set(data).where(eq(reports.id, id)).returning();
}
export async function deleteReport(id: string) {
  return db.delete(reports).where(eq(reports.id, id));
}

// Area Specialized Dashboards (Phase 10)
export async function getAreaDashboard(areaId: string) {
  try {
    // Get area info
    const areaData = await db.select().from(areas).where(eq(areas.id, areaId)).limit(1);

    if (!areaData.length) {
      return { error: 'Area not found' };
    }

    const area = areaData[0];

    // Get area goals with their progress
    const areaGoalsData = await db
      .select({
        id: goals.id,
        title: goals.title,
        description: goals.description,
        status: goals.status,
        priority: goals.priority,
        computed_progress: goals.computed_progress,
        due_date: goals.due_date,
      })
      .from(goals)
      .where(eq(goals.area_id, areaId));

    // Get area tasks with their progress
    const areaTasksData = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        progress_percentage: tasks.progress_percentage,
        due_date: tasks.due_date,
      })
      .from(tasks)
      .where(eq(tasks.area_id, areaId));

    // Get area progress logs
    const areaProgressData = await db
      .select({
        id: progress_logs.id,
        title: progress_logs.title,
        mood: progress_logs.mood,
        impact_level: progress_logs.impact_level,
        date: progress_logs.date,
      })
      .from(progress_logs)
      .where(eq(progress_logs.area_id, areaId));

    // Calculate metrics
    const totalGoals = areaGoalsData.length;
    const completedGoals = areaGoalsData.filter(g => g.status === 'completada').length;
    const avgGoalProgress = totalGoals > 0
      ? Math.round(areaGoalsData.reduce((sum, g) => sum + (g.computed_progress || 0), 0) / totalGoals)
      : 0;

    const totalTasks = areaTasksData.length;
    const completedTasks = areaTasksData.filter(t => t.status === 'completada').length;
    const avgTaskProgress = totalTasks > 0
      ? Math.round(areaTasksData.reduce((sum, t) => sum + (t.progress_percentage || 0), 0) / totalTasks)
      : 0;

    const avgMood = areaProgressData.length > 0
      ? Math.round(areaProgressData.reduce((sum, p) => sum + (p.mood || 0), 0) / areaProgressData.length)
      : 0;

    return {
      area,
      metrics: {
        totalGoals,
        completedGoals,
        goalCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
        avgGoalProgress,
        totalTasks,
        completedTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        avgTaskProgress,
        avgMood,
        progressLogsCount: areaProgressData.length,
      },
      goals: areaGoalsData,
      tasks: areaTasksData,
      progressLogs: areaProgressData,
    };
  } catch (err) {
    throw err;
  }
}

export async function getAreaGoals(areaId: string) {
  return db
    .select()
    .from(goals)
    .where(eq(goals.area_id, areaId));
}

export async function getAreaTasks(areaId: string) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.area_id, areaId));
}

export async function getAreaProgress(areaId: string) {
  return db
    .select()
    .from(progress_logs)
    .where(eq(progress_logs.area_id, areaId));
}

export async function getAreaMetrics(areaId: string) {
  try {
    const goalsData = await db
      .select({ status: goals.status, computed_progress: goals.computed_progress })
      .from(goals)
      .where(eq(goals.area_id, areaId));

    const tasksData = await db
      .select({ status: tasks.status, progress_percentage: tasks.progress_percentage })
      .from(tasks)
      .where(eq(tasks.area_id, areaId));

    const progressData = await db
      .select({ mood: progress_logs.mood, impact_level: progress_logs.impact_level })
      .from(progress_logs)
      .where(eq(progress_logs.area_id, areaId));

    return {
      goals: {
        total: goalsData.length,
        completed: goalsData.filter(g => g.status === 'completada').length,
        inProgress: goalsData.filter(g => g.status === 'en_progreso').length,
        pending: goalsData.filter(g => g.status === 'pendiente').length,
        avgProgress: goalsData.length > 0
          ? Math.round(goalsData.reduce((sum, g) => sum + (g.computed_progress || 0), 0) / goalsData.length)
          : 0,
      },
      tasks: {
        total: tasksData.length,
        completed: tasksData.filter(t => t.status === 'completada').length,
        inProgress: tasksData.filter(t => t.status === 'en_progreso').length,
        pending: tasksData.filter(t => t.status === 'pendiente').length,
        avgProgress: tasksData.length > 0
          ? Math.round(tasksData.reduce((sum, t) => sum + (t.progress_percentage || 0), 0) / tasksData.length)
          : 0,
      },
      wellness: {
        logCount: progressData.length,
        avgMood: progressData.length > 0
          ? Math.round(progressData.reduce((sum, p) => sum + (p.mood || 0), 0) / progressData.length)
          : 0,
        avgImpact: progressData.length > 0
          ? Math.round(progressData.reduce((sum, p) => sum + (p.impact_level || 0), 0) / progressData.length)
          : 0,
      },
    };
  } catch (err) {
    throw err;
  }
}
// Planner State Persistence (Scenarios)
import { projectPlannerState } from '../shared/plannerSchema';

export async function getProjectPlans(projectId: string) {
  return db.select().from(projectPlannerState)
    .where(eq(projectPlannerState.project_id, projectId))
    .orderBy(desc(projectPlannerState.updated_at));
}

export async function getPlanById(planId: string) {
  const [plan] = await db.select().from(projectPlannerState).where(eq(projectPlannerState.id, planId));
  return plan;
}

export async function createPlan(projectId: string, name: string, description: string | undefined, phase: string, stateData: any) {
  return db.insert(projectPlannerState)
    .values({
      project_id: projectId,
      name,
      description,
      current_phase: phase,
      state_data: stateData
    })
    .returning();
}

export async function updatePlan(planId: string, phase: string, stateData: any) {
  return db.update(projectPlannerState)
    .set({
      current_phase: phase,
      state_data: stateData,
      updated_at: new Date()
    })
    .where(eq(projectPlannerState.id, planId))
    .returning();
}


export async function deletePlan(planId: string) {
  return db.delete(projectPlannerState).where(eq(projectPlannerState.id, planId));
}

export async function getPlanDeltas(planId: string) {
  // 1. Get the plan
  const plan = await getPlanById(planId);
  if (!plan) throw new Error('Plan not found');

  // 2. Get all project tasks
  const allProjectTasks = await getTasksByProject(plan.project_id);

  // 3. Extract IDs of tasks and goals already in the plan
  const planState = plan.state_data as any;
  const existingTaskIds = new Set((planState.tasks || []).map((t: any) => t.id));
  const existingGoalIds = new Set((planState.tasks || []).map((t: any) => t.goal_id).filter(Boolean));

  // 4. Filter for new tasks that belong to existing goals
  const newTasks = allProjectTasks.filter(task => {
    const isNew = !existingTaskIds.has(task.id);
    // If task has no goal, we might want to include it if we have other no-goal tasks?
    // For now, let's be strict: only include if goal matches.
    // If the plan has tasks with NO goal (goal_id is null), should we include new tasks with NO goal?
    // Let's assume yes if the set has 'null' or undefined, but Set(filter(Boolean)) removes them.
    // Let's check if we have any task with no goal.
    const hasNoGoalTasks = (planState.tasks || []).some((t: any) => !t.goal_id);

    const isRelevantGoal = task.goal_id ? existingGoalIds.has(task.goal_id) : hasNoGoalTasks;

    return isNew && isRelevantGoal;
  });

  return newTasks;
}

// Baselines
import { projectBaselines, baselineTasks } from '../shared/plannerSchema';

export async function createProjectBaseline(data: any) {
  return db.insert(projectBaselines).values(data).returning();
}

export async function createBaselineTasks(data: any[]) {
  if (data.length === 0) return [];
  return db.insert(baselineTasks).values(data).returning();
}

export async function getProjectBaselines(projectId: string) {
  return db.select().from(projectBaselines).where(eq(projectBaselines.project_id, projectId)).orderBy(desc(projectBaselines.created_at));
}

export async function getBaselineTasks(baselineId: string) {
  return db.select().from(baselineTasks).where(eq(baselineTasks.baseline_id, baselineId));
}

