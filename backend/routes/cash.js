import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

// GET /api/cash?date=
router.get("/", requireAuth, async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const entries = await db("cash_register").where("date", date).orderBy("created_at");
    const opening = entries.filter(e=>e.type==="opening").reduce((s,e)=>s+e.amount,0);
    const deposits = entries.filter(e=>e.type==="deposit").reduce((s,e)=>s+e.amount,0);
    const withdrawals = entries.filter(e=>e.type==="withdrawal").reduce((s,e)=>s+e.amount,0);
    const cashSales = (await db("bills").where({date, payment_method:"cash"})).reduce((s,b)=>s+b.total,0);
    const balance = opening + deposits + cashSales - withdrawals;
    res.json({ success: true, data: { entries, opening, deposits, withdrawals, cashSales, balance, date } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/cash
router.post("/", requireAuth, async (req, res) => {
  try {
    const { type, amount, description, date } = req.body;
    if (!["opening","deposit","withdrawal"].includes(type)) return res.status(400).json({ success: false, error: "Invalid type" });
    if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ success: false, error: "Amount required" });
    const now = new Date();
    const id = uuidv4();
    await db("cash_register").insert({
      id, date: date || now.toISOString().split("T")[0],
      type, amount: parseFloat(amount), description,
      created_at: now.toISOString(),
    });
    res.status(201).json({ success: true, data: await db("cash_register").where("id",id).first() });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
