import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { resolveDisplayReviewStats } from "@/lib/review-stats";

export interface StoredProductReview {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: Date;
}

function hasReviewDelegate(
  client: typeof prisma
): client is typeof prisma & {
  productReview: {
    findMany: (args: object) => Promise<StoredProductReview[]>;
    create: (args: object) => Promise<StoredProductReview>;
    aggregate: (args: object) => Promise<{
      _avg: { rating: number | null };
      _count: { rating: number };
    }>;
  };
} {
  return Boolean((client as { productReview?: unknown }).productReview);
}

export async function listProductReviews(
  categorySlug: string,
  productId: string
): Promise<StoredProductReview[]> {
  if (hasReviewDelegate(prisma)) {
    return prisma.productReview.findMany({
      where: { categorySlug, productId },
      orderBy: { createdAt: "desc" },
    });
  }

  return prisma.$queryRaw<StoredProductReview[]>`
    SELECT id, "authorName", rating, title, body, "createdAt"
    FROM "ProductReview"
    WHERE "categorySlug" = ${categorySlug} AND "productId" = ${productId}
    ORDER BY "createdAt" DESC
  `;
}

export async function createProductReview(data: {
  categorySlug: string;
  productId: string;
  authorName: string;
  title: string | null;
  body: string;
  rating: number;
}): Promise<StoredProductReview> {
  if (hasReviewDelegate(prisma)) {
    return prisma.productReview.create({ data });
  }

  const rows = await prisma.$queryRaw<StoredProductReview[]>`
    INSERT INTO "ProductReview" (
      id, "categorySlug", "productId", "authorName", rating, title, body, "createdAt"
    )
    VALUES (
      ${randomUUID()},
      ${data.categorySlug},
      ${data.productId},
      ${data.authorName},
      ${data.rating},
      ${data.title},
      ${data.body},
      NOW()
    )
    RETURNING id, "authorName", rating, title, body, "createdAt"
  `;

  const review = rows[0];
  if (!review) {
    throw new Error("Failed to create review");
  }
  return review;
}

export async function getProductReviewStats(categorySlug: string, productId: string) {
  if (hasReviewDelegate(prisma)) {
    return prisma.productReview.aggregate({
      where: { categorySlug, productId },
      _avg: { rating: true },
      _count: { rating: true },
    });
  }

  const rows = await prisma.$queryRaw<{ avgRating: number | null; reviewCount: bigint }[]>`
    SELECT AVG(rating)::float AS "avgRating", COUNT(*)::bigint AS "reviewCount"
    FROM "ProductReview"
    WHERE "categorySlug" = ${categorySlug} AND "productId" = ${productId}
  `;

  const stats = rows[0];
  return {
    _avg: { rating: stats?.avgRating ?? null },
    _count: { rating: Number(stats?.reviewCount ?? 0) },
  };
}

/** Persist display rating + count (live comments + sample comments) onto Product. */
export async function syncProductRatingFromReviews(
  categorySlug: string,
  productId: string
): Promise<{ rating: number; reviewCount: number }> {
  const reviews = await listProductReviews(categorySlug, productId);
  const stats = resolveDisplayReviewStats(
    productId,
    reviews.map((review) => review.rating)
  );

  await prisma.product.update({
    where: { categorySlug_productId: { categorySlug, productId } },
    data: { rating: stats.rating, reviewCount: stats.reviewCount },
  });

  return stats;
}
