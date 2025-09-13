# Environment Variables Setup Guide

This guide will help you set up environment variables for your ecommerce project.

## Backend Environment Variables

Create a file named `.env` in the `backend/` directory with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=ecommerce
DB_PORT=5432

# JWT Secret (generate a strong secret key)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Stripe Configuration (for payment processing)
# Get these from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe CLI: command to test stripe function
# stripe listen --forward-to localhost:5000/api/cart/webhook

# Frontend URL (for Stripe redirects)
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=5000

# Admin User (already created in database)
# Email: admin@myshop.com
# Password: admin123
# User ID: 3
# Admin Status: ✅ ADMIN
```

## Frontend Environment Variables

Create a file named `.env` in the `frontend/` directory with the following content:

```env
# Frontend Environment Variables
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Ecommerce Store
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

## How to Get the Required Values

### 1. Database Configuration
- **DB_HOST**: Usually `localhost` for local development
- **DB_USER**: Your PostgreSQL username (usually `postgres`)
- **DB_PASSWORD**: Your PostgreSQL password
- **DB_NAME**: Database name (use `ecommerce`)
- **DB_PORT**: PostgreSQL port (usually `5432`)

### 2. JWT Secret
Generate a strong secret key for JWT tokens. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Stripe Configuration
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Secret key** (starts with `sk_test_`)
3. Copy your **Publishable key** (starts with `pk_test_`)
4. For webhook secret, use Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5000/api/cart/webhook
   ```

## Environment Variables Usage in Code

### Backend (Node.js/Express)
The backend uses `dotenv` package to load environment variables:
```javascript
import dotenv from "dotenv";
dotenv.config();

// Access variables
const dbUser = process.env.DB_USER;
const jwtSecret = process.env.JWT_SECRET;
```

### Frontend (Vite/React)
The frontend uses Vite's environment variable system:
```javascript
// Access variables (must be prefixed with VITE_)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use different values for development and production**
3. **Generate strong secrets** for JWT and other sensitive data
4. **Rotate secrets regularly** in production
5. **Use environment-specific files** (`.env.development`, `.env.production`)

## Quick Setup Commands

1. **Create backend .env file:**
   ```bash
   cd backend
   cp env.example .env
   # Edit .env with your actual values
   ```

2. **Create frontend .env file:**
   ```bash
   cd frontend
   # Create .env file with the content above
   ```

3. **Install dependencies:**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd frontend && npm install
   ```

4. **Start the applications:**
   ```bash
   # Backend (in one terminal)
   cd backend && npm start
   
   # Frontend (in another terminal)
   cd frontend && npm run dev
   ```

## Troubleshooting

- **Database connection issues**: Check your PostgreSQL service is running and credentials are correct
- **Stripe not working**: Verify your API keys are correct and you're using test keys
- **CORS issues**: Ensure `FRONTEND_URL` matches your frontend URL
- **JWT errors**: Make sure `JWT_SECRET` is set and consistent

## Production Considerations

For production deployment:
1. Use environment variables provided by your hosting platform
2. Use production Stripe keys
3. Set up proper database credentials
4. Use HTTPS URLs
5. Implement proper secret management
