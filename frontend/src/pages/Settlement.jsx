import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n||0); }

export default function Settlement() {
  const [summary, setSummary] = useState(null);
  const [bills, setBills] = useState([]);
  const [expSummary, setExpSummary] = useState(null);
  const [settlementRecord, setSettlementRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [cashInRegister, setCashInRegister] = useState("");
  const [notes, setNotes] = useState("");
  const [showCloseForm, setShowCloseForm] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.getSummary(date), api.getAllBills(date), api.getExpSummary(date), api.getSettlement(date)])
      .then(([s, b, e, sr]) => { setSummary(s); setBills(b); setExpSummary(e); setSettlementRecord(sr); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [date]);

  const handleToggle = async (id, current) => { await api.updateStatus(id, current === "settled" ? "pending" : "settled"); load(); };

  const handleCloseDay = async () => {
    setClosing(true);
    try { await api.closeDay({ date, notes, cash_in_register: parseFloat(cashInRegister)||0 }); setShowCloseForm(false); load(); }
    catch (err) { alert(err.message); }
    finally { setClosing(false); }
  };

  const pendingBills = bills.filter(b => b.status === "pending");
  const settledBills = bills.filter(b => b.status === "settled");
  const settlementPct = bills.length > 0 ? Math.round((settledBills.length / bills.length) * 100) : 0;
  const isClosed = settlementRecord?.status === "closed";

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <div className="page-accent" />
          <h1 className="page-title">Day Settlement</h1>
          <p className="page-subtitle">{isClosed ? "✅ Day Closed" : "Day in progress"}</p>
        </div>
        <div className="flex gap-2" style={{ alignItems: "flex-end" }}>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" style={{ width: "170px" }} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {!isClosed && bills.length > 0 && (
            <button className="btn btn-teal btn-lg" onClick={() => setShowCloseForm(true)}>🔒 Close Day</button>
          )}
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> : (
        <>
          {isClosed && (
            <div style={{ background: "var(--emerald-pale)", border: "1.5px solid #BBF7D0", borderRadius: "var(--radius)", padding: "1rem 1.5rem", marginBottom: "1.5rem", color: "var(--emerald)", fontWeight: 600 }}>
              ✅ Day closed at {new Date(settlementRecord.closed_at).toLocaleTimeString("en-IN")} · All records saved
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: "Total Sales",    value: fmt(summary?.total_revenue), cls: "orange" },
              { label: "Cash",           value: fmt(summary?.cash_total),    cls: "green"  },
              { label: "UPI",            value: fmt(summary?.upi_total),     cls: "violet" },
              { label: "Card",           value: fmt(summary?.card_total),    cls: "teal"   },
              { label: "Total Bills",    value: summary?.total_bills || 0,   cls: "amber"  },
              { label: "Unpaid Bills",   value: fmt(summary?.unpaid_amount), cls: "red"    },
            ].map(({ label, value, cls }) => (
              <div className={`stat-card ${cls}`} key={label}>
                <div className="stat-label">{label}</div>
                <div className={`stat-value ${cls}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Expenses summary */}
          {expSummary && (expSummary.total_expense > 0 || expSummary.total_lending > 0) && (
            <div className="card mb-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div><div className="stat-label">Total Expenses</div><div className="stat-value red" style={{ fontSize: "1.2rem" }}>{fmt(expSummary.total_expense)}</div></div>
              <div><div className="stat-label">Money Lent</div><div className="stat-value amber" style={{ fontSize: "1.2rem" }}>{fmt(expSummary.total_lending)}</div></div>
              <div><div className="stat-label">Net Cash (Sales − Expenses)</div><div className="stat-value green" style={{ fontSize: "1.2rem" }}>{fmt((summary?.cash_total||0) - (expSummary?.total_expense||0))}</div></div>
            </div>
          )}

          {/* Progress */}
          {bills.length > 0 && (
            <div className="card mb-2" style={{ padding: "1.2rem 1.6rem" }}>
              <div className="flex-between mb-1">
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Settlement Progress</span>
                <span style={{ fontWeight: 700, color: settlementPct === 100 ? "var(--emerald)" : "var(--saffron)" }}>{settlementPct}%</span>
              </div>
              <div style={{ height: "10px", background: "var(--cream-deep)", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "99px", transition: "width 0.5s ease", width: `${settlementPct}%`, background: settlementPct === 100 ? "linear-gradient(to right,var(--emerald),var(--teal))" : "linear-gradient(to right,var(--saffron),var(--rose))" }} />
              </div>
              <div className="text-muted text-sm mt-1">{settledBills.length} of {bills.length} bills settled</div>
            </div>
          )}

          {/* Close day form */}
          {showCloseForm && (
            <div className="card mb-2" style={{ border: "2px solid var(--teal-pale)" }}>
              <div className="card-title">🔒 Close Day — {new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long" })}</div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="label">Cash in Register (₹)</label>
                  <input className="input" type="number" value={cashInRegister} onChange={e => setCashInRegister(e.target.value)} placeholder="Count and enter cash in drawer" />
                </div>
                <div className="form-group">
                  <label className="label">Notes</label>
                  <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any end-of-day notes…" />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={() => setShowCloseForm(false)}>Cancel</button>
                <button className="btn btn-teal btn-lg" onClick={handleCloseDay} disabled={closing}>{closing ? "Closing…" : "✓ Confirm Close Day"}</button>
              </div>
            </div>
          )}

          {bills.length === 0 ? <div className="card"><div className="empty"><div className="empty-icon">📊</div><p>No bills for this date.</p></div></div> : (
            <>
              {pendingBills.length > 0 && (
                <div className="card mb-2" style={{ padding: 0 }}>
                  <div style={{ padding: "1.2rem 1.6rem 0.8rem", borderBottom: "1px solid var(--border-soft)" }}>
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--amber)" }}>⏳ Pending ({pendingBills.length})</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Bill #</th><th>Customer</th><th>Payment</th><th>Paid?</th><th className="text-right">Amount</th><th>Action</th></tr></thead>
                      <tbody>
                        {pendingBills.map(bill => (
                          <tr key={bill.id}>
                            <td style={{ color: "var(--saffron)", fontWeight: 700, fontSize: "0.8rem" }}>{bill.bill_number}</td>
                            <td style={{ fontWeight: 600 }}>{bill.customer_name}</td>
                            <td><span style={{ textTransform: "capitalize", fontSize: "0.8rem", background: "var(--cream-deep)", padding: "0.2rem 0.6rem", borderRadius: "99px", fontWeight: 600 }}>{bill.payment_method}</span></td>
                            <td><span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "99px", background: bill.payment_status === "paid" ? "var(--emerald-pale)" : "var(--rose-pale)", color: bill.payment_status === "paid" ? "var(--emerald)" : "var(--rose)" }}>{bill.payment_status === "paid" ? "✓ Paid" : "Unpaid"}</span></td>
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
                    <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--emerald)" }}>✅ Settled ({settledBills.length})</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Bill #</th><th>Customer</th><th>Payment</th><th className="text-right">Amount</th><th>Action</th></tr></thead>
                      <tbody>
                        {settledBills.map(bill => (
                          <tr key={bill.id} style={{ opacity: 0.75 }}>
                            <td style={{ color: "var(--saffron)", fontWeight: 700, fontSize: "0.8rem" }}>{bill.bill_number}</td>
                            <td style={{ fontWeight: 600 }}>{bill.customer_name}</td>
                            <td><span style={{ textTransform: "capitalize", fontSize: "0.8rem", background: "var(--cream-deep)", padding: "0.2rem 0.6rem", borderRadius: "99px", fontWeight: 600 }}>{bill.payment_method}</span></td>
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
