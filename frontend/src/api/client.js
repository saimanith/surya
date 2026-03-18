const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
function getToken() { return localStorage.getItem("surya_token"); }

async function req(method, path, body) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch { throw new Error("Cannot reach server. Make sure the backend is running."); }
  const text = await res.text();
  if (!text) throw new Error(`Empty response (HTTP ${res.status})`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`Server error (${res.status}): ${text.slice(0,200)}`); }
  if (res.status === 401) { localStorage.removeItem("surya_token"); window.location.href = "/login"; return; }
  if (!data.success) throw new Error(data.error || "Request failed");
  return data.data;
}

export const api = {
  login: (u,p) => req("POST","/auth/login",{username:u,password:p}),
  logout: () => req("POST","/auth/logout"),
  me: () => req("GET","/auth/me"),
  changePassword: (c,n) => req("POST","/auth/change-password",{current_password:c,new_password:n}),

  getTodayBills: () => req("GET","/bills/today"),
  getAllBills: (date) => req("GET",`/bills${date?`?date=${date}`:""}`),
  getBill: (id) => req("GET",`/bills/${id}`),
  getSummary: (date) => req("GET",`/bills/summary${date?`?date=${date}`:""}`),
  createBill: (data) => req("POST","/bills",data),
  processPayment: (id,method) => req("PATCH",`/bills/${id}/payment`,{payment_method:method}),
  updateStatus: (id,status) => req("PATCH",`/bills/${id}/status`,{status}),
  settleAll: () => req("PATCH","/bills/settle/all"),
  deleteBill: (id,admin_password) => req("DELETE",`/bills/${id}`,{admin_password}),
  getDeletedBills: () => req("GET","/bills/deleted"),

  getCatalog: () => req("GET","/catalog"),
  addCloth: (data) => req("POST","/catalog",data),

  getCustomers: () => req("GET","/customers"),
  searchCustomers: (q) => req("GET",`/customers/search?q=${encodeURIComponent(q)}`),

  getExpenditures: (date,type) => req("GET",`/expenditures${date?`?date=${date}${type?`&type=${type}`:""}`:""}`),
  getExpSummary: (date) => req("GET",`/expenditures/summary${date?`?date=${date}`:""}`),
  addExpenditure: (data) => req("POST","/expenditures",data),
  updateExpStatus: (id,status) => req("PATCH",`/expenditures/${id}/status`,{status}),
  deleteExpenditure: (id) => req("DELETE",`/expenditures/${id}`),

  getSettlement: (date) => req("GET",`/settlement/${date}`),
  getSettlements: () => req("GET","/settlement"),
  closeDay: (data) => req("POST","/settlement/close",data),

  getBolts: (params) => req("GET",`/bolts${params?`?${new URLSearchParams(params)}`:""}`),
  getBoltSummary: () => req("GET","/bolts/summary"),
  getBolt: (id) => req("GET",`/bolts/${id}`),
  addBolt: (data) => req("POST","/bolts",data),
  updateBolt: (id,data) => req("PATCH",`/bolts/${id}`,data),

  getCash: (date) => req("GET",`/cash${date?`?date=${date}`:""}`),
  addCashEntry: (data) => req("POST","/cash",data),

  getPurchaseOrders: (status) => req("GET",`/purchase-orders${status?`?status=${status}`:""}`),
  addPurchaseOrder: (data) => req("POST","/purchase-orders",data),
  updatePOStatus: (id,status) => req("PATCH",`/purchase-orders/${id}/status`,{status}),
  deletePO: (id) => req("DELETE",`/purchase-orders/${id}`),

  // Email
  sendBillEmail: (id, email) => req("POST", `/email/bill/${id}`, { email }),
};

// Already exported above — patch email call onto existing api object
