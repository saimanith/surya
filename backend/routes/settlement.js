import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

router.get("/:date", requireAuth, async (req, res) => {
  try {
    const record = await db("day_settlements").where("date", req.params.date).first();
    res.json({ success: true, data: record || null });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/close", requireAuth, async (req, res) => {
  try {
    const { date, notes, cash_in_register } = req.body;
    const target = date || new Date().toISOString().split("T")[0];
    const bills = await db("bills").where("date", target);
    const expenditures = await db("expenditures").where("date", target).where("type", "expense");

    const total_sales = bills.reduce((s,b)=>s+b.total,0);
    const cash_sales = bills.filter(b=>b.payment_method==="cash").reduce((s,b)=>s+b.total,0);
    const upi_sales = bills.filter(b=>b.payment_method==="upi").reduce((s,b)=>s+b.total,0);
    const card_sales = bills.filter(b=>b.payment_method==="card").reduce((s,b)=>s+b.total,0);
    const credit_sales = bills.filter(b=>b.payment_method==="credit").reduce((s,b)=>s+b.total,0);
    const total_expenditure = expenditures.reduce((s,e)=>s+e.amount,0);
    const net_cash = parseFloat(cash_in_register||0) || (cash_sales - total_expenditure);

    const existing = await db("day_settlements").where("date", target).first();
    if (existing) {
      await db("day_settlements").where("date", target).update({
        total_sales, cash_sales, upi_sales, card_sales, credit_sales,
        total_tax: bills.reduce((s,b)=>s+b.tax,0),
        total_discount: bills.reduce((s,b)=>s+b.discount,0),
        total_expenditure, net_cash_in_register: net_cash,
        total_bills: bills.length, notes: notes||"", closed_at: new Date().toISOString(), status: "closed",
      });
    } else {
      await db("day_settlements").insert({
        id: uuidv4(), date: target, total_sales, cash_sales, upi_sales, card_sales, credit_sales,
        total_tax: bills.reduce((s,b)=>s+b.tax,0),
        total_discount: bills.reduce((s,b)=>s+b.discount,0),
        total_expenditure, net_cash_in_register: net_cash,
        total_bills: bills.length, notes: notes||"", closed_at: new Date().toISOString(), status: "closed",
      });
    }
    // Settle all pending bills
    await db("bills").where({ date: target, status: "pending" }).update({ status: "settled" });
    res.json({ success: true, message: "Day settled and closed" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const records = await db("day_settlements").orderBy("date", "desc").limit(30);
    res.json({ success: true, data: records });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
