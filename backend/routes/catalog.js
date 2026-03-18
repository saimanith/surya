import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

// GET /api/catalog
router.get("/", requireAuth, async (req, res) => {
  try {
    const items = await db("cloth_catalog").orderBy("name");
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/catalog
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, default_price } = req.body;
    if (!name) return res.status(400).json({ success: false, error: "Name required" });
    const id = uuidv4();
    await db("cloth_catalog").insert({ id, name, default_price: default_price || 0 });
    res.status(201).json({ success: true, data: { id, name, default_price } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export { router as catalogRouter };

// Customers Router
const customersRouter = Router();

customersRouter.get("/", requireAuth, async (req, res) => {
  try {
    const customers = await db("customers").orderBy("total_purchases", "desc");
    res.json({ success: true, data: customers });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

customersRouter.get("/search", requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    const customers = await db("customers")
      .where("name", "like", `%${q}%`)
      .orWhere("phone", "like", `%${q}%`)
      .limit(10);
    res.json({ success: true, data: customers });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export { customersRouter };
