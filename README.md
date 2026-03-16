# 🧵 Surya — Cloth Store Billing System

A full-stack billing application for cloth stores. Built with **React (Vite)** on the frontend and **Node.js + Express + SQLite** on the backend.

---

## 🏗️ Project Structure

```
surya/
├── backend/                  ← Node.js + Express API
│   ├── db/
│   │   └── database.js       ← SQLite setup & schema
│   ├── routes/
│   │   ├── bills.js          ← Bill CRUD + settlement APIs
│   │   └── catalog.js        ← Cloth catalog + customers APIs
│   ├── server.js             ← Express app entry point
│   └── package.json
│
├── frontend/                 ← React + Vite app
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js     ← All API calls (single source of truth)
│   │   ├── components/
│   │   │   └── Sidebar.jsx   ← Navigation sidebar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     ← Home + daily stats
│   │   │   ├── NewBill.jsx       ← Create bill with multiple items
│   │   │   ├── Bills.jsx         ← All bills with filters
│   │   │   ├── BillDetail.jsx    ← Single bill view + print
│   │   │   ├── Settlement.jsx    ← Daily settlement
│   │   │   ├── Customers.jsx     ← Customer directory
│   │   │   └── Catalog.jsx       ← Cloth type management
│   │   ├── App.jsx           ← Routes
│   │   ├── main.jsx          ← Entry point
│   │   └── index.css         ← Global styles
│   ├── index.html
│   ├── vite.config.js        ← Proxies /api → backend:5000
│   └── package.json
│
└── package.json              ← Root scripts to run both together
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ 
- npm v9+

### 1. Install Dependencies

```bash
# From the surya/ root folder:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start the Backend

```bash
cd backend
npm run dev        # uses nodemon for auto-reload
# Runs on http://localhost:5000
```

### 3. Start the Frontend (new terminal)

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 📦 Where is data stored?

Bills, customers, and catalog are stored in a **SQLite database file**:  
`backend/db/surya.db`

This file is created automatically on first run. **Data persists across restarts** — refreshing the browser will always show your saved bills because the frontend fetches from the backend API, which reads from the database.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bills/today` | Today's bills |
| GET | `/api/bills?date=YYYY-MM-DD` | Bills by date |
| GET | `/api/bills/summary?date=...` | Daily summary stats |
| GET | `/api/bills/:id` | Single bill |
| POST | `/api/bills` | Create new bill |
| PATCH | `/api/bills/:id/status` | Update status |
| PATCH | `/api/bills/settle/all` | Settle all today |
| DELETE | `/api/bills/:id` | Delete bill |
| GET | `/api/catalog` | Cloth catalog |
| POST | `/api/catalog` | Add cloth type |
| GET | `/api/customers` | All customers |
| GET | `/api/customers/search?q=` | Search customers |

---

## ✨ Features

- 🧾 **New Bill** — Add multiple cloth items with type, meters, price/meter. Auto-calculates GST (5%), discounts, totals
- 📋 **All Bills** — Filter by date and status. Click any bill for full detail + print
- 📊 **Settlement** — Settle/reopen individual bills or settle all at once. Shows revenue breakdown
- 👥 **Customers** — Auto-created from bills. Shows total purchases and visit count
- 🧵 **Cloth Catalog** — Manage cloth types with default prices (auto-fills when billing)
- 🖨️ **Print Bill** — Clean print layout per bill

---

## 🔮 Planned Features (Next Steps)

- [ ] PDF bill export
- [ ] WhatsApp bill sharing
- [ ] Weekly / monthly reports
- [ ] Stock / inventory management
- [ ] Multiple payment methods with split payment
- [ ] User authentication
