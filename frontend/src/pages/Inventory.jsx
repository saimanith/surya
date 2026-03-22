import { useEffect, useState, useRef } from "react";
import { api } from "../api/client";

function fmt(n) { return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n||0); }

const SWATCH = ["#F97316","#E11D48","#0D9488","#7C3AED","#D97706","#059669","#2563EB","#DB2777","#0891B2","#65A30D","#DC2626","#9333EA"];
const EMPTY_BOLT = () => ({ id:Date.now()+Math.random(), cloth_type:"", fabric_category:"", description:"", total_meters:"", cost_price_per_meter:"", selling_price_per_meter:"", markup_pct:90, color:"" });

// Barcode-like SVG from string
function BarcodeDisplay({ value, width=120, height=36 }) {
  const bars = [];
  let x = 4;
  const chars = value.split("").map(c=>c.charCodeAt(0));
  for (let i=0; i<chars.length; i++) {
    const w = (chars[i]%3)+1;
    const gap = (chars[i]%2)+1;
    bars.push({ x, w, h: height - (i%3)*3 });
    x += w + gap;
    if (x > width-4) break;
  }
  return (
    <svg width={width} height={height} style={{display:"block",margin:"0 auto"}}>
      {bars.map((b,i)=>(
        <rect key={i} x={b.x} y={height-b.h} width={b.w} height={b.h} fill="#1C1008" rx="0.5"/>
      ))}
    </svg>
  );
}

// Single UPC sticker component
function UPCSticker({ bolt, size="normal" }) {
  const isSmall = size==="small";
  return (
    <div style={{
      background:"#FFFFFF", border:"1.5px solid #E8D4B4",
      borderRadius:"8px", padding: isSmall?"8px":"12px",
      textAlign:"center", width: isSmall?"140px":"180px",
      fontFamily:"var(--font-body)", pageBreakInside:"avoid",
      boxShadow:"0 1px 4px rgba(0,0,0,.1)",
    }}>
      <div style={{fontSize: isSmall?".5rem":".55rem",fontWeight:700,color:"#F97316",letterSpacing:".1em",textTransform:"uppercase",marginBottom:"2px"}}>SURYA CLOTH STORE</div>
      <BarcodeDisplay value={bolt.id} width={isSmall?120:160} height={isSmall?28:36}/>
      <div style={{fontSize: isSmall?".6rem":".72rem",fontWeight:800,color:"#1C1008",letterSpacing:".04em",margin:"4px 0 2px"}}>{bolt.id}</div>
      <div style={{fontSize: isSmall?".62rem":".75rem",fontWeight:600,color:"#3B2009",marginBottom:"2px"}}>{bolt.cloth_type}{bolt.color?` · ${bolt.color}`:""}</div>
      <div style={{fontSize: isSmall?".55rem":".65rem",color:"#7A5C38"}}>{bolt.total_meters}m · ₹{bolt.selling_price_per_meter}/m</div>
    </div>
  );
}

// Print stickers page
function PrintStickers({ bolts, onClose }) {
  const printRef = useRef();

  const downloadPNG = async () => {
    // Download each sticker as individual PNG using canvas
    for (const bolt of bolts) {
      const canvas = document.createElement("canvas");
      canvas.width = 360; canvas.height = 220;
      const ctx = canvas.getContext("2d");

      // White background
      ctx.fillStyle = "#FFFFFF";
      ctx.roundRect(0, 0, 360, 220, 16);
      ctx.fill();

      // Orange border top
      ctx.fillStyle = "#F97316";
      ctx.fillRect(0, 0, 360, 8);

      // Store name
      ctx.fillStyle = "#F97316";
      ctx.font = "bold 13px Arial";
      ctx.textAlign = "center";
      ctx.fillText("SURYA CLOTH STORE", 180, 32);

      // Barcode lines (simulated)
      const chars = bolt.id.split("").map(c=>c.charCodeAt(0));
      let x = 40;
      ctx.fillStyle = "#1C1008";
      chars.forEach((code) => {
        const w = (code % 3) + 1;
        const h = 55 + (code % 15);
        ctx.fillRect(x, 48, w, h);
        x += w + (code % 2) + 1;
        if (x > 320) return;
      });

      // UPC text
      ctx.fillStyle = "#1C1008";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(bolt.id, 180, 122);

      // Cloth info
      ctx.fillStyle = "#3B2009";
      ctx.font = "bold 14px Arial";
      ctx.fillText(bolt.cloth_type + (bolt.color ? " · " + bolt.color : ""), 180, 148);

      ctx.fillStyle = "#7A5C38";
      ctx.font = "12px Arial";
      ctx.fillText(`${bolt.total_meters}m  ·  ₹${bolt.selling_price_per_meter}/m`, 180, 170);

      // Border
      ctx.strokeStyle = "#E8D4B4";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 358, 218);

      // Download
      const link = document.createElement("a");
      link.download = `${bolt.id}-sticker.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("","_blank","width=800,height=600");
    win.document.write(`
      <html><head><title>Surya — UPC Stickers</title>
      <style>
        body{margin:0;padding:16px;font-family:Arial,sans-serif;background:#fff;}
        .grid{display:flex;flex-wrap:wrap;gap:8px;padding:8px;}
        @media print{body{padding:0;} .no-print{display:none;} @page{margin:10mm;}}
      </style></head>
      <body>
        <div class="no-print" style="margin-bottom:12px;display:flex;gap:8px;">
          <button onclick="window.print()" style="padding:8px 16px;background:#F97316;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">🖨️ Print</button>
          <button onclick="window.close()" style="padding:8px 16px;background:#eee;border:none;border-radius:6px;cursor:pointer;">Close</button>
        </div>
        <div class="grid">${printRef.current.innerHTML}</div>
      </body></html>
    `);
    win.document.close();
    win.focus();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,.8)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"1rem"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--cream)",borderRadius:"20px",width:"100%",maxWidth:"700px",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"var(--sh-xl)",animation:"popIn .3s ease"}}>
        <div style={{padding:"1.2rem 1.5rem",borderBottom:"1px solid var(--border-soft)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h3 style={{fontFamily:"var(--font-display)",fontWeight:700}}>🏷️ UPC Stickers — {bolts.length} bolt{bolts.length!==1?"s":""}</h3>
            <p className="text-muted text-sm">Print and stick to each bolt</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print / PDF</button>
            <button className="btn btn-ghost" onClick={downloadPNG}>⬇️ Download PNG{bolts.length>1?`s (${bolts.length})`:" (1)"}</button>
            <button className="btn btn-ghost" onClick={onClose}>✕</button>
          </div>
        </div>
        <div style={{overflowY:"auto",padding:"1.2rem"}}>
          <div ref={printRef} style={{display:"flex",flexWrap:"wrap",gap:"10px"}}>
            {bolts.map(b=><UPCSticker key={b.id} bolt={b} size="small"/>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Batch add form
function BatchAddForm({ catalog, onSave, onClose }) {
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [bolts, setBolts] = useState([EMPTY_BOLT(), EMPTY_BOLT(), EMPTY_BOLT()]);
  const [saving, setSaving] = useState(false);
  const [markup, setMarkup] = useState(90);

  const updateBolt = (id,field,val) => {
    setBolts(p=>p.map(b=>{
      if(b.id!==id) return b;
      const updated = {...b,[field]:val};
      // Auto-calc selling price when cost or markup changes
      if((field==="cost_price_per_meter"||field==="markup_pct")) {
        const cost = parseFloat(field==="cost_price_per_meter"?val:b.cost_price_per_meter)||0;
        const mkp = parseFloat(field==="markup_pct"?val:b.markup_pct)||markup;
        if(cost>0) updated.selling_price_per_meter = Math.round(cost*(1+mkp/100));
      }
      return updated;
    }));
  };

  const handleGlobalMarkup = (val) => {
    setMarkup(val);
    setBolts(p=>p.map(b=>{
      const cost = parseFloat(b.cost_price_per_meter)||0;
      return cost>0 ? {...b,markup_pct:val,selling_price_per_meter:Math.round(cost*(1+val/100))} : {...b,markup_pct:val};
    }));
  };

  const handleSave = async () => {
    const valid = bolts.filter(b=>b.cloth_type&&parseFloat(b.total_meters)>0);
    if(!valid.length){alert("Add at least one bolt with cloth type and meters");return;}
    setSaving(true);
    try {
      const result = await api.addBoltBatch({ seller_name:sellerName, seller_phone:sellerPhone, purchase_date:purchaseDate, bolts:valid });
      onSave(result);
    } catch(err){alert(err.message);}
    finally{setSaving(false);}
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,.8)",backdropFilter:"blur(8px)",zIndex:1000,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"1.5rem",overflowY:"auto"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--cream)",borderRadius:"20px",width:"100%",maxWidth:"900px",boxShadow:"var(--sh-xl)",animation:"popIn .3s ease",marginTop:"0"}}>
        {/* Header */}
        <div style={{padding:"1.4rem 1.6rem",borderBottom:"1px solid var(--border-soft)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:"1.3rem"}}>📦 Add Stock from Seller</h2>
            <p className="text-muted text-sm">Add multiple bolts purchased from one seller. UPC codes auto-generated.</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>✕ Close</button>
        </div>

        <div style={{padding:"1.4rem 1.6rem"}}>
          {/* Seller info */}
          <div style={{background:"var(--cream-warm)",border:"1px solid var(--border)",borderRadius:"var(--r)",padding:"1.1rem 1.3rem",marginBottom:"1.2rem"}}>
            <div className="card-title" style={{marginBottom:".8rem"}}>🏪 Seller / Distributor Details</div>
            <div className="grid-3">
              <div className="form-group">
                <label className="label">Seller / Distributor Name</label>
                <input className="input" value={sellerName} onChange={e=>setSellerName(e.target.value)} placeholder="e.g. Textile Traders Pvt Ltd"/>
              </div>
              <div className="form-group">
                <label className="label">Phone</label>
                <input className="input" value={sellerPhone} onChange={e=>setSellerPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit number"/>
              </div>
              <div className="form-group">
                <label className="label">Purchase Date</label>
                <input className="input" type="date" value={purchaseDate} onChange={e=>setPurchaseDate(e.target.value)}/>
              </div>
            </div>
          </div>

          {/* Global markup */}
          <div className="flex-between mb-2">
            <div className="card-title" style={{marginBottom:0}}>🧵 Bolts Purchased</div>
            <div className="flex gap-2" style={{alignItems:"center"}}>
              <span className="label" style={{margin:0}}>Default Markup %:</span>
              <input className="input" type="number" min="0" max="500" value={markup} onChange={e=>handleGlobalMarkup(parseFloat(e.target.value)||90)} style={{width:"80px",textAlign:"center"}}/>
              <span className="text-muted text-sm">Cost × {((100+parseInt(markup||90))/100).toFixed(2)} = Sell Price</span>
            </div>
          </div>

          {/* Bolt rows table */}
          <div style={{overflowX:"auto",border:"1px solid var(--border-soft)",borderRadius:"var(--r)",marginBottom:"1rem"}}>
            <table style={{minWidth:"860px"}}>
              <thead>
                <tr>
                  <th style={{width:30}}>#</th>
                  <th style={{width:160}}>Cloth Type *</th>
                  <th style={{width:130}}>Fabric Category</th>
                  <th style={{width:110}}>Meters *</th>
                  <th style={{width:130}}>Cost ₹/m</th>
                  <th style={{width:130}}>Sell ₹/m (auto)</th>
                  <th style={{width:110}}>Color</th>
                  <th style={{width:40}}></th>
                </tr>
              </thead>
              <tbody>
                {bolts.map((bolt,idx)=>(
                  <tr key={bolt.id} style={{background:idx%2===0?"#FDFAF5":"#FFFFFF"}}>
                    <td style={{textAlign:"center",color:"var(--ink-dim)",fontWeight:700,fontSize:".78rem"}}>{idx+1}</td>
                    <td style={{padding:"4px 6px"}}>
                      <input list={`clist-${bolt.id}`} className="input" style={{fontSize:".82rem",padding:".45rem .7rem"}}
                        value={bolt.cloth_type} onChange={e=>updateBolt(bolt.id,"cloth_type",e.target.value)} placeholder="Cotton…"/>
                      <datalist id={`clist-${bolt.id}`}>{catalog.map(c=><option key={c.id} value={c.name}/>)}</datalist>
                    </td>
                    <td style={{padding:"4px 6px"}}><input className="input" style={{fontSize:".82rem",padding:".45rem .7rem"}} value={bolt.fabric_category} onChange={e=>updateBolt(bolt.id,"fabric_category",e.target.value)} placeholder="Woven, Knit…"/></td>
                    <td style={{padding:"4px 6px"}}><input className="input" type="number" min="0" style={{fontSize:".82rem",padding:".45rem .7rem"}} value={bolt.total_meters} onChange={e=>updateBolt(bolt.id,"total_meters",e.target.value)} placeholder="50"/></td>
                    <td style={{padding:"4px 6px"}}>
                      <input className="input" type="number" min="0" style={{fontSize:".82rem",padding:".45rem .7rem"}}
                        value={bolt.cost_price_per_meter} onChange={e=>updateBolt(bolt.id,"cost_price_per_meter",e.target.value)} placeholder="0.00"/>
                    </td>
                    <td style={{padding:"4px 6px"}}>
                      <input className="input" type="number" min="0" style={{fontSize:".82rem",padding:".45rem .7rem",background:"#FFF7ED",borderColor:"#FDBA74",color:"var(--saffron)",fontWeight:700}}
                        value={bolt.selling_price_per_meter} onChange={e=>updateBolt(bolt.id,"selling_price_per_meter",e.target.value)} placeholder="auto"/>
                    </td>
                    <td style={{padding:"4px 6px"}}><input className="input" style={{fontSize:".82rem",padding:".45rem .7rem"}} value={bolt.color} onChange={e=>updateBolt(bolt.id,"color",e.target.value)} placeholder="Red"/></td>
                    <td style={{padding:"4px 6px",textAlign:"center"}}>
                      {bolts.length>1&&<button className="btn btn-danger btn-sm" onClick={()=>setBolts(p=>p.filter(b=>b.id!==bolt.id))} style={{padding:".2rem .4rem"}}>✕</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex-between">
            <button className="btn btn-ghost" onClick={()=>setBolts(p=>[...p,EMPTY_BOLT()])}>+ Add Row</button>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                {saving?"⏳ Saving…":`💾 Save ${bolts.filter(b=>b.cloth_type&&b.total_meters).length} Bolt${bolts.filter(b=>b.cloth_type&&b.total_meters).length!==1?"s":""} & Generate UPCs`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [bolts,setBolts] = useState([]);
  const [summary,setSummary] = useState(null);
  const [recommendations,setRecommendations] = useState([]);
  const [loading,setLoading] = useState(true);
  const [catalog,setCatalog] = useState([]);
  const [filterStatus,setFilterStatus] = useState("active");
  const [tab,setTab] = useState("grid"); // grid | list
  const [showBatch,setShowBatch] = useState(false);
  const [showPrint,setShowPrint] = useState(false);
  const [selectedBolts,setSelectedBolts] = useState([]);
  const [viewBolt,setViewBolt] = useState(null);
  const [newlyAdded,setNewlyAdded] = useState([]);

  const load=()=>{
    setLoading(true);
    Promise.all([
      api.getBolts({status:filterStatus||undefined}),
      api.getBoltSummary(),
      api.getCatalog(),
      api.getBoltRecommendations(),
    ]).then(([b,s,c,r])=>{setBolts(b);setSummary(s);setCatalog(c);setRecommendations(r);})
    .catch(console.error).finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[filterStatus]);

  const toggleSelect=(id)=>setSelectedBolts(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const selectAll=()=>setSelectedBolts(bolts.map(b=>b.id));
  const clearSelect=()=>setSelectedBolts([]);

  const handleBatchSave=(saved)=>{
    setShowBatch(false);
    setNewlyAdded(saved);
    load();
    // Auto-open print for newly added
    setTimeout(()=>setShowPrint(true),300);
    setSelectedBolts(saved.map(b=>b.id));
  };

  const handleViewBolt=async(id)=>{
    const b=await api.getBolt(id);
    setViewBolt(b);
  };

  const printableBolts = selectedBolts.length>0 ? bolts.filter(b=>selectedBolts.includes(b.id)) : bolts;

  return (
    <div className="page">
      {showBatch&&<BatchAddForm catalog={catalog} onSave={handleBatchSave} onClose={()=>setShowBatch(false)}/>}
      {showPrint&&<PrintStickers bolts={printableBolts} onClose={()=>setShowPrint(false)}/>}

      <div className="page-header flex-between">
        <div>
          <div className="page-accent"><span/><span/><span/><span/></div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Bolts of cloth · {summary?.total_bolts||0} active · {(summary?.total_meters||0).toFixed(1)}m stock</p>
        </div>
        <div className="flex gap-2" style={{flexWrap:"wrap"}}>
          <select className="input" style={{width:"130px"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="exhausted">Exhausted</option>
            <option value="">All Bolts</option>
          </select>
          {selectedBolts.length>0&&<button className="btn btn-ghost" onClick={()=>setShowPrint(true)}>🏷️ Print {selectedBolts.length} UPCs</button>}
          <button className="btn btn-ghost" onClick={()=>setShowPrint(true)}>🏷️ All UPCs</button>
          <button className="btn btn-primary" onClick={()=>setShowBatch(true)}>+ Add Stock</button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        {[
          {label:"Active Bolts",value:summary?.total_bolts||0,cls:"orange"},
          {label:"Total Meters",value:`${(summary?.total_meters||0).toFixed(1)}m`,cls:"teal"},
          {label:"Inventory Cost",value:fmt(summary?.inventory_value),cls:"violet"},
          {label:"Low Stock",value:summary?.low_stock||0,cls:summary?.low_stock>0?"red":"green"},
        ].map(({label,value,cls})=>(
          <div className={`stat-card ${cls}`} key={label}><div className="stat-label">{label}</div><div className={`stat-value ${cls}`}>{value}</div></div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length>0&&(
        <div className="card mb-2" style={{borderColor:"#FCD34D",background:"linear-gradient(135deg,#FFFBEB,#FFFDF5)"}}>
          <div className="card-title">🔥 Reorder Recommendations</div>
          <div style={{display:"flex",flexDirection:"column",gap:".6rem"}}>
            {recommendations.slice(0,4).map(r=>(
              <div key={r.id} className="rec-card">
                <div style={{fontSize:"1.5rem"}}>📦</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:".9rem"}}>{r.cloth_type}{r.color?` · ${r.color}`:""}</div>
                  <div className="text-muted text-sm">{r.id} · {r.remaining_meters.toFixed(1)}m remaining</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:"var(--rose-dk)",fontSize:".85rem"}}>{r.reason}</div>
                  {r.sold_pct>0&&<div className="text-muted text-sm">{r.sold_pct}% sold in 30 days</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Select all + tabs */}
      <div className="flex-between mb-2">
        <div className="flex gap-2" style={{alignItems:"center"}}>
          {selectedBolts.length>0
            ?<><span className="text-muted text-sm">{selectedBolts.length} selected</span><button className="btn btn-ghost btn-sm" onClick={clearSelect}>Clear</button></>
            :<button className="btn btn-ghost btn-sm" onClick={selectAll}>Select All</button>
          }
        </div>
        <div className="tab-group">
          <button className={`tab-item ${tab==="grid"?"active":""}`} onClick={()=>setTab("grid")}>⊞ Grid</button>
          <button className={`tab-item ${tab==="list"?"active":""}`} onClick={()=>setTab("list")}>☰ List</button>
        </div>
      </div>

      {loading?<div className="loader"><div className="spinner"/></div>
      :bolts.length===0?<div className="card"><div className="empty"><div className="empty-icon">📦</div><p>No bolts found. <button className="btn btn-primary btn-sm mt-1" onClick={()=>setShowBatch(true)}>Add Stock</button></p></div></div>
      :tab==="grid"?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"1rem"}}>
          {bolts.map((b,i)=>{
            const color=SWATCH[i%SWATCH.length];
            const pct=b.total_meters>0?Math.round((b.remaining_meters/b.total_meters)*100):0;
            const isLow=b.remaining_meters<5;
            const isSel=selectedBolts.includes(b.id);
            return (
              <div key={b.id} className="stagger-item" style={{
                background:"#FFFFFF", borderRadius:"var(--r-lg)",
                border:`2px solid ${isSel?"var(--saffron)":isLow?"#FECDD3":"var(--border-soft)"}`,
                padding:"1.1rem", cursor:"pointer",
                transition:"all .22s cubic-bezier(.34,1.56,.64,1)",
                boxShadow:isSel?"0 0 0 3px #F9731630,var(--sh-sm)":isLow?"0 2px 12px #F43F5E20":"var(--sh-xs)",
                borderTop:`4px solid ${color}`,
                animationDelay:`${(i%6)*.06}s`, position:"relative",
              }}
                onMouseEnter={e=>{if(!isSel){e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow="var(--sh-lg)";}}}
                onMouseLeave={e=>{if(!isSel){e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=isLow?"0 2px 12px #F43F5E20":"var(--sh-xs)";}}}
              >
                {/* Select checkbox */}
                <div style={{position:"absolute",top:"8px",right:"8px"}} onClick={e=>{e.stopPropagation();toggleSelect(b.id);}}>
                  <div style={{width:18,height:18,borderRadius:"4px",border:`2px solid ${isSel?"var(--saffron)":"var(--border)"}`,background:isSel?"var(--saffron)":"#FFFFFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".7rem",color:"#fff",transition:"all .15s"}}>
                    {isSel&&"✓"}
                  </div>
                </div>

                <div onClick={()=>handleViewBolt(b.id)}>
                  <div style={{fontFamily:"var(--font-display)",fontSize:".65rem",fontWeight:700,color,letterSpacing:".05em",marginBottom:".3rem"}}>{b.id}</div>
                  <div style={{fontWeight:700,fontSize:".95rem",marginBottom:".15rem"}}>{b.cloth_type}</div>
                  {b.color&&<div style={{fontSize:".72rem",color:"var(--ink-muted)",marginBottom:".5rem"}}>🎨 {b.color}</div>}

                  {/* Barcode preview tiny */}
                  <div style={{margin:".4rem 0",opacity:.6}}>
                    <BarcodeDisplay value={b.id} width={160} height={24}/>
                  </div>

                  {/* Progress */}
                  <div className="progress-track" style={{marginBottom:".35rem"}}>
                    <div className="progress-fill" style={{width:`${pct}%`,background:isLow?"linear-gradient(to right,#F43F5E,#FB7185)":pct<50?`linear-gradient(to right,#F59E0B,${color})`:`linear-gradient(to right,${color},${color}99)`}}/>
                  </div>
                  <div className="flex-between">
                    <span style={{fontSize:".78rem",fontWeight:700,color:isLow?"var(--rose-dk)":"var(--ink-soft)"}}>{b.remaining_meters.toFixed(1)}m left</span>
                    <span style={{fontSize:".7rem",color:"var(--ink-dim)"}}>{pct}%</span>
                  </div>
                  <div style={{marginTop:".4rem",fontWeight:700,color:"var(--saffron)",fontSize:".8rem"}}>₹{b.selling_price_per_meter}/m</div>
                  {isLow&&<div style={{marginTop:".4rem",fontSize:".68rem",color:"var(--rose-dk)",fontWeight:700,background:"#FFF1F2",borderRadius:"5px",padding:".15rem .4rem",textAlign:"center"}}>⚠️ LOW STOCK</div>}
                </div>
              </div>
            );
          })}
        </div>
      ):(
        // List view
        <div className="card" style={{padding:0}}>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th><input type="checkbox" onChange={e=>e.target.checked?selectAll():clearSelect()} checked={selectedBolts.length===bolts.length&&bolts.length>0}/></th>
                <th>UPC / Bolt ID</th><th>Cloth Type</th><th>Color</th><th>Seller</th>
                <th className="text-right">Total</th><th className="text-right">Remaining</th>
                <th className="text-right">Cost/m</th><th className="text-right">Sell/m</th>
                <th>Status</th>
              </tr></thead>
              <tbody>
                {bolts.map(b=>(
                  <tr key={b.id} className="stagger-item" style={{cursor:"pointer"}} onClick={()=>handleViewBolt(b.id)}>
                    <td onClick={e=>{e.stopPropagation();toggleSelect(b.id);}}><input type="checkbox" checked={selectedBolts.includes(b.id)} onChange={()=>{}}/></td>
                    <td style={{fontFamily:"var(--font-display)",color:"var(--saffron)",fontWeight:700,fontSize:".78rem"}}>{b.id}</td>
                    <td style={{fontWeight:600}}>{b.cloth_type}</td>
                    <td className="text-muted text-sm">{b.color||"—"}</td>
                    <td className="text-muted text-sm">{b.seller_name||"—"}</td>
                    <td className="text-right">{b.total_meters}m</td>
                    <td className="text-right" style={{fontWeight:700,color:b.remaining_meters<5?"var(--rose-dk)":"inherit"}}>{b.remaining_meters.toFixed(1)}m</td>
                    <td className="text-right">₹{b.cost_price_per_meter}</td>
                    <td className="text-right" style={{color:"var(--saffron)",fontWeight:700}}>₹{b.selling_price_per_meter}</td>
                    <td><span className={`badge badge-${b.status}`}>{b.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bolt detail modal */}
      {viewBolt&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,18,8,.7)",backdropFilter:"blur(6px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}} onClick={e=>{if(e.target===e.currentTarget)setViewBolt(null);}}>
          <div style={{background:"var(--cream)",borderRadius:"24px",padding:"2rem",width:"100%",maxWidth:"580px",maxHeight:"85vh",overflow:"auto",boxShadow:"var(--sh-xl)",animation:"popIn .3s ease"}}>
            <div className="flex-between mb-2">
              <div>
                <div style={{fontFamily:"var(--font-display)",fontSize:".75rem",color:"var(--saffron)",fontWeight:700,marginBottom:".2rem"}}>{viewBolt.id}</div>
                <h2 style={{fontFamily:"var(--font-display)",fontSize:"1.5rem",fontWeight:800}}>{viewBolt.cloth_type}</h2>
                {viewBolt.color&&<div className="text-muted text-sm">🎨 {viewBolt.color}</div>}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={()=>{setSelectedBolts([viewBolt.id]);setShowPrint(true);setViewBolt(null);}}>🏷️ Print UPC</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setViewBolt(null)}>✕</button>
              </div>
            </div>

            {/* UPC sticker preview */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:"1.2rem"}}>
              <UPCSticker bolt={viewBolt}/>
            </div>

            <div className="grid-3 mb-2">
              {[["Total Meters",`${viewBolt.total_meters}m`],["Remaining",`${viewBolt.remaining_meters.toFixed(1)}m`],["Status",viewBolt.status],
                ["Cost/m",`₹${viewBolt.cost_price_per_meter}`],["Sell/m",`₹${viewBolt.selling_price_per_meter}`],["Markup",`${viewBolt.markup_pct||90}%`],
                ["Seller",viewBolt.seller_name||"—"],["Purchase Date",viewBolt.purchase_date||"—"],["Received",viewBolt.received_date]
              ].map(([l,v])=>(
                <div key={l} style={{background:"var(--cream-warm)",borderRadius:"var(--r-sm)",padding:".6rem .9rem"}}>
                  <div className="label">{l}</div><div style={{fontWeight:600,fontSize:".88rem"}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Usage history */}
            {viewBolt.usage?.length>0&&(
              <>
                <div className="card-title">📋 Usage History</div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Bill #</th><th>Customer</th><th className="text-right">Meters</th><th>Date</th></tr></thead>
                    <tbody>{viewBolt.usage.map(u=>(
                      <tr key={u.id}>
                        <td style={{color:"var(--saffron)",fontWeight:700,fontSize:".78rem"}}>{u.bill_number}</td>
                        <td>{u.customer_name}</td>
                        <td className="text-right" style={{fontWeight:600}}>{u.meters}m</td>
                        <td className="text-muted text-sm">{new Date(u.date).toLocaleDateString("en-IN")}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
