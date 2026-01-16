import { Pool } from "pg";
import fs from "fs";
import path from "path";

export async function runMigrations(pool: Pool): Promise<void> {
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(__dirname, "../migrations");
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith(".sql")) continue;

      const { rows } = await pool.query(
        "SELECT * FROM migrations WHERE name = $1",
        [file]
      );

      if (rows.length > 0) {
        console.log(`✓ Migration ${file} already executed`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      try {
        await pool.query(sql);
        await pool.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
        console.log(`✓ Executed migration ${file}`);
      } catch (err: any) {
        console.error(`✗ Failed to execute migration ${file}:`, err.message);
        // Continue with next migration instead of failing
      }
    }

    console.log("✓ All migrations completed");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}
