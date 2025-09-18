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
    const beforeTables = await pool.query("select table_schema, table_name from information_schema.tables where table_type='BASE TABLE' order by 1,2");
    console.log('Target database:', beforeDb.rows?.[0]?.db);
    console.log('Tables BEFORE:', beforeTables.rows);
    const searchPath = await pool.query('SHOW search_path');
    console.log('search_path BEFORE:', searchPath.rows?.[0]);

    // Ensure public schema exists and is in search_path
    await pool.query('CREATE SCHEMA IF NOT EXISTS public');
    await pool.query("SET search_path TO public");

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'ecommerce.sql');
    const rawSql = fs.readFileSync(sqlFile, 'utf8');

    // Normalize line endings and strip BOM if present
    let sqlContent = rawSql.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

    // Remove comment-only lines and admin-only commands
    const filteredSql = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('--')) return false; // full-line comment
        if (/^CREATE\s+DATABASE/i.test(trimmed)) return false;
        if (/^\\c\b/.test(trimmed)) return false; // psql connect command
        return true;
      })
      .join('\n');

    // Split into individual statements on semicolons that end a statement
    const statements = filteredSql
      .split(';')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map(part => part + ';');

    console.log('Total SQL statements to run:', statements.length);
    if (statements.length > 0) {
      console.log('First statement preview:', statements[0].substring(0, 80));
    }
    
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
    const afterTables = await pool.query("select table_schema, table_name from information_schema.tables where table_type='BASE TABLE' order by 1,2");
    console.log('Tables AFTER:', afterTables.rows);
    const searchPathAfter = await pool.query('SHOW search_path');
    console.log('search_path AFTER:', searchPathAfter.rows?.[0]);
    
  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase();
