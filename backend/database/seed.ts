// database/seed.ts — Sample data for local testing
// Run: npx tsx database/seed.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) throw new Error("DATABASE_URL not set in .env");

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Users ────────────────────────────────────────────────────
  const buyerHash = await bcrypt.hash("password123", 12);
  const sellerHash = await bcrypt.hash("password123", 12);

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@vit.edu" },
    update: {},
    create: {
      email: "buyer@vit.edu",
      name: "Aditya Buyer",
      passwordHash: buyerHash,
      role: "BUYER",
      isVerified: true,
      reputation: 4.2,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@vit.edu" },
    update: {},
    create: {
      email: "seller@vit.edu",
      name: "Priya Seller",
      passwordHash: sellerHash,
      role: "SELLER",
      isVerified: true,
      reputation: 4.8,
    },
  });

  console.log(`✅ Users:   ${buyer.email}, ${seller.email}`);

  // ── Listings ─────────────────────────────────────────────────
  const listings = await Promise.all([
    prisma.listing.upsert({
      where: { id: "seed-listing-1" },
      update: {},
      create: {
        id: "seed-listing-1",
        title: "DBMS Complete Notes — Sem 4",
        description:
          "Comprehensive hand-written + typed notes covering all topics: ER diagrams, normalization, SQL, transactions, and indexing. Useful for VIT exams.",
        price: 49,
        type: "ONLINE",
        category: "Notes",
        subject: "Database Management Systems",
        semester: 4,
        isFree: false,
        images: [],
        sellerId: seller.id,
      },
    }),
    prisma.listing.upsert({
      where: { id: "seed-listing-2" },
      update: {},
      create: {
        id: "seed-listing-2",
        title: "Cycle — Hero Sprint 26\" (Good Condition)",
        description:
          "Used for 1.5 years, tyres recently changed. Minor scratches on frame but mechanically sound. Great for campus commutes.",
        price: 2800,
        type: "OFFLINE",
        category: "Cycles",
        condition: "Good",
        isFree: false,
        images: [],
        sellerId: seller.id,
      },
    }),
    prisma.listing.upsert({
      where: { id: "seed-listing-3" },
      update: {},
      create: {
        id: "seed-listing-3",
        title: "DSA in C++ — Free Cheat Sheet",
        description:
          "One-page cheat sheet covering time complexities, sorting algorithms, and common patterns for competitive programming.",
        price: 0,
        type: "ONLINE",
        category: "Notes",
        subject: "Data Structures & Algorithms",
        isFree: true,
        images: [],
        sellerId: seller.id,
      },
    }),
  ]);

  console.log(`✅ Listings: ${listings.map((l) => `"${l.title}"`).join(", ")}`);

  // ── Mentorship ───────────────────────────────────────────────
  const mentorship = await prisma.mentorship.upsert({
    where: { id: "seed-mentorship-1" },
    update: {},
    create: {
      id: "seed-mentorship-1",
      subject: "DSA & Competitive Programming",
      description:
        "I can help you crack DSA interviews and competitive programming contests. 2 years of CF rating 1600+.",
      hourlyRate: 150,
      tags: ["DSA", "C++", "Competitive Programming", "LeetCode"],
      mentorId: seller.id,
    },
  });

  console.log(`✅ Mentorship: "${mentorship.subject}"\n`);
  console.log("🎉 Seed complete!");
  console.log("\nTest credentials:");
  console.log("  Buyer:  buyer@vit.edu / password123");
  console.log("  Seller: seller@vit.edu / password123");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
