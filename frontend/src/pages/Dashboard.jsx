import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

function fmt(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);}

// Simple bar chart (pure SVG, no library needed)
function MiniBarChart({ data, color="#F97316", height=80 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d=>d.value),1);
  const w = 100/data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{width:"100%",height}}>
      {data.map((d,i)=>{
        const barH = (d.value/max)*(height-16);
        const x = i*w + w*.1;
        const bw = w*.8;
        const y = height - barH - 14;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={barH} fill={color} rx="2" fillOpacity=".85">
              <title>{d.label}: {fmt(d.value)}</title>
            </rect>
            <text x={x+bw/2} y={height-2} textAnchor="middle" fontSize="5" fill="#A8845A" fontFamily="var(--font-body)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart for payment breakdown
function DonutChart({ segments, size=100 }) {
  const total = segments.reduce((s,seg)=>s+seg.value,0)||1;
  let offset = 0;
  const cx=size/2, cy=size/2, r=size/2-8;
  const circ=2*Math.PI*r;
  const segs = segments.map(seg=>{
    const pct=seg.value/total;
    const strokeDash=pct*circ;
    const strokeOffset=-offset*circ;
    offset+=pct;
    return {...seg,strokeDash,strokeOffset,pct:Math.round(pct*100)};
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{transform:"rotate(-90deg)"}}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--cream-deep)" strokeWidth="14"/>
      {segs.filter(s=>s.value>0).map((seg,i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={seg.color} strokeWidth="14"
          strokeDasharray={`${seg.strokeDash} ${circ-seg.strokeDash}`}
          strokeDashoffset={seg.strokeOffset}
          strokeLinecap="butt"/>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const [summary,setSummary]=useState(null);
  const [recentBills,setRecentBills]=useState([]);
  const [weekData,setWeekData]=useState([]);
  const [loading,setLoading]=useState(true);
  const navigate=useNavigate();
  const hour=new Date().getHours();
  const greeting=hour<12?"Good Morning ☀️":hour<17?"Good Afternoon 🌤️":"Good Evening 🌙";
  const today=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});

  useEffect(()=>{
    const loadWeekData=async()=>{
      const results=[];
      for(let i=6;i>=0;i--){
        const d=new Date(); d.setDate(d.getDate()-i);
        const date=d.toISOString().split("T")[0];
        try{
          const s=await api.getSummary(date);
          results.push({label:i===0?"Today":d.toLocaleDateString("en-IN",{weekday:"short"}),value:s.total_revenue||0,date});
        }catch{results.push({label:i===0?"Today":d.toLocaleDateString("en-IN",{weekday:"short"}),value:0,date});}
      }
      setWeekData(results);
    };
    Promise.all([api.getSummary(),api.getTodayBills()])
      .then(([s,b])=>{setSummary(s);setRecentBills(b.slice(0,5));})
      .catch(console.error).finally(()=>setLoading(false));
    loadWeekData();
  },[]);

  if(loading)return<div className="loader"><div className="spinner"/><span style={{color:"var(--ink-muted)",fontSize:".9rem"}}>Loading…</span></div>;

  const stats=[
    {label:"Today's Revenue",value:fmt(summary?.total_revenue),cls:"orange",icon:"💰"},
    {label:"Bills Today",value:summary?.total_bills||0,cls:"violet",icon:"🧾"},
    {label:"Collected",value:fmt(summary?.paid_amount),cls:"green",icon:"✅"},
    {label:"Pending",value:fmt(summary?.pending_amount),cls:"red",icon:"⏳"},
    {label:"Meters Sold",value:`${(summary?.total_meters||0).toFixed(1)}m`,cls:"teal",icon:"📏"},
    {label:"Items",value:summary?.total_items||0,cls:"amber",icon:"🧵"},
  ];

  const paymentSegs=[
    {label:"Cash",value:summary?.cash_total||0,color:"#10B981"},
    {label:"UPI",value:summary?.upi_total||0,color:"#8B5CF6"},
    {label:"Card",value:summary?.card_total||0,color:"#3B82F6"},
    {label:"Credit",value:summary?.credit_total||0,color:"#F59E0B"},
  ].filter(s=>s.value>0);

  const totalPayments=paymentSegs.reduce((s,p)=>s+p.value,0)||1;

  const quickActions=[
    {icon:"🧾",label:"New Bill",desc:"Start billing",path:"/billing/new",grad:"linear-gradient(135deg,#FFF7ED,#FFEDD5)",border:"#FDBA74",color:"#EA580C"},
    {icon:"📊",label:"Settlement",desc:"Close day",path:"/settlement",grad:"linear-gradient(135deg,#F0FDFA,#CCFBF1)",border:"#5EEAD4",color:"#0D9488"},
    {icon:"📦",label:"Inventory",desc:"Stock & bolts",path:"/inventory",grad:"linear-gradient(135deg,#EFF6FF,#DBEAFE)",border:"#93C5FD",color:"#2563EB"},
    {icon:"💸",label:"Expenses",desc:"Track spending",path:"/expenditures",grad:"linear-gradient(135deg,#FFF1F2,#FFE4E6)",border:"#FDA4AF",color:"#E11D48"},
  ];

  return (
    <div className="page">
      {/* Hero */}
      <div className="hero-banner">
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:".72rem",fontWeight:700,color:"#F9731370",letterSpacing:".18em",textTransform:"uppercase",marginBottom:".3rem"}}>{today}</div>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:"1.8rem",fontWeight:800,color:"#FFFFFF",marginBottom:".5rem",letterSpacing:"-.02em"}}>{greeting}</h1>
          <div style={{display:"flex",gap:"1rem",flexWrap:"wrap"}}>
            <span className="metric-pill">Revenue <span className="val">{fmt(summary?.total_revenue)}</span></span>
            <span className="metric-pill">Bills <span className="val">{summary?.total_bills||0}</span></span>
            <span className="metric-pill">Meters <span className="val">{(summary?.total_meters||0).toFixed(1)}m</span></span>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={()=>navigate("/billing/new")} style={{position:"absolute",bottom:"1.5rem",right:"1.5rem",zIndex:1}}>+ New Bill</button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {stats.map(({label,value,cls,icon})=>(
          <div className={`stat-card ${cls}`} key={label}><div className="stat-label">{icon} {label}</div><div className={`stat-value ${cls}`}>{value}</div></div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid-2 mb-2" style={{alignItems:"start"}}>
        {/* Weekly sales bar chart */}
        <div className="chart-container">
          <div className="flex-between mb-1">
            <div className="card-title" style={{margin:0}}>📈 Weekly Sales</div>
            <span style={{fontSize:".72rem",color:"var(--ink-muted)",fontWeight:600}}>Last 7 days</span>
          </div>
          <MiniBarChart data={weekData} color="var(--saffron)" height={90}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:".3rem",fontSize:".68rem",color:"var(--ink-dim)"}}>
            <span>Lowest: {fmt(Math.min(...weekData.map(d=>d.value)))}</span>
            <span>Highest: {fmt(Math.max(...weekData.map(d=>d.value)))}</span>
          </div>
        </div>

        {/* Payment method donut */}
        <div className="chart-container">
          <div className="card-title">💳 Payment Breakdown</div>
          {paymentSegs.length===0?(
            <div className="empty" style={{padding:"1.5rem 0"}}><p>No payments today</p></div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:"1.5rem"}}>
              <DonutChart segments={paymentSegs} size={110}/>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:".5rem"}}>
                {paymentSegs.map(seg=>(
                  <div key={seg.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",alignItems:"center",gap:".4rem"}}>
                      <div style={{width:10,height:10,borderRadius:"2px",background:seg.color}}/>
                      <span style={{fontSize:".8rem",fontWeight:500}}>{seg.label}</span>
                    </div>
                    <span style={{fontSize:".82rem",fontWeight:700,color:seg.color}}>{Math.round(seg.value/totalPayments*100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent bills */}
      <div className="flex-between mb-2">
        <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.15rem",fontWeight:700,color:"var(--ink)"}}>Recent Bills</h2>
        <button className="btn btn-ghost btn-sm" onClick={()=>navigate("/bills")}>View All →</button>
      </div>
      <div className="card mb-2" style={{padding:0}}>
        {recentBills.length===0?(
          <div className="empty"><div className="empty-icon">🧾</div><p>No bills today</p><button className="btn btn-primary mt-2" onClick={()=>navigate("/billing/new")}>Create First Bill</button></div>
        ):(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Bill #</th><th>Customer</th><th>Time</th><th className="text-right">Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recentBills.map((bill,i)=>(
                  <tr key={bill.id} className="stagger-item" style={{cursor:"pointer"}} onClick={()=>navigate(`/bills/${bill.id}`)}>
                    <td style={{color:"var(--saffron)",fontWeight:700,fontSize:".78rem",fontFamily:"var(--font-display)"}}>{bill.bill_number}</td>
                    <td style={{fontWeight:600}}>{bill.customer_name}</td>
                    <td className="text-muted text-sm">{new Date(bill.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</td>
                    <td className="text-right" style={{fontFamily:"var(--font-display)",color:"var(--saffron)",fontWeight:700}}>{fmt(bill.total)}</td>
                    <td><span className={`badge badge-${bill.status}`}>{bill.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.15rem",fontWeight:700,color:"var(--ink)",marginBottom:"1rem"}}>Quick Actions</h2>
      <div className="grid-2" style={{gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))"}}>
        {quickActions.map(({icon,label,desc,path,grad,border,color},i)=>(
          <button key={path} onClick={()=>navigate(path)} className="stagger-item" style={{
            background:grad,border:`1.5px solid ${border}`,borderRadius:"var(--r-lg)",
            padding:"1.3rem 1.4rem",textAlign:"left",cursor:"pointer",
            transition:"all .22s cubic-bezier(.34,1.56,.64,1)",
            boxShadow:"var(--sh-xs)",animationDelay:`${i*.07}s`,
          }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px) scale(1.02)";e.currentTarget.style.boxShadow="var(--sh-lg)";e.currentTarget.style.borderColor=color;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="var(--sh-xs)";e.currentTarget.style.borderColor=border;}}
          >
            <div style={{fontSize:"1.8rem",marginBottom:".6rem"}}>{icon}</div>
            <div style={{fontFamily:"var(--font-display)",color,fontSize:"1rem",fontWeight:700,marginBottom:".2rem"}}>{label}</div>
            <div style={{fontSize:".76rem",color:"var(--ink-muted)"}}>{desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
