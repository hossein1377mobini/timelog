import { testConnection } from './lib/db';

async function main() {
  console.log('Testing PostgreSQL connection...');
  console.log('Database: compass');
  console.log('Host: localhost');
  console.log('Port: 5432');
  console.log('User: postgres');
  console.log('---');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('\n✓ Connection successful!');
    process.exit(0);
  } else {
    console.log('\n✗ Connection failed!');
    process.exit(1);
  }
}

main();
