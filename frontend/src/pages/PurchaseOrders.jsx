import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);}

export default function PurchaseOrders() {
  const [orders,setOrders]=useState([]);
  const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({supplier_name:"",cloth_type:"",meters_ordered:"",price_per_meter:"",expected_date:"",notes:""});
  const [saving,setSaving]=useState(false);
  const [catalog,setCatalog]=useState([]);

  const load=()=>{setLoading(true);Promise.all([api.getPurchaseOrders(status||undefined),api.getCatalog()]).then(([o,c])=>{setOrders(o);setCatalog(c);}).catch(console.error).finally(()=>setLoading(false));};
  useEffect(()=>{load();},[status]);

  const handleAdd=async()=>{
    if(!form.cloth_type||!form.meters_ordered){alert("Cloth type and meters required");return;}
    setSaving(true);
    try{await api.addPurchaseOrder(form);setShowForm(false);setForm({supplier_name:"",cloth_type:"",meters_ordered:"",price_per_meter:"",expected_date:"",notes:""});load();}
    catch(err){alert(err.message);}finally{setSaving(false);}
  };

  const handleStatus=async(id,s)=>{await api.updatePOStatus(id,s);load();};

  const STATUS_COLORS={pending:"amber",received:"green",cancelled:"red"};

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div><div className="page-accent"><span/><span/><span/><span/></div><h1 className="page-title">Purchase Orders</h1><p className="page-subtitle">{orders.length} order{orders.length!==1?"s":""}</p></div>
        <div className="flex gap-2">
          <select className="input" style={{width:"150px"}} value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All Orders</option><option value="pending">Pending</option><option value="received">Received</option><option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary" onClick={()=>setShowForm(true)}>+ New PO</button>
        </div>
      </div>

      {showForm&&(
        <div className="card mb-2" style={{borderColor:"#FDBA74",background:"linear-gradient(135deg,#FFFBF0,#FFF7ED)",animation:"fadeUp .25s ease"}}>
          <div className="card-title">🛒 New Purchase Order</div>
          <div className="grid-2 mb-1">
            <div className="form-group"><label className="label">Cloth Type *</label><input list="po-cloth-list" className="input" value={form.cloth_type} onChange={e=>setForm(f=>({...f,cloth_type:e.target.value}))} placeholder="Cotton, Silk…"/><datalist id="po-cloth-list">{catalog.map(c=><option key={c.id} value={c.name}/>)}</datalist></div>
            <div className="form-group"><label className="label">Supplier Name</label><input className="input" value={form.supplier_name} onChange={e=>setForm(f=>({...f,supplier_name:e.target.value}))} placeholder="Supplier"/></div>
          </div>
          <div className="grid-2 mb-1">
            <div className="form-group"><label className="label">Meters Ordered *</label><input className="input" type="number" min="0" value={form.meters_ordered} onChange={e=>setForm(f=>({...f,meters_ordered:e.target.value}))} placeholder="e.g. 100"/></div>
            <div className="form-group"><label className="label">Price / Meter (₹)</label><input className="input" type="number" min="0" value={form.price_per_meter} onChange={e=>setForm(f=>({...f,price_per_meter:e.target.value}))} placeholder="0.00"/></div>
          </div>
          <div className="grid-2 mb-1">
            <div className="form-group"><label className="label">Expected Date</label><input className="input" type="date" value={form.expected_date} onChange={e=>setForm(f=>({...f,expected_date:e.target.value}))}/></div>
            <div className="form-group"><label className="label">Notes</label><input className="input" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional"/></div>
          </div>
          <div className="flex gap-2"><button className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving?"Saving…":"Save PO"}</button></div>
        </div>
      )}

      <div className="card" style={{padding:0}}>
        {loading?<div className="loader"><div className="spinner"/></div>
        :orders.length===0?<div className="empty"><div className="empty-icon">🛒</div><p>No purchase orders found.</p></div>:(
          <div className="table-wrap">
            <table>
              <thead><tr><th>PO #</th><th>Cloth</th><th>Supplier</th><th>Meters</th><th>Expected</th><th className="text-right">Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{orders.map(o=>(
                <tr key={o.id}>
                  <td style={{color:"var(--violet)",fontWeight:700,fontSize:".8rem"}}>{o.po_number}</td>
                  <td style={{fontWeight:600}}>{o.cloth_type}</td>
                  <td className="text-muted text-sm">{o.supplier_name||"—"}</td>
                  <td className="text-sm">{o.meters_ordered}m</td>
                  <td className="text-muted text-sm">{o.expected_date?new Date(o.expected_date).toLocaleDateString("en-IN"):"—"}</td>
                  <td className="text-right" style={{fontFamily:"var(--font-display)",fontWeight:700,color:"var(--saffron)"}}>{fmt(o.total_amount)}</td>
                  <td><span className={`badge badge-${STATUS_COLORS[o.status]||"amber"}`}>{o.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      {o.status==="pending"&&<button className="btn btn-success btn-sm" onClick={()=>handleStatus(o.id,"received")}>✓ Received</button>}
                      {o.status==="pending"&&<button className="btn btn-danger btn-sm" onClick={()=>handleStatus(o.id,"cancelled")}>Cancel</button>}
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
