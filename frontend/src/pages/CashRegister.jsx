import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);}

export default function CashRegister() {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [date,setDate]=useState(new Date().toISOString().split("T")[0]);
  const [type,setType]=useState("deposit");
  const [amount,setAmount]=useState("");
  const [desc,setDesc]=useState("");
  const [saving,setSaving]=useState(false);

  const load=()=>{setLoading(true);api.getCash(date).then(setData).catch(console.error).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[date]);

  const handleAdd=async()=>{
    if(!amount||parseFloat(amount)<=0){alert("Enter a valid amount");return;}
    setSaving(true);
    try{await api.addCashEntry({type,amount:parseFloat(amount),description:desc,date});setAmount("");setDesc("");load();}
    catch(err){alert(err.message);}finally{setSaving(false);}
  };

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><div className="page-accent"><span/><span/><span/><span/></div><h1 className="page-title">Cash Register</h1><p className="page-subtitle">Daily cash tracking</p></div>
        <div><label className="label">Date</label><input type="date" className="input" style={{width:"165px"}} value={date} onChange={e=>setDate(e.target.value)}/></div>
      </div>

      {loading?<div className="loader"><div className="spinner"/></div>:(
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            {[
              {label:"Opening Cash",value:fmt(data?.opening),cls:"amber"},
              {label:"Cash Sales",value:fmt(data?.cashSales),cls:"orange"},
              {label:"Deposits",value:fmt(data?.deposits),cls:"green"},
              {label:"Current Balance",value:fmt(data?.balance),cls:"violet"},
            ].map(({label,value,cls})=>(
              <div className={`stat-card ${cls}`} key={label}><div className="stat-label">{label}</div><div className={`stat-value ${cls}`}>{value}</div></div>
            ))}
          </div>

          {/* Add Entry */}
          <div className="card mb-2">
            <div className="card-title">+ Add Cash Entry</div>
            <div className="flex gap-2" style={{alignItems:"flex-end",flexWrap:"wrap"}}>
              <div><label className="label">Type</label>
                <select className="input" style={{width:"150px"}} value={type} onChange={e=>setType(e.target.value)}>
                  <option value="opening">💵 Opening</option>
                  <option value="deposit">⬇️ Deposit</option>
                  <option value="withdrawal">⬆️ Withdrawal</option>
                </select>
              </div>
              <div style={{flex:1,minWidth:"120px"}}><label className="label">Amount (₹)</label><input className="input" type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></div>
              <div style={{flex:2,minWidth:"180px"}}><label className="label">Description</label><input className="input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. Morning opening balance"/></div>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving?"Adding…":"+ Add"}</button>
            </div>
          </div>

          {/* Entries */}
          <div className="card" style={{padding:0}}>
            {!data?.entries?.length?<div className="empty"><div className="empty-icon">💵</div><p>No cash entries for this date.</p></div>:(
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Time</th><th>Type</th><th>Description</th><th className="text-right">Amount</th></tr></thead>
                  <tbody>
                    {data.entries.map(e=>(
                      <tr key={e.id}>
                        <td className="text-muted text-sm">{new Date(e.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</td>
                        <td><span style={{fontSize:".75rem",fontWeight:700,padding:".2rem .7rem",borderRadius:"99px",textTransform:"capitalize",background:e.type==="deposit"?"#F0FDF4":e.type==="withdrawal"?"#FFF1F2":"#FFFBEB",color:e.type==="deposit"?"#15803D":e.type==="withdrawal"?"#BE123C":"#B45309"}}>{e.type}</span></td>
                        <td>{e.description||"—"}</td>
                        <td className="text-right" style={{fontFamily:"var(--font-display)",fontWeight:700,color:e.type==="withdrawal"?"var(--rose-dk)":"var(--jade)"}}>{e.type==="withdrawal"?`− `:``}{fmt(e.amount)}</td>
                      </tr>
                    ))}
                    <tr style={{background:"var(--cream-deep)",fontWeight:700}}>
                      <td colSpan={3} style={{textAlign:"right",paddingRight:"1rem",fontFamily:"var(--font-display)"}}>Closing Balance</td>
                      <td className="text-right" style={{fontFamily:"var(--font-display)",fontSize:"1.1rem",color:"var(--saffron)",fontWeight:700}}>{fmt(data.balance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
