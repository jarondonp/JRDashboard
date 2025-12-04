import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./shared/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_aHsbgiO8x6Lc@ep-dawn-fire-a4bvdjr9-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
});
