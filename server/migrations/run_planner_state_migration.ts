import { up } from './add_planner_state';
import { db } from '../db';

async function run() {
    console.log('Running migration: add_planner_state...');
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
