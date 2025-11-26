import { db } from './db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  try {
    console.log('Ejecutando migración...');
    
    // Add progress_percentage column to tasks table
    await db.execute(sql`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0
    `);
    console.log('✓ Columna progress_percentage agregada');

    // Set progress to 100 for completed tasks
    await db.execute(sql`
      UPDATE tasks 
      SET progress_percentage = 100 
      WHERE status = 'completada' AND progress_percentage = 0
    `);
    console.log('✓ Progreso actualizado para tareas completadas');

    // Set progress to 0 for pending tasks
    await db.execute(sql`
      UPDATE tasks 
      SET progress_percentage = 0 
      WHERE status = 'pendiente' AND progress_percentage IS NULL
    `);
    console.log('✓ Progreso actualizado para tareas pendientes');

    // --- Add task_progress column to progress_logs ---
    await db.execute(sql`
      ALTER TABLE progress_logs
      ADD COLUMN IF NOT EXISTS task_progress INTEGER
    `);
    console.log('✓ Columna task_progress agregada a progress_logs');

    // Permitir null en goal_id y task_id para logs independientes
    await db.execute(sql`
      ALTER TABLE progress_logs
      ALTER COLUMN goal_id DROP NOT NULL
    `);
    console.log('✓ Columna goal_id permite NULL');

    await db.execute(sql`
      ALTER TABLE progress_logs
      ALTER COLUMN task_id DROP NOT NULL
    `);
    console.log('✓ Columna task_id permite NULL');

    // Asegurar restricción de rango para task_progress
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.table_constraints
          WHERE table_name = 'progress_logs'
            AND constraint_name = 'progress_logs_task_progress_check'
        ) THEN
          ALTER TABLE progress_logs
          ADD CONSTRAINT progress_logs_task_progress_check
          CHECK (task_progress BETWEEN 0 AND 100);
        END IF;
      END $$;
    `);
    console.log('✓ Restricción CHECK para task_progress verificada');

    console.log('\n¡Migración completada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('Error en migración:', error);
    process.exit(1);
  }
}

runMigration();
