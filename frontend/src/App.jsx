import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewBill from "./pages/NewBill";
import Bills from "./pages/Bills";
import BillDetail from "./pages/BillDetail";
import Settlement from "./pages/Settlement";
import Customers from "./pages/Customers";
import Catalog from "./pages/Catalog";
import Expenditures from "./pages/Expenditures";
import DeletedBills from "./pages/DeletedBills";
import Inventory from "./pages/Inventory";
import PurchaseOrders from "./pages/PurchaseOrders";
import CashRegister from "./pages/CashRegister";
import StockSetup from "./pages/StockSetup";
import { api } from "./api/client";

const PAGE_TITLES = {
  "/": "Dashboard", "/billing/new": "New Bill", "/bills": "All Bills",
  "/settlement": "Settlement", "/expenditures": "Expenditures",
  "/customers": "Customers", "/catalog": "Cloth Catalog",
  "/deleted-bills": "Deleted Bills", "/inventory": "Inventory",
  "/purchase-orders": "Purchase Orders", "/cash": "Cash Register",
};

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("surya_token");
    if (token) {
      api.me().then(u => setUser(u)).catch(() => localStorage.removeItem("surya_token")).finally(() => setChecking(false));
    } else setChecking(false);
  }, []);

  const handleLogout = () => { api.logout(); localStorage.removeItem("surya_token"); setUser(null); };

  if (checking) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"var(--cream)" }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return <Login onLogin={u => setUser(u)} />;

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={handleLogout} />
      <Topbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/billing/new" element={<NewBill />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/bills/:id" element={<BillDetail />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/expenditures" element={<Expenditures />} />
          <Route path="/deleted-bills" element={<DeletedBills />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/cash" element={<CashRegister />} />
          <Route path="/stock-setup" element={<StockSetup />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
