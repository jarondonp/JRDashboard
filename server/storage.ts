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
export async function getProgressLogs() {
  return db.select().from(progress_logs);
}
export async function getProgressLogById(id: string) {
  return db.select().from(progress_logs).where({ id }).limit(1);
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
