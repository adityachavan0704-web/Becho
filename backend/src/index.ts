// src/index.ts — Express + Socket.io server entry point

import "dotenv/config";
import express from "express";
import cors from "cors";
import passport from "passport";
import path from "path";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";

import authRouter from "./routes/auth";
import listingsRouter from "./routes/listings";
import mentorshipRouter from "./routes/mentorship";
import chatRouter, { setSocketIO } from "./routes/chat";
import purchaseRouter, { setPurchaseSocketIO } from "./routes/purchase";

// ─── App setup ─────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const PORT = process.env["PORT"] ?? 3000;
const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

// ─── Socket.io ─────────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Inject Socket.io into chat route so it can emit events
setSocketIO(io);
// Inject Socket.io into purchase route for real-time inbox notifications
setPurchaseSocketIO(io);

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Client joins a listing-specific chat room
  socket.on("join_room", (listingId: string) => {
    void socket.join(`listing:${listingId}`);
    console.log(`   └─ ${socket.id} joined listing:${listingId}`);
  });

  // Client joins their personal user room for inbox notifications
  socket.on("join_user", (userId: string) => {
    void socket.join(`user:${userId}`);
    console.log(`   └─ ${socket.id} joined user:${userId}`);
  });

  socket.on("leave_room", (listingId: string) => {
    void socket.leave(`listing:${listingId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── Express Middleware ────────────────────────────────────────
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// ─── Static uploads ────────────────────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ─── Routes ───────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/mentorship", mentorshipRouter);
app.use("/api/chat", chatRouter);
app.use("/api/purchase", purchaseRouter);

// ─── Health check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Global error handler ──────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`🚀 Becho API      → http://localhost:${PORT}`);
  console.log(`🔌 Socket.io      → ws://localhost:${PORT}`);
  console.log(`🌐 Frontend URL   → ${FRONTEND_URL}`);
});

export default app;
