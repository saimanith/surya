import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import NewBill from "./pages/NewBill";
import Bills from "./pages/Bills";
import BillDetail from "./pages/BillDetail";
import Settlement from "./pages/Settlement";
import Customers from "./pages/Customers";
import Catalog from "./pages/Catalog";

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/billing/new" element={<NewBill />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/bills/:id" element={<BillDetail />} />
          <Route path="/settlement" element={<Settlement />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/catalog" element={<Catalog />} />
        </Routes>
      </main>
    </div>
  );
}
