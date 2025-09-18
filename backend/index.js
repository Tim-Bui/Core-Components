import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes, { initializeStripe } from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import pool from "./db.js";

dotenv.config();

// Initialize Stripe after environment variables are loaded
initializeStripe();

const app = express();
const PORT = process.env.PORT || 5000;


const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://core-components.vercel.app"
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (origin.endsWith(".vercel.app")) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

// Routes
// Temporary diagnostics endpoint to inspect DB connection and tables
app.get("/api/_dbinfo", async (req, res) => {
  try {
    const dbRes = await pool.query("select current_database() as db");
    const searchPath = await pool.query('SHOW search_path');
    const tablesRes = await pool.query("select table_schema, table_name from information_schema.tables where table_type='BASE TABLE' order by 1,2");
    res.json({
      database: dbRes.rows?.[0]?.db,
      search_path: searchPath.rows?.[0]?.search_path,
      tables: tablesRes.rows || []
    });
  } catch (err) {
    console.error("/api/_dbinfo error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/", (req, res) => {
  res.json({ message: "Ecommerce API is running!" });
});

// Auth API
app.use("/api/auth", authRoutes);

// Products API
app.use("/api/products", productRoutes);

// Cart API
app.use("/api/cart", cartRoutes);

// Orders API
app.use("/api/orders", orderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
