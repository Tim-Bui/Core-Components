import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  try {
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
          await pool.query(statement);
          console.log('✓ Executed:', statement.substring(0, 50) + '...');
        } catch (err) {
          console.error('✗ Error executing:', statement.substring(0, 50) + '...');
          console.error('Error details:', err.message);
        }
      }
    }
    
    console.log('Database setup completed!');
    
  } catch (err) {
    console.error('Setup failed:', err);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupDatabase();
