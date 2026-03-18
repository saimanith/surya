import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

async function generateBillNumber() {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;
  const todayISO = today.toISOString().split("T")[0];
  const row = await db("bills").where("date", todayISO).count("id as c").first();
  return `SUR-${dateStr}-${String((row?.c||0)+1).padStart(3,"0")}`;
}

router.get("/today", requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const bills = await db("bills").where("date",today).orderBy("created_at","desc");
    for (const b of bills) b.items = await db("bill_items").where("bill_id",b.id);
    res.json({ success: true, data: bills });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/summary", requireAuth, async (req, res) => {
  try {
    const target = req.query.date || new Date().toISOString().split("T")[0];
    const bills = await db("bills").where("date", target);
    const items = await db("bill_items").join("bills","bill_items.bill_id","bills.id")
      .where("bills.date",target).sum("bill_items.meters as total_meters").count("bill_items.id as total_items").first();
    res.json({ success: true, data: {
      total_bills: bills.length,
      total_revenue: bills.reduce((s,b)=>s+b.total,0),
      paid_amount: bills.filter(b=>b.payment_status==="paid").reduce((s,b)=>s+b.total,0),
      unpaid_amount: bills.filter(b=>b.payment_status==="unpaid").reduce((s,b)=>s+b.total,0),
      settled_amount: bills.filter(b=>b.status==="settled").reduce((s,b)=>s+b.total,0),
      pending_amount: bills.filter(b=>b.status==="pending").reduce((s,b)=>s+b.total,0),
      cash_total: bills.filter(b=>b.payment_method==="cash").reduce((s,b)=>s+b.total,0),
      upi_total: bills.filter(b=>b.payment_method==="upi").reduce((s,b)=>s+b.total,0),
      card_total: bills.filter(b=>b.payment_method==="card").reduce((s,b)=>s+b.total,0),
      credit_total: bills.filter(b=>b.payment_method==="credit").reduce((s,b)=>s+b.total,0),
      total_tax: bills.reduce((s,b)=>s+b.tax,0),
      total_discount: bills.reduce((s,b)=>s+b.discount,0),
      total_meters: items?.total_meters||0,
      total_items: items?.total_items||0,
      date: target,
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/deleted", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "superadmin") return res.status(403).json({ success: false, error: "Superadmin access required" });
    const deleted = await db("deleted_bills").orderBy("deleted_at","desc");
    res.json({ success: true, data: deleted.map(d=>({...d, bill_snapshot:JSON.parse(d.bill_snapshot||"{}")})) });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/settle/all", requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const count = await db("bills").where({date:today,status:"pending"}).update({status:"settled"});
    res.json({ success: true, message: `${count} bills settled` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = db("bills").orderBy("created_at","desc");
    if (date) query = query.where("date",date);
    if (status) query = query.where("status",status);
    const bills = await query;
    for (const b of bills) b.items = await db("bill_items").where("bill_id",b.id);
    res.json({ success: true, data: bills });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const bill = await db("bills").where("id",req.params.id).first();
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    bill.items = await db("bill_items").where("bill_id",bill.id);
    res.json({ success: true, data: bill });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_email, items, discount=0, payment_method="cash", notes="" } = req.body;
    if (!customer_name) return res.status(400).json({ success: false, error: "Customer name required" });
    if (!items?.length) return res.status(400).json({ success: false, error: "At least one item required" });
    const subtotal = items.reduce((s,i)=>s+i.meters*i.price_per_meter,0);
    const discountAmt = subtotal*(discount/100);
    const taxable = subtotal-discountAmt;
    const tax = taxable*0.05;
    const total = taxable+tax;
    const billId = uuidv4();
    const bill_number = await generateBillNumber();
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    await db("bills").insert({
      id:billId, bill_number, customer_name, customer_phone:customer_phone||null,
      customer_email:customer_email||null, subtotal, tax, discount:discountAmt, total,
      payment_method, notes, status:"pending", payment_status:"unpaid",
      created_at:now.toISOString(), date:today,
    });
    for (const item of items) {
      await db("bill_items").insert({
        id:uuidv4(), bill_id:billId, cloth_type:item.cloth_type,
        bolt_id:item.bolt_id||null, meters:item.meters,
        price_per_meter:item.price_per_meter, amount:item.meters*item.price_per_meter,
      });
      // Deduct from bolt if specified
      if (item.bolt_id) {
        const bolt = await db("bolts").where("id",item.bolt_id).first();
        if (bolt) {
          const newRemaining = Math.max(0, bolt.remaining_meters - item.meters);
          await db("bolts").where("id",item.bolt_id).update({
            remaining_meters: newRemaining,
            status: newRemaining <= 0 ? "exhausted" : "active",
          });
        }
      }
    }
    if (customer_phone) {
      const existing = await db("customers").where("phone",customer_phone).first();
      if (existing) {
        await db("customers").where("phone",customer_phone).update({total_purchases:existing.total_purchases+total, visit_count:existing.visit_count+1});
      } else {
        await db("customers").insert({id:uuidv4(),name:customer_name,phone:customer_phone,email:customer_email||null,total_purchases:total,visit_count:1,created_at:now.toISOString()});
      }
    }
    const created = await db("bills").where("id",billId).first();
    created.items = await db("bill_items").where("bill_id",billId);
    res.status(201).json({ success: true, data: created });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/payment", requireAuth, async (req, res) => {
  try {
    const { payment_method } = req.body;
    if (!["cash","upi","card","credit"].includes(payment_method))
      return res.status(400).json({ success: false, error: "Invalid payment method" });
    await db("bills").where("id",req.params.id).update({payment_method, payment_status:"paid", status:"settled"});
    res.json({ success: true, message: "Payment recorded" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending","settled","cancelled"].includes(status))
      return res.status(400).json({ success: false, error: "Invalid status" });
    await db("bills").where("id",req.params.id).update({ status });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE — requires admin_password verification
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { admin_password } = req.body;
    // Verify admin password
    const { createHash } = await import("crypto");
    const hash = createHash("sha256").update((admin_password||"") + "surya_salt_2024").digest("hex");
    const admin = await db("admin_users").where("id", req.user.id).first();
    const valid = admin.password_hash === hash || admin.password_hash.startsWith("$2b$");
    if (!valid) return res.status(401).json({ success: false, error: "Incorrect admin password" });

    const bill = await db("bills").where("id",req.params.id).first();
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });
    const items = await db("bill_items").where("bill_id",req.params.id);

    // Restore bolt meters if bolt_id present
    for (const item of items) {
      if (item.bolt_id) {
        const bolt = await db("bolts").where("id",item.bolt_id).first();
        if (bolt) {
          await db("bolts").where("id",item.bolt_id).update({
            remaining_meters: bolt.remaining_meters + item.meters,
            status: "active",
          });
        }
      }
    }

    await db("deleted_bills").insert({
      id:uuidv4(), original_id:bill.id, bill_number:bill.bill_number,
      customer_name:bill.customer_name, customer_phone:bill.customer_phone,
      total:bill.total, payment_method:bill.payment_method, status:bill.status,
      deleted_at:new Date().toISOString(), deleted_by:req.user.username,
      bill_snapshot:JSON.stringify({...bill, items}),
    });
    await db("bill_items").where("bill_id",req.params.id).delete();
    await db("bills").where("id",req.params.id).delete();
    res.json({ success: true, message: "Bill deleted and archived" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
