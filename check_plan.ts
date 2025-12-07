
import { db } from './server/db';
import { plans } from './shared/plannerSchema';
import { eq } from 'drizzle-orm';

async function checkPlan() {
    const planId = "6d632547-d6d1-4b3d-85d5-f1916b89c5df";
    console.log(`🔍 Checking Plan ID: ${planId}`);

    const result = await db.select().from(plans).where(eq(plans.id, planId));

    if (result.length === 0) {
        console.log("❌ Plan not found");
        return;
    }

    const plan = result[0];
    console.log(`✅ Plan Found: ${plan.name}`);
    console.log(`   - Project ID (column): ${plan.project_id}`);
    console.log(`   - State Data Project ID: ${(plan.state_data as any)?.project_id}`);

    process.exit(0);
}

checkPlan().catch(console.error);
