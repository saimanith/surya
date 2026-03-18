import { useLocation, useNavigate } from "react-router-dom";

const TITLES = {
  "/":"Dashboard","/billing/new":"New Bill","/bills":"All Bills",
  "/settlement":"Settlement","/expenditures":"Expenditures",
  "/customers":"Customers","/catalog":"Cloth Catalog",
  "/deleted-bills":"Deleted Bills Archive","/inventory":"Inventory",
  "/purchase-orders":"Purchase Orders","/cash":"Cash Register",
};

export default function Topbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = TITLES[location.pathname] || (location.pathname.startsWith("/bills/") ? "Bill Detail" : "Surya");
  const today = new Date().toLocaleDateString("en-IN", { weekday:"short", day:"2-digit", month:"short", year:"numeric" });

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{title}</div>
        <span className="topbar-breadcrumb">· {today}</span>
      </div>
      <div className="topbar-right">
        <div className="topbar-user">
          <span>👤</span> {user?.username}
          <span style={{ fontSize:".6rem", background:"var(--saffron)", color:"#fff", borderRadius:"99px", padding:".1rem .5rem", marginLeft:".2rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>{user?.role}</span>
        </div>
        <button className="topbar-logout" onClick={onLogout}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
