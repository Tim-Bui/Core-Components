import pool from './db.js';

async function fixDatabase() {
  try {
    console.log('🔧 Fixing common database issues...');
    
    // Check if cart table exists, if not create it
    const cartTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cart'
      );
    `);
    
    if (!cartTableCheck.rows[0].exists) {
      console.log('📦 Creating missing cart table...');
      await pool.query(`
        CREATE TABLE cart (
          cart_id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
          product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
          quantity INT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, product_id)
        );
      `);
      console.log('✅ Cart table created');
    } else {
      console.log('✅ Cart table already exists');
    }
    
    // Check for missing indexes
    console.log('🔍 Checking for missing indexes...');
    
    // Add indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await pool.query(indexQuery);
        console.log(`✓ Index created: ${indexQuery.split(' ')[5]}`);
      } catch (err) {
        console.log(`⚠️  Index: ${err.message}`);
      }
    }
    
    // Check for admin user
    const adminCheck = await pool.query(
      "SELECT * FROM users WHERE email = 'admin@myshop.com'"
    );
    
    if (adminCheck.rows.length === 0) {
      console.log('👤 Creating admin user...');
      await pool.query(`
        INSERT INTO users (name, email, password_hash, role) VALUES 
        ('Admin User', 'admin@myshop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
      `);
      console.log('✅ Admin user created (email: admin@myshop.com, password: admin123)');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    console.log('🎉 Database fixes completed!');
    
  } catch (err) {
    console.error('💥 FIX FAILED:', err);
  } finally {
    await pool.end();
  }
}

// Run the fixes
fixDatabase();
