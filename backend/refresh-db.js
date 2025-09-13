import pool from './db.js';

async function refreshDatabase() {
  try {
    console.log('🔄 Refreshing database...');
    
    // Drop all tables in correct order (respecting foreign key constraints)
    const dropStatements = [
      'DROP TABLE IF EXISTS order_items CASCADE',
      'DROP TABLE IF EXISTS orders CASCADE',
      'DROP TABLE IF EXISTS cart CASCADE',
      'DROP TABLE IF EXISTS products CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];
    
    for (const statement of dropStatements) {
      try {
        await pool.query(statement);
        console.log(`✓ Dropped: ${statement.split(' ')[4]}`);
      } catch (err) {
        console.log(`⚠️  ${statement.split(' ')[4]}: ${err.message}`);
      }
    }
    
    console.log('✅ Database refreshed successfully!');
    console.log('💡 Run "npm run setup-db" to recreate tables and data');
    
  } catch (err) {
    console.error('💥 REFRESH FAILED:', err);
  } finally {
    await pool.end();
  }
}

// Run the refresh
refreshDatabase();
