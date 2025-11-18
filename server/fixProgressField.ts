import { db } from './db';
import { sql } from 'drizzle-orm';

async function fixProgressField() {
  try {
    console.log('Verificando columna progress_percentage...');
    
    // Verificar si la columna existe
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks' AND column_name = 'progress_percentage'
    `);
    
    console.log('Resultado verificación:', checkColumn);
    
    // Asegurar que todas las tareas tengan un valor
    const updateResult = await db.execute(sql`
      UPDATE tasks 
      SET progress_percentage = COALESCE(progress_percentage, 0)
      WHERE progress_percentage IS NULL
    `);
    
    console.log('Tareas actualizadas:', updateResult);
    
    // Mostrar todas las tareas con su progreso
    const tasks = await db.execute(sql`
      SELECT id, title, status, progress_percentage 
      FROM tasks 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('\nTareas actuales:');
    tasks.rows.forEach((task: any) => {
      console.log(`- ${task.title}: ${task.progress_percentage}%`);
    });
    
    console.log('\n✓ Campo progress_percentage verificado y actualizado');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixProgressField();
