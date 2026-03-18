import { useState } from "react";
import { api } from "../api/client";

// SVG Bolt of Cloth illustration
function BoltSVG({ color, rotation, opacity }) {
  return (
    <svg viewBox="0 0 80 120" style={{ width:"100%", height:"100%", opacity }} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bolt cylinder */}
      <ellipse cx="40" cy="20" rx="30" ry="10" fill={color} fillOpacity=".9"/>
      <rect x="10" y="20" width="60" height="80" fill={color} fillOpacity=".7"/>
      <ellipse cx="40" cy="100" rx="30" ry="10" fill={color} fillOpacity=".9"/>
      {/* Fabric layers */}
      {[0,1,2,3,4].map(i=>(
        <line key={i} x1="10" y1={30+i*14} x2="70" y2={30+i*14} stroke="white" strokeWidth="1.5" strokeOpacity=".25"/>
      ))}
      {/* Label strip */}
      <rect x="25" y="48" width="30" height="24" rx="3" fill="white" fillOpacity=".25"/>
      <line x1="29" y1="56" x2="51" y2="56" stroke="white" strokeWidth="1.5" strokeOpacity=".5"/>
      <line x1="29" y1="62" x2="45" y2="62" stroke="white" strokeWidth="1" strokeOpacity=".4"/>
    </svg>
  );
}

const BOLTS = [
  { top:"8%",  left:"4%",  w:60,  h:90,  color:"#F97316", rot:-20, delay:"0s",   dur:"6s"  },
  { top:"12%", right:"5%", w:50,  h:75,  color:"#E11D48", rot:18,  delay:"1.2s", dur:"7s"  },
  { top:"55%", left:"2%",  w:55,  h:82,  color:"#0D9488", rot:-10, delay:"0.5s", dur:"8s"  },
  { top:"60%", right:"3%", w:65,  h:95,  color:"#8B5CF6", rot:22,  delay:"2s",   dur:"6.5s"},
  { top:"35%", left:"6%",  w:40,  h:60,  color:"#F59E0B", rot:5,   delay:"1.8s", dur:"7.5s"},
  { top:"30%", right:"6%", w:45,  h:68,  color:"#10B981", rot:-15, delay:"0.8s", dur:"9s"  },
  { top:"78%", left:"8%",  w:35,  h:52,  color:"#F43F5E", rot:12,  delay:"2.5s", dur:"5.5s"},
  { top:"75%", right:"9%", w:42,  h:64,  color:"#3B82F6", rot:-8,  delay:"1.5s", dur:"8.5s"},
];

export default function Login({ onLogin }) {
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const handleLogin=async(e)=>{
    e.preventDefault(); setLoading(true); setError("");
    try{ const d=await api.login(username,password); localStorage.setItem("surya_token",d.token); onLogin(d); }
    catch(err){ setError(err.message); } finally{ setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#130800 0%,#1A0B02 45%,#0E0700 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", position:"relative", overflow:"hidden" }}>

      {/* Woven grid */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(#F9731305 1px,transparent 1px),linear-gradient(90deg,#F9731305 1px,transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />

      {/* Bolts of cloth in background */}
      {BOLTS.map((b,i)=>(
        <div key={i} style={{
          position:"absolute", top:b.top, left:b.left, right:b.right,
          width:b.w, height:b.h,
          transform:`rotate(${b.rot}deg)`,
          animation:`boltFloat ${b.dur} ease-in-out infinite`,
          animationDelay:b.delay,
          "--rot":`${b.rot}deg`,
          filter:`drop-shadow(0 4px 12px ${b.color}40)`,
          pointerEvents:"none",
        }}>
          <BoltSVG color={b.color} rotation={b.rot} opacity={.5}/>
        </div>
      ))}

      {/* Login Card */}
      <div style={{ background:"rgba(254,252,248,.96)", backdropFilter:"blur(20px)", borderRadius:"28px", padding:"3rem 2.8rem", width:"100%", maxWidth:"420px", boxShadow:"0 40px 100px #00000080,0 8px 32px #00000040", border:"1px solid rgba(255,255,255,.15)", animation:"popIn .5s cubic-bezier(.34,1.56,.64,1)", position:"relative", zIndex:1, overflow:"hidden" }}>
        {/* Shimmer thread top */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"5px", borderRadius:"28px 28px 0 0", background:"linear-gradient(90deg,#F97316,#F59E0B,#E11D48,#8B5CF6,#0D9488)", backgroundSize:"200% auto", animation:"shimmer 3s linear infinite" }} />

        <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
          <div style={{ width:"76px", height:"76px", background:"linear-gradient(135deg,#F97316,#F59E0B)", borderRadius:"50%", margin:"0 auto 1rem", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.2rem", boxShadow:"0 8px 32px #F9731660,0 0 60px #F9731630", animation:"float 4s ease-in-out infinite" }}>🌅</div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:"2.6rem", fontWeight:700, color:"var(--ink)", marginBottom:".2rem", letterSpacing:"-.01em" }}>SURYA</h1>
          <p style={{ color:"var(--ink-muted)", fontSize:".78rem", letterSpacing:".18em", textTransform:"uppercase", fontWeight:600 }}>Cloth Store · Admin Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label">Username</label>
            <input className="input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="admin" autoFocus />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error&&<div style={{background:"#FFF1F2",border:"1px solid #FECDD3",borderRadius:"10px",padding:".75rem 1rem",color:"var(--rose-dk)",fontSize:".84rem",marginBottom:"1rem",animation:"fadeIn .2s ease"}}>⚠️ {error}</div>}
          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading} style={{fontSize:"1rem",marginTop:".5rem"}}>
            {loading?<><div style={{width:18,height:18,border:"2px solid #fff5",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Signing in…</>:"Sign In →"}
          </button>
        </form>
        <p style={{textAlign:"center",color:"var(--ink-dim)",fontSize:".72rem",marginTop:"1.5rem"}}>Default: <strong>admin</strong> / <strong>surya123</strong></p>
      </div>
    </div>
  );
}
