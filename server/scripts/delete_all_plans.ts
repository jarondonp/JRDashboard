/**
 * Script to delete all planner plans - CAUTION: This is irreversible!
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';

async function deleteAllPlans() {
    try {
        console.log('⚠️  Deleting all planner plans...');

        // Use raw SQL to delete all plans from correct table name
        await db.execute(sql`DELETE FROM project_planner_state`);

        console.log('✅ All planner plans deleted successfully!');
        console.log('   You can now start fresh with new plans.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error deleting plans:', error);
        process.exit(1);
    }
}

deleteAllPlans();
