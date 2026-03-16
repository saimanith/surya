import { NavLink } from "react-router-dom";

const NAV = [
  { label: "Billing", items: [
    { to: "/",            icon: "🏠", label: "Dashboard"    },
    { to: "/billing/new", icon: "🧾", label: "New Bill"     },
    { to: "/bills",       icon: "📋", label: "All Bills"    },
  ]},
  { label: "Reports", items: [
    { to: "/settlement",  icon: "📊", label: "Settlement"   },
    { to: "/customers",   icon: "👥", label: "Customers"    },
    { to: "/catalog",     icon: "🧵", label: "Cloth Catalog"},
  ]},
];

export default function Sidebar() {
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">🌅</span>
        <h1>SURYA</h1>
        <div className="logo-tagline">Cloth Store · Billing</div>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(section => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map(({ to, icon, label }) => (
              <NavLink key={to} to={to} end={to === "/"}
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
                <span className="icon">{icon}</span>
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">{today} · Surya v1.0</div>
    </aside>
  );
}
