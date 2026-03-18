import { Router } from "express";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0);
}

function buildBillHTML(bill) {
  const itemRows = bill.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #F0E4D0;">${item.cloth_type}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0E4D0;text-align:right;">${item.meters} m</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0E4D0;text-align:right;">${formatINR(item.price_per_meter)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #F0E4D0;text-align:right;font-weight:700;color:#EA580C;">${formatINR(item.amount)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FDFAF5;font-family:'DM Sans',Arial,sans-serif;color:#1C1008;">
  <div style="max-width:580px;margin:32px auto;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(120,70,20,.15);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#150900 0%,#1A0B02 100%);padding:32px 36px;position:relative;">
      <div style="display:inline-block;background:linear-gradient(135deg,#F97316,#F59E0B);border-radius:50%;width:48px;height:48px;text-align:center;line-height:48px;font-size:24px;margin-bottom:12px;">🌅</div>
      <h1 style="font-size:28px;font-weight:800;color:#FFFFFF;letter-spacing:.08em;margin:0 0 4px;">SURYA</h1>
      <p style="color:#F97316;font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin:0;">Cloth Store · Bill Receipt</p>
    </div>

    <!-- Bill info -->
    <div style="padding:28px 36px;background:#FFFBF0;border-bottom:2px solid #FDE68A;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="font-size:11px;font-weight:700;color:#A8845A;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Bill Number</div>
          <div style="font-size:18px;font-weight:800;color:#EA580C;">${bill.bill_number}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#A8845A;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Date</div>
          <div style="font-size:15px;font-weight:600;">${new Date(bill.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#A8845A;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Customer</div>
          <div style="font-size:15px;font-weight:600;">${bill.customer_name}</div>
          ${bill.customer_phone ? `<div style="font-size:13px;color:#7A5C38;">${bill.customer_phone}</div>` : ""}
        </div>
      </div>
    </div>

    <!-- Items table -->
    <div style="padding:24px 36px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#F7EDD8;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700;color:#7A5C38;letter-spacing:.1em;text-transform:uppercase;">Cloth</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#7A5C38;letter-spacing:.1em;text-transform:uppercase;">Meters</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#7A5C38;letter-spacing:.1em;text-transform:uppercase;">Rate</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700;color:#7A5C38;letter-spacing:.1em;text-transform:uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
    </div>

    <!-- Totals -->
    <div style="padding:0 36px 28px;">
      <div style="background:#FFFDF5;border:2px solid #FDE68A;border-radius:14px;padding:20px 24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#6B4C28;">
          <span>Subtotal</span><span style="font-weight:600;">${formatINR(bill.subtotal)}</span>
        </div>
        ${bill.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#E11D48;"><span>Discount</span><span style="font-weight:600;">− ${formatINR(bill.discount)}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px;color:#6B4C28;">
          <span>GST (5%)</span><span style="font-weight:600;">${formatINR(bill.tax)}</span>
        </div>
        <div style="border-top:1px solid #FDE68A;padding-top:12px;display:flex;justify-content:space-between;">
          <span style="font-size:16px;font-weight:800;color:#1C1008;">TOTAL</span>
          <span style="font-size:28px;font-weight:800;color:#EA580C;">${formatINR(bill.total)}</span>
        </div>
        <div style="margin-top:8px;font-size:12px;color:#A8845A;text-transform:capitalize;">Payment: ${bill.payment_method} · ${bill.payment_status === "paid" ? "✅ Paid" : "⏳ Pending"}</div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#150900;padding:20px 36px;text-align:center;">
      <p style="color:#F9731360;font-size:12px;margin:0;">Thank you for shopping at Surya Cloth Store</p>
      <p style="color:#FFFFFF20;font-size:11px;margin:6px 0 0;">This is an auto-generated receipt.</p>
    </div>
  </div>
</body>
</html>`;
}

// POST /api/email/bill/:id
router.post("/bill/:id", requireAuth, async (req, res) => {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return res.status(503).json({ success: false, error: "Email not configured. Set RESEND_API_KEY in environment variables." });
    }

    const bill = await db("bills").where("id", req.params.id).first();
    if (!bill) return res.status(404).json({ success: false, error: "Bill not found" });

    const toEmail = req.body.email || bill.customer_email;
    if (!toEmail) return res.status(400).json({ success: false, error: "No email address provided" });

    bill.items = await db("bill_items").where("bill_id", bill.id);

    const html = buildBillHTML(bill);

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Surya Cloth Store <onboarding@resend.dev>",
        to: [toEmail],
        subject: `Your Bill from Surya Cloth Store — ${bill.bill_number}`,
        html,
      }),
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      return res.status(500).json({ success: false, error: emailData.message || "Failed to send email" });
    }

    res.json({ success: true, message: `Bill sent to ${toEmail}`, data: { id: emailData.id } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
