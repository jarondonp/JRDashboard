import { sql } from 'drizzle-orm';
import { db } from '../db';

export async function up() {
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS project_planner_state (
            project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
            current_phase VARCHAR(50) NOT NULL,
            state_data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);
}

export async function down() {
    await db.execute(sql`
        DROP TABLE IF NOT EXISTS project_planner_state;
    `);
}
