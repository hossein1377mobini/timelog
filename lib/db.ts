import { Pool } from 'pg';

// Database configuration from environment variables
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'compass',
  password: process.env.DB_PASSWORD || '123456789', // Default for development only
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Validate that DB_PASSWORD is set in production
if (!process.env.DB_PASSWORD) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DB_PASSWORD environment variable is required in production');
  } else {
    console.warn('Warning: Using default database password. Set DB_PASSWORD environment variable for production.');
  }
}

// Test the connection
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✓ Database connected successfully!');
    console.log('Current time from database:', result.rows[0].now);
    client.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    return false;
  }
}

// Export the pool for use in other parts of the application
export default pool;
