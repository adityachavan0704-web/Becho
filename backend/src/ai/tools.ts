// src/ai/tools.ts — Backend tool functions for the Becho AI Agent
// These query the database using the existing Prisma client.
// They mirror the logic in routes/listings.ts but are callable internally.

import { prisma } from "../db";

// ─── Types ─────────────────────────────────────────────────────

export interface ProductResult {
  id: string;
  title: string;
  description: string;
  price: number;
  type: "ONLINE" | "OFFLINE";
  category: string;
  subject: string | null;
  semester: number | null;
  condition: string | null;
  isFree: boolean;
  images: string[];
  seller: { id: string; name: string; reputation: number };
  createdAt: Date;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  type?: "ONLINE" | "OFFLINE";
  maxPrice?: number;
  minPrice?: number;
  isFree?: boolean;
}

export interface ComparisonResult {
  product1: ProductResult;
  product2: ProductResult;
}

const LISTING_INCLUDE = {
  seller: { select: { id: true, name: true, reputation: true } },
} as const;

// ─── searchProducts ────────────────────────────────────────────
// Mirrors GET /api/listings query logic

export async function searchProducts(filters: SearchFilters): Promise<ProductResult[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { status: "ACTIVE" };

  if (filters.q?.trim()) {
    where["OR"] = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
      { category: { contains: filters.q, mode: "insensitive" } },
      { subject: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.type === "ONLINE" || filters.type === "OFFLINE") {
    where["type"] = filters.type;
  }

  if (filters.category) {
    where["category"] = { equals: filters.category, mode: "insensitive" };
  }

  if (filters.isFree === true) {
    where["isFree"] = true;
  }

  if (filters.maxPrice !== undefined || filters.minPrice !== undefined) {
    where["price"] = {};
    if (filters.maxPrice !== undefined) where["price"]["lte"] = filters.maxPrice;
    if (filters.minPrice !== undefined) where["price"]["gte"] = filters.minPrice;
  }

  const listings = await prisma.listing.findMany({
    where,
    take: 10,
    orderBy: { createdAt: "desc" },
    include: LISTING_INCLUDE,
  });

  return listings as unknown as ProductResult[];
}

// ─── getProductDetails ─────────────────────────────────────────

export async function getProductDetails(productId: string): Promise<ProductResult | null> {
  const listing = await prisma.listing.findUnique({
    where: { id: productId },
    include: LISTING_INCLUDE,
  });

  return listing as unknown as ProductResult | null;
}

// ─── compareProducts ───────────────────────────────────────────

export async function compareProducts(
  productId1: string,
  productId2: string,
): Promise<ComparisonResult | null> {
  const [p1, p2] = await Promise.all([
    getProductDetails(productId1),
    getProductDetails(productId2),
  ]);

  if (!p1 || !p2) return null;
  return { product1: p1, product2: p2 };
}

// ─── findProductsByBudget ──────────────────────────────────────

export async function findProductsByBudget(
  maxPrice: number,
  category?: string,
  type?: "ONLINE" | "OFFLINE",
): Promise<ProductResult[]> {
  return searchProducts({ maxPrice, category, type });
}

// ─── getSimilarProducts ────────────────────────────────────────
// Mirrors GET /api/listings/:id/similar

export async function getSimilarProducts(productId: string): Promise<ProductResult[]> {
  const listing = await prisma.listing.findUnique({ where: { id: productId } });
  if (!listing) return [];

  const similar = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      id: { not: listing.id },
      OR: [
        { category: { equals: listing.category, mode: "insensitive" } },
        { type: listing.type },
      ],
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: LISTING_INCLUDE,
  });

  return similar as unknown as ProductResult[];
}
