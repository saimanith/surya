import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n){ return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0); }

const CLOTH_COLORS=["#F97316","#E11D48","#0D9488","#7C3AED","#D97706","#059669","#2563EB","#DB2777","#0891B2","#65A30D","#DC2626","#9333EA"];

export default function Inventory() {
  const [bolts,setBolts]=useState([]);
  const [summary,setSummary]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showForm,setShowForm]=useState(false);
  const [filterStatus,setFilterStatus]=useState("active");
  const [form,setForm]=useState({cloth_type:"",total_meters:"",cost_price_per_meter:"",selling_price_per_meter:"",color:"",supplier:"",notes:"",received_date:new Date().toISOString().split("T")[0]});
  const [catalog,setCatalog]=useState([]);
  const [saving,setSaving]=useState(false);
  const [viewBolt,setViewBolt]=useState(null);

  const load=()=>{
    setLoading(true);
    Promise.all([api.getBolts({status:filterStatus||undefined}),api.getBoltSummary(),api.getCatalog()])
      .then(([b,s,c])=>{setBolts(b);setSummary(s);setCatalog(c);})
      .catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[filterStatus]);

  const handleAdd=async()=>{
    if(!form.cloth_type||!form.total_meters){alert("Cloth type and meters required");return;}
    setSaving(true);
    try{await api.addBolt(form);setShowForm(false);setForm({cloth_type:"",total_meters:"",cost_price_per_meter:"",selling_price_per_meter:"",color:"",supplier:"",notes:"",received_date:new Date().toISOString().split("T")[0]});load();}
    catch(err){alert(err.message);}finally{setSaving(false);}
  };

  const handleViewBolt=async(id)=>{
    const b=await api.getBolt(id);
    setViewBolt(b);
  };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><div className="page-accent"><span/><span/><span/><span/></div><h1 className="page-title">Inventory</h1><p className="page-subtitle">Bolts of cloth in stock</p></div>
        <div className="flex gap-2">
          <select className="input" style={{width:"140px"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="active">Active</option><option value="exhausted">Exhausted</option><option value="">All</option>
          </select>
          <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ Add Bolt</button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        {[
          {label:"Total Bolts",value:summary?.total_bolts||0,cls:"orange"},
          {label:"Total Meters",value:`${(summary?.total_meters||0).toFixed(1)}m`,cls:"teal"},
          {label:"Stock Value (Cost)",value:fmt(summary?.inventory_value),cls:"violet"},
          {label:"Low Stock Bolts",value:summary?.low_stock||0,cls:summary?.low_stock>0?"red":"green"},
        ].map(({label,value,cls})=>(
          <div className={`stat-card ${cls}`} key={label}><div className="stat-label">{label}</div><div className={`stat-value ${cls}`}>{value}</div></div>
        ))}
      </div>

      {/* Add Bolt Form */}
      {showForm&&(
        <div className="card mb-2" style={{borderColor:"#FDBA74",background:"linear-gradient(135deg,#FFFBF0,#FFF7ED)",animation:"fadeUp .25s ease"}}>
          <div className="card-title">📦 Add New Bolt</div>
          <div className="grid-2 mb-1">
            <div className="form-group">
              <label className="label">Cloth Type *</label>
              <input list="bolt-cloth-list" className="input" value={form.cloth_type} onChange={e=>setForm(f=>({...f,cloth_type:e.target.value}))} placeholder="Cotton, Silk…" />
              <datalist id="bolt-cloth-list">{catalog.map(c=><option key={c.id} value={c.name}/>)}</datalist>
            </div>
            <div className="form-group"><label className="label">Total Meters *</label><input className="input" type="number" min="0" value={form.total_meters} onChange={e=>setForm(f=>({...f,total_meters:e.target.value}))} placeholder="e.g. 50" /></div>
          </div>
          <div className="grid-2 mb-1">
            <div className="form-group"><label className="label">Cost Price / Meter (₹)</label><input className="input" type="number" min="0" value={form.cost_price_per_meter} onChange={e=>setForm(f=>({...f,cost_price_per_meter:e.target.value}))} placeholder="Purchase price"/></div>
            <div className="form-group"><label className="label">Selling Price / Meter (₹)</label><input className="input" type="number" min="0" value={form.selling_price_per_meter} onChange={e=>setForm(f=>({...f,selling_price_per_meter:e.target.value}))} placeholder="Your selling price"/></div>
          </div>
          <div className="grid-2 mb-1">
            <div className="form-group"><label className="label">Color / Shade</label><input className="input" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} placeholder="e.g. Navy Blue"/></div>
            <div className="form-group"><label className="label">Supplier</label><input className="input" value={form.supplier} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))} placeholder="Supplier name"/></div>
          </div>
          <div className="grid-2 mb-1">
            <div className="form-group"><label className="label">Received Date</label><input className="input" type="date" value={form.received_date} onChange={e=>setForm(f=>({...f,received_date:e.target.value}))}/></div>
            <div className="form-group"><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional notes"/></div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving?"Adding…":"+ Add Bolt"}</button>
          </div>
        </div>
      )}

      {/* Bolt Grid */}
      {loading?<div className="loader"><div className="spinner"/></div>:(
        bolts.length===0?<div className="card"><div className="empty"><div className="empty-icon">📦</div><p>No bolts found. Add your first bolt of cloth.</p></div></div>:(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:"1rem"}}>
            {bolts.map((b,i)=>{
              const color=CLOTH_COLORS[i%CLOTH_COLORS.length];
              const pct=b.total_meters>0?Math.round((b.remaining_meters/b.total_meters)*100):0;
              const isLow=b.remaining_meters<5;
              return (
                <div key={b.id} className="stagger-item" onClick={()=>handleViewBolt(b.id)} style={{
                  background:"#FFFFFF",border:`1.5px solid ${isLow?"#FECDD3":"var(--border-soft)"}`,
                  borderRadius:"var(--r-lg)",padding:"1.2rem",cursor:"pointer",
                  transition:"all .25s cubic-bezier(.34,1.56,.64,1)",
                  boxShadow:isLow?"0 2px 12px #F43F5E20":"var(--sh-xs)",
                  animationDelay:`${(i%6)*.06}s`,
                  borderTop:`4px solid ${color}`,
                }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="var(--sh-lg)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=isLow?"0 2px 12px #F43F5E20":"var(--sh-xs)";}}
                >
                  <div className="flex-between mb-1">
                    <span style={{fontFamily:"var(--font-display)",fontSize:".7rem",fontWeight:700,color,letterSpacing:".06em"}}>{b.id}</span>
                    <span className={`badge badge-${b.status}`}>{b.status}</span>
                  </div>
                  <div style={{fontWeight:700,fontSize:"1rem",marginBottom:".2rem"}}>{b.cloth_type}</div>
                  {b.color&&<div style={{fontSize:".76rem",color:"var(--ink-muted)",marginBottom:".6rem"}}>🎨 {b.color}</div>}
                  {/* Progress bar */}
                  <div style={{height:"6px",background:"var(--cream-deep)",borderRadius:"99px",overflow:"hidden",marginBottom:".4rem"}}>
                    <div style={{height:"100%",borderRadius:"99px",width:`${pct}%`,background:isLow?"linear-gradient(to right,#F43F5E,#FB7185)":pct<50?"linear-gradient(to right,#F59E0B,#FBBF24)":`linear-gradient(to right,${color},${color}99)`,transition:"width .5s ease"}}/>
                  </div>
                  <div className="flex-between">
                    <span style={{fontSize:".8rem",fontWeight:700,color:isLow?"var(--rose-dk)":"var(--ink-soft)"}}>{b.remaining_meters.toFixed(1)}m left</span>
                    <span style={{fontSize:".72rem",color:"var(--ink-dim)"}}>{pct}%</span>
                  </div>
                  {b.selling_price_per_meter>0&&<div style={{marginTop:".4rem",fontSize:".78rem",color:"var(--saffron)",fontWeight:600}}>₹{b.selling_price_per_meter}/m</div>}
                  {isLow&&<div style={{marginTop:".5rem",fontSize:".72rem",color:"var(--rose-dk)",fontWeight:700,background:"#FFF1F2",borderRadius:"6px",padding:".2rem .5rem",textAlign:"center"}}>⚠️ Low Stock</div>}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Bolt Detail Modal */}
      {viewBolt&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,.7)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}} onClick={e=>{if(e.target===e.currentTarget)setViewBolt(null);}}>
          <div style={{background:"var(--cream)",borderRadius:"24px",padding:"2rem",width:"100%",maxWidth:"560px",maxHeight:"80vh",overflow:"auto",boxShadow:"var(--sh-xl)",animation:"popIn .3s ease"}}>
            <div className="flex-between mb-2">
              <div><div style={{fontFamily:"var(--font-display)",fontSize:".8rem",color:"var(--saffron)",fontWeight:700}}>{viewBolt.id}</div><h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem"}}>{viewBolt.cloth_type}</h2></div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setViewBolt(null)}>✕ Close</button>
            </div>
            <div className="grid-2 mb-2">
              {[["Total",`${viewBolt.total_meters}m`],["Remaining",`${viewBolt.remaining_meters.toFixed(1)}m`],["Cost/m",`₹${viewBolt.cost_price_per_meter}`],["Sell/m",`₹${viewBolt.selling_price_per_meter}`],["Color",viewBolt.color||"—"],["Supplier",viewBolt.supplier||"—"]].map(([l,v])=>(
                <div key={l} style={{background:"var(--cream-warm)",borderRadius:"var(--r-sm)",padding:".7rem 1rem"}}>
                  <div className="label">{l}</div><div style={{fontWeight:600}}>{v}</div>
                </div>
              ))}
            </div>
            {viewBolt.usage?.length>0&&(<>
              <div className="card-title">Usage History</div>
              <div className="table-wrap">
                <table><thead><tr><th>Bill #</th><th>Customer</th><th>Meters Used</th><th>Date</th></tr></thead>
                <tbody>{viewBolt.usage.map(u=>(
                  <tr key={u.id}><td style={{color:"var(--saffron)",fontWeight:700,fontSize:".8rem"}}>{u.bill_number}</td><td>{u.customer_name}</td><td style={{fontWeight:600}}>{u.meters}m</td><td className="text-muted text-sm">{new Date(u.date).toLocaleDateString("en-IN")}</td></tr>
                ))}</tbody></table>
              </div>
            </>)}
          </div>
        </div>
      )}
    </div>
  );
}
