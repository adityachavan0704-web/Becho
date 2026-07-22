// src/routes/chat.ts — REST endpoints for listing chat
// Socket.io handles real-time delivery; REST persists messages to DB.
// The Socket.io server is set up in index.ts — it emits after a message is saved here.

import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import type { Server as SocketServer } from "socket.io";

const router = Router();

// Socket.io instance is injected at startup by index.ts
let io: SocketServer | null = null;
export function setSocketIO(instance: SocketServer) {
  io = instance;
}

// ─── GET /api/chat/:listingId ──────────────────────────────────
// Returns last 50 messages for a listing chat, ordered oldest first
router.get("/:listingId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const userId = req.authUser?.userId;

    // Verify the listing exists
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }

    // Return messages where current user is sender or receiver for this listing
    const messages = await prisma.message.findMany({
      where: {
        listingId,
        OR: [
          { senderId: userId },
          { receiverId: userId },
          // Also include if user is the seller (they see all)
          ...(listing.sellerId === userId
            ? [{ listingId }]  // seller sees all messages on their listing
            : []),
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    res.json({ messages });
  } catch (err) {
    console.error("[chat/GET]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/chat/:listingId ─────────────────────────────────
// Send a message — saves to DB, emits via Socket.io to the room
router.post("/:listingId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const senderId = req.authUser?.userId;
    const { content, receiverId } = req.body as { content?: string; receiverId?: string };

    if (!content?.trim()) {
      res.status(400).json({ error: "content is required" });
      return;
    }
    if (!receiverId) {
      res.status(400).json({ error: "receiverId is required" });
      return;
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) { res.status(404).json({ error: "Receiver not found" }); return; }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: senderId!,
        receiverId,
        listingId,
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
    });

    // Emit to the listing's chat room in real-time
    if (io) {
      io.to(`listing:${listingId}`).emit("new_message", message);
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error("[chat/POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/chat/conversations ──────────────────────────────
// Returns all unique conversations (grouped by listingId) for the current user
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;

    // Get distinct listings where user has messages
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      distinct: ["listingId"],
      include: {
        listing: { select: { id: true, title: true, images: true } },
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ conversations: messages });
  } catch (err) {
    console.error("[chat/conversations]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
