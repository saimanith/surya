import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const { date, type } = req.query;
    let query = db("expenditures").orderBy("created_at", "desc");
    if (date) query = query.where("date", date);
    if (type) query = query.where("type", type);
    res.json({ success: true, data: await query });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const target = req.query.date || new Date().toISOString().split("T")[0];
    const all = await db("expenditures").where("date", target);
    res.json({ success: true, data: {
      total_expense: all.filter(e=>e.type==="expense").reduce((s,e)=>s+e.amount,0),
      total_lending: all.filter(e=>e.type==="lending").reduce((s,e)=>s+e.amount,0),
      pending_returns: all.filter(e=>e.type==="lending"&&e.status==="pending").reduce((s,e)=>s+e.amount,0),
      count: all.length,
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { type, category, description, party_name, party_phone, amount, due_date } = req.body;
    if (!type || !description || !amount) return res.status(400).json({ success: false, error: "Type, description and amount required" });
    const now = new Date();
    const id = uuidv4();
    await db("expenditures").insert({
      id, type, category: category||"misc", description, party_name, party_phone,
      amount: parseFloat(amount), status: type==="lending" ? "pending" : "done",
      due_date: due_date||null, date: now.toISOString().split("T")[0], created_at: now.toISOString(),
    });
    res.status(201).json({ success: true, data: await db("expenditures").where("id", id).first() });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await db("expenditures").where("id", req.params.id).update({ status });
    res.json({ success: true, message: "Updated" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db("expenditures").where("id", req.params.id).delete();
    res.json({ success: true, message: "Deleted" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
