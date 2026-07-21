import { Router } from "express";
import type { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireAuth } from "../middleware/auth";

const router = Router();

const DB_URL =
  process.env["DIRECT_DATABASE_URL"] ??
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0";

const adapter = new PrismaPg({ connectionString: DB_URL });
const prisma = new PrismaClient({ adapter });

// ─── Multer setup ─────────────────────────────────────────────
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/webp", "image/gif",
      "application/pdf",
      "application/zip", "application/x-zip-compressed",
      "video/mp4",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

const BACKEND_URL = process.env["BACKEND_URL"] ?? "http://localhost:3000";

// ─── Helper ────────────────────────────────────────────────────
function fileUrl(filename: string) {
  return `${BACKEND_URL}/uploads/${filename}`;
}

// ─── GET /api/listings ─────────────────────────────────────────
// Query params: q, type (ONLINE|OFFLINE), category, page, limit
router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      q = "",
      type,
      category,
      page = "1",
      limit = "20",
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (q.trim()) {
      where["OR"] = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
      ];
    }

    if (type === "ONLINE" || type === "OFFLINE") where["type"] = type;
    if (category) where["category"] = { equals: category, mode: "insensitive" };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          seller: { select: { id: true, name: true, reputation: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    res.json({
      listings,
      meta: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/listings/my ──────────────────────────────────────
router.get("/my", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    const listings = await prisma.listing.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/listings/:id ────────────────────────────────────
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: req.params["id"] },
      include: {
        seller: { select: { id: true, name: true, reputation: true, email: true } },
      },
    });
    if (!listing) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/listings ────────────────────────────────────────
router.post(
  "/",
  requireAuth,
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "file", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = req.authUser?.userId;
      const {
        title, description, price, type, category,
        subject, semester, condition, isFree,
      } = req.body as Record<string, string>;

      if (!title || !description || !type || !category) {
        res.status(400).json({ error: "title, description, type, and category are required" });
        return;
      }

      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const imageUrls: string[] = (files?.["images"] ?? []).map((f) => fileUrl(f.filename));
      const fileUrlValue = files?.["file"]?.[0] ? fileUrl(files["file"][0].filename) : null;

      const listing = await prisma.listing.create({
        data: {
          title,
          description,
          price: parseFloat(price ?? "0") || 0,
          type: type as "ONLINE" | "OFFLINE",
          category,
          subject: subject || null,
          semester: semester ? parseInt(semester, 10) : null,
          condition: condition || null,
          isFree: isFree === "true" || parseFloat(price ?? "0") === 0,
          images: imageUrls,
          fileUrl: fileUrlValue,
          sellerId: userId!,
        },
        include: {
          seller: { select: { id: true, name: true, reputation: true } },
        },
      });

      res.status(201).json({ listing });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// ─── PATCH /api/listings/:id ───────────────────────────────────
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    const existing = await prisma.listing.findUnique({ where: { id: req.params["id"] } });
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.sellerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    const { title, description, price, status, isFree } = req.body as Record<string, string>;
    const listing = await prisma.listing.update({
      where: { id: req.params["id"] },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(status && { status: status as "ACTIVE" | "SOLD" | "HIDDEN" }),
        ...(isFree !== undefined && { isFree: isFree === "true" }),
      },
    });
    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── DELETE /api/listings/:id (soft-delete: set status=HIDDEN) ─
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    const existing = await prisma.listing.findUnique({ where: { id: req.params["id"] } });
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.sellerId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }

    await prisma.listing.update({ where: { id: req.params["id"] }, data: { status: "HIDDEN" } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
