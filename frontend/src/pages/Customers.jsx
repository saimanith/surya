import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getCustomers().then(setCustomers).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (search.length >= 2) api.searchCustomers(search).then(setCustomers).catch(console.error);
    else if (search.length === 0) api.getCustomers().then(setCustomers).catch(console.error);
  }, [search]);

  const topCustomer = customers[0];

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <div className="page-accent" />
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} registered customers</p>
        </div>
        <input className="input" style={{ width: "240px" }}
          placeholder="🔍 Search name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Top customer highlight */}
      {topCustomer && !search && (
        <div style={{
          background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)",
          border: "1.5px solid var(--saffron-pale)", borderRadius: "var(--radius-lg)",
          padding: "1.4rem 1.8rem", marginBottom: "1.5rem",
          display: "flex", alignItems: "center", gap: "1.5rem"
        }}>
          <div style={{ fontSize: "2.5rem" }}>👑</div>
          <div>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--saffron)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Top Customer</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700 }}>{topCustomer.name}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{topCustomer.visit_count} visits · {fmt(topCustomer.total_purchases)} total</div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loader"><div className="spinner" /></div>
        : customers.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            <p>No customers yet. They're auto-created when a bill with a phone number is saved.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Name</th><th>Phone</th><th className="text-right">Total Purchases</th><th className="text-right">Visits</th><th>Customer Since</th></tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id}>
                    <td className="text-muted text-sm">{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {i === 0 && <span style={{ fontSize: "0.65rem", color: "var(--saffron)", fontWeight: 700 }}>👑 Top Customer</span>}
                    </td>
                    <td className="text-muted text-sm">{c.phone || "—"}</td>
                    <td className="text-right" style={{ fontFamily: "var(--font-display)", color: "var(--saffron)", fontWeight: 700 }}>{fmt(c.total_purchases)}</td>
                    <td className="text-right">
                      <span style={{ background: "var(--teal-pale)", color: "var(--teal)", borderRadius: "99px", padding: "0.2rem 0.7rem", fontSize: "0.78rem", fontWeight: 700 }}>
                        {c.visit_count}x
                      </span>
                    </td>
                    <td className="text-muted text-sm">{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
