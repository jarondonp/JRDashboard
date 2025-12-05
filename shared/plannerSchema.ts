import { z } from 'zod';
import { pgTable, uuid, integer, varchar, jsonb, timestamp, text, date } from 'drizzle-orm/pg-core';
import { projects } from './schema';

// Nueva tabla: project_baselines
export const projectBaselines = pgTable('project_baselines', {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: uuid('project_id').notNull(),
    version_name: varchar('version_name', { length: 255 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    created_by: varchar('created_by', { length: 255 }),
    notes: text('notes')
});

// Nueva tabla: baseline_tasks
export const baselineTasks = pgTable('baseline_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    baseline_id: uuid('baseline_id').notNull(),
    task_id: uuid('task_id').notNull(),
    original_start_date: date('original_start_date'),
    original_due_date: date('original_due_date'),
    original_priority: varchar('original_priority', { length: 10 }),
    original_status: varchar('original_status', { length: 50 }),
    original_impact: integer('original_impact'),
    original_effort: integer('original_effort'),
    original_dependencies: jsonb('original_dependencies').$type<string[]>(),
    snapshot_data: jsonb('snapshot_data')
});

// Nueva tabla: project_planner_state (para guardar progreso - Escenarios)
export const projectPlannerState = pgTable('project_planner_state', {
    id: uuid('id').primaryKey().defaultRandom(),
    project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull().default('Plan Sin Título'),
    description: text('description'),
    current_phase: varchar('current_phase', { length: 50 }).notNull(),
    state_data: jsonb('state_data').notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Validation schemas
export const taskPlannerInputSchema = z.object({
    task_id: z.string().uuid(),
    impact: z.number().min(1).max(5).optional(),
    effort: z.number().min(1).max(5).optional(),
    calculated_priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
    estimated_duration: z.number().positive().optional(),
    dependencies: z.array(z.string().uuid()).optional(),
    planner_meta: z.record(z.string(), z.any()).optional()
});

export const baselineCreateSchema = z.object({
    project_id: z.string().uuid(),
    version_name: z.string().min(1),
    notes: z.string().optional()
});
