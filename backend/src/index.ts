import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import path from "path";
import authRouter from "./routes/auth";
import listingsRouter from "./routes/listings";

const app = express();
const PORT = process.env["PORT"] ?? 3000;
const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

// ─── Middleware ────────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// ─── Static uploads ────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ─── Routes ───────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/listings", listingsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start ────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Becho API running on http://localhost:${PORT}`);
});

export default app;
