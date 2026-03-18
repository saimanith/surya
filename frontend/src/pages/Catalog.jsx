import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0); }

const SWATCH_COLORS = [
  { bg: "linear-gradient(135deg,#FFF7ED,#FED7AA)", border: "#FDBA74", accent: "#EA580C", pattern: "stripe" },
  { bg: "linear-gradient(135deg,#FDF2F8,#FCE7F3)", border: "#F9A8D4", accent: "#DB2777", pattern: "dot" },
  { bg: "linear-gradient(135deg,#F0FDF4,#BBF7D0)", border: "#86EFAC", accent: "#16A34A", pattern: "check" },
  { bg: "linear-gradient(135deg,#EFF6FF,#BFDBFE)", border: "#93C5FD", accent: "#2563EB", pattern: "stripe" },
  { bg: "linear-gradient(135deg,#F5F3FF,#DDD6FE)", border: "#C4B5FD", accent: "#7C3AED", pattern: "dot" },
  { bg: "linear-gradient(135deg,#FFFBEB,#FDE68A)", border: "#FCD34D", accent: "#D97706", pattern: "check" },
  { bg: "linear-gradient(135deg,#F0FDFA,#99F6E4)", border: "#5EEAD4", accent: "#0D9488", pattern: "stripe" },
  { bg: "linear-gradient(135deg,#FFF1F2,#FECDD3)", border: "#FDA4AF", accent: "#E11D48", pattern: "dot" },
  { bg: "linear-gradient(135deg,#ECFDF5,#A7F3D0)", border: "#6EE7B7", accent: "#059669", pattern: "check" },
  { bg: "linear-gradient(135deg,#FEF3C7,#FDE68A)", border: "#FCD34D", accent: "#B45309", pattern: "stripe" },
  { bg: "linear-gradient(135deg,#F0F9FF,#BAE6FD)", border: "#7DD3FC", accent: "#0284C7", pattern: "dot" },
  { bg: "linear-gradient(135deg,#FDF4FF,#E9D5FF)", border: "#D8B4FE", accent: "#9333EA", pattern: "check" },
];

function SwatchPattern({ type, color }) {
  if (type === "stripe") return (
    <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(-45deg,transparent,transparent 6px,${color}15 6px,${color}15 7px)`, borderRadius: "inherit", pointerEvents: "none" }} />
  );
  if (type === "dot") return (
    <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(${color}20 1px,transparent 1px)`, backgroundSize: "10px 10px", borderRadius: "inherit", pointerEvents: "none" }} />
  );
  return (
    <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${color}12 1px,transparent 1px),linear-gradient(90deg,${color}12 1px,transparent 1px)`, backgroundSize: "12px 12px", borderRadius: "inherit", pointerEvents: "none" }} />
  );
}

export default function Catalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = () => api.getCatalog().then(setCatalog).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) { alert("Cloth name is required"); return; }
    setAdding(true);
    try { await api.addCloth({ name: newName.trim(), default_price: parseFloat(newPrice) || 0 }); setNewName(""); setNewPrice(""); setShowForm(false); load(); }
    catch (err) { alert(err.message); } finally { setAdding(false); }
  };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <div className="page-accent"><span /><span /><span /><span /></div>
          <h1 className="page-title">Cloth Catalog</h1>
          <p className="page-subtitle">Your fabric collection · {catalog.length} cloth types</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Cloth</button>
      </div>

      {showForm && (
        <div className="card mb-2" style={{ borderColor: "#FDBA74", background: "linear-gradient(135deg,#FFFBF0,#FFF7ED)", animation: "fadeUp 0.25s ease" }}>
          <div className="card-title">🧵 Add New Cloth Type</div>
          <div className="flex gap-2" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: "160px" }}>
              <label className="label">Cloth Name</label>
              <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Rayon, Organza, Ikat…" onKeyDown={e => e.key === "Enter" && handleAdd()} autoFocus />
            </div>
            <div style={{ flex: 1, minWidth: "140px" }}>
              <label className="label">Default Price / Meter (₹)</label>
              <input className="input" type="number" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0.00" onKeyDown={e => e.key === "Enter" && handleAdd()} />
            </div>
            <button className="btn btn-primary" onClick={handleAdd} disabled={adding}>{adding ? "Adding…" : "+ Add"}</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))", gap: "1.1rem" }}>
          {catalog.map((c, i) => {
            const swatch = SWATCH_COLORS[i % SWATCH_COLORS.length];
            return (
              <div key={c.id} className="stagger-item" style={{
                background: swatch.bg, border: `1.5px solid ${swatch.border}`,
                borderRadius: "var(--r-lg)", padding: "1.4rem 1.2rem",
                cursor: "default", transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: "var(--shadow-xs)", position: "relative", overflow: "hidden",
                animationDelay: `${(i % 6) * 0.06}s`,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px) rotate(-1deg)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
              >
                <SwatchPattern type={swatch.pattern} color={swatch.accent} />
                {/* Fabric fold corner */}
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 0, height: 0, borderStyle: "solid", borderWidth: "0 20px 20px 0", borderColor: `transparent ${swatch.border} transparent transparent` }} />
                <div style={{ fontSize: "1.8rem", marginBottom: "0.7rem" }}>🧵</div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--ink)", marginBottom: "0.4rem", fontFamily: "var(--font-display)" }}>{c.name}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: swatch.accent, fontWeight: 700 }}>
                  {fmt(c.default_price)}<span style={{ fontSize: "0.65rem", color: "var(--ink-muted)", fontFamily: "var(--font-body)", fontWeight: 400 }}>/m</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
