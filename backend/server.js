import express from "express";
import cors from "cors";
import billsRouter from "./routes/bills.js";
import { catalogRouter, customersRouter } from "./routes/catalog.js";
import { initDB } from "./db/database.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/bills", billsRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/customers", customersRouter);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Surya API is running 🧵", time: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Init DB first, then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🧵 Surya Backend → http://localhost:${PORT}`);
    console.log(`📦 Storage: SQLite (persists across restarts)\n`);
  });
}).catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
