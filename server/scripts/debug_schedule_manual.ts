
import { PlanningEngine, PlannerTask } from '../services/PlanningEngine';

const tasks: PlannerTask[] = [
    {
        id: '1',
        title: 'Task A',
        dependencies: [],
        estimated_duration: 60, // 1 hour
        start_date: '2025-12-04'
    },
    {
        id: '2',
        title: 'Task B (Dependent)',
        dependencies: ['1'],
        estimated_duration: 60,
        start_date: '2025-12-10' // Manual override (later than calculated Dec 5)
    }
];

const projectStartDate = new Date('2025-12-04');

console.log('Running Schedule Calculation...');
const result = PlanningEngine.calculateSchedule(tasks, projectStartDate);

console.log('--- Result ---');
result.tasks.forEach(t => {
    console.log(`Task ${t.title}: Start ${t.start_date}, Due ${t.due_date}`);
});

const taskB = result.tasks.find(t => t.id === '2');
if (taskB?.start_date === '2025-12-10') {
    console.log('SUCCESS: Manual start date respected.');
} else {
    console.log('FAILURE: Manual start date ignored.');
}
