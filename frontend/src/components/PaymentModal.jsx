import { useState } from "react";
import { api } from "../api/client";

function fmt(n) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n || 0); }

const METHODS = [
  { id: "cash",   label: "Cash",   icon: "💵", color: "#16A34A", bg: "linear-gradient(135deg,#F0FDF4,#DCFCE7)", border: "#86EFAC", glow: "#16A34A40" },
  { id: "upi",    label: "UPI",    icon: "📱", color: "#7C3AED", bg: "linear-gradient(135deg,#F5F3FF,#EDE9FE)", border: "#C4B5FD", glow: "#7C3AED40" },
  { id: "card",   label: "Card",   icon: "💳", color: "#2563EB", bg: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", border: "#93C5FD", glow: "#2563EB40" },
  { id: "credit", label: "Credit", icon: "📝", color: "#D97706", bg: "linear-gradient(135deg,#FFFBEB,#FEF3C7)", border: "#FCD34D", glow: "#D9770640" },
];

export default function PaymentModal({ bill, onClose, onPaid }) {
  const [selected, setSelected] = useState(bill.payment_method || "cash");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    try {
      await api.processPayment(bill.id, selected);
      setDone(true);
      setTimeout(() => { onPaid?.(); onClose(); }, 1600);
    } catch (err) { alert(err.message); setProcessing(false); }
  };

  const hints = {
    upi: "📱 Ask customer to scan your QR code or transfer to your UPI ID, then confirm below.",
    card: "💳 Swipe or tap the card on your POS machine, then confirm below.",
    credit: "📝 This sale will be recorded as credit. Customer will pay at a later date.",
    cash: "💵 Collect the cash amount from the customer, then confirm below.",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.7)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", animation: "fadeIn 0.2s ease" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--cream)", borderRadius: "28px", padding: "2.2rem 2rem", width: "100%", maxWidth: "460px", boxShadow: "0 32px 80px #00000060, 0 8px 32px #00000030", animation: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)", position: "relative", overflow: "hidden" }}>

        {/* Rainbow thread top border */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg,#F97316,#FBBF24,#E11D48,#7C3AED,#0D9488)", backgroundSize: "200% auto", animation: "shimmer 3s linear infinite", borderRadius: "28px 28px 0 0" }} />

        {done ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ fontSize: "5rem", marginBottom: "0.8rem", animation: "popIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>✅</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", color: "#16A34A", marginBottom: "0.4rem" }}>Payment Done!</h2>
            <p style={{ color: "var(--ink-muted)" }}>Bill marked as paid · <strong>{selected.toUpperCase()}</strong></p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "1.8rem" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: "0.3rem" }}>Collect Payment</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 700, color: "var(--saffron)", lineHeight: 1, margin: "0.3rem 0" }}>{fmt(bill.total)}</div>
              <div style={{ color: "var(--ink-muted)", fontSize: "0.85rem" }}>{bill.bill_number} · {bill.customer_name}</div>
            </div>

            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--ink-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.8rem" }}>Select Payment Method</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.2rem" }}>
              {METHODS.map(m => (
                <button key={m.id} onClick={() => setSelected(m.id)} style={{
                  padding: "1.1rem", borderRadius: "14px",
                  border: `2px solid ${selected === m.id ? m.color : m.border}`,
                  background: m.bg, cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                  textAlign: "center",
                  transform: selected === m.id ? "scale(1.04)" : "scale(1)",
                  boxShadow: selected === m.id ? `0 4px 20px ${m.glow}` : "none",
                }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.3rem" }}>{m.icon}</div>
                  <div style={{ fontWeight: 700, color: selected === m.id ? m.color : "var(--ink)", fontSize: "0.9rem" }}>{m.label}</div>
                </button>
              ))}
            </div>

            {/* Hint */}
            <div style={{ background: "var(--cream-warm)", border: "1px solid var(--border)", borderRadius: "10px", padding: "0.8rem 1rem", marginBottom: "1.2rem", fontSize: "0.83rem", color: "var(--ink-muted)", lineHeight: 1.5 }}>
              {hints[selected]}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "0.8rem" }}>
              <button className="btn btn-ghost btn-lg" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-lg" onClick={handlePay} disabled={processing}>
                {processing
                  ? <><div style={{ width: 16, height: 16, border: "2px solid #fff5", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} /> Processing…</>
                  : "✓ Mark as Paid"
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
