# 🛒 Ecommerce Clone

A modern full-stack ecommerce application built with React, Node.js, Express, and PostgreSQL. Features user authentication, product management, shopping cart, order processing, and Stripe payment integration.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- **User Authentication**: Register, login, and logout functionality
- **Product Catalog**: Browse and view product details
- **Shopping Cart**: Add/remove items, update quantities
- **Checkout Process**: Both direct checkout and Stripe payment integration
- **Order Management**: View order history and status
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- Tailwind CSS for styling
- Vite for build tooling

### Backend
- Node.js
- Express.js
- PostgreSQL database
- JWT for authentication
- Stripe for payments
- bcryptjs for password hashing

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ecommerce-clone.git
   cd ecommerce-clone
   ```

2. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb ecommerce
   
   # Run the SQL schema
   psql -d ecommerce -f backend/ecommerce.sql
   ```

3. **Install dependencies**
   ```bash
   # Install all dependencies (root level)
   npm install
   
   # Or install separately
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Environment Setup**
   
   Copy the example environment files and configure them:
   ```bash
   # Backend environment
   cp backend/env.example backend/.env
   # Edit backend/.env with your database credentials
   
   # Frontend environment
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env if needed
   ```

   **Backend `.env` file:**
   ```env
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=ecommerce
   DB_PORT=5432
   JWT_SECRET=your_super_secret_jwt_key
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   FRONTEND_URL=http://localhost:5173
   PORT=5000
   ```

   **Frontend `.env` file:**
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_APP_NAME=Ecommerce Store
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   ```

5. **Start the applications**
   
   **Option 1: Start both servers**
   ```bash
   # Backend (Terminal 1)
   cd backend && npm run dev
   
   # Frontend (Terminal 2)
   cd frontend && npm run dev
   ```
   
   **Option 2: Use the setup script**
   ```bash
   npm run setup
   ```

6. **Access the application**
   - 🌐 **Frontend**: http://localhost:5173
   - 🔧 **Backend API**: http://localhost:5000
   - 📊 **Admin Panel**: http://localhost:5173/admin (use admin@myshop.com / admin123)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `POST /api/cart/add` - Add item to cart
- `GET /api/cart` - Get user's cart
- `DELETE /api/cart/:product_id` - Remove item from cart
- `POST /api/cart/checkout` - Direct checkout
- `POST /api/cart/create-checkout-session` - Stripe checkout

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/status` - Update order status (admin)

## 📁 Project Structure

```
ecommerce-clone/
├── backend/                 # Backend API server
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication & authorization
│   ├── ecommerce.sql      # Database schema
│   ├── env.example        # Environment variables template
│   └── index.js           # Server entry point
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── api.js         # API client configuration
│   │   └── main.jsx       # App entry point
│   ├── public/            # Static assets
│   └── .env.example       # Frontend environment template
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
└── ENVIRONMENT_SETUP.md   # Detailed environment setup guide
```

## 🗄️ Database Schema

### Tables
- `users` - User accounts and authentication
- `products` - Product catalog
- `cart` - Shopping cart items
- `orders` - Order records
- `order_items` - Individual items within orders

## Default Admin Account
- Email: admin@myshop.com
- Password: admin123

## Stripe Integration

To enable Stripe payments:
1. Get your Stripe API keys from https://dashboard.stripe.com/test/apikeys
2. Add them to your `backend/.env` file
3. Set up webhook endpoint for payment confirmation

## Development

### Backend Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run setup-db` - Set up database tables
- `npm run sync-db` - Sync database with sample data

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
