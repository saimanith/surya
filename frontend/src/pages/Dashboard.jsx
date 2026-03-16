import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recentBills, setRecentBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  useEffect(() => {
    Promise.all([api.getSummary(), api.getTodayBills()])
      .then(([s, b]) => { setSummary(s); setRecentBills(b.slice(0, 6)); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /><span>Loading dashboard…</span></div>;

  const stats = [
    { label: "Today's Revenue",  value: fmt(summary?.total_revenue),   cls: "orange", icon: "💰" },
    { label: "Bills Today",      value: summary?.total_bills || 0,      cls: "violet", icon: "🧾" },
    { label: "Settled Amount",   value: fmt(summary?.settled_amount),   cls: "green",  icon: "✅" },
    { label: "Pending Amount",   value: fmt(summary?.pending_amount),   cls: "red",    icon: "⏳" },
    { label: "Meters Sold",      value: `${(summary?.total_meters || 0).toFixed(1)}m`, cls: "teal", icon: "📏" },
    { label: "Total Items",      value: summary?.total_items || 0,      cls: "amber",  icon: "🧵" },
  ];

  const quickActions = [
    { icon: "🧾", label: "New Bill",    desc: "Start billing a customer",    path: "/billing/new", color: "var(--saffron)" },
    { icon: "📊", label: "Settlement",  desc: "Close today's accounts",      path: "/settlement",  color: "var(--teal)"    },
    { icon: "🧵", label: "Catalog",     desc: "Manage cloth types & prices", path: "/catalog",     color: "var(--violet)"  },
    { icon: "👥", label: "Customers",   desc: "View customer history",       path: "/customers",   color: "var(--rose)"    },
  ];

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <div className="page-accent" />
          <h1 className="page-title">Good day! 🌅</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate("/billing/new")}>
          + New Bill
        </button>
      </div>

      {/* Stats */}
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
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--text)" }}>Recent Bills</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate("/bills")}>View All →</button>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: "2rem" }}>
        {recentBills.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🧾</div>
            <p>No bills yet today — create your first one!</p>
            <button className="btn btn-primary mt-2" onClick={() => navigate("/billing/new")}>Create Bill</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bill #</th><th>Customer</th><th>Items</th>
                  <th>Time</th><th className="text-right">Amount</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBills.map(bill => (
                  <tr key={bill.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/bills/${bill.id}`)}>
                    <td style={{ color: "var(--saffron)", fontWeight: 700, fontSize: "0.8rem" }}>{bill.bill_number}</td>
                    <td style={{ fontWeight: 600 }}>{bill.customer_name}</td>
                    <td className="text-muted text-sm">{bill.items?.length || 0} item{bill.items?.length !== 1 ? "s" : ""}</td>
                    <td className="text-muted text-sm">{new Date(bill.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="text-right" style={{ fontFamily: "var(--font-display)", color: "var(--saffron)", fontWeight: 700 }}>{fmt(bill.total)}</td>
                    <td><span className={`badge badge-${bill.status}`}>{bill.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--text)", marginBottom: "1rem" }}>Quick Actions</h2>
      <div className="grid-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {quickActions.map(({ icon, label, desc, path, color }) => (
          <button key={path} onClick={() => navigate(path)} style={{
            background: "#FFFFFF", border: "1.5px solid var(--border-soft)",
            borderRadius: "var(--radius)", padding: "1.3rem 1.4rem",
            textAlign: "left", cursor: "pointer", transition: "all 0.2s",
            boxShadow: "var(--shadow-sm)",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-soft)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>{icon}</div>
            <div style={{ fontFamily: "var(--font-display)", color, fontSize: "1rem", fontWeight: 600, marginBottom: "0.2rem" }}>{label}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
