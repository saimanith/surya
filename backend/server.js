import express from "express";
import cors from "cors";
import billsRouter from "./routes/bills.js";
import { catalogRouter, customersRouter } from "./routes/catalog.js";
import authRouter from "./routes/auth.js";
import expendituresRouter from "./routes/expenditures.js";
import settlementRouter from "./routes/settlement.js";
import boltsRouter from "./routes/bolts.js";
import cashRouter from "./routes/cash.js";
import poRouter from "./routes/purchase_orders.js";
import emailRouter from "./routes/email.js";
import { initDB } from "./db/database.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => { console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`); next(); });

app.use("/api/auth",         authRouter);
app.use("/api/bills",        billsRouter);
app.use("/api/catalog",      catalogRouter);
app.use("/api/customers",    customersRouter);
app.use("/api/expenditures", expendituresRouter);
app.use("/api/settlement",   settlementRouter);
app.use("/api/bolts",        boltsRouter);
app.use("/api/cash",         cashRouter);
app.use("/api/purchase-orders", poRouter);
app.use("/api/email",        emailRouter);

app.get("/api/health", (req, res) => res.json({ success: true, message: "Surya API 🌅", time: new Date().toISOString() }));
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ success: false, error: "Internal server error" }); });

initDB().then(() => {
  app.listen(PORT, () => { console.log(`\n🌅 Surya Backend → http://localhost:${PORT}\n`); });
}).catch(err => { console.error("DB init failed:", err); process.exit(1); });
