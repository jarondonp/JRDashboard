import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runMigration() {
    try {
        console.log('Ejecutando migración de documentos...');

        // Add task_id column to documents table
        await db.execute(sql`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS task_id UUID
    `);
        console.log('✓ Columna task_id agregada a documents');

        console.log('\n¡Migración completada con éxito!');
        process.exit(0);
    } catch (error) {
        console.error('Error en migración:', error);
        process.exit(1);
    }
}

runMigration();
