import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0);}

export default function PurchaseOrders(){
  const [orders,setOrders]=useState([]);
  const [bolts,setBolts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [orderType,setOrderType]=useState("new"); // new | reorder
  const [catalog,setCatalog]=useState([]);
  const [saving,setSaving]=useState(false);
  const [imagePreview,setImagePreview]=useState(null);

  // Form state
  const [form,setForm]=useState({
    supplier_name:"",cloth_type:"",bolt_ref:"",meters_ordered:"",
    price_per_meter:"",expected_date:"",notes:"",description:"",image:null
  });

  const load=()=>{
    setLoading(true);
    Promise.all([
      api.getPurchaseOrders(status||undefined),
      api.getCatalog(),
      api.getBolts({status:"active"}),
    ]).then(([o,c,b])=>{setOrders(o);setCatalog(c);setBolts(b);})
    .catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[status]);

  const handleImageChange=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setForm(f=>({...f,image:file}));
  };

  const handleSelectBolt=(boltId)=>{
    const bolt=bolts.find(b=>b.id===boltId);
    if(!bolt)return;
    setForm(f=>({...f,
      bolt_ref:bolt.id,
      cloth_type:bolt.cloth_type,
      price_per_meter:String(bolt.cost_price_per_meter),
      description:`Reorder of ${bolt.bolt_name||bolt.cloth_type} (${bolt.id})`,
    }));
  };

  const handleAdd=async()=>{
    if(!form.cloth_type||!form.meters_ordered){alert("Cloth type and meters required");return;}
    setSaving(true);
    try{
      await api.addPurchaseOrder({
        supplier_name:form.supplier_name,
        cloth_type:form.cloth_type,
        bolt_ref:form.bolt_ref||null,
        meters_ordered:form.meters_ordered,
        price_per_meter:form.price_per_meter,
        expected_date:form.expected_date,
        notes:`${form.description||""} ${form.notes||""}`.trim(),
        order_type:orderType,
      });
      setShowForm(false);
      setForm({supplier_name:"",cloth_type:"",bolt_ref:"",meters_ordered:"",price_per_meter:"",expected_date:"",notes:"",description:"",image:null});
      setImagePreview(null);
      load();
    }catch(err){alert(err.message);}
    finally{setSaving(false);}
  };

  const handleStatus=async(id,s)=>{await api.updatePOStatus(id,s);load();};
  const STATUS_COLORS={pending:"amber",received:"green",cancelled:"red"};

  return(
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <div className="page-accent"><span/><span/><span/><span/></div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{orders.length} order{orders.length!==1?"s":""}</p>
        </div>
        <div className="flex gap-2">
          <select className="input" style={{width:"150px"}} value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary" onClick={()=>setShowForm(!showForm)}>+ New PO</button>
        </div>
      </div>

      {/* Add form */}
      {showForm&&(
        <div className="card mb-2" style={{borderColor:"#FDBA74",background:"linear-gradient(135deg,#FFFBF0,#FFF7ED)",animation:"fadeUp .22s ease"}}>
          <div className="flex-between mb-2">
            <div className="card-title" style={{margin:0}}>🛒 New Purchase Order</div>
            {/* Order type toggle */}
            <div className="tab-group">
              <button className={`tab-item ${orderType==="new"?"active":""}`} onClick={()=>setOrderType("new")}>🆕 New Cloth</button>
              <button className={`tab-item ${orderType==="reorder"?"active":""}`} onClick={()=>setOrderType("reorder")}>🔄 Reorder Existing</button>
            </div>
          </div>

          {orderType==="reorder"&&(
            <div className="form-group" style={{background:"var(--cream-deep)",borderRadius:"var(--r-sm)",padding:".8rem 1rem",marginBottom:"1rem"}}>
              <label className="label">Select Existing Bolt to Reorder</label>
              <select className="input" onChange={e=>handleSelectBolt(e.target.value)} defaultValue="">
                <option value="">— Pick a bolt —</option>
                {bolts.map(b=>(
                  <option key={b.id} value={b.id}>
                    {b.id} · {b.bolt_name||b.cloth_type}{b.color?` (${b.color})`:""} · {b.remaining_meters.toFixed(1)}m left
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid-2 mb-1">
            <div className="form-group">
              <label className="label">Cloth Type *</label>
              <input list="po-cloth-list" className="input" value={form.cloth_type}
                onChange={e=>setForm(f=>({...f,cloth_type:e.target.value}))} placeholder="Cotton, Silk…"/>
              <datalist id="po-cloth-list">{catalog.map(c=><option key={c.id} value={c.name}/>)}</datalist>
            </div>
            <div className="form-group">
              <label className="label">Supplier Name</label>
              <input className="input" value={form.supplier_name}
                onChange={e=>setForm(f=>({...f,supplier_name:e.target.value}))} placeholder="Supplier / Distributor"/>
            </div>
          </div>

          <div className="grid-2 mb-1">
            <div className="form-group">
              <label className="label">Meters to Order *</label>
              <input className="input" type="number" min="0" value={form.meters_ordered}
                onChange={e=>setForm(f=>({...f,meters_ordered:e.target.value}))} placeholder="e.g. 100"/>
            </div>
            <div className="form-group">
              <label className="label">Expected Price / Meter (₹)</label>
              <input className="input" type="number" min="0" value={form.price_per_meter}
                onChange={e=>setForm(f=>({...f,price_per_meter:e.target.value}))} placeholder="0.00"/>
            </div>
          </div>

          <div className="grid-2 mb-1">
            <div className="form-group">
              <label className="label">Expected Delivery Date</label>
              <input className="input" type="date" value={form.expected_date}
                onChange={e=>setForm(f=>({...f,expected_date:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="label">Description / Notes</label>
              <input className="input" value={form.description}
                onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Colour, pattern, grade…"/>
            </div>
          </div>

          {/* Image upload for new cloth */}
          {orderType==="new"&&(
            <div className="form-group">
              <label className="label">Reference Image (optional)</label>
              <div style={{display:"flex",gap:"1rem",alignItems:"flex-start"}}>
                <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"110px",height:"90px",border:"2px dashed var(--border)",borderRadius:"var(--r-sm)",cursor:"pointer",background:"var(--cream-warm)",transition:"border-color .18s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--saffron)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={handleImageChange}/>
                  {imagePreview
                    ?<img src={imagePreview} style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"var(--r-sm)"}} alt="preview"/>
                    :<><div style={{fontSize:"1.5rem"}}>📷</div><div style={{fontSize:".68rem",color:"var(--ink-dim)",marginTop:".2rem"}}>Upload image</div></>
                  }
                </label>
                {imagePreview&&(
                  <button className="btn btn-danger btn-sm" onClick={()=>{setImagePreview(null);setForm(f=>({...f,image:null}));}}>Remove</button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={()=>{setShowForm(false);setImagePreview(null);}}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving?"Saving…":"Save Order"}</button>
          </div>
        </div>
      )}

      {/* Orders list */}
      <div className="card" style={{padding:0}}>
        {loading?<div className="loader"><div className="spinner"/></div>
        :orders.length===0?(
          <div className="empty"><div className="empty-icon">🛒</div><p>No purchase orders yet.</p></div>
        ):(
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>PO #</th><th>Type</th><th>Cloth</th><th>Supplier</th><th>Meters</th><th>Expected</th><th className="text-right">Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {orders.map(o=>(
                  <tr key={o.id}>
                    <td style={{color:"var(--violet)",fontWeight:700,fontSize:".78rem"}}>{o.po_number}</td>
                    <td>
                      <span style={{fontSize:".7rem",background:o.order_type==="reorder"?"#EFF6FF":"#F0FDF4",color:o.order_type==="reorder"?"var(--indigo)":"var(--jade)",borderRadius:"99px",padding:".15rem .55rem",fontWeight:700}}>
                        {o.order_type==="reorder"?"🔄 Reorder":"🆕 New"}
                      </span>
                    </td>
                    <td style={{fontWeight:600}}>{o.cloth_type}</td>
                    <td className="text-muted text-sm">{o.supplier_name||"—"}</td>
                    <td>{o.meters_ordered}m</td>
                    <td className="text-muted text-sm">{o.expected_date?new Date(o.expected_date).toLocaleDateString("en-IN"):"—"}</td>
                    <td className="text-right" style={{fontFamily:"var(--font-display)",fontWeight:700,color:"var(--saffron)"}}>{fmt(o.total_amount)}</td>
                    <td><span className={`badge badge-${STATUS_COLORS[o.status]||"amber"}`}>{o.status}</span></td>
                    <td>
                      <div className="flex gap-1">
                        {o.status==="pending"&&(
                          <><button className="btn btn-success btn-sm" onClick={()=>handleStatus(o.id,"received")}>✓ Received</button>
                          <button className="btn btn-danger btn-sm" onClick={()=>handleStatus(o.id,"cancelled")}>✕</button></>
                        )}
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
