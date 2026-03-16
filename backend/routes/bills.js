import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";

const router = Router();

async function generateBillNumber() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;
  const todayISO = today.toISOString().split("T")[0];
  const row = await db("bills").where("date", todayISO).count("id as c").first();
  const count = (row?.c || 0) + 1;
  return `VAS-${dateStr}-${String(count).padStart(3,"0")}`;
}

// GET /api/bills/today
router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const bills = await db("bills").where("date", today).orderBy("created_at", "desc");
    for (const b of bills) b.items = await db("bill_items").where("bill_id", b.id);
    res.json({ success: true, data: bills });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/bills/summary
router.get("/summary", async (req, res) => {
  try {
    const target = req.query.date || new Date().toISOString().split("T")[0];
    const bills = await db("bills").where("date", target);
    const items = await db("bill_items")
      .join("bills", "bill_items.bill_id", "bills.id")
      .where("bills.date", target)
      .sum("bill_items.meters as total_meters")
      .count("bill_items.id as total_items")
      .first();

    const total_revenue = bills.reduce((s, b) => s + b.total, 0);
    const settled_amount = bills.filter(b => b.status === "settled").reduce((s, b) => s + b.total, 0);
    const pending_amount = bills.filter(b => b.status === "pending").reduce((s, b) => s + b.total, 0);
    const total_tax = bills.reduce((s, b) => s + b.tax, 0);
    const total_discount = bills.reduce((s, b) => s + b.discount, 0);

    res.json({ success: true, data: {
      total_bills: bills.length, total_revenue, settled_amount, pending_amount,
      total_tax, total_discount,
      total_meters: items?.total_meters || 0,
      total_items: items?.total_items || 0,
      date: target,
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/bills/settle/all  — must be before /:id
router.patch("/settle/all", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const count = await db("bills").where({ date: today, status: "pending" }).update({ status: "settled" });
    res.json({ success: true, message: `${count} bills settled` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/bills
router.get("/", async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = db("bills").orderBy("created_at", "desc");
    if (date) query = query.where("date", date);
    if (status) query = query.where("status", status);
    const bills = await query;
    for (const b of bills) b.items = await db("bill_items").where("bill_id", b.id);
    res.json({ success: true, data: bills });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/bills/:id
router.get("/:id", async (req, res) => {
  try {
    const bill = await db("bills").where("id", req.params.id).first();
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    bill.items = await db("bill_items").where("bill_id", bill.id);
    res.json({ success: true, data: bill });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/bills
router.post("/", async (req, res) => {
  try {
    const { customer_name, customer_phone, items, discount = 0, payment_method = "cash", notes = "" } = req.body;
    if (!customer_name) return res.status(400).json({ success: false, error: "Customer name is required" });
    if (!items?.length) return res.status(400).json({ success: false, error: "At least one item is required" });

    const subtotal = items.reduce((s, i) => s + i.meters * i.price_per_meter, 0);
    const discountAmt = subtotal * (discount / 100);
    const taxable = subtotal - discountAmt;
    const tax = taxable * 0.05;
    const total = taxable + tax;

    const billId = uuidv4();
    const bill_number = await generateBillNumber();
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    await db("bills").insert({
      id: billId, bill_number,
      customer_name, customer_phone: customer_phone || null,
      subtotal, tax, discount: discountAmt, total,
      payment_method, notes, status: "pending",
      created_at: now.toISOString(), date: today,
    });

    for (const item of items) {
      await db("bill_items").insert({
        id: uuidv4(), bill_id: billId,
        cloth_type: item.cloth_type,
        meters: item.meters,
        price_per_meter: item.price_per_meter,
        amount: item.meters * item.price_per_meter,
      });
    }

    // Upsert customer
    if (customer_phone) {
      const existing = await db("customers").where("phone", customer_phone).first();
      if (existing) {
        await db("customers").where("phone", customer_phone).update({
          total_purchases: existing.total_purchases + total,
          visit_count: existing.visit_count + 1,
        });
      } else {
        await db("customers").insert({
          id: uuidv4(), name: customer_name, phone: customer_phone,
          total_purchases: total, visit_count: 1, created_at: now.toISOString(),
        });
      }
    }

    const created = await db("bills").where("id", billId).first();
    created.items = await db("bill_items").where("bill_id", billId);
    res.status(201).json({ success: true, data: created });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/bills/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "settled", "cancelled"].includes(status))
      return res.status(400).json({ success: false, error: "Invalid status" });
    await db("bills").where("id", req.params.id).update({ status });
    res.json({ success: true, message: `Bill marked as ${status}` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/bills/:id
router.delete("/:id", async (req, res) => {
  try {
    await db("bill_items").where("bill_id", req.params.id).delete();
    await db("bills").where("id", req.params.id).delete();
    res.json({ success: true, message: "Bill deleted" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
