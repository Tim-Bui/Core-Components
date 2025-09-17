import pkg from 'pg';
const { Pool } = pkg;

// Prefer DATABASE_URL when available (Render/managed Postgres). Fallback to individual vars.
const createPool = () => {
  // If DATABASE_URL is provided, use it with SSL enabled (Render requires SSL)
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  }

  // Otherwise, use individual DB_* environment variables. Allow opting into SSL via DB_SSL=true
  const shouldUseSsl = String(process.env.DB_SSL).toLowerCase() === 'true'
    || process.env.NODE_ENV === 'production';

  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'lol123',
    database: process.env.DB_NAME || 'ecommerce',
    port: Number(process.env.DB_PORT) || 5432,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
  });
};

const pool = createPool();

// Test the connection
pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
});

export default pool;
