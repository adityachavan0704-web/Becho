# Becho Database — Setup Guide

## Stack
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma 7
- **Driver**: `@prisma/adapter-pg` + `pg` (no native SQLite compilation needed)

---

## Required Environment Variables

Add these to `backend/.env`:

```env
# Transaction pooler — used by the running app (port 6543)
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Direct connection — used by Prisma CLI for migrations only (port 5432)
DIRECT_URL="postgresql://postgres.xxxx:password@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
```

### Where to find these:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Settings** → **Database**
3. Scroll to **Connection strings**:
   - **Transaction pooler** (Mode: Transaction, Port 6543) → paste as `DATABASE_URL`
   - **Direct connection** (Port 5432) → paste as `DIRECT_URL`

---

## Running Migrations

> ⚠️ Run this **once** after setting up your Supabase project and pasting the URLs into `.env`.

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
1. Connect to Supabase using `DIRECT_URL`
2. Create all tables from `prisma/schema.prisma`
3. Generate the Prisma client

After migration, verify tables exist in Supabase: **Table Editor** → you should see `User`, `Listing`, `Mentorship`, `Message`, `RefreshToken`.

---

## Generating Prisma Client

If you modify `prisma/schema.prisma`, regenerate the client:

```bash
cd backend
npx prisma generate
```

---

## Seeding Sample Data

After running migrations:

```bash
cd backend
npx tsx database/seed.ts
```

Creates:
| Email | Password | Role |
|-------|----------|------|
| buyer@vit.edu | password123 | BUYER |
| seller@vit.edu | password123 | SELLER |

Also creates 3 sample listings and 1 mentorship post.

---

## Schema Overview

```
User ──────────────────────────────────────────
  id, email, passwordHash, googleId, name,
  role (BUYER|SELLER), isVerified, reputation

Listing ────────────────────────────────────────
  id, title, description, price, type (ONLINE|OFFLINE),
  category, subject, semester, condition, isFree,
  status (ACTIVE|SOLD|HIDDEN), images[], fileUrl
  → belongsTo User (sellerId)

Mentorship ─────────────────────────────────────
  id, subject, description, hourlyRate, tags[],
  isActive
  → belongsTo User (mentorId)

Message ────────────────────────────────────────
  id, content, senderId, receiverId, listingId?
  → belongsTo User (sender + receiver)
  → belongsTo Listing (optional)

RefreshToken ───────────────────────────────────
  id, token, userId, expiresAt
  → belongsTo User
```

---

## Adding a Migration Later

```bash
# After modifying schema.prisma:
npx prisma migrate dev --name describe_your_change
```

## Resetting the Database (⚠️ deletes all data)

```bash
npx prisma migrate reset
```
