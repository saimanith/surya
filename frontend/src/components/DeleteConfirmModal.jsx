import { useState } from "react";

export default function DeleteConfirmModal({ bill, onConfirm, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSettled = bill?.status === "settled";

  const handleConfirm = async () => {
    if (!password) { setError("Admin password is required"); return; }
    setLoading(true); setError("");
    try {
      await onConfirm(password);
    } catch (err) { setError(err.message); setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,18,8,.75)", backdropFilter:"blur(6px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", animation:"fadeIn .2s ease" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:"var(--cream)", borderRadius:"24px", padding:"2rem", width:"100%", maxWidth:"420px", boxShadow:"var(--sh-xl)", animation:"popIn .3s cubic-bezier(.34,1.56,.64,1)", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"4px", background:"linear-gradient(90deg,var(--rose-dk),var(--rose))", borderRadius:"24px 24px 0 0" }} />

        <div style={{ textAlign:"center", marginBottom:"1.5rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:".5rem" }}>🗑️</div>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", color:"var(--ink)", marginBottom:".4rem" }}>Delete Bill?</h2>
          {isSettled && (
            <div style={{ background:"#FFF7ED", border:"1.5px solid #FDBA74", borderRadius:"10px", padding:".7rem 1rem", marginBottom:"1rem", fontSize:".82rem", color:"#C2410C" }}>
              ⚠️ This bill is already <strong>settled</strong>. Deleting a settled bill will affect your records. Are you sure?
            </div>
          )}
          <p style={{ color:"var(--ink-muted)", fontSize:".88rem" }}>
            Bill <strong style={{color:"var(--saffron)"}}>{bill?.bill_number}</strong> for <strong>{bill?.customer_name}</strong> will be permanently deleted and moved to the archive.
          </p>
        </div>

        <div className="form-group">
          <label className="label">🔐 Enter Admin Password to Confirm</label>
          <input className={`input ${error ? "error" : ""}`} type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} placeholder="Your admin password" autoFocus onKeyDown={e => e.key==="Enter" && handleConfirm()} />
          {error && <div className="field-error">⚠️ {error}</div>}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:".8rem" }}>
          <button className="btn btn-ghost btn-lg" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger btn-lg" onClick={handleConfirm} disabled={loading} style={{ background:"linear-gradient(135deg,#F43F5E,#E11D48)", color:"#fff", border:"none", boxShadow:"0 2px 14px #F43F5E50" }}>
            {loading ? "Deleting…" : "🗑️ Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
