import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'lol123',
  database: process.env.DB_NAME || 'ecommerce',
  port: process.env.DB_PORT || 5432,
});

// Test the connection
pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
});

export default pool;
