// src/routes/mentorship.ts — Mentorship board CRUD

import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// ─── GET /api/mentorship ───────────────────────────────────────
// Query: q, tag, page, limit
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      q = "",
      tag,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { isActive: true };

    if (q.trim()) {
      where["OR"] = [
        { subject: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    // Postgres array contains filter
    if (tag) where["tags"] = { has: tag };

    const [posts, total] = await Promise.all([
      prisma.mentorship.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          mentor: { select: { id: true, name: true, reputation: true } },
        },
      }),
      prisma.mentorship.count({ where }),
    ]);

    res.json({
      posts,
      meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error("[mentorship/GET]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/mentorship/my ────────────────────────────────────
router.get("/my", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    const posts = await prisma.mentorship.findMany({
      where: { mentorId: userId },
      orderBy: { createdAt: "desc" },
      include: { mentor: { select: { id: true, name: true, reputation: true } } },
    });
    res.json({ posts });
  } catch (err) {
    console.error("[mentorship/my]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/mentorship/:id ───────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const post = await prisma.mentorship.findUnique({
      where: { id: req.params["id"] },
      include: {
        mentor: { select: { id: true, name: true, reputation: true, email: true } },
      },
    });
    if (!post) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ post });
  } catch (err) {
    console.error("[mentorship/:id]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/mentorship ──────────────────────────────────────
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    const { subject, description, hourlyRate, tags } = req.body as {
      subject?: string;
      description?: string;
      hourlyRate?: number | string;
      tags?: string[];
    };

    if (!subject || !description) {
      res.status(400).json({ error: "subject and description are required" });
      return;
    }

    const post = await prisma.mentorship.create({
      data: {
        subject,
        description,
        hourlyRate: typeof hourlyRate === "string" ? parseFloat(hourlyRate) || 0 : (hourlyRate ?? 0),
        tags: Array.isArray(tags) ? tags : [],
        mentorId: userId!,
      },
      include: { mentor: { select: { id: true, name: true, reputation: true } } },
    });

    res.status(201).json({ post });
  } catch (err) {
    console.error("[mentorship/POST]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PATCH /api/mentorship/:id ─────────────────────────────────
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    const existing = await prisma.mentorship.findUnique({ where: { id: req.params["id"] } });
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.mentorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    const { subject, description, hourlyRate, tags, isActive } = req.body as {
      subject?: string;
      description?: string;
      hourlyRate?: number | string;
      tags?: string[];
      isActive?: boolean;
    };

    const post = await prisma.mentorship.update({
      where: { id: req.params["id"] },
      data: {
        ...(subject && { subject }),
        ...(description && { description }),
        ...(hourlyRate !== undefined && {
          hourlyRate: typeof hourlyRate === "string" ? parseFloat(hourlyRate) : hourlyRate,
        }),
        ...(tags !== undefined && { tags }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    res.json({ post });
  } catch (err) {
    console.error("[mentorship/PATCH]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/mentorship/:id ────────────────────────────────
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    const existing = await prisma.mentorship.findUnique({ where: { id: req.params["id"] } });
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.mentorId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    await prisma.mentorship.delete({ where: { id: req.params["id"] } });
    res.json({ success: true });
  } catch (err) {
    console.error("[mentorship/DELETE]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
