import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './db';

async function setupDatabase() {
  try {
    console.log('Setting up database schema...');
    
    // Read the schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('✓ Database schema created successfully!');
    console.log('\nTables created:');
    console.log('  - goals');
    console.log('  - sessions');
    console.log('  - interruptions');
    console.log('  - reflections');
    console.log('  - weekly_objectives');
    console.log('  - tasks');
    console.log('  - checklist_items');
    console.log('  - roadmap_nodes');
    console.log('  - roadmap_phases');
    console.log('  - settings');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Database setup failed:', error);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
