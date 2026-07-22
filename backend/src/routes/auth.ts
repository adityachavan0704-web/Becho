// src/routes/auth.ts — Authentication routes
// Covers: register, login, refresh, logout, Google OAuth, /me

import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import crypto from "crypto";
import { prisma } from "../db";
import { requireAuth, JWT_SECRET } from "../middleware/auth";

const router = Router();

// ─── Env validation ────────────────────────────────────────────
const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

// Warn (don't crash) if Google credentials are missing — OAuth just won't work
if (!process.env["GOOGLE_CLIENT_ID"] || !process.env["GOOGLE_CLIENT_SECRET"]) {
  console.warn(
    "⚠️  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google OAuth disabled"
  );
}

// ─── Token helpers ─────────────────────────────────────────────

/** Short-lived access token — 15 minutes */
function signAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "15m" });
}

/** Long-lived refresh token — random bytes, stored in DB */
async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
  return token;
}

function tokenResponse(userId: string, email: string, role: string) {
  return createRefreshToken(userId).then((refreshToken) => ({
    accessToken: signAccessToken(userId, email, role),
    refreshToken,
    expiresIn: 15 * 60, // seconds
  }));
}

// ─── Passport Google OAuth ─────────────────────────────────────

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"] ?? "disabled",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "disabled",
      callbackURL: `${process.env["BACKEND_URL"] ?? "http://localhost:3000"}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0]?.value ?? `${profile.id}@google-oauth.fake`;
        const name = profile.displayName ?? "Google User";

        let user = await prisma.user.findFirst({
          where: { OR: [{ googleId: profile.id }, { email }] },
        });

        if (user) {
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, isVerified: true },
            });
          }
        } else {
          user = await prisma.user.create({
            data: { email, name, googleId: profile.id, isVerified: true },
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body as {
      email?: string;
      password?: string;
      name?: string;
      role?: string;
    };

    if (!email || !password || !name) {
      res.status(400).json({ error: "email, password, and name are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: role === "SELLER" ? "SELLER" : "BUYER",
        isVerified: false,
      },
    });

    const tokens = await tokenResponse(user.id, user.email, user.role);
    res.status(201).json({
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("[register]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const tokens = await tokenResponse(user.id, user.email, user.role);
    res.json({
      ...tokens,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("[login]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/refresh  — exchange refresh token for new access token
// ─────────────────────────────────────────────
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res.status(400).json({ error: "refreshToken is required" });
      return;
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      res.status(401).json({ error: "Refresh token invalid or expired" });
      return;
    }

    const { user } = stored;
    const accessToken = signAccessToken(user.id, user.email, user.role);

    res.json({
      accessToken,
      expiresIn: 15 * 60,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("[refresh]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/logout  — invalidate refresh token
// ─────────────────────────────────────────────
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (refreshToken) {
      await prisma.refreshToken
        .delete({ where: { token: refreshToken } })
        .catch(() => {}); // ignore if already gone
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[logout]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/google  — initiate Google OAuth
// ─────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// ─────────────────────────────────────────────
// GET /api/auth/google/callback
// ─────────────────────────────────────────────
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/login?error=google_failed`,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as { id: string; email: string; role: string } | undefined;
      if (!user) {
        res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
        return;
      }
      const accessToken = signAccessToken(user.id, user.email, user.role);
      const refreshToken = await createRefreshToken(user.id);
      // Pass both tokens to the frontend callback page
      res.redirect(
        `${FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (err) {
      console.error("[google/callback]", err);
      res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
    }
  }
);

// ─────────────────────────────────────────────
// GET /api/auth/me  — current user from access token
// ─────────────────────────────────────────────
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.authUser?.userId;
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true,
        isVerified: true, reputation: true, createdAt: true,
      },
    });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    res.json({ user });
  } catch (err) {
    console.error("[me]", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
