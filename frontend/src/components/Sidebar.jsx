import { NavLink } from "react-router-dom";

const NAV = [
  { label: "Billing", items: [
    { to:"/",              icon:"🏠", label:"Dashboard"       },
    { to:"/billing/new",   icon:"🧾", label:"New Bill"        },
    { to:"/bills",         icon:"📋", label:"All Bills"       },
  ]},
  { label: "Finance", items: [
    { to:"/settlement",    icon:"📊", label:"Settlement"      },
    { to:"/cash",          icon:"💵", label:"Cash Register"   },
    { to:"/expenditures",  icon:"💸", label:"Expenditures"   },
  ]},
  { label: "Stock", items: [
    { to:"/inventory",     icon:"📦", label:"Inventory"       },
    { to:"/purchase-orders",icon:"🛒",label:"Purchase Orders" },
    { to:"/stock-setup",    icon:"⚡",label:"Stock Setup"     },
    { to:"/catalog",       icon:"🧵", label:"Cloth Catalog"   },
  ]},
  { label: "People", items: [
    { to:"/customers",     icon:"👥", label:"Customers"       },
    { to:"/deleted-bills", icon:"🗄️",  label:"Deleted Bills"  },
  ]},
];

function Threads() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
      {[14,28,42,56,70,84].map((left, i) => (
        <div key={i} className="thread" style={{
          left:`${left}%`,
          height:`${50+i*10}px`,
          animationDuration:`${8+i*1.5}s`,
          animationDelay:`${i*1.2}s`,
          opacity:.12+i*.03,
        }} />
      ))}
    </div>
  );
}

export default function Sidebar({ user, onLogout }) {
  const today = new Date().toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
  return (
    <aside className="sidebar">
      <Threads />
      <div className="sidebar-logo">
        <div className="logo-row">
          <div className="logo-orb">🌅</div>
          <div>
            <div className="logo-name">SURYA</div>
          </div>
        </div>
        <div className="logo-sub">Cloth Store · Billing System</div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.label}>
            <div className="nav-section">{section.label}</div>
            {section.items.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} end={to==="/"} className={({ isActive }) => `nav-link${isActive?" active":""}`}>
                <span className="nav-icon">{icon}</span>{label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-userbox">
          <div style={{ fontSize:".58rem", color:"#ffffff25", letterSpacing:".12em", textTransform:"uppercase", marginBottom:".2rem" }}>Logged in as</div>
          <div className="sidebar-username">👤 {user?.username}</div>
          <div className="sidebar-role">{user?.role}</div>
        </div>
        <button className="sidebar-logout-btn" onClick={onLogout}>🚪 Sign Out</button>
      </div>
      <div className="sidebar-footer">{today} · Surya v2.0</div>
    </aside>
  );
}
