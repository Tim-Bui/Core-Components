import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    await pool.end();
  } catch (err) {
    console.error('❌ Database connection failed:');
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    process.exit(1);
  }
}

testConnection();
