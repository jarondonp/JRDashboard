import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';

import { areas, goals, tasks } from '../shared/schema';
import { db } from './db';
import { areasSeed, goalsSeed, tasksSeed } from './data/personalPlan';

async function main() {
  console.log('⏳ Iniciando limpieza y seed de datos personales...');

  try {
    await db.transaction(async (tx) => {
      console.log('🧹 Limpiando tablas relacionadas...');
      await tx.execute(
        sql`TRUNCATE TABLE progress_logs, documents, reports, tasks, goals, areas RESTART IDENTITY CASCADE;`,
      );

      const areaIdByKey = new Map<string, string>();
      const areaRecords = areasSeed.map((area) => {
        const id = randomUUID();
        areaIdByKey.set(area.key, id);
        return {
          id,
          name: area.name,
          type: area.type,
          color: area.color,
          icon: area.icon,
          description: area.description,
        };
      });

      console.log(`➕ Insertando ${areaRecords.length} áreas...`);
      await tx.insert(areas).values(areaRecords);

      const goalIdByKey = new Map<string, string>();
      const goalRecords = goalsSeed.map((goal) => {
        const areaId = areaIdByKey.get(goal.areaKey);
        if (!areaId) {
          throw new Error(`No se encontró área para la meta ${goal.key}`);
        }
        const id = randomUUID();
        goalIdByKey.set(goal.key, id);

        return {
          id,
          area_id: areaId,
          title: goal.title,
          description: goal.description ?? null,
          goal_type: goal.goalType ?? null,
          start_date: goal.startDate ?? null,
          due_date: goal.dueDate ?? null,
          status: goal.status,
          priority: goal.priority,
          expected_outcome: goal.expectedOutcome ?? null,
          computed_progress: null,
        };
      });

      console.log(`➕ Insertando ${goalRecords.length} metas...`);
      await tx.insert(goals).values(goalRecords);

      const taskRecords = tasksSeed.map((task) => {
        const areaId = areaIdByKey.get(task.areaKey);
        const goalId = goalIdByKey.get(task.goalKey);
        if (!areaId || !goalId) {
          throw new Error(`No se encontró área/meta para la tarea ${task.key}`);
        }

        const progress =
          task.status === 'completada' ? 100 : task.status === 'en_progreso' ? 35 : 0;

        return {
          id: randomUUID(),
          area_id: areaId,
          goal_id: goalId,
          title: task.title,
          description: task.description ?? null,
          status: task.status,
          due_date: task.dueDate ?? null,
          estimated_effort: task.estimatedEffort ?? null,
          progress_percentage: progress,
          tags: task.tags ?? [],
        };
      });

      console.log(`➕ Insertando ${taskRecords.length} tareas...`);
      await tx.insert(tasks).values(taskRecords);

      console.log('✅ Seed personal completado con éxito.');
    });
  } catch (error) {
    console.error('❌ Error durante el seed personalizado:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();

