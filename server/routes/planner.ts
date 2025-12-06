import { Router } from 'express';
import { PlanningEngine } from '../services/PlanningEngine';
import { suggestDependencies } from '../services/GeminiDependencySuggester';
import * as storage from '../storage';

const router = Router();

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

// GET /api/planner/plans/:planId
// Obtener un plan específico
router.get('/plans/:planId', async (req, res) => {
    try {
        const plan = await storage.getPlanById(req.params.planId);
        if (plan) {
            res.json(plan);
        } else {
            res.status(404).json({ error: 'Plan not found' });
        }
    } catch (err) {
        console.error('Error loading plan:', err);
        res.status(500).json({ error: 'Error loading plan' });
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

export default router;
