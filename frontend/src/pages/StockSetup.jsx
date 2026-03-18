import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function fmt(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0); }

const EMPTY_ROW = (id) => ({ id, cloth_type: "", total_meters: "", cost_price_per_meter: "", selling_price_per_meter: "", color: "", supplier: "" });

export default function StockSetup() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [rows, setRows] = useState([EMPTY_ROW(1), EMPTY_ROW(2), EMPTY_ROW(3)]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => { api.getCatalog().then(setCatalog).catch(console.error); }, []);

  const updateRow = (id, field, val) => setRows(p => p.map(r => r.id === id ? { ...r, [field]: val } : r));
  const addRow = () => setRows(p => [...p, EMPTY_ROW(Date.now())]);
  const removeRow = (id) => setRows(p => p.filter(r => r.id !== id));

  const totalValue = rows.reduce((s, r) => {
    const m = parseFloat(r.total_meters) || 0;
    const c = parseFloat(r.cost_price_per_meter) || 0;
    return s + m * c;
  }, 0);

  const handleSave = async () => {
    const validRows = rows.filter(r => r.cloth_type && parseFloat(r.total_meters) > 0);
    if (validRows.length === 0) { alert("Add at least one cloth bolt with type and meters"); return; }

    setSaving(true);
    const results = [];
    const errs = {};
    for (const row of validRows) {
      try {
        const bolt = await api.addBolt({
          cloth_type: row.cloth_type,
          total_meters: parseFloat(row.total_meters),
          cost_price_per_meter: parseFloat(row.cost_price_per_meter) || 0,
          selling_price_per_meter: parseFloat(row.selling_price_per_meter) || 0,
          color: row.color || "",
          supplier: row.supplier || "",
          received_date: new Date().toISOString().split("T")[0],
        });
        results.push(bolt);
      } catch (err) {
        errs[row.id] = err.message;
      }
    }
    setSaved(results);
    setErrors(errs);
    setSaving(false);
    if (results.length > 0 && Object.keys(errs).length === 0) {
      setTimeout(() => navigate("/inventory"), 2000);
    }
  };

  if (saved.length > 0 && Object.keys(errors).length === 0) {
    return (
      <div className="page" style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: "1rem", animation: "float 3s ease-in-out infinite" }}>📦</div>
        <h1 className="page-title" style={{ marginBottom: "0.5rem" }}>Stock Added!</h1>
        <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
          {saved.length} bolt{saved.length !== 1 ? "s" : ""} added to inventory. Redirecting…
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 400, margin: "0 auto" }}>
          {saved.map(b => (
            <div key={b.id} style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "var(--r-sm)", padding: "0.6rem 1rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ fontWeight: 700, color: "var(--jade)" }}>{b.id}</span>
              <span>{b.cloth_type} · {b.total_meters}m</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-accent"><span /><span /><span /><span /></div>
        <div className="flex-between">
          <div>
            <h1 className="page-title">Stock Setup</h1>
            <p className="page-subtitle">Enter your existing inventory — all bolts of cloth currently in your store</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => navigate("/inventory")}>Skip for now</button>
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
              {saving ? "⏳ Saving…" : `💾 Save ${rows.filter(r => r.cloth_type && r.total_meters).length} Bolts`}
            </button>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ background: "linear-gradient(135deg, #FFF7ED, #FFF3DC)", border: "2px solid #FDE68A", borderRadius: "var(--r-lg)", padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
        <div><div className="stat-label">Bolts to Add</div><div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--saffron)" }}>{rows.filter(r => r.cloth_type && r.total_meters).length}</div></div>
        <div><div className="stat-label">Total Stock Value (Cost)</div><div style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 800, color: "var(--jade)" }}>{fmt(totalValue)}</div></div>
        <div style={{ marginLeft: "auto" }}>
          <div className="stat-label">Tip</div>
          <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", maxWidth: "220px" }}>Each row = one bolt. If you have 3 bolts of cotton, add 3 rows.</div>
        </div>
      </div>

      {/* Spreadsheet-style table */}
      <div className="card" style={{ padding: 0, overflow: "visible" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: "900px" }}>
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th style={{ width: "180px" }}>Cloth Type *</th>
                <th style={{ width: "110px" }}>Total Meters *</th>
                <th style={{ width: "140px" }}>Cost Price / m (₹)</th>
                <th style={{ width: "140px" }}>Selling Price / m (₹)</th>
                <th style={{ width: "130px" }}>Color / Shade</th>
                <th style={{ width: "130px" }}>Supplier</th>
                <th style={{ width: "50px" }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} style={{ background: errors[row.id] ? "#FFF1F2" : "inherit" }}>
                  <td className="text-muted text-sm" style={{ textAlign: "center", fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: "0.4rem 0.5rem" }}>
                    <input list={`clist-${row.id}`} className="input" style={{ fontSize: "0.85rem", padding: "0.5rem 0.7rem" }}
                      value={row.cloth_type}
                      onChange={e => {
                        updateRow(row.id, "cloth_type", e.target.value);
                        // Auto-fill selling price from catalog
                        const match = catalog.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                        if (match && !row.selling_price_per_meter) updateRow(row.id, "selling_price_per_meter", String(match.default_price));
                      }}
                      placeholder="e.g. Cotton" />
                    <datalist id={`clist-${row.id}`}>{catalog.map(c => <option key={c.id} value={c.name} />)}</datalist>
                    {errors[row.id] && <div style={{ fontSize: "0.68rem", color: "var(--rose-dk)", marginTop: "0.2rem" }}>⚠️ {errors[row.id]}</div>}
                  </td>
                  {["total_meters", "cost_price_per_meter", "selling_price_per_meter"].map(field => (
                    <td key={field} style={{ padding: "0.4rem 0.5rem" }}>
                      <input className="input" type="number" min="0" style={{ fontSize: "0.85rem", padding: "0.5rem 0.7rem" }}
                        value={row[field]} onChange={e => updateRow(row.id, field, e.target.value)}
                        placeholder={field === "total_meters" ? "e.g. 50" : "0.00"} />
                    </td>
                  ))}
                  {["color", "supplier"].map(field => (
                    <td key={field} style={{ padding: "0.4rem 0.5rem" }}>
                      <input className="input" style={{ fontSize: "0.85rem", padding: "0.5rem 0.7rem" }}
                        value={row[field]} onChange={e => updateRow(row.id, field, e.target.value)}
                        placeholder={field === "color" ? "Navy Blue" : "Supplier name"} />
                    </td>
                  ))}
                  <td style={{ padding: "0.4rem 0.5rem", textAlign: "center" }}>
                    {rows.length > 1 && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeRow(row.id)} style={{ padding: "0.3rem 0.5rem" }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: "0.8rem 1rem", borderTop: "1px solid var(--border-soft)" }}>
          <button className="btn btn-ghost" onClick={addRow}>+ Add Row</button>
        </div>
      </div>
    </div>
  );
}
