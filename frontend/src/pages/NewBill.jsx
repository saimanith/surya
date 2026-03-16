import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

const EMPTY_ITEM = () => ({ id: Date.now() + Math.random(), cloth_type: "", meters: "", price_per_meter: "" });

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0);
}

export default function NewBill() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [saving, setSaving] = useState(false);
  const [customer_name, setCustomerName] = useState("");
  const [customer_phone, setCustomerPhone] = useState("");
  const [payment_method, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([EMPTY_ITEM()]);

  useEffect(() => { api.getCatalog().then(setCatalog).catch(console.error); }, []);

  const updateItem = (id, field, val) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));

  const setClothType = (id, name) => {
    const cloth = catalog.find(c => c.name === name);
    setItems(prev => prev.map(i => i.id === id ? {
      ...i, cloth_type: name,
      price_per_meter: cloth?.default_price !== undefined ? String(cloth.default_price) : i.price_per_meter
    } : i));
  };

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.meters) || 0) * (parseFloat(i.price_per_meter) || 0), 0);
  const discountAmt = subtotal * ((parseFloat(discount) || 0) / 100);
  const taxable = subtotal - discountAmt;
  const tax = taxable * 0.05;
  const total = taxable + tax;

  const handleSave = async () => {
    if (!customer_name.trim()) { alert("Customer name is required"); return; }
    const validItems = items.filter(i => i.cloth_type && parseFloat(i.meters) > 0 && parseFloat(i.price_per_meter) > 0);
    if (validItems.length === 0) { alert("Add at least one valid item"); return; }
    setSaving(true);
    try {
      const bill = await api.createBill({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim() || null,
        payment_method, discount: parseFloat(discount) || 0, notes,
        items: validItems.map(i => ({
          cloth_type: i.cloth_type,
          meters: parseFloat(i.meters),
          price_per_meter: parseFloat(i.price_per_meter),
        })),
      });
      navigate(`/bills/${bill.id}`);
    } catch (err) {
      alert("Error saving bill: " + err.message);
    } finally { setSaving(false); }
  };

  const paymentIcons = { cash: "💵", upi: "📱", card: "💳", credit: "📝" };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <div className="page-accent" />
          <h1 className="page-title">New Bill</h1>
          <p className="page-subtitle">{new Date().toLocaleString("en-IN")}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost no-print" onClick={() => navigate("/bills")}>Cancel</button>
          <button className="btn btn-primary btn-lg no-print" onClick={handleSave} disabled={saving}>
            {saving ? "⏳ Saving…" : "💾 Save Bill"}
          </button>
        </div>
      </div>

      {/* Customer Details */}
      <div className="card mb-2">
        <div className="card-title">👤 Customer Details</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="label">Customer Name *</label>
            <input className="input" value={customer_name} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
          </div>
          <div className="form-group">
            <label className="label">Phone Number</label>
            <input className="input" value={customer_phone} onChange={e => setCustomerPhone(e.target.value)} placeholder="e.g. 9876543210" maxLength={10} />
          </div>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label className="label">Payment Method</label>
            <select className="input" value={payment_method} onChange={e => setPaymentMethod(e.target.value)}>
              {["cash","upi","card","credit"].map(m => (
                <option key={m} value={m}>{paymentIcons[m]} {m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Discount (%)</label>
            <input className="input" type="number" min="0" max="100" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="label">Notes</label>
          <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special notes…" />
        </div>
      </div>

      {/* Items */}
      <div className="card mb-2">
        <div className="card-title">🧵 Cloth Items</div>
        {items.map((item, idx) => {
          const amount = (parseFloat(item.meters) || 0) * (parseFloat(item.price_per_meter) || 0);
          return (
            <div key={item.id} className="item-row">
              <div className="flex-between mb-1">
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--saffron)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Item #{idx + 1}
                </span>
                {items.length > 1 && (
                  <button className="btn btn-danger btn-sm" onClick={() => setItems(p => p.filter(i => i.id !== item.id))}>✕ Remove</button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.2fr 1fr", gap: "0.8rem", alignItems: "end" }}>
                <div>
                  <label className="label">Cloth Type</label>
                  <input list={`cloth-list-${item.id}`} className="input"
                    value={item.cloth_type} onChange={e => setClothType(item.id, e.target.value)} placeholder="Select or type cloth…" />
                  <datalist id={`cloth-list-${item.id}`}>
                    {catalog.map(c => <option key={c.id} value={c.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="label">Meters</label>
                  <input className="input" type="number" min="0" step="0.25" value={item.meters}
                    onChange={e => updateItem(item.id, "meters", e.target.value)} placeholder="0.0" />
                </div>
                <div>
                  <label className="label">₹ Price / Meter</label>
                  <input className="input" type="number" min="0" value={item.price_per_meter}
                    onChange={e => updateItem(item.id, "price_per_meter", e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Amount</label>
                  <div style={{
                    padding: "0.65rem 1rem", background: amount > 0 ? "var(--saffron-pale)" : "var(--cream-deep)",
                    borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)",
                    fontFamily: "var(--font-display)", fontWeight: 700,
                    color: amount > 0 ? "var(--saffron)" : "var(--text-dim)", fontSize: "0.95rem"
                  }}>
                    {fmt(amount)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <button className="btn btn-ghost w-full" style={{ borderStyle: "dashed", marginTop: "0.5rem" }}
          onClick={() => setItems(p => [...p, EMPTY_ITEM()])}>
          + Add Another Item
        </button>
      </div>

      {/* Bill Summary */}
      <div className="total-box">
        <div className="card-title" style={{ marginBottom: "1rem" }}>🧮 Bill Summary</div>
        <div style={{ maxWidth: "340px", marginLeft: "auto" }}>
          <div className="flex-between mb-1" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            <span>Subtotal</span><span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
          </div>
          {parseFloat(discount) > 0 && (
            <div className="flex-between mb-1" style={{ color: "var(--rose)", fontSize: "0.9rem" }}>
              <span>Discount ({discount}%)</span><span style={{ fontWeight: 600 }}>− {fmt(discountAmt)}</span>
            </div>
          )}
          <div className="flex-between mb-1" style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            <span>GST (5%)</span><span style={{ fontWeight: 600 }}>{fmt(tax)}</span>
          </div>
          <div className="divider" />
          <div className="flex-between">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", fontWeight: 700 }}>TOTAL AMOUNT</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "var(--saffron)", fontWeight: 700 }}>{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
