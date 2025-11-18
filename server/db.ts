import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_aHsbgiO8x6Lc@ep-dawn-fire-a4bvdjr9-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
});

export const db = drizzle(pool);
