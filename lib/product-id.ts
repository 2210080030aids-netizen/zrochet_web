import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ColorVariant } from "@/lib/types";

function toJsonValue(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

type Tx = Prisma.TransactionClient;

/** Per-collection product ID prefix (e.g. mini-bags → mb1, mb2). */
export const CATEGORY_ID_PREFIX: Record<string, string> = {
  "mini-bags": "mb",
  "party-bags": "pb",
  "oreo-bags": "ob",
  "side-bags": "sb",
  "handle-bags": "hb",
};

export function normalizeProductId(productId: string): string {
  return productId.trim().toLowerCase();
}

export function getCategoryIdPrefix(categorySlug: string): string {
  const known = CATEGORY_ID_PREFIX[categorySlug];
  if (known) return known;

  // Auto-prefix for new collections: "summer-bags" → "sb", "clutches" → "cl"
  const parts = categorySlug
    .toLowerCase()
    .split("-")
    .map((part) => part.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`;
  }

  const compact = parts[0] || categorySlug.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (compact.length >= 2) return compact.slice(0, 2);
  if (compact.length === 1) return `${compact}x`;

  throw new Error(`No product ID prefix configured for collection: ${categorySlug}`);
}

export function formatProductId(categorySlug: string, sequence: number): string {
  return `${getCategoryIdPrefix(categorySlug)}${sequence}`;
}

/** Numeric suffix from ids like mb3, MB3, or legacy B3. */
export function parseProductIdSuffix(productId: string, categorySlug?: string): number | null {
  const normalized = normalizeProductId(productId);

  if (categorySlug) {
    const prefix = getCategoryIdPrefix(categorySlug);
    if (normalized.startsWith(prefix)) {
      const num = Number.parseInt(normalized.slice(prefix.length), 10);
      return Number.isFinite(num) && num > 0 ? num : null;
    }
  }

  const prefixed = normalized.match(/^[a-z]+(\d+)$/);
  if (prefixed) {
    const num = Number.parseInt(prefixed[1], 10);
    return Number.isFinite(num) && num > 0 ? num : null;
  }

  const legacy = normalized.match(/^b(\d+)$/);
  if (legacy) {
    const num = Number.parseInt(legacy[1], 10);
    return Number.isFinite(num) && num > 0 ? num : null;
  }

  return null;
}

export function sortProductIds(productIds: string[], categorySlug: string): string[] {
  return [...productIds].sort((a, b) => {
    const sa = parseProductIdSuffix(a, categorySlug) ?? Number.MAX_SAFE_INTEGER;
    const sb = parseProductIdSuffix(b, categorySlug) ?? Number.MAX_SAFE_INTEGER;
    if (sa !== sb) return sa - sb;
    return normalizeProductId(a).localeCompare(normalizeProductId(b));
  });
}

async function findProductInCategory(
  tx: Tx,
  categorySlug: string,
  productId: string
) {
  const target = normalizeProductId(productId);
  const products = await tx.product.findMany({
    where: { categorySlug },
    include: { reviews: true },
  });
  return products.find((product) => normalizeProductId(product.productId) === target) ?? null;
}

async function productIdExistsInCategory(
  tx: Tx,
  categorySlug: string,
  productId: string
): Promise<boolean> {
  const target = normalizeProductId(productId);
  const products = await tx.product.findMany({
    where: { categorySlug },
    select: { productId: true },
  });
  return products.some((product) => normalizeProductId(product.productId) === target);
}

function parseColorVariants(value: unknown): ColorVariant[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ColorVariant =>
      Boolean(item) &&
      typeof item === "object" &&
      "name" in item &&
      "swatch" in item &&
      "productId" in item
  );
}

function remapColorVariantsJson(
  value: unknown,
  fromId: string,
  toId: string
): ColorVariant[] {
  const from = normalizeProductId(fromId);
  const to = normalizeProductId(toId);

  return parseColorVariants(value).map((variant) => ({
    name: variant.name,
    swatch: variant.swatch,
    productId:
      normalizeProductId(variant.productId) === from ? to : normalizeProductId(variant.productId),
  }));
}

async function remapColorVariantReferencesInCategory(
  tx: Tx,
  categorySlug: string,
  fromId: string,
  toId: string
): Promise<void> {
  const from = normalizeProductId(fromId);
  const to = normalizeProductId(toId);
  const products = await tx.product.findMany({
    where: { categorySlug },
    select: { productId: true, colorVariants: true },
  });

  await Promise.all(
    products.map((product) => {
      const variants = parseColorVariants(product.colorVariants);
      const needsUpdate = variants.some(
        (variant) => normalizeProductId(variant.productId) === from
      );
      if (!needsUpdate) return Promise.resolve();

      return tx.product.update({
        where: {
          categorySlug_productId: {
            categorySlug,
            productId: product.productId,
          },
        },
        data: {
          colorVariants: toJsonValue(remapColorVariantsJson(product.colorVariants, from, to)),
        },
      });
    })
  );
}

async function renameProductIdInCategory(
  tx: Tx,
  categorySlug: string,
  fromId: string,
  toId: string
): Promise<void> {
  const from = normalizeProductId(fromId);
  const to = normalizeProductId(toId);
  if (from === to) return;

  const existing = await findProductInCategory(tx, categorySlug, fromId);
  if (!existing) return;

  if (await productIdExistsInCategory(tx, categorySlug, to)) {
    throw new Error(`Cannot rename ${from} to ${to}: target already exists`);
  }

  const storedFromId = existing.productId;
  const { reviews: _reviews, ...productData } = existing;

  await tx.product.create({
    data: {
      productId: to,
      categorySlug: productData.categorySlug,
      name: productData.name,
      price: productData.price,
      originalPrice: productData.originalPrice,
      discountPercent: productData.discountPercent,
      currency: productData.currency,
      description: productData.description,
      material: productData.material,
      dimensions: productData.dimensions,
      care: productData.care,
      colors: toJsonValue(productData.colors),
      colorVariants: toJsonValue(remapColorVariantsJson(productData.colorVariants, from, to)),
      sizes: toJsonValue(productData.sizes),
      rating: productData.rating,
      reviewCount: productData.reviewCount,
      quantity: productData.quantity,
      inStock: productData.inStock,
      deliveryDays: productData.deliveryDays,
      media: toJsonValue(productData.media),
    },
  });

  if (existing.reviews.length) {
    await tx.productReview.updateMany({
      where: { categorySlug, productId: storedFromId },
      data: { productId: to },
    });
  }

  await tx.product.delete({
    where: { categorySlug_productId: { categorySlug, productId: storedFromId } },
  });

  await remapColorVariantReferencesInCategory(tx, categorySlug, from, to);
}

export async function resolveStoredProductId(
  categorySlug: string,
  productId: string
): Promise<string | null> {
  const target = normalizeProductId(productId);
  const products = await prisma.product.findMany({
    where: { categorySlug },
    select: { productId: true },
  });
  return (
    products.find((product) => normalizeProductId(product.productId) === target)?.productId ??
    null
  );
}

export async function allocateNextProductId(
  categorySlug: string,
  tx?: Tx
): Promise<string> {
  const db = tx ?? prisma;
  const products = await db.product.findMany({
    where: { categorySlug },
    select: { productId: true },
  });

  if (!products.length) {
    return formatProductId(categorySlug, 1);
  }

  const sorted = sortProductIds(
    products.map((product) => product.productId),
    categorySlug
  );
  const lastSuffix = parseProductIdSuffix(sorted[sorted.length - 1], categorySlug) ?? sorted.length;
  return formatProductId(categorySlug, lastSuffix + 1);
}

/** Close gaps after delete (e.g. mb1, mb3 → mb1, mb2). */
export async function renumberProductsAfterDelete(categorySlug: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { categorySlug },
      select: { productId: true },
    });
    if (!products.length) return;

    const sorted = sortProductIds(
      products.map((product) => product.productId),
      categorySlug
    );

    const renames: { from: string; to: string }[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const desired = formatProductId(categorySlug, i + 1);
      const storedId = sorted[i];
      if (normalizeProductId(storedId) !== desired) {
        renames.push({ from: storedId, to: desired });
      }
    }

    renames.sort((a, b) => {
      const sa = parseProductIdSuffix(a.from, categorySlug) ?? 0;
      const sb = parseProductIdSuffix(b.from, categorySlug) ?? 0;
      return sb - sa;
    });

    for (const { from, to } of renames) {
      await renameProductIdInCategory(tx, categorySlug, from, to);
    }
  });
}

/** One-time migration from legacy B1-style ids to prefixed ids per collection. */
export async function migrateLegacyProductIds(): Promise<void> {
  const collections = await prisma.collection.findMany({ select: { slug: true } });

  for (const { slug } of collections) {
    try {
      getCategoryIdPrefix(slug);
    } catch {
      continue;
    }

    const products = await prisma.product.findMany({
      where: { categorySlug: slug },
      select: { productId: true },
    });
    if (!products.length) continue;

    const sorted = sortProductIds(
      products.map((product) => product.productId),
      slug
    );

    const renames: { from: string; to: string }[] = [];
    for (let i = 0; i < sorted.length; i++) {
      const desired = formatProductId(slug, i + 1);
      const storedId = sorted[i];
      if (normalizeProductId(storedId) !== desired) {
        renames.push({ from: storedId, to: desired });
      }
    }

    renames.sort((a, b) => {
      const sa = parseProductIdSuffix(a.from, slug) ?? 0;
      const sb = parseProductIdSuffix(b.from, slug) ?? 0;
      return sb - sa;
    });

    for (const { from, to } of renames) {
      await prisma.$transaction(async (tx) => {
        await renameProductIdInCategory(tx, slug, from, to);
      });
    }
  }
}
