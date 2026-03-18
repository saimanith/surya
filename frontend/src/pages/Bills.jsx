import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

function fmt(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);}

export default function Bills() {
  const navigate=useNavigate();
  const [bills,setBills]=useState([]);
  const [loading,setLoading]=useState(true);
  const [filterDate,setFilterDate]=useState(new Date().toISOString().split("T")[0]);
  const [filterStatus,setFilterStatus]=useState("");
  const [deleteTarget,setDeleteTarget]=useState(null);

  const load=()=>{
    setLoading(true);
    api.getAllBills(filterDate).then(data=>{setBills(filterStatus?data.filter(b=>b.status===filterStatus):data);})
    .catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[filterDate,filterStatus]);

  const handleDelete=async(password)=>{
    await api.deleteBill(deleteTarget.id,password);
    setDeleteTarget(null); load();
  };

  const handleStatus=async(id,status,e)=>{e.stopPropagation();await api.updateStatus(id,status);load();};
  const totalShown=bills.reduce((s,b)=>s+b.total,0);

  return (
    <div className="page">
      {deleteTarget&&<DeleteConfirmModal bill={deleteTarget} onConfirm={handleDelete} onClose={()=>setDeleteTarget(null)}/>}

      <div className="page-header flex-between">
        <div><div className="page-accent"><span/><span/><span/><span/></div><h1 className="page-title">All Bills</h1><p className="page-subtitle">{bills.length} bill{bills.length!==1?"s":""} · {fmt(totalShown)}</p></div>
        <button className="btn btn-primary" onClick={()=>navigate("/billing/new")}>+ New Bill</button>
      </div>

      <div className="card mb-2" style={{padding:"1rem 1.5rem"}}>
        <div className="flex gap-2" style={{flexWrap:"wrap",alignItems:"flex-end"}}>
          <div><label className="label">📅 Date</label><input type="date" className="input" style={{width:"170px"}} value={filterDate} onChange={e=>setFilterDate(e.target.value)}/></div>
          <div><label className="label">Status</label>
            <select className="input" style={{width:"150px"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              <option value="">All</option><option value="pending">⏳ Pending</option><option value="settled">✅ Settled</option><option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setFilterDate(new Date().toISOString().split("T")[0]);setFilterStatus("");}}>Reset</button>
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        {loading?<div className="loader"><div className="spinner"/></div>
        :bills.length===0?<div className="empty"><div className="empty-icon">🧾</div><p>No bills found.</p><button className="btn btn-primary mt-2" onClick={()=>navigate("/billing/new")}>Create Bill</button></div>:(
          <div className="table-wrap">
            <table>
              <thead><tr><th>Bill #</th><th>Customer</th><th>Phone</th><th>Payment</th><th>Paid?</th><th>Time</th><th className="text-right">Total</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{bills.map(bill=>(
                <tr key={bill.id} className="stagger-item" onClick={()=>navigate(`/bills/${bill.id}`)} style={{cursor:"pointer"}}>
                  <td style={{color:"var(--saffron)",fontWeight:700,fontSize:".8rem",fontFamily:"var(--font-display)"}}>{bill.bill_number}</td>
                  <td style={{fontWeight:600}}>{bill.customer_name}</td>
                  <td className="text-muted text-sm">{bill.customer_phone||"—"}</td>
                  <td><span style={{textTransform:"capitalize",fontSize:".78rem",background:"var(--cream-deep)",padding:".2rem .6rem",borderRadius:"99px",fontWeight:600,color:"var(--ink-soft)"}}>{bill.payment_method}</span></td>
                  <td><span className={`badge badge-${bill.payment_status==="paid"?"paid":"unpaid"}`}>{bill.payment_status==="paid"?"Paid":"Unpaid"}</span></td>
                  <td className="text-muted text-sm">{new Date(bill.created_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</td>
                  <td className="text-right" style={{fontFamily:"var(--font-display)",color:"var(--saffron)",fontWeight:700}}>{fmt(bill.total)}</td>
                  <td><span className={`badge badge-${bill.status}`}>{bill.status}</span></td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div className="flex gap-1">
                      {bill.status==="pending"&&<button className="btn btn-success btn-sm" onClick={e=>handleStatus(bill.id,"settled",e)}>✓</button>}
                      <button className="btn btn-danger btn-sm" onClick={e=>{e.stopPropagation();setDeleteTarget(bill);}}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
