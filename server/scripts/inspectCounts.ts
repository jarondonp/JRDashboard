import 'dotenv/config';
import { sql } from 'drizzle-orm';

import { db } from '../db';

async function main() {
  const counts = await db.execute(
    sql`SELECT
      (SELECT COUNT(*) FROM areas) AS areas_count,
      (SELECT COUNT(*) FROM goals) AS goals_count,
      (SELECT COUNT(*) FROM tasks) AS tasks_count,
      (SELECT COUNT(*) FROM documents) AS documents_count,
      (SELECT COUNT(*) FROM progress_logs) AS progress_logs_count
    `,
  );

  console.log('Conteos actuales:', counts.rows[0]);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

