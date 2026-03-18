import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

// Generate bolt ID like BOLT-CTN-001
async function generateBoltId(clothType) {
  const prefix = clothType.substring(0,3).toUpperCase();
  const count = await db("bolts").where("cloth_type", clothType).count("id as c").first();
  return `BOLT-${prefix}-${String((count?.c || 0) + 1).padStart(3, "0")}`;
}

// GET /api/bolts
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, cloth_type } = req.query;
    let q = db("bolts").orderBy("created_at", "desc");
    if (status) q = q.where("status", status);
    if (cloth_type) q = q.where("cloth_type", cloth_type);
    res.json({ success: true, data: await q });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/bolts/summary
router.get("/summary", requireAuth, async (req, res) => {
  try {
    const bolts = await db("bolts").where("status", "active");
    const total_bolts = bolts.length;
    const total_meters = bolts.reduce((s,b) => s + b.remaining_meters, 0);
    const inventory_value = bolts.reduce((s,b) => s + b.remaining_meters * b.cost_price_per_meter, 0);
    const selling_value = bolts.reduce((s,b) => s + b.remaining_meters * b.selling_price_per_meter, 0);
    const low_stock = bolts.filter(b => b.remaining_meters < 5).length;
    res.json({ success: true, data: { total_bolts, total_meters, inventory_value, selling_value, low_stock } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/bolts/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const bolt = await db("bolts").where("id", req.params.id).first();
    if (!bolt) return res.status(404).json({ success: false, error: "Bolt not found" });
    // Get usage history
    bolt.usage = await db("bill_items").where("bolt_id", req.params.id)
      .join("bills", "bill_items.bill_id", "bills.id")
      .select("bill_items.*", "bills.bill_number", "bills.customer_name", "bills.date");
    res.json({ success: true, data: bolt });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/bolts
router.post("/", requireAuth, async (req, res) => {
  try {
    const { cloth_type, total_meters, cost_price_per_meter, selling_price_per_meter, color, supplier, notes, received_date } = req.body;
    if (!cloth_type || !total_meters) return res.status(400).json({ success: false, error: "Cloth type and meters required" });
    const id = await generateBoltId(cloth_type);
    const now = new Date();
    await db("bolts").insert({
      id, cloth_type, total_meters: parseFloat(total_meters),
      remaining_meters: parseFloat(total_meters),
      cost_price_per_meter: parseFloat(cost_price_per_meter) || 0,
      selling_price_per_meter: parseFloat(selling_price_per_meter) || 0,
      color, supplier, notes, status: "active",
      received_date: received_date || now.toISOString().split("T")[0],
      created_at: now.toISOString(),
    });
    res.status(201).json({ success: true, data: await db("bolts").where("id", id).first() });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/bolts/:id
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const allowed = ["selling_price_per_meter","cost_price_per_meter","color","supplier","notes","status","remaining_meters"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    await db("bolts").where("id", req.params.id).update(updates);
    res.json({ success: true, data: await db("bolts").where("id", req.params.id).first() });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
