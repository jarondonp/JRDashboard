import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '../db';

async function main() {
  const goalStatuses = await db.execute(sql`
    SELECT unnest(enum_range(NULL::goal_status)) AS value;
  `);
  const taskStatuses = await db.execute(sql`
    SELECT unnest(enum_range(NULL::task_status)) AS value;
  `);
  const goalPriorities = await db.execute(sql`
    SELECT unnest(enum_range(NULL::goal_priority)) AS value;
  `);

  const project = (result: any) => result.rows.map((row: any) => row.value);

  console.log('goal_status:', project(goalStatuses));
  console.log('task_status:', project(taskStatuses));
  console.log('goal_priority:', project(goalPriorities));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
