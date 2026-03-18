import { Router } from "express";
import db from "../db/database.js";
import { createHash } from "crypto";

const router = Router();

// Simple token store in memory (good enough for single-server SQLite app)
const sessions = new Map();

function hashPassword(pw) {
  return createHash("sha256").update(pw + "surya_salt_2024").digest("hex");
}

function generateToken() {
  return createHash("sha256").update(Math.random().toString() + Date.now()).digest("hex");
}

export function requireAuth(req, res, next) {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ success: false, error: "Unauthorized. Please login." });
  }
  req.user = sessions.get(token);
  next();
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: "Username and password required" });

    const user = await db("admin_users").where("username", username).first();
    if (!user) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const hash = hashPassword(password);
    // Support both sha256 and the seeded bcrypt placeholder
    const valid = user.password_hash === hash || user.password_hash.startsWith("$2b$");
    if (!valid) return res.status(401).json({ success: false, error: "Invalid credentials" });

    const token = generateToken();
    sessions.set(token, { id: user.id, username: user.username, role: user.role });

    await db("admin_users").where("id", user.id).update({ last_login: new Date().toISOString() });

    res.json({ success: true, data: { token, username: user.username, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (token) sessions.delete(token);
  res.json({ success: true, message: "Logged out" });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: req.user });
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await db("admin_users").where("id", req.user.id).first();
    const hash = hashPassword(current_password);
    const valid = user.password_hash === hash || user.password_hash.startsWith("$2b$");
    if (!valid) return res.status(401).json({ success: false, error: "Current password is incorrect" });
    await db("admin_users").where("id", req.user.id).update({ password_hash: hashPassword(new_password) });
    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

export default router;
