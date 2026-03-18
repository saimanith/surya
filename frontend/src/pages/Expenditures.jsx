import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n||0); }

const EXP_CATEGORIES = ["rent","electricity","salary","transport","maintenance","supplies","misc"];

export default function Expenditures() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | expense | lending
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "expense", category: "misc", description: "", party_name: "", party_phone: "", amount: "", due_date: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.getExpenditures(date, tab === "all" ? "" : tab), api.getExpSummary(date)])
      .then(([d, s]) => { setItems(d); setSummary(s); })
      .catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [date, tab]);

  const handleAdd = async () => {
    if (!form.description || !form.amount) { alert("Description and amount required"); return; }
    setSaving(true);
    try { await api.addExpenditure(form); setShowForm(false); setForm({ type: "expense", category: "misc", description: "", party_name: "", party_phone: "", amount: "", due_date: "" }); load(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleStatus = async (id, status) => { await api.updateExpStatus(id, status); load(); };
  const handleDelete = async (id) => { if (!confirm("Delete this entry?")) return; await api.deleteExpenditure(id); load(); };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <div className="page-accent" />
          <h1 className="page-title">Expenditures & Lending</h1>
          <p className="page-subtitle">Track expenses and money lent out</p>
        </div>
        <div className="flex gap-2" style={{ alignItems: "flex-end" }}>
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" style={{ width: "160px" }} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Entry</button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        {[
          { label: "Total Expenses", value: fmt(summary?.total_expense), cls: "red" },
          { label: "Money Lent",     value: fmt(summary?.total_lending), cls: "amber" },
          { label: "Pending Returns",value: fmt(summary?.pending_returns), cls: "orange" },
        ].map(({ label, value, cls }) => (
          <div className={`stat-card ${cls}`} key={label}>
            <div className="stat-label">{label}</div>
            <div className={`stat-value ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-2" style={{ background: "var(--cream-deep)", borderRadius: "var(--radius-sm)", padding: "4px", width: "fit-content" }}>
        {["all","expense","lending"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "0.4rem 1rem", borderRadius: "6px", border: "none", fontSize: "0.82rem", fontWeight: 600,
            background: tab === t ? "#FFFFFF" : "transparent",
            color: tab === t ? "var(--saffron)" : "var(--text-muted)",
            boxShadow: tab === t ? "var(--shadow-sm)" : "none", cursor: "pointer", textTransform: "capitalize"
          }}>{t === "all" ? "All" : t === "expense" ? "💸 Expenses" : "🤝 Lending"}</button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-2" style={{ border: "2px solid var(--saffron-pale)" }}>
          <div className="card-title">➕ New Entry</div>
          <div className="grid-2 mb-2">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="expense">💸 Expense</option>
                <option value="lending">🤝 Lending</option>
              </select>
            </div>
            {form.type === "expense" && (
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {EXP_CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: "capitalize" }}>{c}</option>)}
                </select>
              </div>
            )}
            {form.type === "lending" && (
              <div>
                <label className="label">Person Name</label>
                <input className="input" value={form.party_name} onChange={e => setForm(f => ({ ...f, party_name: e.target.value }))} placeholder="Who borrowed?" />
              </div>
            )}
          </div>
          <div className="grid-2 mb-2">
            <div>
              <label className="label">Description *</label>
              <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this for?" />
            </div>
            <div>
              <label className="label">Amount (₹) *</label>
              <input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          {form.type === "lending" && (
            <div className="grid-2 mb-2">
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.party_phone} onChange={e => setForm(f => ({ ...f, party_phone: e.target.value }))} placeholder="Optional" />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Save Entry"}</button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loader"><div className="spinner" /></div>
        : items.length === 0 ? <div className="empty"><div className="empty-icon">{tab === "lending" ? "🤝" : "💸"}</div><p>No entries found.</p></div>
        : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Description</th><th>Party</th><th>Date</th><th className="text-right">Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "capitalize", padding: "0.2rem 0.7rem", borderRadius: "99px", background: item.type === "lending" ? "var(--amber-pale)" : "var(--rose-pale)", color: item.type === "lending" ? "var(--amber)" : "var(--rose)" }}>
                        {item.type === "lending" ? "🤝" : "💸"} {item.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.description}</div>
                      {item.category && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{item.category}</div>}
                    </td>
                    <td className="text-muted text-sm">{item.party_name || "—"}{item.due_date && <div style={{ fontSize: "0.7rem", color: "var(--rose)" }}>Due: {new Date(item.due_date).toLocaleDateString("en-IN")}</div>}</td>
                    <td className="text-muted text-sm">{new Date(item.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="text-right" style={{ fontFamily: "var(--font-display)", color: item.type === "lending" ? "var(--amber)" : "var(--rose)", fontWeight: 700 }}>{fmt(item.amount)}</td>
                    <td>
                      {item.type === "lending" ? (
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.65rem", borderRadius: "99px", background: item.status === "returned" ? "var(--emerald-pale)" : "var(--amber-pale)", color: item.status === "returned" ? "var(--emerald)" : "var(--amber)" }}>
                          {item.status === "returned" ? "✓ Returned" : "⏳ Pending"}
                        </span>
                      ) : <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>—</span>}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {item.type === "lending" && item.status === "pending" && (
                          <button className="btn btn-success btn-sm" onClick={() => handleStatus(item.id, "returned")}>✓ Returned</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑</button>
                      </div>
                    </td>
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
