const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        console.log('Running raw SQL migration...');
        await pool.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE;');
        console.log('SUCCESS: Added start_date column.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
