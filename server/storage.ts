import { db } from './db';
import { eq } from 'drizzle-orm';
import { areas, goals, tasks, progress_logs, documents, reports } from '../shared/schema';

// Areas
export async function getAreas() {
  return db.select().from(areas);
}
export async function getAreaById(id: string) {
  return db.select().from(areas).where(eq(areas.id, id)).limit(1);
}
export async function createArea(data: any) {
  return db.insert(areas).values(data).returning();
}
export async function updateArea(id: string, data: any) {
  return db.update(areas).set(data).where(eq(areas.id, id)).returning();
}
export async function deleteArea(id: string) {
  return db.delete(areas).where(eq(areas.id, id));
}

// Goals
export async function getGoals() {
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
  }).from(goals);
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
export async function createGoal(data: any) {
  return db.insert(goals).values(data).returning();
}
export async function updateGoal(id: string, data: any) {
  return db.update(goals).set(data).where(eq(goals.id, id)).returning();
}
export async function deleteGoal(id: string) {
  return db.delete(goals).where(eq(goals.id, id));
}

// Tasks
export async function getTasks() {
  const result = await db.select({
    id: tasks.id,
    area_id: tasks.area_id,
    goal_id: tasks.goal_id,
    title: tasks.title,
    description: tasks.description,
    status: tasks.status,
    due_date: tasks.due_date,
    estimated_effort: tasks.estimated_effort,
    progress_percentage: tasks.progress_percentage,
    tags: tasks.tags,
    created_at: tasks.created_at,
    updated_at: tasks.updated_at
  }).from(tasks);
  console.log('Storage getTasks - Sample task:', result[0]);
  return result;
}
export async function getTaskById(id: string) {
  return db.select({
    id: tasks.id,
    area_id: tasks.area_id,
    goal_id: tasks.goal_id,
    title: tasks.title,
    description: tasks.description,
    status: tasks.status,
    due_date: tasks.due_date,
    estimated_effort: tasks.estimated_effort,
    progress_percentage: tasks.progress_percentage,
    tags: tasks.tags,
    created_at: tasks.created_at,
    updated_at: tasks.updated_at
  }).from(tasks).where(eq(tasks.id, id)).limit(1);
}
export async function createTask(data: any) {
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
  return db.select().from(documents).where({ id }).limit(1);
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

// Reports
export async function getReports() {
  return db.select().from(reports);
}
export async function getReportById(id: string) {
  return db.select().from(reports).where({ id }).limit(1);
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
