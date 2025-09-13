# Stripe Setup Guide

## Why Stripe Checkout Isn't Working

The Stripe checkout feature requires API keys to be configured in the backend. Currently, the system is set up to work without Stripe (using direct checkout) for testing purposes.

## How to Enable Stripe Checkout

### 1. Create a Stripe Account
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for a free account
3. Go to the [API Keys section](https://dashboard.stripe.com/test/apikeys)

### 2. Get Your Test API Keys
- Copy your **Publishable key** (starts with `pk_test_`)
- Copy your **Secret key** (starts with `sk_test_`)

### 3. Configure Backend Environment
Create a `.env` file in the `backend` folder with:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=ecommerce
DB_PORT=5432

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server Port
PORT=5000
```

### 4. Restart the Backend Server
After adding the `.env` file, restart the backend server:
```bash
cd backend
npm start
```

## Current Status

✅ **Direct Checkout** - Works without any configuration
- Creates orders immediately
- No payment processing
- Perfect for testing

⚠️ **Stripe Checkout** - Requires API keys
- Secure payment processing
- Redirects to Stripe checkout page
- Requires valid Stripe account

## Testing the Checkout Flow

### Without Stripe (Current Setup)
1. Add products to cart
2. Go to cart page
3. Click "Complete Order (Recommended)"
4. Order is created immediately
5. View your orders

### With Stripe (After Configuration)
1. Add products to cart
2. Go to cart page
3. Click "Pay with Stripe (Optional)"
4. Redirected to Stripe checkout
5. Complete payment
6. Redirected back with success message
7. Order is created with "paid" status

## Troubleshooting

### "Stripe checkout is not configured" Error
- This means the `STRIPE_SECRET_KEY` is not set or invalid
- Use "Complete Order" instead for testing
- Or configure Stripe keys as described above

### Backend Server Issues
- Make sure the `.env` file is in the `backend` folder
- Restart the server after adding environment variables
- Check that the database is running

## Security Note

- Never commit `.env` files to version control
- Use test keys for development
- Use live keys only in production
