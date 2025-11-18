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

    console.log('\n¡Migración completada con éxito!');
    process.exit(0);
  } catch (error) {
    console.error('Error en migración:', error);
    process.exit(1);
  }
}

runMigration();
