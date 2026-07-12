import pg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const pool = new pg.Pool({
  user: process.env.DB_USER || 'timelog',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'compass',
  password: process.env.DB_PASSWORD || '123456789',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const migrationPath = path.join(__dirname, 'db/migrations/001_create_users_table.sql');
    const sql1 = fs.readFileSync(migrationPath, 'utf8');
    await client.query(sql1);
    console.log('✓ Migration 001 (users table) applied successfully.');

    const migrationPath2 = path.join(__dirname, 'db/migrations/002_add_milestone_id_to_weekly_objectives.sql');
    const sql2 = fs.readFileSync(migrationPath2, 'utf8');
    await client.query(sql2);
    console.log('✓ Migration 002 (milestone_id on weekly_objectives) applied successfully.');
  } catch (error) {
    console.error('✗ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
