// src/middleware/auth.ts — JWT authentication middleware

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthPayload;
    }
  }
}

// Fail loudly at module load — no silent fallback
const JWT_SECRET = (() => {
  const s = process.env["JWT_SECRET"];
  if (!s) {
    throw new Error(
      "JWT_SECRET is not set. Add it to backend/.env\n" +
      "  Generate one: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return s;
})();

export { JWT_SECRET };

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.authUser = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
