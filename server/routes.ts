import { Router } from 'express';
import { ZodError, type z } from 'zod';
import * as storage from './storage';
import { insertAreaSchema, insertGoalSchema, insertTaskSchema, insertProgressLogSchema, insertDocumentSchema, insertReportSchema } from '../shared/schema';
import { updateGoalProgress, updateTaskProgressByStatus, recalculateTaskProgress } from './progressCalculator';

const router = Router();

type ProgressLogPayload = z.infer<typeof insertProgressLogSchema>;

class ProgressLogValidationError extends Error {}

const sanitizeId = (value?: string | null): string | undefined => {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeProgressLogInput = async (data: ProgressLogPayload) => {
  const area = await storage.getAreaById(data.area_id);
  if (!area.length) {
    throw new ProgressLogValidationError('Área no encontrada.');
  }

  let goalId = sanitizeId(data.goal_id);
  let taskId = sanitizeId(data.task_id);

  if (goalId) {
    const goal = await storage.getGoalById(goalId);
    if (!goal.length) {
      throw new ProgressLogValidationError('La meta indicada no existe.');
    }
    if (goal[0].area_id !== data.area_id) {
      throw new ProgressLogValidationError('La meta indicada no pertenece al área seleccionada.');
    }
  }

  if (taskId) {
    const task = await storage.getTaskById(taskId);
    if (!task.length) {
      throw new ProgressLogValidationError('La tarea indicada no existe.');
    }
    if (task[0].area_id !== data.area_id) {
      throw new ProgressLogValidationError('La tarea indicada no pertenece al área seleccionada.');
    }
    if (goalId && task[0].goal_id && task[0].goal_id !== goalId) {
      throw new ProgressLogValidationError('La tarea indicada no pertenece a la meta seleccionada.');
    }
    if (!goalId && task[0].goal_id) {
      goalId = task[0].goal_id;
    }
  }

  if (data.task_progress !== undefined && data.task_progress !== null && !taskId) {
    throw new ProgressLogValidationError('Debe seleccionar una tarea para registrar progreso.');
  }

  const taskProgress =
    data.task_progress !== undefined && data.task_progress !== null
      ? Math.max(0, Math.min(100, Math.round(data.task_progress)))
      : undefined;

  return {
    ...data,
    goal_id: goalId ?? null,
    task_id: taskId ?? null,
    task_progress: taskProgress,
  };
};

const timelineQuerySchema = z.object({
  pageSize: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  areaId: z.string().optional(),
  eventType: z.union([z.array(z.string()), z.string()]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const globalSearchQuerySchema = z.object({
  q: z.string().min(1, 'Debe ingresar un término de búsqueda'),
  limit: z.coerce.number().min(1).max(20).optional(),
});

// Areas
router.get('/areas', async (req, res) => {
  try {
    const result = await storage.getAreas();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching areas' });
  }
});
router.get('/areas/:id', async (req, res) => {
  try {
    const result = await storage.getAreaById(req.params.id);
    if (!result.length) return res.status(404).json({ error: 'Area not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching area' });
  }
});
router.post('/areas', async (req, res) => {
  try {
    const data = insertAreaSchema.parse(req.body);
    const result = await storage.createArea(data);
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.put('/areas/:id', async (req, res) => {
  try {
    const data = insertAreaSchema.parse(req.body);
    const result = await storage.updateArea(req.params.id, data);
    res.json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete('/areas/:id', async (req, res) => {
  try {
    await storage.deleteArea(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Goals
router.get('/goals', async (req, res) => {
  try {
    const result = await storage.getGoals();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching goals' });
  }
});
router.get('/goals/:id', async (req, res) => {
  try {
    const result = await storage.getGoalById(req.params.id);
    if (!result.length) return res.status(404).json({ error: 'Goal not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching goal' });
  }
});
router.post('/goals', async (req, res) => {
  try {
    console.log('POST /goals - Raw body:', req.body);
    const data = insertGoalSchema.parse(req.body);
    console.log('POST /goals - Parsed data:', data);
    const result = await storage.createGoal(data);
    console.log('POST /goals - Result:', result);
    res.status(201).json(result[0]);
  } catch (err) {
    console.error('POST /goals - Error:', err);
    res.status(400).json({ error: err.message });
  }
});
router.put('/goals/:id', async (req, res) => {
  try {
    const data = insertGoalSchema.parse(req.body);
    const result = await storage.updateGoal(req.params.id, data);
    res.json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete('/goals/:id', async (req, res) => {
  try {
    await storage.deleteGoal(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tasks
router.get('/tasks', async (req, res) => {
  try {
    const result = await storage.getTasks();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});
router.get('/tasks/:id', async (req, res) => {
  try {
    const result = await storage.getTaskById(req.params.id);
    if (!result.length) return res.status(404).json({ error: 'Task not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching task' });
  }
});
router.post('/tasks', async (req, res) => {
  try {
    const data = insertTaskSchema.parse(req.body);
    const result = await storage.createTask(data);
    
    // Actualizar progreso automáticamente si tiene goal_id
    if (result[0].goal_id) {
      await updateGoalProgress(result[0].goal_id);
    }
    
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.put('/tasks/:id', async (req, res) => {
  try {
    const data = insertTaskSchema.parse(req.body);
    console.log('Updating task:', req.params.id, 'with data:', data);
    
    // Primero actualizar la tarea con los datos del formulario
    const result = await storage.updateTask(req.params.id, data);
    console.log('Task updated:', result[0]);
    
    // Actualizar progreso de la meta si tiene goal_id
    if (result[0].goal_id) {
      console.log('Updating goal progress for:', result[0].goal_id);
      await updateGoalProgress(result[0].goal_id);
    }
    
    res.json(result[0]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(400).json({ error: err.message });
  }
});
router.delete('/tasks/:id', async (req, res) => {
  try {
    // Obtener la tarea antes de eliminarla para saber su goal_id
    const task = await storage.getTaskById(req.params.id);
    const goalId = task[0]?.goal_id;
    
    await storage.deleteTask(req.params.id);
    
    // Recalcular progreso de la meta si tenía goal_id
    if (goalId) {
      await updateGoalProgress(goalId);
    }
    
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Progress Logs
router.get('/progress-logs', async (req, res) => {
  try {
    const result = await storage.getProgressLogs();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching progress logs' });
  }
});
router.get('/progress-logs/:id', async (req, res) => {
  try {
    const result = await storage.getProgressLogById(req.params.id);
    if (!result.length) return res.status(404).json({ error: 'Progress log not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching progress log' });
  }
});
router.post('/progress-logs', async (req, res) => {
  try {
    const payload = insertProgressLogSchema.parse(req.body);
    const normalized = await normalizeProgressLogInput(payload);
    const result = await storage.createProgressLog(normalized);
    const createdLog = result[0];

    if (createdLog?.task_id) {
      await recalculateTaskProgress(createdLog.task_id);
    }

    res.status(201).json(createdLog);
  } catch (err) {
    if (err instanceof ProgressLogValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors?.[0]?.message || 'Datos inválidos' });
    }
    console.error('Error creating progress log:', err);
    res.status(500).json({ error: 'Error creating progress log' });
  }
});
router.put('/progress-logs/:id', async (req, res) => {
  try {
    const existing = await storage.getProgressLogById(req.params.id);
    if (!existing.length) {
      return res.status(404).json({ error: 'Progress log not found' });
    }

    const payload = insertProgressLogSchema.parse(req.body);
    const normalized = await normalizeProgressLogInput(payload);
    const result = await storage.updateProgressLog(req.params.id, normalized);
    const updatedLog = result[0];

    const taskIdsToRecalculate = new Set<string>();
    const previousTaskId = sanitizeId(existing[0].task_id as string | null | undefined);
    if (previousTaskId) taskIdsToRecalculate.add(previousTaskId);
    const newTaskId = sanitizeId(updatedLog?.task_id as string | null | undefined);
    if (newTaskId) taskIdsToRecalculate.add(newTaskId);

    for (const taskId of taskIdsToRecalculate) {
      await recalculateTaskProgress(taskId);
    }

    res.json(updatedLog);
  } catch (err) {
    if (err instanceof ProgressLogValidationError) {
      return res.status(400).json({ error: err.message });
    }
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors?.[0]?.message || 'Datos inválidos' });
    }
    console.error('Error updating progress log:', err);
    res.status(500).json({ error: 'Error updating progress log' });
  }
});
router.delete('/progress-logs/:id', async (req, res) => {
  try {
    const existing = await storage.getProgressLogById(req.params.id);
    if (!existing.length) {
      return res.status(404).json({ error: 'Progress log not found' });
    }

    const previousTaskId = sanitizeId(existing[0].task_id as string | null | undefined);

    await storage.deleteProgressLog(req.params.id);

    if (previousTaskId) {
      await recalculateTaskProgress(previousTaskId);
    }

    res.status(204).end();
  } catch (err) {
    console.error('Error deleting progress log:', err);
    res.status(500).json({ error: err.message });
  }
});

// Documents
router.get('/documents', async (req, res) => {
  try {
    const result = await storage.getDocuments();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching documents' });
  }
});
router.get('/documents/:id', async (req, res) => {
  try {
    const result = await storage.getDocumentById(req.params.id);
    if (!result.length) return res.status(404).json({ error: 'Document not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching document' });
  }
});
router.post('/documents', async (req, res) => {
  try {
    const data = insertDocumentSchema.parse(req.body);
    const result = await storage.createDocument(data);
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.put('/documents/:id', async (req, res) => {
  try {
    const data = insertDocumentSchema.parse(req.body);
    const result = await storage.updateDocument(req.params.id, data);
    res.json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete('/documents/:id', async (req, res) => {
  try {
    await storage.deleteDocument(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q, limit } = globalSearchQuerySchema.parse(req.query);
    const result = await storage.globalSearch(q, limit);
    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors?.[0]?.message || 'Consulta inválida' });
    }
    console.error('Error ejecutando búsqueda global:', err);
    res.status(500).json({ error: 'Error ejecutando búsqueda global' });
  }
});

router.get('/timeline', async (req, res) => {
  try {
    const parsed = timelineQuerySchema.parse(req.query);
    const rawEventType = parsed.eventType;
    let eventTypes: storage.TimelineEventType[] | undefined;

    if (rawEventType) {
      const allowedTypes = new Set(storage.TIMELINE_EVENT_TYPES);
      const values = Array.isArray(rawEventType) ? rawEventType : [rawEventType];
      eventTypes = values
        .map((value) => value.toLowerCase().trim())
        .filter((value): value is storage.TimelineEventType => allowedTypes.has(value as storage.TimelineEventType));

      if (eventTypes.length === 0) {
        return res.status(400).json({
          error: `eventType debe ser alguno de: ${storage.TIMELINE_EVENT_TYPES.join(', ')}`,
        });
      }
    }

    const fromDate = parsed.from ? new Date(parsed.from) : undefined;
    if (fromDate && Number.isNaN(fromDate.getTime())) {
      return res.status(400).json({ error: 'Parámetro "from" inválido' });
    }

    const toDate = parsed.to ? new Date(parsed.to) : undefined;
    if (toDate && Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Parámetro "to" inválido' });
    }

    const trimmedAreaId = parsed.areaId?.trim();
    const areaFilter = trimmedAreaId && trimmedAreaId.length > 0 ? trimmedAreaId : undefined;

    if (fromDate && toDate && fromDate > toDate) {
      return res.status(400).json({ error: 'El parámetro "from" no puede ser mayor que "to"' });
    }

    const result = await storage.getTimelineEvents({
      limit: parsed.pageSize,
      cursor: parsed.cursor,
      areaId: areaFilter,
      eventTypes,
      from: fromDate,
      to: toDate,
    });

    res.json(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error fetching timeline:', err);
    res.status(500).json({ error: 'Error fetching timeline' });
  }
});

// Reports
router.get('/reports', async (req, res) => {
  try {
    const result = await storage.getReports();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching reports' });
  }
});
router.get('/reports/:id', async (req, res) => {
  try {
    const result = await storage.getReportById(req.params.id);
    if (!result.length) return res.status(404).json({ error: 'Report not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching report' });
  }
});
router.post('/reports', async (req, res) => {
  try {
    const data = insertReportSchema.parse(req.body);
    const result = await storage.createReport(data);
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.put('/reports/:id', async (req, res) => {
  try {
    const data = insertReportSchema.parse(req.body);
    const result = await storage.updateReport(req.params.id, data);
    res.json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete('/reports/:id', async (req, res) => {
  try {
    await storage.deleteReport(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Area Specialized Dashboards (Phase 10)
router.get('/areas/:areaId/dashboard', async (req, res) => {
  try {
    const result = await storage.getAreaDashboard(req.params.areaId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching area dashboard' });
  }
});

router.get('/areas/:areaId/goals', async (req, res) => {
  try {
    const result = await storage.getAreaGoals(req.params.areaId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching area goals' });
  }
});

router.get('/areas/:areaId/tasks', async (req, res) => {
  try {
    const result = await storage.getAreaTasks(req.params.areaId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching area tasks' });
  }
});

router.get('/areas/:areaId/progress', async (req, res) => {
  try {
    const result = await storage.getAreaProgress(req.params.areaId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching area progress' });
  }
});

router.get('/areas/:areaId/metrics', async (req, res) => {
  try {
    const result = await storage.getAreaMetrics(req.params.areaId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching area metrics' });
  }
});

export default router;
