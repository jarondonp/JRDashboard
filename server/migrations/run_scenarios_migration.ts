import { up } from './update_planner_scenarios';
import { db } from '../db';

async function run() {
    console.log('Running migration: update_planner_scenarios...');
    try {
        await up();
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
