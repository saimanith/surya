import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import PaymentModal from "../components/PaymentModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

function fmt(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0); }

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const load = () => api.getBill(id).then(b => { setBill(b); setEmailTo(b.customer_email || ""); }).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const handleStatus = async (status) => { await api.updateStatus(id, status); load(); };
  const handleDelete = async (password) => { await api.deleteBill(id, password); navigate("/bills"); };

  const handleSendEmail = async () => {
    if (!emailTo) { alert("Enter an email address"); return; }
    setEmailSending(true); setEmailStatus(null);
    try {
      await api.sendBillEmail(id, emailTo);
      setEmailStatus({ ok: true, msg: `Receipt sent to ${emailTo}` });
      setTimeout(() => setEmailModal(false), 2000);
    } catch (err) {
      setEmailStatus({ ok: false, msg: err.message });
    } finally { setEmailSending(false); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!bill) return <div className="page"><p className="text-muted">Bill not found.</p></div>;

  const paymentColors = { cash: "var(--jade)", upi: "var(--violet)", card: "var(--sky)", credit: "var(--amber)" };

  return (
    <div className="page">
      {showPayment && <PaymentModal bill={bill} onClose={() => { setShowPayment(false); load(); }} onPaid={load} />}
      {showDelete && <DeleteConfirmModal bill={bill} onConfirm={handleDelete} onClose={() => setShowDelete(false)} />}

      {/* Email Modal */}
      {emailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,.7)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={e => { if (e.target === e.currentTarget) setEmailModal(false); }}>
          <div style={{ background: "var(--cream)", borderRadius: "24px", padding: "2rem", width: "100%", maxWidth: "420px", boxShadow: "var(--sh-xl)", animation: "popIn .3s ease" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg,var(--saffron),var(--marigold))", borderRadius: "24px 24px 0 0" }} />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: "0.4rem" }}>📧 Send Bill Receipt</h3>
            <p className="text-muted mb-2">{bill.bill_number} · {bill.customer_name}</p>
            <div className="form-group">
              <label className="label">Customer Email</label>
              <input className="input" type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="customer@email.com" autoFocus />
            </div>
            {emailStatus && (
              <div style={{ padding: "0.7rem 1rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem", background: emailStatus.ok ? "#F0FDF4" : "#FFF1F2", color: emailStatus.ok ? "var(--jade)" : "var(--rose-dk)", border: `1px solid ${emailStatus.ok ? "#BBF7D0" : "#FECDD3"}` }}>
                {emailStatus.ok ? "✅" : "⚠️"} {emailStatus.msg}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
              <button className="btn btn-ghost btn-lg" onClick={() => setEmailModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-lg" onClick={handleSendEmail} disabled={emailSending}>
                {emailSending ? "Sending…" : "📧 Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-accent"><span /><span /><span /><span /></div>
        <div className="flex-between">
          <div>
            <button className="btn btn-ghost btn-sm mb-1 no-print" onClick={() => navigate("/bills")}>← Back</button>
            <h1 className="page-title">{bill.bill_number}</h1>
            <p className="page-subtitle">{new Date(bill.created_at).toLocaleString("en-IN")}</p>
          </div>
          <div className="flex gap-2 no-print" style={{ flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => window.print()}>🖨️ Print</button>
            <button className="btn btn-ghost" onClick={() => setEmailModal(true)}>📧 Email</button>
            {bill.payment_status !== "paid" && <button className="btn btn-primary" onClick={() => setShowPayment(true)}>💰 Collect Payment</button>}
            {bill.status === "pending" && <button className="btn btn-teal" onClick={() => handleStatus("settled")}>✓ Settle</button>}
            {bill.status === "settled" && <button className="btn btn-ghost" onClick={() => handleStatus("pending")}>↩ Reopen</button>}
            <button className="btn btn-danger" onClick={() => setShowDelete(true)}>🗑️</button>
          </div>
        </div>
      </div>

      {/* Customer card */}
      <div className="card mb-2">
        <div className="grid-2">
          <div>
            <div className="label">Customer</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>{bill.customer_name}</div>
            {bill.customer_phone && <div className="text-muted text-sm mt-1">📞 {bill.customer_phone}</div>}
            {bill.customer_email && <div className="text-muted text-sm">✉️ {bill.customer_email}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <span className="label" style={{ margin: 0 }}>Payment:</span>
              <span style={{ textTransform: "capitalize", fontWeight: 700, color: paymentColors[bill.payment_method] || "var(--ink)" }}>{bill.payment_method}</span>
              <span className={`badge badge-${bill.payment_status === "paid" ? "paid" : "unpaid"}`}>{bill.payment_status === "paid" ? "Paid" : "Unpaid"}</span>
            </div>
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <span className="label" style={{ margin: 0 }}>Status:</span>
              <span className={`badge badge-${bill.status}`}>{bill.status}</span>
            </div>
          </div>
        </div>
        {bill.notes && (
          <div style={{ marginTop: "1rem", padding: "0.65rem 1rem", background: "var(--cream-deep)", borderRadius: "var(--r-sm)", fontSize: "0.85rem", color: "var(--ink-muted)" }}>
            📝 {bill.notes}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="card mb-2">
        <div className="card-title">🧵 Items</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Cloth Type</th><th>Bolt ID</th><th className="text-right">Meters</th><th className="text-right">Price/m</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={item.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.cloth_type}</td>
                  <td className="text-muted text-sm">{item.bolt_id || "—"}</td>
                  <td className="text-right">{item.meters} m</td>
                  <td className="text-right">{fmt(item.price_per_meter)}</td>
                  <td className="text-right" style={{ fontFamily: "var(--font-display)", color: "var(--saffron)", fontWeight: 700 }}>{fmt(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="total-box">
        <div style={{ maxWidth: "300px", marginLeft: "auto" }}>
          {[["Subtotal", fmt(bill.subtotal)], bill.discount > 0 ? ["Discount", `− ${fmt(bill.discount)}`] : null, ["GST (5%)", fmt(bill.tax)]].filter(Boolean).map(([label, val]) => (
            <div key={label} className="flex-between" style={{ marginBottom: "0.6rem", color: label === "Discount" ? "var(--rose-dk)" : "var(--ink-muted)", fontSize: "0.9rem" }}>
              <span>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="flex-between">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 800 }}>TOTAL</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", color: "var(--saffron)", fontWeight: 800 }}>{fmt(bill.total)}</span>
          </div>
        </div>
      </div>
      <style>{`@media print { .no-print { display:none!important; } .main-content { margin-left:0; padding-top:0; } .topbar { display:none!important; } }`}</style>
    </div>
  );
}
