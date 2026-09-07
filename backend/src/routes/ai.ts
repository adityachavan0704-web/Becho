// src/routes/ai.ts — AI chat and listing generation endpoints

import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { handleChatMessage, generateListingContent } from "../ai/agent";
import { isGeminiAvailable } from "../ai/gemini";

const router = Router();

// ─── GET /api/ai/status ───────────────────────────────────────
// Health check for AI feature availability
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    available: isGeminiAvailable(),
    model: "gemini-2.0-flash",
  });
});

// ─── POST /api/ai/chat ────────────────────────────────────────
// Main AI chat endpoint
router.post("/chat", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { message } = req.body as { message?: string };
    if (!message?.trim()) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    // Sanitize input
    const sanitizedMessage = message.trim().slice(0, 1000);

    const result = await handleChatMessage(userId, sanitizedMessage);

    res.json({
      response: result.message,
      products: result.products ?? null,
      comparison: result.comparison ?? null,
    });
  } catch (err) {
    console.error("[ai/chat]", err);
    res.status(500).json({ error: "AI service error. Please try again." });
  }
});

// ─── POST /api/ai/generate-listing ────────────────────────────
// Generate listing content (title, description, category, tags)
router.post("/generate-listing", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { name, condition, details } = req.body as {
      name?: string;
      condition?: string;
      details?: string;
    };

    if (!name?.trim()) {
      res.status(400).json({ error: "name is required" });
      return;
    }

    const result = await generateListingContent(
      name.trim().slice(0, 200),
      (condition ?? "").trim().slice(0, 50),
      (details ?? "").trim().slice(0, 500),
    );

    res.json({ listing: result });
  } catch (err) {
    console.error("[ai/generate-listing]", err);
    const message = err instanceof Error ? err.message : "AI service error";
    res.status(500).json({ error: message });
  }
});

export default router;
