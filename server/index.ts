
import express from 'express';
import routes from './routes';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { db } from './db';
import plannerRoutes from './routes/planner';

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// AUTOMATIC MIGRATION FUNCTION
async function runAutoMigration() {
  try {
    console.log('🔄 Running automatic database migration...');

    // 1. Add Columns to TASKS
    await db.execute(sql`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS impact INTEGER CHECK(impact BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS effort INTEGER CHECK(effort BETWEEN 1 AND 5),
      ADD COLUMN IF NOT EXISTS calculated_priority VARCHAR(50),
        ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
          ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]':: jsonb,
            ADD COLUMN IF NOT EXISTS planner_meta JSONB DEFAULT '{}':: jsonb;
`);

    // FIX: Widen columns if they already exist (prevents "value too long" errors)
    await db.execute(sql`ALTER TABLE tasks ALTER COLUMN calculated_priority TYPE VARCHAR(50); `);

    // 2. Create PROJECT_BASELINES table if not exists
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS project_baselines(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  notes TEXT
);
`);
    // FORCE ADD COLUMNS TO BASELINES in case table existed but was old
    await db.execute(sql`ALTER TABLE project_baselines ADD COLUMN IF NOT EXISTS created_by VARCHAR(255); `);
    await db.execute(sql`ALTER TABLE project_baselines ADD COLUMN IF NOT EXISTS notes TEXT; `);

    // 3. Create BASELINE_TASKS table
    await db.execute(sql`
            CREATE TABLE IF NOT EXISTS baseline_tasks(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_id UUID NOT NULL REFERENCES project_baselines(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  original_start_date DATE,
  original_due_date DATE,
  original_priority VARCHAR(50),
  original_status VARCHAR(50),
  original_impact INTEGER,
  original_effort INTEGER,
  original_dependencies JSONB,
  snapshot_data JSONB,
  UNIQUE(baseline_id, task_id)
);
`);
    // FORCE ADD COLUMNS TO BASELINE_TASKS
    await db.execute(sql`ALTER TABLE baseline_tasks ADD COLUMN IF NOT EXISTS original_priority VARCHAR(50); `);
    await db.execute(sql`ALTER TABLE baseline_tasks ADD COLUMN IF NOT EXISTS original_impact INTEGER; `);
    await db.execute(sql`ALTER TABLE baseline_tasks ADD COLUMN IF NOT EXISTS original_effort INTEGER; `);
    await db.execute(sql`ALTER TABLE baseline_tasks ADD COLUMN IF NOT EXISTS snapshot_data JSONB; `);

    // FIX: Widen columns if they already exist
    await db.execute(sql`ALTER TABLE baseline_tasks ALTER COLUMN original_priority TYPE VARCHAR(50); `);

    // 4. Create Indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_tasks_dependencies ON tasks USING GIN(dependencies); `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_baseline_tasks_baseline_id ON baseline_tasks(baseline_id); `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_project_baselines_project_id ON project_baselines(project_id); `);

    console.log('✅ Automatic migration completed successfully.');
  } catch (e: any) {
    console.error('❌ Automatic migration failed:', e);
    // Don't exit process, just log it. It might be transient or already done.
  }
}

// TEMPORARY MIGRATION & DIAGNOSTIC ROUTE (Kept for manual checks)
app.get('/migrate-fix', async (req, res) => {
  await runAutoMigration(); // Reuse logic

  // DIAGNOSTIC: Check columns
  try {
    const result = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'project_baselines';
`);
    const columns = result.rows ? result.rows.map((r: any) => r.column_name).join(', ') : JSON.stringify(result);

    res.send(`
  < h1 > Migration Audit </h1>
    < p > <strong>Migration executed.Current Columns in project_baselines: </strong></p >
      <pre>${columns} </pre>
        < p > If 'created_by' is missing above, the table is stuck.</p>

          < div style = "background:#ffdddd; padding:15px; border:1px solid red; margin-top:20px;" >
            <h3>⚠️ Emergency Fix </h3>
              < p > If the error persists, click below to DELETE the baseline tables and recreate them cleanly.</p>
                < a href = "/force-reset-baselines" > <button style="color:white; background:red; padding:10px 20px; font-weight:bold; cursor:pointer;" > DROP & RECREATE TABLES < /button></a >
                  </div>
                    `);
  } catch (e: any) {
    res.status(500).send('Diagnostic failed: ' + e.message);
  }
});

// FORCE RESET ROUTE
app.get('/force-reset-baselines', async (req, res) => {
  try {
    console.log('💣 NUKING BASELINE TABLES...');
    await db.execute(sql`DROP TABLE IF EXISTS baseline_tasks CASCADE; `);
    await db.execute(sql`DROP TABLE IF EXISTS project_baselines CASCADE; `);

    console.log('Building fresh tables...');

    // Re-run migration to create tables
    await runAutoMigration();

    res.send(`
  < h1 style = "color:green" > TABLES RECREATED CLEANLY </h1>
    < p > The baselines tables were deleted and recreated from scratch.</p>
      < p > Please return to the app and "Confirm Plan" again.</p>
        `);
  } catch (e: any) {
    console.error('Reset failed:', e);
    res.status(500).send('Reset Failed: ' + e.message);
  }
});

app.use('/api/planner', plannerRoutes);
app.use('/api', routes);

const PORT = process.env.PORT || 5000;

// Run migration before listening
runAutoMigration().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
    console.log('OPENAI_API_KEY loaded:', process.env.OPENAI_API_KEY ? '✅ YES (length: ' + process.env.OPENAI_API_KEY.length + ')' : '❌ NO');
  });
});