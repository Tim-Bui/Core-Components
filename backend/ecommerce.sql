-- Create database (run this once)
CREATE DATABASE ecommerce;

-- Switch to the database
\c ecommerce;

---------------------------------------------------------
-- 1. Users Table
---------------------------------------------------------
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);

---------------------------------------------------------
-- 2. Products Table
---------------------------------------------------------
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

---------------------------------------------------------
-- 3. Cart Table
---------------------------------------------------------
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

---------------------------------------------------------
-- 4. Orders Table
---------------------------------------------------------
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    total_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

---------------------------------------------------------
-- 5. Order Items Table
---------------------------------------------------------
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

---------------------------------------------------------
-- Sample Data
---------------------------------------------------------
INSERT INTO products (name, description, price, image_url, stock_quantity) VALUES 
('Wireless Mouse', 'Ergonomic wireless mouse with USB-C receiver', 49.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop', 100),
('Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', 99.99, 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop', 50),
('HD Monitor', '24-inch 1080p monitor with HDMI support', 149.99, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop', 30),
('Noise-Cancelling Headphones', 'Over-ear Bluetooth headphones with active noise cancellation', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', 25),
('USB-C Hub', 'Multiport adapter with HDMI, USB 3.0, and SD card reader', 49.99, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop', 75);

-- Create admin user (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES 
('Admin User', 'admin@myshop.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
