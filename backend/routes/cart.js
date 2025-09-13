import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import Stripe from "stripe";

// Initialize Stripe only if valid API key is provided
let stripe = null;

// Function to initialize Stripe
const initializeStripe = () => {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('✅ Stripe initialized successfully');
  } else {
    console.log('⚠️  Stripe disabled: Invalid or missing API key. Only direct checkout available.');
  }
};

const router = express.Router();

// Add product to cart
router.post("/add", authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const userId = req.user.user_id;

    // Insert or update existing product in cart
    const result = await pool.query(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity
       RETURNING *`,
      [userId, product_id, quantity || 1]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// View user's cart
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const result = await pool.query(
      `SELECT c.cart_id, c.quantity, p.product_id, p.name, p.price
       FROM cart c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Remove product from cart
router.delete("/:product_id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { product_id } = req.params;

    await pool.query(
      "DELETE FROM cart WHERE user_id=$1 AND product_id=$2",
      [userId, product_id]
    );

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Checkout endpoint
router.post("/checkout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { paymentMethod = 'direct' } = req.body; // Default to 'direct' for backward compatibility

    // Get user's cart items with product details
    const cartItems = await pool.query(
      `SELECT c.cart_id, c.quantity, p.product_id, p.name, p.price
       FROM cart c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate total price
    const totalPrice = cartItems.rows.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    // Determine order status based on payment method
    const orderStatus = paymentMethod === 'stripe' ? 'completed' : 'pending';

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create new order
      const orderResult = await client.query(
        "INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING *",
        [userId, totalPrice, orderStatus]
      );
      const orderId = orderResult.rows[0].order_id;

      // Create order items
      for (const item of cartItems.rows) {
        await client.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
          [orderId, item.product_id, item.quantity, item.price]
        );
      }

      // Empty the cart
      await client.query("DELETE FROM cart WHERE user_id = $1", [userId]);

      await client.query('COMMIT');

      res.json({
        message: "Order created successfully",
        order_id: orderId,
        total_price: totalPrice,
        items_count: cartItems.rows.length
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Stripe checkout endpoint
router.post("/create-checkout-session", authenticateToken, async (req, res) => {
  if (!stripe) {
    return res.status(400).json({ 
      message: "Stripe checkout is not available. Please use direct checkout instead." 
    });
  }

  try {
    const userId = req.user.user_id;

    // Get user's cart items
    const cartItems = await pool.query(
      `SELECT c.quantity, p.product_id, p.name, p.price
       FROM cart c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = $1`,
      [userId]
    );

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: cartItems.rows.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(parseFloat(item.price) * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart?canceled=true`,
      metadata: {
        user_id: userId.toString(),
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Test webhook endpoint (for debugging)
router.get("/webhook-test", (req, res) => {
  console.log('🔍 Webhook test endpoint called');
  res.json({ message: 'Webhook endpoint is accessible', timestamp: new Date().toISOString() });
});

// Stripe webhook to handle successful payments
router.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('🔔 Webhook endpoint hit! Headers:', req.headers);
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    console.log('✅ Stripe webhook: checkout.session.completed received');
    const session = event.data.object;
    const userId = parseInt(session.metadata.user_id);
    console.log('Processing order for user:', userId);

    try {
      // Get cart items and create order
      const cartItems = await pool.query(
        `SELECT c.quantity, p.product_id, p.name, p.price
         FROM cart c
         JOIN products p ON c.product_id = p.product_id
         WHERE c.user_id = $1`,
        [userId]
      );

      if (cartItems.rows.length > 0) {
        const totalPrice = cartItems.rows.reduce((total, item) => {
          return total + (item.price * item.quantity);
        }, 0);

        // Start transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // Create new order
          const orderResult = await client.query(
            "INSERT INTO orders (user_id, total_price, status) VALUES ($1, $2, $3) RETURNING *",
            [userId, totalPrice, 'paid']
          );
          const orderId = orderResult.rows[0].order_id;
          console.log('✅ Order created with ID:', orderId);

          // Create order items
          for (const item of cartItems.rows) {
            await client.query(
              "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
              [orderId, item.product_id, item.quantity, item.price]
            );
          }

          // Empty the cart
          await client.query("DELETE FROM cart WHERE user_id = $1", [userId]);
          console.log('✅ Cart cleared for user:', userId);

          await client.query('COMMIT');
          console.log('✅ Stripe webhook: Order processing completed successfully');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      }
    } catch (err) {
      console.error('Error processing webhook:', err);
      return res.status(500).send('Webhook processing failed');
    }
  }

  res.json({ received: true });
});

export { initializeStripe };
export default router;
