
import { PlanningEngine, PlannerTask } from '../services/PlanningEngine';

const mockTasks: PlannerTask[] = [
    {
        id: '1',
        title: 'Task 1',
        dependencies: [],
        estimated_duration: 120 // 2 hours
    },
    {
        id: '2',
        title: 'Task 2 (Depends on 1)',
        dependencies: ['1'],
        estimated_duration: 240 // 4 hours
    },
    {
        id: '3',
        title: 'Task 3 (Depends on 2)',
        dependencies: ['2'],
        estimated_duration: 60 // 1 hour
    },
    {
        id: '4',
        title: 'Task 4 (Independent)',
        dependencies: [],
        estimated_duration: 480 // 8 hours (1 day)
    }
];

const startDate = new Date('2025-01-01T09:00:00Z'); // Wednesday

console.log('🧪 Testing PlanningEngine.calculateSchedule...');
console.log('📅 Project Start:', startDate.toISOString());

try {
    const result = PlanningEngine.calculateSchedule(mockTasks, startDate);

    console.log('\n✅ Schedule Calculated Successfully!');
    console.log('-----------------------------------');

    result.tasks.forEach(t => {
        console.log(`[${t.id}] ${t.title}`);
        console.log(`   Start: ${t.start_date}`);
        console.log(`   Due:   ${t.due_date}`);
        console.log(`   Deps:  ${t.dependencies.join(', ') || 'None'}`);
    });

    console.log('\n🔥 Critical Path:', result.critical_path.join(' -> '));

    if (result.warnings.length > 0) {
        console.log('\n⚠️ Warnings:', result.warnings);
    }

    if (result.suggestions.length > 0) {
        console.log('\n💡 Suggestions:', result.suggestions);
    }

} catch (error) {
    console.error('❌ Error calculating schedule:', error);
}
