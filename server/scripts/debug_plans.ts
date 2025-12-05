
import { db } from "../db";
import { projects, plans } from "../db/schema";
import { eq } from "drizzle-orm";

async function checkProjectsAndPlans() {
    console.log("🔍 Checking Projects and Plans...");

    const allProjects = await db.select().from(projects);
    console.log(`Found ${allProjects.length} projects.`);

    for (const p of allProjects) {
        console.log(`\nProject: ${p.title} (ID: ${p.id})`);

        const projectPlans = await db.select().from(plans).where(eq(plans.project_id, p.id));
        console.log(`  - Plans: ${projectPlans.length}`);

        projectPlans.forEach(plan => {
            console.log(`    * Plan: "${plan.name}" (ID: ${plan.id}) - Phase: ${plan.phase}`);
        });
    }
    process.exit(0);
}

checkProjectsAndPlans();
