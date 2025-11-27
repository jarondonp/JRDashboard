import { db } from './db';
import { desc, eq } from 'drizzle-orm';
import { goals, tasks, progress_logs } from '../shared/schema';

/**
 * Calcula el progreso de una meta basado en sus tareas
 * @param goalId - ID de la meta
 * @returns Porcentaje de progreso (0-100)
 */
export async function calculateGoalProgress(goalId: string): Promise<number> {
  console.log('=== calculateGoalProgress for goal:', goalId);
  // Obtener todas las tareas de esta meta
  const goalTasks = await db.select().from(tasks).where(eq(tasks.goal_id, goalId));
  console.log('Found tasks:', goalTasks.length);

  if (goalTasks.length === 0) {
    console.log('No tasks found, returning 0');
    return 0;
  }

  // Calcular progreso promedio de todas las tareas
  const totalProgress = goalTasks.reduce((sum, task) => {
    console.log(`Task ${task.title}: ${task.progress_percentage}%`);
    return sum + (task.progress_percentage || 0);
  }, 0);

  const averageProgress = Math.round(totalProgress / goalTasks.length);
  console.log('Average progress:', averageProgress);

  return averageProgress;
}

/**
 * Actualiza el computed_progress de una meta basado en sus tareas
 * @param goalId - ID de la meta
 */
export async function updateGoalProgress(goalId: string): Promise<void> {
  console.log('=== updateGoalProgress called for goal:', goalId);
  const existingGoal = await db.select().from(goals).where(eq(goals.id, goalId)).limit(1);
  if (!existingGoal.length) {
    console.warn('Goal not found for progress update:', goalId);
    return;
  }
  const progress = await calculateGoalProgress(goalId);
  console.log('Calculated progress:', progress);

  const updates: Partial<typeof goals.$inferUpdate> = {
    computed_progress: progress,
    updated_at: new Date(),
  };

  const goalRecord = existingGoal[0];
  const shouldComplete = progress >= 100;

  if (shouldComplete && goalRecord.status !== 'completada') {
    updates.status = 'completada';
  } else if (!shouldComplete && goalRecord.status === 'completada') {
    updates.status = progress === 0 ? 'no_iniciada' : 'en_progreso';
  }

  const result = await db
    .update(goals)
    .set(updates)
    .where(eq(goals.id, goalId))
    .returning();

  console.log('Goal updated:', result[0]);
}

/**
 * Actualiza el progreso de todas las metas
 */
export async function updateAllGoalsProgress(): Promise<void> {
  const allGoals = await db.select().from(goals);

  for (const goal of allGoals) {
    await updateGoalProgress(goal.id);
  }
}

/**
 * Actualiza automáticamente el progreso de una tarea basado en su estado
 * @param taskId - ID de la tarea
 * @param status - Nuevo estado de la tarea
 */
export async function updateTaskProgressByStatus(taskId: string, status: string): Promise<void> {
  let progress = 0;

  // Asignar progreso automático basado en el estado
  if (status === 'completada' || status === 'completed') {
    progress = 100;
  } else if (status === 'en_progreso' || status === 'in_progress') {
    // Mantener el progreso actual o establecer 50% si no está definido
    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (task.length > 0 && task[0].progress_percentage) {
      progress = task[0].progress_percentage;
    } else {
      progress = 50;
    }
  } else {
    progress = 0;
  }

  await db
    .update(tasks)
    .set({ progress_percentage: progress })
    .where(eq(tasks.id, taskId));

  // Obtener el goal_id de la tarea para actualizar el progreso de la meta
  const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (task.length > 0 && task[0].goal_id) {
    await updateGoalProgress(task[0].goal_id);
  }
}

/**
 * Recalcula el progreso de una tarea basado en los progress_logs registrados
 * @param taskId - ID de la tarea
 */
export async function recalculateTaskProgress(taskId: string): Promise<void> {
  console.log('=== recalculateTaskProgress called for task:', taskId);

  const logs = await db
    .select({
      task_progress: progress_logs.task_progress,
      date: progress_logs.date,
      created_at: progress_logs.created_at,
    })
    .from(progress_logs)
    .where(eq(progress_logs.task_id, taskId))
    .orderBy(desc(progress_logs.date), desc(progress_logs.created_at));

  const latestWithProgress = logs.find(
    (log) => log.task_progress !== null && log.task_progress !== undefined,
  );

  const computedProgress =
    latestWithProgress && latestWithProgress.task_progress !== undefined && latestWithProgress.task_progress !== null
      ? latestWithProgress.task_progress
      : 0;

  const updatedTask = await db
    .update(tasks)
    .set({
      progress_percentage: computedProgress,
      updated_at: new Date(),
    })
    .where(eq(tasks.id, taskId))
    .returning({ goal_id: tasks.goal_id });

  const goalId = updatedTask[0]?.goal_id;
  if (goalId) {
    await updateGoalProgress(goalId);
  }
}
