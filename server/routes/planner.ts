import { Router } from 'express';
import { PlanningEngine } from '../services/PlanningEngine';
import { suggestDependencies } from '../services/GeminiDependencySuggester';
import * as storage from '../storage';
import { analyzeDeviation } from '../services/AnalysisService';
import { sql } from 'drizzle-orm';
import { db } from '../db';

const router = Router();

// DEBUG ROUTE
router.get('/debug-hello', (req, res) => {
    console.log('🔍 [API] Debug Hello Hit');
    res.json({ message: 'Hello from Planner Routes' });
});

// GET /api/planner/project-baselines/:projectId
// Listar líneas base de un proyecto
router.get('/project-baselines/:projectId', async (req, res) => {
    console.log('🔍 [API] Route hit: GET /baselines/:projectId with param:', req.params.projectId);
    try {
        const baselines = await storage.getBaselinesByProject(req.params.projectId);
        console.log(`✅ [API] Found ${baselines.length} baselines for project ${req.params.projectId}`);
        res.json(baselines);
    } catch (err) {
        console.error('Error loading baselines:', err);
        res.status(500).json({ error: 'Error loading baselines' });
    }
});

// GET /api/planner/projects/:projectId/plans
// Listar todos los planes de un proyecto
router.get('/projects/:projectId/plans', async (req, res) => {
    try {
        const plans = await storage.getProjectPlans(req.params.projectId);
        res.json(plans);
    } catch (err) {
        console.error('Error loading project plans:', err);
        res.status(500).json({ error: 'Error loading plans' });
    }
});

// POST /api/planner/plans
// Crear un nuevo plan
router.post('/plans', async (req, res) => {
    try {
        const { project_id, name, description, phase, stateData } = req.body;
        const newPlan = await storage.createPlan(project_id, name, description, phase, stateData);
        res.json(newPlan[0]);
    } catch (err) {
        console.error('Error creating plan:', err);
        res.status(500).json({ error: 'Error creating plan' });
    }
});


// GET /api/planner/plans/:planId
// Obtener detalles de un plan
router.get('/plans/:planId', async (req, res) => {
    try {
        const plan = await storage.getPlanById(req.params.planId);
        if (!plan) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        res.json(plan);
    } catch (err) {
        console.error('Error loading plan:', err);
        res.status(500).json({ error: 'Error loading plan' });
    }
});

// PUT /api/planner/plans/:planId
// Actualizar un plan existente
router.put('/plans/:planId', async (req, res) => {
    try {
        const { phase, stateData } = req.body;
        await storage.updatePlan(req.params.planId, phase, stateData);
        res.json({ success: true });
    } catch (err) {
        console.error('Error updating plan:', err);
        res.status(500).json({ error: 'Error updating plan' });
    }
});

// GET /api/planner/plans/:planId/deltas
// Obtener tareas nuevas que no están en el plan
router.get('/plans/:planId/deltas', async (req, res) => {
    try {
        const newTasks = await storage.getPlanDeltas(req.params.planId);
        res.json(newTasks);
    } catch (err) {
        console.error('Error getting plan deltas:', err);
        res.status(500).json({ error: 'Error getting plan deltas' });
    }
});

// GET /api/planner/plans/:planId/sync-data
// Obtener datos completos de sincronización (nuevas y actualizaciones)
router.get('/plans/:planId/sync-data', async (req, res) => {
    try {
        const planId = req.params.planId;
        // 1. Get new tasks (deltas)
        const newTasks = await storage.getPlanDeltas(planId);

        // 2. Get all current project tasks to compare updates
        const plan = await storage.getPlanById(planId);
        if (!plan) return res.status(404).json({ error: 'Plan not found' });

        const allProjectTasks = await storage.getTasksByProject(plan.project_id);

        // Filter tasks that ARE in the plan (by ID) to check for status updates
        // We will return ALL project tasks that are already in the plan so frontend can diff them.
        // Optimally, we could diff here, but frontend has the "Draft" state which might be different from DB.
        // So we just return the "Source of Truth" (allProjectTasks) and let frontend decide what to update.
        // But to save bandwidth, let's filter only those that match IDs present in the plan?
        // Actually, returning allProjectTasks is easiest and covers both cases if we wanted to.
        // But let's separate:
        // - newTasks: Tasks NOT in plan.
        // - existingTasks: Tasks in plan (matches ID).

        const planState = plan.state_data as any;
        const planTaskIds = new Set((planState.tasks || []).map((t: any) => t.id));

        const existingTasksUpdates = allProjectTasks.filter(t => planTaskIds.has(t.id));

        res.json({
            newTasks,
            existingTasksUpdates
        });

    } catch (err) {
        console.error('Error getting sync data:', err);
        res.status(500).json({ error: 'Error getting sync data' });
    }
});

// DELETE /api/planner/plans/:planId
// Eliminar un plan
router.delete('/plans/:planId', async (req, res) => {
    try {
        await storage.deletePlan(req.params.planId);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting plan:', err);
        res.status(500).json({ error: 'Error deleting plan' });
    }
});

// GET /api/planner/projects/:projectId/goals
// Listar metas de un proyecto para selección de alcance
router.get('/projects/:projectId/goals', async (req, res) => {
    try {
        const goals = await storage.getGoalsByProject(req.params.projectId);
        res.json(goals);
    } catch (err) {
        console.error('Error loading project goals:', err);
        res.status(500).json({ error: 'Error loading goals' });
    }
});

// GET /api/planner/projects/:projectId/tasks
// Cargar tareas de un proyecto para planificar
router.get('/projects/:projectId/tasks', async (req, res) => {
    try {
        const tasks = await storage.getTasksByProject(req.params.projectId);
        res.json(tasks);
    } catch (err) {
        console.error('Error loading tasks:', err);
        res.status(500).json({ error: 'Error loading tasks' });
    }
});

// POST /api/planner/suggest-dependencies
// Obtener sugerencias inteligentes de dependencias usando OpenAI
router.post('/suggest-dependencies', async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!tasks || !Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Tasks array is required' });
        }

        const suggestions = await suggestDependencies(tasks);
        res.json({ suggestions });
    } catch (err) {
        console.error('Error getting dependency suggestions:', err);
        res.status(500).json({ error: 'Error getting suggestions' });
    }
});

// POST /api/planner/generate
// Generar plan optimizado
router.post('/generate', async (req, res) => {
    try {
        const { tasks, project_start_date } = req.body;
        const result = PlanningEngine.calculateSchedule(tasks, new Date(project_start_date));
        res.json(result);
    } catch (err) {
        console.error('Error generating plan:', err);
        res.status(500).json({ error: 'Error generating plan' });
    }
});

// POST /api/planner/apply
// Aplicar plan a las tareas reales
router.post('/apply', async (req, res) => {
    try {
        const { project_id, tasks: plannedTasks, create_baseline, baseline_name } = req.body;

        if (!project_id || !plannedTasks) {
            return res.status(400).json({ error: 'Missing project_id or tasks' });
        }

        console.log(`🚀 [API] Applying plan for project ${project_id}. Create Baseline: ${create_baseline}`);

        // 1. Create Baseline (Snapshot) if requested
        // 1. Create Baseline (Snapshot) if requested
        if (create_baseline) {
            const currentTasks = await storage.getTasksByProject(project_id);
            console.log(`📸 [API] Creating baseline with ${currentTasks.length} existing tasks`);

            const [baseline] = await storage.createProjectBaseline({
                project_id,
                version_name: baseline_name || `Baseline - ${new Date().toLocaleDateString()}`,
                created_by: 'System' // TODO: Get from auth
            });

            if (baseline) {
                const snapshotData = currentTasks.map(t => ({
                    baseline_id: baseline.id,
                    task_id: t.id,
                    original_start_date: t.start_date,
                    original_due_date: t.due_date,
                    original_priority: t.calculated_priority || t.status, // Fallback if no calculated priority
                    original_status: t.status,
                    original_impact: t.impact,
                    original_effort: t.effort,
                    original_dependencies: t.dependencies,
                    snapshot_data: t
                }));

                if (snapshotData.length > 0) {
                    await storage.createBaselineTasks(snapshotData);
                }
                console.log(`✅ [API] Baseline "${baseline.version_name}" created successfully`);
            }
        }

        // 2. Update Tasks
        console.log(`📝 [API] Updating ${plannedTasks.length} tasks with new plan data`);
        let updatedCount = 0;
        for (const task of plannedTasks) {
            await storage.updateTask(task.id, {
                start_date: task.start_date,
                due_date: task.due_date,
                impact: task.impact,
                effort: task.effort,
                calculated_priority: task.calculated_priority,
                estimated_duration: task.estimated_duration,
                dependencies: task.dependencies
            });
            updatedCount++;
        }

        res.json({ success: true, updated_count: updatedCount });
    } catch (err) {
        console.error('Error applying plan:', err);
        res.status(500).json({ error: 'Error applying plan' });
    }
});


// GET /api/planner/baselines/:projectId
// Listar líneas base de un proyecto
// Route moved to top

// GET /api/planner/baselines/:baselineId/compare
// Comparar línea base con estado actual
router.get('/baselines/:baselineId/compare', async (req, res) => {
    try {
        const baselineTasks = await storage.getBaselineTasks(req.params.baselineId);
        const projectId = req.query.projectId as string;

        if (!projectId) {
            return res.status(400).json({ error: 'projectId query param required' });
        }

        const currentTasks = await storage.getTasksByProject(projectId);

        if (baselineTasks.length === 0) {
            return res.json({ comparison: [], meta: { total_current: currentTasks.length, total_baseline: 0, deleted: 0 } });
        }

        // Comparison Logic
        const comparison = currentTasks.map(current => {
            const baseline = baselineTasks.find(b => b.task_id === current.id);
            if (!baseline) return { ...current, _status: 'new' }; // New task added after baseline

            // Calculate delay
            const currentStart = current.start_date ? new Date(current.start_date).getTime() : 0;
            const baselineStart = baseline.original_start_date ? new Date(baseline.original_start_date).getTime() : 0;

            let delayDays = 0;
            if (currentStart && baselineStart) {
                const diffTime = currentStart - baselineStart;
                delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
                ...current,
                baseline_start: baseline.original_start_date,
                baseline_end: baseline.original_due_date,
                delay_days: delayDays,
                _status: 'existing'
            };
        });

        // Identify deleted tasks (in baseline but not in current)
        const deletedTasks = baselineTasks.filter(b => !currentTasks.find(c => c.id === b.task_id))
            .map(b => ({
                id: b.task_id,
                title: (b.snapshot_data as any)?.title || 'Tarea Eliminada',
                baseline_start: b.original_start_date,
                baseline_end: b.original_due_date,
                _status: 'deleted'
            }));

        res.json({
            comparison: [...comparison, ...deletedTasks],
            meta: {
                total_current: currentTasks.length,
                total_baseline: baselineTasks.length,
                deleted: deletedTasks.length
            }
        });

    } catch (err) {
        console.error('Error comparing baseline:', err);
        res.status(500).json({ error: 'Error comparing baseline' });
    }
});

// ... (removed import)

// POST /api/planner/analyze
// Analizar desviaciones con IA
router.post('/analyze', async (req, res) => {
    try {
        const { projectTitle, baselineTasks, currentTasks } = req.body;

        if (!projectTitle || !currentTasks) {
            return res.status(400).json({ error: 'Missing analysis data' });
        }

        const analysis = await analyzeDeviation({
            projectTitle,
            baselineTasks: baselineTasks || [],
            currentTasks
        });

        res.json(analysis);
    } catch (err) {
        console.error('Error in analyze endpoint:', err);
        res.status(500).json({ error: 'Error analyzing plan' });
    }
});

export default router;
