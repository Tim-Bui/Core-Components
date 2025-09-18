import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
    // Diagnostics: show which DB we're targeting and existing tables
    const beforeDb = await pool.query('select current_database() as db');
    const beforeTables = await pool.query("select table_name from information_schema.tables where table_schema='public' order by 1");
    console.log('Target database:', beforeDb.rows?.[0]?.db);
    console.log('Tables BEFORE:', beforeTables.rows.map(r => r.table_name));

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'ecommerce.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split the SQL content into individual statements
    // Remove the CREATE DATABASE and \c commands as they should be run separately
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('CREATE DATABASE') &&
        !stmt.startsWith('\\c')
      );
    
    console.log('Setting up database...');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const result = await pool.query(statement);
          console.log('✓ Executed:', statement.substring(0, 50) + '...');
          if (result.rows && result.rows.length > 0) {
            console.log('  Result:', result.rows.length, 'rows affected');
          }
        } catch (err) {
          console.error('✗ Error executing:', statement.substring(0, 50) + '...');
          console.error('Error details:', err.message);
          console.error('Error code:', err.code);
          console.error('Full statement:', statement);
          // Don't continue if we hit an error
          throw err;
        }
      }
    }
    
    console.log('Database setup completed!');

    // Diagnostics: list tables after running
    const afterTables = await pool.query("select table_name from information_schema.tables where table_schema='public' order by 1");
    console.log('Tables AFTER:', afterTables.rows.map(r => r.table_name));
    
  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase();
