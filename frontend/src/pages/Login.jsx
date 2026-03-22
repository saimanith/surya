import { useState } from "react";
import { api } from "../api/client";

// Decorative bolt of cloth SVG
function BoltSVG({ color, w=60, h=90 }) {
  return (
    <svg viewBox="0 0 60 90" width={w} height={h} fill="none">
      <ellipse cx="30" cy="14" rx="22" ry="8" fill={color} fillOpacity=".95"/>
      <rect x="8" y="14" width="44" height="62" fill={color} fillOpacity=".75"/>
      <ellipse cx="30" cy="76" rx="22" ry="8" fill={color} fillOpacity=".85"/>
      {[0,1,2,3].map(i=>(
        <line key={i} x1="8" y1={24+i*14} x2="52" y2={24+i*14}
          stroke="white" strokeWidth="1.2" strokeOpacity=".2"/>
      ))}
      <rect x="18" y="34" width="24" height="18" rx="3" fill="white" fillOpacity=".18"/>
      <line x1="22" y1="41" x2="38" y2="41" stroke="white" strokeWidth="1" strokeOpacity=".45"/>
      <line x1="22" y1="47" x2="33" y2="47" stroke="white" strokeWidth=".8" strokeOpacity=".35"/>
    </svg>
  );
}

const BOLTS = [
  { top:"6%",  left:"3%",  w:65, h:100, color:"#FF6B00", rot:-18, dur:"7s",  del:"0s"   },
  { top:"10%", right:"4%", w:55, h:85,  color:"#D4006E", rot:20,  dur:"8.5s",del:"1.4s" },
  { top:"52%", left:"2%",  w:58, h:88,  color:"#00875A", rot:-12, dur:"9s",  del:"0.7s" },
  { top:"58%", right:"3%", w:68, h:100, color:"#7B00D4", rot:24,  dur:"7.5s",del:"2.2s" },
  { top:"32%", left:"5%",  w:42, h:65,  color:"#FFB800", rot:8,   dur:"10s", del:"1.8s" },
  { top:"28%", right:"5%", w:48, h:72,  color:"#1847D4", rot:-16, dur:"8s",  del:"0.4s" },
  { top:"75%", left:"6%",  w:36, h:55,  color:"#CC0000", rot:14,  dur:"6.5s",del:"2.8s" },
  { top:"72%", right:"7%", w:44, h:68,  color:"#FF6B00", rot:-9,  dur:"9.5s",del:"1.1s" },
];

export default function Login({ onLogin }) {
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const handleLogin=async(e)=>{
    e.preventDefault(); setLoading(true); setError("");
    try{
      const d=await api.login(username,password);
      localStorage.setItem("surya_token",d.token);
      onLogin(d);
    }catch(err){setError(err.message);}
    finally{setLoading(false);}
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(155deg, #1A0800 0%, #280E02 35%, #1A0600 65%, #0D0600 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"1.5rem", position:"relative", overflow:"hidden",
    }}>
      {/* Ikat dot grid */}
      <div style={{position:"absolute",inset:0,
        backgroundImage:"radial-gradient(circle at 2px 2px, rgba(255,107,0,.06) 1px, transparent 0)",
        backgroundSize:"20px 20px", pointerEvents:"none"}}/>

      {/* Radial glow */}
      <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",
        width:"600px",height:"600px",
        background:"radial-gradient(circle, rgba(255,107,0,.08) 0%, transparent 65%)",
        pointerEvents:"none"}}/>

      {/* Floating cloth bolts */}
      {BOLTS.map((b,i)=>(
        <div key={i} style={{
          position:"absolute", top:b.top, left:b.left, right:b.right,
          width:b.w, height:b.h,
          transform:`rotate(${b.rot}deg)`,
          animation:`float ${b.dur} ease-in-out infinite`,
          animationDelay:b.del,
          filter:`drop-shadow(0 6px 18px ${b.color}55)`,
          pointerEvents:"none",
          opacity:.55,
        }}>
          <BoltSVG color={b.color} w={b.w} h={b.h}/>
        </div>
      ))}

      {/* Login card */}
      <div style={{
        background:"rgba(253,250,246,.97)",
        backdropFilter:"blur(24px)",
        borderRadius:"var(--r-xl)",
        padding:"3rem 2.8rem",
        width:"100%", maxWidth:"430px",
        boxShadow:"0 40px 100px rgba(0,0,0,.6), 0 8px 32px rgba(0,0,0,.3)",
        border:"1.5px solid rgba(255,255,255,.2)",
        animation:"popIn .5s cubic-bezier(.34,1.56,.64,1)",
        position:"relative", zIndex:1, overflow:"hidden",
      }}>
        {/* Silk shimmer top stripe */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:"5px",
          borderRadius:"var(--r-xl) var(--r-xl) 0 0",
          background:"linear-gradient(90deg,var(--saffron),var(--gold),var(--magenta),var(--cobalt),var(--emerald),var(--saffron))",
          backgroundSize:"300% auto",
          animation:"shimmer 3.5s linear infinite",
        }}/>

        {/* Brand */}
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{
            width:"78px",height:"78px",
            background:"linear-gradient(135deg,var(--saffron),var(--gold))",
            borderRadius:"20px",
            margin:"0 auto 1rem",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:"2.2rem",
            boxShadow:"0 8px 32px rgba(255,107,0,.55), 0 0 60px rgba(255,107,0,.25)",
            animation:"glow 4s ease-in-out infinite",
          }}>🌅</div>
          <h1 style={{
            fontFamily:"var(--font-display)",
            fontSize:"2.8rem",
            color:"var(--text)",
            marginBottom:".2rem",
          }}>SURYA</h1>
          <p style={{
            color:"var(--text-muted)",
            fontSize:".76rem",
            letterSpacing:".2em",
            textTransform:"uppercase",
            fontWeight:800,
          }}>Cloth Store · Admin Portal</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="label">Username</label>
            <input className="input" value={username}
              onChange={e=>setUsername(e.target.value)} placeholder="admin" autoFocus/>
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" value={password}
              onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
          </div>

          {error&&(
            <div style={{
              background:"#FFF0F8",border:"1.5px solid rgba(212,0,110,.25)",
              borderRadius:"var(--r-sm)",padding:".75rem 1rem",
              color:"var(--magenta)",fontSize:".84rem",fontWeight:700,
              marginBottom:"1rem",animation:"fadeIn .2s ease",
            }}>⚠️ {error}</div>
          )}

          <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading}
            style={{fontSize:"1rem",marginTop:".5rem"}}>
            {loading
              ?<><div style={{width:18,height:18,border:"2px solid rgba(255,255,255,.35)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> Signing in…</>
              :"Sign In →"
            }
          </button>
        </form>

        <p style={{textAlign:"center",color:"var(--text-dim)",fontSize:".72rem",marginTop:"1.5rem",fontWeight:600}}>
          Default: <strong>admin</strong> / <strong>surya123</strong>
        </p>
      </div>
    </div>
  );
}
