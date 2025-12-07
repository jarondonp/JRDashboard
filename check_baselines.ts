
import { db } from './server/db';
import { projectBaselines } from './shared/plannerSchema';
import { eq } from 'drizzle-orm';

async function checkBaselines() {
    console.log("🔍 Checking baselines in DB...");

    // 1. List ALL baselines
    const allBaselines = await db.select().from(projectBaselines);
    console.log(`📊 Total baselines found: ${allBaselines.length}`);
    allBaselines.forEach(b => {
        console.log(` - ID: ${b.id}, ProjectID: ${b.project_id}, Name: ${b.version_name}, Date: ${b.created_at}`);
    });

    // 2. Check specific project
    const targetProject = "b2144de5-59ee-45b9-a183-9511ecc91f78";
    const projectBaselinesFound = await db.select().from(projectBaselines).where(eq(projectBaselines.project_id, targetProject));

    console.log(`\n🎯 Baselines for project ${targetProject}: ${projectBaselinesFound.length}`);

    process.exit(0);
}

checkBaselines().catch(console.error);
