import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runMigration() {
    try {
        console.log('Ejecutando migración de Flow Planner...');

        // Agregar columnas a tasks
        await db.execute(sql`
      ALTER TABLE tasks
      ADD COLUMN IF NOT EXISTS impact INTEGER CHECK (impact BETWEEN 1 AND 5),
      ADD COLUMN IF NOT EXISTS effort INTEGER CHECK (effort BETWEEN 1 AND 5),
      ADD COLUMN IF NOT EXISTS calculated_priority VARCHAR(10),
      ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
      ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS planner_meta JSONB DEFAULT '{}'::jsonb;
    `);
        console.log('✓ Columnas agregadas a tasks');

        // Crear tabla de baselines de proyectos
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS project_baselines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        version_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(255),
        notes TEXT
      );
    `);
        console.log('✓ Tabla project_baselines creada');

        // Crear tabla de tareas baseline
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS baseline_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        baseline_id UUID NOT NULL REFERENCES project_baselines(id) ON DELETE CASCADE,
        task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        original_start_date DATE,
        original_due_date DATE,
        original_priority VARCHAR(10),
        original_status VARCHAR(50),
        original_impact INTEGER,
        original_effort INTEGER,
        original_dependencies JSONB,
        snapshot_data JSONB,
        UNIQUE(baseline_id, task_id)
      );
    `);
        console.log('✓ Tabla baseline_tasks creada');

        // Crear índices para rendimiento
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tasks_dependencies ON tasks USING GIN (dependencies);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_baseline_tasks_baseline_id ON baseline_tasks(baseline_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_project_baselines_project_id ON project_baselines(project_id);`);
        console.log('✓ Índices creados');

        console.log('\n¡Migración de Flow Planner completada con éxito!');
        process.exit(0);
    } catch (error) {
        console.error('Error en migración:', error);
        process.exit(1);
    }
}

runMigration();
