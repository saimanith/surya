import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function fmt(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0); }

// Cloth pattern SVG accent
function WovenAccent() {
  return (
    <div className="page-accent">
      <span /><span /><span /><span />
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  useEffect(() => {
    Promise.all([api.getSummary(), api.getTodayBills()])
      .then(([s, b]) => { setSummary(s); setRecentBills(b.slice(0, 6)); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /><span style={{ color: "var(--ink-muted)", fontSize: "0.9rem" }}>Loading your store…</span></div>;

  const stats = [
    { label: "Today's Revenue",  value: fmt(summary?.total_revenue),  cls: "orange", icon: "💰" },
    { label: "Bills Today",       value: summary?.total_bills || 0,    cls: "violet", icon: "🧾" },
    { label: "Settled",           value: fmt(summary?.settled_amount), cls: "green",  icon: "✅" },
    { label: "Pending",           value: fmt(summary?.pending_amount), cls: "red",    icon: "⏳" },
    { label: "Meters Sold",       value: `${(summary?.total_meters || 0).toFixed(1)}m`, cls: "teal", icon: "📏" },
    { label: "Total Items",       value: summary?.total_items || 0,    cls: "amber",  icon: "🧵" },
  ];

  const quickActions = [
    { icon: "🧾", label: "New Bill",   desc: "Start billing a customer",    path: "/billing/new", grad: "linear-gradient(135deg,#FFF7ED,#FFEDD5)", border: "#FDBA74", color: "#EA580C" },
    { icon: "📊", label: "Settlement", desc: "Close today's accounts",      path: "/settlement",  grad: "linear-gradient(135deg,#F0FDFA,#CCFBF1)", border: "#5EEAD4", color: "#0D9488" },
    { icon: "💸", label: "Expenses",   desc: "Track expenditures & lending",path: "/expenditures",grad: "linear-gradient(135deg,#FFF1F2,#FFE4E6)", border: "#FDA4AF", color: "#E11D48" },
    { icon: "🧵", label: "Catalog",    desc: "Manage cloth types & prices", path: "/catalog",     grad: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", border: "#C4B5FD", color: "#7C3AED" },
  ];

  return (
    <div className="page">
      {/* Hero Header */}
      <div className="page-header">
        <WovenAccent />
        <div className="flex-between">
          <div>
            <h1 className="page-title">{greeting} 🌅</h1>
            <p className="page-subtitle">{today}</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => navigate("/billing/new")} style={{ fontSize: "1rem" }}>
            + New Bill
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map(({ label, value, cls, icon }) => (
          <div className={`stat-card ${cls}`} key={label}>
            <div className="stat-label">{icon} {label}</div>
            <div className={`stat-value ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Recent Bills */}
      <div className="flex-between mb-2">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--ink)", fontWeight: 600 }}>Recent Bills</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/bills")}>View All →</button>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: "2rem" }}>
        {recentBills.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🧾</div>
            <p>No bills today — create your first one!</p>
            <button className="btn btn-primary mt-2" onClick={() => navigate("/billing/new")}>Create Bill</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Bill #</th><th>Customer</th><th>Items</th><th>Time</th><th className="text-right">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentBills.map((bill, i) => (
                  <tr key={bill.id} className="stagger-item" style={{ cursor: "pointer" }} onClick={() => navigate(`/bills/${bill.id}`)}>
                    <td style={{ color: "var(--saffron)", fontWeight: 700, fontSize: "0.8rem", fontFamily: "var(--font-display)" }}>{bill.bill_number}</td>
                    <td style={{ fontWeight: 600 }}>{bill.customer_name}</td>
                    <td className="text-muted text-sm">{bill.items?.length || 0} item{bill.items?.length !== 1 ? "s" : ""}</td>
                    <td className="text-muted text-sm">{new Date(bill.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="text-right" style={{ fontFamily: "var(--font-display)", color: "var(--saffron)", fontWeight: 700, fontSize: "1rem" }}>{fmt(bill.total)}</td>
                    <td><span className={`badge badge-${bill.status}`}>{bill.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "var(--ink)", fontWeight: 600, marginBottom: "1rem" }}>Quick Actions</h2>
      <div className="grid-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {quickActions.map(({ icon, label, desc, path, grad, border, color }, i) => (
          <button key={path} onClick={() => navigate(path)}
            className="stagger-item"
            style={{
              background: grad, border: `1.5px solid ${border}`,
              borderRadius: "var(--r-lg)", padding: "1.4rem 1.5rem",
              textAlign: "left", cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              boxShadow: "var(--shadow-sm)", animationDelay: `${i * 0.08}s`,
              position: "relative", overflow: "hidden",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-5px) scale(1.02)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; e.currentTarget.style.borderColor = color; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.borderColor = border; }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.7rem" }}>{icon}</div>
            <div style={{ fontFamily: "var(--font-display)", color, fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.25rem" }}>{label}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
