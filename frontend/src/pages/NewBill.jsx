import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import PaymentModal from "../components/PaymentModal";
import { validateName, validatePhone, validateEmail, validateMeters, validatePrice } from "../utils/validate";

const EMPTY_ITEM = () => ({ id: Date.now()+Math.random(), cloth_type:"", bolt_id:"", meters:"", price_per_meter:"" });
function fmt(n) { return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(n||0); }
function Field({label,error,children}){ return <div className="form-group"><label className="label">{label}</label>{children}{error&&<div className="field-error">⚠️ {error}</div>}</div>; }

export default function NewBill() {
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [bolts, setBolts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedBill, setSavedBill] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const [customer_name, setCustomerName] = useState("");
  const [customer_phone, setCustomerPhone] = useState("");
  const [customer_email, setCustomerEmail] = useState("");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([EMPTY_ITEM()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.getCatalog().then(setCatalog).catch(console.error);
    api.getBolts({status:"active"}).then(setBolts).catch(console.error);
  }, []);

  const updateItem = (id,field,val) => setItems(p=>p.map(i=>i.id===id?{...i,[field]:val}:i));
  const setClothType = (id,name) => {
    const cloth = catalog.find(c=>c.name===name);
    setItems(p=>p.map(i=>i.id===id?{...i,cloth_type:name,price_per_meter:cloth?.default_price!=null?String(cloth.default_price):i.price_per_meter}:i));
  };

  const validate = () => {
    const e = {};
    const ne = validateName(customer_name); if(ne) e.name = ne;
    const pe = validatePhone(customer_phone); if(pe) e.phone = pe;
    const ee = validateEmail(customer_email); if(ee) e.email = ee;
    items.forEach((item,idx) => {
      const me = validateMeters(item.meters); if(me) e[`meters_${idx}`] = me;
      const pre = validatePrice(item.price_per_meter); if(pre) e[`price_${idx}`] = pre;
      if(!item.cloth_type) e[`cloth_${idx}`] = "Select a cloth type";
    });
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const subtotal = items.reduce((s,i)=>(s+(parseFloat(i.meters)||0)*(parseFloat(i.price_per_meter)||0)),0);
  const discountAmt = subtotal*((parseFloat(discount)||0)/100);
  const tax = (subtotal-discountAmt)*0.05;
  const total = subtotal-discountAmt+tax;

  const handleSave = async (andPay=false) => {
    if (!validate()) return;
    setSaving(true);
    try {
      const bill = await api.createBill({
        customer_name:customer_name.trim(),
        customer_phone:customer_phone.trim()||null,
        customer_email:customer_email.trim()||null,
        discount:parseFloat(discount)||0, notes,
        items:items.map(i=>({cloth_type:i.cloth_type,bolt_id:i.bolt_id||null,meters:parseFloat(i.meters),price_per_meter:parseFloat(i.price_per_meter)})),
      });
      if(andPay){setSavedBill(bill);setShowPayment(true);}
      else navigate(`/bills/${bill.id}`);
    } catch(err){alert("Error: "+err.message);}
    finally{setSaving(false);}
  };

  return (
    <div className="page">
      {showPayment&&savedBill&&<PaymentModal bill={savedBill} onClose={()=>{setShowPayment(false);navigate(`/bills/${savedBill.id}`);}} onPaid={()=>navigate(`/bills/${savedBill.id}`)} />}

      <div className="page-header flex-between">
        <div><div className="page-accent"><span/><span/><span/><span/></div><h1 className="page-title">New Bill</h1><p className="page-subtitle">{new Date().toLocaleString("en-IN")}</p></div>
        <button className="btn btn-ghost" onClick={()=>navigate("/bills")}>Cancel</button>
      </div>

      {/* Customer */}
      <div className="card mb-2">
        <div className="card-title">👤 Customer Details</div>
        <div className="grid-2">
          <Field label="Customer Name *" error={errors.name}>
            <input className={`input${errors.name?" error":""}`} value={customer_name}
              onChange={e=>{ setCustomerName(e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s.''-]/g,"")); setErrors(p=>({...p,name:null})); }}
              placeholder="e.g. Ramesh Kumar" />
          </Field>
          <Field label="Phone Number" error={errors.phone}>
            <input className={`input${errors.phone?" error":""}`} value={customer_phone}
              onChange={e=>{ setCustomerPhone(e.target.value.replace(/\D/g,"").slice(0,10)); setErrors(p=>({...p,phone:null})); }}
              placeholder="10-digit mobile number" maxLength={10} inputMode="numeric" />
          </Field>
        </div>
        <div className="grid-2">
          <Field label="Email (for bill)" error={errors.email}>
            <input className={`input${errors.email?" error":""}`} value={customer_email}
              onChange={e=>{ setCustomerEmail(e.target.value); setErrors(p=>({...p,email:null})); }}
              placeholder="optional@email.com" type="email" />
          </Field>
          <Field label="Discount (%)">
            <input className="input" type="number" min="0" max="100" value={discount} onChange={e=>setDiscount(Math.min(100,Math.max(0,parseFloat(e.target.value)||0)))} placeholder="0" />
          </Field>
        </div>
        <Field label="Notes (optional)">
          <input className="input" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any special notes…" />
        </Field>
      </div>

      {/* Items */}
      <div className="card mb-2">
        <div className="card-title">🧵 Cloth Items</div>
        {items.map((item,idx)=>{
          const amount=(parseFloat(item.meters)||0)*(parseFloat(item.price_per_meter)||0);
          const boltOptions = bolts.filter(b=>!item.cloth_type||b.cloth_type===item.cloth_type);
          return (
            <div key={item.id} className="item-row">
              <div className="flex-between mb-1">
                <span style={{fontSize:".72rem",fontWeight:700,color:"var(--saffron)",textTransform:"uppercase",letterSpacing:".08em"}}>Item #{idx+1}</span>
                {items.length>1&&<button className="btn btn-danger btn-sm" onClick={()=>setItems(p=>p.filter(i=>i.id!==item.id))}>✕ Remove</button>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1.2fr 1fr",gap:".8rem",alignItems:"end"}}>
                <div>
                  <label className="label">Cloth Type</label>
                  <input list={`clist-${item.id}`} className={`input${errors[`cloth_${idx}`]?" error":""}`}
                    value={item.cloth_type} onChange={e=>{setClothType(item.id,e.target.value);setErrors(p=>({...p,[`cloth_${idx}`]:null}));}} placeholder="Select cloth…" />
                  <datalist id={`clist-${item.id}`}>{catalog.map(c=><option key={c.id} value={c.name}/>)}</datalist>
                  {errors[`cloth_${idx}`]&&<div className="field-error">⚠️ {errors[`cloth_${idx}`]}</div>}
                </div>
                <div>
                  <label className="label">Meters</label>
                  <input className={`input${errors[`meters_${idx}`]?" error":""}`} type="number" min="0" step=".25"
                    value={item.meters} onChange={e=>{updateItem(item.id,"meters",e.target.value);setErrors(p=>({...p,[`meters_${idx}`]:null}));}} placeholder="0.0" />
                  {errors[`meters_${idx}`]&&<div className="field-error">⚠️ {errors[`meters_${idx}`]}</div>}
                </div>
                <div>
                  <label className="label">₹ Price / Meter</label>
                  <input className={`input${errors[`price_${idx}`]?" error":""}`} type="number" min="0"
                    value={item.price_per_meter} onChange={e=>{updateItem(item.id,"price_per_meter",e.target.value);setErrors(p=>({...p,[`price_${idx}`]:null}));}} placeholder="0.00" />
                  {errors[`price_${idx}`]&&<div className="field-error">⚠️ {errors[`price_${idx}`]}</div>}
                </div>
                <div>
                  <label className="label">Amount</label>
                  <div style={{padding:".65rem 1rem",background:amount>0?"#FFF7ED":"var(--cream-deep)",borderRadius:"var(--r-sm)",border:"1.5px solid var(--border)",fontFamily:"var(--font-display)",fontWeight:700,color:amount>0?"var(--saffron)":"var(--ink-dim)",fontSize:".95rem"}}>
                    {fmt(amount)}
                  </div>
                </div>
              </div>
              {boltOptions.length>0&&(
                <div style={{marginTop:".6rem"}}>
                  <label className="label">Link to Bolt (optional)</label>
                  <select className="input" value={item.bolt_id} onChange={e=>updateItem(item.id,"bolt_id",e.target.value)} style={{fontSize:".82rem"}}>
                    <option value="">No bolt linked</option>
                    {boltOptions.map(b=><option key={b.id} value={b.id}>{b.id} · {b.cloth_type} · {b.remaining_meters}m remaining{b.color?` · ${b.color}`:""}</option>)}
                  </select>
                </div>
              )}
            </div>
          );
        })}
        <button className="btn btn-ghost w-full" style={{borderStyle:"dashed",marginTop:".5rem"}} onClick={()=>setItems(p=>[...p,EMPTY_ITEM()])}>
          + Add Another Item
        </button>
      </div>

      {/* Summary + Actions */}
      <div className="total-box">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2rem",alignItems:"end"}}>
          <div>
            <div className="card-title" style={{marginBottom:"1rem"}}>🧮 Bill Summary</div>
            <div className="flex-between mb-1" style={{color:"var(--ink-muted)",fontSize:".9rem"}}><span>Subtotal</span><span style={{fontWeight:600}}>{fmt(subtotal)}</span></div>
            {parseFloat(discount)>0&&<div className="flex-between mb-1" style={{color:"var(--rose-dk)",fontSize:".9rem"}}><span>Discount ({discount}%)</span><span style={{fontWeight:600}}>− {fmt(discountAmt)}</span></div>}
            <div className="flex-between mb-1" style={{color:"var(--ink-muted)",fontSize:".9rem"}}><span>GST (5%)</span><span style={{fontWeight:600}}>{fmt(tax)}</span></div>
            <div className="divider"/>
            <div className="flex-between"><span style={{fontFamily:"var(--font-display)",fontSize:"1rem",fontWeight:700}}>AMOUNT TO PAY</span><span style={{fontFamily:"var(--font-display)",fontSize:"2rem",color:"var(--saffron)",fontWeight:700}}>{fmt(total)}</span></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:".75rem"}}>
            <button className="btn btn-primary btn-lg w-full" onClick={()=>handleSave(true)} disabled={saving} style={{fontSize:"1rem"}}>
              {saving?"⏳ Saving…":"💰 Proceed to Payment"}
            </button>
            <button className="btn btn-ghost btn-lg w-full" onClick={()=>handleSave(false)} disabled={saving}>
              {saving?"⏳ Saving…":"💾 Save Bill Only"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
