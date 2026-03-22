import { NavLink } from "react-router-dom";

const NAV = [
  { label:"Billing", items:[
    { to:"/",              icon:"🏠", label:"Dashboard"      },
    { to:"/billing/new",   icon:"🧾", label:"New Bill"       },
    { to:"/bills",         icon:"📋", label:"All Bills"      },
  ]},
  { label:"Finance", items:[
    { to:"/settlement",    icon:"📊", label:"Settlement"     },
    { to:"/cash",          icon:"💵", label:"Cash Register"  },
    { to:"/expenditures",  icon:"💸", label:"Expenditures"   },
  ]},
  { label:"Stock", items:[
    { to:"/inventory",     icon:"📦", label:"Inventory"      },
    { to:"/purchase-orders",icon:"🛒",label:"Purchase Orders"},
    { to:"/catalog",       icon:"🧵", label:"Cloth Catalog"  },
  ]},
  { label:"People", items:[
    { to:"/customers",     icon:"👥", label:"Customers"      },
    { to:"/deleted-bills", icon:"🗄️", label:"Deleted Bills"  },
  ]},
];

// Animated falling threads
function Threads() {
  const threads = [
    { left:"12%", dur:"9s",  del:"0s",   h:55, op:.4 },
    { left:"26%", dur:"12s", del:"1.8s", h:70, op:.3 },
    { left:"40%", dur:"8s",  del:"0.6s", h:45, op:.35},
    { left:"55%", dur:"14s", del:"3s",   h:80, op:.25},
    { left:"68%", dur:"10s", del:"1.2s", h:60, op:.38},
    { left:"82%", dur:"11s", del:"2.4s", h:50, op:.3 },
  ];
  return (
    <>
      {threads.map((t,i)=>(
        <div key={i} className="sidebar-thread" style={{
          left:t.left, height:`${t.h}px`,
          animationDuration:t.dur, animationDelay:t.del, opacity:t.op,
        }}/>
      ))}
    </>
  );
}

export default function Sidebar({ user, onLogout }) {
  const today = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  return (
    <aside className="sidebar">
      <Threads/>

      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-orb">🌅</div>
          <div className="logo-text">SURYA</div>
        </div>
        <div className="logo-sub">Cloth Store · Billing</div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(section=>(
          <div key={section.label}>
            <div className="nav-section">{section.label}</div>
            {section.items.map(({to,icon,label})=>(
              <NavLink key={to} to={to} end={to==="/"} className={({isActive})=>`nav-link${isActive?" active":""}`}>
                <span className="nav-icon">{icon}</span>{label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-userbox">
          <div style={{fontSize:".58rem",color:"rgba(255,255,255,.2)",letterSpacing:".12em",textTransform:"uppercase",marginBottom:".2rem"}}>Logged in as</div>
          <div className="sidebar-username">👤 {user?.username}</div>
          <div className="sidebar-role">{user?.role}</div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout}>🚪 Sign Out</button>
      </div>
      <div className="sidebar-footer">{today} · Surya v2.0</div>
    </aside>
  );
}
