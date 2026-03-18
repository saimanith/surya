import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

async function generatePONumber() {
  const count = await db("purchase_orders").count("id as c").first();
  return `PO-${String((count?.c || 0) + 1).padStart(4,"0")}`;
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let q = db("purchase_orders").orderBy("created_at","desc");
    if (status) q = q.where("status", status);
    res.json({ success: true, data: await q });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { supplier_name, cloth_type, meters_ordered, price_per_meter, expected_date, notes } = req.body;
    if (!cloth_type || !meters_ordered) return res.status(400).json({ success: false, error: "Cloth type and meters required" });
    const now = new Date();
    const id = uuidv4();
    const po_number = await generatePONumber();
    const total = (parseFloat(meters_ordered)||0) * (parseFloat(price_per_meter)||0);
    await db("purchase_orders").insert({
      id, po_number, supplier_name, cloth_type,
      meters_ordered: parseFloat(meters_ordered),
      price_per_meter: parseFloat(price_per_meter)||0,
      total_amount: total, status:"pending",
      expected_date, notes,
      created_at: now.toISOString(), date: now.toISOString().split("T")[0],
    });
    res.status(201).json({ success: true, data: await db("purchase_orders").where("id",id).first() });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await db("purchase_orders").where("id",req.params.id).update({ status });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db("purchase_orders").where("id",req.params.id).delete();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
