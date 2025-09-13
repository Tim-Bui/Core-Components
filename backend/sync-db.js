import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database with ecommerce.sql...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'ecommerce.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Extract only the INSERT statements
    const insertStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => 
        stmt.length > 0 && 
        !stmt.startsWith('--') && 
        !stmt.startsWith('CREATE DATABASE') &&
        !stmt.startsWith('\\c') &&
        !stmt.startsWith('CREATE TABLE') &&
        stmt.toUpperCase().includes('INSERT')
      );
    
    console.log(`📊 Found ${insertStatements.length} INSERT statements to process`);
    
    let updatedCount = 0;
    let insertedCount = 0;
    let errorCount = 0;
    
    // Process each INSERT statement using UPSERT
    for (let i = 0; i < insertStatements.length; i++) {
      const statement = insertStatements[i];
      console.log(`\n🔄 Processing statement ${i + 1}...`);
      
      // Extract product name from INSERT statement for logging
      const nameMatch = statement.match(/\('([^']+)'/);
      const productName = nameMatch ? nameMatch[1] : `Product ${i + 1}`;
      
      try {
        // Convert INSERT to UPSERT (INSERT ... ON CONFLICT)
        const upsertStatement = statement.replace(
          /INSERT INTO products \(([^)]+)\) VALUES \(([^)]+)\)/,
          `INSERT INTO products ($1) VALUES ($2) ON CONFLICT (name) DO UPDATE SET 
           description = EXCLUDED.description, 
           price = EXCLUDED.price, 
           image_url = EXCLUDED.image_url, 
           stock_quantity = EXCLUDED.stock_quantity`
        );
        
        const result = await pool.query(upsertStatement);
        
        if (result.rowCount === 1) {
          // Check if it was an insert or update
          const existingProduct = await pool.query(
            'SELECT product_id FROM products WHERE name = $1',
            [productName]
          );
          
          if (existingProduct.rows.length > 0) {
            updatedCount++;
            console.log(`✅ UPDATED: ${productName}`);
          } else {
            insertedCount++;
            console.log(`✅ INSERTED: ${productName}`);
          }
        }
        
      } catch (err) {
        errorCount++;
        console.log(`❌ ERROR processing ${productName}: ${err.message}`);
      }
    }
    
    console.log(`\n📈 SYNC RESULTS:`);
    console.log(`✅ Updated existing: ${updatedCount}`);
    console.log(`✅ Inserted new: ${insertedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Show final state
    console.log(`\n📋 Final products in database:`);
    try {
      const products = await pool.query('SELECT name, price FROM products ORDER BY product_id');
      products.rows.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - $${product.price}`);
      });
      console.log(`\nTotal products: ${products.rows.length}`);
    } catch (err) {
      console.log(`❌ Could not fetch products: ${err.message}`);
    }
    
  } catch (err) {
    console.error('💥 SYNC FAILED:', err);
  } finally {
    await pool.end();
  }
}

// Run the sync
syncDatabase();
