import { db } from './db';
import { areas, goals, tasks, progress_logs, documents, reports } from '../shared/schema';

// Areas
export async function getAreas() {
  return db.select().from(areas);
}
export async function getAreaById(id: string) {
  return db.select().from(areas).where({ id }).limit(1);
}
export async function createArea(data: any) {
  return db.insert(areas).values(data).returning();
}
export async function updateArea(id: string, data: any) {
  return db.update(areas).set(data).where({ id }).returning();
}
export async function deleteArea(id: string) {
  return db.delete(areas).where({ id });
}

// Goals
export async function getGoals() {
  return db.select().from(goals);
}
export async function getGoalById(id: string) {
  return db.select().from(goals).where({ id }).limit(1);
}
export async function createGoal(data: any) {
  return db.insert(goals).values(data).returning();
}
export async function updateGoal(id: string, data: any) {
  return db.update(goals).set(data).where({ id }).returning();
}
export async function deleteGoal(id: string) {
  return db.delete(goals).where({ id });
}

// Tasks
export async function getTasks() {
  return db.select().from(tasks);
}
export async function getTaskById(id: string) {
  return db.select().from(tasks).where({ id }).limit(1);
}
export async function createTask(data: any) {
  return db.insert(tasks).values(data).returning();
}
export async function updateTask(id: string, data: any) {
  return db.update(tasks).set(data).where({ id }).returning();
}
export async function deleteTask(id: string) {
  return db.delete(tasks).where({ id });
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
  return db.update(progress_logs).set(data).where({ id }).returning();
}
export async function deleteProgressLog(id: string) {
  return db.delete(progress_logs).where({ id });
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
  return db.update(documents).set(data).where({ id }).returning();
}
export async function deleteDocument(id: string) {
  return db.delete(documents).where({ id });
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
  return db.update(reports).set(data).where({ id }).returning();
}
export async function deleteReport(id: string) {
  return db.delete(reports).where({ id });
}
