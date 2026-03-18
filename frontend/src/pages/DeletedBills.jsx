import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n||0); }

export default function DeletedBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.getDeletedBills().then(setBills).catch(err => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-accent" />
        <h1 className="page-title">🗄️ Deleted Bills Archive</h1>
        <p className="page-subtitle">Permanent record — bills are never truly removed. Superadmin access only.</p>
      </div>

      <div style={{ background: "var(--rose-pale)", border: "1.5px solid #FECDD3", borderRadius: "var(--radius)", padding: "1rem 1.4rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--rose)" }}>
        🔒 This section is read-only. Deleted bills are permanently archived and cannot be removed from this record.
      </div>

      {error && (
        <div style={{ background: "var(--rose-pale)", border: "1px solid #FECDD3", borderRadius: "var(--radius)", padding: "1rem 1.4rem", color: "var(--rose)", marginBottom: "1rem" }}>
          ⚠️ {error} — This section requires superadmin access.
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loader"><div className="spinner" /></div>
        : bills.length === 0 ? <div className="empty"><div className="empty-icon">🗄️</div><p>No deleted bills on record.</p></div>
        : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Bill #</th><th>Customer</th><th>Deleted At</th><th>Deleted By</th><th className="text-right">Amount</th><th>Was Status</th><th>Details</th></tr></thead>
              <tbody>
                {bills.map(b => (
                  <>
                    <tr key={b.id}>
                      <td style={{ color: "var(--rose)", fontWeight: 700, fontSize: "0.8rem" }}>{b.bill_number}</td>
                      <td style={{ fontWeight: 600 }}>{b.customer_name}<div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{b.customer_phone || ""}</div></td>
                      <td className="text-muted text-sm">{new Date(b.deleted_at).toLocaleString("en-IN")}</td>
                      <td><span style={{ background: "var(--violet-pale)", color: "var(--violet)", borderRadius: "99px", padding: "0.2rem 0.6rem", fontSize: "0.72rem", fontWeight: 700 }}>{b.deleted_by}</span></td>
                      <td className="text-right" style={{ fontFamily: "var(--font-display)", color: "var(--rose)", fontWeight: 700 }}>{fmt(b.total)}</td>
                      <td><span className={`badge badge-${b.status || "pending"}`}>{b.status || "pending"}</span></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => setExpanded(expanded === b.id ? null : b.id)}>{expanded === b.id ? "▲ Hide" : "▼ Show"}</button></td>
                    </tr>
                    {expanded === b.id && b.bill_snapshot?.items && (
                      <tr key={`${b.id}-detail`}>
                        <td colSpan={7} style={{ background: "var(--cream-dark)", padding: "0.8rem 1.2rem" }}>
                          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.4rem", fontWeight: 600 }}>Items in this bill:</div>
                          {b.bill_snapshot.items.map((item, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "0.2rem 0", borderBottom: "1px solid var(--border-soft)" }}>
                              <span>{item.cloth_type} · {item.meters}m @ ₹{item.price_per_meter}/m</span>
                              <span style={{ fontWeight: 600 }}>{fmt(item.amount)}</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
