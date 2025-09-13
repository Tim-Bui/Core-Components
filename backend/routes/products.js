import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { authorizeAdmin } from "../middleware/authorizeAdmin.js";

const router = express.Router();

/**
 * GET /api/products
 * Optional query params:
 *  - search (string, ILIKE name/description)
 *  - minPrice, maxPrice (numbers)
 *  - sort (price|created_at|name), order (asc|desc)
 *  - page (1+), pageSize (default 12)
 */
router.get("/", async (req, res) => {
  try {
    const {
      search,
      minPrice,
      maxPrice,
      category,
      sort = "product_id",
      order = "asc",
      page = "1",
      pageSize = "12",
    } = req.query;

    // Validate basics
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSz = Math.min(Math.max(parseInt(pageSize, 10) || 12, 1), 100);
    const offset = (pageNum - 1) * pageSz;

    // Whitelist sort fields
    const sortColumns = {
      product_id: "product_id",
      name: "name",
      price: "price",
      created_at: "created_at",
    };
    const sortCol = sortColumns[sort] || "product_id";
    const sortDir = order?.toLowerCase() === "desc" ? "DESC" : "ASC";

    // Build query
    const where = [];
    const values = [];
    let i = 1;

    if (search) {
      where.push(`(name ILIKE $${i} OR description ILIKE $${i})`);
      values.push(`%${search}%`);
      i++;
    }
    if (minPrice) {
      where.push(`price >= $${i}`);
      values.push(minPrice);
      i++;
    }
    if (maxPrice) {
      where.push(`price <= $${i}`);
      values.push(maxPrice);
      i++;
    }
    if (category) {
      where.push(`category ILIKE $${i}`);
      values.push(`%${category}%`);
      i++;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const dataSql = `
      SELECT * FROM products
      ${whereSql}
      ORDER BY ${sortCol} ${sortDir}
      LIMIT $${i} OFFSET $${i + 1}
    `;
    values.push(pageSz, offset);

    const countSql = `SELECT COUNT(*)::int AS count FROM products ${whereSql}`;

    const [data, count] = await Promise.all([
      pool.query(dataSql, values),
      pool.query(countSql, values.slice(0, i - 1)),
    ]);

    res.json({
      items: data.rows,
      page: pageNum,
      pageSize: pageSz,
      total: count.rows[0].count,
      totalPages: Math.ceil(count.rows[0].count / pageSz),
      sort: sortCol,
      order: sortDir.toLowerCase(),
    });
  } catch (err) {
    console.error("GET /products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/** GET /api/products/categories - Get all available categories */
router.get("/categories", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT category 
      FROM products 
      WHERE category IS NOT NULL 
      ORDER BY category
    `);
    
    const categories = rows.map(row => row.category);
    res.json({ categories });
  } catch (err) {
    console.error("GET /products/categories error:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

/** GET /api/products/:id (public) */
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products WHERE product_id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("GET /products/:id error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

/** POST /api/products (admin only) */
router.post("/", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name, description, price, image_url, stock_quantity } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: "name and price are required" });
    }
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, image_url, stock_quantity)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, description || "", price, image_url || null, stock_quantity ?? 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("POST /products error:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

/** PUT /api/products/:id (admin only) */
router.put("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name, description, price, image_url, stock_quantity } = req.body;

    const { rows } = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           image_url = COALESCE($4, image_url),
           stock_quantity = COALESCE($5, stock_quantity)
       WHERE product_id = $6
       RETURNING *`,
      [name, description, price, image_url, stock_quantity, req.params.id]
    );

    if (!rows.length) return res.status(404).json({ message: "Product not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("PUT /products/:id error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

/** DELETE /api/products/:id (admin only) */
router.delete("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "DELETE FROM products WHERE product_id = $1 RETURNING product_id",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("DELETE /products/:id error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
