import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);}
const EXP_CATEGORIES=["rent","electricity","salary","transport","maintenance","supplies","misc"];

export default function Expenditures(){
  const [items,setItems]=useState([]);
  const [summary,setSummary]=useState(null);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("all");
  const [date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({type:"expense",category:"misc",description:"",party_name:"",party_phone:"",amount:"",due_date:""});
  const [saving,setSaving]=useState(false);

  const load=()=>{
    setLoading(true);
    Promise.all([api.getExpenditures(date,tab==="all"?"":tab),api.getExpSummary(date)])
      .then(([d,s])=>{setItems(d);setSummary(s);})
      .catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[date,tab]);

  const handleAdd=async()=>{
    if(!form.description||!form.amount){alert("Description and amount required");return;}
    setSaving(true);
    try{await api.addExpenditure(form);setShowForm(false);setForm({type:"expense",category:"misc",description:"",party_name:"",party_phone:"",amount:"",due_date:""});load();}
    catch(err){alert(err.message);}finally{setSaving(false);}
  };
  const handleStatus=async(id,status)=>{await api.updateExpStatus(id,status);load();};
  const handleDelete=async(id)=>{if(!confirm("Delete this entry?"))return;await api.deleteExpenditure(id);load();};

  // Split lending: outstanding vs returned
  const lendingItems = items.filter(i=>i.type==="lending");
  const outstanding = lendingItems.filter(i=>i.status==="pending");
  const returned = lendingItems.filter(i=>i.status==="returned");
  const expenses = items.filter(i=>i.type==="expense");

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><div className="page-accent"><span/><span/><span/><span/></div><h1 className="page-title">Expenditures & Lending</h1><p className="page-subtitle">Track expenses and money lent out</p></div>
        <div className="flex gap-2" style={{alignItems:"flex-end"}}>
          <div><label className="label">Date</label><input type="date" className="input" style={{width:"160px"}} value={date} onChange={e=>setDate(e.target.value)}/></div>
          <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>+ Add Entry</button>
        </div>
      </div>

      {/* Summary — clearly separated */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem",marginBottom:"1.5rem"}}>
        {/* Expenses card */}
        <div style={{background:"linear-gradient(135deg,#FFF1F2,#FFE4E6)",border:"1.5px solid #FDA4AF",borderRadius:"var(--r)",padding:"1.2rem 1.4rem"}}>
          <div className="stat-label">💸 Total Expenses</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",fontWeight:800,color:"var(--rose-dk)"}}>{fmt(summary?.total_expense)}</div>
          <div style={{fontSize:".72rem",color:"var(--rose-dk)",marginTop:".3rem",opacity:.7}}>Money spent on operations</div>
        </div>

        {/* Outstanding lending */}
        <div style={{background:"linear-gradient(135deg,#FFFBEB,#FEF3C7)",border:"1.5px solid #FCD34D",borderRadius:"var(--r)",padding:"1.2rem 1.4rem"}}>
          <div className="stat-label">⏳ Outstanding Loans</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",fontWeight:800,color:"var(--amber)"}}>{fmt(summary?.pending_returns)}</div>
          <div style={{fontSize:".72rem",color:"var(--amber)",marginTop:".3rem",opacity:.8}}>Money owed to you — not yet returned</div>
        </div>

        {/* Returned — NOT outstanding, just history */}
        <div style={{background:"linear-gradient(135deg,#F0FDF4,#DCFCE7)",border:"1.5px solid #86EFAC",borderRadius:"var(--r)",padding:"1.2rem 1.4rem"}}>
          <div className="stat-label">✅ Loans Returned</div>
          <div style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",fontWeight:800,color:"var(--jade)"}}>{fmt(returned.reduce((s,i)=>s+i.amount,0))}</div>
          <div style={{fontSize:".72rem",color:"var(--jade)",marginTop:".3rem",opacity:.8}}>Fully settled — no balance remaining</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-group mb-2">
        {["all","expense","lending"].map(t=>(
          <button key={t} className={`tab-item ${tab===t?"active":""}`} onClick={()=>setTab(t)}>
            {t==="all"?"All":t==="expense"?"💸 Expenses":"🤝 Lending"}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm&&(
        <div className="card mb-2" style={{border:"2px solid var(--saffron-pale)",animation:"fadeUp .25s ease"}}>
          <div className="card-title">➕ New Entry</div>
          <div className="grid-2 mb-1">
            <div><label className="label">Type</label>
              <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="expense">💸 Expense</option>
                <option value="lending">🤝 Lending</option>
              </select>
            </div>
            {form.type==="expense"?(
              <div><label className="label">Category</label>
                <select className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {EXP_CATEGORIES.map(c=><option key={c} value={c} style={{textTransform:"capitalize"}}>{c}</option>)}
                </select>
              </div>
            ):(
              <div><label className="label">Person / Party Name</label>
                <input className="input" value={form.party_name} onChange={e=>setForm(f=>({...f,party_name:e.target.value}))} placeholder="Who borrowed?"/>
              </div>
            )}
          </div>
          <div className="grid-2 mb-1">
            <div><label className="label">Description *</label><input className="input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What is this for?"/></div>
            <div><label className="label">Amount (₹) *</label><input className="input" type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00"/></div>
          </div>
          {form.type==="lending"&&(
            <div className="grid-2 mb-1">
              <div><label className="label">Phone</label><input className="input" value={form.party_phone} onChange={e=>setForm(f=>({...f,party_phone:e.target.value.replace(/\D/g,"").slice(0,10)}))} placeholder="Optional"/></div>
              <div><label className="label">Due Date</label><input className="input" type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/></div>
            </div>
          )}
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving?"Saving…":"Save Entry"}</button>
          </div>
        </div>
      )}

      {/* Outstanding loans — shown prominently if any */}
      {(tab==="all"||tab==="lending")&&outstanding.length>0&&(
        <div className="card mb-2" style={{border:"2px solid #FCD34D",background:"linear-gradient(135deg,#FFFBEB,#FFF)"}}>
          <div className="card-title" style={{color:"var(--amber)"}}>⏳ Outstanding — Money Owed to You ({outstanding.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:".5rem"}}>
            {outstanding.map(item=>(
              <div key={item.id} style={{display:"flex",alignItems:"center",gap:"1rem",padding:".7rem 1rem",background:"#FFFBF5",borderRadius:"var(--r-sm)",border:"1px solid #FDE68A"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700}}>{item.party_name||"Unknown"}</div>
                  <div className="text-muted text-sm">{item.description}{item.due_date?` · Due: ${new Date(item.due_date).toLocaleDateString("en-IN")}`:""}</div>
                </div>
                <div style={{fontFamily:"var(--font-display)",fontWeight:800,color:"var(--amber)",fontSize:"1.1rem"}}>{fmt(item.amount)}</div>
                <button className="btn btn-success btn-sm" onClick={()=>handleStatus(item.id,"returned")}>✓ Returned</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(item.id)}>🗑</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="card" style={{padding:0}}>
        {loading?<div className="loader"><div className="spinner"/></div>
        :items.length===0?<div className="empty"><div className="empty-icon">{tab==="lending"?"🤝":"💸"}</div><p>No entries found.</p></div>
        :(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Description</th><th>Party</th><th>Date</th><th className="text-right">Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(item=>(
                  <tr key={item.id} style={{opacity:item.type==="lending"&&item.status==="returned"?.65:1}}>
                    <td>
                      <span style={{fontSize:".72rem",fontWeight:700,textTransform:"capitalize",padding:".2rem .7rem",borderRadius:"99px",background:item.type==="lending"?"#FFFBEB":"#FFF1F2",color:item.type==="lending"?"var(--amber)":"var(--rose-dk)"}}>
                        {item.type==="lending"?"🤝":"💸"} {item.type}
                      </span>
                    </td>
                    <td>
                      <div style={{fontWeight:600}}>{item.description}</div>
                      {item.category&&<div style={{fontSize:".7rem",color:"var(--ink-muted)",textTransform:"capitalize"}}>{item.category}</div>}
                    </td>
                    <td className="text-muted text-sm">
                      {item.party_name||"—"}
                      {item.due_date&&item.status==="pending"&&<div style={{fontSize:".68rem",color:"var(--rose-dk)",fontWeight:600}}>Due: {new Date(item.due_date).toLocaleDateString("en-IN")}</div>}
                    </td>
                    <td className="text-muted text-sm">{new Date(item.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="text-right" style={{fontFamily:"var(--font-display)",fontWeight:700,color:item.type==="lending"?item.status==="returned"?"var(--jade)":"var(--amber)":"var(--rose-dk)"}}>{fmt(item.amount)}</td>
                    <td>
                      {item.type==="lending"?(
                        item.status==="returned"
                          ?<span className="badge badge-settled">✅ Returned — Settled</span>
                          :<span className="badge badge-pending">⏳ Pending Return</span>
                      ):<span style={{fontSize:".72rem",color:"var(--ink-dim)"}}>Expense</span>}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {item.type==="lending"&&item.status==="pending"&&(
                          <button className="btn btn-success btn-sm" onClick={()=>handleStatus(item.id,"returned")}>✓ Returned</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(item.id)}>🗑</button>
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
