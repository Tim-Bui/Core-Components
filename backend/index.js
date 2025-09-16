import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import cartRoutes, { initializeStripe } from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";

dotenv.config();

// Initialize Stripe after environment variables are loaded
initializeStripe();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://your-vercel-domain.vercel.app"
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());

// Routes
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
