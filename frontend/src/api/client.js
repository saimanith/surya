const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function req(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error("Cannot reach server. Make sure the backend is running on port 5000.");
  }

  const text = await res.text();

  if (!text) {
    throw new Error(`Server returned empty response (HTTP ${res.status})`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server error (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }

  if (!data.success) throw new Error(data.error || "Request failed");
  return data.data;
}

export const api = {
  // Bills
  getTodayBills: () => req("GET", "/bills/today"),
  getAllBills: (date) => req("GET", `/bills${date ? `?date=${date}` : ""}`),
  getBill: (id) => req("GET", `/bills/${id}`),
  getSummary: (date) => req("GET", `/bills/summary${date ? `?date=${date}` : ""}`),
  createBill: (data) => req("POST", "/bills", data),
  updateStatus: (id, status) => req("PATCH", `/bills/${id}/status`, { status }),
  settleAll: () => req("PATCH", "/bills/settle/all"),
  deleteBill: (id) => req("DELETE", `/bills/${id}`),

  // Catalog
  getCatalog: () => req("GET", "/catalog"),
  addCloth: (data) => req("POST", "/catalog", data),

  // Customers
  getCustomers: () => req("GET", "/customers"),
  searchCustomers: (q) => req("GET", `/customers/search?q=${encodeURIComponent(q)}`),
};
