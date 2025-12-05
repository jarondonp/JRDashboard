/**
 * Debug script to check which tasks belong to which project
 */

import { db } from '../db';
import { tasks, projects } from '../../shared/schema';
import { eq } from 'drizzle-orm';

async function debugProjectTasks() {
    try {
        console.log('🔍 Debugging Project Tasks...\n');

        // Get all projects
        const allProjects = await db.select().from(projects);

        for (const project of allProjects) {
            console.log(`\n📁 Project: ${project.title} (ID: ${project.id})`);

            // Get tasks for this project
            const projectTasks = await db.select()
                .from(tasks)
                .where(eq(tasks.project_id, project.id));

            console.log(`   Tasks: ${projectTasks.length}`);

            if (projectTasks.length > 0) {
                projectTasks.slice(0, 3).forEach((task, idx) => {
                    console.log(`   ${idx + 1}. ${task.title} (ID: ${task.id.substring(0, 8)}...)`);
                });
                if (projectTasks.length > 3) {
                    console.log(`   ... and ${projectTasks.length - 3} more`);
                }
            }
        }

        console.log('\n✅ Debug complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugProjectTasks();
