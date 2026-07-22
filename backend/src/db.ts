// src/db.ts — Shared Prisma client singleton
// Uses @prisma/adapter-pg so the app can use Supabase's transaction pooler (port 6543).
// One Pool instance is shared across all routes to avoid connection exhaustion.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to backend/.env\n" +
    "  → Supabase: Settings → Database → Transaction pooler URL (port 6543)"
  );
}

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
