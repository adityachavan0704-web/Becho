import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Prisma 7 requires an explicit driver adapter.
// The prisma dev server exposes a direct postgres URL on port 51214.
const DB_URL =
  process.env["DIRECT_DATABASE_URL"] ??
  "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0";

const adapter = new PrismaPg({ connectionString: DB_URL });
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env["JWT_SECRET"] ?? "fallback_secret";
const FRONTEND_URL = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

// ─────────────────────────────────────────────
// Passport Google OAuth Strategy
// ─────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env["GOOGLE_CLIENT_ID"] ?? "",
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
      callbackURL: "/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0]?.value ?? `${profile.id}@google-oauth.fake`;
        const name = profile.displayName ?? "Google User";

        // Find existing user by googleId or email
        let user = await prisma.user.findFirst({
          where: { OR: [{ googleId: profile.id }, { email }] },
        });

        if (user) {
          // Link googleId if not already linked
          if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, isVerified: true },
            });
          }
        } else {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              name,
              googleId: profile.id,
              isVerified: true,
            },
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
// Helper: sign JWT
// ─────────────────────────────────────────────
function signToken(userId: string, email: string, role: string): string {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: "30d" });
}

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
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

  const token = signToken(user.id, user.email, user.role);
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
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

  const token = signToken(user.id, user.email, user.role);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// ─────────────────────────────────────────────
// GET /api/auth/google  — redirect to Google
// ─────────────────────────────────────────────
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// ─────────────────────────────────────────────
// GET /api/auth/google/callback  — Google redirects here
// ─────────────────────────────────────────────
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` }),
  (req: Request, res: Response) => {
    const user = req.user as { id: string; email: string; role: string } | undefined;
    if (!user) {
      res.redirect(`${FRONTEND_URL}/login?error=google_failed`);
      return;
    }
    const token = signToken(user.id, user.email, user.role);
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// ─────────────────────────────────────────────
// GET /api/auth/me  — get current user
// ─────────────────────────────────────────────
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const userId = req.authUser?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, isVerified: true, reputation: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

export default router;
