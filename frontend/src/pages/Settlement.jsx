import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

export default function Settlement() {
  const [summary, setSummary] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const load = () => {
    setLoading(true);
    Promise.all([api.getSummary(date), api.getAllBills(date)])
      .then(([s, b]) => { setSummary(s); setBills(b); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [date]);

  const handleSettleAll = async () => {
    if (!confirm("Settle all pending bills for this date?")) return;
    setSettling(true);
    await api.settleAll(); load(); setSettling(false);
  };

  const handleToggle = async (id, current) => {
    await api.updateStatus(id, current === "settled" ? "pending" : "settled"); load();
  };

  const pendingBills = bills.filter(b => b.status === "pending");
  const settledBills = bills.filter(b => b.status === "settled");
  const settlementPct = summary?.total_bills > 0 ? Math.round((settledBills.length / bills.length) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <div className="page-accent" />
          <h1 className="page-title">Daily Settlement</h1>
          <p className="page-subtitle">Review and close the day's transactions</p>
        </div>
        <div className="flex gap-2" style={{ alignItems: "flex-end" }}>
          <div>
            <label className="label">📅 Date</label>
            <input type="date" className="input" style={{ width: "170px" }} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {pendingBills.length > 0 && (
            <button className="btn btn-teal btn-lg" onClick={handleSettleAll} disabled={settling}>
              {settling ? "⏳ Settling…" : `✓ Settle All (${pendingBills.length})`}
            </button>
          )}
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <>
          <div className="stats-grid">
            {[
              { label: "Total Revenue",   value: fmt(summary?.total_revenue),   cls: "orange" },
              { label: "Settled",         value: fmt(summary?.settled_amount),   cls: "green"  },
              { label: "Pending",         value: fmt(summary?.pending_amount),   cls: summary?.pending_amount > 0 ? "red" : "teal" },
              { label: "Total Bills",     value: summary?.total_bills || 0,      cls: "violet" },
              { label: "Tax Collected",   value: fmt(summary?.total_tax),        cls: "amber"  },
              { label: "Discounts Given", value: fmt(summary?.total_discount),   cls: "teal"   },
            ].map(({ label, value, cls }) => (
              <div className={`stat-card ${cls}`} key={label}>
                <div className="stat-label">{label}</div>
                <div className={`stat-value ${cls}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {bills.length > 0 && (
            <div className="card mb-2" style={{ padding: "1.2rem 1.6rem" }}>
              <div className="flex-between mb-1">
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Settlement Progress</span>
                <span style={{ fontWeight: 700, color: settlementPct === 100 ? "var(--emerald)" : "var(--saffron)" }}>{settlementPct}%</span>
              </div>
              <div style={{ height: "10px", background: "var(--cream-deep)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "99px", transition: "width 0.5s ease",
                  width: `${settlementPct}%`,
                  background: settlementPct === 100
                    ? "linear-gradient(to right, var(--emerald), var(--teal))"
                    : "linear-gradient(to right, var(--saffron), var(--rose))"
                }} />
              </div>
              <div className="text-muted text-sm mt-1">{settledBills.length} of {bills.length} bills settled</div>
            </div>
          )}

          {bills.length === 0 ? (
            <div className="card"><div className="empty"><div className="empty-icon">📊</div><p>No bills for this date.</p></div></div>
          ) : (
            <>
              {pendingBills.length > 0 && (
                <div className="card mb-2" style={{ padding: 0 }}>
                  <div style={{ padding: "1.2rem 1.6rem 0.8rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--amber)" }}>⏳ Pending Bills ({pendingBills.length})</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Bill #</th><th>Customer</th><th>Payment</th><th>Time</th><th className="text-right">Amount</th><th>Action</th></tr></thead>
                      <tbody>
                        {pendingBills.map(bill => (
                          <tr key={bill.id}>
                            <td style={{ color: "var(--saffron)", fontWeight: 700, fontSize: "0.8rem" }}>{bill.bill_number}</td>
                            <td style={{ fontWeight: 600 }}>{bill.customer_name}</td>
                            <td><span style={{ textTransform: "capitalize", fontSize: "0.8rem", background: "var(--cream-deep)", padding: "0.2rem 0.6rem", borderRadius: "99px", fontWeight: 600 }}>{bill.payment_method}</span></td>
                            <td className="text-muted text-sm">{new Date(bill.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="text-right" style={{ fontFamily: "var(--font-display)", color: "var(--saffron)", fontWeight: 700 }}>{fmt(bill.total)}</td>
                            <td><button className="btn btn-success btn-sm" onClick={() => handleToggle(bill.id, bill.status)}>✓ Settle</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {settledBills.length > 0 && (
                <div className="card" style={{ padding: 0 }}>
                  <div style={{ padding: "1.2rem 1.6rem 0.8rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--emerald)" }}>✅ Settled Bills ({settledBills.length})</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Bill #</th><th>Customer</th><th>Payment</th><th>Time</th><th className="text-right">Amount</th><th>Action</th></tr></thead>
                      <tbody>
                        {settledBills.map(bill => (
                          <tr key={bill.id} style={{ opacity: 0.75 }}>
                            <td style={{ color: "var(--saffron)", fontWeight: 700, fontSize: "0.8rem" }}>{bill.bill_number}</td>
                            <td style={{ fontWeight: 600 }}>{bill.customer_name}</td>
                            <td><span style={{ textTransform: "capitalize", fontSize: "0.8rem", background: "var(--cream-deep)", padding: "0.2rem 0.6rem", borderRadius: "99px", fontWeight: 600 }}>{bill.payment_method}</span></td>
                            <td className="text-muted text-sm">{new Date(bill.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                            <td className="text-right" style={{ fontFamily: "var(--font-display)", color: "var(--emerald)", fontWeight: 700 }}>{fmt(bill.total)}</td>
                            <td><button className="btn btn-ghost btn-sm" onClick={() => handleToggle(bill.id, bill.status)}>↩ Reopen</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
