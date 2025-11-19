const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_aHsbgiO8x6Lc@ep-dawn-fire-a4bvdjr9-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkEnums() {
  try {
    // Check task_status enum
    const taskEnumQuery = `
      SELECT e.enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'task_status' 
      ORDER BY e.enumsortorder
    `;
    const taskResult = await pool.query(taskEnumQuery);
    console.log('TASK STATUS ENUM VALUES:');
    console.log(JSON.stringify(taskResult.rows, null, 2));

    // Check actual task statuses in database
    const actualTasksQuery = 'SELECT DISTINCT status FROM tasks LIMIT 10';
    const actualResult = await pool.query(actualTasksQuery);
    console.log('\nACTUAL TASK STATUSES IN DATABASE:');
    console.log(JSON.stringify(actualResult.rows, null, 2));

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
}

checkEnums();
