import { sql } from 'drizzle-orm';
import { db } from '../db';

export async function up() {
    // Drop old table to recreate with new schema (ID primary key instead of project_id)
    await db.execute(sql`DROP TABLE IF EXISTS project_planner_state;`);

    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS project_planner_state (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL DEFAULT 'Plan Sin Título',
            description TEXT,
            current_phase VARCHAR(50) NOT NULL,
            state_data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);
}

export async function down() {
    await db.execute(sql`DROP TABLE IF EXISTS project_planner_state;`);
    // Revert to old schema (simplified for rollback)
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS project_planner_state (
            project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
            current_phase VARCHAR(50) NOT NULL,
            state_data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);
}
