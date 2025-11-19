import { pgTable, uuid, text, varchar, timestamp, date, integer, smallint } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// Areas
export const areas = pgTable('areas', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  icon: text('icon'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const insertAreaSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.string(),
  color: z.string().length(7),
  icon: z.string().optional(),
});

// Goals
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey(),
  area_id: uuid('area_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  goal_type: text('goal_type'),
  start_date: date('start_date'),
  due_date: date('due_date'),
  status: text('status').notNull(),
  priority: text('priority').notNull(),
  expected_outcome: text('expected_outcome'),
  computed_progress: integer('computed_progress'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const insertGoalSchema = z.object({
  area_id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  goal_type: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: z.string(),
  priority: z.string(),
  expected_outcome: z.string().nullable().optional(),
  computed_progress: z.number().optional(),
});

// Tasks
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey(),
  area_id: uuid('area_id').notNull(),
  goal_id: uuid('goal_id'),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull(),
  due_date: date('due_date'),
  estimated_effort: integer('estimated_effort'),
  progress_percentage: integer('progress_percentage').default(0),
  tags: text('tags').array(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const insertTaskSchema = z.object({
  area_id: z.string(),
  goal_id: z.string().nullable().optional(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string(),
  due_date: z.string().nullable().optional(),
  estimated_effort: z.number().nullable().optional(),
  progress_percentage: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

// Progress Logs
export const progress_logs = pgTable('progress_logs', {
  id: uuid('id').primaryKey(),
  area_id: uuid('area_id').notNull(),
  goal_id: uuid('goal_id'),
  task_id: uuid('task_id'),
  title: text('title').notNull(),
  note: text('note'),
  date: date('date').notNull(),
  impact_level: smallint('impact_level'),
  mood: smallint('mood'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const insertProgressLogSchema = z.object({
  area_id: z.string(),
  goal_id: z.string().optional(),
  task_id: z.string().optional(),
  title: z.string(),
  note: z.string().optional(),
  date: z.string(),
  impact_level: z.number().optional(),
  mood: z.number().optional(),
});

// Documents
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(),
  area_id: uuid('area_id').notNull(),
  goal_id: uuid('goal_id'),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  doc_type: text('doc_type'),
  review_date: date('review_date'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const insertDocumentSchema = z.object({
  area_id: z.string(),
  goal_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  url: z.string().optional(),
  doc_type: z.string().optional(),
  review_date: z.string().optional(),
});

// Reports
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  report_type: text('report_type').notNull(),
  area_id: uuid('area_id'),
  period_start: date('period_start').notNull(),
  period_end: date('period_end').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull().default('borrador'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
export const insertReportSchema = z.object({
  title: z.string(),
  report_type: z.string(),
  area_id: z.string().optional(),
  period_start: z.string(),
  period_end: z.string(),
  content: z.string(),
  status: z.string().optional(),
});
