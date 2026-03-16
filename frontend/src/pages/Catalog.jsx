import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0);
}

const CLOTH_COLORS = ["#F97316","#E11D48","#0D9488","#7C3AED","#D97706","#059669","#2563EB","#DB2777","#0891B2","#65A30D","#DC2626","#9333EA","#0284C7","#16A34A"];

export default function Catalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const load = () => api.getCatalog().then(setCatalog).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) { alert("Cloth name is required"); return; }
    setAdding(true);
    try {
      await api.addCloth({ name: newName.trim(), default_price: parseFloat(newPrice) || 0 });
      setNewName(""); setNewPrice(""); load();
    } catch (err) { alert(err.message); }
    finally { setAdding(false); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-accent" />
        <h1 className="page-title">Cloth Catalog</h1>
        <p className="page-subtitle">Manage cloth types and default prices · {catalog.length} items</p>
      </div>

      {/* Add new */}
      <div className="card mb-2">
        <div className="card-title">➕ Add New Cloth Type</div>
        <div className="flex gap-2" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: "160px" }}>
            <label className="label">Cloth Name</label>
            <input className="input" value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Rayon, Organza…" onKeyDown={e => e.key === "Enter" && handleAdd()} />
          </div>
          <div style={{ flex: 1, minWidth: "130px" }}>
            <label className="label">Default Price / Meter (₹)</label>
            <input className="input" type="number" min="0" value={newPrice}
              onChange={e => setNewPrice(e.target.value)} placeholder="0.00"
              onKeyDown={e => e.key === "Enter" && handleAdd()} />
          </div>
          <button className="btn btn-primary" onClick={handleAdd} disabled={adding} style={{ flexShrink: 0 }}>
            {adding ? "Adding…" : "+ Add Cloth"}
          </button>
        </div>
      </div>

      {/* Catalog grid */}
      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
          {catalog.map((c, i) => {
            const color = CLOTH_COLORS[i % CLOTH_COLORS.length];
            return (
              <div key={c.id} style={{
                background: "#FFFFFF", border: "1.5px solid var(--border-soft)",
                borderRadius: "var(--radius)", padding: "1.3rem",
                boxShadow: "var(--shadow-sm)", transition: "all 0.2s",
                borderTop: `4px solid ${color}`,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
              >
                <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>🧵</div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text)", marginBottom: "0.3rem" }}>{c.name}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color, fontWeight: 700 }}>{fmt(c.default_price)}<span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontWeight: 400 }}>/m</span></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
