import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { requireAuth } from "./auth.js";

const router = Router();

async function generateUPC(clothType) {
  const prefix = clothType.replace(/\s+/g,"").substring(0,4).toUpperCase();
  const now = new Date();
  const ym = `${String(now.getFullYear()).slice(2)}${String(now.getMonth()+1).padStart(2,"0")}`;
  const count = await db("bolts").count("id as c").first();
  const seq = String((count?.c||0)+1).padStart(4,"0");
  return `SUR-${prefix}-${ym}-${seq}`;
}

// Auto-add cloth type to catalog if not present
async function syncCatalog(clothType, sellingPrice) {
  const existing = await db("cloth_catalog").where("name", clothType).first();
  if (!existing) {
    await db("cloth_catalog").insert({
      id: uuidv4(),
      name: clothType,
      default_price: sellingPrice || 0,
    });
  } else if (sellingPrice && sellingPrice !== existing.default_price) {
    // Optionally update default price
    await db("cloth_catalog").where("name", clothType).update({ default_price: sellingPrice });
  }
}

router.get("/", requireAuth, async (req,res) => {
  try {
    const { status, cloth_type, seller_id } = req.query;
    let q = db("bolts").orderBy("created_at","desc");
    if (status) q = q.where("status", status);
    if (cloth_type) q = q.where("cloth_type", cloth_type);
    if (seller_id) q = q.where("seller_id", seller_id);
    res.json({ success:true, data: await q });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.get("/summary", requireAuth, async (req,res) => {
  try {
    const bolts = await db("bolts").where("status","active");
    res.json({ success:true, data:{
      total_bolts: bolts.length,
      total_meters: bolts.reduce((s,b)=>s+b.remaining_meters,0),
      inventory_value: bolts.reduce((s,b)=>s+b.remaining_meters*b.cost_price_per_meter,0),
      selling_value: bolts.reduce((s,b)=>s+b.remaining_meters*b.selling_price_per_meter,0),
      low_stock: bolts.filter(b=>b.remaining_meters<5).length,
    }});
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

// POST /api/bolts/batch
router.post("/batch", requireAuth, async (req,res) => {
  try {
    const { seller_name, seller_phone, purchase_date, bolts } = req.body;
    if (!bolts?.length) return res.status(400).json({ success:false, error:"No bolts provided" });
    const now = new Date();
    const seller_id = seller_name ? `${seller_name.replace(/\s+/g,"-").toUpperCase()}-${Date.now()}` : null;
    const created = [];
    for (const bolt of bolts) {
      if (!bolt.cloth_type || !bolt.total_meters) continue;
      const upc = await generateUPC(bolt.cloth_type);
      const costPrice = parseFloat(bolt.cost_price_per_meter) || 0;
      // Per-bolt markup — default 90% = Cost + 90% of cost = Cost * 1.9
      const markup = parseFloat(bolt.markup_pct) ?? 90;
      const sellingPrice = bolt.selling_price_per_meter
        ? parseFloat(bolt.selling_price_per_meter)
        : Math.round(costPrice * (1 + markup / 100));

      await db("bolts").insert({
        id: upc,
        cloth_type: bolt.cloth_type,
        bolt_name: bolt.bolt_name || bolt.cloth_type,
        description: bolt.description || "",
        total_meters: parseFloat(bolt.total_meters),
        remaining_meters: parseFloat(bolt.total_meters),
        cost_price_per_meter: costPrice,
        selling_price_per_meter: sellingPrice,
        markup_pct: markup,
        color: bolt.color || "",
        seller_name: seller_name || "",
        seller_phone: seller_phone || "",
        seller_id,
        purchase_date: purchase_date || now.toISOString().split("T")[0],
        received_date: now.toISOString().split("T")[0],
        status: "active",
        created_at: now.toISOString(),
      });

      // Auto-sync to catalog
      await syncCatalog(bolt.cloth_type, sellingPrice);
      created.push(await db("bolts").where("id",upc).first());
    }
    res.status(201).json({ success:true, data:created });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.get("/recommendations", requireAuth, async (req,res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now()-30*24*60*60*1000).toISOString().split("T")[0];
    const bolts = await db("bolts").where("status","active");
    const recs = [];
    for (const bolt of bolts) {
      const sold = await db("bill_items").where("bolt_id",bolt.id)
        .join("bills","bill_items.bill_id","bills.id")
        .where("bills.date",">=",thirtyDaysAgo)
        .sum("bill_items.meters as total_sold").first();
      const soldMeters = sold?.total_sold||0;
      const soldPct = bolt.total_meters>0?(soldMeters/bolt.total_meters)*100:0;
      if (soldPct>=60||bolt.remaining_meters<5) {
        recs.push({...bolt, sold_meters:soldMeters, sold_pct:Math.round(soldPct), reason: bolt.remaining_meters<5?"Low stock":"Fast moving (>60% in 30 days)"});
      }
    }
    recs.sort((a,b)=>b.sold_pct-a.sold_pct);
    res.json({ success:true, data:recs });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.get("/:id", requireAuth, async (req,res) => {
  try {
    const bolt = await db("bolts").where("id",req.params.id).first();
    if (!bolt) return res.status(404).json({ success:false, error:"Bolt not found" });
    bolt.usage = await db("bill_items").where("bolt_id",bolt.id)
      .join("bills","bill_items.bill_id","bills.id")
      .select("bill_items.*","bills.bill_number","bills.customer_name","bills.date");
    res.json({ success:true, data:bolt });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.post("/", requireAuth, async (req,res) => {
  try {
    const { cloth_type, bolt_name, description, total_meters, cost_price_per_meter, selling_price_per_meter, markup_pct, color, seller_name, seller_phone, received_date } = req.body;
    if (!cloth_type||!total_meters) return res.status(400).json({ success:false, error:"Cloth type and meters required" });
    const upc = await generateUPC(cloth_type);
    const now = new Date();
    const costPrice = parseFloat(cost_price_per_meter)||0;
    const markup = parseFloat(markup_pct) ?? 90;
    const sellingPrice = selling_price_per_meter ? parseFloat(selling_price_per_meter) : Math.round(costPrice*(1+markup/100));
    await db("bolts").insert({
      id:upc, cloth_type, bolt_name:bolt_name||cloth_type,
      description:description||"", total_meters:parseFloat(total_meters),
      remaining_meters:parseFloat(total_meters),
      cost_price_per_meter:costPrice, selling_price_per_meter:sellingPrice,
      markup_pct:markup, color:color||"",
      seller_name:seller_name||"", seller_phone:seller_phone||"",
      received_date:received_date||now.toISOString().split("T")[0],
      status:"active", created_at:now.toISOString(),
    });
    await syncCatalog(cloth_type, sellingPrice);
    res.status(201).json({ success:true, data:await db("bolts").where("id",upc).first() });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

router.patch("/:id", requireAuth, async (req,res) => {
  try {
    const allowed = ["selling_price_per_meter","cost_price_per_meter","markup_pct","color","seller_name","status","remaining_meters","description","bolt_name"];
    const updates = {};
    for (const key of allowed) if (req.body[key]!==undefined) updates[key]=req.body[key];
    await db("bolts").where("id",req.params.id).update(updates);
    res.json({ success:true, data:await db("bolts").where("id",req.params.id).first() });
  } catch(err) { res.status(500).json({ success:false, error:err.message }); }
});

export default router;
