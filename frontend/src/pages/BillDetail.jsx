import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0);
}

export default function BillDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => api.getBill(id).then(setBill).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const handleStatus = async (status) => { await api.updateStatus(id, status); load(); };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!bill) return <div className="page"><p className="text-muted">Bill not found.</p></div>;

  const paymentColors = { cash: "var(--emerald)", upi: "var(--teal)", card: "var(--violet)", credit: "var(--amber)" };

  return (
    <div className="page">
      <div className="page-header flex-between no-print">
        <div>
          <button className="btn btn-ghost btn-sm mb-1" onClick={() => navigate("/bills")}>← Back to Bills</button>
          <div className="page-accent" />
          <h1 className="page-title">{bill.bill_number}</h1>
          <p className="page-subtitle">{new Date(bill.created_at).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost no-print" onClick={() => window.print()}>🖨️ Print</button>
          {bill.status === "pending" && (
            <button className="btn btn-teal" onClick={() => handleStatus("settled")}>✓ Mark Settled</button>
          )}
          {bill.status === "settled" && (
            <button className="btn btn-ghost" onClick={() => handleStatus("pending")}>↩ Reopen</button>
          )}
        </div>
      </div>

      {/* Bill header — print friendly */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem", display: "none" }} className="print-header">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>🌅 SURYA</h1>
        <p>Cloth Store Billing · {bill.bill_number}</p>
      </div>

      {/* Customer + Info */}
      <div className="card mb-2">
        <div className="grid-2">
          <div>
            <div className="label">Customer</div>
            <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text)" }}>{bill.customer_name}</div>
            {bill.customer_phone && <div className="text-muted text-sm mt-1">📞 {bill.customer_phone}</div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <span className="label" style={{ margin: 0 }}>Payment:</span>
              <span style={{ textTransform: "capitalize", fontWeight: 600, color: paymentColors[bill.payment_method] || "var(--text)" }}>
                {bill.payment_method}
              </span>
            </div>
            <div className="flex gap-2" style={{ alignItems: "center" }}>
              <span className="label" style={{ margin: 0 }}>Status:</span>
              <span className={`badge badge-${bill.status}`}>{bill.status}</span>
            </div>
          </div>
        </div>
        {bill.notes && (
          <div style={{ marginTop: "1rem", padding: "0.7rem 1rem", background: "var(--amber-pale)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--text-soft)", border: "1px solid var(--amber-pale)" }}>
            📝 {bill.notes}
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="card mb-2">
        <div className="card-title">🧵 Items</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Cloth Type</th><th className="text-right">Meters</th><th className="text-right">Price/m</th><th className="text-right">Amount</th></tr>
            </thead>
            <tbody>
              {bill.items.map((item, i) => (
                <tr key={item.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{item.cloth_type}</td>
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
          {[
            ["Subtotal", fmt(bill.subtotal), "var(--text-muted)"],
            bill.discount > 0 ? [`Discount`, `− ${fmt(bill.discount)}`, "var(--rose)"] : null,
            ["GST (5%)", fmt(bill.tax), "var(--text-muted)"],
          ].filter(Boolean).map(([label, val, color]) => (
            <div key={label} className="flex-between" style={{ marginBottom: "0.6rem", color, fontSize: "0.9rem" }}>
              <span>{label}</span><span style={{ fontWeight: 600 }}>{val}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="flex-between">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700 }}>TOTAL</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.9rem", color: "var(--saffron)", fontWeight: 700 }}>{fmt(bill.total)}</span>
          </div>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } .print-header { display: block !important; } .main-content { margin-left: 0; } }`}</style>
    </div>
  );
}
