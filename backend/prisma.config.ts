// prisma.config.ts — Prisma 7 configuration
// The datasource.url here is used by the Prisma CLI (migrate, db push, studio).
// For Supabase: use DIRECT_URL (port 5432) for migrations — NOT the pooler.
// The running app (PrismaClient) uses DATABASE_URL (port 6543, transaction pooler).

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use direct connection for migrations (bypasses pgBouncer)
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
