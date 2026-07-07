/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
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
    const sql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(sql);
    console.log('✓ Migration 001 (users table) applied successfully.');
  } catch (error) {
    console.error('✗ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
