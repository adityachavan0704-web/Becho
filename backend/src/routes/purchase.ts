// src/routes/purchase.ts — Purchase request system for offline listings

import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import type { Server as SocketServer } from "socket.io";

const router = Router();

let io: SocketServer | null = null;
export function setPurchaseSocketIO(instance: SocketServer) {
  io = instance;
}

// ─── POST /api/purchase ────────────────────────────────────────
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = req.authUser!.userId;
    const { listingId, note } = req.body as { listingId?: string; note?: string };

    if (!listingId) { res.status(400).json({ error: "listingId is required" }); return; }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { seller: { select: { id: true, name: true } } },
    });

    if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
    if (listing.type !== "OFFLINE") { res.status(400).json({ error: "Only offline listings support purchase requests" }); return; }
    if (listing.status !== "ACTIVE") { res.status(400).json({ error: "This listing is no longer available" }); return; }
    if (listing.sellerId === buyerId) { res.status(400).json({ error: "Cannot buy your own listing" }); return; }

    const existing = await prisma.purchaseRequest.findFirst({ where: { listingId, buyerId, status: "PENDING" } });
    if (existing) { res.status(409).json({ error: "You already have a pending request for this listing" }); return; }

    let purchaseRequest;
    let notification;

    purchaseRequest = await prisma.purchaseRequest.create({
      data: { listingId, buyerId, sellerId: listing.sellerId, note: note?.trim() || null },
      include: {
        listing: { select: { id: true, title: true, images: true, price: true, isFree: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    notification = await prisma.inboxNotification.create({
      data: { userId: listing.sellerId, type: "PURCHASE_REQUEST", purchaseRequestId: purchaseRequest.id },
      include: {
        purchaseRequest: {
          include: {
            listing: { select: { id: true, title: true, images: true, price: true, isFree: true } },
            buyer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (io) io.to("user:" + listing.sellerId).emit("new_notification", notification);

    res.status(201).json({ purchaseRequest });
  } catch (err) {
    console.error("[purchase/POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/purchase/inbox ───────────────────────────────────
router.get("/inbox", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser!.userId;

    const notifications = await prisma.inboxNotification.findMany({
      where: { userId },
      include: {
        purchaseRequest: {
          include: {
            listing: { select: { id: true, title: true, images: true, price: true, isFree: true, condition: true } },
            buyer: { select: { id: true, name: true, email: true } },
            seller: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unread = notifications.filter((n) => !n.isRead).length;
    res.json({ notifications, unread });
  } catch (err) {
    console.error("[purchase/inbox]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/purchase/sent ────────────────────────────────────
router.get("/sent", requireAuth, async (req: Request, res: Response) => {
  try {
    const buyerId = req.authUser!.userId;

    const requests = await prisma.purchaseRequest.findMany({
      where: { buyerId },
      include: {
        listing: { select: { id: true, title: true, images: true, price: true, isFree: true } },
        seller: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ requests });
  } catch (err) {
    console.error("[purchase/sent]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/purchase/:id ───────────────────────────────────
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const sellerId = req.authUser!.userId;
    const { status } = req.body as { status?: string };
    const { id } = req.params;

    if (!status || !["ACCEPTED", "DECLINED", "COMPLETED"].includes(status)) {
      res.status(400).json({ error: "status must be ACCEPTED, DECLINED, or COMPLETED" });
      return;
    }

    const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) { res.status(404).json({ error: "Purchase request not found" }); return; }
    if (pr.sellerId !== sellerId) { res.status(403).json({ error: "Forbidden" }); return; }

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: { status: status as "ACCEPTED" | "DECLINED" | "COMPLETED" },
      include: {
        listing: { select: { id: true, title: true, images: true, price: true, isFree: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    if (status === "ACCEPTED") {
      await prisma.listing.update({ where: { id: pr.listingId }, data: { status: "SOLD" } });
    }

    const notifType = status === "ACCEPTED" ? "PURCHASE_ACCEPTED" : "PURCHASE_DECLINED";
    if (status !== "COMPLETED") {
      const notif = await prisma.inboxNotification.create({
        data: { userId: pr.buyerId, type: notifType as "PURCHASE_ACCEPTED" | "PURCHASE_DECLINED", purchaseRequestId: pr.id },
        include: {
          purchaseRequest: {
            include: {
              listing: { select: { id: true, title: true, images: true, price: true, isFree: true } },
              seller: { select: { id: true, name: true } },
            },
          },
        },
      });
      if (io) io.to("user:" + pr.buyerId).emit("new_notification", notif);
    }

    res.json({ purchaseRequest: updated });
  } catch (err) {
    console.error("[purchase/PATCH]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/purchase/read/all ─────────────────────────────
router.patch("/read/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser!.userId;
    await prisma.inboxNotification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    console.error("[purchase/read/all]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/purchase/read/:notifId ────────────────────────
router.patch("/read/:notifId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser!.userId;
    const notif = await prisma.inboxNotification.findUnique({ where: { id: req.params["notifId"] } });
    if (!notif || notif.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
    await prisma.inboxNotification.update({ where: { id: req.params["notifId"] }, data: { isRead: true } });
    res.json({ success: true });
  } catch (err) {
    console.error("[purchase/read/:id]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

