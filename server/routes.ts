import { Router } from 'express';
import * as storage from './storage';
import { insertAreaSchema, insertGoalSchema, insertTaskSchema, insertProgressLogSchema, insertDocumentSchema, insertReportSchema } from '../shared/schema';
import { updateGoalProgress, updateTaskProgressByStatus } from './progressCalculator';

const router = Router();

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
    const data = insertGoalSchema.parse(req.body);
    const result = await storage.createGoal(data);
    res.status(201).json(result[0]);
  } catch (err) {
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
    
    // Actualizar progreso de la tarea basado en su estado
    if (data.status) {
      await updateTaskProgressByStatus(req.params.id, data.status);
    }
    
    const result = await storage.updateTask(req.params.id, data);
    
    // Actualizar progreso de la meta si tiene goal_id
    if (result[0].goal_id) {
      await updateGoalProgress(result[0].goal_id);
    }
    
    res.json(result[0]);
  } catch (err) {
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
    const data = insertProgressLogSchema.parse(req.body);
    const result = await storage.createProgressLog(data);
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.put('/progress-logs/:id', async (req, res) => {
  try {
    const data = insertProgressLogSchema.parse(req.body);
    const result = await storage.updateProgressLog(req.params.id, data);
    res.json(result[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
router.delete('/progress-logs/:id', async (req, res) => {
  try {
    await storage.deleteProgressLog(req.params.id);
    res.status(204).end();
  } catch (err) {
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

export default router;
